import type { Feeling, Gender, ParentAdvice, ParentWeek } from '@epicademie/shared';

/**
 * Semaine d'un enfant, en mots pour son parent : efforts, ressenti et conseil d'encouragement.
 * Fonctions pures. L'enfant n'est comparé qu'à lui-même.
 */

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Accord selon le profil ; sans genre renseigné, `neutral` (tournure sans accord). */
const accord = (gender: Gender | null, boy: string, girl: string, neutral: string) =>
  gender === 'garcon' ? boy : gender === 'fille' ? girl : neutral;

/** Efforts de la semaine, une ligne chacun (liste vide : pas de séance). */
export function effortLines({ series, days, reworked, pauseDays }: ParentWeek['effort']): string[] {
  if (series === 0 && days === 0) return [];
  return [
    `${plural(series, 'série terminée', 'séries terminées')} · ${plural(days, 'jour d’entraînement', 'jours d’entraînement')}`,
    ...(reworked.length > 0
      ? [`${plural(reworked.length, 'notion retravaillée', 'notions retravaillées')} après un « pas encore »`]
      : []),
    ...(pauseDays === null ? [] : [`Reprise après ${pauseDays} jours de pause`]),
  ];
}

export function adviceText(advice: ParentAdvice, name: string, gender: Gender | null): string {
  const back = accord(gender, 'est revenu sur', 'est revenue sur', 'a repris');
  const texts: Record<ParentAdvice, string> = {
    proposer: `Pas de séance ces 7 derniers jours : proposez à ${name} un court moment ensemble, sans reproche. Quelques minutes suffisent.`,
    rassurer: `Rassurez ${name} : il est normal de douter quand on apprend. Demandez ce qui l’aiderait, puis saluez chaque essai.`,
    reprise: `${name} a repris après une pause : dites que cela vous fait plaisir, sans revenir sur les jours sans séance.`,
    perseverance: `Félicitez l’effort plutôt que la note : ${name} ${back} une notion qui n’était pas réussie du premier coup.`,
    progres: `Demandez à ${name} de vous expliquer une notion qui progresse : votre intérêt met en valeur le chemin parcouru.`,
    regularite: `Saluez la régularité de ${name} : revenir plusieurs jours dans la semaine est un bel effort.`,
    effort: `Félicitez l’effort plutôt que la note : demandez à ${name} ce qui a été essayé cette semaine.`,
  };
  return texts[advice];
}

export const FEELINGS: readonly {
  readonly value: Feeling;
  readonly key: keyof ParentWeek['feelings']['week'];
  readonly face: string;
  readonly label: string;
}[] = [
  { value: 3, key: 'oui', face: '😄', label: 'Oui' },
  { value: 2, key: 'unPeu', face: '🙂', label: 'Un peu' },
  { value: 1, key: 'pasEncore', face: '😕', label: 'Pas encore' },
];

export const answersIn = (c: ParentWeek['feelings']['week']) => c.oui + c.unPeu + c.pasEncore;

/** Tendance du ressenti, comparé à celui des 4 semaines d'avant. */
export function feelingTrend({ week, before, trend }: ParentWeek['feelings'], name: string): string {
  if (answersIn(week) === 0)
    return answersIn(before) === 0
      ? 'Aucune réponse pour l’instant : la question est posée à la fin d’une série d’entraînement.'
      : 'Pas de réponse ces 7 derniers jours.';
  if (trend === 'hausse') return `${name} se sent plus capable qu’au cours des 4 semaines d’avant.`;
  if (trend === 'baisse')
    return `${name} se sent un peu moins capable qu’au cours des 4 semaines d’avant : un encouragement compte.`;
  if (trend === 'stable') return 'Ressenti stable par rapport aux 4 semaines d’avant.';
  return 'Encore trop peu de réponses pour voir une tendance.';
}
