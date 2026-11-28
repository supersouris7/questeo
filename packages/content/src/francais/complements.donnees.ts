/**
 * Données du chapitre « Les compléments » (CM1) : faits cités et banque de phrases écrites pour l'exercice.
 * Chaque fait porte l'identifiant de sa source (registre `sources.ts`) et sa citation exacte.
 */
import type { Sens } from '../types.ts';
import { tolerer } from './lecture-outils.ts';
import type { Fait } from './phrases.donnees.ts';
import { lowerFirst } from './outils.ts';

const PROGRAMME = 'francais-cycle3-2025';

export const FAITS_COMPL: readonly Fait[] = [
  { id: 'objet-circ', source: PROGRAMME, citation: 'Distinguer le complément d’objet du complément circonstanciel' },
  {
    id: 'cod-coi',
    source: PROGRAMME,
    citation:
      'différencier complément d’objet direct et complément d’objet indirect dans des phrases prototypiques sans ambigüité',
  },
  {
    id: 'circonstanciels',
    source: PROGRAMME,
    citation: 'Identifier les groupes circonstanciels (sans les distinguer)',
  },
  {
    id: 'circ-facultatif',
    source: PROGRAMME,
    citation:
      'L’étude du complément circonstanciel est commencée dès le CM1 par son repérage et son caractère facultatif dans la phrase de base.',
  },
  {
    id: 'manipulations',
    source: PROGRAMME,
    citation:
      'déplacement, suppression (ou effacement), substitution (ou remplacement), addition (ou ajout), encadrement',
  },
  {
    id: 'deplacement-suppression',
    source: PROGRAMME,
    citation: 'des manipulations syntaxiques, telles que le déplacement et la suppression',
  },
];

export const faitCompl = (id: string): Fait => {
  const f = FAITS_COMPL.find((x) => x.id === id);
  if (!f) throw new Error(`fait inconnu : ${id}`);
  return f;
};

/** « Pourquoi apprendre ça ? » (README §9) : une phrase par notion, citation exacte. */
export const SENS_COMPL = {
  objetCirc: {
    type: 'usage',
    text: 'Étudier la langue t’aide aussi à mieux comprendre les textes que tu lis.',
    source: PROGRAMME,
    citation:
      'Elle est aussi convoquée à l’occasion des lectures, notamment pour favoriser la compréhension des textes.',
  },
  codCoi: {
    type: 'usage',
    text: 'Plus tard, le COD t’aidera à accorder le participe passé avec « avoir ».',
    source: PROGRAMME,
    citation: 'Accorder le participe passé avec le COD pour les verbes étudiés et conjugués avec l’auxiliaire avoir',
  },
  circonstanciels: {
    type: 'savais-tu',
    text: '« Circonstance » vient d’un mot latin qui veut dire « action d’entourer, d’être autour ».',
    source: 'cnrtl-circonstance',
    citation: "Empr. au lat. class. circumstantia « action d'entourer, d'être autour; situation, circonstances »",
  },
  manipulations: {
    type: 'usage',
    text: 'Déplacer, ajouter ou remplacer des mots t’aide quand tu écris tes textes.',
    source: PROGRAMME,
    citation:
      'des habiletés au service des activités langagières et plus particulièrement pour la production d’écrits et l’étude de la langue',
  },
} as const satisfies Record<string, Sens>;

// ───────────────────────── Phrases ─────────────────────────

/**
 * Une phrase simple : sujet, verbe, complément d'objet, groupe circonstanciel.
 * Aucun sujet ne commence par une voyelle (« C’est … que ma cousine… »), aucun complément d'objet ne commence par
 * « du » ou « des » (ce ne sont pas des prépositions ici), aucun prénom n'est utilisé.
 */
