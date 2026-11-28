/**
 * Données du chapitre « Le verbe et le sujet » (CM1) : faits cités et banques de phrases écrites pour l'exercice.
 * Chaque fait porte l'identifiant de sa source (registre `sources.ts`) et sa citation exacte.
 */
import type { Sens } from '../types.ts';
import type { Fait } from './phrases.donnees.ts';

const PROGRAMME = 'francais-cycle3-2025';

export const FAITS_VS: readonly Fait[] = [
  { id: 'verbe-conjugue', source: PROGRAMME, citation: 'Consolider l’identification du verbe conjugué' },
  {
    id: 'verbe-nom',
    source: PROGRAMME,
    citation:
      'L’identification du verbe dans la phrase est primordiale et la différence entre nom et verbe est particulièrement travaillée.',
  },
  {
    id: 'infinitif',
    source: PROGRAMME,
    citation: 'retrouver la forme infinitive du verbe',
  },
  { id: 'groupe-sujet', source: PROGRAMME, citation: 'Consolider l’identification du groupe sujet' },
  {
    id: 'gs-gv',
    source: PROGRAMME,
    citation: 'le groupe sujet (GS) et le groupe verbal (GV)',
  },
  {
    id: 'types-sujets',
    source: PROGRAMME,
    citation: 'Identifier les différents types de sujets (pronoms personnels, groupes nominaux, plusieurs noms)',
  },
  {
    id: 'nom-noyau',
    source: PROGRAMME,
    citation: 'Repérer le sujet du verbe : notamment le nom noyau dans le cas d’un groupe nominal',
  },
  {
    id: 'variations',
    source: PROGRAMME,
    citation:
      'Distinguer les variations morphologiques du verbe de celles du nom (ex : il élève / tu élèves / elles élèvent vs une élève / des élèves)',
  },
];

/** Pourquoi apprendre chaque notion (docs/contenus/README.md §9). */
export const SENS_VS = {
  verbe: {
    type: 'savais-tu',
    text: 'Le programme de ton école dit que trouver le verbe dans la phrase est très important.',
    source: PROGRAMME,
    citation: 'L’identification du verbe dans la phrase est primordiale',
  },
  infinitif: {
    type: 'usage',
    text: 'Au CM1, tu cherches aussi l’infinitif quand tu étudies le passé composé.',
    source: PROGRAMME,
    citation:
      'Connaître la composition du passé composé en deux parties (auxiliaire + participe passé) ; retrouver la forme infinitive du verbe',
  },
  groupeSujet: {
    type: 'usage',
    text: 'Quand tu écris, le groupe sujet et le verbe doivent s’accorder.',
    source: PROGRAMME,
    citation:
      'comprenne et applique les différentes chaînes d’accords dans la phrase (dans le groupe nominal et entre groupe sujet et verbe)',
  },
  typesSujets: {
    type: 'savais-tu',
    text: 'On peut remplacer un groupe nominal sujet par un pronom personnel sujet.',
    source: PROGRAMME,
    citation: 'Remplacer un groupe nominal sujet par un pronom personnel sujet',
  },
  nomVerbe: {
    type: 'savais-tu',
    text: 'Un même mot peut changer de deux façons : « elles élèvent », mais « des élèves ».',
    source: PROGRAMME,
    citation:
      'Distinguer les variations morphologiques du verbe de celles du nom (ex : il élève / tu élèves / elles élèvent vs une élève / des élèves)',
  },
} as const satisfies Record<string, Sens>;

export const faitVs = (id: string): Fait => {
  const f = FAITS_VS.find((x) => x.id === id);
  if (!f) throw new Error(`fait inconnu : ${id}`);
  return f;
};

// ───────────────────────── Phrases étiquetées ─────────────────────────

/** d déterminant · n nom · p pronom · a autre mot · v verbe conjugué · i verbe à l'infinitif. */
export type Tag = 'd' | 'n' | 'p' | 'a' | 'v' | 'i';

export interface Mot {
  readonly text: string;
  readonly tag: Tag;
  /** Infinitif du verbe conjugué (tag v). */
  readonly inf?: string;
}

const TAGS: readonly string[] = ['d', 'n', 'p', 'a', 'v', 'i'];

/** « Le|d chat|n dort|v:dormir » → mots étiquetés. */
function parse(line: string): readonly Mot[] {
  return line.split(' ').map((token) => {
    const [text = '', code = ''] = token.split('|');
    const [tag = '', inf] = code.split(':');
    if (!TAGS.includes(tag)) throw new Error(`étiquette inconnue dans « ${line} » : ${token}`);
    return { text, tag: tag as Tag, ...(inf ? { inf } : {}) };
  });
}

