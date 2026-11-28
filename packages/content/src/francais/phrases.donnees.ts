/**
 * Données du chapitre « Types et formes de phrases » (CM1) : faits cités et banques de phrases.
 * Chaque fait porte l'identifiant de sa source (registre `sources.ts`) et sa citation exacte.
 */
import type { Sens } from '../types.ts';

export interface Fait {
  readonly id: string;
  readonly source: string;
  readonly citation: string;
}

const PROGRAMME = 'francais-cycle3-2025';

export const FAITS: readonly Fait[] = [
  {
    id: 'types',
    source: PROGRAMME,
    citation: 'Identifier les trois types de phrases (déclaratif, interrogatif, impératif ou injonctif)',
  },
  {
    id: 'formes',
    source: PROGRAMME,
    citation: 'Identifier les principales formes de phrases (négative, exclamative)',
  },
  {
    id: 'vocabulaire',
    source: PROGRAMME,
    citation: 'types de phrases : déclaratives, interrogatives et impératives ; formes négative et exclamative',
  },
  {
    id: 'accord-gn',
    source: PROGRAMME,
    citation: 'Réaliser la chaîne d’accords au sein du groupe nominal',
  },
  {
    id: 'interroger',
    source: PROGRAMME,
    citation:
      'en employant le point d’interrogation et en utilisant diverses tournures ou intonations pour exprimer l’interrogation (inversion du sujet, est-ce que, intonation ascendante à l’oral, etc.)',
  },
  {
    id: 'transformer',
    source: PROGRAMME,
    citation: 'Transformer à l’oral puis à l’écrit des phrases d’un type à un autre, d’une forme à une autre',
  },
  {
    id: 'point-interrogation',
    source: 'cnrtl-interrogation',
    citation: "Interrogation contenue dans une phrase indépendante et qui se termine par un point d'interrogation",
  },
  {
    id: 'point-exclamation',
    source: 'cnrtl-exclamation',
    citation: "Signe de ponctuation dont on fait suivre l'exclamation",
  },
  {
    id: 'emotion',
    source: 'cnrtl-exclamation',
    citation: 'Cri exprimant une émotion vive',
  },
];

export const fait = (id: string): Fait => {
  const f = FAITS.find((x) => x.id === id);
  if (!f) throw new Error(`fait inconnu : ${id}`);
  return f;
};

/** Phrases sans signe final (le signe est ajouté selon le type). */
export const DECLARATIVES: readonly string[] = [
  'Le chat dort sur le canapé',
  'Mon frère range sa chambre',
  'Les oiseaux chantent le matin',
  'Nous mangeons à la cantine',
  'La maîtresse lit une histoire',
  'Il pleut depuis ce matin',
  'Ma sœur joue du piano',
  'Les élèves entrent en classe',
];

export const INTERROGATIVES: readonly string[] = [
  'Où as-tu rangé ton cahier',
  'Quand part le train',
  'Pourquoi le ciel est-il bleu',
  'Est-ce que tu aimes les pommes',
  'Qui a posé ce livre sur la table',
  'Combien coûte ce stylo',
  'Vas-tu au parc avec nous',
  'Que mange le chat',
];

export const IMPERATIVES: readonly string[] = [
  'Ferme la porte',
  'Écoute bien la consigne',
  'Prends ton cahier',
  'Lis la leçon à voix haute',
  'Sois à l’heure',
  'Range tes affaires',
];

export const EXCLAMATIVES: readonly string[] = [
  'Quel beau dessin',
  'Comme ce gâteau est bon',
  'Que ce paysage est magnifique',
  'Quelle belle surprise',
  'Comme tu as grandi',
  'Que ce film est drôle',
  'Quelle chance tu as',
];

/** Informations neutres : aucune ne porte d’émotion, le point est le seul signe attendu. */
export const INFORMATIONS: readonly string[] = [
  'La piscine ouvre à neuf heures',
  'Mon cahier est dans mon sac',
  'Le car part à huit heures',
  'La cantine ouvre à midi',
  'Mon frère a dix ans',
  'Le musée ferme le lundi',
  'Nous avons sport le jeudi',
  'La classe compte douze tables',
];

