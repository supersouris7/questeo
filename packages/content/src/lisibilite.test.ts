import { describe, expect, it } from 'vitest';
import { getAnySkill, chapterOfAnySkill } from './catalog.ts';
import {
  analyzeCatalog,
  analyzeSkill,
  memoIssues,
  questionIssues,
  saysWhatToDo,
  sentences,
  toTsv,
  undefinedWords,
  wordCount,
} from './lisibilite.ts';
import type { Question, Skill } from './types.ts';

const question = (over: Partial<Question> = {}): Question => ({
  skillId: 'x',
  level: 1,
  seed: 1,
  prompt: 'Calcule 6 × 7.',
  answer: { kind: 'number', value: { n: 42, d: 1 } },
  traps: [],
  steps: ['Regarde la table de 6.', 'Avance jusqu’à 7 fois.', 'Écris le résultat : **42**.'],
  hint: 'Pense à la table de 6.',
  targetSeconds: 10,
  ...over,
});

const skill = (memo: string[]): Skill => ({
  id: 'x',
  title: 'x',
  lesson: { memo, source: 's' },
  generate: () => question(),
});

describe('détecteur : mesures', () => {
  it('compte les mots, pas les nombres ni les calculs', () => {
    expect(wordCount('Calcule {3/4} + 12 × 5 = **27** m^2.')).toBe(1);
    expect(sentences('Regarde bien : compte les parts. Puis écris.')).toHaveLength(3);
  });

  it('reconnaît une bulle qui dit quoi faire', () => {
    expect(saysWhatToDo('Regarde le nombre du bas.')).toBe(true);
    expect(saysWhatToDo('Le total est 8, puis enlève 3.')).toBe(true);
    expect(saysWhatToDo('Le dénominateur dit la taille des parts.')).toBe(false);
  });

  it('une explication conforme ne déclenche rien', () => {
    expect(questionIssues(question(), 'cm1')).toEqual([]);
  });

  it('signale le nombre d’étapes, les bulles chargées ou sans action', () => {
    expect(questionIssues(question({ steps: ['Calcule.'] }), 'cm1')).toContain('etapes-nombre');
    const chargee = 'Regarde. Compte. Écris.';
    expect(questionIssues(question({ steps: [chargee, chargee, chargee] }), 'cm1')).toContain('bulle-chargee');
    expect(questionIssues(question({ steps: ['C’est 42.', 'Voilà.', 'Fin.'] }), 'cm1')).toContain('bulle-sans-action');
  });

  it('la longueur permise des phrases monte avec l’âge', () => {
    const hint = 'Pense à la grande table que tu as apprise avec ta classe pendant toute la semaine dernière.';
    expect(questionIssues(question({ hint }), 'cm1')).toContain('phrase-longue');
    expect(questionIssues(question({ hint }), '3e')).not.toContain('phrase-longue');
  });

  it('signale les consignes sans verbe, les énoncés longs et les propositions identiques', () => {
    expect(questionIssues(question({ prompt: '6 × 7' }), 'cm1')).toContain('consigne-sans-verbe');
    expect(questionIssues(question({ prompt: `Calcule ${'très '.repeat(60)}vite.` }), 'cm1')).toContain('enonce-long');
    const answer = { kind: 'choice' as const, options: ['a', ' a', 'b'], correct: 0 };
    expect(questionIssues(question({ answer }), 'cm1')).toContain('distracteur-double');
  });

  it('mémo de plus de 3 phrases, mot difficile non défini, trop peu de variantes', () => {
    expect(memoIssues(skill(['Un. Deux.', 'Trois. Quatre.']), 'cm1')).toEqual(['memo-long']);
    expect(undefinedWords(['Lis l’abscisse.'], 'maths', [])).toEqual(['abscisse']);
    expect(undefinedWords(['Lis l’abscisse.'], 'maths')).toEqual([]);
    const report = analyzeSkill(skill(['Un.']), { id: 'c', subject: 'maths', grade: 'cm1' });
    expect(report.counts).toEqual({ 'peu-de-variantes': 3 });
  });
});

/** Notions déjà reprises : le détecteur ne doit plus rien y signaler (bloquant). */
const REPRISES = [
  'fcm1-types-phrases',
  'fcm1-poser-question',
  'fcm1-forme-negative',
  'fcm1-forme-exclamative',
  'fcm1-ponctuation-fin',
  'm5-euclide',
  'm6-fraction-quotient',
  'm6-boss-fractions-gateau',
  'm5-relatifs-droite',
  'm5-relatifs-sommes',
  'm5-boss-relatifs-piege-comparer',
  'mcm1-conversions-contenance',
  'mcm2-conversions-contenance',
  'mcm1-boss-mental-piege',
  'mcm2-boss-mental-piege',
  'mcm1-estimer',
  'mcm2-estimer',
  'm5-boss-operations-cinema',
  'm5-fractions-entier',
  'm5-fractions-addition',
  'm5-fractions-soustraction',
  'm5-fractions-problemes',
  'm5-boss-fractions-piege-comparer',
  'm5-boss-fractions-reste',
  'm6-arrondir',
  'p5-etats',
  'hcm1-traces',
  'hcm1-heritages',
  'hcm1-mouvements',
  'hcm1-clovis-charlemagne',
];

describe('détecteur : catalogue', () => {
  it.each(REPRISES)('%s : plus aucun signalement', (id) => {
    const found = getAnySkill(id);
    const chapter = chapterOfAnySkill(id);
    expect(found && chapter).toBeTruthy();
    const report = analyzeSkill(found!, chapter!);
    expect({ counts: report.counts, words: report.words }).toEqual({ counts: {}, words: [] });
  });

  it(
    'mode avertissement : liste triée par matière et classe, sans bloquer',
    { timeout: 120_000 },
    async ({ annotate }) => {
      const reports = analyzeCatalog();
      const lines = toTsv(reports).trim().split('\n');
      expect(lines[0]).toContain('matiere\tclasse');
      expect(lines).toHaveLength(reports.length + 1);
      const subjects = reports.map((r) => r.subject);
      expect(subjects).toEqual([...subjects].sort((a, b) => a.localeCompare(b)));
      if (reports.length > 0) await annotate(`Détecteur : ${reports.length} notions à reprendre.`, 'warning');
    },
  );
});