/** Phrase lisible (sans point final) ; pas d'espace après une apostrophe. */
export const sentence = (mots: readonly Mot[]): string =>
  mots.reduce((acc, m) => (acc === '' ? m.text : acc.endsWith('’') ? acc + m.text : `${acc} ${m.text}`), '');

/** Phrases avec un seul verbe conjugué. */
export const PHRASES_SIMPLES: readonly (readonly Mot[])[] = [
  'Le|d chat|n dort|v:dormir sur|a le|d canapé|n',
  'Mon|d frère|n range|v:ranger sa|d chambre|n',
  'Les|d oiseaux|n chantent|v:chanter le|d matin|n',
  'Nous|p mangeons|v:manger à|a la|d cantine|n',
  'La|d maîtresse|n lit|v:lire une|d histoire|n',
  'Ma|d sœur|n joue|v:jouer du|d piano|n',
  'Les|d élèves|n entrent|v:entrer en|a classe|n',
  'Tu|p cours|v:courir dans|a le|d jardin|n',
  'Le|d vent|n souffle|v:souffler très|a fort|a',
  'Vous|p finissez|v:finir votre|d dessin|n',
  'Ils|p regardent|v:regarder un|d film|n',
  'Le|d boulanger|n prépare|v:préparer du|d pain|n',
].map(parse);

/** Un verbe conjugué suivi d'un verbe à l'infinitif. */
export const PHRASES_INFINITIF: readonly (readonly Mot[])[] = [
  'Je|p veux|v:vouloir manger|i une|d pomme|n',
  'Ma|d cousine|n aime|v:aimer dessiner|i',
  'Tu|p dois|v:devoir ranger|i ta|d chambre|n',
  'Nous|p allons|v:aller jouer|i dehors|a',
  'Le|d chien|n veut|v:vouloir sortir|i',
  'Mes|d amis|n préfèrent|v:préférer nager|i',
  'Elle|p sait|v:savoir nager|i',
  'Les|d enfants|n adorent|v:adorer chanter|i',
].map(parse);

/** Phrases à la forme négative : le verbe est entouré de deux mots. */
export const PHRASES_NEGATIVES: readonly (readonly Mot[])[] = [
  'Il|p ne|a dort|v:dormir pas|a',
  'Le|d chien|n ne|a mange|v:manger plus|a',
  'Nous|p n’|a aimons|v:aimer pas|a',
  'Elle|p ne|a chante|v:chanter jamais|a',
  'Mon|d père|n ne|a crie|v:crier pas|a',
  'Les|d élèves|n ne|a parlent|v:parler plus|a',
].map(parse);

/** Phrases avec deux verbes conjugués reliés par « et ». */
export const PHRASES_DOUBLES: readonly (readonly Mot[])[] = [
  'Le|d chat|n saute|v:sauter et|a court|v:courir',
  'Les|d enfants|n rient|v:rire et|a chantent|v:chanter',
  'Je|p lis|v:lire et|a j’|p écris|v:écrire',
].map(parse);

// ───────────────────────── Infinitifs ─────────────────────────

export interface VerbeInf {
  readonly inf: string;
  readonly formes: readonly string[];
}

/** Verbes réguliers (niveaux 1 à 3). */
export const VERBES_REGULIERS: readonly VerbeInf[] = [
  { inf: 'chanter', formes: ['il chante', 'nous chantons', 'ils chantent', 'tu chantes'] },
  { inf: 'jouer', formes: ['il joue', 'nous jouons', 'ils jouent', 'tu joues'] },
  { inf: 'regarder', formes: ['je regarde', 'nous regardons', 'ils regardent', 'tu regardes'] },
  { inf: 'danser', formes: ['il danse', 'nous dansons', 'ils dansent', 'tu danses'] },
  { inf: 'ranger', formes: ['je range', 'nous rangeons', 'ils rangent', 'tu ranges'] },
  { inf: 'manger', formes: ['je mange', 'nous mangeons', 'ils mangent', 'tu manges'] },
  { inf: 'dessiner', formes: ['je dessine', 'nous dessinons', 'ils dessinent', 'tu dessines'] },
  { inf: 'écouter', formes: ['tu écoutes', 'nous écoutons', 'elles écoutent', 'il écoute'] },
  { inf: 'finir', formes: ['tu finis', 'nous finissons', 'elle finit', 'ils finissent'] },
  { inf: 'grandir', formes: ['il grandit', 'nous grandissons', 'ils grandissent', 'tu grandis'] },
];

