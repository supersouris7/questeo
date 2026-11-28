import { z } from 'zod';
import type { DuelClientEvents, DuelServerEvents } from './duel.ts';
import { GuestAuthSchema, type QuizClientEvents, type QuizServerEvents } from './party.ts';
import { ContentIdSchema, ResponseSchema, type Level } from './play.ts';
import type { AvatarConfig, HeroId } from './profile.ts';

/**
 * Contrats du temps réel (socket.io) : présence, messages prédéfinis, arène.
 * Les messages client → serveur sont validés par les schémas ci-dessous ; les événements sont
 * typés par `ClientToServerEvents` / `ServerToClientEvents`, partagés par le serveur et le client.
 */

/** Joueur connecté (visible des autres). */
export interface OnlinePlayer {
  readonly id: string;
  readonly name: string;
  readonly hero: HeroId;
  readonly avatar: AvatarConfig;
  /** En partie d'arène (ne peut pas être invité). */
  readonly busy: boolean;
  /** Ami d'une autre famille (sinon : joueur de la famille). */
  readonly friend?: boolean;
}

/** Messages prédéfinis entre joueurs (pas de texte libre : sûr pour les enfants). */
export const PRESET_MESSAGES = [
  'Salut !',
  'Bien joué !',
  'Bravo, champion·ne !',
  'Viens en Duel !',
  'Prêt·e pour un défi ?',
  'J’arrive !',
  'Je fais un boss, je reviens.',
  'Trop fort !',
  'On se fait un entraînement ?',
  'Revanche ?',
  'GG !',
  'Merci !',
  'Pas maintenant, désolé·e.',
  'J’ai eu la médaille d’or !',
  'Tu as battu le Golem ?',
  'Le π-bot m’a eu…',
  'À plus tard !',
  'Courage, tu vas y arriver !',
] as const;

export const CHAT_EMOJIS = [
  '👋',
  '👍',
  '😄',
  '😂',
  '😮',
  '😎',
  '🔥',
  '⚡',
  '🏆',
  '💪',
  '❤️',
  '🤝',
  '🎉',
  '😅',
  '🤔',
  '🐱',
] as const;

export const ChatPayloadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('preset'),
    index: z
      .number()
      .int()
      .min(0)
      .max(PRESET_MESSAGES.length - 1),
  }),
  z.object({
    kind: z.literal('emoji'),
    index: z
      .number()
      .int()
      .min(0)
      .max(CHAT_EMOJIS.length - 1),
  }),
]);
export type ChatPayload = z.infer<typeof ChatPayloadSchema>;

export const chatText = (p: ChatPayload): string | null =>
  (p.kind === 'preset' ? PRESET_MESSAGES[p.index] : CHAT_EMOJIS[p.index]) ?? null;

/** Message reçu (notification en haut de l'écran). */
export interface ChatMessage {
  readonly from: Pick<OnlinePlayer, 'id' | 'name' | 'hero'>;
  readonly text: string;
  readonly at: number;
}

// ——— Arène : 2 à 4 joueurs, chacun répond à son tour sur son appareil ———

export const ARENA_MAX_PLAYERS = 4;
export const ARENA_HEARTS = 3;
/** Secondes pour répondre (multipliées par le handicap d'âge des plus grands). */
export const ARENA_TURN_SECONDS = 45;
/** Tours au plus : ensuite, le joueur qui a le plus de cœurs gagne. */
export const ARENA_MAX_TURNS = 30;

export interface ArenaPlayer {
  readonly id: string;
  readonly name: string;
  readonly hero: HeroId;
  readonly hearts: number;
  /** A accepté l'invitation (l'hôte : d'emblée). */
  readonly ready: boolean;
  /** Connexion perdue : sa place est gardée quelques secondes (reconnexion possible). */
  readonly away?: boolean;
}

export interface ArenaQuestion {
  readonly skillId: string;
  readonly level: Level;
  readonly seed: number;
}