/** Phrases exclamatives dont l’ordre des mots est le seul possible. */
export const EXCLAMATIVES_A_RANGER: readonly string[] = [
  'Quel beau dessin',
  'Comme tu as grandi',
  'Quelle belle surprise',
  'Quelle chance tu as',
  'Comme tu chantes bien',
  'Quel joli jardin',
  'Que tu es rapide',
  'Quelle belle journée',
];

/** Questions qui commencent comme une exclamation (« Quel », « Que »…). */
export const FAUSSES_AMIES_QUESTIONS: readonly string[] = [
  'Quel âge as-tu',
  'Que fais-tu ce soir',
  'Quelle heure est-il',
  'Que cherches-tu',
  'Quel jour sommes-nous',
  'Quel livre préfères-tu',
];

/** Informations qui commencent par « Comme » pour donner une raison. */
export const FAUSSES_AMIES_RAISONS: readonly string[] = [
  'Comme il pleut, nous restons ici',
  'Comme il est tard, je rentre',
  'Comme il fait froid, je mets un bonnet',
  'Comme j’ai faim, je prends une pomme',
];

/** Exclamations à compléter : une seule des trois tournures convient dans chaque phrase. */
export type Tournure1 = 'Quel' | 'Quelle' | 'Comme';
export interface Trou {
  readonly suite: string;
  readonly mot: Tournure1;
}

export const A_COMPLETER: readonly Trou[] = [
  { suite: 'beau château', mot: 'Quel' },
  { suite: 'grand arbre', mot: 'Quel' },
  { suite: 'joli cadeau', mot: 'Quel' },
  { suite: 'jolie maison', mot: 'Quelle' },
  { suite: 'bonne idée', mot: 'Quelle' },
  { suite: 'grande tour', mot: 'Quelle' },
  { suite: 'tu es fort', mot: 'Comme' },
  { suite: 'il court vite', mot: 'Comme' },
  { suite: 'nous avons ri', mot: 'Comme' },
];

/** Même idée dite de trois façons : déclarative, interrogative (est-ce que ou inversion), impérative. */
export interface Triplet {
  readonly declarative: string;
  readonly interrogative: string;
  readonly imperative: string;
  /** Sujet de la phrase déclarative (il disparaît à l’impératif). */
  readonly sujet: string;
  /** Ce que devient le verbe dans l’ordre. */
  readonly verbe: string;
  /** Forme fautive fréquente (« s » gardé), s’il y en a une. */
  readonly faute?: string;
}