export interface Entree {
  readonly gs: string;
  readonly verbe: string;
  readonly obj: string;
  readonly type: 'cod' | 'coi';
  /** Question posée après le verbe pour trouver le complément d'objet. */
  readonly q: string;
  /** Petit mot qui introduit un COI. */
  readonly prep?: 'à' | 'de';
  readonly circ: string;
  /**
   * Renseigné quand le groupe circonstanciel dit où (sinon, il dit quand) : les repères de temps compatibles avec la
   * phrase, à placer devant elle. Seules ces phrases peuvent aussi recevoir « souvent ».
   */
  readonly avant?: readonly string[];
  /** Un autre groupe circonstanciel du même genre (substitution). */
  readonly autre: string;
}

/** Repères de temps compatibles avec un verbe au présent (jamais un repère passé). */
const TOUS = ['Ce matin', 'Chaque dimanche', 'Le mardi'];
/** Jour de classe ou de travail : pas de dimanche. */
const SEMAINE = ['Ce matin', 'Le mardi'];
/** Le goûter ne se prépare pas le matin. */
const GOUTER = ['Chaque dimanche', 'Le mardi'];

export const ENTREES: readonly Entree[] = [
  {
    gs: 'Ma cousine',
    verbe: 'mange',
    obj: 'une pomme',
    type: 'cod',
    q: 'mange quoi',
    circ: 'dans le jardin',
    avant: TOUS,
    autre: 'sur la terrasse',
  },
  {
    gs: 'Le boulanger',
    verbe: 'prépare',
    obj: 'la pâte',
    type: 'cod',
    q: 'prépare quoi',
    circ: 'chaque matin',
    autre: 'tous les jours',
  },
  {
    gs: 'Mon frère',
    verbe: 'range',
    obj: 'sa chambre',
    type: 'cod',
    q: 'range quoi',
    circ: 'le samedi',
    autre: 'le dimanche',
  },
  {
    gs: 'Les élèves',
    verbe: 'lisent',
    obj: 'un livre',
    type: 'cod',
    q: 'lisent quoi',
    circ: 'à la bibliothèque',
    avant: SEMAINE,
    autre: 'dans la classe',
  },
  {
    gs: 'La maîtresse',
    verbe: 'écrit',
    obj: 'la date',
    type: 'cod',
    q: 'écrit quoi',
    circ: 'au tableau',
    avant: SEMAINE,
    autre: 'sur le cahier',
  },
  {
    gs: 'Nous',
    verbe: 'cueillons',
    obj: 'les fraises',
    type: 'cod',
    q: 'cueillons quoi',
    circ: 'en été',
    autre: 'au printemps',
  },
  {
    gs: 'Mon père',
    verbe: 'répare',
    obj: 'le vélo',
    type: 'cod',
    q: 'répare quoi',
    circ: 'dans le garage',
    avant: TOUS,
    autre: 'dans la cour',
  },
  {
    gs: 'Les enfants',
    verbe: 'dessinent',
    obj: 'un bateau',
    type: 'cod',
    q: 'dessinent quoi',
    circ: 'pendant la récréation',
    autre: 'après la classe',
  },
  {
    gs: 'Le jardinier',
    verbe: 'arrose',
    obj: 'les fleurs',
    type: 'cod',
    q: 'arrose quoi',
    circ: 'tous les soirs',
    autre: 'le matin',
  },
  {
    gs: 'Ma sœur',
    verbe: 'prépare',
    obj: 'le goûter',
    type: 'cod',
    q: 'prépare quoi',
    circ: 'dans la cuisine',
    avant: GOUTER,
    autre: 'dans le salon',
  },
  {
    gs: 'Ma voisine',
    verbe: 'parle',
    obj: 'à son chien',
    type: 'coi',
    q: 'parle à qui',
    prep: 'à',
    circ: 'dans la rue',
    avant: TOUS,
    autre: 'dans le parc',
  },
  {
    gs: 'Mon oncle',
    verbe: 'téléphone',
    obj: 'à sa sœur',
    type: 'coi',
    q: 'téléphone à qui',
    prep: 'à',
    circ: 'tous les dimanches',
    autre: 'chaque soir',
  },
  {
    gs: 'Les élèves',
    verbe: 'obéissent',
    obj: 'à la maîtresse',
    type: 'coi',
    q: 'obéissent à qui',
    prep: 'à',
    circ: 'en classe',
    avant: SEMAINE,
    autre: 'dans la cour',
  },
  {
    gs: 'Ma cousine',
    verbe: 'pense',
    obj: 'à ses vacances',
    type: 'coi',
    q: 'pense à quoi',
    prep: 'à',
    circ: 'le soir',
    autre: 'le matin',
  },
  {
    gs: 'Le maître',
    verbe: 'parle',
    obj: 'de la météo',
    type: 'coi',
    q: 'parle de quoi',
    prep: 'de',
    circ: 'ce matin',
    autre: 'ce soir',
  },
  {
    gs: 'Tu',
    verbe: 'téléphones',
    obj: 'à ton ami',
    type: 'coi',
    q: 'téléphones à qui',
    prep: 'à',
    circ: 'après le repas',
    autre: 'avant le dîner',
  },
  {
    gs: 'Les enfants',
    verbe: 'rêvent',
    obj: 'de la mer',
    type: 'coi',
    q: 'rêvent de quoi',
    prep: 'de',
    circ: 'en classe',
    avant: SEMAINE,
    autre: 'dans leur lit',
  },
  {
    gs: 'Mon père',
    verbe: 'pense',
    obj: 'à son travail',
    type: 'coi',
    q: 'pense à quoi',
    prep: 'à',
    circ: 'dans le train',
    avant: SEMAINE,
    autre: 'dans la voiture',
  },
  {
    gs: 'Le chien',
    verbe: 'obéit',
    obj: 'à son maître',
    type: 'coi',
    q: 'obéit à qui',
    prep: 'à',
    circ: 'dans le parc',
    avant: TOUS,
    autre: 'dans la cour',
  },
  {
    gs: 'Ma mère',
    verbe: 'téléphone',
    obj: 'à son frère',
    type: 'coi',
    q: 'téléphone à qui',
    prep: 'à',
    circ: 'dans le bureau',
    avant: SEMAINE,
    autre: 'dans le salon',
  },
  {
    gs: 'Les enfants',
    verbe: 'parlent',
    obj: 'de leur sortie',
    type: 'coi',
    q: 'parlent de quoi',
    prep: 'de',
    circ: 'dans le car',
    avant: SEMAINE,
    autre: 'sur le chemin',
  },
  {
    gs: 'Mon voisin',
    verbe: 'pense',
    obj: 'à son jardin',
    type: 'coi',
    q: 'pense à quoi',
    prep: 'à',
    circ: 'dans le bus',
    avant: SEMAINE,
    autre: 'dans le métro',
  },
];

