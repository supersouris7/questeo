import { z } from 'zod';
import type { QuestionRef } from './party.ts';
import { ResponseSchema } from './play.ts';
import type { HeroId } from './profile.ts';
import { SUBJECT_IDS, type SubjectId } from './subjects.ts';

/**
 * Contrats du Duel à distance (docs/adr/0040-duel-et-quiz-tv.md) : deux joueurs liés répondent en
 * même temps, chacun à des questions de sa classe ; une bonne réponse tire sur l'adversaire.
 * Aucune logique ici : types, schémas des messages entrants et paramètres. Délai de reconnexion :
 * `MATCH_GRACE_MS`.
 */

export const DUEL_LIVES = 5;
export const DUEL_ROUNDS_TO_WIN = 2;
export const DUEL_ROUND_SECONDS = 150;
/** Temps par question ; écoulé : tir dévié. */
export const DUEL_QUESTION_SECONDS = 30;
/** Bonnes réponses d'affilée qui donnent un bouclier (un seul à la fois). */
export const DUEL_SHIELD_STREAK = 3;
/** Pause entre deux manches. */
export const DUEL_ROUND_BREAK_SECONDS = 6;
/** Invitation sans réponse : elle expire. */
export const DUEL_INVITE_TTL_MS = 60_000;
/** « Revanche ? » reste proposée ce temps. */
export const DUEL_REMATCH_TTL_MS = 60_000;

/** Salon (invitation envoyée), partie, entre deux manches, fin. */
export type DuelPhase = 'lobby' | 'playing' | 'round-over' | 'over';
export type DuelSide = 'you' | 'opponent';

export interface DuelFighter {
  readonly id: string;
  readonly name: string;
  readonly hero: HeroId;
  readonly lives: number;
  readonly shield: boolean;
  readonly roundsWon: number;
  /** Connexion perdue : « Déconnecté… ». */
  readonly away: boolean;
}

export interface DuelQuestion extends QuestionRef {
  /** Numéro de la question du joueur : une réponse en retard est ignorée. */
  readonly seq: number;
  /** Fin du temps de réponse (horodatage ms du serveur). */
  readonly deadline: number;
}

/** Dernier tir (à animer) : touché, arrêté par le bouclier, ou dévié (mauvaise réponse, temps). */
export interface DuelShot {
  /** Numéro croissant dans le duel : un même tir n'est animé qu'une fois. */
  readonly n: number;
  readonly by: DuelSide;
  readonly outcome: 'hit' | 'blocked' | 'missed';
}

/** Bilan personnel (jamais celui de l'adversaire). */
export interface DuelSummary {
  readonly hits: number;
  readonly shields: number;
  readonly correct: number;
}

/** État du duel vu par un joueur (`you`). */
export interface DuelView {
  readonly id: string;
  readonly subject: SubjectId;
  readonly phase: DuelPhase;
  readonly you: DuelFighter;
  readonly opponent: DuelFighter;
  /** Numéro de la manche, à partir de 1. */
  readonly round: number;
  /** Fin de la manche (ou de la pause) ; null au salon et en fin de partie. */
  readonly deadline: number | null;
  /** Sa question en cours. */
  readonly question: DuelQuestion | null;
  readonly lastShot: DuelShot | null;
  /** Gagnant de la manche terminée (`both` : égalité parfaite). */
  readonly roundWinner: DuelSide | 'both' | null;
  /** En fin de partie : `match` (jouée jusqu'au bout) ou `opponent-left` (aucun vainqueur). */
  readonly end: 'match' | 'opponent-left' | null;
  /** Vainqueur du match ; null en cas d'égalité ou de départ. */
  readonly winner: DuelSide | null;
  readonly summary: DuelSummary | null;
  /** Revanche proposée : qui l'a acceptée, et jusqu'à quand. */
  readonly rematch: { readonly deadline: number; readonly you: boolean; readonly opponent: boolean } | null;
}

export interface DuelInvite {
  readonly duelId: string;
  readonly from: { readonly id: string; readonly name: string; readonly hero: HeroId };
  readonly subject: SubjectId;
}

// ——— Messages client → serveur (validés) ———

/** Matières communes avec ce joueur ? (réponse : `duel:subjects`) */
export const DuelSubjectsRequestSchema = z.object({ to: z.uuid() });
export type DuelSubjectsRequest = z.infer<typeof DuelSubjectsRequestSchema>;
export const DuelChallengeSchema = z.object({ to: z.uuid(), subject: z.enum(SUBJECT_IDS) });
export type DuelChallenge = z.infer<typeof DuelChallengeSchema>;
export const DuelRespondSchema = z.object({ duelId: z.uuid(), accept: z.boolean() });
export type DuelRespond = z.infer<typeof DuelRespondSchema>;
export const DuelAnswerSchema = z.object({ seq: z.number().int().nonnegative(), response: ResponseSchema });
export type DuelAnswer = z.infer<typeof DuelAnswerSchema>;

export interface DuelClientEvents {
  'duel:subjects': (msg: DuelSubjectsRequest) => void;
  'duel:challenge': (msg: DuelChallenge) => void;
  'duel:respond': (msg: DuelRespond) => void;
  'duel:answer': (msg: DuelAnswer) => void;
  /** Accepte la revanche (elle part quand les deux l'ont acceptée). */
  'duel:rematch': () => void;
  'duel:leave': () => void;
}

export interface DuelServerEvents {
  duel: (view: DuelView) => void;
  'duel:invite': (invite: DuelInvite) => void;
  'duel:subjects': (msg: { readonly to: string; readonly subjects: readonly SubjectId[] }) => void;
  /** Duel effacé (invitation refusée ou expirée, départ). */
  'duel:closed': (duelId: string) => void;
}
