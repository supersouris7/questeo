import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Me } from '@epicademie/shared';
import { createTestApp, sessionCookie, TEST_PASSWORD } from '../../testing/harness.ts';
import { accounts } from '../../db/schema.ts';

const SECRET = 'secret-fictif-de-test-0123456789abcdef';
const PORTAL = { recette: true, portalLogin: true, portalProxySecret: SECRET, trustProxy: 1 } as const;
let t: Awaited<ReturnType<typeof createTestApp>>;

beforeAll(async () => {
  t = await createTestApp({ config: PORTAL });
});
afterAll(() => t.close());
beforeEach(() => t.reset());

/** Requête telle que le proxy la transmet (avec son secret) ; une valeur `undefined` retire l'en-tête. */
const arrive = (headers: Record<string, string | undefined> = {}, remoteAddress = '127.0.0.1') => {
  const sent: Record<string, string | undefined> = { 'x-portal-secret': SECRET, ...headers };
  return t.app.http.inject({
    url: '/api/v1/auth/portail',
    headers: Object.fromEntries(Object.entries(sent).flatMap(([k, v]) => (v === undefined ? [] : [[k, v]]))),
    remoteAddress,
  });
};
const as = (email: string) => ({ 'remote-email': email, 'remote-name': 'Camille Fictive' });
const rowOf = async (email: string) =>
  (await t.database.db.select().from(accounts).where(eq(accounts.email, email)))[0];
const meOf = async (cookie: string) => (await t.as(cookie).inject('/api/v1/auth/me')).json<Me>();
const post = (cookie: string, url: string, payload?: object) =>
  t.as(cookie).inject({ method: 'POST', url: `/api/v1/auth/${url}`, ...(payload ? { payload } : {}) });
const choosePin = (cookie: string, payload: object = { pin: '4821' }) => post(cookie, 'parent/pin', payload);

describe('connexion par le portail', () => {
  it('1re visite : compte vérifié sans mot de passe, code parent à choisir ; ensuite : même compte', async () => {
    const first = await arrive(as('Camille@Portail.test'));
    expect(first.statusCode).toBe(302);
    expect(first.headers.location).toBe('/profils/nouveau');
    expect(first.headers['cache-control']).toBe('no-store');
    const me = await meOf(sessionCookie(first));
    expect(me).toMatchObject({
      account: { email: 'camille@portail.test' },
      parent: true,
      hasPin: false,
      needsPin: true,
      noPassword: true,
    });
    const row = await rowOf('camille@portail.test');
    expect(row).toMatchObject({ passwordHash: null, googleSub: null });
    expect(row?.emailVerifiedAt).not.toBeNull();
    expect(row?.portalLinkedAt).not.toBeNull();

    const again = await arrive(as('camille@portail.test'));
    expect(again.headers.location).toBe('/');
    expect((await meOf(sessionCookie(again))).family.id).toBe(me.family.id);
  });

  it('code parent choisi sans mot de passe, puis exigé pour se déconnecter ; le portail ne l’ouvre plus', async () => {
    const cookie = sessionCookie(await arrive(as('camille@portail.test')));
    const chosen = await choosePin(cookie);
    expect(chosen.statusCode).toBe(200);
    expect(chosen.json<Me>()).toMatchObject({ hasPin: true, noPassword: true });
    expect(chosen.json()).not.toHaveProperty('needsPin');
    // Un code existe : le changer sans secret est refusé.
    expect((await choosePin(cookie, { pin: '0000' })).statusCode).toBe(401);

    await post(cookie, 'parent/lock');
    expect((await post(cookie, 'logout')).statusCode).toBe(403);
    // Repasser par le portail ne contourne pas le code.
    const back = sessionCookie(await arrive(as('camille@portail.test')));
    expect(await meOf(back)).toMatchObject({ parent: false });
    expect((await post(back, 'logout')).statusCode).toBe(403);
    expect((await post(back, 'parent/pin/unlock', { pin: '4821' })).statusCode).toBeLessThan(300);
    expect((await post(back, 'logout')).statusCode).toBeLessThan(300);
  });

  it('compte sans code : déconnexion et choix du code refusés tant que l’Espace parent est fermé', async () => {
    const cookie = sessionCookie(await arrive(as('camille@portail.test')));
    await post(cookie, 'parent/lock');
    expect((await post(cookie, 'logout')).statusCode).toBe(403);
    expect((await choosePin(cookie)).statusCode).toBe(403);
    expect((await rowOf('camille@portail.test'))?.parentPinHash).toBeNull();
    // Nouveau passage par le portail : le code peut être choisi.
    expect((await choosePin(sessionCookie(await arrive(as('camille@portail.test'))))).statusCode).toBe(200);
  });

  it('compte existant à l’adresse vérifiée : relié, Espace parent fermé, mot de passe conservé', async () => {
    const { email, me } = t.family();
    const res = await arrive(as(email));
    expect(res.headers.location).toBe('/');
    const cookie = sessionCookie(res);
    const now = await meOf(cookie);
    expect(now).toMatchObject({ family: { id: me.family.id }, parent: false });
    expect(now.needsPin).toBeUndefined();
    expect(now.noPassword).toBeUndefined();
    expect((await rowOf(email))?.portalLinkedAt).not.toBeNull();
    expect((await choosePin(cookie)).statusCode).toBe(401);
    expect((await post(cookie, 'logout')).statusCode).toBe(403);
    expect((await post(cookie, 'login', { email, password: TEST_PASSWORD })).statusCode).toBe(200);
  });

  it('compte existant à l’adresse non vérifiée : refus avec message, rien n’est relié ni modifié', async () => {
    const { email } = t.family();
    await t.database.db.update(accounts).set({ emailVerifiedAt: null }).where(eq(accounts.email, email));
    const before = await rowOf(email);
    const res = await arrive(as(email));
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/connexion?erreur=portail-compte');
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(await rowOf(email)).toEqual(before);
    expect(before?.portalLinkedAt).toBeNull();
  });

  it('secret du proxy absent, faux ou répété : refus, ni compte ni session ; bon : accepté', async () => {
    const before = (await t.database.db.select().from(accounts)).length;
    for (const secret of [undefined, '', 'x'.repeat(SECRET.length), SECRET.slice(0, -1), `${SECRET}, ${SECRET}`]) {
      const res = await arrive({ ...as('camille@portail.test'), 'x-portal-secret': secret });
      expect(res.statusCode).toBe(404);
      expect(res.headers['set-cookie']).toBeUndefined();
    }
    expect(await t.database.db.select().from(accounts)).toHaveLength(before);
    expect((await arrive(as('camille@portail.test'))).statusCode).toBe(302);
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
    const strict = await createTestApp({ config: { ...PORTAL, authRateLimitMax: 2 } });
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
      headers: { ...as('camille@portail.test'), 'x-portal-secret': SECRET },
      remoteAddress: '127.0.0.1',
    });
    expect(res.statusCode).toBe(404);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await off.http.inject('/api/v1/auth/options')).json()).not.toHaveProperty('portalLogin');
    expect((await off.http.inject('/api/v1/auth/me')).json()).not.toHaveProperty('needsPin');
    await off.close();
  });
});
