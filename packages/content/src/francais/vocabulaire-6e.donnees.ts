/**
 * Données du chapitre « Vocabulaire » (6e) : faits cités et phrases écrites pour l'exercice. Chaque fait porte
 * l'identifiant de sa source (registre `sources.ts`) et sa citation exacte.
 */
import type { Fait } from './phrases.donnees.ts';

const PROGRAMME = 'francais-cycle3-2025';

const faits = new Map<string, Fait>();
/** Identifiant de source : le mot sans accents (« règle » → « regle »). */
const slug = (mot: string): string => mot.normalize('NFD').replace(/\p{M}/gu, '').replaceAll(' ', '-');
/** Enregistre un fait et renvoie son identifiant. */
const fait = (id: string, source: string, citation: string): string => {
  faits.set(id, { id, source, citation });
  return id;
};
/** Article du Dictionnaire de l'Académie française, 9e édition (identifiant `academie-…`). */
const acad = (article: string, citation: string, id: string = slug(article)) =>
  fait(`v6-${id}`, `academie-${slug(article)}`, citation);
/** Article du Trésor de la langue française informatisé (identifiant `cnrtl-…`). */
const tlf = (article: string, citation: string, id: string = slug(article)) =>
  fait(`v6-${id}`, `cnrtl-${slug(article)}`, citation);

// ───────────────────────── Programme et définitions ─────────────────────────

fait(
  'v6-prog-morphologie',
  PROGRAMME,
  'Composer et décomposer des mots pour les analyser et en créer de nouveaux en s’appuyant sur les relations morphologiques et sémantiques',
);
fait('v6-prog-types', PROGRAMME, 'Différencier les mots simples, dérivés et composés');
fait(
  'v6-prog-synonymes',
  PROGRAMME,
  'Donner des exemples de synonymes et d’antonymes qui respectent la classe grammaticale du mot cible',
);
fait(
  'v6-prog-polysemie',
  PROGRAMME,
  'À l’oral et à l’écrit, utiliser à bon escient les mots polysémiques dans différents contextes disciplinaires',
);
fait('v6-prog-reseaux', PROGRAMME, 'les mots s’inscrivent dans différents réseaux (sémantiques et morphologiques)');
fait('v6-prog-univers', PROGRAMME, 'Développer un vocabulaire spécifique dans différents univers de référence');
fait(
  'v6-prog-outil',
  PROGRAMME,
  'Il complète un outil récapitulatif qui accorde une place essentielle au vocabulaire propre aux différents savoirs',
);

acad(
  'préfixe',
  'Élément de composition placé avant un radical pour former une unité lexicale de sens différent',
  'def-prefixe',
);
acad(
  'radical',
  "Élément commun à plusieurs mots d'une même famille, à plusieurs formes d'un même verbe, que l'on peut isoler en retranchant les différents préfixes, suffixes",
  'def-radical',
);
tlf(
  'suffixe',
  "Affixe placé à la fin d'une unité lexicale, après le radical, et qui modifie le sens de ce radical.",
  'def-suffixe',
);
acad('composé', 'Mot composé, formé de deux ou plusieurs mots', 'def-compose');
/** Exemple découpé dans le mémo. */
acad('décollage', 'Dérivé de décoller.', 'memo-decollage');
acad('dérivé', '« Nuageux » est un adjectif dérivé ou, substantif, un dérivé de « nuage ».', 'def-derive');
tlf('simple', "par opposition à un composé, est celui qu'on ne peut résoudre en éléments composants", 'def-simple');
tlf('synonyme', "De forme différente et de même sens (ou de sens voisin) qu'un autre mot.", 'def-synonyme');
acad('antonyme', "Mot dont le sens s'oppose totalement à celui d'un autre.", 'def-antonyme');
acad('propre', "Le sens propre d'un mot, son sens littéral, par opposition au sens figuré.", 'def-propre');
acad(
  'figuré',
  "Le sens figuré d'un mot, l'acception imagée, détournée qu'on lui donne, par opposition au sens littéral ou sens propre.",
  'def-figure',
);
acad('champ', "Champ lexical, ensemble d'unités lexicales groupées autour d'une même notion.", 'def-champ');

// Faits qui appuient les phrases « sens » des notions.
acad('préfixe', 'lui-même composé de prae, « devant, avant », et figere, « ficher, planter, fixer ».', 'sens-prefixe');
acad('antonyme', 'XIXe siècle. Dérivé du radical de synonyme.', 'sens-antonyme');
acad('propre', 'Emprunté du latin proprius, « qui appartient en propre ; spécial, caractéristique »', 'sens-propre');
tlf('lexical', '1962 champ lexical', 'sens-lexical');

// ───────────────────────── 1. Préfixe, radical, suffixe ─────────────────────────

export interface Decoupe {
  readonly mot: string;
  readonly prefixe: string;
  readonly radical: string;
  readonly suffixe: string;
  /** Mot d'où vient le mot construit. */
  readonly base: string;
  readonly sens: string;
  /** Le radical change de forme (« boire » → « buv »). */
  readonly radicalChange?: boolean;
  readonly faitId: string;
}

const decoupe = (
  mot: string,
  parties: readonly [string, string, string],
  base: string,
  sens: string,
  citation: string,
): Decoupe => ({
  mot,
  prefixe: `${parties[0]}-`,
  radical: parties[1],
  suffixe: `-${parties[2]}`,
  base,
  sens,
  faitId: acad(mot, citation, `mot-${slug(mot)}`),
});

