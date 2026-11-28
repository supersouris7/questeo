import { expect, test, type Page } from '@playwright/test';
import { createFirstProfile, loginFamily, PASSWORD, signOut, signupFamily } from './family.ts';

/** Crée le 1er profil depuis l'écran de création qui suit l'inscription. */
async function createProfile(page: Page, name: string, birthDate = '2014-03-09') {
  await page.getByPlaceholder('Ex. Léa').fill(name);
  await page.getByRole('button', { name: 'Une fille' }).click();
  await page.getByLabel('Date de naissance').fill(birthDate);
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await createFirstProfile(page);
}

test('Compte : déconnexion de l’appareil, reconnexion, profils et progrès retrouvés', async ({ page }) => {
  const email = await signupFamily(page);
  const name = `Cpt${Date.now() % 10000}`;
  await createProfile(page, name);
  await page.goto('/parametres');
  await signOut(page);
  await expect(page).toHaveURL(/\/connexion$/);
  await loginFamily(page, email);
  await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();
});

test('Espace parent : enfant listé, accès à l’abonnement familial', async ({ page }) => {
  await signupFamily(page);
  const name = `Par${Date.now() % 10000}`;
  await createProfile(page, name);
  await page.goto('/parent');
  await expect(page.getByRole('heading', { name: 'Progrès de vos enfants' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: `Progrès de ${name}` })).toBeVisible();
  await page.getByRole('link', { name: 'Abonnement', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Abonnement actif' })).toBeVisible();

  // Code PIN : choisi dans les Réglages parent (mot de passe du compte), puis l'Espace parent s'ouvre avec.
  await page.getByRole('link', { name: 'Réglages' }).click();
  await page.getByRole('button', { name: 'Choisir un code PIN' }).click();
  await page.getByLabel('Mot de passe du compte').fill(PASSWORD);
  await page.getByLabel(/Nouveau code PIN/).fill('2580');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Code PIN enregistré.')).toBeVisible();
  await page.getByRole('button', { name: 'Verrouiller' }).click();
  for (const k of ['2', '5', '8', '0']) await page.getByRole('button', { name: k, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Réglages' })).toBeVisible();
  await page.getByRole('link', { name: 'Progrès', exact: true }).click();
  await expect(page.getByRole('listitem', { name: `Progrès de ${name}` })).toBeVisible();
});

test('Espace parent : la semaine d’abord, puis les réponses « Je me sens capable ? »', async ({ page }) => {
  await signupFamily(page);
  const name = `Sem${Date.now() % 10000}`;
  await createProfile(page, name);
  // Une série terminée avec sa réponse, posée directement par l'API (le jeu est couvert par training.spec).
  const headers = { origin: new URL(page.url()).origin };
  const profiles = (await (await page.request.get('/api/v1/profiles')).json()) as { id: string; name: string }[];
  const profileId = profiles.find((p) => p.name === name)?.id;
  const created = await page.request.post('/api/v1/sessions', {
    headers,
    data: { profileId, mode: 'entrainement', subject: 'maths', chapterId: 'm5-calcul', skillId: 'm5-tables' },
  });
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  expect((await page.request.post(`/api/v1/sessions/${id}/finish`, { headers })).status()).toBe(200);
  const rated = await page.request.post(`/api/v1/sessions/${id}/feeling`, { headers, data: { feeling: 3 } });
  expect(rated.status()).toBe(204);

  await page.goto('/parent');
  const card = page.getByRole('listitem', { name: `Progrès de ${name}` });
  await expect(card.getByRole('heading', { name: 'Efforts de la semaine' })).toBeVisible();
  await expect(card.getByText(/Conseil de la semaine/)).toBeVisible();
  await card.getByRole('link', { name: /Voir les progrès de/ }).click();
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('Efforts de la semaine');
  const feelings = page.getByRole('region', { name: '« Je me sens capable ? »' });
  await expect(feelings.getByRole('row', { name: /Oui/ }).getByRole('cell').first()).toHaveText('1');
  await expect(page.getByRole('heading', { name: 'Notions à renforcer' })).toBeVisible();
});

test('Adulte : parcours de remise à niveau en maths', async ({ page }) => {
  await signupFamily(page);
  await page.getByPlaceholder('Ex. Léa').fill(`Adu${Date.now() % 10000}`);
  await page.getByRole('button', { name: 'Une fille' }).click();
  await page.getByLabel('Date de naissance').fill('1985-05-01');
  await expect(page.getByText('C’est un adulte ?')).toBeVisible();
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await createFirstProfile(page);
  await page.goto('/jouer/entrainement/maths');
  const grades = page.getByRole('radiogroup', { name: 'Classe' });
  await expect(grades.getByRole('radio', { name: /Adulte/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: /Nombres entiers et décimaux/ }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: /Pythagore/ }).last()).toBeVisible();
});

test('Anglais : chapitre du prétérit jouable', async ({ page }) => {
  await signupFamily(page);
  await createProfile(page, `Eng${Date.now() % 10000}`);
  await page.getByRole('button', { name: /Entraînement/ }).click();
  await page.getByRole('button', { name: 'Anglais', exact: true }).click();
  await page
    .getByRole('button', { name: /Le prétérit/ })
    .last()
    .click();
  await page
    .getByRole('button', { name: /Épreuve du chapitre|prétérit/i })
    .first()
    .click();
  await expect(page.getByRole('progressbar', { name: 'Progression de la série' })).toBeVisible();
  // La question est tirée au hasard : on vérifie le chapitre joué, pas les mots de l’énoncé.
  await expect(page).toHaveURL(/\/partie\/entrainement\/a5-verbes-irreguliers\//);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
});

test('Mes progrès : trophées et badges visibles dès le départ', async ({ page }) => {
  await signupFamily(page);
  await createProfile(page, `Pro${Date.now() % 10000}`);
  await page.goto('/progres');
  await page.getByRole('button', { name: /Trophées, badges et inventaire/ }).click();
  await expect(page.getByRole('heading', { name: 'Trophées et badges' }).first()).toBeVisible();
  await expect(page.getByText(/Acad-Héros trouvés/)).toHaveCount(0);
  await expect(page.getByText('Chasseur de boss').first()).toBeVisible();
});

test('Sens et progrès : « Pourquoi apprendre ça ? » puis son propre chemin', async ({ page }) => {
  await signupFamily(page);
  await createProfile(page, `Sen${Date.now() % 10000}`);
  await page.goto('/jouer/entrainement/maths/m6-numeration');
  const why = page.getByRole('region', { name: 'Pourquoi apprendre ça ?' });
  await expect(why).toContainText('Un peu d’histoire');
  await page.goto('/progres');
  await expect(page.getByRole('region', { name: 'Tes efforts de la semaine' })).toContainText('Une première série');
  await expect(page.getByRole('region', { name: 'Ton chemin' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Ce que tu sais maintenant faire' })).toContainText(
    'Ta première notion',
  );
});

test('Mise en page : aucun défilement horizontal sur les écrans principaux', async ({ page }) => {
  await signupFamily(page);
  await createProfile(page, `Lay${Date.now() % 10000}`);
  for (const path of [
    '/hub',
    '/progres',
    '/heros',
    '/multi',
    '/jouer/entrainement/maths',
    '/parent/abonnement',
    '/parent',
    '/parent/profils',
    '/parent/reglages',
    '/tv',
  ]) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
});

test('Vocabulaire : le dictionnaire explique « quotient » avec la division posée et le partage', async ({ page }) => {
  await signupFamily(page);
  await createProfile(page, `Voc${Date.now() % 10000}`);
  // Le dictionnaire n'est plus dans le menu ; la page reste accessible par son adresse.
  await page.goto('/dictionnaire');
  await page.getByRole('button', { name: 'quotient', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Le mot « quotient »' });
  await expect(dialog.getByLabel('Division de 23 par 5 expliquée en image')).toBeVisible();
  await expect(dialog.getByText('4 paquets', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'J’ai compris' }).click();
  await page.getByRole('button', { name: /cm² \(centimètre carré\)/ }).click();
  await expect(page.getByRole('dialog').getByLabel(/le lien entre cm, cm² et cm³/)).toBeVisible();
});
