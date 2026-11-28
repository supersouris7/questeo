import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { fmt, generate } from '@epicademie/content';
import type { ArenaInvite, ArenaView, ChatMessage, OnlinePlayer, Profile } from '@epicademie/shared';
import { createTestApp, profileInput } from '../../testing/harness.ts';
import { startRealtime } from '../../realtime.ts';

let t: Awaited<ReturnType<typeof createTestApp>>;
let realtime: ReturnType<typeof startRealtime>;
let url: string;
const sockets: Socket[] = [];

const once = <T>(s: Socket, event: string, pred: (v: T) => boolean = () => true) =>
  new Promise<T>((resolve) => {
    const h = (v: T) => {
      if (!pred(v)) return;
      s.off(event, h);
      resolve(v);
    };
    s.on(event, h);
  });

/** Message du refus de connexion (profil inconnu, déjà connecté…). */
const refusal = (s: Socket) => new Promise<string>((resolve) => s.on('connect_error', (e) => resolve(e.message)));

async function profile(name: string): Promise<Profile> {
  const res = await t.http.inject({ method: 'POST', url: '/api/v1/profiles', payload: profileInput(name) });
  return res.json<Profile>();
}
/** Connexion temps réel d'un appareil de la famille de test (cookie de session). */
function join(profileId: string, cookie = t.family().cookie) {
  const s = connect(url, { auth: { profileId }, transports: ['websocket'], forceNew: true, extraHeaders: { cookie } });
  sockets.push(s);
  return s;
}

