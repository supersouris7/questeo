import type { Server } from 'socket.io';
import type { FastifyBaseLogger } from 'fastify';
import { z } from 'zod';
import {
  ArenaAnswerSchema,
  ArenaCreateSchema,
  ArenaRespondSchema,
  chatText,
  ChatSendSchema,
  REALTIME_REFUSALS,
  RealtimeAuthSchema,
  type ChatMessage,
  type ClientToServerEvents,
  type GuestAuth,
  type Profile,
  type QuizClosedReason,
  type ServerToClientEvents,
} from '@epicademie/shared';
import type { Clock } from '../../core/clock.ts';
import type { Random } from '../../core/random.ts';
import type { ErrorReporter } from '../../core/observability/error-reporter.ts';
import type { Metrics } from '../../core/observability/metrics.ts';
import { createArenas } from './arena.ts';
import { clientIp } from './client-ip.ts';
import type { PlayerSocket, Presence, SocketData } from './presence.ts';
import { tokenBucket } from './rate-limiter.ts';
import { createRooms, type Rooms, type Seat } from './rooms.ts';

/**
 * Passerelle temps réel (socket.io) : authentifie la connexion, valide chaque message avec les
 * schémas de @epicademie/shared, limite le débit, puis délègue à la présence et à l'arène.
 *
 * - Présence : un profil n'est ouvert que sur un seul appareil (2e connexion refusée).
 * - Messages : prédéfinis ou emoji seulement (pas de texte libre : sûr pour des enfants).
 * - Arène : invitation, puis tour par tour.
 * - Invités sans compte : un code de salle ouverte (ou un jeton de place) suffit ; aucun
 *   gestionnaire des joueurs inscrits ne leur est branché (docs/adr/0040-duel-et-quiz-tv.md).
 */
export interface RealtimeDeps {
  readonly presence: Presence;
  /**
   * Profil demandé, s'il appartient à la famille de la session portée par les cookies de la
   * connexion (module comptes + profils) ; `null` sinon.
   */
  readonly authorize: (
    cookieHeader: string | undefined,
    profileId: string,
  ) => Promise<{ readonly profile: Profile; readonly familyId: string } | null>;
  /** Famille de la session portée par les cookies (écran TV), ou null. */
  readonly authorizeFamily: (cookieHeader: string | undefined) => Promise<string | null>;
  readonly clock: Clock;
  readonly random: Random;
  /** Amis actifs d'un profil (amitié acceptée et validée par les parents). */
  readonly friendsOf: (profileId: string) => Promise<string[]>;
  /** La famille peut-elle jouer ce chapitre (gratuit, ou abonnement) ? */
  readonly canPlayChapter: (familyId: string, chapterId: string) => Promise<boolean>;
  readonly logger: FastifyBaseLogger;
  readonly reporter: ErrorReporter;
  readonly metrics?: Metrics;
  /** Proxys de confiance devant le serveur (`TRUST_PROXY`) : adresse du client des invités. */
  readonly trustProxy: number;
}

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/** Messages de discussion : 5 d'affilée, puis 1 toutes les 2 s. Autres actions : 20, puis 1 / 250 ms. */
const CHAT_BURST = 5;
const CHAT_REFILL_MS = 2_000;
const ACTION_BURST = 20;
const ACTION_REFILL_MS = 250;

/** Salles à code : les téléphones d'invités sont prévenus puis déconnectés quand leur place disparaît. */
function createGatewayRooms(io: RealtimeServer, { clock, random, metrics }: RealtimeDeps) {
  const dismiss = (seat: Seat, reason: QuizClosedReason) => {
    const socket = seat.connectionId ? io.sockets.sockets.get(seat.connectionId) : undefined;
    socket?.emit('quiz:closed', reason);
    // Un joueur inscrit garde sa connexion (présence, autres modes).
    if (!seat.profile) socket?.disconnect(true);
  };
  return createRooms({
    clock,
    random,
    onClosed: (room, reason) => {
      io.to(tvRoom(room.familyId)).emit('quiz:closed', reason);
      for (const seat of room.seats) dismiss(seat, reason);
    },
    onSeatRemoved: (_room, seat, reason) => dismiss(seat, reason),
    onCountChange: (n) => metrics?.openRooms.set(n),
    onCodeFailure: () => metrics?.roomCodeFailures.inc(),
  });
}

