import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { chaptersOf } from '@epicademie/content';
import { SUBJECTS, type LearningReport } from '@epicademie/shared';
import { emptyLearning, FAKE_PASSWORD } from '../../testing/fakeApi.ts';
import { renderApp } from '../../testing/renderApp.tsx';
import { synthesis, toReview } from './summary.ts';
import { masteredPhrase, subjectBars } from './subjectProgress.ts';

vi.mock('socket.io-client', async () => (await import('../../testing/fakeSocket.ts')).socketModule);

const tally = (answered: number, autonomous: number, helped = 0, collective = 0) => ({
  answered,
  autonomous,
  helped,
  hints: helped,
  collective,
});
const week = (date: string, t: ReturnType<typeof tally>) => ({
  week: date,
  tally: t,
  modes: ['entrainement' as const],
});

/** Enfant qui a joué : une notion à retravailler, une acquise, deux semaines d'activité. */
const report: LearningReport = {
  ...emptyLearning(),
  tally: tally(14, 9, 2),
  lastActivity: '2026-11-19T17:00:00.000Z',
  subjects: [
    {
      subject: 'maths',
      tally: tally(14, 9, 2),
      statuses: { 'non-commencee': 0, 'a-travailler': 1, 'en-progression': 0, 'a-consolider': 0, acquise: 1 },
    },
  ],
  chapters: [
    {
      chapterId: 'm5-calcul',
      subject: 'maths',
      tally: tally(14, 9, 2),
      statuses: { 'non-commencee': 0, 'a-travailler': 1, 'en-progression': 0, 'a-consolider': 0, acquise: 1 },
    },
  ],
  skills: [
    {
      skillId: 'm5-priorites',
      chapterId: 'm5-calcul',
      subject: 'maths',
      status: 'a-travailler',
      tally: tally(6, 2, 2),
      recentRate: 0.33,
      trend: 'baisse',
      lastPracticed: '2026-11-19T17:00:00.000Z',
      nextReview: '2026-11-20',
      recurringErrors: [{ text: 'La multiplication passe avant l’addition.', count: 3 }],
    },
    {
      skillId: 'm5-tables',
      chapterId: 'm5-calcul',
      subject: 'maths',
      status: 'acquise',
      tally: tally(8, 7),
      recentRate: 0.9,
      trend: 'stable',
      lastPracticed: '2026-11-18T17:00:00.000Z',
      nextReview: '2026-12-18',
      recurringErrors: [],
    },
  ],
  toRework: ['m5-priorites'],
  dueReviews: ['m5-priorites'],
  weeks: [week('2026-11-09', tally(4, 1)), week('2026-11-16', tally(10, 8, 2, 1))],
};

describe('lecture du suivi pour un parent', () => {
  it('« Notions à renforcer » : notions fragiles d’abord, 3 au plus, avec matière et raison courte', () => {
    expect(toReview(report)).toEqual([
      {
        skillId: 'm5-priorites',
        title: 'Priorités opératoires',
        subject: 'Maths',
        reason: 'Erreur fréquente : La multiplication passe avant l’addition.',
      },
    ]);
    expect(toReview(emptyLearning())).toEqual([]);
    const many: LearningReport = {
      ...report,
      skills: ['a', 'b', 'c', 'd'].map((id) => ({
        ...report.skills[0]!,
        skillId: id,
        recurringErrors: [],
        trend: null,
      })),
    };
    expect(toReview(many)).toHaveLength(3);
    expect(toReview(many)[0]?.reason).toBe('Souvent besoin d’aide (2 réussites sans aide sur 6)');
  });

  it('synthèse : une phrase à partir de la matière la plus avancée', () => {
    const bar = (acquired: number, total: number) => ({ name: 'Maths', acquired, total });
    expect(synthesis('Léa', [bar(12, 30)])).toBe('Léa avance bien en maths : 12 notions maîtrisées sur 30.');
    expect(synthesis('Léa', [bar(1, 30)])).toBe('Léa avance en maths : 1 notion maîtrisée sur 30.');
    expect(synthesis('Léa', [bar(0, 30)])).toContain('aucune notion maîtrisée');
    expect(synthesis('Léa', [])).toContain('aucune notion maîtrisée');
  });
});