/** Verbes irréguliers fréquents (niveau 4). */
export const VERBES_IRREGULIERS: readonly VerbeInf[] = [
  { inf: 'aller', formes: ['je vais', 'tu vas', 'il va', 'nous allons', 'ils vont'] },
  { inf: 'être', formes: ['tu es', 'il est', 'nous sommes', 'vous êtes', 'ils sont'] },
  { inf: 'avoir', formes: ['j’ai', 'tu as', 'il a', 'nous avons', 'ils ont'] },
  { inf: 'faire', formes: ['je fais', 'il fait', 'nous faisons', 'ils font', 'vous faites'] },
  { inf: 'prendre', formes: ['je prends', 'il prend', 'nous prenons', 'ils prennent'] },
  { inf: 'venir', formes: ['je viens', 'il vient', 'nous venons', 'ils viennent'] },
  { inf: 'dire', formes: ['je dis', 'il dit', 'nous disons', 'ils disent'] },
  { inf: 'voir', formes: ['je vois', 'il voit', 'nous voyons', 'ils voient'] },
  { inf: 'pouvoir', formes: ['je peux', 'il peut', 'nous pouvons', 'ils peuvent'] },
  { inf: 'vouloir', formes: ['je veux', 'il veut', 'nous voulons', 'ils veulent'] },
];

// ───────────────────────── Groupe sujet ─────────────────────────

export interface GroupeSujet {
  readonly gs: string;
  /** Nom noyau (le nom principal du groupe). */
  readonly noyau: string;
  /** Groupe verbal (le verbe et ce qui le suit). */
  readonly reste: string;
  readonly verbe: string;
}

export const GROUPES_SUJETS: readonly GroupeSujet[] = [
  { gs: 'Le petit chat', noyau: 'chat', reste: 'dort sur le canapé', verbe: 'dort' },
  { gs: 'Mon frère aîné', noyau: 'frère', reste: 'range sa chambre', verbe: 'range' },
  { gs: 'Les oiseaux bleus', noyau: 'oiseaux', reste: 'chantent très fort', verbe: 'chantent' },
  { gs: 'La maîtresse', noyau: 'maîtresse', reste: 'lit une histoire à la classe', verbe: 'lit' },
  { gs: 'Ma petite sœur', noyau: 'sœur', reste: 'joue du piano', verbe: 'joue' },
  { gs: 'Les nouveaux élèves', noyau: 'élèves', reste: 'entrent en classe', verbe: 'entrent' },
  { gs: 'Un gros nuage gris', noyau: 'nuage', reste: 'cache le soleil', verbe: 'cache' },
  { gs: 'Mes deux cousins', noyau: 'cousins', reste: 'jouent dans la cour', verbe: 'jouent' },
  { gs: 'Le chien noir', noyau: 'chien', reste: 'aboie très fort', verbe: 'aboie' },
  { gs: 'Les petits poissons rouges', noyau: 'poissons', reste: 'nagent dans le bocal', verbe: 'nagent' },
];

/** Groupes placés devant le sujet : ils disent quand, mais ne sont pas le sujet. */
export const AVANT_SUJET: readonly string[] = ['Ce matin,', 'Chaque jour,', 'Le mardi,', 'En ce moment,', 'Souvent,'];

// ───────────────────────── Types de sujets ─────────────────────────

export type TypeSujet = 'pronom' | 'gn' | 'noms';

export interface Sujet {
  readonly s: string;
  readonly reste: string;
  readonly type: TypeSujet;
  /** Pourquoi ce n'est pas « plusieurs noms » (groupe nominal au pluriel, avec un adjectif). */
  readonly piege?: string;
}

