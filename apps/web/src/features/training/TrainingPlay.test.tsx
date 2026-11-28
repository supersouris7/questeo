import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { generate, type Question } from '@epicademie/content';
import { renderApp } from '../../testing/renderApp.tsx';

vi.mock('socket.io-client', async () => (await import('../../testing/fakeSocket.ts')).socketModule);

const PATH = '/partie/entrainement/m5-calcul/m5-tables';
/** Touche de validation : « OK », ou « ? » (« Je ne sais pas : un indice ») tant que rien n'est saisi. */
const ANSWER_KEY = /^(OK|Je ne sais pas : un indice)$/;

/** Saisit un nombre au pavé et valide. */
async function answer(user: ReturnType<typeof renderApp>['user'], text: string) {
  for (const key of text) await user.click(screen.getByRole('button', { name: key === '-' ? 'Moins' : key }));
  await user.click(screen.getByRole('button', { name: 'OK' }));
}

/** Question de la dernière réponse envoyée au serveur (pour trouver la bonne réponse). */
function lastQuestion(server: ReturnType<typeof renderApp>['server']): Question {
  const sent = server.calls.filter((c) => c.path.endsWith('/answers')).at(-1)?.body as
    { skillId: string; level: 1 | 2 | 3; seed: number } | undefined;
  if (!sent) throw new Error('aucune réponse envoyée');
  return generate(sent.skillId, sent.level, sent.seed);
}
const rightAnswer = (q: Question) => (q.answer.kind === 'number' ? q.answer.value.n.toString() : '');