/** Téléphone invité : il prend sa place et reçoit son jeton ; rien d'autre ne lui est ouvert. */
function welcomeGuest(io: RealtimeServer, socket: PlayerSocket, rooms: Rooms, metrics?: Metrics) {
  if (!socket.data.guest) return;
  const { code, seatId } = socket.data.guest;
  const previous = rooms.get(code)?.seats.find((s) => s.seatId === seatId)?.connectionId;
  const seat = rooms.attach(code, seatId, socket.id);
  if (!seat) {
    socket.disconnect(true);
    return;
  }
  // Reprise avant que l'ancienne connexion soit tombée : elle est fermée.
  const old = previous ? io.sockets.sockets.get(previous) : undefined;
  old?.emit('replaced');
  old?.disconnect(true);
  socket.emit('quiz:joined', { seatId, token: seat.token });
  socket.on('disconnect', () => {
    rooms.disconnect(code, seatId, socket.id);
    metrics?.realtimeDisconnects.inc();
  });
}

const tvRoom = (familyId: string) => `tv:${familyId}`;

export function attachRealtime(io: RealtimeServer, deps: RealtimeDeps) {
  const { presence, logger, reporter, metrics } = deps;
  const arenas = createArenas({
    presence,
    clock: deps.clock,
    random: deps.random,
    onBusyChange: () => broadcastPresence(),
    onCountChange: (n) => metrics?.openArenas.set(n),
    onView: (view, playerIds) => {
      // Écran TV : la famille des joueurs (connus de la présence, ou dernière famille vue).
      const family = playerIds.map((id) => presence.familyOf(id)).find(Boolean) ?? arenaFamily.get(view.id);
      if (!family) return;
      arenaFamily.set(view.id, family);
      io.to(tvRoom(family)).emit('arena', view);
      if (view.phase === 'over') arenaFamily.delete(view.id);
    },
  });
  const arenaFamily = new Map<string, string>();
  const rooms = createGatewayRooms(io, deps);

  /** Chaque joueur reçoit la liste de ses connectés : sa famille et ses amis actifs (jamais les autres). */
  const broadcastPresence = () => {
    for (const id of presence.allIds()) presence.emit(id, 'presence', presence.visibleTo(id, arenas.isBusy));
    metrics?.onlinePlayers.set(presence.count());
  };
  presence.onChanged(broadcastPresence);

  /** Invité : pas de session ; code de salle ouverte ou jeton de place, tentatives limitées. */
  const admitGuest = (socket: PlayerSocket, { code, token }: GuestAuth, next: (err?: Error) => void) => {
    const { address, headers } = socket.handshake;
    const entry = rooms.joinGuest(clientIp(address, headers['x-forwarded-for'], deps.trustProxy), code, token);
    if (!entry.ok) {
      next(new Error(REALTIME_REFUSALS[entry.reason]));
      return;
    }
    socket.data.guest = { code: entry.room.code, seatId: entry.seat.seatId };
    next();
  };

  // Authentification de la connexion : session de la famille (cookie), profil de cette famille,
  // pas déjà ouvert ailleurs ; ou invité d'une salle.
  io.use((socket, next) => {
    const auth = RealtimeAuthSchema.safeParse(socket.handshake.auth);
    if (!auth.success) {
      next(new Error(REALTIME_REFUSALS.unknownProfile));
      return;
    }
    if ('guest' in auth.data) {
      admitGuest(socket, auth.data.guest, next);
      return;
    }
    if ('tv' in auth.data) {
      deps
        .authorizeFamily(socket.handshake.headers.cookie)
        .then((familyId) => {
          if (!familyId) {
            next(new Error(REALTIME_REFUSALS.unknownProfile));
            return;
          }
          socket.data.familyId = familyId;
          socket.data.tv = true;
          next();
        })
        .catch((err: unknown) => {
          reporter.capture(err, { source: 'realtime' });
          next(new Error('Connexion impossible pour le moment'));
        });
      return;
    }
    deps
      .authorize(socket.handshake.headers.cookie, auth.data.profileId)
      .then((found) => {
        if (!found) next(new Error(REALTIME_REFUSALS.unknownProfile));
        else {
          socket.data.profile = found.profile;
          socket.data.familyId = found.familyId;
          return deps.friendsOf(found.profile.id).then((ids) => {
            socket.data.friendIds = ids;
            next();
          });
        }
      })
      .catch((err: unknown) => {
        reporter.capture(err, { source: 'realtime' });
        next(new Error('Connexion impossible pour le moment'));
      });
  });

  io.on('connection', (socket) => {
    if (socket.data.guest) {
      welcomeGuest(io, socket, rooms, metrics);
      return;
    }
    if (socket.data.tv) {
      // Écran TV : rejoint la diffusion de sa famille et reçoit la partie en cours, s'il y en a.
      const familyId = socket.data.familyId;
      void socket.join(tvRoom(familyId));
      const current = presence
        .onlineIds(familyId)
        .map((id) => arenas.viewOf(id))
        .find((v) => v !== null);
      if (current) socket.emit('arena', current);
      socket.on('disconnect', () => rooms.hostDisconnected(socket.id));
      return;
    }
    const profile = socket.data.profile;
    // Le dernier appareil prend la main (nouvel appareil, ou reconnexion après une coupure dont
    // l'ancienne connexion n'est pas encore tombée) : l'ancienne est prévenue puis fermée.
    const previous = presence.socketOf(profile.id);
    presence.join(socket, profile, socket.data.familyId, socket.data.friendIds);
    if (previous && previous !== socket) {
      previous.emit('replaced');
      previous.disconnect(true);
    }
    broadcastPresence();
    // Reconnexion pendant une arène : le joueur reprend sa place et reçoit l'état en cours.
    arenas.reconnected(profile.id);
    const current = arenas.viewOf(profile.id);
    if (current) socket.emit('arena', current);

    const chatLimit = tokenBucket(CHAT_BURST, CHAT_REFILL_MS);
    const actionLimit = tokenBucket(ACTION_BURST, ACTION_REFILL_MS);

    /** Valide le message et le débit, puis exécute ; toute erreur est journalisée, jamais fatale. */
    const on = <S extends z.ZodType>(
      event: keyof ClientToServerEvents,
      schema: S | null,
      handler: (msg: z.output<S>) => void,
      limit = actionLimit,
    ) => {
      socket.on(event, (raw?: unknown) => {
        if (!limit.take()) return;
        const parsed = schema ? schema.safeParse(raw) : { success: true as const, data: undefined };
        if (!parsed.success) {
          logger.debug({ event }, 'message temps réel invalide ignoré');
          return;
        }
        try {
          handler(parsed.data as z.output<S>);
        } catch (err) {
          reporter.capture(err, { source: 'realtime', event });
        }
      });
    };

    on(
      'chat',
      ChatSendSchema,
      ({ to, payload }) => {
        const text = chatText(payload);
        if (!text || to === profile.id || !presence.linked(profile.id, to)) return;
        const out: ChatMessage = {
          from: { id: profile.id, name: profile.name, hero: profile.hero },
          text,
          at: Date.now(),
        };
        presence.emit(to, 'chat', out);
      },
      chatLimit,
    );
    // On n'invite que des joueurs de sa famille ou ses amis, sur un chapitre que la famille peut jouer.
    on('arena:create', ArenaCreateSchema, (msg) => {
      deps
        .canPlayChapter(socket.data.familyId, msg.chapterId)
        .then((ok) => {
          if (ok)
            arenas.create(profile, { ...msg, invite: msg.invite.filter((id) => presence.linked(profile.id, id)) });
        })
        .catch((err: unknown) => reporter.capture(err, { source: 'realtime', event: 'arena:create' }));
    });
    on('arena:respond', ArenaRespondSchema, ({ arenaId, accept }) => arenas.respond(profile.id, arenaId, accept));
    on('arena:start', null, () => arenas.start(profile.id));
    on('arena:answer', ArenaAnswerSchema, ({ response }) => arenas.answer(profile.id, response));
    on('arena:leave', null, () => arenas.leave(profile.id));

    socket.on('disconnect', () => {
      presence.leave(socket, profile.id);
      // Connexion remplacée par un autre appareil : le joueur est toujours là.
      // Sinon, pas d'élimination immédiate : le temps de revenir (voir ARENA_GRACE_MS).
      if (!presence.isOnline(profile.id)) arenas.disconnected(profile.id);
      metrics?.realtimeDisconnects.inc();
      broadcastPresence();
    });
  });

  return {
    /** Registre des salles à code (Quiz TV). */
    rooms,
    /** Arrêt propre : minuteurs coupés, connexions fermées. */
    async close(): Promise<void> {
      arenas.dispose();
      rooms.dispose();
      await io.close();
    },
  };
}
