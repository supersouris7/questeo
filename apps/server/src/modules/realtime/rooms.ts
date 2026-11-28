import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  FALLBACK_GRADE,
  GUEST_AVATARS,
  GUEST_PSEUDOS,
  MATCH_GRACE_MS,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  ROOM_HOST_GRACE_MS,
  ROOM_IDLE_TTL_MS,
  ROOM_LOBBY_TTL_MS,
  ROOM_MAX_SEATS,
  ROOM_MAX_TTL_MS,
  RoomCodeSchema,
  type Profile,
  type QuizClosedReason,
  type QuizIdentity,
  type QuizSetup,
} from '@epicademie/shared';
import type { Clock } from '../../core/clock.ts';
import type { Random } from '../../core/random.ts';
import { createAttemptLimiter } from './attempt-limiter.ts';
import { rateKey } from './client-ip.ts';

/**
 * Salles à code (docs/adr/0040) : ouverture par l'écran d'une famille, places d'invités ou de
 * profils, reconnexion, verrouillage, expirations, limitation des codes faux. Tout vit en mémoire
 * et disparaît à la fermeture : rien n'est écrit en base, rien n'est journalisé (ni code, ni
 * pseudo, ni jeton, ni adresse). Les règles du jeu et les vues sont ailleurs (orchestrateur).
 */

/** Place d'une salle. */
export interface Seat extends QuizIdentity {
  /** Joueur inscrit (sa classe, son prénom, les chapitres de sa famille) ; absent : invité. */
  readonly profile?: { readonly id: string; readonly familyId: string };
  /** Jeton de reprise d'un invité. */
  readonly token: string | null;
  /** Connexion qui tient la place ; null : déconnecté. */
  readonly connectionId: string | null;
}

export interface Room {
  readonly code: string;
  /** Famille hôte : seul son écran commande la salle ; ses chapitres servent aux invités. */
  readonly familyId: string;
  /** Partie lancée : plus personne n'entre (les places existantes se reprennent). */
  readonly locked: boolean;
  readonly seats: readonly Seat[];
}

export type SeatRemoval = Extract<QuizClosedReason, 'kicked' | 'left' | 'disconnected'>;
export type RoomClosure = Extract<QuizClosedReason, 'host' | 'expired' | 'host-left'>;

export type EnterResult =
  | { readonly ok: true; readonly room: Room; readonly seat: Seat }
  | { readonly ok: false; readonly reason: 'roomUnavailable' | 'tooManyAttempts' };

export interface RoomsDeps {
  readonly clock: Pick<Clock, 'now'>;
  /** Tirages du code, des pseudos et des avatars (`crypto.randomInt` en production). */
  readonly random: Pick<Random, 'int'>;
  /** Jeton de place ; par défaut, 32 octets aléatoires. */
  readonly token?: () => string;
  /** Une salle ferme : prévenir l'hôte et ses places (déjà effacées du registre). */
  readonly onClosed?: (room: Room, reason: RoomClosure) => void;
  /** Une place est libérée, salle toujours ouverte. */
  readonly onSeatRemoved?: (room: Room, seat: Seat, reason: SeatRemoval) => void;
  readonly onCountChange?: (open: number) => void;
  /** Code faux, salle refusée ou jeton périmé (métrique : ni code ni adresse). */
  readonly onCodeFailure?: () => void;
}

const SEAT_TOKEN_BYTES = 32;
/** Tirages d'un code libre avant d'abandonner (130 321 combinaisons). */
const CODE_DRAWS = 100;

/** Qui se présente : un invité (avec son jeton s'il revient) ou un joueur inscrit. */
type Visitor = { readonly token?: string } | { readonly player: Player };
interface Player {
  readonly profile: Profile;
  readonly familyId: string;
}

type MutableSeat = { -readonly [K in keyof Seat]: Seat[K] } & { grace?: NodeJS.Timeout };

interface LiveRoom {
  readonly code: string;
  readonly familyId: string;
  locked: boolean;
  readonly seats: MutableSeat[];
  host: string | null;
  lobby?: NodeJS.Timeout;
  idle?: NodeJS.Timeout;
  max?: NodeJS.Timeout;
  hostGrace?: NodeJS.Timeout;
}

/** Copie d'une place, sans son minuteur. */
const copy = (seat: MutableSeat): Seat => {
  const out = { ...seat };
  delete out.grace;
  return out;
};

const snapshot = (room: LiveRoom): Room => ({
  code: room.code,
  familyId: room.familyId,
  locked: room.locked,
  seats: room.seats.map(copy),
});