describe('partie d’entraînement', () => {
  it('pause : Recommencer relance la même série, sans bilan ni confirmation', async () => {
    const { user, server } = renderApp(PATH);
    await screen.findByRole('button', { name: ANSWER_KEY });
    const starts = () => server.calls.filter((c) => c.path.endsWith('/sessions') && c.method === 'POST').length;
    const before = starts();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Pause' });
    const names = within(dialog)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual(['Reprendre', 'Recommencer', 'Quitter la série']);
    await user.click(within(dialog).getByRole('button', { name: 'Recommencer' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await screen.findByRole('button', { name: ANSWER_KEY });
    await waitFor(() => expect(starts()).toBe(before + 1));
    expect(server.calls.some((c) => c.path.endsWith('/finish'))).toBe(false);
  });

  it('« Quitter » : confirmation, puis retour au menu principal', async () => {
    const { user } = renderApp(PATH);
    await screen.findByRole('button', { name: ANSWER_KEY });
    await user.click(screen.getByRole('button', { name: 'Quitter' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Quitter la série ?' });
    await user.click(within(dialog).getByRole('button', { name: 'Quitter la série' }));
    expect(await screen.findByRole('group', { name: 'Mon joueur' })).toBeInTheDocument();
    // La partie quittée est marquée pour cet onglet : les tests suivants repartent à neuf.
    sessionStorage.clear();
  });

  it('erreur, indice, 2e essai réussi, puis série complète jusqu’au bilan', { timeout: 90_000 }, async () => {
    const { user, server } = renderApp(PATH);
    expect(await screen.findByRole('progressbar', { name: 'Progression de la série' })).toBeInTheDocument();
    await screen.findByRole('button', { name: ANSWER_KEY });

    // 1re erreur : indice de Questy, on réessaie la même question.
    await answer(user, '-1');
    expect(await screen.findByText(/Essaie encore !/)).toBeInTheDocument();
    await answer(user, rightAnswer(lastQuestion(server)));
    // Bonne réponse : pas de bouton, on passe tout seul à la suite.
    expect(await screen.findByText('Bien rattrapé !')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Suivant/ })).not.toBeInTheDocument();

    // Puis, à chaque question : une erreur (indice), et la bonne réponse au 2e essai.
    const finished = () => server.calls.some((c) => c.path.endsWith('/finish'));
    for (let i = 0; i < 30 && !finished(); i++) {
      const step = screen.queryByRole('button', { name: /^Suivant|^Continuer$|Oui, j’essaie/ });
      if (step) {
        await user.click(step);
        continue;
      }
      const ok = await screen.findByRole('button', { name: ANSWER_KEY }, { timeout: 4000 }).catch(() => null);
      if (!ok) continue;
      await answer(user, '-1');
      if (await screen.findByText(/Essaie encore !/).catch(() => null))
        await answer(user, rightAnswer(lastQuestion(server)));
      await waitFor(() => expect(screen.queryByRole('button', { name: ANSWER_KEY })).not.toBeInTheDocument());
    }
    expect(finished()).toBe(true);
    // Bilan : 1re réponse fausse à chaque question.
    expect(await screen.findByText(/On s’accroche/)).toBeInTheDocument();
  });

  it('indice et explication à tout moment : sans coût, jamais une erreur', async () => {
    const { user, server } = renderApp(PATH);
    await screen.findByRole('button', { name: ANSWER_KEY });
    const sentAnswers = () => server.calls.filter((c) => c.path.endsWith('/answers'));
    // « ? » : l'indice tout de suite, sans confirmation ni réponse envoyée.
    await user.click(screen.getByRole('button', { name: 'Je ne sais pas : un indice' }));
    expect(await screen.findByText('Indice :')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Explique-moi' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Explication complète' })).getByRole('button', { name: 'J’essaie' }),
    );
    expect(sentAnswers()).toHaveLength(0);
    expect(screen.queryByText(/erreur/i)).not.toBeInTheDocument();
    await answer(user, '-1');
    expect(await screen.findByText(/Essaie encore !/)).toBeInTheDocument();
    expect(sentAnswers().at(-1)?.body).toMatchObject({ helped: true, attempt: 1 });
  });

  it('Épreuve du chapitre : indice seulement avant la réponse', async () => {
    const { user } = renderApp('/partie/entrainement/m5-calcul/epreuve');
    await screen.findByRole('button', { name: ANSWER_KEY });
    expect(screen.queryByRole('button', { name: 'Explique-moi' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Un indice' }));
    expect(await screen.findByText('Indice :')).toBeInTheDocument();
  });

  it('serveur injoignable au démarrage : message et retour à l’accueil', async () => {
    renderApp(PATH, {
      setup: (server) =>
        server.override('startSession', () => {
          throw new Error('panne');
        }),
    });
    expect(await screen.findByText(/Le serveur est-il joignable/)).toBeInTheDocument();
    expect(within(document.body).getByRole('button', { name: /Retour à l’accueil/ })).toBeInTheDocument();
  });

  it('révisions du jour : proposées sur la page de la matière, série sur les notions dues', async () => {
    const recent = Array.from({ length: 10 }, () => true);
    const { user, server } = renderApp('/jouer/entrainement/maths', {
      skills: [
        // Due depuis une semaine : à réviser.
        {
          skillId: 'm5-tables',
          stage: 2,
          due: '2026-01-01',
          attempts: 10,
          correct: 10,
          recent,
          maintained: 0,
          best: 5,
          lastPracticed: '2025-12-25',
        },
      ],
    });
    await user.click(await screen.findByRole('button', { name: /Révisions du jour/ }));
    await screen.findByRole('progressbar', { name: 'Progression de la série' });
    const started = server.calls.find((c) => c.path === '/sessions');
    expect(started?.body).toMatchObject({ chapterId: 'revisions', subject: 'maths', skillId: 'm5-tables' });
  });

  it('pas de révision due : pas de bouton, et l’adresse directe ramène à la matière', async () => {
    renderApp('/partie/entrainement/revisions/maths', { skills: [] });
    expect(await screen.findByRole('heading', { name: /Entraînement · Maths/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Révisions du jour/ })).not.toBeInTheDocument();
  });

  it('Épreuve du chapitre : bouton expliqué, série de 10 questions, démarrée comme épreuve', async () => {
    const { user, server } = renderApp('/jouer/entrainement/maths/m5-calcul');
    const exam = await screen.findByRole('button', { name: /Épreuve du chapitre/ });
    expect(exam).toHaveTextContent('Réussis 80 % pour valider le chapitre et gagner son coffre');
    expect(screen.queryByText(/Tout le chapitre/)).not.toBeInTheDocument();
    await user.click(exam);
    await screen.findByRole('progressbar', { name: 'Progression de la série' });
    const started = server.calls.find((c) => c.path === '/sessions');
    expect(started?.body).toMatchObject({ chapterId: 'm5-calcul', skillId: null, epreuve: true });
  });

  it('Épreuve pas encore réussie : pas de coffre, conseil sur la notion à renforcer', { timeout: 90_000 }, async () => {
    const { user, server } = renderApp('/partie/entrainement/m5-calcul/epreuve', {
      epreuve: { passed: false, weakestSkillId: 'm5-tables' },
    });
    await screen.findByRole('button', { name: ANSWER_KEY });
    const finished = () => server.calls.some((c) => c.path.endsWith('/finish'));
    for (let i = 0; i < 80 && !finished(); i++) {
      const step = screen.queryByRole('button', { name: /^Suivant|^Continuer$|Oui, j’essaie/ });
      if (step) {
        await user.click(step);
        continue;
      }
      const ok = await screen.findByRole('button', { name: ANSWER_KEY }, { timeout: 4000 }).catch(() => null);
      if (!ok) continue;
      await answer(user, '-1');
      if (await screen.findByText(/Essaie encore !/).catch(() => null)) await answer(user, '-1');
      await waitFor(() => expect(screen.queryByRole('button', { name: ANSWER_KEY })).not.toBeInTheDocument());
    }
    expect(finished()).toBe(true);
    // Étape valorisée avant le seuil, avec ce qu'il reste à faire.
    expect(await screen.findByText('Premier pas fait !')).toBeInTheDocument();
    expect(screen.getByText(/son coffre est à toi\. Encore \d+ bonnes réponses et tu y es/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suite' }));
    expect(await screen.findByText(/c’est ta notion à renforcer/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /S’entraîner sur cette notion/ })).toBeInTheDocument();
  });
});

describe('fin de séance : sens et « Je me sens capable ? »', () => {
  it(
    'après une réussite : une phrase de sens ; puis 3 smileys, envoyés avec la séance',
    { timeout: 90_000 },
    async () => {
      const summary = (correct: number) => ({
        regular: { answered: 5, correct },
        variants: { answered: 0, correct: 0 },
        scoreOn20: 4 * correct,
        xpGained: 0,
        coinsGained: 0,
        perfect: false,
        levelBefore: 1,
        levelAfter: 1,
        chest: null,
        skills: ['m6-rang', 'm6-arrondir'].map((skillId, i) => ({
          skillId,
          answered: 4,
          correct: i === 0 ? correct : 0,
          stageBefore: 0,
          stageAfter: 1,
          bestBefore: 0,
          bestAfter: 0,
          due: null,
        })),
      });
      const { user, server } = renderApp(PATH, {
        setup: (s) => s.override('finishSession', () => summary(3)),
      });
      await screen.findByRole('button', { name: ANSWER_KEY });
      const finished = () => server.calls.some((c) => c.path.endsWith('/finish'));
      for (let i = 0; i < 80 && !finished(); i++) {
        const step = screen.queryByRole('button', { name: /^Suivant|^Continuer$|Oui, j’essaie/ });
        if (step) {
          await user.click(step);
          continue;
        }
        const ok = await screen.findByRole('button', { name: ANSWER_KEY }, { timeout: 4000 }).catch(() => null);
        if (!ok) continue;
        await answer(user, '-1');
        if (await screen.findByText(/Essaie encore !/).catch(() => null)) await answer(user, '-1');
        await waitFor(() => expect(screen.queryByRole('button', { name: ANSWER_KEY })).not.toBeInTheDocument());
      }
      // Une seule notion réussie : une seule phrase.
      expect(await screen.findByText(/Avec un boulier ou un abaque/)).toBeInTheDocument();
      expect(screen.getAllByText(/^(À quoi ça sert|Le sais-tu \?|Qui s’en sert|Un peu d’histoire)$/)).toHaveLength(1);
      await user.click(screen.getByRole('button', { name: 'Suite' }));
      const question = await screen.findByRole('group', { name: 'Je me sens capable ?' });
      const smileys = within(question).getAllByRole('button');
      expect(smileys.map((b) => b.textContent)).toEqual(['😕Pas encore', '🙂Un peu', '😄Oui']);
      expect(question).toHaveTextContent('Tes parents verront tes réponses.');
      await user.click(within(question).getByRole('button', { name: 'Oui' }));
      expect(await within(question).findByText('Merci, c’est noté !')).toBeInTheDocument();
      expect(within(question).getByRole('button', { name: 'Oui' })).toHaveAttribute('aria-pressed', 'true');
      expect(server.feelings).toEqual([3]);
    },
  );
});
