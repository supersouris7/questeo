import { chaptersOf, createRng, maxLevelOf, type Level } from '@epicademie/content';
import {
  FALLBACK_GRADE,
  playedGrade,
  SUBJECTS,
  type Grade,
  type QuestionRef,
  type SubjectId,
} from '@epicademie/shared';

/**
 * « Questions de sa classe » (Duel et Quiz TV, docs/adr/0040) : pour une matière et une classe,
 * les notions des chapitres que la famille qui paie peut jouer, puis un tirage reproductible par
 * graine. Fonctions pures : le droit d'accès (abonnement) est fourni par l'appelant.
 */

/** Classe jouée en salle : « adulte » et classe inconnue prennent la classe de repli. */
export const roomGrade = (grade: Grade | null | undefined): Grade =>
  grade === 'adulte' ? FALLBACK_GRADE : playedGrade(grade);

/** La famille qui paie peut-elle jouer ce chapitre ? (même signature que le contrôle d'accès) */
export type CanPlay = (chapterId: string) => Promise<boolean>;

/** Réserve de notions d'une matière pour une classe, limitée aux chapitres jouables. */
export async function classPool(subject: SubjectId, grade: Grade | null, canPlay: CanPlay): Promise<string[]> {
  const chapters = chaptersOf(subject, roomGrade(grade));
  const allowed = await Promise.all(chapters.map((c) => canPlay(c.id)));
  return chapters.filter((_, i) => allowed[i]).flatMap((c) => c.skills.map((s) => s.id));
}

/**
 * Question tirée de la réserve : la même graine donne la même notion ; le niveau demandé est borné
 * à celui de la notion. Réserve vide : null.
 */
export function drawFromPool(pool: readonly string[], seed: number, level: Level): QuestionRef | null {
  if (pool.length === 0) return null;
  const skillId = createRng(seed).pick(pool);
  return { skillId, level: Math.min(level, maxLevelOf(skillId)) as Level, seed };
}

/** Matières ouvertes qui ont des notions pour chacune des classes présentes. */
export function commonSubjects(grades: readonly (Grade | null)[]): SubjectId[] {
  if (grades.length === 0) return [];
  return SUBJECTS.filter(
    (s) => s.available && grades.every((g) => chaptersOf(s.id, roomGrade(g)).some((c) => c.skills.length > 0)),
  ).map((s) => s.id);
}