const gold = {
  skillId: 'm5-tables',
  stage: 3,
  due: null,
  lastPracticed: '2026-11-19',
  attempts: 10,
  correct: 9,
  recent: [true, true],
  maintained: 1,
  best: 5,
} as const;

describe('avancement par matière', () => {
  it('mêmes calculs que les menus : notions or, chapitres, matières à venir masquées', () => {
    const bars = subjectBars('5e', [gold], [], report);
    // Liste déduite du catalogue : un lot de contenu peut ouvrir une matière en 5e.
    const shown = SUBJECTS.filter((s) => s.available && chaptersOf(s.id, '5e').length > 0);
    expect(bars.map((b) => b.id)).toEqual(shown.map((s) => s.id));
    const maths = bars.find((b) => b.id === 'maths');
    expect(maths?.acquired).toBe(1);
    expect(maths?.total).toBeGreaterThan(1);
    expect(maths?.chapters.find((c) => c.id === 'm5-calcul')?.acquired).toBe(1);
    expect(maths?.toRework).toEqual(['Priorités opératoires']);
    expect(maths?.relic.won).toBe(0);
    expect(masteredPhrase(1, 12)).toBe('1 notion maîtrisée sur 12');
    expect(masteredPhrase(3, 12)).toBe('3 notions maîtrisées sur 12');
  });

  it('carte matière, puis détail par chapitre au toucher', async () => {
    const { user } = renderApp('/parent/enfant/11111111-1111-4111-8111-111111111111', {
      learning: report,
      skills: [gold],
    });
    const card = await screen.findByRole('button', { name: /^Maths/ });
    expect(card).toHaveTextContent(/1 notion maîtrisée sur \d+/);
    expect(screen.queryByText(/chapitre par chapitre/)).not.toBeInTheDocument();
    await user.click(card);
    expect(await screen.findByText('Maths, chapitre par chapitre')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar', { name: /^Notions maîtrisées, chapitre/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: 'Détail Maths' })).toHaveTextContent(
      'À retravailler : Priorités opératoires',
    );
  });
});

