import type { Skill } from '../types.ts';
import { notionGuidee, type NotionGuidee } from './avant-la-france-guide.ts';
import { PREUVES as P } from './le-temps-des-rois-sources.ts';

/**
 * CM1, thème 2 « Le temps des rois » (lot hi-cm1-02, repassé par rp-hi-cm1-02). Chaque fait cite sa source et la
 * citation exacte (`le-temps-des-rois-sources.ts`) ; les textes à lire du niveau 5 sont écrits pour l’exercice.
 */
export const SOURCE = 'cycle3-2020';

const CREDIT = 'Texte écrit pour l’exercice, d’après les sources de la leçon.';

/** Écritures acceptées d'un mot, avec ou sans article. */
const avec = (articles: readonly string[], ...mots: string[]) => [
  ...mots,
  ...articles.flatMap((a) => mots.map((m) => a + m)),
];

const LOUIS_IX = [
  'Louis IX',
  'Louis 9',
  'Louis neuf',
  'saint Louis',
  'Saint-Louis',
  'Louis IX (saint Louis)',
  'le roi Louis IX',
  'le roi saint Louis',
];
const FRANCOIS = [
  'François Ier',
  'Francois Ier',
  'François 1er',
  'Francois 1er',
  'François I',
  'Francois I',
  'François 1',
  'Francois 1',
  'François premier',
  'Francois premier',
  'le roi François Ier',
  'le roi Francois Ier',
];
const HENRI = ['Henri IV', 'Henri 4', 'Henri quatre', 'le roi Henri IV'];
const LOUIS_XIV = ['Louis XIV', 'Louis 14', 'Louis quatorze', 'le roi Louis XIV'];
const SAINT_LOUIS = ['saint Louis', 'Saint-Louis', 'St Louis', 'St-Louis'];
const CHAPELLE = avec(['la '], 'Sainte-Chapelle', 'Sainte Chapelle', 'Ste-Chapelle');
const CROISADE = avec(['la ', 'une '], 'croisade').concat(avec(['les ', 'des '], 'croisades'));
const RENAISSANCE = avec(['la '], 'Renaissance');
const VINCI = ['Léonard de Vinci', 'Leonard de Vinci', 'Léonard', 'Leonard', 'de Vinci', 'Vinci'];
const JOCONDE = avec(['la '], 'Joconde');
const EDIT = avec(['l’', 'un '], 'édit de Nantes', 'edit de Nantes');
const VERSAILLES = ['Versailles', ...avec(['le '], 'château de Versailles', 'chateau de Versailles')];

// ——— Notion 1 : Louis IX ———

