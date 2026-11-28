import { getAnySkill } from '@epicademie/content';
import { SUBJECTS, type LearningReport, type Tally } from '@epicademie/shared';

/**
 * Lecture du suivi pour un parent : une phrase de synthèse et les notions à renforcer, sans
 * pourcentage de maîtrise. Fonctions pures, testées.
 */

export const subjectName = (id: string) => SUBJECTS.find((s) => s.id === id)?.name ?? id;
export const skillTitle = (id: string) => getAnySkill(id)?.title ?? id;

const successPhrase = (t: Tally) =>
  t.answered === 0
    ? 'pas encore réussie'
    : `${t.autonomous} réussite${t.autonomous > 1 ? 's' : ''} sans aide sur ${t.answered}`;

/** Phrase de synthèse : où en est l'enfant, à partir de la matière où il a le plus avancé. */
export function synthesis(
  name: string,
  bars: readonly { readonly name: string; readonly acquired: number; readonly total: number }[],
): string {
  const best = [...bars].sort((a, b) => b.acquired - a.acquired)[0];
  if (!best || best.acquired === 0) return `${name} commence son aventure : aucune notion maîtrisée pour l’instant.`;
  const verb = best.acquired * 3 >= best.total ? 'avance bien' : 'avance';
  return `${name} ${verb} en ${best.name.toLowerCase()} : ${best.acquired} notion${best.acquired > 1 ? 's' : ''} maîtrisée${best.acquired > 1 ? 's' : ''} sur ${best.total}.`;
}

/** Seuil : en dessous de 80 % de réussite sans aide (au moins 3 réponses), la notion est fragile. */
const WEAK_RATE = 0.8;
const MIN_ANSWERS = 3;
const REVIEW_COUNT = 3;

export interface ReviewItem {
  readonly skillId: string;
  readonly title: string;
  readonly subject: string;
  /** Raison courte, lisible par un parent. */
  readonly reason: string;
}

const reasonFor = (s: LearningReport['skills'][number]): string => {
  const error = s.recurringErrors[0]?.text;
  if (error) return `Erreur fréquente : ${error}`;
  if (s.trend === 'baisse') return `En baisse récemment (${successPhrase(s.tally)})`;
  return s.tally.answered === 0 ? 'Pas encore réussie' : `Souvent besoin d’aide (${successPhrase(s.tally)})`;
};

/** « Notions à renforcer » : les 3 notions les plus fragiles (à travailler d'abord, puis les moins réussies seul). */
export function toReview(r: LearningReport): ReviewItem[] {
  const rank = (id: string) => {
    const i = r.toRework.indexOf(id);
    return i < 0 ? r.toRework.length : i;
  };
  const rate = (s: LearningReport['skills'][number]) => (s.tally.answered ? s.tally.autonomous / s.tally.answered : 0);
  return r.skills
    .filter((s) => s.status === 'a-travailler' || (s.tally.answered >= MIN_ANSWERS && rate(s) < WEAK_RATE))
    .sort(
      (a, b) =>
        Number(b.status === 'a-travailler') - Number(a.status === 'a-travailler') ||
        rank(a.skillId) - rank(b.skillId) ||
        rate(a) - rate(b),
    )
    .slice(0, REVIEW_COUNT)
    .map((s) => ({
      skillId: s.skillId,
      title: skillTitle(s.skillId),
      subject: subjectName(s.subject),
      reason: reasonFor(s),
    }));
}