export const DECOUPES: readonly Decoupe[] = [
  decoupe('incassable', ['in', 'cass', 'able'], 'casser', 'qu’on ne peut pas casser', 'Dérivé de casser.'),
  decoupe('imbattable', ['im', 'batt', 'able'], 'battre', 'qu’on ne peut pas battre', 'Dérivé de battre.'),
  decoupe('inoubliable', ['in', 'oubli', 'able'], 'oublier', 'qu’on ne peut pas oublier', "Dérivé d'oubliable."),
  decoupe('impensable', ['im', 'pens', 'able'], 'penser', 'qu’on ne peut pas penser', 'Dérivé de pensable.'),
  decoupe('inutilisable', ['in', 'utilis', 'able'], 'utiliser', 'qu’on ne peut pas utiliser', "Dérivé d'utilisable."),
  decoupe('inlassable', ['in', 'lass', 'able'], 'lasser', 'que rien ne peut lasser', 'Dérivé de lasser.'),
  {
    ...decoupe('illisible', ['il', 'lis', 'ible'], 'lire', 'qu’on ne peut pas lire', 'Dérivé de lisible.'),
    radicalChange: true,
  },
  {
    ...decoupe('imbuvable', ['im', 'buv', 'able'], 'boire', 'qu’on ne peut pas boire', 'Dérivé de buvable.'),
    radicalChange: true,
  },
  decoupe('déboisement', ['dé', 'bois', 'ement'], 'déboiser', 'l’action de déboiser', 'Dérivé de déboiser.'),
  decoupe('dépaysement', ['dé', 'pays', 'ement'], 'dépayser', 'le fait de dépayser', 'Dérivé de dépayser.'),
];

export interface MotCompose {
  readonly mot: string;
  readonly faitId: string;
}

/** Phrase de l'article « composé » qui donne des exemples. */
const LISTE_COMPOSES =
  '« Contredire », « surtout », « passe-temps », « plate-forme », « hôtel de ville », « château fort » sont des mots composés.';
const compose = (mot: string, citation: string, source: string = mot): MotCompose => ({
  mot,
  faitId: acad(source, citation, `compose-${slug(mot)}`),
});
export const MOTS_COMPOSES: readonly MotCompose[] = [
  compose('porte-monnaie', 'Composé de porte III et de monnaie.'),
  compose('porte-clefs', 'Composé de porte III et de clef ou clé, au pluriel.'),
  compose('passe-temps', LISTE_COMPOSES, 'composé'),
  compose('château fort', LISTE_COMPOSES, 'composé'),
  compose('plate-forme', LISTE_COMPOSES, 'composé'),
];

export interface PhraseConstruite {
  /** Mot attendu, accordé. */
  readonly mot: string;
  readonly base: string;
  /** Phrase avec « {} » à la place du mot. */
  readonly phrase: string;
}

export const PHRASES_CONSTRUITES: readonly PhraseConstruite[] = [
  { mot: 'incassable', base: 'casser', phrase: 'Ce bol tombe souvent, mais il est {}.' },
  { mot: 'imbattable', base: 'battre', phrase: 'Aux échecs, cette championne est {}.' },
  { mot: 'inoubliables', base: 'oublier', phrase: 'Nous avons vécu des vacances {}.' },
  { mot: 'illisible', base: 'lire', phrase: 'L’encre a coulé : la lettre est {}.' },
  { mot: 'impensable', base: 'penser', phrase: 'Pour mon grand-père, ce voyage était {}.' },
  { mot: 'inutilisables', base: 'utiliser', phrase: 'Sans roues, ces vélos sont {}.' },
  { mot: 'inlassable', base: 'lasser', phrase: 'Il montre une curiosité {}.' },
  { mot: 'imbuvable', base: 'boire', phrase: 'Trop salée, cette soupe froide est {}.' },
];

// ───────────────────────── 2. Synonymes et antonymes ─────────────────────────

export type Classe = 'nom' | 'verbe' | 'adjectif' | 'adverbe';

export interface Reponse {
  /** Réponse principale, la seule acceptée à l'écrit, puis les mots proches que le début donné doit écarter. */
  readonly mots: readonly [string, ...string[]];
  readonly faitId: string;
}

export interface Entree {
  readonly mot: string;
  readonly classe: Classe;
  /** Courant (niveaux 1 à 3) ou plus rare (niveau 4). */
  readonly rare: boolean;
  /** Mot de la même famille mais d'une autre classe. */
  readonly autre: readonly [string, Classe];
  readonly synonyme?: Reponse;
  readonly antonyme?: Reponse;
  /** Phrase avec « {} » à la place du mot. */
  readonly phrase: string;
}

const rel = (article: string, relation: string, citation: string, ...mots: [string, ...string[]]): Reponse => ({
  mots,
  faitId: tlf(article, citation, `${relation}-${slug(article)}`),
});
const relAcad = (article: string, relation: string, citation: string, ...mots: [string, ...string[]]): Reponse => ({
  mots,
  faitId: acad(article, citation, `${relation}-${slug(article)}`),
});

