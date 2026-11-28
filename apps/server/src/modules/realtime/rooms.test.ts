import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CODE_ATTEMPT_WINDOW_MS,
  GUEST_PSEUDOS,
  MATCH_GRACE_MS,
  ROOM_CODE_ALPHABET,
  ROOM_HOST_GRACE_MS,
  ROOM_IDLE_TTL_MS,
  ROOM_LOBBY_TTL_MS,
  ROOM_MAX_TTL_MS,
  type Profile,
} from '@epicademie/shared';
import { systemRandom } from '../../core/random.ts';
import { createAttemptLimiter } from './attempt-limiter.ts';
import { createRooms, type EnterResult, type RoomsDeps } from './rooms.ts';

const IP = '203.0.113.7';
const EMPTY = { rooms: 0, seats: 0, tokens: 0, addresses: 0 };
const clock = { now: () => new Date() };
const made: ReturnType<typeof createRooms>[] = [];

function setup(deps: Partial<RoomsDeps> = {}) {
  const closed: string[] = [];
  const removed: string[] = [];
  const rooms = createRooms({
    clock,
    random: systemRandom,
    onClosed: (_room, reason) => closed.push(reason),
    onSeatRemoved: (_room, _seat, reason) => removed.push(reason),
    ...deps,
  });
  made.push(rooms);
  const open = (family = 'famille-a', host = 'tv') => {
    const room = rooms.open(family, host);
    if (!room) throw new Error('salle non ouverte');
    return room;
  };
  return { rooms, open, closed, removed };
}

const entered = (r: EnterResult) => {
  if (!r.ok) throw new Error(r.reason);
  return r;
};
/** Un code bien formé qui n'est celui d'aucune des salles données. */
const wrongCode = (...taken: string[]) =>
  Array.from(ROOM_CODE_ALPHABET, (l) => l.repeat(4)).find((c) => !taken.includes(c)) ?? '';
const profile = { id: 'p1', name: 'Léa', avatar: { style: 'portrait', seed: '03' }, grade: 'cm2' } as Profile;

beforeEach(() => vi.useFakeTimers({ now: new Date('2026-11-27T12:00:00Z') }));
afterEach(() => {
  for (const r of made.splice(0)) r.dispose();
  vi.useRealTimers();
});