const louisIx: NotionGuidee = {
  id: 'hcm1-louis-ix',
  title: 'Louis IX, le roi chrétien',
  memo: [
    'Louis IX, le « **roi chrétien** », est couronné à 12 ans.',
    'Il bâtit la Sainte-Chapelle pour des **reliques** et part en **croisade**.',
    'Mort près de Tunis en 1270, il est **canonisé** en 1297.',
  ],
  sens: {
    type: 'savais-tu',
    text: 'Louis IX avait 12 ans quand il a été couronné roi !',
    source: P.couronne.source,
    citation: P.couronne.quote,
  },
  faits: [
    {
      ...P.roiChretien,
      q: 'Quel surnom donne-t-on au roi Louis IX ?',
      a: 'le roi chrétien',
      wrong: [
        { label: 'le roi Soleil', why: 'Le roi Soleil est Louis XIV, qui vit bien plus tard.' },
        { label: 'le protecteur des Arts', why: 'Ce surnom va avec François Ier, à la Renaissance.' },
        { label: 'le bon roi Henri', why: 'Ce nom parle d’Henri IV, pas de Louis IX.' },
      ],
      gap: ['Louis IX est surnommé le « roi ', ' » (mot en c).', ['chrétien', 'chretien']],
      indice: 'Pense à la religion de ce roi.',
      etapes: ['Pense à sa religion : il fait bâtir une chapelle.', 'Élimine les surnoms des autres rois.'],
    },
    {
      ...P.couronne,
      q: 'À quel âge Louis IX est-il couronné roi ?',
      a: 'à 12 ans',
      wrong: [
        { label: 'à 40 ans', why: 'Louis IX devient roi enfant, bien avant 40 ans.' },
        { label: 'à 2 ans', why: 'Il n’est plus un bébé : il a déjà l’âge d’un collégien.' },
        { label: 'à 25 ans', why: 'À 25 ans, on est adulte : Louis IX devient roi enfant.' },
      ],
      gap: ['Louis IX est couronné roi à ', ' ans.', ['12', 'douze']],
      indice: 'Il est encore un enfant.',
      etapes: ['Souviens-toi : ce roi commence très jeune.', 'Cherche un âge proche de celui d’un élève de sixième.'],
    },
    {
      ...P.couronne,
      q: 'Qui aide le jeune Louis IX à gouverner ?',
      a: 'sa mère, Blanche de Castille',
      wrong: [
        { label: 'son ministre, Sully', why: 'Sully est le ministre d’Henri IV, bien plus tard.' },
        { label: 'sa mère, Anne d’Autriche', why: 'Anne d’Autriche est la mère de Louis XIV.' },
        { label: 'son ministre, Mazarin', why: 'Mazarin aide à gouverner au début du règne de Louis XIV.' },
      ],
      gap: ['Au début, sa ', ', Blanche de Castille, l’aide à gouverner.', ['mère', 'mere', 'maman']],
      indice: 'C’est une personne de sa famille.',
      etapes: ['Pense : un enfant roi a besoin d’aide.', 'Cherche une femme de sa famille, appelée Blanche.'],
    },
    {
      ...P.reliques,
      q: 'Quel monument Louis IX fait-il bâtir pour garder des reliques ?',
      a: 'la Sainte-Chapelle',
      wrong: [
        { label: 'le château de Versailles', why: 'Versailles est agrandi par Louis XIV, bien plus tard.' },
        { label: 'le Collège de France', why: 'Le Collège de France est créé par François Ier.' },
        { label: 'le château de Chambord', why: 'Chambord est un château de François Ier.' },
      ],
      gap: ['Pour garder des reliques, Louis IX fait bâtir la Sainte-', '.', ['Chapelle']],
      indice: 'Pense à un monument religieux.',
      etapes: [
        'Pense aux reliques : des objets que des croyants vénèrent.',
        'Cherche un monument religieux, pas un château.',
      ],
    },
    {
      ...P.juste,
      q: 'Quel genre de roi Louis IX veut-il être ?',
      a: 'un roi juste et plein de pitié',
      wrong: [
        { label: 'un roi sans religion', why: 'Louis IX est très croyant : on le dit « roi chrétien ».' },
        { label: 'un roi qui oublie les pauvres', why: 'Louis IX a laissé le souvenir d’un roi proche des pauvres.' },
        {
          label: 'un roi qui ne gouverne jamais',
          why: 'Louis IX gouverne le royaume : il veut le faire avec justice.',
        },
      ],
      gap: ['Louis IX veut être un roi ', ' et plein de pitié (mot en j).', ['juste']],
      indice: 'Pense à ce qu’on attend d’un bon juge.',
      etapes: ['Imagine un roi qui aide les pauvres.', 'Cherche la qualité d’un bon juge.'],
    },
    {
      ...P.tunis,
      q: 'Où Louis IX meurt-il, en 1270 ?',
      a: 'près de Tunis, pendant une croisade',
      wrong: [
        { label: 'à Versailles, dans son château', why: 'Versailles devient une résidence royale bien plus tard.' },
        {
          label: 'à Amboise, près d’un grand peintre',
          why: 'À Amboise vit Léonard de Vinci, au temps de François Ier.',
        },
        { label: 'à Nantes, après un édit', why: 'L’édit de Nantes est signé par Henri IV.' },
      ],
      gap: ['Louis IX meurt près de Tunis, pendant une ', ' (mot proche de « croix »).', ['croisade']],
      indice: 'Il est parti loin avec son armée.',
      etapes: ['Souviens-toi : ce roi part loin avec son armée.', 'Cherche le lieu situé hors de France.'],
    },
    {
      ...P.regneLouisIx,
      q: 'Quel nom Louis IX reçoit-il quand l’Église le déclare saint ?',
      a: 'saint Louis',
      wrong: [
        { label: 'le bon roi', why: 'Le « bon roi » est le surnom d’Henri IV.' },
        { label: 'saint Henri', why: 'Henri est un autre prénom : le roi s’appelle Louis.' },
        { label: 'le roi Soleil', why: 'Le roi Soleil est Louis XIV.' },
      ],
      gap: ['En 1297, Louis IX devient ', ' Louis.', ['saint', 'St']],
      indice: 'C’est un titre donné par l’Église.',
      etapes: ['Garde le prénom du roi : Louis.', 'Ajoute le mot que l’Église donne alors.'],
    },
    {
      ...P.regneLouisIx,
      q: 'Louis IX règne de 1226 à 1270. Dans quel siècle ?',
      a: 'au XIIIe siècle',
      wrong: [
        { label: 'au XVIIe siècle', why: 'Le XVIIe siècle va de 1601 à 1700 : c’est Louis XIV.' },
        { label: 'au XIIe siècle', why: 'Le XIIe siècle s’arrête en 1200.' },
        { label: 'au XVIe siècle', why: 'Le XVIe siècle va de 1501 à 1600.' },
      ],
      gap: [
        'Louis IX règne au ',
        ' siècle (en chiffres romains).',
        ['XIIIe', 'XIIIème', 'XIIIeme', 'XIII', '13e', '13ème', '13eme', '13', 'treizième', 'treizieme'],
      ],
      indice: 'Pars de l’année 1226.',
      etapes: [
        'Lis l’année 1226 : garde les deux premiers chiffres, 12.',
        'Ajoute 1 : tu trouves le numéro du siècle.',
      ],
    },
  ],
  paires3: [
    ['Louis IX', 'Le « roi chrétien »'],
    ['Blanche de Castille', 'Sa mère'],
    ['Sainte-Chapelle', 'Garde des reliques'],
  ],
  paires5: [
    ['1226', 'Début de son règne'],
    ['1270', 'Mort près de Tunis'],
    ['1297', 'Devient saint Louis'],
    ['Blanche de Castille', 'Sa mère'],
    ['Sainte-Chapelle', 'Garde des reliques'],
  ],
  ordre: {
    reperes: [
      'Louis IX devient roi',
      'Louis IX fait acheter des reliques',
      'Louis IX meurt près de Tunis',
      'Louis IX est déclaré saint',
    ],
    reponse: 'd’abord roi, puis reliques, mort et saint',
    indice: 'Un roi est déclaré saint après sa mort.',
    etapes: ['Place le début du règne en premier : 1226.', 'Place ensuite 1239, puis 1270, puis 1297.'],
  },
  libres: [
    {
      ...P.roiChretien,
      q: 'Écris l’adjectif qui complète le surnom de Louis IX : « le roi … ».',
      accepted: ['chrétien', 'chretien', 'le roi chrétien', 'le roi chretien', 'roi chrétien', 'roi chretien'],
      traps: [
        { text: 'soleil', why: 'Le roi Soleil est Louis XIV.' },
        { text: 'juste', why: 'Il veut être juste, mais son surnom parle de sa religion.' },
      ],
      indice: 'Pense à sa religion.',
      etapes: ['Pense à la chapelle et aux reliques.', 'Cherche le mot qui nomme sa religion.'],
    },
    {
      ...P.couronne,
      q: 'Écris le nom de la mère qui aide le jeune Louis IX.',
      accepted: ['Blanche de Castille', 'Blanche', 'la reine Blanche de Castille', 'la reine Blanche'],
      traps: [
        { text: 'Anne d’Autriche', why: 'Anne d’Autriche est la mère de Louis XIV.' },
        { text: 'Sully', why: 'Sully est le ministre d’Henri IV, bien plus tard.' },
      ],
      indice: 'Elle gouverne pour son fils encore enfant.',
      etapes: ['Pense à la femme qui gouverne avec le jeune roi.', 'Écris son prénom, puis le nom de son pays.'],
    },
    {
      ...P.croisade,
      q: 'Écris le nom des expéditions du Moyen Âge vers Jérusalem, faites par des chrétiens.',
      accepted: CROISADE,
      traps: [
        { text: 'guerres de religion', why: 'Les guerres de religion opposent des Français, au XVIe siècle.' },
        { text: 'colonies', why: 'Une colonie est un territoire, pas une expédition.' },
      ],
      indice: 'Ce mot commence comme « croix ».',
      etapes: ['Pense aux combattants qui portent une croix.', 'Écris le mot qui ressemble à « croix ».'],
    },
    {
      ...P.reliques,
      q: 'Écris le nom du monument que Louis IX fait bâtir pour ses reliques.',
      accepted: CHAPELLE,
      traps: [
        { text: 'Versailles', why: 'Versailles est le château de Louis XIV.' },
        { text: 'Notre-Dame', why: 'Le monument bâti pour ces reliques porte un autre nom.' },
      ],
      indice: 'C’est un monument religieux.',
      etapes: ['Pense à une petite église.', 'Écris les deux mots de son nom.'],
    },
  ],
  docs: [
    {
      title: 'Un très jeune roi',
      lines: [
        'En 1226, un garçon de 12 ans est couronné roi de France.',
        'Sa mère l’aide à gouverner.',
        'Plus tard, il fait bâtir un monument pour des reliques.',
      ],
      qs: [
        {
          ...P.couronne,
          q: 'Écris le nom de ce roi, avec son numéro.',
          accepted: LOUIS_IX,
          traps: [
            { text: 'Louis XIV', why: 'Louis XIV devient roi en 1643, pas en 1226.' },
            { text: 'François Ier', why: 'François Ier règne à partir de 1515.' },
          ],
          indice: 'Cherche le roi du XIIIe siècle.',
          etapes: ['Relis la ligne 1 : repère l’année.', 'Relis la ligne 3 : quel roi a voulu des reliques ?'],
        },
        {
          ...P.couronne,
          q: 'Écris le nom de la mère dont parle la ligne 2.',
          accepted: ['Blanche de Castille', 'Blanche', 'la reine Blanche de Castille', 'la reine Blanche'],
          traps: [
            { text: 'Anne d’Autriche', why: 'C’est la mère de Louis XIV.' },
            { text: 'Anne de Bretagne', why: 'Anne de Bretagne n’est pas la mère de ce roi.' },
          ],
          indice: 'Trouve d’abord de quel roi on parle.',
          etapes: ['Trouve le roi grâce à l’année 1226.', 'Souviens-toi du prénom de sa mère.'],
        },
      ],
    },
    {
      title: 'Un départ lointain',
      lines: [
        'En 1270, le roi chrétien part loin avec son armée.',
        'Ce voyage armé est lié à la religion.',
        'Il meurt près de Tunis.',
      ],
      qs: [
        {
          ...P.croisades,
          q: 'Comment appelle-t-on ce genre d’expédition ? Écris le mot.',
          accepted: CROISADE,
          traps: [
            { text: 'guerre de religion', why: 'Les guerres de religion se passent en France, au XVIe siècle.' },
            { text: 'colonisation', why: 'Coloniser, c’est s’installer pour contrôler un territoire.' },
          ],
          indice: 'Pense à la croix des combattants.',
          etapes: ['Relis les lignes 1 et 2 : loin, armée, religion.', 'Cherche le mot qui ressemble à « croix ».'],
        },
        {
          ...P.regneLouisIx,
          q: 'Écris le nom que ce roi reçoit quand l’Église le déclare saint.',
          accepted: SAINT_LOUIS,
          traps: [
            { text: 'le roi Soleil', why: 'Le roi Soleil est Louis XIV.' },
            { text: 'saint Henri', why: 'Ce roi ne s’appelle pas Henri.' },
          ],
          indice: 'Garde son prénom et ajoute un titre.',
          etapes: ['Trouve d’abord le prénom du « roi chrétien ».', 'Place devant le titre donné par l’Église.'],
        },
      ],
    },
    {
      title: 'Des objets précieux',
      lines: [
        'Vers 1239, le roi Louis IX fait acheter des objets sacrés.',
        'Pour des croyants, ce sont des reliques.',
        'Il fait construire un monument pour les garder.',
      ],
      qs: [
        {
          ...P.reliques,
          q: 'Écris le nom de ce monument.',
          accepted: CHAPELLE,
          traps: [
            { text: 'Collège de France', why: 'C’est un lieu de savants créé par François Ier.' },
            { text: 'Louvre', why: 'Le monument des reliques porte un autre nom.' },
          ],
          indice: 'C’est un monument religieux.',
          etapes: [
            'Relis la ligne 3 : le monument garde les reliques.',
            'Souviens-toi du nom qui commence par « Sainte ».',
          ],
        },
        {
          ...P.regneLouisIx,
          q: 'Dans quel siècle se passe cet achat ? Écris-le en chiffres romains.',
          accepted: ['XIIIe', 'XIIIe siècle', 'XIII', 'XIIIème', 'XIIIeme', 'le XIIIe siècle', 'au XIIIe siècle'],
          traps: [
            { text: 'XIIe', why: 'Le XIIe siècle s’arrête en 1200.' },
            { text: 'XIVe', why: 'Le XIVe siècle commence en 1301.' },
          ],
          indice: 'Pars de l’année de la ligne 1.',
          etapes: [
            'Lis l’année 1239 : garde les deux premiers chiffres.',
            'Ajoute 1, puis écris ce nombre en chiffres romains.',
          ],
        },
      ],
    },
  ],
};