/** Ce qui vient de se passer (affiché à tous). */
export interface ArenaEvent {
  readonly playerId: string;
  readonly correct: boolean;
  /** Joueur attaqué (bonne réponse). */
  readonly targetId: string | null;
  readonly timeout: boolean;
}

export type ArenaPhase = 'lobby' | 'playing' | 'over';

export interface ArenaView {
  readonly id: string;
  readonly hostId: string;
  readonly chapterId: string;
  readonly phase: ArenaPhase;
  readonly players: readonly ArenaPlayer[];
  /** Joueur dont c'est le tour. */
  readonly turnId: string | null;
  readonly turn: number;
  readonly question: ArenaQuestion | null;
  /** Fin du temps de réponse (horodatage ms) ; null pendant une pause. */
  readonly deadline: number | null;
  /** Pause : joueur déconnecté que l'on attend (son tour), sinon null. */
  readonly waitingFor?: string | null;
  readonly last: ArenaEvent | null;
  readonly winnerId: string | null;
}

/** Invitation reçue. */
export interface ArenaInvite {
  readonly arenaId: string;
  readonly from: Pick<OnlinePlayer, 'id' | 'name' | 'hero'>;
  readonly chapterId: string;
}

// ——— Messages client → serveur (validés) ———

export const ChatSendSchema = z.object({ to: z.uuid(), payload: ChatPayloadSchema });
export type ChatSend = z.infer<typeof ChatSendSchema>;

export const ArenaCreateSchema = z.object({
  chapterId: ContentIdSchema,
  invite: z
    .array(z.uuid())
    .min(1)
    .max(ARENA_MAX_PLAYERS - 1),
});
export type ArenaCreate = z.infer<typeof ArenaCreateSchema>;

export const ArenaRespondSchema = z.object({ arenaId: z.uuid(), accept: z.boolean() });
export type ArenaRespond = z.infer<typeof ArenaRespondSchema>;

export const ArenaAnswerSchema = z.object({ response: ResponseSchema });
export type ArenaAnswer = z.infer<typeof ArenaAnswerSchema>;

/** Événements émis par le client (Duel : `duel.ts` ; Quiz TV : `party.ts`). */
export interface ClientToServerEvents extends DuelClientEvents, QuizClientEvents {
  chat: (msg: ChatSend) => void;
  'arena:create': (msg: ArenaCreate) => void;
  'arena:respond': (msg: ArenaRespond) => void;
  'arena:start': () => void;
  'arena:answer': (msg: ArenaAnswer) => void;
  'arena:leave': () => void;
}

/** Événements émis par le serveur. */
export interface ServerToClientEvents extends DuelServerEvents, QuizServerEvents {
  presence: (players: OnlinePlayer[]) => void;
  chat: (msg: ChatMessage) => void;
  arena: (view: ArenaView) => void;
  'arena:invite': (invite: ArenaInvite) => void;
  'arena:closed': (arenaId: string) => void;
  /** Ce profil vient d'être ouvert sur un autre appareil : cette connexion est fermée. */
  replaced: () => void;
}

/**
 * Données d'authentification de la connexion temps réel : un joueur (profil de la famille),
 * l'écran TV de la famille (aucun profil : il affiche les parties de la famille, les téléphones
 * servent de manettes), ou un invité sans compte (code d'une salle ouverte, voir `party.ts`).
 */
export const RealtimeAuthSchema = z.union([
  z.object({ profileId: z.uuid() }),
  z.object({ tv: z.literal(true) }),
  z.object({ guest: GuestAuthSchema }),
]);

/** Raisons de refus de connexion (message affiché tel quel). */
export const REALTIME_REFUSALS = {
  unknownProfile: 'Profil introuvable',
  replaced: 'Ce joueur vient d’être ouvert sur un autre appareil.',
  /** Une seule réponse pour code inconnu, salle pleine ou verrouillée, jeton périmé. */
  roomUnavailable: 'Salle introuvable, complète, ou partie déjà commencée.',
  tooManyAttempts: 'Trop d’essais. Réessaie dans quelques minutes.',
} as const;