export const TRIPLETS: readonly Triplet[] = [
  {
    declarative: 'Tu ranges ta chambre',
    interrogative: 'Est-ce que tu ranges ta chambre',
    imperative: 'Range ta chambre',
    sujet: 'tu',
    verbe: 'Ici, « ranges » perd son « s » : « Range ».',
    faute: 'Ranges ta chambre',
  },
  {
    declarative: 'Vous écoutez la radio',
    interrogative: 'Écoutez-vous la radio',
    imperative: 'Écoutez la radio',
    sujet: 'vous',
    verbe: 'Ici, « écoutez » ne change pas.',
  },
  {
    declarative: 'Tu lis cette histoire',
    interrogative: 'Lis-tu cette histoire',
    imperative: 'Lis cette histoire',
    sujet: 'tu',
    verbe: 'Ici, « lis » garde son « s ».',
  },
  {
    declarative: 'Nous partons à huit heures',
    interrogative: 'Partons-nous à huit heures',
    imperative: 'Partons à huit heures',
    sujet: 'nous',
    verbe: 'Ici, « partons » ne change pas.',
  },
  {
    declarative: 'Tu prends ton manteau',
    interrogative: 'Prends-tu ton manteau',
    imperative: 'Prends ton manteau',
    sujet: 'tu',
    verbe: 'Ici, « prends » garde son « s ».',
  },
  {
    declarative: 'Tu ouvres la fenêtre',
    interrogative: 'Est-ce que tu ouvres la fenêtre',
    imperative: 'Ouvre la fenêtre',
    sujet: 'tu',
    verbe: 'Ici, « ouvres » perd son « s » : « Ouvre ».',
    faute: 'Ouvres la fenêtre',
  },
  {
    declarative: 'Tu fermes la porte',
    interrogative: 'Est-ce que tu fermes la porte',
    imperative: 'Ferme la porte',
    sujet: 'tu',
    verbe: 'Ici, « fermes » perd son « s » : « Ferme ».',
    faute: 'Fermes la porte',
  },
  {
    declarative: 'Tu écoutes la maîtresse',
    interrogative: 'Est-ce que tu écoutes la maîtresse',
    imperative: 'Écoute la maîtresse',
    sujet: 'tu',
    verbe: 'Ici, « écoutes » perd son « s » : « Écoute ».',
    faute: 'Écoutes la maîtresse',
  },
  {
    declarative: 'Tu manges ta soupe',
    interrogative: 'Est-ce que tu manges ta soupe',
    imperative: 'Mange ta soupe',
    sujet: 'tu',
    verbe: 'Ici, « manges » perd son « s » : « Mange ».',
    faute: 'Manges ta soupe',
  },
  {
    declarative: 'Tu apportes ton cahier',
    interrogative: 'Est-ce que tu apportes ton cahier',
    imperative: 'Apporte ton cahier',
    sujet: 'tu',
    verbe: 'Ici, « apportes » perd son « s » : « Apporte ».',
    faute: 'Apportes ton cahier',
  },
  {
    declarative: 'Tu chantes cette chanson',
    interrogative: 'Est-ce que tu chantes cette chanson',
    imperative: 'Chante cette chanson',
    sujet: 'tu',
    verbe: 'Ici, « chantes » perd son « s » : « Chante ».',
    faute: 'Chantes cette chanson',
  },
  {
    declarative: 'Tu portes ce sac',
    interrogative: 'Est-ce que tu portes ce sac',
    imperative: 'Porte ce sac',
    sujet: 'tu',
    verbe: 'Ici, « portes » perd son « s » : « Porte ».',
    faute: 'Portes ce sac',
  },
];

/**
 * Court message dont une seule phrase déclarative contient « tu » (phrases sans signe final).
 * Le verbe à transformer est toujours en -er, comme au niveau 4 : il perd son « s ».
 */
export interface Message {
  readonly titre: string;
  readonly information: string;
  readonly question: string;
  readonly ordre: string;
  readonly declarative: string;
  /** La phrase déclarative devenue un ordre. */
  readonly imperative: string;
  /** Écriture fautive fréquente de cet ordre. */
  readonly faute: string;
  /** Ce que devient le verbe dans l’ordre. */
  readonly verbe: string;
}

