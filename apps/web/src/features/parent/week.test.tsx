import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PARENT_ADVICE, type ParentWeek } from '@epicademie/shared';
import { emptyParentWeek, makeProfile } from '../../testing/fakeApi.ts';
import { renderApp } from '../../testing/renderApp.tsx';
import { adviceText, effortLines, feelingTrend } from './week.ts';

vi.mock('socket.io-client', async () => (await import('../../testing/fakeSocket.ts')).socketModule);

const LEA = makeProfile();
const TOM = makeProfile({ id: '22222222-2222-4222-8222-222222222222', name: 'Tom', gender: 'garcon' });

const week: ParentWeek = {
  today: '2026-11-20',
  gains: [
    {
      skillId: 'm5-tables',
      before: { day: '2026-11-06', correct: 1, answered: 4 },
      now: { day: '2026-11-20', correct: 3, answered: 4 },
    },
  ],
  effort: { series: 3, days: 2, reworked: ['m5-tables'], pauseDays: null },
  feelings: { week: { pasEncore: 0, unPeu: 1, oui: 4 }, before: { pasEncore: 2, unPeu: 1, oui: 0 }, trend: 'hausse' },
  advice: 'perseverance',
};

describe('la semaine en mots', () => {
  it('efforts : une ligne par effort, rien sans séance', () => {
    expect(effortLines({ series: 1, days: 1, reworked: ['a', 'b'], pauseDays: 9 })).toEqual([
      '1 série terminée · 1 jour d’entraînement',
      '2 notions retravaillées après un « pas encore »',
      'Reprise après 9 jours de pause',
    ]);
    expect(effortLines(emptyParentWeek().effort)).toEqual([]);
  });

  it('conseil : un texte pour chaque règle, accordé au profil, neutre sans genre', () => {
    for (const a of PARENT_ADVICE) expect(adviceText(a, 'Léa', 'fille')).toMatch(/Léa|l’effort/);
    expect(adviceText('perseverance', 'Léa', 'fille')).toContain('Léa est revenue sur');
    expect(adviceText('perseverance', 'Tom', 'garcon')).toContain('Tom est revenu sur');
    expect(adviceText('perseverance', 'Sam', null)).toContain(
      'Sam a repris une notion qui n’était pas réussie du premier coup.',
    );
    expect(adviceText('rassurer', 'Sam', null)).toContain('il est normal de douter quand on apprend');
    expect(adviceText('proposer', 'Sam', null)).toContain('Quelques minutes suffisent.');
  });

  it('tendance du ressenti : toujours par rapport à l’enfant lui-même', () => {
    const f = week.feelings;
    expect(feelingTrend(f, 'Léa')).toBe('Léa se sent plus capable qu’au cours des 4 semaines d’avant.');
    expect(feelingTrend({ ...f, trend: 'baisse' }, 'Léa')).toContain('un peu moins capable');
    expect(feelingTrend({ ...f, trend: 'stable' }, 'Léa')).toContain('stable');
    expect(feelingTrend({ ...f, trend: null }, 'Léa')).toContain('trop peu de réponses');
    const none = { pasEncore: 0, unPeu: 0, oui: 0 };
    expect(feelingTrend({ ...f, week: none }, 'Léa')).toBe('Pas de réponse ces 7 derniers jours.');
    expect(feelingTrend(emptyParentWeek().feelings, 'Léa')).toContain('Aucune réponse');
  });
});

describe('espace parent : la semaine', () => {
  const options = { profiles: [LEA, TOM], parentWeeks: { [LEA.id]: week } };

  it('liste : efforts et conseil en premier, enfant par enfant, sans classement', async () => {
    renderApp('/parent', options);
    const lea = await screen.findByRole('listitem', { name: 'Progrès de Léa' });
    expect(await within(lea).findByText('3 séries terminées · 2 jours d’entraînement')).toBeInTheDocument();
    expect(lea).toHaveTextContent('Conseil de la semaine : Félicitez l’effort');
    expect(within(lea).getAllByRole('heading')[1]).toHaveTextContent('Efforts de la semaine');
    const tom = screen.getByRole('listitem', { name: 'Progrès de Tom' });
    expect(await within(tom).findByText('Pas encore de séance ces 7 derniers jours.')).toBeInTheDocument();
    expect(tom).not.toHaveTextContent('Léa');
    // Ordre des profils, quels que soient les efforts.
    expect(screen.getAllByRole('listitem', { name: /^Progrès de/ })).toEqual([lea, tom]);
  });

  it('page d’un enfant : efforts d’abord, progrès, puis réponses aux smileys agrégées', async () => {
    renderApp(`/parent/enfant/${LEA.id}`, options);
    await screen.findByRole('region', { name: '« Je me sens capable ? »' });
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .slice(0, 3)
        .map((h) => h.textContent),
    ).toEqual(['Efforts de la semaine', 'Progrès de la semaine', '« Je me sens capable ? »']);
    const feelings = screen.getByRole('region', { name: '« Je me sens capable ? »' });
    expect(feelings).toHaveTextContent('Léa se sent plus capable');
    expect(within(feelings).getByRole('row', { name: /Oui/ })).toHaveTextContent('Oui40');
    expect(within(feelings).getByRole('row', { name: /Pas encore/ })).toHaveTextContent('Pas encore02');
    expect(screen.getByRole('region', { name: 'Progrès de la semaine' })).toHaveTextContent('1/4');
    expect(screen.queryByText(/Tom/)).not.toBeInTheDocument();
  });

  it('sans réponse : un message, pas de tableau', async () => {
    renderApp(`/parent/enfant/${TOM.id}`, options);
    const feelings = await screen.findByRole('region', { name: '« Je me sens capable ? »' });
    expect(feelings).toHaveTextContent('Aucune réponse pour l’instant');
    expect(within(feelings).queryByRole('table')).not.toBeInTheDocument();
  });
});