export const ENTREES: readonly Entree[] = [
  {
    mot: 'courage',
    classe: 'nom',
    rare: false,
    autre: ['courageux', 'adjectif'],
    synonyme: rel('courage', 'syn', 'Synon. bravoure, cran, intrépidité, témérité, vaillance', 'bravoure'),
    antonyme: rel('courage', 'ant', 'anton. couardise, faiblesse, lâcheté, poltronnerie.', 'lâcheté'),
    phrase: 'Le pompier montre son {}.',
  },
  {
    mot: 'richesse',
    classe: 'nom',
    rare: false,
    autre: ['riche', 'adjectif'],
    synonyme: rel('richesse', 'syn', 'Synon. fortune, opulence', 'opulence'),
    antonyme: rel('richesse', 'ant', 'anton. besoin, dénuement, misère, pauvreté.', 'pauvreté'),
    phrase: 'Ce conte parle de {}.',
  },
  {
    mot: 'victoire',
    classe: 'nom',
    rare: false,
    autre: ['victorieux', 'adjectif'],
    synonyme: rel('victoire', 'syn', 'Synon. réussite, triomphe', 'triomphe'),
    antonyme: rel('victoire', 'ant', 'anton. défaite, échec, insuccès, revers.', 'défaite', 'déroute'),
    phrase: 'L’équipe fête sa {}.',
  },
  {
    mot: 'sincérité',
    classe: 'nom',
    rare: true,
    autre: ['sincère', 'adjectif'],
    synonyme: rel('sincérité', 'syn', 'Synon. franchise, loyauté', 'franchise'),
    antonyme: rel('sincérité', 'ant', 'anton. fourberie, hypocrisie.', 'hypocrisie'),
    phrase: 'On apprécie sa {}.',
  },
  {
    mot: 'pénurie',
    classe: 'nom',
    rare: true,
    autre: ['rare', 'adjectif'],
    synonyme: rel(
      'pénurie',
      'syn',
      'Synon. carence, défaut, insuffisance, manque, rareté',
      'manque',
      'carence',
      'défaut',
      'insuffisance',
      'rareté',
    ),
    antonyme: rel('pénurie', 'ant', 'anton. abondance.', 'abondance'),
    phrase: 'La ville craint une {} d’eau.',
  },
  {
    mot: 'habile',
    classe: 'adjectif',
    rare: false,
    autre: ['habileté', 'nom'],
    synonyme: rel('habile', 'syn', 'Synon. adroit, capable, fin, débrouillard', 'adroit'),
    antonyme: rel('habile', 'ant', 'anton. maladroit, malhabile.', 'maladroit', 'malhabile'),
    phrase: 'Ce potier est très {}.',
  },
  {
    mot: 'généreux',
    classe: 'adjectif',
    rare: false,
    autre: ['générosité', 'nom'],
    antonyme: rel('généreux', 'ant', 'Anton. avare.', 'avare'),
    phrase: 'Mon voisin est {}.',
  },
  {
    mot: 'antique',
    classe: 'adjectif',
    rare: false,
    autre: ['antiquité', 'nom'],
    antonyme: rel('antique', 'ant', 'Anton. moderne.', 'moderne'),
    phrase: 'Le musée montre un vase {}.',
  },
  {
    mot: 'immense',
    classe: 'adjectif',
    rare: true,
    autre: ['immensité', 'nom'],
    synonyme: rel('immense', 'syn', 'Synon. ample, gigantesque.', 'gigantesque'),
    phrase: 'Le navire traverse un océan {}.',
  },
  {
    mot: 'paisible',
    classe: 'adjectif',
    rare: true,
    autre: ['paix', 'nom'],
    synonyme: rel('paisible', 'syn', 'Synon. placide, serein, tranquille.', 'serein'),
    phrase: 'Le vieux chat garde un air {}.',
  },
  {
    mot: 'diminuer',
    classe: 'verbe',
    rare: false,
    autre: ['diminution', 'nom'],
    synonyme: rel(
      'diminuer',
      'syn',
      'Synon. abréger, alléger, amincir, atténuer, baisser, raccourcir, réduire',
      'réduire',
    ),
    antonyme: rel(
      'diminuer',
      'ant',
      'Anton. accentuer, accroître, agrandir, allonger, augmenter',
      'augmenter',
      'accroître',
      'accentuer',
      'agrandir',
      'allonger',
    ),
    phrase: 'Le prix va {}.',
  },
  {
    mot: 'autoriser',
    classe: 'verbe',
    rare: false,
    autre: ['autorisation', 'nom'],
    synonyme: rel('autoriser', 'syn', 'accepter, accorder, confirmer, consentir, permettre', 'permettre'),
    antonyme: rel('autoriser', 'ant', 'Anton. défendre, démentir, désavouer, interdire', 'interdire'),
    phrase: 'Le règlement va {} ce jeu.',
  },
  {
    mot: 'édifier',
    classe: 'verbe',
    rare: true,
    autre: ['édifice', 'nom'],
    synonyme: relAcad('édifier', 'syn', 'Construire un édifice.', 'construire'),
    antonyme: rel('édifier', 'ant', 'Anton. bouleverser, détruire.', 'détruire'),
    phrase: 'La ville veut {} une tour.',
  },
  {
    mot: 'cacher',
    classe: 'verbe',
    rare: false,
    autre: ['cachette', 'nom'],
    synonyme: rel('cacher', 'syn', 'Synon. dissimuler.', 'dissimuler'),
    phrase: 'Le renard veut {} sa proie.',
  },
  {
    mot: 'rarement',
    classe: 'adverbe',
    rare: false,
    autre: ['rare', 'adjectif'],
    antonyme: rel('rarement', 'ant', 'Anton. souvent, fréquemment.', 'souvent'),
    phrase: 'Il pleut {} ici.',
  },
  {
    mot: 'jamais',
    classe: 'adverbe',
    rare: false,
    autre: ['éternel', 'adjectif'],
    antonyme: rel('jamais', 'ant', 'Anton. toujours.', 'toujours'),
    phrase: 'Il ne ment {}.',
  },
  {
    mot: 'rapidement',
    classe: 'adverbe',
    rare: true,
    autre: ['rapidité', 'nom'],
    synonyme: rel('rapidement', 'syn', 'Synon. prestement, vivement.', 'vivement'),
    phrase: 'La nouvelle circule {}.',
  },
  {
    mot: 'aussitôt',
    classe: 'adverbe',
    rare: true,
    autre: ['immédiat', 'adjectif'],
    synonyme: rel('aussitôt', 'syn', 'Synon. sur-le-champ, immédiatement, instantanément.', 'immédiatement'),
    phrase: 'Le médecin arrive {}.',
  },
];

