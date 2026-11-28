import type { FeelingCounts, Feeling, Journey, ParentAdvice, ParentWeek, Trend } from '@epicademie/shared';
import { JOURNEY_WINDOW_DAYS } from './journey.ts';
import { daysBetween } from './srs.ts';

/**
 * Semaine d'un enfant vue par son parent : ressenti « Je me sens capable ? » agrégé et conseil
 * d'encouragement. Règles fixes, fonctions pures ; l'enfant n'est comparé qu'à lui-même.
 */

/** Période de comparaison du ressenti : les 4 semaines qui précèdent la semaine en cours. */
export const FEELING_HISTORY_DAYS = JOURNEY_WINDOW_DAYS + 28;
/** En dessous de ce nombre de réponses d'un côté, aucune tendance n'est annoncée. */
const MIN_ANSWERS = 3;
/** Écart de note moyenne (échelle 1 à 3) à partir duquel la tendance change. */
const TREND_GAP = 0.3;
/** Jours d'entraînement à partir desquels la régularité est saluée. */
const REGULAR_DAYS = 3;

export interface FeelingFact {
  /** Jour de fin de la série. */
  readonly day: string;
  readonly feeling: Feeling;
}

const tallyFeelings = (list: readonly FeelingFact[]): FeelingCounts => ({
  pasEncore: list.filter((f) => f.feeling === 1).length,
  unPeu: list.filter((f) => f.feeling === 2).length,
  oui: list.filter((f) => f.feeling === 3).length,
});

const average = (list: readonly FeelingFact[]) => list.reduce((sum, f) => sum + f.feeling, 0) / list.length;

function trendOf(week: readonly FeelingFact[], before: readonly FeelingFact[]): Trend | null {
  if (week.length < MIN_ANSWERS || before.length < MIN_ANSWERS) return null;
  const gap = average(week) - average(before);
  if (gap >= TREND_GAP) return 'hausse';
  return gap <= -TREND_GAP ? 'baisse' : 'stable';
}

export function feelingSummary(facts: readonly FeelingFact[], today: string): ParentWeek['feelings'] {
  const age = (f: FeelingFact) => daysBetween(f.day, today);
  const week = facts.filter((f) => age(f) < JOURNEY_WINDOW_DAYS);
  const before = facts.filter((f) => age(f) >= JOURNEY_WINDOW_DAYS && age(f) < FEELING_HISTORY_DAYS);
  return { week: tallyFeelings(week), before: tallyFeelings(before), trend: trendOf(week, before) };
}

/** « Pas encore » majoritaire sur au moins 2 réponses cette semaine, ou ressenti en recul. */
const needsComfort = ({ week, trend }: ParentWeek['feelings']) => {
  const total = week.pasEncore + week.unPeu + week.oui;
  return trend === 'baisse' || (total >= 2 && week.pasEncore * 2 > total);
};

/** Un seul conseil par semaine : la première règle qui s'applique. */
export function weeklyAdvice({ effort, gains }: Journey, feelings: ParentWeek['feelings']): ParentAdvice {
  if (effort.series === 0 && effort.days === 0) return 'proposer';
  if (needsComfort(feelings)) return 'rassurer';
  if (effort.pauseDays !== null) return 'reprise';
  // Un progrès suppose une notion retravaillée : testé après, il ne serait jamais choisi.
  if (gains.length > 0) return 'progres';
  if (effort.reworked.length > 0) return 'perseverance';
  return effort.days >= REGULAR_DAYS ? 'regularite' : 'effort';
}
