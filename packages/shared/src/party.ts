import { z } from 'zod';
import { GRADES, type Grade } from './grades.ts';
import { ResponseSchema, type Level } from './play.ts';
import { AVATAR_IDS } from './profile.ts';
import { SUBJECT_IDS, type SubjectId } from './subjects.ts';

/**
 * Contrats des salles et du Quiz TV (docs/adr/0040-duel-et-quiz-tv.md) : un écran de la famille
 * ouvre une salle, des téléphones la rejoignent par un code (invités sans compte, ou profils).
 * Aucune logique ici : types, schémas des messages entrants, listes fixes et durées.
 */

// ——— Durées et limites ———

/** Reconnexion : la place d'un joueur déconnecté est gardée ce temps (Duel et Quiz, ADR 0016). */
export const MATCH_GRACE_MS = 30_000;
/** Écran hôte déconnecté plus longtemps : la salle ferme pour tous. */
export const ROOM_HOST_GRACE_MS = 30_000;
/** Salle jamais lancée : fermée au bout de ce délai. */
export const ROOM_LOBBY_TTL_MS = 10 * 60_000;
/** Salle sans activité : fermée au bout de ce délai. */
export const ROOM_IDLE_TTL_MS = 15 * 60_000;
/** Durée de vie maximale d'une salle. */
export const ROOM_MAX_TTL_MS = 2 * 60 * 60_000;
/** Codes faux acceptés par adresse IP dans la fenêtre ; ensuite, refus pendant une fenêtre. */
export const CODE_ATTEMPT_LIMIT = 10;
export const CODE_ATTEMPT_WINDOW_MS = 10 * 60_000;

// ——— Code de salle ———

/** 19 consonnes : sans voyelles (aucun mot formé), sans L ni Y (lecture sur une télévision). */
export const ROOM_CODE_ALPHABET = 'BCDFGHJKMNPQRSTVWXZ';
export const ROOM_CODE_LENGTH = 4;
export const ROOM_MAX_SEATS = 8;

