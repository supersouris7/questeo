/**
 * Données du chapitre « Nature des mots » (CM1) : faits cités et banques de phrases écrites pour l'exercice.
 * Chaque fait porte l'identifiant de sa source (registre `sources.ts`) et sa citation exacte.
 */
import type { Sens } from '../types.ts';
import type { Fait } from './phrases.donnees.ts';

const PROGRAMME = 'francais-cycle3-2025';

const f = (id: string, source: string, citation: string): Fait => ({ id, source, citation });
const prog = (id: string, citation: string) => f(id, PROGRAMME, citation);
const tlfi = (id: string, citation: string) => f(id, `cnrtl-${id}`, citation);

export const FAITS_NATURE: readonly Fait[] = [
  prog('nature-fonction', 'Distinguer les notions de nature ou classe grammaticale et de fonction'),
  prog(
    'natures',
    'Nom commun, nom propre / groupe nominal / verbe / déterminant (article défini, article indéfini, déterminant possessif, déterminant démonstratif) / adjectif / pronom / adverbe / conjonction de coordination et conjonction de subordination / préposition',
  ),
  prog('fonctions', 'Sujet (du verbe) / COD / COI / attribut du sujet / complément circonstanciel'),
  prog(
    'determinants',
    'Identifier et nommer les déterminants suivants : articles définis, indéfinis, déterminants possessifs et démonstratifs',
  ),
  prog('conjonctions', 'Identifier et nommer les conjonctions de coordination'),
  prog('adverbes', 'Identifier et nommer les adverbes les plus fréquents'),
  prog('invariable', 'caractère invariable est souligné'),
  prog('pronoms', 'Distinguer les pronoms personnels sujets des pronoms personnels compléments'),
  prog('remplacer-sujet', 'Remplacer un groupe nominal sujet par un pronom personnel sujet'),
  prog('remplacer-objet', 'Remplacer un groupe nominal objet par un pronom personnel objet'),
  tlfi(
    'fonction',
    "Relations réciproques qu'entretiennent les termes d'une proposition (ou d'une phrase indépendante)",
  ),
  tlfi('article-defini', 'LE1, LA1, LES1article défini'),
  tlfi('article-indefini', 'UN2, UNE,article indéfini'),
  tlfi('possessif', 'Déterminant personnel exprimant, entre autres rapports, la possession (ex. mon, ma, mes)'),
  tlfi('mon', 'Le fém. ma est remplacé par mon devant voyelle'),
  tlfi('ton', 'Le fém. ta est remplacé par ton devant voy. ou h non aspiré'),
  tlfi('son', "il s'accorde en genre (son, sa) et en nombre (ses) avec le subst. du groupe nom."),
  tlfi('notre', 'Adjectif possessif de la première personne du pluriel'),
  tlfi('votre', 'Adjectif possessif de la deuxième personne du pluriel'),
  tlfi('leur', 'Adjectif possessif de la troisième personne, des deux genres, singulier (leur) ou pluriel (leurs)'),
  tlfi(
    'ce',
    'Ce devant un subst. (ou un pron.) masc. sing. commençant par une consonne ou un h aspiré, cet devant un subst. masc. commençant par une voyelle ou un h muet, cette devant un subst. fém. sing., ces devant un subst. plur.',
  ),
  tlfi('et', 'servant à coordonner des termes, des groupes de termes et des phrases, et exprimant une addition'),
  tlfi('ou', 'Conjonction de coordination disjonctive, indiquant une alternative'),
  tlfi('mais', 'marque une opposition'),
  tlfi('car', "Conj. de coordination introduisant une prop. qui explique ou justifie ce qui vient d'être énoncé"),
  tlfi('donc', 'Conjonction de coordination exprimant la conséquence ou la conclusion'),
  tlfi('ni', 'conjonction de coordination négative'),
  tlfi('or', 'conjonction de coordination'),
  tlfi(
    'adverbe',
    'Partie du discours neutre et invariable qui peut être rapportée à un verbe, à un adjectif, à une préposition ou à un autre adverbe',
  ),
  tlfi('toujours', 'TOUJOURSadverbe'),
  tlfi('souvent', 'SOUVENTadverbe'),
  tlfi('hier', "Dans le jour qui précède immédiatement celui où l'on est"),
  tlfi('demain', "Dans le jour qui suivra immédiatement aujourd'hui"),
  tlfi('aujourdhui', 'Adverbe de temps signifiant'),
  tlfi('deja', 'DÉJÀadverbe de temps'),
  tlfi('ensuite', "Marque la postériorité d'un fait par rapport à un autre"),
  tlfi('ici', 'Adverbe de lieu'),
  tlfi('tres', "Adv. non prédicatif marquant l'intensité forte"),
  tlfi('trop', 'Adv. intensif marquant un degré excessif'),
  tlfi(
    'beaucoup',
    'Adverbe exprimant, selon le terme auquel il se rapporte une grande quantité ou une forte intensité',
  ),
  tlfi('bien', 'BIEN1adverbe'),
  tlfi('vite', 'VITEadjectif et adverbe'),
  tlfi('je', 'Pronom personnel non prédicatif (conjoint) de la 1re personne du singulier'),
  tlfi('tu', 'toujours en fonction de suj.'),
  tlfi('il', 'toujours sujet; pour les autres fonctions, v. lui et le2'),
  tlfi('me', 'assure la fonction objet'),
  tlfi('te', 'qui assure la fonction objet'),
  tlfi('le', 'Le, la, les renvoient respectivement à un subst. masc., fém. ou plur.'),
  tlfi('lui', "lui/leur joue le rôle d'un régime indirect et est placé avant le verbe"),
];