export const SUJETS: readonly Sujet[] = [
  { s: 'Elle', reste: 'chante dans la cour', type: 'pronom' },
  { s: 'Nous', reste: 'mangeons à la cantine', type: 'pronom' },
  { s: 'Ils', reste: 'jouent au ballon', type: 'pronom' },
  { s: 'Tu', reste: 'cours très vite', type: 'pronom' },
  { s: 'Je', reste: 'lis un livre', type: 'pronom' },
  { s: 'Vous', reste: 'partez en voyage', type: 'pronom' },
  { s: 'Le petit chat', reste: 'dort sur le canapé', type: 'gn' },
  { s: 'Ma sœur', reste: 'joue du piano', type: 'gn' },
  { s: 'Les oiseaux', reste: 'chantent très fort', type: 'gn' },
  { s: 'La maîtresse', reste: 'lit une histoire', type: 'gn' },
  { s: 'Un gros nuage gris', reste: 'cache le soleil', type: 'gn' },
  { s: 'Mes deux cousins', reste: 'jouent aux cartes', type: 'gn' },
  { s: 'Mon père et ma mère', reste: 'préparent le repas', type: 'noms' },
  { s: 'Le chat et le chien', reste: 'dorment sur le tapis', type: 'noms' },
  { s: 'Ma sœur et mon frère', reste: 'jouent au ballon', type: 'noms' },
  { s: 'Le boulanger et le fleuriste', reste: 'ouvrent la porte', type: 'noms' },
  { s: 'Mes cousins et mes cousines', reste: 'arrivent à la maison', type: 'noms' },
  { s: 'Les filles, les garçons et la maîtresse', reste: 'partent en sortie', type: 'noms' },
];

/** Groupes nominaux au pluriel avec un adjectif : plusieurs êtres ou choses, mais un seul nom. */
export const SUJETS_PIEGES: readonly Sujet[] = [
  {
    s: 'Les petits oiseaux',
    reste: 'volent dans le ciel',
    type: 'gn',
    piege: '« oiseaux » est au pluriel, mais c’est un seul nom : « petits » est un adjectif.',
  },
  {
    s: 'Les chiens noirs',
    reste: 'courent dans le pré',
    type: 'gn',
    piege: '« chiens » est au pluriel, mais c’est un seul nom : « noirs » est un adjectif.',
  },
  {
    s: 'Les jolies fleurs',
    reste: 'poussent dans le jardin',
    type: 'gn',
    piege: '« fleurs » est au pluriel, mais c’est un seul nom : « jolies » est un adjectif.',
  },
  {
    s: 'Les poissons rouges',
    reste: 'tournent dans le bocal',
    type: 'gn',
    piege: '« poissons » est au pluriel, mais c’est un seul nom : « rouges » est un adjectif.',
  },
  {
    s: 'Les nouveaux voisins',
    reste: 'ferment la porte',
    type: 'gn',
    piege: '« voisins » est au pluriel, mais c’est un seul nom : « nouveaux » est un adjectif.',
  },
];

/** Pas de « plusieurs noms » : « et » est après le verbe, pas dans le sujet. */
export const SUJETS_ET_APRES_VERBE: readonly Sujet[] = [
  { s: 'La maîtresse', reste: 'prend un livre et un stylo', type: 'gn' },
  { s: 'Mon voisin', reste: 'achète du pain et du lait', type: 'gn' },
  { s: 'Elle', reste: 'chante et danse', type: 'pronom' },
  { s: 'Ils', reste: 'sautent et courent', type: 'pronom' },
];

/** Groupes placés devant le sujet dans les textes à trous : un moment précis, possible avec chaque phrase. */
export const AVANT_TYPES: readonly string[] = ['Ce matin,', 'En ce moment,', 'Cet après-midi,'];

export const TYPE_LABEL: Record<TypeSujet, string> = {
  pronom: 'un pronom personnel',
  gn: 'un groupe nominal',
  noms: 'plusieurs noms',
};

// ───────────────────────── Nom ou verbe ─────────────────────────

export interface NomVerbe {
  readonly mot: string;
  /** Déterminant singulier du nom. */
  readonly det: 'un' | 'une';
  /** Phrase où le mot est un nom, et le verbe conjugué de cette phrase. */
  readonly nom: string;
  readonly verbeDuNom: string;
  /** Phrase où le mot est un verbe (sujet il ou elle). */
  readonly verbe: string;
  readonly sujet: 'il' | 'elle';
  /** Niveau 5 : deux phrases d'un même petit texte, qui commencent par le même mot. */
  readonly texte: {
    readonly nom: string;
    readonly verbe: string;
    /** Sujet et verbe de la phrase « verbe », tels qu'on les dit après « hier ». */
    readonly hier: string;
  };
}

