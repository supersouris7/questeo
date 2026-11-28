import { expect, test, type Page } from '@playwright/test';
import { createFirstProfile, signupFamily } from './family.ts';

const tabs = (page: Page) => page.getByRole('navigation', { name: 'Rubriques de l’Espace parent' });

test('Espace parent : navigation stable, chaque chemin reste dans l’espace, un seul retour au jeu', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await signupFamily(page);
  await page.getByPlaceholder('Ex. Léa').fill(`Par${Date.now() % 10000}`);
  await page.getByRole('button', { name: 'Une fille' }).click();
  await page.getByLabel('Date de naissance').fill('2014-03-09');
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await createFirstProfile(page);

  await page.goto('/parent');
  await expect(page.getByRole('heading', { level: 1, name: 'Progrès de vos enfants' })).toBeVisible();
  await expect(tabs(page).getByRole('link', { name: 'Progrès' })).toHaveAttribute('aria-current', 'page');

  // Chaque rubrique : titre clair, onglet courant, « Retour au jeu » toujours visible, URL sous /parent.
  for (const [tab, title] of [
    ['Abonnement', 'Abonnement familial'],
    ['Profils', 'Profils des enfants'],
    ['Réglages', 'Réglages'],
    ['Progrès', 'Progrès de vos enfants'],
  ] as const) {
    await tabs(page).getByRole('link', { name: tab }).click();
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(tabs(page).getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: 'Retour au jeu' })).toBeVisible();
    await expect(page).toHaveURL(/\/parent(\/|$)/);
  }

  // Détail d'un enfant, puis retour à la liste des enfants.
  await page.getByRole('link', { name: /Voir les progrès de/ }).click();
  await expect(page).toHaveURL(/\/parent\/enfant\//);
  await expect(tabs(page).getByRole('link', { name: 'Progrès' })).toHaveAttribute('aria-current', 'page');
  // Avancement par matière (comme les menus du jeu) ; un toucher ouvre le détail par chapitre.
  await page.getByRole('button', { name: /^Maths : \d+ notions? maîtrisées? sur \d+/ }).click();
  await expect(page.getByRole('heading', { name: 'Maths, chapitre par chapitre' })).toBeVisible();
  await page.getByRole('link', { name: /Tous les enfants/ }).click();
  await expect(page).toHaveURL(/\/parent$/);

  // Ajout d'un profil : on revient à la liste des profils, pas au jeu.
  await tabs(page).getByRole('link', { name: 'Profils' }).click();
  await page.getByRole('link', { name: 'Ajouter un enfant' }).click();
  await expect(page).toHaveURL(/\/parent\/profils\/nouveau$/);
  await page.getByPlaceholder('Ex. Léa').fill('Second');
  await page.getByRole('button', { name: 'Un garçon' }).click();
  await page.getByLabel('Date de naissance').fill('2012-05-01');
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await page.getByRole('button', { name: 'Ajouter cet enfant' }).click();
  await expect(page).toHaveURL(/\/parent\/profils$/);
  await expect(page.getByText('Second', { exact: true })).toBeVisible();

  // Retour de paiement et anciennes adresses : on reste dans l'Espace parent.
  await page.goto('/parent/abonnement?paiement=annule');
  await expect(page.getByText(/Paiement annulé/)).toBeVisible();
  await page.goto('/abonnement?paiement=ok');
  await expect(page).toHaveURL(/\/parent\/abonnement\?paiement=ok/);
  await expect(page.getByText(/Merci/)).toBeVisible();

  // Verrouiller : le code est redemandé sur place (pas de retour au jeu).
  await page.getByRole('button', { name: 'Verrouiller' }).click();
  await expect(page).toHaveURL(/\/parent\/abonnement/);
  await expect(page.getByLabel('Mot de passe du compte familial')).toBeVisible();

  // Le seul bouton qui sort : « Retour au jeu ».
  await page.getByRole('button', { name: 'Retour au jeu' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('Page d’un enfant épurée : synthèse, cartes matière, notions à renforcer ; aucune création d’entraînement', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await signupFamily(page);
  await page.getByPlaceholder('Ex. Léa').fill(`Epu${Date.now() % 10000}`);
  await page.getByRole('button', { name: 'Une fille' }).click();
  await page.getByLabel('Date de naissance').fill('2014-03-09');
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await createFirstProfile(page);
  // Côté enfant : plus d'encart « Ton parent te recommande ».
  await expect(page.getByRole('region', { name: 'Ton parent te recommande' })).toHaveCount(0);

  await page.goto('/parent');
  await page.getByRole('link', { name: /Voir les progrès de/ }).click();
  await expect(page.getByRole('heading', { name: 'Avancement' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Notions à renforcer' })).toBeVisible();
  for (const gone of ['Recommander un entraînement', 'Lancer la séance', 'Bilan de la semaine'])
    await expect(page.getByText(gone)).toHaveCount(0);
});
