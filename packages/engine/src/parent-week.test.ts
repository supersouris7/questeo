import { describe, expect, it } from 'vitest';
import type { Feeling } from '@epicademie/shared';
import { journey } from './journey.ts';
import type { AnswerFact } from './learning.ts';
import { feelingSummary, weeklyAdvice, type FeelingFact } from './parent-week.ts';

const TODAY = '2026-11-20';
const on = (day: string, ...feelings: Feeling[]): FeelingFact[] => feelings.map((feeling) => ({ day, feeling }));

const calm = feelingSummary([], TODAY);

describe('ressenti agrégé', () => {
  it('compte les 7 derniers jours et les 4 semaines d’avant, pas au-delà', () => {
    const facts = [
      ...on(TODAY, 3),
      ...on('2026-11-14', 1),
      ...on('2026-11-13', 2),
      ...on('2026-10-17', 2),
      ...on('2026-10-16', 1),
    ];
    expect(feelingSummary(facts, TODAY)).toEqual({
      week: { pasEncore: 1, unPeu: 0, oui: 1 },
      before: { pasEncore: 0, unPeu: 2, oui: 0 },
      trend: null,
    });
  });

  it.each([
    ['hausse', [3, 3, 2], [1, 2, 2]],
    ['stable', [2, 2, 2], [2, 2, 2]],
    ['baisse', [1, 1, 2], [3, 2, 2]],
  ] as const)('tendance %s à partir de 3 réponses de chaque côté', (trend, now, then) => {
    const facts = [...on(TODAY, ...now), ...on('2026-11-01', ...then)];
    expect(feelingSummary(facts, TODAY).trend).toBe(trend);
    expect(feelingSummary(facts.slice(1), TODAY).trend).toBeNull();
  });
});

describe('conseil de la semaine', () => {
  /** `right` réponses justes sur `total` pour une notion, le même jour. */
  const answers = (day: string, right: number, total: number): AnswerFact[] =>
    Array.from({ length: total }, (_, i) => ({
      skillId: 'm5-tables',
      attempt: 1,
      correct: i < right,
      hinted: false,
      collective: false,
      at: `${day}T10:00:0${i}.000Z`,
      day,
      mode: 'entrainement',
      diagnosis: null,
    }));
  /** La semaine telle que la calcule le progrès personnel, à partir des réponses. */
  const weekOf = (...facts: AnswerFact[][]) => journey({ facts: facts.flat(), seriesDays: [], today: TODAY });
  const low = feelingSummary(on(TODAY, 1, 1, 3), TODAY);
  // Hausse de la réussite sans pause : avant (13/11), puis cette semaine (15/11).
  const progress = weekOf(answers('2026-11-13', 1, 4), answers('2026-11-15', 3, 4));
  // Même hausse après 19 jours sans séance.
  const back = weekOf(answers('2026-11-01', 1, 4), answers(TODAY, 3, 4));

  it('proposer : aucune séance ces 7 jours, quel que soit le ressenti', () => {
    expect(weeklyAdvice(weekOf(), calm)).toBe('proposer');
    expect(weeklyAdvice(weekOf(answers('2026-11-01', 1, 4)), low)).toBe('proposer');
  });

  it('rassurer : passe avant la reprise et le progrès', () => {
    expect(weeklyAdvice(back, low)).toBe('rassurer');
  });

  it('reprise : après une pause, avant le progrès', () => {
    expect(back.effort.pauseDays).toBe(19);
    expect(back.gains).toHaveLength(1);
    expect(weeklyAdvice(back, calm)).toBe('reprise');
  });

  it('progrès : la réussite monte, avant la persévérance', () => {
    expect(progress.effort).toMatchObject({ reworked: ['m5-tables'], pauseDays: null });
    expect(weeklyAdvice(progress, calm)).toBe('progres');
  });

  it('persévérance : notion retravaillée sans hausse mesurée, avant la régularité', () => {
    const week = weekOf(answers('2026-11-15', 0, 1), answers('2026-11-17', 1, 1), answers('2026-11-19', 1, 1));
    expect(week).toMatchObject({ gains: [], effort: { days: 3, reworked: ['m5-tables'] } });
    expect(weeklyAdvice(week, calm)).toBe('perseverance');
  });

  it('régularité à partir de 3 jours, effort en dessous', () => {
    const days = ['2026-11-15', '2026-11-17', '2026-11-19'].map((day) => answers(day, 2, 2));
    expect(weeklyAdvice(weekOf(...days), calm)).toBe('regularite');
    expect(weeklyAdvice(weekOf(...days.slice(1)), calm)).toBe('effort');
  });

  it('un seul « pas encore » isolé ne suffit pas ; un recul du ressenti suffit', () => {
    const week = weekOf(answers(TODAY, 2, 2));
    expect(weeklyAdvice(week, feelingSummary(on(TODAY, 1), TODAY))).toBe('effort');
    const down = feelingSummary([...on(TODAY, 2, 2, 2), ...on('2026-11-01', 3, 3, 3)], TODAY);
    expect(weeklyAdvice(week, down)).toBe('rassurer');
  });
});