/** Saisie d'un code (minuscules et espaces autour tolérés). */
export const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`), 'Code à 4 lettres');

// ——— Invités ———

/** Pseudos proposés par le serveur, jamais saisis (noms masculins : pas d'accord à gérer). */
export const GUEST_PSEUDOS = [
  'Renard bleu',
  'Panda vert',
  'Lynx doré',
  'Hibou violet',
  'Dauphin rouge',
  'Tigre blanc',
  'Koala orange',
  'Faucon gris',
  'Loup argenté',
  'Castor jaune',
  'Dragon turquoise',
  'Phoque rose',
  'Aigle noir',
  'Hérisson bleu',
  'Pingouin vert',
  'Lièvre doré',
  'Colibri violet',
  'Bison rouge',
  'Chamois blanc',
  'Écureuil orange',
  'Narval gris',
  'Héron argenté',
  'Poussin jaune',
  'Caméléon turquoise',
] as const;

/** Avatars proposés : les portraits du jeu. */
export const GUEST_AVATARS: readonly string[] = AVATAR_IDS;

/**
 * Connexion temps réel d'un téléphone sans compte : le code de la salle, puis, pour retrouver sa
 * place après une coupure, le jeton reçu dans `quiz:joined`. Le format du code n'est pas imposé
 * ici : un code mal formé compte comme un code faux. Le client garde le jeton en `sessionStorage`
 * seulement, et doit le joindre à chaque reconnexion (option `auth` sous forme de fonction).
 */
export const GuestAuthSchema = z.object({
  code: z.string().max(16),
  token: z.string().max(64).optional(),
});
export type GuestAuth = z.infer<typeof GuestAuthSchema>;

// ——— Quiz TV ———

export const QUIZ_QUESTIONS = 10;
export const QUIZ_QUESTION_SECONDS = 30;
/** Pause entre deux questions (résultat affiché). */
export const QUIZ_REVEAL_SECONDS = 6;
export const QUIZ_MODES = ['solo', 'teams'] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];
export const QUIZ_TEAMS = ['bleu', 'orange'] as const;
export type QuizTeam = (typeof QUIZ_TEAMS)[number];

/** Question à régénérer côté client (déterministe pour ces trois valeurs). */
export interface QuestionRef {
  readonly skillId: string;
  readonly level: Level;
  readonly seed: number;
}

/** Salon, question en cours, résultat de la question, fin de partie. */
export type QuizPhase = 'lobby' | 'question' | 'reveal' | 'over';

/** Place d'une salle telle qu'elle est présentée (invité ou profil). */
export interface QuizIdentity {
  readonly seatId: string;
  /** Pseudo proposé (invité) ou prénom du profil. */
  readonly name: string;
  /** Portrait (voir `AVATAR_IDS`). */
  readonly avatar: string;
  readonly grade: Grade;
  /** Équipe choisie (variante en équipes), sinon null. */
  readonly team: QuizTeam | null;
}

/** Joueur vu par l'écran hôte. */
export interface QuizPlayer extends QuizIdentity {
  /** Connexion perdue : « Déconnecté… ». */
  readonly away: boolean;
  readonly score: number;
  /** A répondu à la question en cours. */
  readonly answered: boolean;
  /** Réussite de la question, connue en phase `reveal` ; sinon null. */
  readonly correct: boolean | null;
  /** Sa question (chacun la sienne, selon sa classe). */
  readonly question: QuestionRef | null;
}

/** Mises en valeur de fin de partie : plus rapide, meilleure série, plus de diamants. */
export const QUIZ_AWARDS = ['fastest', 'streak', 'diamonds'] as const;
export type QuizAward = (typeof QUIZ_AWARDS)[number];

export interface QuizHighlight {
  readonly award: QuizAward;
  readonly seatId: string;
  /** Millisecondes (`fastest`), bonnes réponses d'affilée (`streak`) ou points (`diamonds`). */
  readonly value: number;
}

export interface QuizClock {
  /** Numéro de la question, à partir de 1. */
  readonly index: number;
  readonly total: number;
  /** Fin de la phase en cours (horodatage ms du serveur). */
  readonly deadline: number;
}

/** Vue complète, envoyée à l'écran hôte seulement. */
export interface QuizHostView {
  readonly code: string;
  readonly phase: QuizPhase;
  readonly mode: QuizMode;
  readonly subject: SubjectId | null;
  /** Matières proposées à toutes les classes présentes. */
  readonly subjects: readonly SubjectId[];
  readonly players: readonly QuizPlayer[];
  /** Null au salon et en fin de partie. */
  readonly clock: QuizClock | null;
  /** Scores d'équipe (moyenne des membres) ; vide en chacun pour soi. */
  readonly teams: readonly { readonly team: QuizTeam; readonly score: number }[];
  /** Renseignées en fin de partie. */
  readonly highlights: readonly QuizHighlight[];
}

/** Vue personnelle d'une manette : rien sur les autres joueurs. */
export interface QuizSeatView {
  readonly phase: QuizPhase;
  readonly mode: QuizMode;
  readonly me: QuizIdentity;
  readonly guest: boolean;
  /** Null au salon et en fin de partie. */
  readonly clock: QuizClock | null;
  readonly question: QuestionRef | null;
  readonly answered: boolean;
  /** Son résultat, en phase `reveal`. */
  readonly result: { readonly correct: boolean; readonly points: number } | null;
  readonly score: number;
  /** Ses mises en valeur, en fin de partie. */
  readonly awards: readonly QuizAward[];
}

/** Fin de la session pour un téléphone ou un écran : il vide son jeton. */
export type QuizClosedReason = 'host' | 'expired' | 'host-left' | 'kicked' | 'left' | 'disconnected';

// ——— Messages client → serveur (validés) ———

/** Hôte (écran TV) : matière et variante. */
export const QuizConfigureSchema = z.object({
  subject: z.enum(SUBJECT_IDS).optional(),
  mode: z.enum(QUIZ_MODES).optional(),
});
export type QuizConfigure = z.infer<typeof QuizConfigureSchema>;
export const QuizKickSchema = z.object({ seatId: z.uuid() });
export type QuizKick = z.infer<typeof QuizKickSchema>;

/** Profil inscrit : rejoindre une salle avec son code (les invités passent par `auth.guest`). */
export const QuizJoinSchema = z.object({ code: z.string().max(16) });
export type QuizJoin = z.infer<typeof QuizJoinSchema>;

/** Manette, au salon : nouveau pseudo tiré, avatar, classe, équipe. Aucun texte libre. */
export const QuizSetupSchema = z.object({
  rerollPseudo: z.literal(true).optional(),
  avatar: z
    .string()
    .refine((a) => GUEST_AVATARS.includes(a), 'Avatar inconnu')
    .optional(),
  grade: z.enum(GRADES).optional(),
  team: z.enum(QUIZ_TEAMS).optional(),
});
export type QuizSetup = z.infer<typeof QuizSetupSchema>;

export const QuizAnswerSchema = z.object({
  /** Numéro de la question répondue (une réponse en retard est ignorée). */
  index: z.number().int().min(1).max(QUIZ_QUESTIONS),
  response: ResponseSchema,
});
export type QuizAnswer = z.infer<typeof QuizAnswerSchema>;

export interface QuizClientEvents {
  // Écran hôte (écran TV de la famille).
  'quiz:open': () => void;
  'quiz:configure': (msg: QuizConfigure) => void;
  'quiz:kick': (msg: QuizKick) => void;
  /** Lance la partie, ou en relance une dans la même salle (« Rejouer »). */
  'quiz:start': () => void;
  'quiz:close': () => void;
  // Manettes (invités ou profils).
  'quiz:join': (msg: QuizJoin) => void;
  'quiz:setup': (msg: QuizSetup) => void;
  'quiz:answer': (msg: QuizAnswer) => void;
  'quiz:leave': () => void;
}

export interface QuizServerEvents {
  'quiz:host': (view: QuizHostView) => void;
  'quiz:seat': (view: QuizSeatView) => void;
  /** Place obtenue ; `token` (invités) sert à la reprendre après une coupure. */
  'quiz:joined': (msg: { readonly seatId: string; readonly token: string | null }) => void;
  /** `quiz:join` refusé (profil) ; message à afficher tel quel. */
  'quiz:refused': (message: string) => void;
  'quiz:closed': (reason: QuizClosedReason) => void;
}