export const faitNature = (id: string): Fait => {
  const x = FAITS_NATURE.find((y) => y.id === id);
  if (!x) throw new Error(`fait inconnu : ${id}`);
  return x;
};

/** Sources (programme + articles du dictionnaire) des faits cités par une notion. */
export const sourcesDe = (...ids: readonly string[]): string[] => [
  ...new Set([PROGRAMME, ...ids.map((id) => faitNature(id).source)]),
];

/** « Pourquoi apprendre ça ? » (README §9) : une phrase par notion, citation exacte. */
export const SENS_NATURE = {
  natureFonction: {
    type: 'savais-tu',
    text: '« Fonction » vient d’un mot latin, « functio » : « accomplissement, exécution ».',
    source: 'academie-fonction',
    citation: 'Emprunté du latin functio, « accomplissement, exécution »',
  },
  articles: {
    type: 'savais-tu',
    text: '« Article » vient du latin « articulus », formé sur « artus » : « articulation ».',
    source: 'academie-article',
    citation: 'Emprunté du latin articulus, diminutif de artus, « articulation »',
  },
  determinants: {
    type: 'histoire',
    text: 'En 1393, un texte appelle l’index le doigt « démonstratif » : celui qui sert à montrer.',
    source: 'cnrtl-demonstratif',
    citation: "1393 « qui sert à montrer » le doit demonstratif [l'index]",
  },
  conjonctions: {
    type: 'savais-tu',
    text: '« Conjonction » vient d’un mot latin, « conjunctio », qui veut dire « union ».',
    source: 'academie-conjonction',
    citation: 'Emprunté du latin conjunctio, « union »',
  },
  adverbes: {
    type: 'savais-tu',
    text: '« Adverbe » vient du latin : « ad », « auprès de », et « verbum », « verbe ».',
    source: 'academie-adverbe',
    citation: 'Emprunté du latin adverbium, composé de ad, « auprès de », et verbum, « verbe »',
  },
  pronoms: {
    type: 'usage',
    text: 'Quand on lit, les pronoms qui reprennent des mots demandent une attention particulière.',
    source: PROGRAMME,
    citation:
      'Enfin, lecture et étude de la langue doivent être constamment articulées, tant pour ce qui concerne l’appropriation du lexique que l’observation du fonctionnement des phrases et des textes. Dans cette perspective, les reprises pronominales et le choix des temps verbaux constituent notamment un point d’attention.',
  },
} as const satisfies Record<string, Sens>;