/** Comparaison des jetons de place en temps constant. */
const sameToken = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Place déjà tenue par ce visiteur (jeton de l'invité, profil du joueur). */
const ownSeat = (room: LiveRoom, who: Visitor) =>
  room.seats.find((s) =>
    'player' in who
      ? s.profile?.id === who.player.profile.id
      : who.token !== undefined && s.token !== null && sameToken(s.token, who.token),
  );

export function createRooms(deps: RoomsDeps) {
  const { clock, random } = deps;
  const newToken = deps.token ?? (() => randomBytes(SEAT_TOKEN_BYTES).toString('base64url'));
  const rooms = new Map<string, LiveRoom>();
  const attempts = createAttemptLimiter(clock);
  const counted = () => deps.onCountChange?.(rooms.size);
  const pick = <T>(items: readonly T[]) => items[random.int(items.length)] as T;

  /** Efface la salle, ses places, ses jetons et ses minuteurs. */
  const erase = (room: LiveRoom) => {
    for (const t of [room.lobby, room.idle, room.max, room.hostGrace]) clearTimeout(t);
    for (const s of room.seats) clearTimeout(s.grace);
    const last = snapshot(room);
    room.seats.length = 0;
    rooms.delete(room.code);
    counted();
    return last;
  };
  const close = (code: string, reason: RoomClosure) => {
    const room = rooms.get(code);
    if (room) deps.onClosed?.(erase(room), reason);
  };

  /** Activité dans la salle : repousse l'expiration pour inactivité. */
  const touch = (room: LiveRoom) => {
    clearTimeout(room.idle);
    room.idle = setTimeout(() => close(room.code, 'expired'), ROOM_IDLE_TTL_MS);
  };

  const removeSeat = (code: string, seatId: string, reason: SeatRemoval) => {
    const room = rooms.get(code);
    const index = room?.seats.findIndex((s) => s.seatId === seatId) ?? -1;
    if (!room || index < 0) return;
    const [removed] = room.seats.splice(index, 1) as [MutableSeat];
    clearTimeout(removed.grace);
    deps.onSeatRemoved?.(snapshot(room), copy(removed), reason);
  };

  /** Place sans connexion : libérée si personne ne la reprend à temps. */
  const startGrace = (code: string, seat: MutableSeat) => {
    clearTimeout(seat.grace);
    seat.grace = setTimeout(() => removeSeat(code, seat.seatId, 'disconnected'), MATCH_GRACE_MS);
  };

  const freeCode = () => {
    for (let draw = 0; draw < CODE_DRAWS; draw++) {
      const code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
        ROOM_CODE_ALPHABET.charAt(random.int(ROOM_CODE_ALPHABET.length)),
      ).join('');
      if (!rooms.has(code)) return code;
    }
    return null;
  };

  /** Pseudo proposé, différent de ceux de la salle (et du précédent). */
  const freePseudo = (room: LiveRoom) => pick(GUEST_PSEUDOS.filter((p) => room.seats.every((s) => s.name !== p)));

  const addSeat = (room: LiveRoom, seat: MutableSeat) => {
    room.seats.push(seat);
    // Place pas encore tenue par une connexion : le délai court dès maintenant.
    startGrace(room.code, seat);
    return seat;
  };

  /** Nouvelle place : profil inscrit, ou invité avec pseudo proposé et jeton. */
  const newSeat = (room: LiveRoom, who: Visitor) => {
    const base = { seatId: randomUUID(), team: null, connectionId: null };
    if (!('player' in who)) {
      return addSeat(room, {
        ...base,
        name: freePseudo(room),
        avatar: pick(GUEST_AVATARS),
        grade: FALLBACK_GRADE,
        token: newToken(),
      });
    }
    const { profile, familyId } = who.player;
    return addSeat(room, {
      ...base,
      name: profile.name,
      avatar: profile.avatar.seed,
      grade: profile.grade ?? FALLBACK_GRADE,
      profile: { id: profile.id, familyId },
      token: null,
    });
  };

  /** Place demandée : la sienne, sinon une nouvelle si la salle l'accepte. */
  const seatFor = (room: LiveRoom, who: Visitor) => {
    const mine = ownSeat(room, who);
    if (mine) return mine;
    // Jeton présenté mais inconnu (périmé) : refus, jamais une nouvelle place.
    const stale = !('player' in who) && who.token !== undefined;
    if (stale || room.locked || room.seats.length >= ROOM_MAX_SEATS) return undefined;
    return newSeat(room, who);
  };

  /** Contrôle commun aux invités et aux profils : limitation, code, place. */
  const enter = (ip: string, rawCode: string, who: Visitor): EnterResult => {
    const key = rateKey(ip);
    const code = RoomCodeSchema.safeParse(rawCode);
    const room = code.success ? rooms.get(code.data) : undefined;
    // Reprendre sa propre place reste possible depuis une adresse bloquée (partagée par toute la
    // famille) : le jeton (32 octets) ou la session du profil ne se devinent pas.
    if (!(room && ownSeat(room, who)) && attempts.blocked(key)) return { ok: false, reason: 'tooManyAttempts' };
    const seat = room && seatFor(room, who);
    if (!room || !seat) {
      attempts.fail(key);
      deps.onCodeFailure?.();
      return { ok: false, reason: 'roomUnavailable' };
    }
    touch(room);
    return { ok: true, room: snapshot(room), seat: copy(seat) };
  };

  return {
    /**
     * Ouvre la salle d'une famille, ou reprend celle qui est ouverte (rechargement de l'écran
     * hôte) : une seule par famille.
     */
    open(familyId: string, connectionId: string): Room | null {
      let room = [...rooms.values()].find((r) => r.familyId === familyId);
      if (!room) {
        const code = freeCode();
        if (!code) return null;
        room = { code, familyId, locked: false, seats: [], host: null };
        rooms.set(code, room);
        room.lobby = setTimeout(() => close(code, 'expired'), ROOM_LOBBY_TTL_MS);
        room.max = setTimeout(() => close(code, 'expired'), ROOM_MAX_TTL_MS);
        counted();
      }
      clearTimeout(room.hostGrace);
      room.host = connectionId;
      touch(room);
      return snapshot(room);
    },

    get(code: string): Room | null {
      const room = rooms.get(code);
      return room ? snapshot(room) : null;
    },

    /** Écran hôte déconnecté : la salle ferme s'il ne revient pas (`open`). */
    hostDisconnected(connectionId: string): void {
      for (const room of rooms.values()) {
        if (room.host !== connectionId) continue;
        room.host = null;
        room.hostGrace = setTimeout(() => close(room.code, 'host-left'), ROOM_HOST_GRACE_MS);
      }
    },

    /** Invité : nouvelle place avec le code, ou reprise de la sienne avec son jeton. */
    joinGuest: (ip: string, code: string, token?: string) => enter(ip, code, { token }),
    /** Joueur inscrit (sa session l'identifie) : nouvelle place, ou la sienne. */
    joinProfile: (ip: string, code: string, player: Player) => enter(ip, code, { player }),

    /** La connexion prend la place (la précédente, éventuelle, ne compte plus). */
    attach(code: string, seatId: string, connectionId: string): Seat | null {
      const seat = rooms.get(code)?.seats.find((s) => s.seatId === seatId);
      if (!seat) return null;
      clearTimeout(seat.grace);
      seat.grace = undefined;
      seat.connectionId = connectionId;
      return copy(seat);
    },

    /** Connexion perdue : place gardée `MATCH_GRACE_MS` (sauf si une autre l'a déjà reprise). */
    disconnect(code: string, seatId: string, connectionId: string): void {
      const seat = rooms.get(code)?.seats.find((s) => s.seatId === seatId);
      if (seat?.connectionId !== connectionId) return;
      seat.connectionId = null;
      startGrace(code, seat);
    },

    /** Réglages d'une manette, au salon seulement ; le prénom d'un profil ne change pas. */
    setup(code: string, seatId: string, msg: QuizSetup): void {
      const room = rooms.get(code);
      const seat = room?.seats.find((s) => s.seatId === seatId);
      if (!room || !seat || room.locked) return;
      if (msg.rerollPseudo && !seat.profile) seat.name = freePseudo(room);
      // Un profil garde sa classe : elle vient de son compte.
      if (msg.grade && !seat.profile) seat.grade = msg.grade;
      seat.avatar = msg.avatar ?? seat.avatar;
      seat.team = msg.team ?? seat.team;
      touch(room);
    },

    /** Départ volontaire. */
    leave: (code: string, seatId: string) => removeSeat(code, seatId, 'left'),
    /** Retrait par l'hôte. */
    kick: (code: string, seatId: string) => removeSeat(code, seatId, 'kicked'),

    /** Lancement : salle verrouillée, plus de limite d'attente au salon. */
    start(code: string): void {
      const room = rooms.get(code);
      if (!room) return;
      room.locked = true;
      clearTimeout(room.lobby);
      touch(room);
    },

    /** Activité de jeu (réponse, commande de l'hôte). */
    touch(code: string): void {
      const room = rooms.get(code);
      if (room) touch(room);
    },

    close: (code: string) => close(code, 'host'),

    /** Contenu du registre (métriques et tests d'effacement). */
    stats() {
      const seats = [...rooms.values()].flatMap((r) => r.seats);
      return {
        rooms: rooms.size,
        seats: seats.length,
        tokens: seats.filter((s) => s.token !== null).length,
        addresses: attempts.size(),
      };
    },

    /** Arrêt du serveur : tout est effacé, plus aucun minuteur. */
    dispose(): void {
      for (const room of [...rooms.values()]) erase(room);
      attempts.dispose();
    },
  };
}

export type Rooms = ReturnType<typeof createRooms>;