// ───────────────────────── 3. Sens propre et sens figuré ─────────────────────────

export interface Figure {
  readonly mot: string;
  /** Forme du mot telle qu'elle apparaît dans les phrases. */
  readonly forme: string;
  readonly propre: string;
  readonly figure: string;
  /** Phrase plus longue, au sens figuré (niveau 5). */
  readonly contexte: string;
  /** Un mot de la phrase figurée employé au sens propre (erreur typique). */
  readonly autre: string;
  readonly sensPropre: string;
  readonly sensFigure: string;
  /** Mots au sens figuré voisin : jamais proposés ensemble. */
  readonly voisins?: string;
  readonly faitPropre: string;
  readonly faitFigure: string;
}

const figure = (
  f: Omit<Figure, 'faitPropre' | 'faitFigure'>,
  citationPropre: string,
  citationFigure: string,
): Figure => ({
  ...f,
  faitPropre: acad(f.mot, citationPropre, `propre-${slug(f.mot)}`),
  faitFigure: acad(f.mot, citationFigure, `figure-${slug(f.mot)}`),
});

export const FIGURES: readonly Figure[] = [
  figure(
    {
      mot: 'pluie',
      forme: 'pluie',
      propre: 'Une {} fine mouille la cour.',
      figure: 'La gagnante reçoit une {} de compliments.',
      contexte: 'Au gymnase, après la finale, la gagnante reçoit une {} de compliments.',
      autre: 'compliments',
      sensPropre: 'de l’eau qui tombe des nuages',
      sensFigure: 'une très grande quantité',
      voisins: 'quantité',
    },
    "Eau qui provient des nuages et tombe de l'atmosphère en gouttes.",
    'Ce qui est prodigué avec une extrême abondance, en très grande quantité.',
  ),
  figure(
    {
      mot: 'avalanche',
      forme: 'avalanche',
      propre: 'Une {} a coupé la route de montagne.',
      figure: 'Le facteur apporte une {} de lettres.',
      contexte: 'Lundi matin, au collège, le professeur reçoit une {} de questions.',
      autre: 'lettres',
      sensPropre: 'une masse de neige qui dévale',
      sensFigure: 'beaucoup de choses à la fois',
      voisins: 'quantité',
    },
    "Brusque coulée de neige qui se détache d'une montagne et descend dans la vallée",
    'Quantité de choses qui arrivent en même temps.',
  ),
  figure(
    {
      mot: 'racine',
      forme: 'racine',
      propre: 'Une {} du chêne soulève le trottoir.',
      figure: 'Elle cherche la {} du problème.',
      contexte: 'Pendant le conseil de classe, le délégué cherche la {} du problème.',
      autre: 'problème',
      sensPropre: 'une partie de la plante sous terre',
      sensFigure: 'ce qui est à l’origine',
    },
    "les végétaux se fixent dans le sol et absorbent l'eau",
    "Ce qui est à l'origine, au principe de quelque chose.",
  ),
  figure(
    {
      mot: 'pilier',
      forme: 'pilier',
      propre: 'Un {} de pierre soutient la voûte.',
      figure: 'Cette bénévole est un {} du club.',
      contexte: 'Depuis dix ans, au gymnase, notre voisine reste un {} du club.',
      autre: 'club',
      sensPropre: 'un support massif d’un bâtiment',
      sensFigure: 'un soutien indispensable',
    },
    "destiné à soutenir un édifice ou une partie d'une construction.",
    "Ce qui sert de soutien, d'appui nécessaire.",
  ),
  figure(
    {
      mot: 'mur',
      forme: 'mur',
      propre: 'Le maçon monte un {} de briques.',
      figure: 'Il y a un {} entre ces deux voisins.',
      contexte: 'Depuis leur dispute, il y a un {} entre les deux anciens amis.',
      autre: 'voisins',
      sensPropre: 'une construction haute qui sépare',
      sensFigure: 'une limite impossible à franchir',
    },
    'Ouvrage de maçonnerie élevé en hauteur, qui sert à enclore un espace',
    'Ce qui constitue une limite infranchissable.',
  ),
  figure(
    {
      mot: 'nuage',
      forme: 'nuage',
      propre: 'Un gros {} cache le soleil.',
      figure: 'Il n’y a aucun {} dans leur amitié.',
      contexte: 'Pendant tout le voyage, il n’y a aucun {} dans leur amitié.',
      autre: 'amitié',
      sensPropre: 'un amas de gouttes dans le ciel',
      sensFigure: 'un souci, une tristesse',
    },
    "Amas de fines gouttelettes d'eau en suspension dans l'air",
    'Tout ce qui rend sombre, triste, soucieux',
  ),
  figure(
    {
      mot: 'forêt',
      forme: 'forêt',
      propre: 'La {} abrite des cerfs.',
      figure: 'Ce tableau est une {} de chiffres.',
      contexte: 'Au cours de maths, la page ressemble à une {} de chiffres.',
      autre: 'chiffres',
      sensPropre: 'une grande étendue couverte d’arbres',
      sensFigure: 'un ensemble compliqué et confus',
      voisins: 'quantité',
    },
    "Vaste étendue couverte d'arbres",
    'Ensemble complexe et confus.',
  ),
  figure(
    {
      mot: 'flamme',
      forme: 'flamme',
      propre: 'La {} de la bougie vacille.',
      figure: 'L’oratrice parle avec {}.',
      contexte: 'Devant la classe, la déléguée parle de son projet avec {}.',
      autre: 'oratrice',
      sensPropre: 'la lumière d’un feu',
      sensFigure: 'une vive ardeur',
    },
    'Lumière produite par les gaz incandescents',
    'Vive ardeur, chaleur, passion.',
  ),
  figure(
    {
      mot: 'semer',
      forme: 'sème',
      propre: 'Le jardinier {} des radis.',
      figure: 'Cette rumeur {} le doute.',
      contexte: 'Dans le village, ce message anonyme {} le doute.',
      autre: 'rumeur',
      sensPropre: 'mettre des graines en terre',
      sensFigure: 'faire naître et se répandre',
      voisins: 'naissance',
    },
    'Répandre en surface ou mettre en terre des graines',
    'Être à l’origine de ce qui est susceptible de se propager, de s’amplifier.',
  ),
  figure(
    {
      mot: 'dévorer',
      forme: 'dévore',
      propre: 'Le lion {} sa proie.',
      figure: 'Elle {} un roman en une soirée.',
      contexte: 'Chaque soir, dans sa chambre, mon frère {} un nouveau roman.',
      autre: 'roman',
      sensPropre: 'manger en déchirant avec les dents',
      sensFigure: 'lire avec passion et très vite',
    },
    'Manger en déchirant avec les dents.',
    'Dévorer un livre, le lire avec avidité et promptitude.',
  ),
  figure(
    {
      mot: 'éteindre',
      forme: 'éteint',
      propre: 'Le pompier {} l’incendie.',
      figure: 'Cette nouvelle {} son enthousiasme.',
      contexte: 'Au moment de partir, la mauvaise météo {} notre enthousiasme.',
      autre: 'nouvelle',
      sensPropre: 'arrêter un feu',
      sensFigure: 'faire disparaître un sentiment',
    },
    'Arrêter une combustion.',
    'Mettre fin à, faire disparaître.',
  ),
  figure(
    {
      mot: 'germer',
      forme: 'germe',
      propre: 'Le blé {} dans le champ.',
      figure: 'Une idée {} dans mon esprit.',
      contexte: 'Pendant la visite du musée, un projet {} dans son esprit.',
      autre: 'idée',
      sensPropre: 'commencer à pousser, pour une graine',
      sensFigure: 'commencer à se former',
      voisins: 'naissance',
    },
    'Pousser son germe en dehors de la graine',
    'Naître, commencer à se développer, à croître.',
  ),
];