// Aucun prénom dans les phrases ; les verbes qui suivent un pronom complément commencent par une consonne.

// ───────────────────────── Nature et fonction ─────────────────────────

export const NATURES_NOMS = ['nom commun', 'verbe', 'adjectif', 'déterminant', 'pronom', 'adverbe'] as const;
export const FONCTIONS_NOMS = ['sujet', 'complément d’objet', 'complément circonstanciel'] as const;

/** Un même groupe nominal, sujet dans une phrase et complément d'objet dans une autre. */
export interface Groupe {
  readonly gn: string;
  readonly sujet: string;
  readonly objet: string;
}

export const GROUPES: readonly Groupe[] = [
  { gn: 'le chien', sujet: 'Le soir, le chien garde la maison.', objet: 'Le facteur salue le chien.' },
  { gn: 'la voisine', sujet: 'Ici, la voisine arrose des fleurs.', objet: 'Nous saluons la voisine.' },
  { gn: 'le boulanger', sujet: 'Le matin, le boulanger prépare le pain.', objet: 'Tu remercies le boulanger.' },
  { gn: 'les enfants', sujet: 'Dehors, les enfants jouent au ballon.', objet: 'La maîtresse appelle les enfants.' },
  { gn: 'ma sœur', sujet: 'Le mardi, ma sœur lave le vélo.', objet: 'Le chat suit ma sœur.' },
  { gn: 'le lapin', sujet: 'Dans le pré, le lapin mange une carotte.', objet: 'Le renard guette le lapin.' },
  { gn: 'la pompière', sujet: 'Vite, la pompière monte à l’échelle.', objet: 'Les voisins félicitent la pompière.' },
  { gn: 'les poules', sujet: 'Le matin, les poules picorent le grain.', objet: 'Le fermier compte les poules.' },
];

export type Nature = 'pronom' | 'verbe' | 'déterminant' | 'adjectif' | 'nom';
export const NATURES_PHRASE: readonly Nature[] = ['pronom', 'verbe', 'déterminant', 'adjectif', 'nom'];

/** Cinq mots, cinq natures : [mot, nature]. */
export const PHRASES_NATURES: readonly (readonly (readonly [string, Nature])[])[] = (
  [
    ['Il', 'caresse', 'le', 'petit', 'chat'],
    ['Elle', 'porte', 'un', 'gros', 'sac'],
    ['Nous', 'lavons', 'la', 'vieille', 'voiture'],
    ['Tu', 'manges', 'une', 'belle', 'pomme'],
    ['Ils', 'regardent', 'ce', 'grand', 'arbre'],
    ['Vous', 'cherchez', 'la', 'petite', 'clé'],
    ['Je', 'range', 'mon', 'nouveau', 'livre'],
    ['Elles', 'cueillent', 'les', 'jolies', 'fleurs'],
  ] as const
).map((mots) => mots.map((m, i) => [m, NATURES_PHRASE[i] ?? 'nom'] as const));

// ───────────────────────── Articles ─────────────────────────

/** Nom commençant par une consonne, avec un verbe : « le chien aboie ». */
export interface NomVerbe {
  readonly nom: string;
  readonly genre: 'm' | 'f';
  readonly pluriel: boolean;
  readonly verbe: string;
}

const nv = (nom: string, genre: 'm' | 'f', verbe: string, pluriel = false): NomVerbe => ({
  nom,
  genre,
  verbe,
  pluriel,
});