beforeAll(async () => {
  t = await createTestApp();
  realtime = startRealtime(t.app, null, 0);
  await t.raw.listen({ port: 0, host: '127.0.0.1' });
  url = `http://127.0.0.1:${(t.raw.server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  await realtime.close();
  await t.close();
});
beforeEach(() => t.reset());
afterEach(async () => {
  for (const s of sockets.splice(0)) s.disconnect();
  // Laisse le serveur traiter les déconnexions (présence vidée).
  await new Promise((r) => setTimeout(r, 50));
});

describe('temps réel', () => {
  it('plusieurs joueurs en même temps ; un 2e appareil prend la main sur le même profil', async () => {
    const lea = await profile('Léa');
    const tom = await profile('Tom');
    const a = join(lea.id);
    await once<OnlinePlayer[]>(a, 'presence', (l) => l.some((p) => p.id === lea.id));
    join(tom.id);
    const list = await once<OnlinePlayer[]>(a, 'presence', (l) => l.length === 2);
    expect(list.map((p) => p.name).sort()).toEqual(['Léa', 'Tom']);
    const presence = (await t.http.inject('/api/v1/presence')).json<{ online: string[] }>();
    expect(presence.online.sort()).toEqual([lea.id, tom.id].sort());
    // Le même profil sur un 2e appareil (ou après une coupure) : l'ancien est prévenu et fermé,
    // le nouveau est connecté (plus de refus « déjà connecté »).
    const replaced = once<undefined>(a, 'replaced');
    const again = join(lea.id);
    const still = once<OnlinePlayer[]>(again, 'presence', (l) => l.length === 2);
    await replaced;
    expect((await still).map((p) => p.name).sort()).toEqual(['Léa', 'Tom']);
    expect(await refusal(join('00000000-0000-4000-8000-000000000000'))).toBe('Profil introuvable');
  });

  it('arène : connexion perdue puis reprise sur un autre appareil de la famille', async () => {
    const lea = await profile('Léa');
    const tom = await profile('Tom');
    const a = join(lea.id);
    const b = join(tom.id);
    await once<OnlinePlayer[]>(a, 'presence', (l) => l.length === 2);
    const invited = once<ArenaInvite>(b, 'arena:invite');
    a.emit('arena:create', { chapterId: 'm5-calcul', invite: [tom.id] });
    const inv = await invited;
    const ready = once<ArenaView>(a, 'arena', (v) => v.players.every((p) => p.ready));
    b.emit('arena:respond', { arenaId: inv.arenaId, accept: true });
    await ready;
    const playing = once<ArenaView>(a, 'arena', (v) => v.phase === 'playing');
    a.emit('arena:start');
    await playing;

    // Tom perd la connexion : Léa le voit « déconnecté », la partie continue.
    const away = once<ArenaView>(a, 'arena', (v) => v.players.some((p) => p.id === tom.id && p.away === true));
    b.disconnect();
    expect((await away).phase).toBe('playing');
    // Il revient sur une autre tablette : il retrouve la partie en cours.
    const again = join(tom.id);
    const resumed = await once<ArenaView>(again, 'arena');
    expect(resumed).toMatchObject({ id: inv.arenaId, phase: 'playing' });
    const back = await once<ArenaView>(a, 'arena', (v) => v.players.every((p) => !p.away));
    expect(back.phase).toBe('playing');
  });

  it('messages prédéfinis et emoji seulement', async () => {
    const lea = await profile('Léa');
    const tom = await profile('Tom');
    const a = join(lea.id);
    const b = join(tom.id);
    await once<OnlinePlayer[]>(a, 'presence', (l) => l.length === 2);
    const got = once<ChatMessage>(b, 'chat');
    a.emit('chat', { to: tom.id, payload: { kind: 'preset', index: 1 } });
    expect(await got).toMatchObject({ from: { name: 'Léa' }, text: 'Bien joué !' });
    const emoji = once<ChatMessage>(b, 'chat');
    a.emit('chat', { to: tom.id, payload: { kind: 'emoji', index: 0 } });
    expect((await emoji).text).toBe('👋');
  });

  it('arène : invitation, tour par tour, attaque et victoire', async () => {
    const lea = await profile('Léa');
    const tom = await profile('Tom');
    const a = join(lea.id);
    const b = join(tom.id);
    await once<OnlinePlayer[]>(a, 'presence', (l) => l.length === 2);
    const invited = once<ArenaInvite>(b, 'arena:invite');
    a.emit('arena:create', { chapterId: 'm5-calcul', invite: [tom.id] });
    const inv = await invited;
    expect(inv.from.name).toBe('Léa');
    const ready = once<ArenaView>(a, 'arena', (v) => v.players.every((p) => p.ready));
    b.emit('arena:respond', { arenaId: inv.arenaId, accept: true });
    await ready;
    let view = once<ArenaView>(a, 'arena', (v) => v.phase === 'playing');
    a.emit('arena:start');
    let v = await view;
    // Léa répond juste à chaque tour, Tom se trompe : Léa gagne.
    while (v.phase === 'playing') {
      const q = v.question;
      if (!q) throw new Error('pas de question');
      const turn = v.turn;
      const question = generate(q.skillId, q.level, q.seed);
      const mine = v.turnId === lea.id;
      const right =
        question.answer.kind === 'number'
          ? { kind: 'number', text: fmt(question.answer.value) }
          : question.answer.kind === 'choice'
            ? { kind: 'choice', index: question.answer.correct }
            : null;
      if (!right) throw new Error(`réponse ${question.answer.kind}`);
      const wrong =
        right.kind === 'number'
          ? { kind: 'number', text: '987654' }
          : { kind: 'choice', index: (right as { index: number }).index === 0 ? 1 : 0 };
      view = once<ArenaView>(a, 'arena', (x) => x.turn > turn);
      (mine ? a : b).emit('arena:answer', { response: mine ? right : wrong });
      v = await view;
    }
    expect(v.phase).toBe('over');
    expect(v.winnerId).toBe(lea.id);
  });

  it('ignore les messages invalides et limite le débit des messages', async () => {
    const lea = await profile('Léa');
    const tom = await profile('Tom');
    const a = join(lea.id);
    const b = join(tom.id);
    await once<OnlinePlayer[]>(a, 'presence', (l) => l.length === 2);
    const received: ChatMessage[] = [];
    b.on('chat', (m: ChatMessage) => received.push(m));
    // Texte libre ou index hors liste : ignorés sans couper la connexion.
    a.emit('chat', { to: tom.id, payload: { kind: 'texte', text: 'coucou' } });
    a.emit('chat', { to: tom.id, payload: { kind: 'preset', index: 999 } });
    for (let i = 0; i < 12; i++) a.emit('chat', { to: tom.id, payload: { kind: 'emoji', index: 1 } });
    await new Promise((r) => setTimeout(r, 300));
    expect(a.connected).toBe(true);
    expect(received.every((m) => m.text === '👍')).toBe(true);
    // 5 messages d'affilée au plus, messages invalides compris (2 invalides + 3 valides).
    expect(received.length).toBe(3);
  });

  it('refuse une page d’un autre site (origine différente)', async () => {
    const lea = await profile('Léa');
    const s = connect(url, {
      auth: { profileId: lea.id },
      transports: ['polling'],
      forceNew: true,
      extraHeaders: { origin: 'https://site-malveillant.example' },
    });
    sockets.push(s);
    const err = await new Promise<Error>((resolve) => s.on('connect_error', resolve));
    expect(err).toBeInstanceOf(Error);
    expect(s.connected).toBe(false);
  });

  describe('isolation des familles', () => {
    it('sans session, ou avec la session d’une autre famille : connexion refusée', async () => {
      const lea = await profile('Léa');
      expect(await refusal(join(lea.id, ''))).toBe('Profil introuvable');
      const other = await t.signup('voisins@famille.test');
      expect(await refusal(join(lea.id, other.cookie))).toBe('Profil introuvable');
    });

    it('chaque famille ne voit que ses joueurs ; ni message ni invitation vers une autre famille', async () => {
      const lea = await profile('Léa');
      const other = await t.signup('voisins@famille.test');
      const res = await t
        .as(other.cookie)
        .inject({ method: 'POST', url: '/api/v1/profiles', payload: profileInput('Zoé') });
      const zoe = res.json<Profile>();
      const a = join(lea.id);
      const z = join(zoe.id, other.cookie);
      const [seenByZoe, seenByLea] = await Promise.all([
        once<OnlinePlayer[]>(z, 'presence', (l) => l.some((p) => p.id === zoe.id)),
        once<OnlinePlayer[]>(a, 'presence', (l) => l.some((p) => p.id === lea.id)),
      ]);
      await new Promise((r) => setTimeout(r, 100));
      expect(seenByZoe.map((p) => p.name)).toEqual(['Zoé']);
      expect(seenByLea.map((p) => p.name)).toEqual(['Léa']);
      expect((await t.http.inject('/api/v1/presence')).json()).toEqual({ online: [lea.id] });

      const received: unknown[] = [];
      z.on('chat', (m: unknown) => received.push(m));
      z.on('arena:invite', (m: unknown) => received.push(m));
      a.emit('chat', { to: zoe.id, payload: { kind: 'preset', index: 1 } });
      a.emit('arena:create', { chapterId: 'm5-relatifs', invite: [zoe.id] });
      await new Promise((r) => setTimeout(r, 300));
      expect(received).toEqual([]);
    });
  });

  it('écran TV : voit le duel de sa famille, jamais celui d’une autre famille', async () => {
    const lea = await profile('Léa');
    const tom = await profile('Tom');
    const tvSocket = (cookie: string) => {
      const s = connect(url, {
        auth: { tv: true },
        transports: ['websocket'],
        forceNew: true,
        extraHeaders: { cookie },
      });
      sockets.push(s);
      return s;
    };
    const other = await t.signup('voisins-tv@famille.test');
    const tv = tvSocket(t.family().cookie);
    const strangerTv = tvSocket(other.cookie);
    await Promise.all([once(tv, 'connect'), once(strangerTv, 'connect')]);
    const seenByStranger: ArenaView[] = [];
    strangerTv.on('arena', (v: ArenaView) => seenByStranger.push(v));
    const a = join(lea.id);
    const b = join(tom.id);
    await once<OnlinePlayer[]>(a, 'presence', (l) => l.length === 2);
    a.emit('arena:create', { chapterId: 'm5-calcul', invite: [tom.id] });
    const invite = await once<ArenaInvite>(b, 'arena:invite');
    b.emit('arena:respond', { arenaId: invite.arenaId, accept: true });
    await once<ArenaView>(a, 'arena', (v) => v.players.every((p) => p.ready));
    a.emit('arena:start');
    const onTv = await once<ArenaView>(tv, 'arena', (v) => v.phase === 'playing');
    expect(onTv).toMatchObject({ phase: 'playing', players: [{ hearts: 3 }, { hearts: 3 }] });
    expect(onTv.question).not.toBeNull();
    // Un écran TV ne peut pas jouer, et une autre famille ne voit rien.
    tv.emit('arena:answer', { response: { kind: 'number', text: '1' } });
    await new Promise((r) => setTimeout(r, 100));
    expect(seenByStranger).toEqual([]);
    expect(await refusal(connect(url, { auth: { tv: true }, transports: ['websocket'], forceNew: true }))).toBe(
      'Profil introuvable',
    );
  });
});