// ───────────────────────── 4. Champ lexical ─────────────────────────

export interface MotChamp {
  readonly mot: string;
  /** Sens du mot, en quelques mots simples. */
  readonly glose: string;
  /** Forme utilisée dans la phrase (niveau 5). */
  readonly forme: string;
  /** Phrase qui ne contient qu'un seul mot du champ, remplacé par « {} ». */
  readonly phrase: string;
  readonly faitId: string;
}

export interface Champ {
  readonly nom: string;
  /** Le thème avec son article. */
  readonly theme: string;
  /** Écritures justes pour nommer le thème. */
  readonly accepte: readonly string[];
  readonly mots: readonly MotChamp[];
}

const mc = (mot: string, glose: string, citation: string, phrase: string, forme: string = mot): MotChamp => ({
  mot,
  glose,
  forme,
  phrase,
  faitId: acad(mot, citation, `champ-${slug(mot)}`),
});

export const CHAMPS: readonly Champ[] = [
  {
    nom: 'mer',
    theme: 'la mer',
    accepte: ['mer', 'la mer', 'océan', 'l’océan', 'marine', 'la marine', 'navigation', 'la navigation'],
    mots: [
      mc(
        'marée',
        'la mer qui monte puis descend',
        "les eaux de la mer s'élèvent et s'abaissent.",
        'Ce matin, la {} monte vite.',
      ),
      mc(
        'marin',
        'une personne qui sait naviguer en mer',
        "Personne qui connaît l'art de la navigation sur mer",
        'Le vieux {} raconte sa vie.',
      ),
      mc(
        'houle',
        'les mouvements de la surface de la mer',
        "Mouvement d'ondulation de la surface de la mer",
        'Une forte {} surprend tout le monde.',
      ),
      mc(
        'matelot',
        'un membre de l’équipage d’un bateau',
        "Homme d'équipage d'un bâtiment de mer",
        'Le jeune {} prépare son sac.',
      ),
      mc(
        'naviguer',
        'aller sur l’eau en bateau',
        "Aller sur mer, sur un lac, sur un cours d'eau.",
        'Nous allons {} jusqu’à ce soir.',
      ),
    ],
  },
  {
    nom: 'forêt',
    theme: 'la forêt',
    accepte: [
      'forêt',
      'la forêt',
      'foret',
      'la foret',
      'bois',
      'le bois',
      'les bois',
      'forêts',
      'les forêts',
      'arbres',
      'les arbres',
    ],
    mots: [
      mc(
        'clairière',
        'un espace sans arbres dans une forêt',
        "Espace dégarni d'arbres au milieu d'une forêt.",
        'Nous déjeunons dans une {}.',
      ),
      mc(
        'bûcheron',
        'la personne qui abat les arbres',
        'Personne qui abat les arbres dans une forêt',
        'Le {} range ses gants.',
      ),
      mc('futaie', 'une forêt de grands arbres', 'forêt de grands arbres.', 'La lumière traverse la haute {}.'),
      mc('orée', 'le bord d’un bois', "Il parvint à l'orée du bois.", 'Une voiture attend à l’{} depuis midi.'),
      mc(
        'bosquet',
        'un petit bois',
        "Petit bois ; terrain planté d'arbres ou d'arbustes.",
        'Mon ballon a roulé dans le {}.',
      ),
    ],
  },
  {
    nom: 'musique',
    theme: 'la musique',
    accepte: ['musique', 'la musique', 'chant', 'le chant', 'chanson', 'la chanson', 'les chansons'],
    mots: [
      mc(
        'mélodie',
        'une suite de sons qui forme un air',
        'constituant une ligne musicale',
        'Cette {} reste dans ma tête.',
      ),
      mc(
        'rythme',
        'l’organisation des sons et des silences',
        'MUSIQUE Organisation des divers sons et silences',
        'Le public suit le {} avec les mains.',
      ),
      mc(
        'refrain',
        'la partie d’une chanson qui revient',
        'suite de mots qui revient entre les couplets, sur une même mélodie',
        'Tout le car reprend le {}.',
      ),
      mc(
        'musicien',
        'une personne qui fait de la musique',
        "Personne qui pratique l'art de la musique.",
        'Le {} salue avant de partir.',
      ),
      mc(
        'fredonner',
        'chanter à mi-voix',
        'Chanter sans articuler distinctement, à mi-voix',
        'Papi aime {} en jardinant.',
      ),
    ],
  },
  {
    nom: 'peur',
    theme: 'la peur',
    accepte: ['peur', 'la peur', 'crainte', 'la crainte', 'terreur', 'la terreur'],
    mots: [
      mc('frayeur', 'une peur brusque et violente', 'Peur brusque et violente', 'Le bruit lui cause une {}.'),
      mc('effroi', 'une peur intense', 'Frayeur intense, éprouvante.', 'Le héros recule avec {}.'),
      mc('épouvante', 'une peur extrême', 'Frayeur extrême, terreur soudaine', 'On lit l’{} sur son visage.'),
      mc('effrayer', 'faire très peur', 'Remplir de frayeur.', 'Ce masque peut {} les petits.'),
      mc('craintif', 'qui a facilement peur', 'Qui est sujet à la crainte.', 'Le chiot reste {} devant nous.'),
    ],
  },
  {
    nom: 'cuisine',
    theme: 'la cuisine',
    accepte: ['cuisine', 'la cuisine', 'nourriture', 'la nourriture', 'repas', 'le repas', 'les repas'],
    mots: [
      mc(
        'casserole',
        'un récipient pour cuire les aliments',
        'sert à la cuisson des aliments.',
        'Il remplit la {} d’eau.',
      ),
      mc(
        'mijoter',
        'cuire lentement à petit feu',
        'Faire cuire lentement et à petit feu.',
        'Laisse {} tout cela une heure.',
      ),
      mc(
        'assaisonner',
        'ajouter ce qui relève le goût',
        "Agrémenter les aliments d'ingrédients propres à en relever le goût.",
        'Pense à bien {} ce soir.',
      ),
      mc(
        'cuisinier',
        'la personne qui prépare les repas',
        'Personne qui fait la cuisine, qui prépare les repas.',
        'Le {} arrive à huit heures.',
      ),
      mc('potage', 'une sorte de soupe', 'Mets liquide plus ou moins consistant', 'Ce soir, le {} est très chaud.'),
    ],
  },
  {
    nom: 'météo',
    theme: 'le temps qu’il fait',
    accepte: [
      'météo',
      'la météo',
      'temps',
      'le temps',
      'temps qu’il fait',
      'le temps qu’il fait',
      'mauvais temps',
      'le mauvais temps',
      'météorologie',
      'la météorologie',
    ],
    mots: [
      mc('averse', 'une pluie soudaine et forte', 'Pluie subite et abondante.', 'Une {} nous surprend dans la cour.'),
      mc('bruine', 'une petite pluie très fine', 'Petite pluie très fine', 'La {} couvre mes lunettes.'),
      mc(
        'orage',
        'un temps avec éclairs et tonnerre',
        'se manifeste par des éclairs, généralement accompagnés de tonnerre',
        'Un {} éclate dans la soirée.',
      ),
      mc(
        'brouillard',
        'un nuage de gouttes près du sol',
        "très fines gouttelettes d'eau en suspension au-dessus du sol",
        'Le {} cache le clocher.',
      ),
      mc(
        'pluvieux',
        'marqué par la pluie',
        'Marqué par la pluie ou le risque de pluie.',
        'L’automne a été {} chez nous.',
      ),
    ],
  },
  {
    nom: 'joie',
    theme: 'la joie',
    accepte: ['joie', 'la joie', 'bonheur', 'le bonheur', 'gaieté', 'la gaieté', 'gaîté', 'la gaîté'],
    mots: [
      mc('allégresse', 'une joie vive', 'Joie vive', 'La nouvelle est reçue avec {}.'),
      mc(
        'jubiler',
        'se réjouir beaucoup',
        'Se réjouir beaucoup, éprouver un vif contentement.',
        'Ce cadeau la fait {}.',
      ),
      mc(
        'ravi',
        'très content',
        'Qui éprouve un plaisir vif, un grand contentement.',
        'Mon oncle est {} de nous voir.',
      ),
      mc('réjouir', 'rendre joyeux', 'Mettre en joie, rendre heureux', 'Ta visite va {} grand-mère.'),
    ],
  },
];