export const NOMS_VERBES: readonly NomVerbe[] = [
  nv('chien', 'm', 'aboie'),
  nv('coq', 'm', 'chante'),
  nv('bébé', 'm', 'dort'),
  nv('porte', 'f', 'grince'),
  nv('voiture', 'f', 'démarre'),
  nv('fille', 'f', 'chante'),
  nv('moineaux', 'm', 'volent', true),
  nv('vaches', 'f', 'broutent', true),
  nv('garçons', 'm', 'courent', true),
  nv('cloches', 'f', 'sonnent', true),
];

export const articleDe = (n: NomVerbe, defini: boolean): string => {
  if (n.pluriel) return defini ? 'les' : 'des';
  if (n.genre === 'm') return defini ? 'le' : 'un';
  return defini ? 'la' : 'une';
};

/** Un groupe nominal, avec son article indéfini et son article défini. */
export interface Paire {
  readonly indefini: string;
  readonly defini: string;
}

const paire = (indefini: string, defini: string): Paire => ({ indefini, defini });

export const PAIRES: readonly Paire[] = [
  paire('une pomme', 'la pomme'),
  paire('un cahier', 'le cahier'),
  paire('des billes', 'les billes'),
  paire('une école', 'l’école'),
  paire('un arbre', 'l’arbre'),
  paire('une assiette', 'l’assiette'),
  paire('un oiseau', 'l’oiseau'),
  paire('des amis', 'les amis'),
  paire('une histoire', 'l’histoire'),
  paire('un hôpital', 'l’hôpital'),
];

/** Lignes de texte et nombre d'articles de chaque sorte (aucun article contracté ni partitif). */
export interface LigneArticles {
  readonly texte: string;
  readonly definis: number;
  readonly indefinis: number;
}

const la = (texte: string, definis: number, indefinis: number): LigneArticles => ({ texte, definis, indefinis });

export const LIGNES_ARTICLES: readonly LigneArticles[] = [
  la('Un chat dort sur le canapé.', 1, 1),
  la('La fillette cueille des fleurs.', 1, 1),
  la('Les voisins promènent un chien.', 1, 1),
  la('Une abeille vole vers la ruche.', 1, 1),
  la('Le maçon répare le mur.', 2, 0),
  la('Un renard guette une poule.', 0, 2),
  la('Les enfants rangent les livres dans l’armoire.', 3, 0),
  la('Des oiseaux chantent dans un arbre.', 0, 2),
  la('Mon frère mange une poire.', 0, 1),
  la('Ce soir, la lune éclaire notre rue.', 1, 0),
];

// ───────────────────────── Déterminants possessifs et démonstratifs ─────────────────────────

export const POSSESSIFS = [
  'mon',
  'ma',
  'mes',
  'ton',
  'ta',
  'tes',
  'son',
  'sa',
  'ses',
  'notre',
  'nos',
  'votre',
  'vos',
  'leur',
  'leurs',
];
export const DEMONSTRATIFS = ['ce', 'cet', 'cette', 'ces'];

/** Un nom, avec ce qu'il faut pour choisir « ce, cet, cette, ces ». */
export const NOMS_DEMONSTRATIFS: readonly { readonly nom: string; readonly det: string; readonly pourquoi: string }[] =
  [
    ...(['chien', 'vélo', 'cahier', 'ballon'] as const).map((nom) => ({
      nom,
      det: 'ce',
      pourquoi: `« ${nom} » est masculin singulier et commence par une consonne`,
    })),
    ...(['arbre', 'oiseau', 'avion', 'homme'] as const).map((nom) => ({
      nom,
      det: 'cet',
      pourquoi: `« ${nom} » est masculin singulier et commence par une voyelle ou un h muet`,
    })),
    ...(['maison', 'fleur', 'école', 'image'] as const).map((nom) => ({
      nom,
      det: 'cette',
      pourquoi: `« ${nom} » est féminin singulier`,
    })),
    ...(['amis', 'fleurs', 'images', 'ballons'] as const).map((nom) => ({
      nom,
      det: 'ces',
      pourquoi: `« ${nom} » est au pluriel`,
    })),
  ];

