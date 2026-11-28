import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Me } from '@epicademie/shared';
import { createTestApp, sessionCookie, TEST_PASSWORD } from '../../testing/harness.ts';
import { accounts } from '../../db/schema.ts';

let t: Awaited<ReturnType<typeof createTestApp>>;

beforeAll(async () => {
  t = await createTestApp({ config: { recette: true, portalLogin: true, trustProxy: 1 } });
});
afterAll(() => t.close());
beforeEach(() => t.reset());

const arrive = (headers: Record<string, string> = {}, remoteAddress = '127.0.0.1') =>
  t.app.http.inject({ url: '/api/v1/auth/portail', headers, remoteAddress });
const as = (email: string) => ({ 'remote-email': email, 'remote-name': 'Camille Fictive' });
const rowOf = async (email: string) =>
  (await t.database.db.select().from(accounts).where(eq(accounts.email, email)))[0];
const meOf = async (cookie: string) => (await t.as(cookie).inject('/api/v1/auth/me')).json<Me>();

describe('connexion par le portail', () => {
  it('1re visite : compte vérifié sans mot de passe, session, création du profil ; ensuite : même compte', async () => {
    const first = await arrive(as('Camille@Portail.test'));
    expect(first.statusCode).toBe(302);
    expect(first.headers.location).toBe('/profils/nouveau');
    expect(first.headers['cache-control']).toBe('no-store');
    const me = await meOf(sessionCookie(first));
    expect(me).toMatchObject({ account: { email: 'camille@portail.test' }, parent: true, freeSignOut: true });
    const row = await rowOf('camille@portail.test');
    expect(row).toMatchObject({ passwordHash: null, googleSub: null });
    expect(row?.emailVerifiedAt).not.toBeNull();
    expect(row?.portalLinkedAt).not.toBeNull();

    const again = await arrive(as('camille@portail.test'));
    expect(again.headers.location).toBe('/');
    expect((await meOf(sessionCookie(again))).family.id).toBe(me.family.id);
  });

  it('compte existant de même adresse : réutilisé, mot de passe et verrou de déconnexion conservés', async () => {
    const { email, me } = t.family();
    const res = await arrive(as(email));
    expect(res.headers.location).toBe('/');
    const cookie = sessionCookie(res);
    const now = await meOf(cookie);
    expect(now.family.id).toBe(me.family.id);
    expect(now.freeSignOut).toBeUndefined();
    expect((await rowOf(email))?.passwordHash).not.toBeNull();
    await t.as(cookie).inject({ method: 'POST', url: '/api/v1/auth/parent/lock' });
    expect((await t.as(cookie).inject({ method: 'POST', url: '/api/v1/auth/logout' })).statusCode).toBe(403);
    const login = await t.app.http.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: TEST_PASSWORD },
    });
    expect(login.statusCode).toBe(200);
  });

  it('compte jamais validé : relié, son mot de passe posé sans preuve est effacé', async () => {
    const { email } = t.family();
    await t.database.db.update(accounts).set({ emailVerifiedAt: null }).where(eq(accounts.email, email));
    expect((await arrive(as(email))).headers.location).toBe('/');
    expect(await rowOf(email)).toMatchObject({ passwordHash: null });
  });

  it('compte du portail, sans secret parent : la déconnexion aboutit même verrouillée', async () => {
    const cookie = sessionCookie(await arrive(as('camille@portail.test')));
    await t.as(cookie).inject({ method: 'POST', url: '/api/v1/auth/parent/lock' });
    expect((await t.as(cookie).inject({ method: 'POST', url: '/api/v1/auth/logout' })).statusCode).toBeLessThan(300);
    expect((await t.as(cookie).inject('/api/v1/auth/me')).statusCode).toBe(401);
  });

  it('en-tête absent, invalide ou répété : refus, ni compte ni session', async () => {
    const before = (await t.database.db.select().from(accounts)).length;
    for (const headers of [{}, as(''), as('pas-une-adresse'), as('a@portail.test, b@portail.test')]) {
      const res = await arrive(headers);
      expect(res.statusCode).toBe(404);
      expect(res.headers['set-cookie']).toBeUndefined();
    }
    expect(await t.database.db.select().from(accounts)).toHaveLength(before);
  });

  it('en-tête reçu hors du proxy (adresse publique, même avec X-Forwarded-For) : refus', async () => {
    const res = await arrive({ ...as('camille@portail.test'), 'x-forwarded-for': '127.0.0.1' }, '203.0.113.7');
    expect(res.statusCode).toBe(404);
    expect(await rowOf('camille@portail.test')).toBeUndefined();
    // Réseau privé des conteneurs : le proxy.
    expect((await arrive(as('camille@portail.test'), '::ffff:172.18.0.1')).statusCode).toBe(302);
  });

  it('le portail est annoncé au client ; limite de débit stricte', async () => {
    expect((await t.http.inject('/api/v1/auth/options')).json()).toMatchObject({ portalLogin: true });
    const strict = await createTestApp({
      config: { recette: true, portalLogin: true, trustProxy: 1, authRateLimitMax: 2 },
    });
    const hit = () => strict.app.http.inject({ url: '/api/v1/auth/portail' });
    await hit();
    await hit();
    expect((await hit()).statusCode).toBe(429);
    await strict.close();
  });

  it('réglage désactivé (défaut, production) : 404, rien d’annoncé, en-tête sans effet', async () => {
    const off = await createTestApp();
    const res = await off.app.http.inject({
      url: '/api/v1/auth/portail',
      headers: as('camille@portail.test'),
      remoteAddress: '127.0.0.1',
    });
    expect(res.statusCode).toBe(404);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await off.http.inject('/api/v1/auth/options')).json()).not.toHaveProperty('portalLogin');
    expect((await off.http.inject('/api/v1/auth/me')).json()).not.toHaveProperty('freeSignOut');
    await off.close();
  });
});