describe('espace parent', () => {
  it('mot de passe demandé, puis carte de chaque enfant et détail', async () => {
    const { user } = renderApp('/parent', { parent: false, learning: report, skills: [gold] });
    await user.type(await screen.findByLabelText(/Mot de passe/), FAKE_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Ouvrir l’Espace parent' }));
    const card = await screen.findByRole('listitem', { name: 'Progrès de Léa' });
    expect(await within(card).findByRole('button', { name: /Maths/ })).toBeInTheDocument();
    // Colonnes réglées sur la largeur de la carte enfant (la mise en page elle-même est vérifiée en e2e tablette).
    const list = within(card).getByRole('list', { name: 'Avancement par matière' });
    expect(list).toHaveClass('@min-[26rem]:grid-cols-2');
    expect(list.parentElement).toHaveClass('@container');
    expect(card).toHaveTextContent('Notions à renforcer : Priorités opératoires');
    await user.click(within(card).getByRole('link', { name: /Voir les progrès/ }));
    expect(
      await screen.findByText('Léa avance en maths : 1 notion maîtrisée sur', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notions à renforcer' })).toBeInTheDocument();
    expect(screen.getByText(/Erreur fréquente : La multiplication/)).toBeInTheDocument();
    // Lecture seule : ni graphique, ni détail par notion, ni création d'entraînement.
    for (const gone of [/Bilan de la semaine/, /Préparer une séance/, /Par matière/, /recommand/i])
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /séance|recommand/i })).not.toBeInTheDocument();
  });

  it('code PIN : l’Espace parent s’ouvre avec les 4 chiffres, et « Verrouiller » le referme', async () => {
    const { user } = renderApp('/parent', { parent: false, pin: '2580', learning: report });
    expect(await screen.findByText('Code PIN parent')).toBeInTheDocument();
    for (const k of ['1', '1', '1', '1']) await user.click(screen.getByRole('button', { name: k }));
    expect(await screen.findByRole('alert')).toHaveTextContent('incorrect');
    for (const k of ['2', '5', '8', '0']) await user.click(screen.getByRole('button', { name: k }));
    expect(await screen.findByRole('listitem', { name: 'Progrès de Léa' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Verrouiller' }));
    // Reste dans l'Espace parent : le code est redemandé, sans retour au jeu.
    expect(await screen.findByText('Code PIN parent')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nouveau joueur/ })).not.toBeInTheDocument();
  });

  it('onglets : où suis-je, et chaque rubrique reste dans l’Espace parent', async () => {
    const { user } = renderApp('/parent', { learning: report });
    const tabs = await screen.findByRole('navigation', { name: 'Rubriques de l’Espace parent' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Progrès', 'Abonnement', 'Profils', 'Réglages']);
    expect(within(tabs).getByRole('link', { name: 'Progrès' })).toHaveAttribute('aria-current', 'page');
    for (const [name, heading] of [
      ['Abonnement', 'Abonnement familial'],
      ['Profils', 'Profils des enfants'],
      ['Réglages', 'Réglages'],
    ] as const) {
      await user.click(
        within(screen.getByRole('navigation', { name: 'Rubriques de l’Espace parent' })).getByRole('link', { name }),
      );
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      const nav = screen.getByRole('navigation', { name: 'Rubriques de l’Espace parent' });
      expect(within(nav).getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'Retour au jeu' })).toBeInTheDocument();
    }
  });

  it('« Retour au jeu » est le seul bouton qui quitte l’Espace parent', async () => {
    const { user } = renderApp('/parent', { learning: report });
    await user.click(await screen.findByRole('button', { name: 'Retour au jeu' }));
    expect(await screen.findByRole('button', { name: /Nouveau joueur/ })).toBeInTheDocument();
  });

  it('profils : amis validés ici ; ajouter un enfant ramène à la liste des profils, pas au jeu', async () => {
    const { user } = renderApp('/parent/profils', { learning: report });
    expect(await screen.findByRole('heading', { name: 'Amis d’autres familles' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Ajouter un enfant' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ajouter un enfant' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Ex. Léa'), 'Tom');
    await user.click(screen.getByRole('button', { name: 'Un garçon' }));
    await user.type(screen.getByLabelText('Date de naissance'), '2014-03-09');
    await user.click(await screen.findByRole('button', { name: 'Oui' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter cet enfant' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Profils des enfants' })).toBeInTheDocument();
    expect(await screen.findByText('Tom')).toBeInTheDocument();
  });

  it('réglages : le code PIN se choisit dans l’Espace parent', async () => {
    renderApp('/parent/reglages');
    expect(await screen.findByRole('button', { name: 'Choisir un code PIN' })).toBeInTheDocument();
  });

  describe('suppression du compte famille', () => {
    it('liste ce qui est effacé, propose le téléchargement, puis double confirmation', async () => {
      const created = vi.fn(() => 'blob:export');
      vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: created, revokeObjectURL: vi.fn() }));
      const { user, server } = renderApp('/parent/reglages');
      await user.click(await screen.findByRole('link', { name: 'Supprimer le compte famille' }));
      expect(await screen.findByRole('heading', { level: 1, name: 'Supprimer le compte famille' })).toBeInTheDocument();
      expect(screen.getByText(/les profils des enfants/)).toBeInTheDocument();
      const submit = screen.getByRole('button', { name: 'Supprimer définitivement' });
      expect(submit).toBeDisabled();
      await user.click(screen.getByRole('button', { name: 'Télécharger les données' }));
      expect(await screen.findByText('Données téléchargées.')).toBeInTheDocument();
      expect(created).toHaveBeenCalled();
      await user.type(screen.getByLabelText(/Écris SUPPRIMER/), 'supprimer');
      await user.type(screen.getByLabelText('Mot de passe du compte'), FAKE_PASSWORD);
      expect(submit).toBeDisabled();
      await user.clear(screen.getByLabelText(/Écris SUPPRIMER/));
      await user.type(screen.getByLabelText(/Écris SUPPRIMER/), 'SUPPRIMER');
      await user.click(submit);
      expect(await screen.findByRole('heading', { name: /Épicadémie|Bienvenue/i })).toBeInTheDocument();
      expect(server.calls.some((c) => c.path === '/family/delete')).toBe(true);
    });

    it('mauvais mot de passe : message d’erreur, le compte reste', async () => {
      const { user } = renderApp('/parent/reglages/supprimer');
      await user.type(await screen.findByLabelText(/Écris SUPPRIMER/), 'SUPPRIMER');
      await user.type(screen.getByLabelText('Mot de passe du compte'), 'mauvais');
      await user.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Mot de passe incorrect.');
    });
  });
});