// ───────────────────────── Constructions ─────────────────────────

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Phrase de base : sujet, verbe, complément d'objet, groupe circonstanciel. */
export const base = (e: Entree): string => `${e.gs} ${e.verbe} ${e.obj} ${e.circ}.`;
/** Sans le groupe circonstanciel. */
export const sansCirc = (e: Entree): string => `${e.gs} ${e.verbe} ${e.obj}.`;
/** Groupe circonstanciel déplacé au début. */
export const devant = (e: Entree): string => `${cap(e.circ)}, ${lowerFirst(e.gs)} ${e.verbe} ${e.obj}.`;
/** Deux groupes circonstanciels : un devant (temps), un à la fin (lieu). */
export const deux = (e: Entree, avant: string): string =>
  `${avant}, ${lowerFirst(e.gs)} ${e.verbe} ${e.obj} ${e.circ}.`;

export type Manip = 'deplacer' | 'supprimer' | 'remplacer' | 'ajouter' | 'encadrer';
export const MANIPS: readonly Manip[] = ['deplacer', 'supprimer', 'remplacer', 'ajouter', 'encadrer'];

/** « souvent » ne s'ajoute qu'aux phrases sans repère de fréquence ou de moment. */
export const manipsDe = (e: Entree): readonly Manip[] => MANIPS.filter((m) => m !== 'ajouter' || e.avant !== undefined);