export const MESSAGES: readonly Message[] = [
  {
    titre: 'Un mot sur le frigo',
    information: 'Le goûter est dans le placard',
    question: 'Tu as très faim',
    ordre: 'Lave tes mains',
    declarative: 'Tu arroses les plantes',
    imperative: 'Arrose les plantes',
    faute: 'Arroses les plantes',
    verbe: 'Ici, « arroses » perd son « s » : « Arrose ».',
  },
  {
    titre: 'Un message de Mamie',
    information: 'Nous arrivons dimanche midi',
    question: 'Tu viens à la gare',
    ordre: 'Pense à ton parapluie',
    declarative: 'Tu prépares la table',
    imperative: 'Prépare la table',
    faute: 'Prépares la table',
    verbe: 'Ici, « prépares » perd son « s » : « Prépare ».',
  },
  {
    titre: 'Avant la sortie',
    information: 'Le car part tôt',
    question: 'Tu as ton billet',
    ordre: 'Mets tes baskets',
    declarative: 'Tu emportes une gourde',
    imperative: 'Emporte une gourde',
    faute: 'Emportes une gourde',
    verbe: 'Ici, « emportes » perd son « s » : « Emporte ».',
  },
  {
    titre: 'Un mot pour le voisin',
    information: 'Notre chat reste à la maison',
    question: 'Tu es libre lundi',
    ordre: 'Sonne avant d’entrer',
    declarative: 'Tu donnes ses croquettes',
    imperative: 'Donne ses croquettes',
    faute: 'Donnes ses croquettes',
    verbe: 'Ici, « donnes » perd son « s » : « Donne ».',
  },
  {
    titre: 'Pour l’exposé',
    information: 'L’exposé est vendredi',
    question: 'Tu as des photos',
    ordre: 'Découpe les images',
    declarative: 'Tu recopies le titre',
    imperative: 'Recopie le titre',
    faute: 'Recopies le titre',
    verbe: 'Ici, « recopies » perd son « s » : « Recopie ».',
  },
  {
    titre: 'Dans le jardin',
    information: 'Les fraises sont mûres',
    question: 'Tu veux un panier',
    ordre: 'Ouvre la barrière',
    declarative: 'Tu laves les fraises',
    imperative: 'Lave les fraises',
    faute: 'Laves les fraises',
    verbe: 'Ici, « laves » perd son « s » : « Lave ».',
  },
  {
    titre: 'Un message de Papa',
    information: 'La séance commence à cinq heures',
    question: 'Tu viens avec ton ami',
    ordre: 'Mets un pull',
    declarative: 'Tu restes devant l’école',
    imperative: 'Reste devant l’école',
    faute: 'Restes devant l’école',
    verbe: 'Ici, « restes » perd son « s » : « Reste ».',
  },
];

/** Une question posée de trois façons. */
export interface Question3 {
  readonly declarative: string;
  readonly intonation: string;
  readonly estCeQue: string;
  readonly inversion: string;
  readonly sujet: string;
  readonly verbe: string;
}

export const QUESTIONS: readonly Question3[] = [
  {
    declarative: 'Tu viens',
    sujet: 'tu',
    verbe: 'viens',
    intonation: 'Tu viens',
    estCeQue: 'Est-ce que tu viens',
    inversion: 'Viens-tu',
  },
  {
    declarative: 'Il mange',
    sujet: 'il',
    verbe: 'mange',
    intonation: 'Il mange',
    estCeQue: 'Est-ce qu’il mange',
    inversion: 'Mange-t-il',
  },
  {
    declarative: 'Vous partez',
    sujet: 'vous',
    verbe: 'partez',
    intonation: 'Vous partez',
    estCeQue: 'Est-ce que vous partez',
    inversion: 'Partez-vous',
  },
  {
    declarative: 'Elle chante',
    sujet: 'elle',
    verbe: 'chante',
    intonation: 'Elle chante',
    estCeQue: 'Est-ce qu’elle chante',
    inversion: 'Chante-t-elle',
  },
  {
    declarative: 'Tu aimes ce livre',
    sujet: 'tu',
    verbe: 'aimes',
    intonation: 'Tu aimes ce livre',
    estCeQue: 'Est-ce que tu aimes ce livre',
    inversion: 'Aimes-tu ce livre',
  },
  {
    declarative: 'Ils jouent au ballon',
    sujet: 'ils',
    verbe: 'jouent',
    intonation: 'Ils jouent au ballon',
    estCeQue: 'Est-ce qu’ils jouent au ballon',
    inversion: 'Jouent-ils au ballon',
  },
  {
    declarative: 'Nous commençons',
    sujet: 'nous',
    verbe: 'commençons',
    intonation: 'Nous commençons',
    estCeQue: 'Est-ce que nous commençons',
    inversion: 'Commençons-nous',
  },
  {
    declarative: 'Elle finit son dessin',
    sujet: 'elle',
    verbe: 'finit',
    intonation: 'Elle finit son dessin',
    estCeQue: 'Est-ce qu’elle finit son dessin',
    inversion: 'Finit-elle son dessin',
  },
];