export type Possesseur = 'moi' | 'toi' | 'lui' | 'nous' | 'vous' | 'eux';
export const POSSESSEURS: readonly Possesseur[] = ['moi', 'toi', 'lui', 'nous', 'vous', 'eux'];

/** Formes du possessif : [masculin singulier, féminin singulier, pluriel]. */
export const FORMES_POSSESSIF: Record<Possesseur, readonly [string, string, string]> = {
  moi: ['mon', 'ma', 'mes'],
  toi: ['ton', 'ta', 'tes'],
  lui: ['son', 'sa', 'ses'],
  nous: ['notre', 'notre', 'nos'],
  vous: ['votre', 'votre', 'vos'],
  eux: ['leur', 'leur', 'leurs'],
};

export interface Objet {
  readonly groupe: string;
  readonly nom: string;
  readonly genre: 'm' | 'f';
  readonly pluriel: boolean;
}

const objet = (groupe: string, nom: string, genre: 'm' | 'f', pluriel = false): Objet => ({
  groupe,
  nom,
  genre,
  pluriel,
});

export const OBJETS: readonly Objet[] = [
  objet('le vélo', 'vélo', 'm'),
  objet('le chapeau', 'chapeau', 'm'),
  objet('la trousse', 'trousse', 'f'),
  objet('la maison', 'maison', 'f'),
  objet('l’écharpe', 'écharpe', 'f'),
  objet('l’assiette', 'assiette', 'f'),
  objet('les cahiers', 'cahiers', 'm', true),
  objet('les billes', 'billes', 'f', true),
];

const VOYELLE = /^[aàâeéèêiîoôuûh]/i;

/** Le possessif qui convient : devant une voyelle, « mon, ton, son » remplacent « ma, ta, sa ». */
export function possessif(p: Possesseur, o: Objet): string {
  const [m, fem, plur] = FORMES_POSSESSIF[p];
  if (o.pluriel) return plur;
  return o.genre === 'm' || VOYELLE.test(o.nom) ? m : fem;
}

export interface LigneDeterminants {
  readonly texte: string;
  readonly possessifs: number;
  readonly demonstratifs: number;
}

const ld = (texte: string, possessifs: number, demonstratifs: number): LigneDeterminants => ({
  texte,
  possessifs,
  demonstratifs,
});

export const LIGNES_DETERMINANTS: readonly LigneDeterminants[] = [
  ld('Ce matin, mon frère range sa chambre.', 2, 1),
  ld('Cette fillette cherche ses lunettes.', 1, 1),
  ld('Notre voisine arrose ces fleurs.', 1, 1),
  ld('Les élèves ouvrent leurs cahiers.', 1, 0),
  ld('Cet oiseau fait son nid dans un arbre.', 1, 1),
  ld('Tes amis aiment ce jeu.', 1, 1),
  ld('Ce chien garde votre maison.', 1, 1),
  ld('Ma tante visite ce musée avec ses enfants.', 2, 1),
  ld('La pluie tombe sur le toit.', 0, 0),
];

// ───────────────────────── Conjonctions de coordination ─────────────────────────

export const CONJONCTIONS = ['mais', 'ou', 'et', 'donc', 'or', 'ni', 'car'] as const;
export type Conjonction = (typeof CONJONCTIONS)[number];

/** Rôle de chaque conjonction (« or » est seulement à reconnaître). */
export const ROLES: Record<Exclude<Conjonction, 'or'>, string> = {
  et: 'elle ajoute une chose à une autre',
  ou: 'elle propose un choix',
  mais: 'elle marque une opposition',
  car: 'elle explique pourquoi',
  donc: 'elle annonce la conséquence',
  ni: 'elle sert dans une phrase négative',
};