/** Écritures d’une phrase : avec ou sans point ; la virgule après un groupe placé en tête est facultative. */
export const ecritures = (phrase: string): string[] =>
  [...new Set([phrase, phrase.replace(',', '')])].flatMap((s) => [s, s.replace(/\.$/, '')]);
/** Les accents sont facultatifs, sauf celui de « à » : « a » est le verbe avoir, et non la préposition évaluée. */
const toleres = (accepted: readonly string[]): string[] => tolerer(accepted, 'àÀ');
/** Réponses acceptées pour une phrase. */
export const phraseAcceptee = (phrase: string): string[] => toleres(ecritures(phrase));
/** Réponses acceptées pour un groupe recopié : point ou virgule recopiés tolérés. */
export const groupeAccepte = (groupe: string): string[] => toleres([groupe, `${groupe}.`, `${groupe},`]);

/** Résultat d'une manipulation sur la phrase de base. */
export function resultat(e: Entree, m: Manip): string {
  switch (m) {
    case 'deplacer':
      return devant(e);
    case 'supprimer':
      return sansCirc(e);
    case 'remplacer':
      return `${e.gs} ${e.verbe} ${e.obj} ${e.autre}.`;
    case 'ajouter':
      return `${e.gs} ${e.verbe} souvent ${e.obj} ${e.circ}.`;
    case 'encadrer':
      return `C’est ${e.circ} que ${lowerFirst(e.gs)} ${e.verbe} ${e.obj}.`;
  }
}

/** La consigne de chaque manipulation. */
export function consigne(e: Entree, m: Manip): string {
  switch (m) {
    case 'deplacer':
      return `déplace « ${e.circ} » au début de la phrase`;
    case 'supprimer':
      return `supprime « ${e.circ} »`;
    case 'remplacer':
      return `remplace « ${e.circ} » par « ${e.autre} »`;
    case 'ajouter':
      return 'ajoute « souvent » juste après le verbe';
    case 'encadrer':
      return `encadre « ${e.circ} » avec « C’est » et « que »`;
  }
}

export const NOM_MANIP: Record<Manip, string> = {
  deplacer: 'déplacer',
  supprimer: 'supprimer',
  remplacer: 'remplacer',
  ajouter: 'ajouter',
  encadrer: 'encadrer',
};

/** « en déplaçant », « en supprimant »… */
export const EN_FAISANT: Record<Manip, string> = {
  deplacer: 'en déplaçant le groupe circonstanciel',
  supprimer: 'en supprimant le groupe circonstanciel',
  remplacer: 'en remplaçant le groupe circonstanciel',
  ajouter: 'en ajoutant « souvent »',
  encadrer: 'en encadrant le groupe circonstanciel avec « C’est » et « que »',
};

/** Ce qu'est la manipulation (pour expliquer pourquoi ce n'est pas elle). */
export const DEFINITION: Record<Manip, string> = {
  deplacer: 'Déplacer, c’est changer un groupe de place, sans rien ajouter ni enlever.',
  supprimer: 'Supprimer, c’est enlever un groupe.',
  remplacer: 'Remplacer, c’est mettre un autre groupe à la place d’un groupe.',
  ajouter: 'Ajouter, c’est mettre un mot ou un groupe en plus.',
  encadrer: 'Encadrer, c’est entourer un groupe avec « C’est » et « que ».',
};

/** Ce qu'on a fait, vu dans la phrase obtenue. */
export const CONSTAT: Record<Manip, string> = {
  deplacer: 'un groupe a changé de place',
  supprimer: 'un groupe a disparu',
  remplacer: 'un groupe a été changé contre un autre',
  ajouter: 'un mot a été mis en plus',
  encadrer: 'un groupe est entouré par « C’est » et « que »',
};