export const NOMS_VERBES: readonly NomVerbe[] = [
  {
    mot: 'élève',
    det: 'une',
    nom: 'Une élève range son cahier.',
    verbeDuNom: 'range',
    verbe: 'Il élève des lapins.',
    sujet: 'il',
    texte: {
      nom: 'Le maître aide un élève.',
      verbe: 'Le fermier élève des lapins.',
      hier: 'le fermier élevait',
    },
  },
  {
    mot: 'ferme',
    det: 'une',
    nom: 'La ferme est au bout du chemin.',
    verbeDuNom: 'est',
    verbe: 'Il ferme la porte.',
    sujet: 'il',
    texte: {
      nom: 'Le chien court vers la grande ferme.',
      verbe: 'Le gardien ferme la grille.',
      hier: 'le gardien fermait',
    },
  },
  {
    mot: 'garde',
    det: 'un',
    nom: 'Le garde ouvre la grille.',
    verbeDuNom: 'ouvre',
    verbe: 'Elle garde son petit frère.',
    sujet: 'elle',
    texte: {
      nom: 'Mamie salue le vieux garde.',
      verbe: 'Mamie garde les enfants.',
      hier: 'Mamie gardait',
    },
  },
  {
    mot: 'marche',
    det: 'une',
    nom: 'La marche est longue.',
    verbeDuNom: 'est',
    verbe: 'Il marche vers l’école.',
    sujet: 'il',
    texte: {
      nom: 'La petite marche est cassée.',
      verbe: 'La factrice marche vers la mairie.',
      hier: 'la factrice marchait',
    },
  },
  {
    mot: 'danse',
    det: 'une',
    nom: 'Cette danse est rapide.',
    verbeDuNom: 'est',
    verbe: 'Elle danse sur la scène.',
    sujet: 'elle',
    texte: {
      nom: 'Au bal, la dernière danse commence.',
      verbe: 'Au bal, Lina danse.',
      hier: 'Lina dansait',
    },
  },
  {
    mot: 'pêche',
    det: 'une',
    nom: 'La pêche est bien mûre.',
    verbeDuNom: 'est',
    verbe: 'Il pêche un gros poisson.',
    sujet: 'il',
    texte: {
      nom: 'Mon voisin mange une pêche.',
      verbe: 'Mon voisin pêche dans la rivière.',
      hier: 'mon voisin pêchait',
    },
  },
  {
    mot: 'visite',
    det: 'une',
    nom: 'La visite du musée commence.',
    verbeDuNom: 'commence',
    verbe: 'Elle visite le château.',
    sujet: 'elle',
    texte: {
      nom: 'La première visite commence.',
      verbe: 'La classe visite le moulin.',
      hier: 'la classe visitait',
    },
  },
  {
    mot: 'rêve',
    det: 'un',
    nom: 'Mon rêve est très étrange.',
    verbeDuNom: 'est',
    verbe: 'Elle rêve de voyage.',
    sujet: 'elle',
    texte: {
      nom: 'Au lit, Tom raconte son beau rêve.',
      verbe: 'Au lit, Tom rêve de voyages.',
      hier: 'Tom rêvait',
    },
  },
  {
    mot: 'joue',
    det: 'une',
    nom: 'Sa joue est toute rouge.',
    verbeDuNom: 'est',
    verbe: 'Elle joue au ballon.',
    sujet: 'elle',
    texte: {
      nom: 'Sur la place, le froid pique sa joue.',
      verbe: 'Sur la place, Zoé joue au ballon.',
      hier: 'Zoé jouait',
    },
  },
  {
    mot: 'plante',
    det: 'une',
    nom: 'Cette plante a des fleurs.',
    verbeDuNom: 'a',
    verbe: 'Il plante un arbre.',
    sujet: 'il',
    texte: {
      nom: 'Le jardinier arrose la plante.',
      verbe: 'Le jardinier plante un arbre.',
      hier: 'le jardinier plantait',
    },
  },
  {
    mot: 'porte',
    det: 'une',
    nom: 'La porte est ouverte.',
    verbeDuNom: 'est',
    verbe: 'Il porte un sac.',
    sujet: 'il',
    texte: {
      nom: 'Il repeint la porte.',
      verbe: 'Il prend le sac et le porte.',
      hier: 'il le portait',
    },
  },
  {
    mot: 'cuisine',
    det: 'une',
    nom: 'La cuisine sent bon.',
    verbeDuNom: 'sent',
    verbe: 'Il cuisine un gâteau.',
    sujet: 'il',
    texte: {
      nom: 'À midi, papi lave la grande cuisine.',
      verbe: 'À midi, papi cuisine un gâteau.',
      hier: 'papi cuisinait',
    },
  },
  {
    mot: 'brosse',
    det: 'une',
    nom: 'Cette brosse est neuve.',
    verbeDuNom: 'est',
    verbe: 'Elle brosse ses cheveux.',
    sujet: 'elle',
    texte: {
      nom: 'Elle cherche sa petite brosse.',
      verbe: 'Elle voit son chien et le brosse.',
      hier: 'elle le brossait',
    },
  },
];