export interface PhraseConj {
  readonly texte: string;
  readonly conj: Conjonction;
  /** Trois autres mots de la phrase. */
  readonly autres: readonly [string, string, string];
}

const pc = (texte: string, conj: Conjonction, autres: PhraseConj['autres']): PhraseConj => ({ texte, conj, autres });

/** Une seule conjonction de coordination par phrase. */
export const PHRASES_CONJ: readonly PhraseConj[] = [
  pc('Je prends mon sac et mon cahier.', 'et', ['prends', 'mon', 'sac']),
  pc('Tu veux une pomme ou une poire ?', 'ou', ['veux', 'une', 'pomme']),
  pc('Le chien est petit mais courageux.', 'mais', ['est', 'petit', 'courageux']),
  pc('Je mets un manteau car il fait froid.', 'car', ['mets', 'un', 'froid']),
  pc('Il pleut, donc nous restons à la maison.', 'donc', ['pleut', 'nous', 'à']),
  pc('Je voulais jouer, mais il pleut.', 'mais', ['voulais', 'jouer', 'il']),
  pc('Nous chantons et nous dansons.', 'et', ['Nous', 'chantons', 'dansons']),
  pc('Prends le bus ou le métro.', 'ou', ['Prends', 'le', 'bus']),
  pc('Elle sourit car elle est contente.', 'car', ['sourit', 'elle', 'contente']),
  pc('Tu as fini, donc tu peux jouer.', 'donc', ['fini', 'tu', 'jouer']),
  pc('Je voulais entrer, or j’avais oublié la clé.', 'or', ['voulais', 'entrer', 'clé']),
];

/** Le rôle en un mot, pour la dernière bulle de l'explication. */
export const ROLES_COURTS: Record<keyof typeof ROLES, string> = {
  et: 'ajout',
  ou: 'choix',
  mais: 'opposition',
  car: 'explication',
  donc: 'conséquence',
  ni: 'négation',
};

/** Mots qui ne sont pas des conjonctions de coordination. */
export const MOTS_NON_CONJ = [
  'chat',
  'chante',
  'joli',
  'vite',
  'dans',
  'pour',
  'avec',
  'puis',
  'est',
  'très',
  'sur',
  'mon',
];

export interface LigneConj {
  readonly texte: string;
  readonly n: number;
}

const lc = (texte: string, n: number): LigneConj => ({ texte, n });

export const LIGNES_CONJ: readonly LigneConj[] = [
  lc('Le chat est gris et doux.', 1),
  lc('Il court puis il saute.', 0),
  lc('Veux-tu du lait ou de l’eau ?', 1),
  lc('Je suis fatigué, mais content et fier.', 2),
  lc('Nous partons tôt, car la route est longue.', 1),
  lc('Où est ton sac ?', 0),
  lc('Mon frère ne boit ni lait ni jus.', 2),
  lc('La nuit tombe, donc nous rentrons.', 1),
  lc('Elle est dans le jardin avec son chien.', 0),
];

// ───────────────────────── Adverbes ─────────────────────────

export type Categorie = 'temps' | 'lieu' | 'quantité ou intensité';

export interface PhraseAdverbe {
  readonly texte: string;
  readonly adverbe: string;
  readonly autres: readonly [string, string, string];
}

const pa = (texte: string, adverbe: string, autres: PhraseAdverbe['autres']): PhraseAdverbe => ({
  texte,
  adverbe,
  autres,
});