/** Phrase affirmative et ses formes négatives (ne… pas, ne… jamais, ne… plus). */
export interface Negation {
  readonly affirmative: string;
  readonly verbe: string;
  readonly pas: string;
  readonly jamais: string;
  readonly plus: string;
}

export const NEGATIONS: readonly Negation[] = [
  {
    affirmative: 'Le chien dort',
    verbe: 'dort',
    pas: 'Le chien ne dort pas',
    jamais: 'Le chien ne dort jamais',
    plus: 'Le chien ne dort plus',
  },
  {
    affirmative: 'Je joue au ballon',
    verbe: 'joue',
    pas: 'Je ne joue pas au ballon',
    jamais: 'Je ne joue jamais au ballon',
    plus: 'Je ne joue plus au ballon',
  },
  {
    affirmative: 'Nous aimons les carottes',
    verbe: 'aimons',
    pas: 'Nous n’aimons pas les carottes',
    jamais: 'Nous n’aimons jamais les carottes',
    plus: 'Nous n’aimons plus les carottes',
  },
  {
    affirmative: 'Elle ouvre la fenêtre',
    verbe: 'ouvre',
    pas: 'Elle n’ouvre pas la fenêtre',
    jamais: 'Elle n’ouvre jamais la fenêtre',
    plus: 'Elle n’ouvre plus la fenêtre',
  },
  {
    affirmative: 'Tu parles anglais',
    verbe: 'parles',
    pas: 'Tu ne parles pas anglais',
    jamais: 'Tu ne parles jamais anglais',
    plus: 'Tu ne parles plus anglais',
  },
  {
    affirmative: 'Ils finissent leur travail',
    verbe: 'finissent',
    pas: 'Ils ne finissent pas leur travail',
    jamais: 'Ils ne finissent jamais leur travail',
    plus: 'Ils ne finissent plus leur travail',
  },
];

/** Questions avec « est-ce que » à réécrire avec l’inversion (absentes des niveaux 1 à 4). */
export interface QuestionLue {
  readonly estCeQue: string;
  readonly inversion: string;
  readonly sujet: string;
  readonly verbe: string;
}

export const QUESTIONS_LUES: readonly QuestionLue[] = [
  { estCeQue: 'Est-ce que tu cherches ton livre', inversion: 'Cherches-tu ton livre', sujet: 'tu', verbe: 'cherches' },
  { estCeQue: 'Est-ce qu’il prend le bus', inversion: 'Prend-il le bus', sujet: 'il', verbe: 'prend' },
  { estCeQue: 'Est-ce qu’elle porte un sac', inversion: 'Porte-t-elle un sac', sujet: 'elle', verbe: 'porte' },
  { estCeQue: 'Est-ce que vous aimez ce jeu', inversion: 'Aimez-vous ce jeu', sujet: 'vous', verbe: 'aimez' },
  { estCeQue: 'Est-ce qu’ils ont un chien', inversion: 'Ont-ils un chien', sujet: 'ils', verbe: 'ont' },
  { estCeQue: 'Est-ce qu’il dessine un bateau', inversion: 'Dessine-t-il un bateau', sujet: 'il', verbe: 'dessine' },
  { estCeQue: 'Est-ce que nous prenons le train', inversion: 'Prenons-nous le train', sujet: 'nous', verbe: 'prenons' },
  {
    estCeQue: 'Est-ce qu’elles arrivent ce soir',
    inversion: 'Arrivent-elles ce soir',
    sujet: 'elles',
    verbe: 'arrivent',
  },
];

/** Phrases où « ne » a été oublié, comme à l’oral (absentes des niveaux 1 à 4). */
export interface Oubli {
  readonly fautive: string;
  readonly corrigee: string;
  readonly verbe: string;
  readonly marque: 'pas' | 'jamais';
}

