import { expect, test } from '@playwright/test';
import { createFirstProfile, signupFamily } from './family.ts';

test('Entraînement : série complète de tables, correction, leçon et résultats', async ({ page }) => {
  test.setTimeout(60_000); // série complète : 5 questions + variantes
  await signupFamily(page);
  await page.getByPlaceholder('Ex. Léa').fill(`Jeu${Date.now() % 10000}`);
  await page.getByRole('button', { name: 'Une fille' }).click();
  await page.getByLabel('Date de naissance').fill('2014-03-09');
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await createFirstProfile(page);

  await page.getByRole('button', { name: /Entraînement/ }).click();
  // C'est ici qu'on gagne son équipement (dès le choix de la matière).
  await expect(page.getByText('Entraîne-toi, gagne des médailles et des coffres !')).toBeVisible();
  await expect(page.getByRole('note')).toContainText(/Une série sans faute t’offre un coffre/);
  await page.getByRole('button', { name: 'Maths', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Entraînement · Maths/ })).toBeVisible();
  // On peut s'entraîner sur le programme d'une autre classe ; la sienne (5e) est cochée par défaut.
  const grades = page.getByRole('radiogroup', { name: 'Classe' });
  await expect(grades.getByRole('radio', { name: /5e/ })).toHaveAttribute('aria-checked', 'true');
  await grades.getByRole('radio', { name: /6e/ }).click();
  await expect(page.getByRole('button', { name: /Nombres entiers et décimaux/ }).last()).toBeVisible();
  await expect(page).toHaveURL(/classe=6e/);
  await grades.getByRole('radio', { name: /5e/ }).click();
  // Nouveau joueur : l'appli propose par où commencer.
  await page.getByRole('button', { name: /Je te propose · par où commencer Calcul mental/ }).click();
  await page.getByRole('button', { name: /Tables de multiplication/ }).click();

  // 1re réponse fausse : Questy donne un indice et on réessaie la même question.
  await expect(page.getByRole('progressbar', { name: 'Progression de la série' })).toBeVisible();
  // Aide à tout moment, sans coût : explication complète puis retour à la même question.
  await page.getByRole('button', { name: 'Explique-moi' }).click();
  await page.getByRole('dialog', { name: 'Explication complète' }).getByRole('button', { name: 'J’essaie' }).click();
  const wrong = async () => {
    await page.getByRole('button', { name: 'Moins' }).click();
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  };
  await wrong();
  await expect(page.getByText(/Essaie encore !/)).toBeVisible();
  // 2e erreur : explication de Questy, bulle par bulle, et mémo à la demande.
  await wrong();
  const explanation = page.getByRole('region', { name: 'Explication de Questy' });
  await expect(explanation).toContainText('Tu as répondu −1');
  await expect(explanation).toContainText('La bonne réponse');
  // L'explication ne se passe pas : « Suivant » à chaque étape, puis une question du même type est proposée.
  await expect(page.getByRole('button', { name: 'Oui, j’essaie' })).toBeHidden();
  const more = page.getByRole('button', { name: /^Suivant/ });
  while (await more.isVisible()) await more.click();
  await page.getByRole('button', { name: 'Le truc à retenir' }).click();
  await expect(page.getByRole('dialog')).toContainText('Tables de multiplication');
  await page.getByRole('button', { name: /J’ai compris/ }).click();
  await page.getByRole('button', { name: 'Oui, j’essaie' }).click();
  await expect(page.getByText('Question similaire', { exact: true })).toBeVisible();

  // Le bilan reçoit un coffre (forcé ici, le tirage est aléatoire) : il s'ouvre en plein écran au toucher.
  await page.route('**/api/v1/sessions/*/finish', async (route) => {
    const res = await route.fetch();
    const json = (await res.json()) as Record<string, unknown>;
    await route.fulfill({
      response: res,
      json: { ...json, chest: { rarity: 'rare', items: { bouclier: 1 }, coins: 10, rubies: 0 } },
    });
  });

  // On répond « −1 » (toujours faux) jusqu'à la fin de la série : 5 questions + 3 variantes au plus.
  // Touche de validation : « OK », ou « ? » tant que rien n'est saisi.
  const ok = page.getByRole('button', { name: /^(OK|Je ne sais pas : un indice)$/ });
  const next = page.getByRole('button', { name: /^Suivant|^Continuer$|^Oui, j’essaie$/ });
  const end = page.getByText(/On s’accroche/);
  for (let i = 0; i < 80; i++) {
    await expect(ok.or(next).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await ok.isVisible()) {
      await wrong();
      await expect(next.or(page.getByText(/Essaie encore !/))).toBeVisible();
      continue;
    }
    const last = /Continuer|essaie/.test((await next.textContent()) ?? '');
    await next.click();
    if (last) await expect(next).toBeHidden();
  }
  const chest = page.getByRole('dialog', { name: 'Un coffre d’équipement !' });
  await expect(chest).toBeVisible();
  await chest.getByRole('button', { name: 'Ouvrir le coffre' }).click();
  const opened = page.getByRole('dialog', { name: 'Coffre rare' });
  await expect(opened).toContainText('Bouclier +1');
  await expect(opened).toContainText('+10 pièces');
  await opened.getByRole('button', { name: 'Continuer' }).click();
  await expect(opened).toHaveCount(0);
  await expect(page.getByText(/On s’accroche/)).toBeVisible();
  await expect(page.getByText('0/5')).toBeVisible();
  await expect(page.getByText(/réessaie dès/)).toBeVisible();
  // Écran suivant : récapitulatif des erreurs avec la bonne réponse.
  await page.getByRole('button', { name: 'Suite' }).click();
  await expect(page.getByText(/Pas encore réussies \(\d+\)/)).toBeVisible();
  await expect(page.getByText(/Bonne réponse :/).first()).toBeVisible();
  // Fin de séance : « Je me sens capable ? », 3 smileys assez grands pour un doigt.
  const feeling = page.getByRole('group', { name: 'Je me sens capable ?' });
  await expect(feeling.getByText('Tes parents verront tes réponses.')).toBeVisible();
  const some = feeling.getByRole('button', { name: 'Un peu' });
  expect((await some.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await some.click();
  await expect(feeling.getByRole('status')).toHaveText('Merci, c’est noté !');

  // La notion apparaît « à revoir » demain : pas encore échue aujourd'hui, mais évaluée.
  await page.getByRole('button', { name: 'Autre notion' }).click();
  await expect(page.getByRole('button', { name: /Tables de multiplication/ })).toContainText('À renforcer');
});

test('outils : calculatrice, brouillon, tableau de conversion', async ({ page }) => {
  test.setTimeout(60_000); // inscription, profil et trois outils : dépassait 30 s sur machine chargée
  await signupFamily(page);
  await page.getByPlaceholder('Ex. Léa').fill(`Outil${Date.now() % 10000}`);
  await page.getByRole('button', { name: 'Un garçon' }).click();
  await page.getByLabel('Date de naissance').fill('2013-05-20');
  await expect(page.getByText('Votre enfant est en 4e ?')).toBeVisible();
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await createFirstProfile(page);
  // Toutes les classes du CM1 à la 3e ont leur programme : plus de message « arrive bientôt ».
  await expect(page.getByText(/arrive bientôt/)).toHaveCount(0);

  // Aire du disque : Questy conseille la calculatrice ; elle remplace le pavé dans la zone d'outils.
  await page.goto('/partie/entrainement/m5-espace/m5-disque');
  await expect(page.getByText('Tu peux t’aider de la calculatrice.')).toBeVisible();
  await page.getByRole('tab', { name: 'Calculatrice' }).click();
  const panel = page.getByRole('tabpanel');
  for (const k of ['Pi', '×', '2', '5', '=']) await panel.getByRole('button', { name: k, exact: true }).click();
  await expect(panel).toContainText('78,539816');
  await page.getByRole('button', { name: 'Envoyer 78,539816 dans ma réponse' }).click();
  await expect(page.getByRole('tab', { name: 'Répondre' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Ta réponse')).toHaveText('78,539816');
  await expect(page.getByRole('button', { name: /^(OK|Je ne sais pas : un indice)$/ })).toBeVisible();

  // Brouillon : on dessine, on change d'onglet, le dessin est conservé.
  await page.getByRole('tab', { name: 'Brouillon' }).click();
  const canvas = page.getByRole('img', { name: /Zone de brouillon/ });
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 60, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeEnabled();
  await page.getByRole('tab', { name: 'Calculatrice' }).click();
  await page.getByRole('tab', { name: 'Brouillon' }).click();
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeEnabled();
  // Pleine page : l'énoncé reste en haut, le dessin est conservé.
  await page.getByRole('button', { name: 'Pleine page' }).click();
  const full = page.getByRole('dialog', { name: 'Brouillon pleine page' });
  await expect(full).toContainText('arrondie au dixième');
  await expect(full.getByRole('button', { name: 'Annuler' })).toBeEnabled();
  await full.getByRole('button', { name: 'Réduire' }).click();
  await expect(full).toBeHidden();
  // La réponse envoyée depuis la calculatrice est toujours là.
  await page.getByRole('tab', { name: 'Répondre' }).click();
  await expect(page.getByLabel('Ta réponse')).toHaveText('78,539816');

  // Tableau de conversion à remplir, unités de l'énoncé surlignées.
  await page.goto('/partie/entrainement/m5-espace/m5-conversions-volume');
  await page.getByRole('tab', { name: 'Conversion' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('dm');
  await page.getByRole('button', { name: 'Case 4' }).click();
  await page.getByRole('tabpanel').getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button', { name: 'Virgule' }).click();
  await expect(page.getByRole('button', { name: 'Case 4' })).toHaveText('2');
  await page.getByRole('button', { name: 'Envoyer 2 dans ma réponse' }).click();
  await expect(page.getByLabel('Ta réponse')).toHaveText('2');

  // Pause aux couleurs de l'appli.
  // Pause : même bouton qu'au combat, menu Reprendre / Quitter.
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Pause' })).toContainText('cette série ne sera pas comptée');
  await page.getByRole('button', { name: 'Reprendre' }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Quitter la série' }).click();
  await expect(page).toHaveURL(/\/hub$/);

  // Parcours dans l'appli : « précédent » pendant la série demande confirmation ;
  // après « Quitter », « précédent » ramène à la liste des notions, pas dans la partie.
  await page.getByRole('button', { name: /^Entraînement/ }).click();
  await page.getByRole('button', { name: 'Maths', exact: true }).click();
  await page.getByRole('button', { name: /^Multiplier et diviser des relatifs \d/ }).click();
  await page
    .getByRole('button', { name: /Produit de deux relatifs|Multiplier/ })
    .first()
    .click();
  await expect(page.getByRole('progressbar', { name: 'Progression de la série' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('alertdialog', { name: 'Pause' })).toBeVisible();
  await page.getByRole('button', { name: 'Reprendre' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Pause' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Quitter la série' }).click();
  await expect(page).toHaveURL(/\/hub$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/jouer\/entrainement\/maths\/m4-relatifs/, { timeout: 10_000 });
  await expect(page.getByRole('progressbar', { name: 'Progression de la série' })).toHaveCount(0);

  // Tables : brouillon disponible, pas de calculatrice ni de conseil.
  await page.goto('/partie/entrainement/m5-calcul/m5-tables');
  await expect(page.getByRole('tab', { name: 'Brouillon' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Calculatrice' })).toHaveCount(0);
  await expect(page.getByRole('note')).toHaveCount(0);

  // Puissances : calculer un carré n'est pas l'objectif, la calculatrice est là.
  await page.goto('/partie/entrainement/m5-puissances/m5-puissances-expressions');
  await expect(page.getByRole('tab', { name: 'Calculatrice' })).toBeVisible();

  // Priorités opératoires : le brouillon est conseillé.
  await page.goto('/partie/entrainement/m5-operations/m5-priorites');
  await expect(page.getByText('Je te conseille de faire un brouillon pour cette question.')).toBeVisible();
});