/** Un seul adverbe par phrase. */
export const PHRASES_ADVERBES: readonly PhraseAdverbe[] = [
  pa('Le chien dort souvent.', 'souvent', ['Le', 'chien', 'dort']),
  pa('Ma sœur court vite.', 'vite', ['Ma', 'sœur', 'court']),
  pa('Nous partirons en train demain.', 'demain', ['Nous', 'partirons', 'train']),
  pa('Ce gâteau est très bon.', 'très', ['gâteau', 'est', 'bon']),
  pa('Le bébé pleure beaucoup.', 'beaucoup', ['Le', 'bébé', 'pleure']),
  pa('Tu chantes bien cette chanson.', 'bien', ['Tu', 'chantes', 'chanson']),
  pa('Hier, nous avons joué.', 'Hier', ['nous', 'avons', 'joué']),
  pa('Pose ton sac ici.', 'ici', ['Pose', 'ton', 'sac']),
  pa('Le train est déjà parti.', 'déjà', ['train', 'est', 'parti']),
  pa('La soupe est trop chaude.', 'trop', ['soupe', 'est', 'chaude']),
  pa('Mon voisin sourit toujours.', 'toujours', ['Mon', 'voisin', 'sourit']),
  pa('Je lis, ensuite je dors.', 'ensuite', ['Je', 'lis', 'dors']),
  pa('Aujourd’hui, la piscine ouvre.', 'Aujourd’hui', ['la', 'piscine', 'ouvre']),
];

/** Adverbes dont la catégorie est donnée par la source (sens sans ambiguïté). */
export const CATEGORIES: Record<Categorie, readonly string[]> = {
  temps: ['hier', 'demain', 'aujourd’hui', 'déjà'],
  lieu: ['ici'],
  'quantité ou intensité': ['beaucoup', 'très', 'trop'],
};

/** Mise au pluriel : l'adverbe ne change pas. */
export interface Pluriel {
  readonly singulier: string;
  readonly pluriel: string;
  readonly adverbe: string;
  /** La même phrase au pluriel, avec l'adverbe accordé à tort. */
  readonly faux: string;
}

const pl = (singulier: string, pluriel: string, adverbe: string): Pluriel => ({
  singulier,
  pluriel,
  adverbe,
  // Erreur typique : on change la fin de l'adverbe comme celle d'un nom.
  faux: pluriel.replace(adverbe, adverbe.endsWith('s') ? adverbe.slice(0, -1) : `${adverbe}s`),
});

export const PLURIELS: readonly Pluriel[] = [
  pl('La fille court vite.', 'Les filles courent vite.', 'vite'),
  pl('Le chien dort beaucoup.', 'Les chiens dorment beaucoup.', 'beaucoup'),
  pl('Le garçon chante bien.', 'Les garçons chantent bien.', 'bien'),
  pl('La voisine sourit souvent.', 'Les voisines sourient souvent.', 'souvent'),
  pl('Le coq chante déjà.', 'Les coqs chantent déjà.', 'déjà'),
  pl('Le chat miaule toujours.', 'Les chats miaulent toujours.', 'toujours'),
  pl('La tortue reste ici.', 'Les tortues restent ici.', 'ici'),
  pl('Le robot parle trop.', 'Les robots parlent trop.', 'trop'),
];

/** Tous les adverbes employés dans les lignes à compter. */
export const ADVERBES_DES_LIGNES = ['hier', 'beaucoup', 'demain', 'ici', 'très', 'souvent', 'vite', 'trop', 'déjà'];

export interface LigneAdverbes {
  readonly texte: string;
  readonly n: number;
}

const ladv = (texte: string, n: number): LigneAdverbes => ({ texte, n });

export const LIGNES_ADVERBES: readonly LigneAdverbes[] = [
  ladv('Hier, le chien a beaucoup couru.', 2),
  ladv('Nous mangeons une pomme rouge.', 0),
  ladv('Demain, nous reviendrons ici.', 2),
  ladv('Le train roule très vite.', 2),
  ladv('Mon frère chante souvent.', 1),
  ladv('Les enfants jouent dans la cour.', 0),
  ladv('Tu cours vite.', 1),
  ladv('Ce livre est trop long.', 1),
  ladv('Le bus est déjà parti.', 1),
];

// ───────────────────────── Pronoms personnels ─────────────────────────

export interface PhrasePronom {
  readonly texte: string;
  readonly pronom: string;
  readonly sujet: boolean;
}