export const OUBLIS: readonly Oubli[] = [
  { fautive: 'Je mange pas de poisson', corrigee: 'Je ne mange pas de poisson', verbe: 'mange', marque: 'pas' },
  {
    fautive: 'Tu ranges jamais tes jouets',
    corrigee: 'Tu ne ranges jamais tes jouets',
    verbe: 'ranges',
    marque: 'jamais',
  },
  { fautive: 'Il vient pas ce soir', corrigee: 'Il ne vient pas ce soir', verbe: 'vient', marque: 'pas' },
  {
    fautive: 'Nous regardons jamais ce film',
    corrigee: 'Nous ne regardons jamais ce film',
    verbe: 'regardons',
    marque: 'jamais',
  },
  {
    fautive: 'Elle écoute jamais la radio',
    corrigee: 'Elle n’écoute jamais la radio',
    verbe: 'écoute',
    marque: 'jamais',
  },
  { fautive: 'On entend pas la cloche', corrigee: 'On n’entend pas la cloche', verbe: 'entend', marque: 'pas' },
  {
    fautive: 'Vous oubliez jamais vos clés',
    corrigee: 'Vous n’oubliez jamais vos clés',
    verbe: 'oubliez',
    marque: 'jamais',
  },
  { fautive: 'Ils arrivent pas à l’heure', corrigee: 'Ils n’arrivent pas à l’heure', verbe: 'arrivent', marque: 'pas' },
];

/** Qui parle et dans quelle intention : sans cela, une information pourrait aussi être une question. */
export const INTENTIONS = {
  declarative: [
    'Léo informe calmement son ami',
    'Inès explique calmement à sa voisine',
    'Tom donne calmement un renseignement',
  ],
  interrogative: ['Léo pose une question à son ami', 'Inès demande à sa voisine', 'Tom veut obtenir une réponse'],
  exclamative: ['Mia, tout émue, s’écrie', 'Hugo, plein d’émotion, s’écrie', 'Lina, très émue, s’écrie'],
} as const satisfies Record<string, readonly string[]>;

/**
 * « Sens » de chaque notion (README §9) : une phrase montrée à l’enfant et le passage exact qui l’appuie.
 */
export const SENS = {
  types: {
    type: 'usage',
    text: 'Au CM1, tu reconnais les types de phrases et tu comprends leurs effets dans un texte.',
    source: PROGRAMME,
    citation:
      'Identifier les trois types de phrases (déclaratif, interrogatif, impératif ou injonctif) et comprendre leurs effets dans un texte simple',
  },
  question: {
    type: 'histoire',
    text: 'En 1550, un livre de grammaire parlait déjà du point d’interrogation.',
    source: 'cnrtl-interrogation',
    citation: "1550 gramm. interrogacion, point d'interrogacion (L. Meigret, Tretté de la gramm. fr.",
  },
  negation: {
    type: 'savais-tu',
    text: 'Dans « ne… pas », « pas » vient d’un nom ajouté à « ne » pour le renforcer.',
    source: 'cnrtl-ne',
    citation:
      'Négation ne renforcée par des subst.: ne ... gout(t)e*, ne ... mie*, ne ... mot*, ne ... nient (néant*), ne ... pas*, ne ... point*, ne ... rien*; ces groupes destinés à renforcer la négation totale',
  },
  exclamative: {
    type: 'savais-tu',
    text: 'Le point d’exclamation s’est aussi appelé « point d’admiration ».',
    source: 'cnrtl-exclamation',
    citation: "Synon. vieilli point admiratif (Ac. 1798), point d'admiration (Ac. 1835, 1878)",
  },
  ponctuation: {
    type: 'usage',
    text: 'Quand tu lis à voix haute, tu tiens compte de la ponctuation.',
    source: PROGRAMME,
    citation:
      'Lire à voix haute un texte court, après préparation, sans confondre les graphèmes, même complexes et en tenant compte des marques de ponctuation',
  },
} as const satisfies Record<string, Sens>;