// ——— Notion 2 : François Ier ———

const francoisIer: NotionGuidee = {
  id: 'hcm1-francois-ier',
  title: 'François Ier, protecteur des arts',
  memo: [
    'À la **Renaissance**, François Ier est un **protecteur** des Arts et des Lettres.',
    'Il fait venir Léonard de Vinci et crée le **Collège de France**.',
    'En 1539, une **ordonnance** impose le français pour certains textes de justice.',
  ],
  sens: {
    type: 'histoire',
    text: 'En 1530, François Ier crée le Collège de France, où des savants font librement des recherches.',
    source: P.chercheurs.source,
    citation: P.chercheurs.quote,
  },
  faits: [
    {
      ...P.protecteur,
      q: 'Comment s’appelle l’époque du roi François Ier ?',
      a: 'la Renaissance',
      wrong: [
        { label: 'la Préhistoire', why: 'La Préhistoire est avant l’écriture : aucun roi de France alors.' },
        { label: 'la Révolution', why: 'La Révolution commence en 1789, bien après ce roi.' },
        { label: 'l’Antiquité', why: 'L’Antiquité est plus ancienne : on l’admire à l’époque du roi.' },
      ],
      gap: ['L’époque de François Ier s’appelle la ', ' (mot en R).', ['Renaissance']],
      indice: 'Ce nom veut dire « naître à nouveau ».',
      etapes: ['Pense à des idées anciennes qui reviennent.', 'Cherche le nom qui parle d’une nouvelle naissance.'],
    },
    {
      ...P.activite,
      q: 'Que veut dire « protéger les arts et les lettres » pour ce roi ?',
      a: 'aider des artistes et des savants',
      wrong: [
        { label: 'interdire d’écrire des livres', why: 'Protéger veut dire aider, pas interdire.' },
        { label: 'envoyer les peintres à la guerre', why: 'Le roi aide les peintres à créer, pas à combattre.' },
        { label: 'cacher toutes les lettres reçues', why: 'Ici, les « lettres » sont les livres et le savoir.' },
      ],
      gap: ['François Ier est un protecteur des Arts et des ', '.', ['Lettres']],
      indice: 'Un protecteur aide les gens.',
      etapes: ['Pense au mot « protéger » : aider et défendre.', 'Cherche qui crée des tableaux et qui étudie.'],
    },
    {
      ...P.invitation,
      q: 'Quel grand artiste venu d’Italie vient vivre en France, près du roi ?',
      a: 'Léonard de Vinci',
      wrong: [
        { label: 'Michel-Ange', why: 'Le roi ne parvient pas à faire venir Michel-Ange.' },
        { label: 'Molière', why: 'Molière est un auteur du temps de Louis XIV.' },
        { label: 'Guillaume Budé', why: 'Budé est un savant : il conseille au roi de créer un collège.' },
      ],
      gap: ['Le peintre Léonard de ', ' vient vivre en France.', ['Vinci']],
      indice: 'Il finit sa vie à Amboise.',
      etapes: ['Cherche un artiste italien de la Renaissance.', 'Élimine ceux du temps de Louis XIV.'],
    },
    {
      ...P.vinci,
      q: 'Quel portrait célèbre François Ier achète-t-il à Léonard de Vinci ?',
      a: 'la Joconde',
      wrong: [
        { label: 'le portrait de Louis XIV', why: 'Louis XIV naît bien après la mort de ce peintre.' },
        { label: 'le portrait d’Henri IV', why: 'Henri IV règne après François Ier.' },
        { label: 'une statue d’Hercule', why: 'Cette statue vient de Michel-Ange, et ce n’est pas un portrait.' },
      ],
      gap: ['Le roi achète à Léonard le portrait de la ', '.', ['Joconde']],
      indice: 'Ce portrait montre un sourire célèbre.',
      etapes: ['Élimine les rois qui vivent après ce peintre.', 'Cherche le portrait au célèbre sourire.'],
    },
    {
      ...P.college,
      q: 'Quel lieu de savoir François Ier crée-t-il en 1530 ?',
      a: 'le Collège de France',
      wrong: [
        { label: 'la Sainte-Chapelle', why: 'La Sainte-Chapelle est bâtie par Louis IX.' },
        { label: 'la Sorbonne', why: 'La Sorbonne existe déjà : le roi crée un autre lieu.' },
        { label: 'le château de Versailles', why: 'Versailles est un château, agrandi par Louis XIV.' },
      ],
      gap: ['En 1530, le roi crée le ', ' de France.', ['Collège', 'College']],
      indice: 'Des savants y font des recherches.',
      etapes: ['Cherche un lieu où des savants travaillent.', 'Élimine les lieux liés à d’autres rois.'],
    },
    {
      ...P.villers,
      q: 'En 1539, quelle langue devient obligatoire pour certains textes de justice ?',
      a: 'le français',
      wrong: [
        { label: 'le latin', why: 'Le latin est la langue ancienne que le roi remplace ici.' },
        { label: 'l’italien', why: 'Des artistes italiens viennent, mais la règle concerne le français.' },
        { label: 'le grec', why: 'On étudie le grec ancien, mais pas pour ces textes.' },
      ],
      gap: ['En 1539, le roi impose le ', ' pour certains textes de justice.', ['français', 'francais']],
      indice: 'Pense au royaume de ce roi.',
      etapes: [
        'Pense à la langue parlée dans le royaume de France.',
        'Élimine les langues d’autres pays ou très anciennes.',
      ],
    },
    {
      ...P.regneFrancois,
      q: 'Pendant quelles années François Ier est-il roi ?',
      a: 'de 1515 à 1547',
      wrong: [
        { label: 'de 1226 à 1270', why: 'Ces années sont celles de Louis IX.' },
        { label: 'de 1643 à 1715', why: 'Ces années sont celles de Louis XIV.' },
        { label: 'de 1789 à 1799', why: 'Ces années sont celles de la Révolution.' },
      ],
      gap: ['François Ier devient roi en ', ' (une année).', ['1515']],
      indice: 'Il règne au XVIe siècle.',
      etapes: ['Pense au siècle de la Renaissance en France.', 'Cherche des années qui commencent par 15.'],
    },
  ],
  paires3: [
    ['François Ier', 'Protège les artistes'],
    ['Léonard de Vinci', 'Artiste venu d’Italie'],
    ['Collège de France', 'Créé en 1530'],
  ],
  paires5: [
    ['1515', 'Début du règne'],
    ['1530', 'Collège de France'],
    ['1539', 'Ordonnance sur le français'],
    ['Léonard de Vinci', 'Artiste venu d’Italie'],
    ['Joconde', 'Portrait acheté par le roi'],
  ],
  ordre: {
    reperes: [
      'François Ier devient roi',
      'Le roi crée le Collège de France',
      'Le roi impose le français pour la justice',
    ],
    reponse: 'd’abord roi, puis le Collège, puis le français',
    indice: 'Un roi décide seulement après son arrivée au pouvoir.',
    etapes: ['Place le début du règne en premier : 1515.', 'Place ensuite 1530, puis 1539.'],
  },
  libres: [
    {
      ...P.protecteur,
      q: 'Écris le nom de l’époque de François Ier.',
      accepted: RENAISSANCE,
      traps: [
        { text: 'Révolution', why: 'La Révolution commence en 1789.' },
        { text: 'Antiquité', why: 'L’Antiquité est bien plus ancienne.' },
      ],
      indice: 'Ce mot parle d’une nouvelle naissance.',
      etapes: ['Pense aux idées anciennes qui reviennent.', 'Écris le mot proche de « renaître ».'],
    },
    {
      ...P.vinci,
      q: 'Écris le nom de l’artiste italien qui a peint la Joconde.',
      accepted: VINCI,
      traps: [
        { text: 'Michel-Ange', why: 'Michel-Ange n’est pas venu en France.' },
        { text: 'Molière', why: 'Molière écrit des pièces au temps de Louis XIV.' },
      ],
      indice: 'Cet artiste finit sa vie à Amboise.',
      etapes: ['Pense à l’artiste qui finit sa vie à Amboise.', 'Écris son nom, avec ou sans prénom.'],
    },
    {
      ...P.college,
      q: 'Écris le nom et le numéro du roi qui crée le Collège de France.',
      accepted: FRANCOIS,
      traps: [
        { text: 'Louis XIV', why: 'Louis XIV règne au XVIIe siècle.' },
        { text: 'Henri IV', why: 'Henri IV règne après la création de 1530.' },
      ],
      indice: 'C’est un roi de la Renaissance.',
      etapes: ['Pense au roi qui règne en 1530.', 'Écris son prénom et son numéro.'],
    },
    {
      ...P.villers,
      q: 'Écris la langue imposée en 1539 pour certains textes de justice.',
      accepted: ['français', 'francais', 'le français', 'le francais', 'la langue française', 'la langue francaise'],
      traps: [
        { text: 'latin', why: 'Le latin est la langue que cette règle écarte.' },
        { text: 'italien', why: 'La règle concerne la langue du royaume.' },
      ],
      indice: 'Pense au royaume de ce roi.',
      etapes: ['Pense à la langue du royaume.', 'Écris le nom de cette langue.'],
    },
  ],
  docs: [
    {
      title: 'Un invité à Amboise',
      lines: [
        'Un grand artiste italien vient s’installer en France.',
        'Le roi lui achète un portrait très célèbre.',
        'L’artiste passe ses dernières années à Amboise.',
      ],
      qs: [
        {
          ...P.vinci,
          q: 'Écris le nom de cet artiste.',
          accepted: VINCI,
          traps: [
            { text: 'Michel-Ange', why: 'Michel-Ange a refusé de venir en France.' },
            { text: 'Cellini', why: 'Cellini vient aussi, mais le texte parle d’Amboise.' },
          ],
          indice: 'Le portrait est un sourire célèbre.',
          etapes: ['Relis la ligne 3 : repère la ville.', 'Pense au peintre italien qui finit sa vie là.'],
        },
        {
          ...P.vinci,
          q: 'Écris le nom du portrait dont parle la ligne 2.',
          accepted: JOCONDE,
          traps: [
            { text: 'Hercule', why: 'Hercule est une statue achetée à Michel-Ange.' },
            { text: 'Cène', why: 'Le portrait acheté par le roi porte un autre nom.' },
          ],
          indice: 'On y voit un sourire célèbre.',
          etapes: ['Trouve d’abord le nom de l’artiste.', 'Cherche son portrait le plus célèbre.'],
        },
        {
          ...P.vinci,
          q: 'Écris le nom et le numéro du roi qui achète ce portrait.',
          accepted: FRANCOIS,
          traps: [
            { text: 'Louis XIV', why: 'Louis XIV naît bien après la mort de cet artiste.' },
            { text: 'Louis IX', why: 'Louis IX vit au XIIIe siècle.' },
          ],
          indice: 'C’est le protecteur des artistes à la Renaissance.',
          etapes: ['Pense à l’époque de cet artiste italien.', 'Écris le roi qui protège les arts alors.'],
        },
      ],
    },
    {
      title: 'Deux décisions',
      lines: [
        'En 1530, le roi crée un lieu où des savants font des recherches.',
        'En 1539, il décide d’une règle pour certains textes de justice.',
        'Ces textes doivent utiliser une langue précise.',
      ],
      qs: [
        {
          ...P.villers,
          q: 'Écris le nom de cette langue.',
          accepted: [
            'français',
            'francais',
            'le français',
            'le francais',
            'la langue française',
            'la langue francaise',
          ],
          traps: [
            { text: 'latin', why: 'La règle remplace justement le latin dans ces textes.' },
            { text: 'italien', why: 'La règle concerne la langue du royaume.' },
          ],
          indice: 'Pense au royaume de ce roi.',
          etapes: ['Relis les lignes 2 et 3 : une règle et une langue.', 'Pense à la langue du royaume.'],
        },
        {
          ...P.college,
          q: 'Écris le nom du lieu créé en 1530.',
          accepted: [
            'Collège de France',
            'College de France',
            'le Collège de France',
            'le College de France',
            'Collège royal',
            'le Collège royal',
          ],
          traps: [
            { text: 'Sorbonne', why: 'La Sorbonne existe déjà : le roi crée un autre lieu.' },
            { text: 'Versailles', why: 'Versailles est un château.' },
          ],
          indice: 'Ses lecteurs font des recherches.',
          etapes: ['Relis la ligne 1 : des savants y cherchent.', 'Écris le nom complet de ce lieu.'],
        },
        {
          ...P.college,
          q: 'Écris le nom et le numéro du roi qui prend ces deux décisions.',
          accepted: FRANCOIS,
          traps: [
            { text: 'Henri IV', why: 'Henri IV signe l’édit de Nantes en 1598.' },
            { text: 'Louis XIV', why: 'Louis XIV règne au XVIIe siècle.' },
          ],
          indice: 'Il règne de 1515 à 1547.',
          etapes: ['Repère les années 1530 et 1539.', 'Cherche le roi qui règne à ces dates.'],
        },
      ],
    },
    {
      title: 'Une époque nouvelle',
      lines: [
        'Sous ce roi, des idées venues d’Italie se répandent en France.',
        'Des savants admirent les textes grecs et romains.',
        'Le roi soutient de nombreux artistes.',
      ],
      qs: [
        {
          ...P.diffusion,
          q: 'Écris le nom de cette époque.',
          accepted: RENAISSANCE,
          traps: [
            { text: 'Antiquité', why: 'L’Antiquité est celle des textes admirés, bien avant.' },
            { text: 'Moyen Âge', why: 'Cette époque nouvelle vient après le Moyen Âge.' },
          ],
          indice: 'Ce mot parle d’une nouvelle naissance.',
          etapes: [
            'Relis les lignes 1 et 2 : des idées anciennes reviennent.',
            'Cherche le mot proche de « renaître ».',
          ],
        },
        {
          ...P.diffusion,
          q: 'Écris le nom et le numéro du roi dont parle ce texte.',
          accepted: FRANCOIS,
          traps: [
            { text: 'Louis XIV', why: 'Louis XIV règne au XVIIe siècle.' },
            { text: 'Louis IX', why: 'Louis IX vit au XIIIe siècle.' },
          ],
          indice: 'C’est un protecteur des artistes.',
          etapes: ['Relis la ligne 1 : des idées viennent d’Italie.', 'Cherche le roi de cette époque nouvelle.'],
        },
      ],
    },
  ],
};