// ───────────────────────── 5. Mots des disciplines ─────────────────────────

export type Discipline = 'maths' | 'géographie' | 'histoire' | 'sciences' | 'français';

export interface Terme {
  readonly mot: string;
  readonly discipline: Discipline;
  readonly definition: string;
  /** Courant (niveaux 1 à 3) ou plus rare (niveau 4). */
  readonly rare: boolean;
  /** Phrase avec « {} » à la place du mot. */
  readonly phrase: string;
  readonly faitId: string;
}

const terme = (t: Omit<Terme, 'faitId'>, faitId: string): Terme => ({ ...t, faitId });

export const TERMES: readonly Terme[] = [
  terme(
    {
      mot: 'somme',
      discipline: 'maths',
      definition: 'le résultat d’une addition',
      rare: false,
      phrase: '12 est la {} de 7 et 5.',
    },
    tlf('somme', "Résultat d'une addition.", 'terme-somme'),
  ),
  terme(
    {
      mot: 'produit',
      discipline: 'maths',
      definition: 'le résultat d’une multiplication',
      rare: false,
      phrase: '35 est le {} de 7 par 5.',
    },
    tlf('produit', "Nombre qui est le résultat d'une multiplication.", 'terme-produit'),
  ),
  terme(
    {
      mot: 'quotient',
      discipline: 'maths',
      definition: 'le résultat d’une division',
      rare: true,
      phrase: '4 est le {} de 12 par 3.',
    },
    acad('quotient', "Nombre qui résulte de la division d'un nombre", 'terme-quotient'),
  ),
  terme(
    {
      mot: 'périmètre',
      discipline: 'maths',
      definition: 'la longueur du contour d’une figure',
      rare: false,
      phrase: 'Pour le {} d’un carré, ajoute ses quatre côtés.',
    },
    acad('périmètre', 'Ligne qui délimite une surface plane ; longueur de cette ligne.', 'terme-perimetre'),
  ),
  terme(
    {
      mot: 'diamètre',
      discipline: 'maths',
      definition: 'un segment qui traverse un cercle par son centre',
      rare: true,
      phrase: 'Le {} partage le disque en deux parts égales.',
    },
    acad(
      'diamètre',
      "Segment de droite qui unit deux points de la circonférence d'un cercle en passant par le centre.",
      'terme-diametre',
    ),
  ),
  terme(
    {
      mot: 'littoral',
      discipline: 'géographie',
      definition: 'la zone d’un pays au bord de la mer',
      rare: false,
      phrase: 'La digue protège le {} contre les vagues.',
    },
    acad('littoral', "Zone d'un pays, d'un continent, qui est au bord de la mer.", 'terme-littoral'),
  ),
  terme(
    {
      mot: 'fleuve',
      discipline: 'géographie',
      definition: 'un long cours d’eau qui rejoint souvent la mer',
      rare: false,
      phrase: 'La Loire est un {} qui se jette dans l’Atlantique.',
    },
    acad('fleuve', 'se jette directement dans une mer, dans un océan.', 'terme-fleuve'),
  ),
  terme(
    {
      mot: 'plaine',
      discipline: 'géographie',
      definition: 'une grande étendue de terres presque plate',
      rare: false,
      phrase: 'Les champs couvrent la vaste {} sans colline.',
    },
    acad('plaine', 'Vaste étendue de terres, plate ou faiblement vallonnée.', 'terme-plaine'),
  ),
  terme(
    {
      mot: 'affluent',
      discipline: 'géographie',
      definition: 'un cours d’eau qui se jette dans un autre',
      rare: true,
      phrase: 'La Marne est un {} de la Seine.',
    },
    acad('affluent', "Cours d'eau qui se jette dans un autre cours d'eau, plus important.", 'terme-affluent'),
  ),
  terme(
    {
      mot: 'confluent',
      discipline: 'géographie',
      definition: 'l’endroit où deux cours d’eau se rejoignent',
      rare: true,
      phrase: 'La ville est bâtie au {} de la Seine et de la Marne.',
    },
    acad('confluent', "Endroit où se joignent deux cours d'eau.", 'terme-confluent'),
  ),
  terme(
    {
      mot: 'siècle',
      discipline: 'histoire',
      definition: 'une durée de cent ans',
      rare: false,
      phrase: 'De 1801 à 1900, cela fait un {} entier.',
    },
    acad('siècle', 'Durée de cent ans', 'terme-siecle'),
  ),
  terme(
    {
      mot: 'millénaire',
      discipline: 'histoire',
      definition: 'une période de dix siècles',
      rare: true,
      phrase: 'Mille ans forment un {}.',
    },
    acad('millénaire', 'Période de dix siècles.', 'terme-millenaire'),
  ),
  terme(
    {
      mot: 'vestige',
      discipline: 'histoire',
      definition: 'un reste d’un monument ancien',
      rare: true,
      phrase: 'Ce mur romain est un {} du passé.',
    },
    tlf('vestige', "Restes plus ou moins reconnaissables de monuments, d'une activité humaine.", 'terme-vestige'),
  ),
  terme(
    {
      mot: 'chronologie',
      discipline: 'histoire',
      definition: 'des faits rangés dans l’ordre du temps',
      rare: false,
      phrase: 'La frise présente la {} du règne.',
    },
    acad(
      'chronologie',
      "Ensemble de faits historiques présentés dans l'ordre de leur succession.",
      'terme-chronologie',
    ),
  ),
  terme(
    {
      mot: 'germination',
      discipline: 'sciences',
      definition: 'la graine qui devient une nouvelle plante',
      rare: true,
      phrase: 'La chaleur favorise la {} des graines.',
    },
    acad(
      'germination',
      "Ensemble des transformations d'une semence génératrices d'une nouvelle plante.",
      'terme-germination',
    ),
  ),
  terme(
    {
      mot: 'évaporation',
      discipline: 'sciences',
      definition: 'le passage d’un liquide en vapeur par sa surface',
      rare: false,
      phrase: 'La flaque disparaît au soleil par {}.',
    },
    acad('évaporation', "Transformation d'un liquide en vapeur par sa surface libre.", 'terme-evaporation'),
  ),
  terme(
    {
      mot: 'herbivore',
      discipline: 'sciences',
      definition: 'un animal qui mange des végétaux',
      rare: false,
      phrase: 'La vache, qui broute dans le pré, est un {}.',
    },
    tlf('herbivore', "Animal qui se nourrit d'herbes ou d'autres substances végétales.", 'terme-herbivore'),
  ),
  terme(
    {
      mot: 'vertébré',
      discipline: 'sciences',
      definition: 'un animal dont le squelette a une colonne d’os',
      rare: true,
      phrase: 'Le poisson a une colonne d’os : c’est un {}.',
    },
    tlf('vertébré', 'Qui a des vertèbres, un squelette.', 'terme-vertebre'),
  ),
  terme(
    {
      mot: 'strophe',
      discipline: 'français',
      definition: 'un groupe de vers dans un poème',
      rare: false,
      phrase: 'Ce poème commence par une {} de quatre vers.',
    },
    tlf('strophe', "Unité structurelle du discours versifié formée d'un nombre déterminé de vers", 'terme-strophe'),
  ),
  terme(
    {
      mot: 'rime',
      discipline: 'français',
      definition: 'le même son répété à la fin de vers',
      rare: false,
      phrase: '« Matin » et « chemin » forment une {}.',
    },
    acad('rime', "Retour d'un ou plusieurs phonèmes à la fin de deux ou plusieurs vers", 'terme-rime'),
  ),
  terme(
    {
      mot: 'paragraphe',
      discipline: 'français',
      definition: 'une partie d’un texte marquée par un retour à la ligne',
      rare: false,
      phrase: 'Va à la ligne pour commencer un nouveau {}.',
    },
    acad(
      'paragraphe',
      "Subdivision d'un texte en prose, marquée par un alinéa ou un retour à la ligne",
      'terme-paragraphe',
    ),
  ),
  terme(
    {
      mot: 'narrateur',
      discipline: 'français',
      definition: 'celui qui raconte une histoire',
      rare: false,
      phrase: 'Dans ce roman, le {} dit « je ».',
    },
    acad('narrateur', 'Celui, celle qui narre, qui raconte quelque chose.', 'terme-narrateur'),
  ),
];