describe('salles : codes', () => {
  it('4 lettres de l’alphabet', () => {
    const { open } = setup();
    for (let i = 0; i < 200; i++) {
      expect(open(`famille-${i}`).code).toMatch(new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`));
    }
  });

  it('jamais deux salles ouvertes avec le même code ; abandon si aucun n’est libre', () => {
    // Tirages : BBBB, puis encore BBBB (déjà pris), puis CCCC.
    const draws = [...Array<number>(8).fill(0), ...Array<number>(4).fill(1)];
    const { rooms, open } = setup({ random: { int: () => draws.shift() ?? 0 } });
    expect(open('famille-a').code).toBe('BBBB');
    expect(open('famille-b').code).toBe('CCCC');
    expect(rooms.open('famille-c', 'tv-c')).toBeNull();
    rooms.close('BBBB');
    expect(open('famille-c').code).toBe('BBBB');
  });

  it('une salle par famille : l’écran rechargé retrouve la sienne', () => {
    const { rooms, open } = setup();
    const first = open('famille-a', 'tv-1');
    expect(open('famille-a', 'tv-2').code).toBe(first.code);
    expect(rooms.stats().rooms).toBe(1);
  });

  it('saisie en minuscules acceptée', () => {
    const { rooms, open } = setup();
    const { code } = open();
    expect(rooms.joinGuest(IP, ` ${code.toLowerCase()} `).ok).toBe(true);
  });
});

describe('salles : places', () => {
  it('invité : pseudo proposé et unique, jeton de 32 octets, classe de repli', () => {
    const { rooms, open } = setup();
    const { code } = open();
    const seats = Array.from({ length: 8 }, () => entered(rooms.joinGuest(IP, code)).seat);
    expect(new Set(seats.map((s) => s.name)).size).toBe(8);
    for (const s of seats) {
      expect(GUEST_PSEUDOS).toContain(s.name);
      expect(Buffer.from(s.token ?? '', 'base64url')).toHaveLength(32);
      expect(s.grade).toBe('5e');
    }
    expect(new Set(seats.map((s) => s.token)).size).toBe(8);
  });

  it('salle pleine (8) ou verrouillée : refus', () => {
    const { rooms, open } = setup();
    const full = open('famille-a');
    for (let i = 0; i < 8; i++) entered(rooms.joinGuest(IP, full.code));
    expect(rooms.joinGuest(IP, full.code)).toEqual({ ok: false, reason: 'roomUnavailable' });
    expect(rooms.joinProfile(IP, full.code, { profile, familyId: 'famille-b' }).ok).toBe(false);
    const locked = open('famille-b');
    rooms.start(locked.code);
    expect(rooms.joinGuest(IP, locked.code)).toEqual({ ok: false, reason: 'roomUnavailable' });
    expect(rooms.get(locked.code)).toMatchObject({ locked: true, seats: [] });
  });

  it('jeton valide : même place dans les 30 s (même salle verrouillée), refusé après', () => {
    const { rooms, open, removed } = setup();
    const { code } = open();
    const { seat } = entered(rooms.joinGuest(IP, code));
    rooms.attach(code, seat.seatId, 'c1');
    rooms.start(code);
    rooms.disconnect(code, seat.seatId, 'c1');
    vi.advanceTimersByTime(MATCH_GRACE_MS - 1);
    const back = entered(rooms.joinGuest(IP, code, seat.token ?? ''));
    expect(back.seat.seatId).toBe(seat.seatId);
    rooms.attach(code, seat.seatId, 'c2');
    // La fermeture tardive de l'ancienne connexion ne compte plus.
    rooms.disconnect(code, seat.seatId, 'c1');
    vi.advanceTimersByTime(MATCH_GRACE_MS * 2);
    expect(rooms.get(code)?.seats).toHaveLength(1);
    rooms.disconnect(code, seat.seatId, 'c2');
    vi.advanceTimersByTime(MATCH_GRACE_MS);
    expect(removed).toEqual(['disconnected']);
    expect(rooms.joinGuest(IP, code, seat.token ?? '').ok).toBe(false);
    expect(rooms.stats()).toMatchObject({ seats: 0, tokens: 0 });
  });

  it('jeton d’une autre salle ou inconnu : aucune place créée', () => {
    const { rooms, open } = setup();
    const a = open('famille-a');
    const b = open('famille-b');
    const { seat } = entered(rooms.joinGuest(IP, a.code));
    expect(rooms.joinGuest(IP, b.code, seat.token ?? '').ok).toBe(false);
    expect(rooms.joinGuest(IP, a.code, 'faux').ok).toBe(false);
    expect(rooms.stats().seats).toBe(1);
  });

  it('place prise sans connexion : libérée après le délai', () => {
    const { rooms, open } = setup();
    const { code } = open();
    entered(rooms.joinGuest(IP, code));
    vi.advanceTimersByTime(MATCH_GRACE_MS);
    expect(rooms.get(code)?.seats).toEqual([]);
  });

  it('profil : son prénom et sa classe, une seule place, sans jeton', () => {
    const { rooms, open } = setup();
    const { code } = open();
    const player = { profile, familyId: 'famille-b' };
    const first = entered(rooms.joinProfile(IP, code, player)).seat;
    expect(first).toMatchObject({ name: 'Léa', grade: 'cm2', avatar: '03', token: null });
    rooms.start(code);
    expect(entered(rooms.joinProfile(IP, code, player)).seat.seatId).toBe(first.seatId);
    expect(rooms.stats()).toMatchObject({ seats: 1, tokens: 0 });
  });

  it('réglages au salon : pseudo retiré au sort, avatar, classe, équipe', () => {
    const { rooms, open } = setup();
    const { code } = open();
    const guest = entered(rooms.joinGuest(IP, code)).seat;
    const kid = entered(rooms.joinProfile(IP, code, { profile, familyId: 'famille-b' })).seat;
    const msg = { rerollPseudo: true, avatar: '07', grade: '3e', team: 'orange' } as const;
    rooms.setup(code, guest.seatId, msg);
    rooms.setup(code, kid.seatId, msg);
    const [g, k] = rooms.get(code)?.seats ?? [];
    expect(g).toMatchObject({ avatar: '07', grade: '3e', team: 'orange' });
    expect(g?.name).not.toBe(guest.name);
    expect(k).toMatchObject({ name: 'Léa', grade: 'cm2', avatar: '07', team: 'orange' });
    rooms.start(code);
    rooms.setup(code, guest.seatId, { avatar: '09' });
    expect(rooms.get(code)?.seats[0]?.avatar).toBe('07');
  });

  it('départ et retrait par l’hôte : la place et son jeton disparaissent', () => {
    const { rooms, open, removed } = setup();
    const { code } = open();
    const a = entered(rooms.joinGuest(IP, code)).seat;
    const b = entered(rooms.joinGuest(IP, code)).seat;
    rooms.leave(code, a.seatId);
    rooms.kick(code, b.seatId);
    expect(removed).toEqual(['left', 'kicked']);
    expect(rooms.stats()).toMatchObject({ seats: 0, tokens: 0 });
  });
});

describe('salles : codes faux', () => {
  it('11e code faux d’une même adresse refusé, de nouveau accepté après la fenêtre', () => {
    const onCodeFailure = vi.fn();
    const { rooms, open } = setup({ onCodeFailure });
    const { code } = open();
    for (let i = 0; i < 10; i++) {
      expect(rooms.joinGuest(IP, wrongCode(code))).toEqual({ ok: false, reason: 'roomUnavailable' });
      vi.advanceTimersByTime(1000);
    }
    expect(rooms.joinGuest(IP, wrongCode(code))).toEqual({ ok: false, reason: 'tooManyAttempts' });
    // Même un code juste est refusé ; un code mal formé compte comme les autres.
    expect(rooms.joinGuest(IP, code)).toEqual({ ok: false, reason: 'tooManyAttempts' });
    expect(rooms.joinProfile(IP, code, { profile, familyId: 'famille-b' }).ok).toBe(false);
    expect(onCodeFailure).toHaveBeenCalledTimes(10);
    // Une autre adresse n'est pas touchée.
    expect(rooms.joinGuest('198.51.100.1', code).ok).toBe(true);
    // Blocage d'une fenêtre entière après le 10e échec.
    vi.advanceTimersByTime(CODE_ATTEMPT_WINDOW_MS - 1001);
    expect(rooms.joinGuest(IP, code).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    const again = open('famille-a');
    expect(rooms.joinGuest(IP, again.code).ok).toBe(true);
  });

  it('fenêtre glissante : des échecs espacés ne bloquent pas', () => {
    const { rooms } = setup();
    for (let i = 0; i < 30; i++) {
      expect(rooms.joinGuest(IP, 'zzz')).toEqual({ ok: false, reason: 'roomUnavailable' });
      vi.advanceTimersByTime(CODE_ATTEMPT_WINDOW_MS / 5);
    }
  });

  it('changer d’adresse dans le même préfixe IPv6 ne remet pas le compteur à zéro', () => {
    const { rooms } = setup();
    for (let i = 0; i < 10; i++) rooms.joinGuest(`2001:db8:1:2::${i}`, 'ZZZZ');
    expect(rooms.joinGuest('2001:db8:1:2:ffff::1', 'ZZZZ')).toEqual({ ok: false, reason: 'tooManyAttempts' });
  });

  it('adresse bloquée : un joueur déjà placé reprend quand même sa place', () => {
    const { rooms, open } = setup();
    const { code } = open();
    const { seat } = entered(rooms.joinGuest(IP, code));
    for (let i = 0; i < 10; i++) rooms.joinGuest(IP, 'ZZZ');
    expect(entered(rooms.joinGuest(IP, code, seat.token ?? '')).seat.seatId).toBe(seat.seatId);
    expect(rooms.joinGuest(IP, code, 'faux')).toEqual({ ok: false, reason: 'tooManyAttempts' });
  });
});

describe('salles : expirations et effacement', () => {
  /** Salle avec un invité connecté et un code faux noté. */
  const busy = () => {
    const s = setup();
    const { code } = s.open();
    const { seat } = entered(s.rooms.joinGuest(IP, code));
    s.rooms.attach(code, seat.seatId, 'c1');
    s.rooms.joinGuest(IP, 'ZZZ');
    return { ...s, code, seat };
  };
  const elapse = (ms: number, rooms: ReturnType<typeof createRooms>, code: string) => {
    for (let left = ms; left > 0; left -= 60_000) {
      vi.advanceTimersByTime(Math.min(left, 60_000));
      rooms.touch(code);
    }
  };

  it('salle jamais lancée : fermée à 10 min', () => {
    const { rooms, code, closed } = busy();
    elapse(ROOM_LOBBY_TTL_MS - 1, rooms, code);
    expect(closed).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(closed).toEqual(['expired']);
    expect(rooms.stats()).toMatchObject({ rooms: 0, seats: 0, tokens: 0 });
  });

  it('salle inactive : fermée à 15 min', () => {
    const { rooms, code, closed } = busy();
    rooms.start(code);
    vi.advanceTimersByTime(ROOM_IDLE_TTL_MS - 1);
    expect(closed).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(closed).toEqual(['expired']);
    expect(rooms.stats()).toEqual(EMPTY);
  });

  it('durée totale : 2 h au plus, même active', () => {
    const { rooms, code, closed } = busy();
    rooms.start(code);
    elapse(ROOM_MAX_TTL_MS - 60_000, rooms, code);
    expect(closed).toEqual([]);
    vi.advanceTimersByTime(60_000);
    expect(closed).toEqual(['expired']);
    expect(rooms.stats()).toEqual(EMPTY);
  });

  it('hôte absent 30 s : fermée ; revenu à temps : gardée', () => {
    const { rooms, open, code, closed } = busy();
    rooms.hostDisconnected('tv');
    vi.advanceTimersByTime(ROOM_HOST_GRACE_MS - 1);
    expect(open('famille-a', 'tv-2').code).toBe(code);
    // L'ancienne connexion de l'écran ne compte plus.
    rooms.hostDisconnected('tv');
    vi.advanceTimersByTime(ROOM_HOST_GRACE_MS);
    expect(closed).toEqual([]);
    rooms.hostDisconnected('tv-2');
    vi.advanceTimersByTime(ROOM_HOST_GRACE_MS);
    expect(closed).toEqual(['host-left']);
    expect(rooms.stats()).toMatchObject({ rooms: 0, seats: 0, tokens: 0 });
  });

  it('après fermeture : registre vide, adresse oubliée à la fin de sa fenêtre', () => {
    const { rooms, code, seat, closed } = busy();
    rooms.close(code);
    expect(closed).toEqual(['host']);
    expect(rooms.get(code)).toBeNull();
    expect(rooms.stats()).toEqual({ ...EMPTY, addresses: 1 });
    expect(vi.getTimerCount()).toBe(1);
    expect(rooms.joinGuest('198.51.100.1', code, seat.token ?? '').ok).toBe(false);
    vi.advanceTimersByTime(CODE_ATTEMPT_WINDOW_MS);
    expect(rooms.stats()).toEqual(EMPTY);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('compte les salles ouvertes ; arrêt du serveur : plus aucun minuteur', () => {
    const onCountChange = vi.fn();
    const { rooms, open } = setup({ onCountChange });
    open('famille-a');
    rooms.joinGuest(IP, 'ZZZ');
    expect(onCountChange).toHaveBeenLastCalledWith(1);
    rooms.dispose();
    expect(onCountChange).toHaveBeenLastCalledWith(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('limiteur : mémoire bornée', () => {
  it('au-delà de la borne, l’adresse la plus ancienne est oubliée', () => {
    const limiter = createAttemptLimiter(clock);
    for (let i = 0; i < 10_001; i++) limiter.fail(`adresse-${i}`);
    expect(limiter.size()).toBe(10_000);
    limiter.dispose();
    expect(limiter.size()).toBe(0);
  });
});