// ——— Notion 3 : Henri IV et l'édit de Nantes ———

const henriIv: NotionGuidee = {
  id: 'hcm1-henri-iv',
  title: 'Henri IV et l’édit de Nantes',
  memo: [
    'En 1598, Henri IV signe l’**édit de Nantes** et arrête les **guerres de religion**.',
    'Les **protestants** reçoivent des droits, avec des limites.',
    'Henri IV est assassiné en 1610.',
  ],
  sens: {
    type: 'savais-tu',
    text: 'Avec l’édit de Nantes, des protestants peuvent se réfugier dans des villes fortifiées.',
    source: P.refuge.source,
    citation: P.refuge.quote,
  },
  faits: [
    {
      ...P.signature,
      q: 'Quel roi signe l’édit de Nantes ?',
      a: 'Henri IV',
      wrong: [
        { label: 'Louis XIV', why: 'Louis XIV annule cet édit en 1685.' },
        { label: 'Louis IX', why: 'Louis IX vit au XIIIe siècle, bien avant.' },
        { label: 'François Ier', why: 'François Ier règne avant la signature de 1598.' },
      ],
      gap: ['L’édit de Nantes est signé par le roi ', ' (nom et numéro).', HENRI],
      indice: 'C’est un roi qui ramène la paix.',
      etapes: ['Cherche le roi qui règne en 1598.', 'Écarte le roi qui annule ensuite ce texte.'],
    },
    {
      ...P.signature,
      q: 'En quelle année l’édit de Nantes est-il signé ?',
      a: 'en 1598',
      wrong: [
        { label: 'en 1515', why: '1515 est le début du règne de François Ier.' },
        { label: 'en 1685', why: '1685 est l’année où l’édit est annulé.' },
        { label: 'en 1789', why: '1789 est l’année de la Révolution.' },
      ],
      gap: ['Henri IV signe l’édit de Nantes en ', ' (une année).', ['1598']],
      indice: 'C’est à la toute fin du XVIe siècle.',
      etapes: ['Pense à la fin des guerres de religion.', 'Cherche une année proche de 1600.'],
    },
    {
      ...P.signature,
      q: 'À quoi l’édit de Nantes met-il fin ?',
      a: 'aux guerres de religion',
      wrong: [
        { label: 'aux croisades', why: 'Les croisades sont des expéditions du Moyen Âge.' },
        { label: 'à la Révolution', why: 'La Révolution commence bien après.' },
        { label: 'à la royauté', why: 'La France garde des rois après cet édit.' },
      ],
      gap: ['L’édit de Nantes met fin aux guerres de ', '.', ['religion', 'religions']],
      indice: 'Des Français se battent à cause de leurs croyances.',
      etapes: ['Pense aux combats entre catholiques et protestants.', 'Élimine les événements d’autres époques.'],
    },
    {
      ...P.droits,
      q: 'À quels croyants l’édit de Nantes donne-t-il des droits ?',
      a: 'aux protestants',
      wrong: [
        { label: 'seulement aux moines', why: 'Les moines sont catholiques : l’édit vise d’autres chrétiens.' },
        {
          label: 'seulement aux catholiques',
          why: 'Les catholiques ont déjà la religion du roi : l’édit vise d’autres.',
        },
        { label: 'aux musulmans', why: 'L’édit parle des protestants, qui sont des chrétiens.' },
      ],
      gap: ['L’édit donne des droits aux ', ' (des chrétiens, mot en p).', ['protestants']],
      indice: 'Ce sont des chrétiens, mais pas des catholiques.',
      etapes: ['Pense aux deux camps des guerres de religion.', 'Choisis celui qui n’est pas catholique.'],
    },
    {
      ...P.limites,
      q: 'Avec l’édit de Nantes, les protestants prient-ils où ils veulent ?',
      a: 'non, leurs lieux de prière sont limités',
      wrong: [
        { label: 'oui, partout et sans aucune limite', why: 'L’édit donne des droits, mais avec des limites.' },
        { label: 'non, leur religion est interdite', why: 'L’interdiction arrive en 1685, quand l’édit est annulé.' },
        { label: 'oui, car tout le monde devient protestant', why: 'Les catholiques restent catholiques.' },
      ],
      gap: ['Les lieux de prière des protestants sont ', ' (mot en l).', ['limités', 'limites']],
      indice: 'L’édit donne des droits, mais pas tous.',
      etapes: [
        'Pense : leur liberté de croire est reconnue.',
        'Cherche la réponse avec une liberté de prier plus petite.',
      ],
    },
    {
      ...P.assassinat,
      q: 'Comment le roi Henri IV meurt-il en 1610 ?',
      a: 'il est assassiné',
      wrong: [
        { label: 'il meurt pendant une croisade', why: 'C’est Louis IX qui meurt en croisade.' },
        { label: 'il meurt de vieillesse à Versailles', why: 'Henri IV est tué par un homme, Ravaillac.' },
        { label: 'il meurt à la prise de la Bastille', why: 'La Bastille est prise en 1789.' },
      ],
      gap: [
        'En 1610, Henri IV meurt : Ravaillac l’a ',
        ' (mot en a).',
        ['assassiné', 'assassine', 'abattu', 'attaqué', 'attaque'],
      ],
      indice: 'Sa mort est violente.',
      etapes: ['Pense à Ravaillac, qui attaque le roi.', 'Élimine les morts liées à d’autres rois.'],
    },
    {
      ...P.revocation,
      q: 'Quel roi annule l’édit de Nantes en 1685 ?',
      a: 'Louis XIV',
      wrong: [
        { label: 'Henri IV', why: 'Henri IV signe l’édit, et il est mort en 1610.' },
        { label: 'François Ier', why: 'François Ier est mort en 1547.' },
        { label: 'Louis IX', why: 'Louis IX est mort en 1270.' },
      ],
      gap: ['En 1685, le roi ', ' annule l’édit de Nantes (nom et numéro).', LOUIS_XIV],
      indice: 'Cherche le roi vivant en 1685.',
      etapes: ['Élimine les rois morts avant 1685.', 'Garde le roi qui règne cette année-là.'],
    },
  ],
  paires3: [
    ['Henri IV', 'Signe l’édit'],
    ['Ravaillac', 'Assassine le roi'],
    ['Protestants', 'Reçoivent des droits'],
  ],
  paires5: [
    ['1594', 'Sacre d’Henri IV'],
    ['1598', 'Édit de Nantes'],
    ['1610', 'Mort d’Henri IV'],
    ['1685', 'Édit annulé'],
    ['Ravaillac', 'Assassine le roi'],
  ],
  ordre: {
    reperes: [
      'Henri IV est sacré roi',
      'Henri IV signe l’édit de Nantes',
      'Henri IV est assassiné',
      'Louis XIV annule l’édit de Nantes',
    ],
    reponse: 'sacre, édit, assassinat, puis annulation',
    indice: 'Un roi signe un texte avant de mourir.',
    etapes: ['Place le sacre en premier : 1594.', 'Place ensuite 1598, puis 1610, puis 1685.'],
  },
  libres: [
    {
      ...P.signature,
      q: 'Écris le nom du texte signé par Henri IV en 1598.',
      accepted: EDIT,
      traps: [
        {
          text: 'édit de Versailles',
          why: 'Versailles est un château : le texte porte le nom d’une ville de l’ouest.',
        },
        { text: 'ordonnance de Villers-Cotterêts', why: 'Cette ordonnance est signée par François Ier.' },
      ],
      indice: 'Son nom contient une ville.',
      etapes: ['Pense au mot « édit », une décision du roi.', 'Ajoute le nom de la ville.'],
    },
    {
      ...P.droits,
      q: 'Écris le nom des croyants qui reçoivent des droits grâce à cet édit de 1598.',
      accepted: ['protestants', 'les protestants', 'protestant', 'des protestants', 'aux protestants'],
      traps: [
        { text: 'catholiques', why: 'Les catholiques suivent déjà la religion du roi.' },
        { text: 'musulmans', why: 'L’édit concerne des chrétiens de France.' },
      ],
      indice: 'Ces chrétiens ne sont pas catholiques.',
      etapes: ['Pense aux chrétiens qui ne sont pas catholiques.', 'Écris le mot proche de « protester ».'],
    },
    {
      ...P.signature,
      q: 'Quelles guerres l’édit de Nantes termine-t-il ? Complète : les guerres de …',
      accepted: ['religion', 'religions', 'guerres de religion', 'les guerres de religion'],
      traps: [
        { text: 'Cent Ans', why: 'La guerre de Cent Ans est bien plus ancienne.' },
        { text: 'Gaules', why: 'La guerre des Gaules date de l’Antiquité.' },
      ],
      indice: 'Pense à ce qui oppose catholiques et protestants.',
      etapes: ['Pense aux catholiques et aux protestants.', 'Écris ce qui les sépare.'],
    },
    {
      ...P.signature,
      q: 'Écris le nom et le numéro du roi qui signe l’édit de Nantes.',
      accepted: HENRI,
      traps: [
        { text: 'Louis XIV', why: 'Louis XIV annule cet édit.' },
        { text: 'François Ier', why: 'François Ier règne avant 1598.' },
      ],
      indice: 'Ce roi est sacré en 1594.',
      etapes: ['Pense au roi qui ramène la paix en 1598.', 'Écris son prénom, puis son numéro.'],
    },
  ],
  docs: [
    {
      title: 'Un royaume divisé',
      lines: [
        'Des catholiques et des protestants se font la guerre en France.',
        'En 1598, le roi signe un texte.',
        'Les protestants reçoivent des droits.',
      ],
      qs: [
        {
          ...P.signature,
          q: 'Écris le nom de ce texte.',
          accepted: EDIT,
          traps: [
            { text: 'ordonnance de Villers-Cotterêts', why: 'Ce texte de 1539 vient de François Ier.' },
            {
              text: 'édit de Versailles',
              why: 'Versailles est un château : cet édit porte le nom d’une ville de l’ouest.',
            },
          ],
          indice: 'Son nom contient une ville.',
          etapes: ['Relis la ligne 2 : repère l’année.', 'Cherche l’édit signé cette année-là.'],
        },
        {
          ...P.signature,
          q: 'Écris le nom et le numéro du roi qui le signe.',
          accepted: HENRI,
          traps: [
            { text: 'Louis XIV', why: 'Louis XIV n’est pas encore né en 1598.' },
            { text: 'François Ier', why: 'François Ier est mort en 1547.' },
          ],
          indice: 'C’est le roi appelé le « bon roi ».',
          etapes: ['Repère l’année 1598.', 'Cherche le roi qui règne alors.'],
        },
      ],
    },
    {
      title: 'Des droits avec des limites',
      lines: [
        'Un texte du roi permet aux protestants de croire à leur façon.',
        'Mais leurs lieux de prière sont limités.',
        'Des villes fortifiées peuvent leur servir de refuge.',
      ],
      qs: [
        {
          ...P.limites,
          q: 'Écris le nom de ce texte du roi.',
          accepted: EDIT,
          traps: [
            {
              text: 'édit de Versailles',
              why: 'Versailles est un château : cet édit porte le nom d’une ville de l’ouest.',
            },
            { text: 'ordonnance de Villers-Cotterêts', why: 'Ce texte de 1539 vient de François Ier.' },
          ],
          indice: 'Son nom contient une ville.',
          etapes: [
            'Relis les trois lignes : des droits pour les protestants.',
            'Cherche l’édit qui leur donne ces droits.',
          ],
        },
        {
          ...P.signature,
          q: 'En quelle année ce texte est-il signé ? Écris l’année.',
          accepted: ['1598', 'en 1598'],
          traps: [
            { text: '1685', why: 'En 1685, ces droits sont au contraire supprimés.' },
            { text: '1610', why: '1610 est l’année de la mort du roi.' },
          ],
          indice: 'C’est à la fin du XVIe siècle.',
          etapes: ['Trouve d’abord le nom du texte.', 'Souviens-toi de son année, proche de 1600.'],
        },
      ],
    },
    {
      title: 'Une mort brutale',
      lines: [
        'En 1610, Ravaillac assassine le roi de France.',
        'Douze ans plus tôt, ce roi avait signé un édit de paix.',
        'Bien plus tard, un autre roi annule cet édit.',
      ],
      qs: [
        {
          ...P.assassinat,
          q: 'Écris le nom et le numéro du roi assassiné.',
          accepted: HENRI,
          traps: [
            { text: 'Louis XIV', why: 'Louis XIV meurt en 1715.' },
            { text: 'Louis IX', why: 'Louis IX meurt près de Tunis en 1270.' },
          ],
          indice: 'Il a signé un édit en 1598.',
          etapes: ['Calcule : 1610 moins douze ans.', 'Cherche le roi qui signe un édit cette année-là.'],
        },
        {
          ...P.revocation,
          q: 'Écris le nom et le numéro du roi qui annule cet édit en 1685.',
          accepted: LOUIS_XIV,
          traps: [
            { text: 'Henri IV', why: 'Henri IV signe l’édit et meurt en 1610.' },
            { text: 'Louis IX', why: 'Louis IX vit au XIIIe siècle.' },
          ],
          indice: 'On l’appelle aussi le roi Soleil.',
          etapes: ['Repère l’année 1685.', 'Cherche le roi qui règne alors.'],
        },
      ],
    },
  ],
};