/** Un mot, deux sens selon la discipline. */
export interface Polyseme {
  readonly mot: string;
  readonly sens: readonly [SensDiscipline, SensDiscipline];
}
export interface SensDiscipline {
  readonly cadre: string;
  readonly phrase: string;
  readonly definition: string;
  readonly faitId: string;
}

export const POLYSEMES: readonly Polyseme[] = [
  {
    mot: 'sommet',
    sens: [
      {
        cadre: 'En géométrie',
        phrase: 'Nomme chaque sommet du triangle.',
        definition: 'le point où deux côtés se rejoignent',
        faitId: tlf('sommet', "Point(s) d'intersection des côtés d'un angle, d'un polygone.", 'sommet-geometrie'),
      },
      {
        cadre: 'En géographie',
        phrase: 'La neige couvre le sommet de la montagne.',
        definition: 'la partie la plus haute',
        faitId: tlf('sommet', "Point le plus élevé ou partie supérieure d'une chose", 'sommet-hauteur'),
      },
    ],
  },
  {
    mot: 'rayon',
    sens: [
      {
        cadre: 'En géométrie',
        phrase: 'Trace un rayon de ce cercle.',
        definition: 'un segment du centre jusqu’au cercle',
        faitId: tlf('rayon', "joignant le centre d'un cercle ou d'une sphère à un point quelconque", 'rayon-geometrie'),
      },
      {
        cadre: 'En sciences',
        phrase: 'Un rayon traverse la salle noire.',
        definition: 'une ligne de lumière',
        faitId: tlf('rayon', "Ligne ou bande lumineuse issue d'une source de lumière.", 'rayon-lumiere'),
      },
    ],
  },
  {
    mot: 'solide',
    sens: [
      {
        cadre: 'En géométrie',
        phrase: 'Le cube est un solide.',
        definition: 'une figure en trois dimensions qui a un volume',
        faitId: tlf('solide', 'Figure à trois dimensions, limitée par une surface fermée', 'solide-geometrie'),
      },
      {
        cadre: 'En sciences',
        phrase: 'La glace est de l’eau à l’état solide.',
        definition: 'un état de la matière qui garde sa forme',
        faitId: tlf(
          'solide',
          "caractérisé à l'échelle macroscopique par un volume et une forme déterminés",
          'solide-etat',
        ),
      },
    ],
  },
  {
    mot: 'source',
    sens: [
      {
        cadre: 'En géographie',
        phrase: 'La rivière naît d’une source.',
        definition: 'de l’eau qui sort du sol',
        faitId: tlf('source', 'Eau qui sort du sol.', 'source-eau'),
      },
      {
        cadre: 'En histoire',
        phrase: 'Cette lettre ancienne est une source.',
        definition: 'un document sur lequel s’appuie un auteur',
        faitId: tlf(
          'source',
          "documents, ouvrages auxquels l'auteur d'un écrit scientifique se réfère",
          'source-document',
        ),
      },
    ],
  },
];

// ───────────────────────── Faits et sources ─────────────────────────

export const FAITS_VOCABULAIRE_6E: readonly Fait[] = [...faits.values()];

export const faitVocabulaire6e = (id: string): Fait => {
  const x = faits.get(id);
  if (!x) throw new RangeError(`fait inconnu : ${id}`);
  return x;
};

/** Identifiants de source, sans doublon, des faits cités (le programme toujours en premier). */
export const sourcesVocabulaire6e = (ids: readonly string[]): string[] => [
  ...new Set([PROGRAMME, ...ids.map((id) => faitVocabulaire6e(id).source)]),
];
