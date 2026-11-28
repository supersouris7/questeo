import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { REALTIME_REFUSALS, type Profile } from '@epicademie/shared';
import { createTestApp, profileInput } from '../../testing/harness.ts';
import { startRealtime } from '../../realtime.ts';

/** Journaux de l'application, pour vérifier qu'aucune adresse ni aucun code n'y entre. */
const logs: string[] = [];
const IP = '203.0.113.77';

let t: Awaited<ReturnType<typeof createTestApp>>;
let realtime: ReturnType<typeof startRealtime>;
let url: string;
const sockets: Socket[] = [];

const once = <T>(s: Socket, event: string) => new Promise<T>((resolve) => s.once(event, resolve));
const refusal = (s: Socket) => once<Error>(s, 'connect_error').then((e) => e.message);
const settle = () => new Promise((r) => setTimeout(r, 150));

function open(auth: object, headers: Record<string, string> = {}) {
  const s = connect(url, {
    auth: auth as Record<string, unknown>,
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    extraHeaders: headers,
  });
  sockets.push(s);
  return s;
}
const guest = (code: string, token?: string, ip = IP) => open({ guest: { code, token } }, { 'x-forwarded-for': ip });

async function join(code: string) {
  const s = guest(code);
  const joined = await once<{ seatId: string; token: string }>(s, 'quiz:joined');
  return { s, ...joined };
}

function openRoom() {
  const room = realtime.rooms.open(t.family().me.family.id, 'tv');
  if (!room) throw new Error('salle non ouverte');
  return room.code;
}

beforeAll(async () => {
  // Remplacée avant la création du journal : il écrit alors par cette fonction.
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    logs.push(String(chunk));
    return true;
  });
  t = await createTestApp({ config: { logLevel: 'trace', trustProxy: 1 } });
  realtime = startRealtime(t.app, null, 1);
  await t.raw.listen({ port: 0, host: '127.0.0.1' });
  url = `http://127.0.0.1:${(t.raw.server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  await realtime.close();
  await t.close();
  vi.restoreAllMocks();
});
beforeEach(() => t.reset());
afterEach(async () => {
  for (const s of sockets.splice(0)) s.disconnect();
  await settle();
  realtime.rooms.dispose();
});
const failures = async () =>
  Number(/epicademie_room_code_failures_total\{[^}]*\} (\d+)/.exec(await t.app.metrics.registry.metrics())?.[1] ?? 0);

describe('invités sans compte', () => {
  it('rejoint sans cookie, reçoit sa place et son jeton, sans rien écrire en base', async () => {
    const code = openRoom();
    const { seatId, token } = await join(code);
    expect(token).toEqual(expect.any(String));
    expect(realtime.rooms.get(code)?.seats).toMatchObject([{ seatId, token }]);
    expect((await t.http.inject('/api/v1/profiles')).json()).toEqual([]);
    expect(await t.app.metrics.registry.metrics()).toMatch(/epicademie_open_rooms\{[^}]*\} 1/);
  });

  it('salle verrouillée ou code inconnu : même refus', async () => {
    const code = openRoom();
    realtime.rooms.start(code);
    expect(await refusal(guest(code))).toBe(REALTIME_REFUSALS.roomUnavailable);
    expect(await refusal(guest('ZZZZZ'))).toBe(REALTIME_REFUSALS.roomUnavailable);
  });

  it('jeton : même place après une coupure, l’ancienne connexion est fermée', async () => {
    const code = openRoom();
    const first = await join(code);
    realtime.rooms.start(code);
    const replaced = once(first.s, 'replaced');
    const second = guest(code, first.token);
    expect(await once(second, 'quiz:joined')).toMatchObject({ seatId: first.seatId });
    await replaced;
    await settle();
    expect(first.s.connected).toBe(false);
    const [seat, ...others] = realtime.rooms.get(code)?.seats ?? [];
    expect(others).toEqual([]);
    expect(seat?.seatId).toBe(first.seatId);
    expect(seat?.connectionId).toBeTypeOf('string');
  });

  it('`chat` ou `arena:create` d’un invité : aucun effet, aucune présence', async () => {
    const lea = (
      await t.http.inject({ method: 'POST', url: '/api/v1/profiles', payload: profileInput('Léa') })
    ).json<Profile>();
    const player = open({ profileId: lea.id }, { cookie: t.family().cookie });
    await once(player, 'presence');
    const received: string[] = [];
    player.onAny((event: string) => received.push(event));
    const g = await join(openRoom());
    const seenByGuest: string[] = [];
    g.s.onAny((event: string) => seenByGuest.push(event));
    g.s.emit('chat', { to: lea.id, payload: { kind: 'preset', index: 0 } });
    g.s.emit('arena:create', { chapterId: 'm5-calcul', invite: [lea.id] });
    for (const event of ['arena:start', 'arena:leave', 'quiz:start', 'quiz:close']) g.s.emit(event);
    await settle();
    expect(received).toEqual([]);
    expect(seenByGuest).toEqual([]);
    expect(g.s.connected).toBe(true);
    expect(t.app.presence.allIds()).toEqual([lea.id]);
  });

  it('retrait ou fermeture : les manettes sont prévenues et déconnectées, l’écran de la famille aussi', async () => {
    const code = openRoom();
    const tv = open({ tv: true }, { cookie: t.family().cookie });
    await once(tv, 'connect');
    const a = await join(code);
    const b = await join(code);
    const kicked = once(a.s, 'quiz:closed');
    realtime.rooms.kick(code, a.seatId);
    expect(await kicked).toBe('kicked');
    const [onGuest, onTv] = [once(b.s, 'quiz:closed'), once(tv, 'quiz:closed')];
    realtime.rooms.close(code);
    expect([await onGuest, await onTv]).toEqual(['host', 'host']);
    await settle();
    expect([a.s.connected, b.s.connected]).toEqual([false, false]);
    expect(realtime.rooms.stats()).toMatchObject({ rooms: 0, seats: 0, tokens: 0 });
  });

  it('11e code faux refusé, par adresse lue derrière le proxy ; adresse absente des journaux', async () => {
    const code = openRoom();
    const before = await failures();
    for (let i = 0; i < 10; i++) expect(await refusal(guest('ZZZ'))).toBe(REALTIME_REFUSALS.roomUnavailable);
    expect(await refusal(guest('ZZZ'))).toBe(REALTIME_REFUSALS.tooManyAttempts);
    // Un en-tête forgé par le client (avant celui du proxy) ne change pas son adresse comptée.
    expect(await refusal(guest(code, undefined, `198.51.100.9, ${IP}`))).toBe(REALTIME_REFUSALS.tooManyAttempts);
    // Un autre téléphone, derrière le même proxy, n'est pas bloqué.
    await once(guest(code, undefined, '198.51.100.10'), 'quiz:joined');
    expect((await failures()) - before).toBe(10);
    // Les journaux fonctionnent (requête HTTP tracée), sans l'adresse des invités.
    await t.http.inject('/api/health');
    expect(logs.join('')).toContain('/api/health');
    expect(logs.join('')).not.toContain(IP);
    expect(logs.join('')).not.toContain(code);
  });
});