// ——— Notion 4 : Louis XIV ———

const louisXiv: NotionGuidee = {
  id: 'hcm1-louis-xiv',
  title: 'Louis XIV, le roi Soleil à Versailles',
  memo: [
    'Louis XIV, le « roi **Soleil** », règne de 1643 à 1715.',
    'Il s’installe à **Versailles** et contrôle les **courtisans** par des fêtes.',
    'L’**empire colonial** est peuplé notamment par des Africains réduits en **esclavage**.',
  ],
  sens: {
    type: 'metier',
    text: 'L’historien fait des recherches sur le passé et écrit des livres d’histoire.',
    source: P.historien.source,
    citation: P.historien.quote,
  },
  faits: [
    {
      ...P.soleil,
      q: 'Quel surnom donne-t-on au roi Louis XIV ?',
      a: 'le roi Soleil',
      wrong: [
        { label: 'le roi chrétien', why: 'Le « roi chrétien » est Louis IX.' },
        { label: 'le roi Lune', why: 'Son astre est celui du jour, pas celui de la nuit.' },
        { label: 'le roi Océan', why: 'Son surnom parle d’un astre.' },
      ],
      gap: ['Louis XIV est le roi ', ' (mot en S).', ['Soleil']],
      indice: 'Pense à un astre très brillant.',
      etapes: ['Souviens-toi : à 14 ans, il danse déguisé en astre.', 'Cherche l’astre qui éclaire le jour.'],
    },
    {
      ...P.chasse,
      q: 'Quel château Louis XIV fait-il agrandir pour s’y installer ?',
      a: 'le château de Versailles',
      wrong: [
        { label: 'le château d’Amboise', why: 'Amboise est liée à Léonard de Vinci et à la Renaissance.' },
        { label: 'le château de Chambord', why: 'Chambord est un château de François Ier.' },
        { label: 'la Sainte-Chapelle', why: 'La Sainte-Chapelle est un monument de Louis IX.' },
      ],
      gap: ['Louis XIV fait agrandir le château de ', '.', ['Versailles']],
      indice: 'Son nom commence par V.',
      etapes: ['Élimine les lieux liés à d’autres rois.', 'Cherche le château du roi Soleil.'],
    },
    {
      ...P.chasse,
      q: 'Sous Louis XIII, qu’est-ce que le château de Versailles ?',
      a: 'un pavillon de chasse',
      wrong: [
        { label: 'une grande cathédrale', why: 'Versailles n’est pas une église : le roi y chasse.' },
        { label: 'un collège pour les savants', why: 'Le Collège de France est un autre lieu.' },
        { label: 'une ville fortifiée protestante', why: 'Versailles n’est pas un refuge protestant.' },
      ],
      gap: ['Avant d’être agrandi, Versailles est un pavillon de ', '.', ['chasse']],
      indice: 'Le roi y vient poursuivre des animaux.',
      etapes: ['Imagine Versailles encore petit, près d’une forêt.', 'Cherche l’activité que le roi y pratique.'],
    },
    {
      ...P.chasse,
      q: 'À partir de quelle année Versailles est-il la résidence principale du roi ?',
      a: '1682',
      wrong: [
        { label: '1515', why: '1515 est le début du règne de François Ier.' },
        { label: '1598', why: '1598 est l’année de l’édit de Nantes.' },
        { label: '1789', why: '1789 est l’année de la Révolution.' },
      ],
      gap: ['Versailles devient la résidence principale du roi en ', ' (une année).', ['1682']],
      indice: 'C’est pendant le règne de Louis XIV.',
      etapes: ['Pense aux dates du règne : 1643 à 1715.', 'Garde l’année placée entre ces deux dates.'],
    },
    {
      ...P.courtisans,
      q: 'Pour Louis XIV, à quoi servent aussi les fêtes de la cour ?',
      a: 'à contrôler les courtisans',
      wrong: [
        { label: 'à élire un nouveau roi', why: 'On n’élit pas le roi : Louis XIV garde le pouvoir.' },
        { label: 'à donner le pouvoir aux invités', why: 'Au contraire, les fêtes aident le roi à les contrôler.' },
        { label: 'à remplacer la guerre pour toujours', why: 'Les fêtes ne suppriment pas les guerres.' },
      ],
      gap: ['Les fêtes aident le roi à contrôler les ', ' (mot qui commence par « court »).', ['courtisans']],
      indice: 'Le roi veut garder le pouvoir.',
      etapes: ['Demande-toi : que gagne le roi avec ces fêtes ?', 'Pense à ceux qui vivent près de lui.'],
    },
    {
      ...P.dates,
      q: 'Pendant quelles années Louis XIV est-il roi de France ?',
      a: 'de 1643 à 1715',
      wrong: [
        { label: 'de 1226 à 1270', why: 'Ces années sont celles de Louis IX.' },
        { label: 'de 1515 à 1547', why: 'Ces années sont celles de François Ier.' },
        { label: 'de 1594 à 1610', why: 'Ces années vont avec Henri IV.' },
      ],
      gap: ['Louis XIV devient roi en ', ' (une année).', ['1643']],
      indice: 'Il règne surtout au XVIIe siècle.',
      etapes: ['Cherche des années du XVIIe siècle.', 'Élimine les règnes des autres rois.'],
    },
    {
      ...P.colonial,
      q: 'Qui dirige la création du premier empire colonial français ?',
      a: 'le pouvoir du roi',
      wrong: [
        { label: 'les paysans seuls', why: 'Les paysans ne dirigent pas le royaume : le roi décide.' },
        { label: 'les courtisans seuls', why: 'Les courtisans entourent le roi, mais c’est lui qui dirige.' },
        { label: 'les savants du Collège de France', why: 'Ces savants font des recherches : ils ne dirigent pas.' },
      ],
      gap: ['Le premier empire colonial français est créé par le pouvoir ', ' (mot proche de « roi »).', ['royal']],
      indice: 'Pense à celui qui gouverne le royaume.',
      etapes: ['Demande-toi qui commande en France alors.', 'Cherche celui qui porte la couronne.'],
    },
    {
      ...P.regente,
      q: 'Quelle personne de sa famille gouverne quand Louis XIV est enfant ?',
      a: 'sa mère, Anne d’Autriche',
      wrong: [
        { label: 'sa mère, Blanche de Castille', why: 'Blanche de Castille est la mère de Louis IX.' },
        { label: 'son ministre, Sully', why: 'Sully est le ministre d’Henri IV.' },
        { label: 'le roi Henri IV', why: 'Henri IV est mort en 1610, avant la naissance de Louis XIV.' },
      ],
      gap: ['La mère de Louis XIV, ', ' d’Autriche, gouverne quand il est enfant.', ['Anne']],
      indice: 'C’est la fille d’un roi d’Espagne.',
      etapes: ['Cherche une femme de la famille du roi.', 'Élimine la mère de Louis IX.'],
    },
  ],
  paires3: [
    ['Louis XIV', 'Le roi Soleil'],
    ['Versailles', 'Son grand château'],
    ['Courtisans', 'Vivent à la cour'],
  ],
  paires5: [
    ['1643', 'Début du règne'],
    ['1682', 'Résidence à Versailles'],
    ['1715', 'Fin du règne'],
    ['Anne d’Autriche', 'Mère du roi'],
    ['Courtisans', 'Vivent à la cour'],
  ],
  ordre: {
    reperes: [
      'Louis XIV devient roi',
      'Le jeune roi danse en Soleil levant',
      'Première grande fête de son règne à Versailles',
      'Versailles devient sa résidence principale',
    ],
    reponse: 'roi, ballet, grande fête, puis résidence',
    indice: 'Il faut être roi avant de s’installer à Versailles.',
    etapes: ['Place le début du règne en premier : 1643.', 'Place ensuite 1653, puis 1664, puis 1682.'],
  },
  libres: [
    {
      ...P.soleil,
      q: 'Écris le mot qui complète le surnom de Louis XIV : « le roi … ».',
      accepted: ['Soleil', 'le roi Soleil', 'roi Soleil', 'le Soleil'],
      traps: [
        { text: 'chrétien', why: 'Le roi chrétien est Louis IX.' },
        { text: 'Lune', why: 'Son astre est celui du jour.' },
      ],
      indice: 'C’est un astre.',
      etapes: ['Pense à l’astre qui éclaire le jour.', 'Écris le nom de cet astre.'],
    },
    {
      ...P.regente,
      q: 'Écris le nom de la mère de Louis XIV, qui gouverne quand il est enfant.',
      accepted: ['Anne d’Autriche', 'Anne', 'la reine Anne d’Autriche', 'la reine Anne'],
      traps: [
        { text: 'Blanche de Castille', why: 'Blanche de Castille est la mère de Louis IX.' },
        { text: 'Mazarin', why: 'Mazarin aide la reine à gouverner : il n’est pas la mère du roi.' },
      ],
      indice: 'Elle est la fille d’un roi d’Espagne.',
      etapes: ['Pense à la reine qui gouverne après 1643.', 'Écris son prénom, puis la suite de son nom.'],
    },
    {
      ...P.courtisans,
      q: 'Écris le nom des personnes qui vivent à la cour, près du roi.',
      accepted: ['courtisans', 'les courtisans', 'des courtisans', 'courtisan', 'un courtisan'],
      traps: [
        { text: 'paysans', why: 'Les paysans travaillent la terre.' },
        { text: 'colons', why: 'Les colons s’installent loin, dans des colonies.' },
      ],
      indice: 'Ces personnes entourent le roi.',
      etapes: ['Pense au mot « cour ».', 'Ajoute la fin du mot qui désigne ces personnes.'],
    },
    {
      ...P.colonial,
      q: 'Des personnes sont forcées de travailler et appartiennent à un maître. Écris le nom de cette injustice.',
      accepted: ['esclavage', 'l’esclavage', 'un esclavage'],
      traps: [
        { text: 'servage', why: 'Le servage concerne des paysans du Moyen Âge, liés à un seigneur.' },
        { text: 'colonie', why: 'Une colonie est un territoire dirigé par un pays lointain.' },
      ],
      indice: 'Cette injustice a frappé des Africains déplacés.',
      etapes: ['Pense aux Africains emmenés de force vers les colonies.', 'Écris le mot qui commence par « escl ».'],
    },
  ],
  docs: [
    {
      title: 'Un jeune danseur',
      lines: [
        'En 1653, un roi de 14 ans danse dans un grand ballet.',
        'Son costume représente un astre qui se lève.',
        'Plus tard, il agrandit un pavillon de chasse.',
      ],
      qs: [
        {
          ...P.ballet,
          q: 'Écris le nom et le numéro de ce roi.',
          accepted: LOUIS_XIV,
          traps: [
            { text: 'Louis XIII', why: 'Louis XIII est son père, mort en 1643.' },
            { text: 'Louis IX', why: 'Louis IX vit au XIIIe siècle.' },
          ],
          indice: 'Il devient roi en 1643.',
          etapes: ['Relis la ligne 1 : repère l’année.', 'Pense au roi enfant de cette époque.'],
        },
        {
          ...P.ballet,
          q: 'Complète le surnom de ce roi : « le roi … ».',
          accepted: ['Soleil', 'le roi Soleil', 'roi Soleil', 'le Soleil'],
          traps: [
            { text: 'Lune', why: 'La Lune brille la nuit : le costume montre le jour.' },
            { text: 'chrétien', why: 'Le roi chrétien est Louis IX.' },
          ],
          indice: 'Pense à l’astre qui se lève le matin.',
          etapes: ['Relis la ligne 2 : un astre se lève.', 'Écris le nom de l’astre du matin.'],
        },
      ],
    },
    {
      title: 'Un domaine qui grandit',
      lines: [
        'Un roi fait peu à peu agrandir un pavillon de chasse.',
        'Il y donne de grandes fêtes.',
        'En 1682, il en fait sa résidence principale.',
      ],
      qs: [
        {
          ...P.chasse,
          q: 'Écris le nom de ce château.',
          accepted: VERSAILLES,
          traps: [
            { text: 'Chambord', why: 'Chambord est un château de François Ier.' },
            { text: 'Louvre', why: 'Le Louvre est un palais de Paris, pas ce domaine.' },
          ],
          indice: 'Pense au roi Soleil.',
          etapes: ['Relis la ligne 3 : repère l’année 1682.', 'Pense au château du roi Soleil.'],
        },
        {
          ...P.chasse,
          q: 'Écris le nom du roi qui fait de ce lieu sa résidence principale.',
          accepted: LOUIS_XIV,
          traps: [
            { text: 'Louis XIII', why: 'Louis XIII est mort en 1643, avant 1682.' },
            { text: 'Henri IV', why: 'Henri IV est mort en 1610.' },
          ],
          indice: 'Il règne en 1682.',
          etapes: ['Relis la ligne 3 : repère l’année.', 'Cherche le roi qui règne à cette date.'],
        },
      ],
    },
    {
      title: 'Les fêtes de la cour',
      lines: [
        'En 1664, le roi donne une grande fête près de son pavillon de chasse.',
        'La fête dure plusieurs jours.',
        'Ces fêtes aident le roi à contrôler les gens de sa cour.',
      ],
      qs: [
        {
          ...P.courtisans,
          q: 'Écris le mot qui désigne les gens de la cour.',
          accepted: ['courtisans', 'les courtisans', 'des courtisans', 'courtisan', 'un courtisan'],
          traps: [
            { text: 'paysans', why: 'Les paysans travaillent la terre, loin de la cour.' },
            { text: 'comédiens', why: 'Les comédiens jouent les spectacles : on cherche tout l’entourage du roi.' },
          ],
          indice: 'Ces personnes entourent le roi.',
          etapes: ['Relis la ligne 3 : des gens entourent le roi.', 'Cherche le mot formé à partir de « cour ».'],
        },
        {
          ...P.premiereFete,
          q: 'Écris le nom du lieu de cette fête, devenu ensuite un grand château.',
          accepted: VERSAILLES,
          traps: [
            { text: 'Amboise', why: 'Amboise est liée à la Renaissance.' },
            { text: 'Nantes', why: 'Nantes donne son nom à un édit.' },
          ],
          indice: 'Pense au château du roi Soleil.',
          etapes: ['Relis la ligne 1 : un pavillon de chasse.', 'Souviens-toi du château qu’il est devenu.'],
        },
        {
          ...P.premiereFete,
          q: 'Écris le nom et le numéro du roi qui donne cette fête.',
          accepted: LOUIS_XIV,
          traps: [
            { text: 'Louis XIII', why: 'Louis XIII est mort en 1643, avant cette fête.' },
            { text: 'Henri IV', why: 'Henri IV est mort en 1610.' },
          ],
          indice: 'Cherche le roi qui règne en 1664.',
          etapes: ['Relis la ligne 1 : repère l’année.', 'Pense au roi qui règne à cette date.'],
        },
      ],
    },
  ],
};

export const NOTIONS: readonly NotionGuidee[] = [louisIx, francoisIer, henriIv, louisXiv];
export const SKILLS: readonly Skill[] = NOTIONS.map((n) => notionGuidee(n, SOURCE, CREDIT));