const pp = (texte: string, pronom: string, sujet: boolean): PhrasePronom => ({ texte, pronom, sujet });

export const PHRASES_PRONOMS: readonly PhrasePronom[] = [
  pp('Je range ma chambre.', 'Je', true),
  pp('Tu dessines un bateau.', 'Tu', true),
  pp('Il lave son vélo.', 'Il', true),
  pp('Elles chantent en classe.', 'Elles', true),
  pp('Nous plantons un arbre.', 'Nous', true),
  pp('Papa me regarde.', 'me', false),
  pp('Le chien te suit.', 'te', false),
  pp('Mon frère le range.', 'le', false),
  pp('Ma sœur la pousse.', 'la', false),
  pp('Le voisin les salue.', 'les', false),
  pp('La maîtresse lui parle.', 'lui', false),
  pp('Grand-père leur raconte une histoire.', 'leur', false),
];

/** Groupe nominal sujet et le pronom qui le remplace. */
export const SUJETS_GN: readonly { readonly phrase: string; readonly gn: string; readonly pronom: string }[] = [
  { phrase: 'Le chien aboie.', gn: 'Le chien', pronom: 'Il' },
  { phrase: 'La voisine jardine.', gn: 'La voisine', pronom: 'Elle' },
  { phrase: 'Les filles chantent.', gn: 'Les filles', pronom: 'Elles' },
  { phrase: 'Les garçons courent.', gn: 'Les garçons', pronom: 'Ils' },
  { phrase: 'Mon frère dessine.', gn: 'Mon frère', pronom: 'Il' },
  { phrase: 'Ma sœur nage.', gn: 'Ma sœur', pronom: 'Elle' },
  { phrase: 'Les poules picorent.', gn: 'Les poules', pronom: 'Elles' },
  { phrase: 'Les moutons broutent.', gn: 'Les moutons', pronom: 'Ils' },
];

export type PronomObjet = 'le' | 'la' | 'les' | 'lui' | 'leur';

/** Groupe nominal complément d'objet, direct (le, la, les) ou introduit par « à » (lui, leur). */
export interface ObjetPhrase {
  readonly sujet: string;
  readonly pronomSujet: string;
  readonly verbe: string;
  readonly groupe: string;
  readonly pronom: PronomObjet;
}

const op = (sujet: string, pronomSujet: string, verbe: string, groupe: string, pronom: PronomObjet): ObjetPhrase => ({
  sujet,
  pronomSujet,
  verbe,
  groupe,
  pronom,
});

/** Les verbes commencent par une consonne : pas d'élision (« l’ »). */
export const OBJETS_PHRASES: readonly ObjetPhrase[] = [
  op('Mon frère', 'Il', 'mange', 'la pomme', 'la'),
  op('Ma sœur', 'Elle', 'lit', 'le livre', 'le'),
  op('Le fermier', 'Il', 'compte', 'les poules', 'les'),
  op('La voisine', 'Elle', 'salue', 'le facteur', 'le'),
  op('Les garçons', 'Ils', 'lavent', 'la voiture', 'la'),
  op('Les filles', 'Elles', 'rangent', 'les cahiers', 'les'),
  op('La maîtresse', 'Elle', 'parle', 'à la directrice', 'lui'),
  op('Mon voisin', 'Il', 'téléphone', 'à son fils', 'lui'),
  op('Le guide', 'Il', 'parle', 'aux visiteurs', 'leur'),
  op('Ma tante', 'Elle', 'répond', 'à ses amies', 'leur'),
];

export const phraseObjet = (o: ObjetPhrase, sujet = o.sujet): string => `${sujet} ${o.verbe} ${o.groupe}.`;
export const phrasePronom = (o: ObjetPhrase, sujet = o.sujet, pronom: string = o.pronom): string =>
  `${sujet} ${pronom} ${o.verbe}.`;
