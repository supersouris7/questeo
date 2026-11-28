/**
 * Données du chapitre « Valeurs des temps » (6e) : faits cités, phrases et textes écrits pour l’exercice (les
 * exemples repris d’une source sont ceux des faits). Les formes conjuguées demandées viennent des tables relevées au
 * CM1 et au CM2 (`temps.donnees.ts`, `passe-simple.donnees.ts`).
 */
import type { Fait } from './phrases.donnees.ts';
import { faitPasseSimple, type VerbePs } from './passe-simple.donnees.ts';
import { sourceDe, type Personne } from './present.donnees.ts';
import type { VerbeTemps } from './temps.donnees.ts';

export const PROGRAMME = 'francais-cycle3-2025';
const GRAMMAIRE = 'eduscol-grammaire-francais';

const fait =
  (source: string) =>
  (id: string, citation: string): Fait => ({ id, source, citation });
const prog = fait(PROGRAMME);
const gram = fait(GRAMMAIRE);
const present = fait('academie-present');
const passe = fait('academie-passe');
const imparfaitAc = fait('academie-imparfait');
const recit = fait('academie-recit');

export const FAITS_VALEURS_TEMPS: readonly Fait[] = [
  prog(
    'vt-initier',
    'Initier à la notion de valeurs des temps par observation, comparaison, opposition de phrases et textes rencontrés : des temps du discours, puis des temps du récit. Quelques valeurs temporelles des temps seront identifiées',
  ),
  prog(
    'vt-distinction',
    'La démarche pédagogique visera à clarifier la distinction entre le temps chronologique (passé, présent, futur) et le temps verbal (par exemple : imparfait, passé simple, passé composé), afin de lever toute confusion possible chez les élèves.',
  ),
  prog('vt-marques', 'Savoir isoler et connaître les marques de temps de l’imparfait (-ai-, -i-) ; du futur (-r-)'),
  prog(
    'vt-composition',
    'Connaître la composition en deux parties (auxiliaire + participe passé) des temps composés (passé composé et plus-que-parfait)',
  ),
  gram(
    'vt-epoques',
    'situer une action dans le temps consiste à la situer dans l’une des trois époques, le passé, le présent ou le futur',
  ),
  gram(
    'vt-ambigu',
    'Mais cette notion de temps est ambiguë et il faut au moins distinguer : • le temps des époques (ou « temps » proprement dit)',
  ),
  gram(
    'vt-temps-verbe',
    'le terme « temps » est utilisé pour désigner les formes de la conjugaison du verbe au sens où l’on dit que l’imparfait est un temps',
  ),
  gram('vt-conventionnel', 'Cet emploi du mot « temps » est purement conventionnel'),
  gram(
    'vt-futur-proche',
    'le présent peut avoir diverses valeurs temporelles : une valeur de présent ponctuel (Je vous remercie), de présent étendu (Il pleut depuis une heure), de présent de vérité générale (L’humain est mortel), de futur proche (J’arrive dans un instant)',
  ),
  gram(
    'vt-valeurs',
    'On parlera donc des « valeurs du présent », des « valeurs de l’imparfait », etc. pour désigner le sens particulier que prennent les temps de l’indicatif dans tel ou tel contexte.',
  ),
  present(
    'vt-present-epoque',
    'Temps verbal qui se situe entre le passé et le futur, et qui désigne l’époque contemporaine de l’énonciation.',
  ),
  present(
    'vt-present-enonciation',
    'Le présent peut marquer la stricte coïncidence entre le procès et le moment de l’énonciation, comme dans « Je vous félicite » ou « Le téléphone sonne ! »',
  ),
  present(
    'vt-present-verite',
    'Présent de vérité générale ou présent gnomique, utilisé pour énoncer des vérités atemporelles, comme dans « L’angle droit mesure 90 degrés » ou « La fortune sourit aux audacieux ».',
  ),
  present(
    'vt-present-narration',
    'Présent historique ou présent de narration, présent de l’indicatif employé à la place d’un passé pour rendre un récit plus vivant, comme dans la phrase : « Il est quatre heures du matin en Europe le 21 juillet 1969, lorsqu’un homme, Neil Armstrong, foule le sol lunaire. »',
  ),
  fait('cnrtl-present')(
    'vt-verite-proverbes',
    'un fait d’expérience, une vérité générale (présent atemporel ou intemporel). Le soleil se lève à l’est; deux et deux font quatre; c’est le temps des proverbes et des maximes: Pierre qui roule n’amasse pas mousse.',
  ),
  fait('academie-enonciation')('vt-enonciation', 'Production individuelle d’un énoncé dans une situation donnée.'),
  imparfaitAc(
    'vt-imparfait-inacheve',
    'temps simple de l’indicatif qu’on emploie lorsque le verbe désigne un fait encore inachevé au moment passé où on l’envisage',
  ),
  imparfaitAc(
    'vt-imparfait-roles',
    'L’imparfait sert essentiellement à marquer la durée, à décrire un état, à exprimer la répétition.',
  ),
  passe(
    'vt-ps-totalite',
    'temps simple de l’indicatif qui permet d’envisager dans sa totalité une action entièrement achevée au moment de l’énonciation',
  ),
  passe(
    'vt-ps-evenement',
    'Dans la phrase « Il était encore lycéen quand la guerre éclata », le passé simple introduit un évènement survenant au cours d’une période évoquée à l’imparfait.',
  ),
  passe(
    'vt-ps-historique',
    'Le passé simple, parfois appelé passé historique, est avec l’imparfait un des temps du récit.',
  ),
  passe(
    'vt-pc',
    'temps composé de l’indicatif qui présente une action achevée au moment de l’énonciation en la considérant dans son rapport avec le présent',
  ),
  passe('vt-pc-lien', 'le passé composé souligne le lien entre l’action et le moment de l’énonciation'),
  fait('academie-futur')(
    'vt-futur',
    'temps du mode indicatif utilisé pour marquer qu’une action, un état prendront place dans un moment postérieur au moment de l’énonciation ou à un moment pris comme repère',
  ),
  gram(
    'vt-latin',
    'le français s’est doté de trois temps du passé (passé simple, passé composé, passé antérieur) là où le latin n’en possédait qu’un (le parfait)',
  ),
  gram(
    'vt-discours',
    'dans le cas où l’énoncé est lié à la situation d’énonciation, c’est-à-dire dans le cas du discours, au sens où on l’oppose au récit',
  ),
  gram(
    'vt-benveniste',
    'dans le cas du discours, au sens où on l’oppose au récit (cette distinction est due à Émile Benveniste)',
  ),
  gram(
    'vt-recit-coupe',
    'Le récit, très souvent au passé simple ou à l’imparfait, est coupé de la situation d’énonciation',
  ),
  recit(
    'vt-recit-temps',
    'Énoncé, le plus souvent à la troisième personne, au passé ou au présent historique, dont l’énonciateur cherche à s’effacer. Le passé simple et l’imparfait sont des temps du récit.',
  ),
];

export const faitValeursTemps = (id: string): Fait => {
  const x = FAITS_VALEURS_TEMPS.find((y) => y.id === id);
  if (!x) throw new Error(`fait inconnu : ${id}`);
  return x;
};

/** Sources (programme + documents officiels) des faits cités et des verbes conjugués par une notion. */
export const sourcesValeursTemps = (faits: readonly string[], verbes: readonly VerbePs[] = []): string[] => [
  ...new Set([
    PROGRAMME,
    ...faits.map((id) => faitValeursTemps(id).source),
    ...verbes.map((v) => {
      // Garde : chaque verbe demandé a bien sa conjugaison relevée au passé simple.
      faitPasseSimple(`passe-simple-${v}`);
      return sourceDe(v);
    }),
  ]),
];

// ───────────────────────── 1. Temps chronologique et temps verbal ─────────────────────────

export type Epoque = 'passé' | 'présent' | 'futur';
export type TempsVerbal = 'présent' | 'imparfait' | 'futur' | 'passé composé';

export interface PhraseTemps {
  readonly phrase: string;
  /** Verbe conjugué, tel qu’il est écrit dans la phrase. */
  readonly verbe: string;
  readonly temps: TempsVerbal;
  readonly epoque: Epoque;
  /** Mots de la phrase qui situent l’action. */
  readonly repere: string;
}

const pt = (phrase: string, verbe: string, temps: TempsVerbal, epoque: Epoque, repere: string): PhraseTemps => ({
  phrase,
  verbe,
  temps,
  epoque,
  repere,
});

/** Le temps verbal et l’époque vont dans le même sens. */
export const ACCORDEES: readonly PhraseTemps[] = [
  pt('En ce moment, ma sœur prépare son sac.', 'prépare', 'présent', 'présent', 'En ce moment'),
  pt('Maintenant, nous attendons le bus.', 'attendons', 'présent', 'présent', 'Maintenant'),
  pt('En ce moment, le jardinier arrose les fleurs.', 'arrose', 'présent', 'présent', 'En ce moment'),
  pt('Regarde : le chat grimpe sur le toit.', 'grimpe', 'présent', 'présent', 'Regarde'),
  pt('Autrefois, mon grand-père réparait des montres.', 'réparait', 'imparfait', 'passé', 'Autrefois'),
  pt('L’an dernier, nous habitions près de la gare.', 'habitions', 'imparfait', 'passé', 'L’an dernier'),
  pt(
    'Quand il était petit, mon oncle collectionnait les timbres.',
    'collectionnait',
    'imparfait',
    'passé',
    'Quand il était petit',
  ),
  pt('Hier, Samia a rangé sa chambre.', 'a rangé', 'passé composé', 'passé', 'Hier'),
  pt(
    'La semaine dernière, nous avons visité un musée.',
    'avons visité',
    'passé composé',
    'passé',
    'La semaine dernière',
  ),
  pt('Ce matin, tu as oublié ta trousse.', 'as oublié', 'passé composé', 'passé', 'Ce matin'),
  pt('Demain, nous jouerons au parc.', 'jouerons', 'futur', 'futur', 'Demain'),
  pt('L’été prochain, mes cousins voyageront en train.', 'voyageront', 'futur', 'futur', 'L’été prochain'),
  pt('Dans deux jours, la classe visitera le château.', 'visitera', 'futur', 'futur', 'Dans deux jours'),
  pt('Plus tard, je dessinerai la carte.', 'dessinerai', 'futur', 'futur', 'Plus tard'),
];

/** Le présent sert à parler d’une autre époque : futur proche ou récit au passé. */
export const DECALEES: readonly PhraseTemps[] = [
  pt('Demain, nous partons à la mer.', 'partons', 'présent', 'futur', 'Demain'),
  pt('La semaine prochaine, je change de club.', 'change', 'présent', 'futur', 'La semaine prochaine'),
  pt('Dans cinq minutes, le film commence.', 'commence', 'présent', 'futur', 'Dans cinq minutes'),
  pt('Ne bouge pas, j’arrive dans un instant.', 'arrive', 'présent', 'futur', 'dans un instant'),
  pt('Samedi prochain, mon cousin nous rejoint.', 'rejoint', 'présent', 'futur', 'Samedi prochain'),
  pt('L’an prochain, ma sœur entre au lycée.', 'entre', 'présent', 'futur', 'L’an prochain'),
  pt('Le 21 juillet 1969, un homme marche sur la Lune.', 'marche', 'présent', 'passé', 'Le 21 juillet 1969'),
  pt('L’an dernier, au cirque, un clown tombe dans un seau !', 'tombe', 'présent', 'passé', 'L’an dernier'),
  pt('L’été dernier, un soir, notre tente s’envole !', 's’envole', 'présent', 'passé', 'L’été dernier'),
  pt('Hier, en plein match, mon lacet casse !', 'casse', 'présent', 'passé', 'Hier'),
];

export interface MessageTemps {
  readonly titre: string;
  /** Une ligne écrite au moment du message ; chaque phrase est repérée par son verbe. */
  readonly phrases: readonly PhraseTemps[];
}

export const MESSAGES: readonly MessageTemps[] = [
  {
    titre: 'Message d’un correspondant',
    phrases: [
      pt('Hier, j’ai planté un arbre.', 'ai planté', 'passé composé', 'passé', 'Hier'),
      pt('En ce moment, je t’écris de ma chambre.', 'écris', 'présent', 'présent', 'En ce moment'),
      pt('Demain, nous partons chez ma tante.', 'partons', 'présent', 'futur', 'Demain'),
    ],
  },
  {
    titre: 'Carte envoyée de la montagne',
    phrases: [
      pt('Samedi prochain, nous rentrons à la maison.', 'rentrons', 'présent', 'futur', 'Samedi prochain'),
      pt('La semaine dernière, il neigeait sans arrêt.', 'neigeait', 'imparfait', 'passé', 'La semaine dernière'),
      pt('Maintenant, le soleil brille sur les pistes.', 'brille', 'présent', 'présent', 'Maintenant'),
    ],
  },
  {
    titre: 'Journal du club de théâtre',
    phrases: [
      pt('Ce matin, nous avons essayé les costumes.', 'avons essayé', 'passé composé', 'passé', 'Ce matin'),
      pt('Dans un mois, nous jouerons devant les familles.', 'jouerons', 'futur', 'futur', 'Dans un mois'),
      pt('En ce moment, chacun répète son rôle.', 'répète', 'présent', 'présent', 'En ce moment'),
    ],
  },
  {
    titre: 'Mot laissé sur la table',
    phrases: [
      pt('Dans une heure, je reviens avec le pain.', 'reviens', 'présent', 'futur', 'Dans une heure'),
      pt('Ce matin, le facteur a déposé un colis.', 'a déposé', 'passé composé', 'passé', 'Ce matin'),
      pt('En ce moment, le gâteau cuit dans le four.', 'cuit', 'présent', 'présent', 'En ce moment'),
    ],
  },
  {
    titre: 'Nouvelles du jardin partagé',
    phrases: [
      pt('Autrefois, ce terrain restait vide.', 'restait', 'imparfait', 'passé', 'Autrefois'),
      pt(
        'Aujourd’hui, en ce moment même, nous arrosons les salades.',
        'arrosons',
        'présent',
        'présent',
        'en ce moment même',
      ),
      pt('Au printemps prochain, les fraises pousseront ici.', 'pousseront', 'futur', 'futur', 'Au printemps prochain'),
    ],
  },
  {
    titre: 'Lettre à une amie',
    phrases: [
      pt('La semaine prochaine, je commence la natation.', 'commence', 'présent', 'futur', 'La semaine prochaine'),
      pt('L’an dernier, j’avais peur de l’eau.', 'avais', 'imparfait', 'passé', 'L’an dernier'),
      pt('Hier, j’ai acheté un bonnet de bain.', 'ai acheté', 'passé composé', 'passé', 'Hier'),
    ],
  },
];

// ───────────────────────── 2. Valeurs du présent ─────────────────────────

export type Valeur = 'énonciation' | 'vérité générale' | 'narration';
export const VALEURS: readonly Valeur[] = ['énonciation', 'vérité générale', 'narration'];

export interface PhrasePresent {
  readonly phrase: string;
  /** Verbe au présent étudié (une seule occurrence dans la phrase). */
  readonly verbe: string;
  readonly valeur: Valeur;
}

const pp =
  (valeur: Valeur) =>
  (phrase: string, verbe: string): PhrasePresent => ({ phrase, verbe, valeur });
const en = pp('énonciation');
const vg = pp('vérité générale');
const na = pp('narration');

export const PRESENTS_ENONCIATION: readonly PhrasePresent[] = [
  en('Regarde, le soleil se lève derrière la colline !', 'se lève'),
  en('Chut, le bébé dort.', 'dort'),
  en('Écoute, quelqu’un frappe à la porte.', 'frappe'),
  en('En ce moment, je lis ton message.', 'lis'),
  en('Attention, tu marches sur mon dessin !', 'marches'),
  en('Regarde, ma petite sœur te sourit.', 'sourit'),
  en('Je vous félicite pour ce beau spectacle.', 'félicite'),
  en('Vite, le téléphone sonne !', 'sonne'),
  en('Là, devant moi, je vois un écureuil.', 'vois'),
  en('Regarde, cet oiseau fait son nid sous notre balcon.', 'fait'),
];

export const PRESENTS_VERITE: readonly PhrasePresent[] = [
  vg('Le soleil se lève à l’est.', 'se lève'),
  vg('Qui dort dîne.', 'dort'),
  vg('La fortune sourit aux audacieux.', 'sourit'),
  vg('Deux et deux font quatre.', 'font'),
  vg('L’angle droit mesure 90 degrés.', 'mesure'),
  vg('Pierre qui roule n’amasse pas mousse.', 'amasse'),
  vg('Petit à petit, l’oiseau fait son nid.', 'fait'),
  vg('Après la pluie vient le beau temps.', 'vient'),
  vg('Un triangle possède trois côtés.', 'possède'),
  vg('Une semaine compte sept jours.', 'compte'),
];

export const PRESENTS_NARRATION: readonly PhrasePresent[] = [
  na('Hier, nous marchions dans la forêt. Tout à coup, un cerf traverse le chemin !', 'traverse'),
  na('Le soir tombait sur le port. Soudain, une cloche sonne !', 'sonne'),
  na('L’été dernier, nous dormions sous la tente. Au milieu de la nuit, un hibou crie !', 'crie'),
  na('La course venait de partir. À cet instant, mon lacet casse !', 'casse'),
  na('Le chevalier avançait sans bruit. Soudain, le dragon ouvre un œil !', 'ouvre'),
  na('Nous attendions dans la cour. Tout à coup, la lumière s’éteint !', 's’éteint'),
  na('Ce jour-là, le marin guettait la côte. Enfin, il voit une lumière !', 'voit'),
  na('La salle était silencieuse. Alors, le rideau se lève !', 'se lève'),
];

/** Présents de narration sans autre verbe au passé : seule la date situe le récit (niveau 4). */
export const PRESENTS_DATES: readonly PhrasePresent[] = [
  na('Le 21 juillet 1969, un homme marche sur la Lune.', 'marche'),
  na('L’an dernier, au cirque, un clown tombe dans un seau !', 'tombe'),
];

export interface RecitPresent {
  readonly titre: string;
  /** Lignes du document ; les verbes étudiés sont suivis de leur lettre. */
  readonly lignes: readonly string[];
  /** Verbes étudiés (A, B, C) et leur valeur. */
  readonly verbes: readonly (readonly ['A' | 'B' | 'C', string, Valeur])[];
}

export const RECITS_PRESENT: readonly RecitPresent[] = [
  {
    titre: 'La nuit au bord du lac',
    lignes: [
      'Hier soir, nous campions près du lac.',
      'Soudain, un hibou passe (A) au-dessus de la tente !',
      '« J’entends (B) un bruit ! » crie mon frère.',
      'Mon père répond : « La nuit, tous les chats sont (C) gris. »',
    ],
    verbes: [
      ['A', 'passe', 'narration'],
      ['B', 'entends', 'énonciation'],
      ['C', 'sont', 'vérité générale'],
    ],
  },
  {
    titre: 'Orage en montagne',
    lignes: [
      'L’été dernier, nous grimpions vers le refuge.',
      '« Après la pluie vient (A) le beau temps », répétait notre guide.',
      'Tout à coup, le ciel devient (B) tout noir !',
      '« Je vois (C) un éclair ! » dit ma cousine.',
    ],
    verbes: [
      ['A', 'vient', 'vérité générale'],
      ['B', 'devient', 'narration'],
      ['C', 'vois', 'énonciation'],
    ],
  },
  {
    titre: 'Le grenier de Mamie',
    lignes: [
      'Samedi dernier, je rangeais le grenier avec Mamie.',
      '« Regarde, je tiens (A) une vieille photo ! » me dit-elle.',
      'Moi, je comptais les cartons qui restaient.',
      '« Petit à petit, l’oiseau fait (B) son nid », ajoute-t-elle.',
      'Soudain, une grosse boîte tombe (C) de l’étagère !',
    ],
    verbes: [
      ['A', 'tiens', 'énonciation'],
      ['B', 'fait', 'vérité générale'],
      ['C', 'tombe', 'narration'],
    ],
  },
  {
    titre: 'La visite du moulin',
    lignes: [
      'Mardi dernier, notre classe visitait un moulin.',
      'La meunière nous montrait la grande roue.',
      'Brusquement, un chat saute (A) sur un sac de farine !',
      '« L’union fait (B) la force », disait une affiche.',
      '« Vous entendez (C) ce craquement ? » demande la meunière.',
    ],
    verbes: [
      ['A', 'saute', 'narration'],
      ['B', 'fait', 'vérité générale'],
      ['C', 'entendez', 'énonciation'],
    ],
  },
  {
    titre: 'La course au stade',
    lignes: [
      'Hier, au stade, les coureurs attendaient le départ.',
      '« Rien ne sert (A) de courir ; il faut partir à point », rappelait l’entraîneur.',
      '« Je reconnais (B) mon cousin ! » crie mon voisin.',
      'Au dernier tour, une coureuse prend (C) la tête !',
    ],
    verbes: [
      ['A', 'sert', 'vérité générale'],
      ['B', 'reconnais', 'énonciation'],
      ['C', 'prend', 'narration'],
    ],
  },
  {
    titre: 'Le renard et le fromage',
    lignes: [
      'Ce matin-là, le renard avait très faim.',
      '« Je sens (A) une bonne odeur », murmurait-il.',
      'Soudain, il aperçoit (B) un fromage sur une branche !',
      'Un vieux hibou lui souffla : « Qui ne risque rien n’a (C) rien. »',
    ],
    verbes: [
      ['A', 'sens', 'énonciation'],
      ['B', 'aperçoit', 'narration'],
      ['C', 'a', 'vérité générale'],
    ],
  },
];

// ───────────────────────── 3. Imparfait et passé simple ─────────────────────────

export type TempsRecit = 'imparfait' | 'passé simple';
export type Role = 'décor' | 'habitude' | 'événement';

export const tempsDuRole = (r: Role): TempsRecit => (r === 'événement' ? 'passé simple' : 'imparfait');

/** Deux actions d’un même récit : celle qui dure, puis celle qui survient (écrites en toutes lettres). */
export interface Paire {
  readonly decor: string;
  readonly verbeDecor: string;
  readonly evenement: string;
  readonly verbeEvenement: string;
}

const paire = (decor: string, verbeDecor: string, evenement: string, verbeEvenement: string): Paire => ({
  decor,
  verbeDecor,
  evenement,
  verbeEvenement,
});

export const PAIRES: readonly Paire[] = [
  paire('Le chevalier montait la colline.', 'montait', 'Soudain, un cor sonna.', 'sonna'),
  paire('La reine regardait la mer.', 'regardait', 'Tout à coup, un navire arriva.', 'arriva'),
  paire('Les bergers parlaient près du feu.', 'parlaient', 'Soudain, un loup hurla.', 'hurla'),
  paire('La forêt était très sombre.', 'était', 'Tout à coup, une lumière brilla.', 'brilla'),
  paire('Le meunier portait un gros sac.', 'portait', 'Soudain, la corde cassa.', 'cassa'),
  paire('Les marins jouaient aux dés.', 'jouaient', 'Tout à coup, la tempête éclata.', 'éclata'),
  paire('La princesse chantait à sa fenêtre.', 'chantait', 'Soudain, un oiseau entra.', 'entra'),
  paire('Le village dormait sous la neige.', 'dormait', 'Tout à coup, les cloches sonnèrent.', 'sonnèrent'),
];

export interface Trou {
  readonly sujet: string;
  readonly personne: Extract<Personne, 'il' | 'ils'>;
  readonly verbe: VerbeTemps & VerbePs;
  readonly suite: string;
  readonly role: Role;
  /** Mots placés avant le sujet, qui indiquent le rôle du verbe. */
  readonly repere: string;
}

type Qui = Pick<Trou, 'sujet' | 'personne'>;
const un = (sujet: string): Qui => ({ sujet, personne: 'il' });
const des = (sujet: string): Qui => ({ sujet, personne: 'ils' });

const trou = (repere: string, qui: Qui, verbe: Trou['verbe'], suite: string, role: Role): Trou => ({
  ...qui,
  repere,
  verbe,
  suite,
  role,
});

/** Phrases à compléter (niveaux 2 et 3) : le repère dit le rôle du verbe. */
export const TROUS: readonly Trou[] = [
  trou('Chaque matin,', un('le meunier'), 'porter', 'ses sacs au marché', 'habitude'),
  trou('Tous les soirs,', des('les enfants'), 'écouter', 'les histoires du vieux marin', 'habitude'),
  trou('Chaque dimanche,', un('la reine'), 'marcher', 'dans son jardin', 'habitude'),
  trou('Tous les hivers,', des('les bergers'), 'chanter', 'autour du feu', 'habitude'),
  trou('En ce temps-là,', un('le roi'), 'avoir', 'une longue barbe', 'décor'),
  trou('En ce temps-là,', des('les routes'), 'être', 'très dangereuses', 'décor'),
  trou('Soudain,', un('le chevalier'), 'sauter', 'de son cheval', 'événement'),
  trou('Tout à coup,', des('les gardes'), 'regarder', 'vers la tour', 'événement'),
  trou('Un beau matin,', un('la bergère'), 'trouver', 'une clé dorée', 'événement'),
  trou('Soudain,', des('les loups'), 'venir', 'près des maisons', 'événement'),
  trou('Tout à coup,', un('le géant'), 'prendre', 'son bâton', 'événement'),
  trou('Un soir,', des('les voyageurs'), 'voir', 'une étrange lueur', 'événement'),
  trou('Soudain,', un('la sorcière'), 'faire', 'un grand geste', 'événement'),
  trou('Chaque nuit,', un('le veilleur'), 'regarder', 'les étoiles', 'habitude'),
];

/** Une action en cours, puis « quand, soudain » un événement (niveau 4) : chaque sujet précède son verbe. */
export interface DeuxTrous {
  readonly cours: Omit<Trou, 'role' | 'repere'>;
  readonly survient: Omit<Trou, 'role' | 'repere'>;
}

const partie = (sujet: string, personne: Trou['personne'], verbe: Trou['verbe'], suite: string) => ({
  sujet,
  personne,
  verbe,
  suite,
});
const deux = (cours: DeuxTrous['cours'], survient: DeuxTrous['survient']): DeuxTrous => ({ cours, survient });

export const DOUBLES: readonly DeuxTrous[] = [
  deux(partie('Le roi', 'il', 'regarder', 'la mer'), partie('un messager', 'il', 'venir', 'à lui')),
  deux(partie('La princesse', 'il', 'chanter', 'au jardin'), partie('le dragon', 'il', 'faire', 'un grand bruit')),
  deux(partie('Le meunier', 'il', 'marcher', 'vers le village'), partie('il', 'il', 'voir', 'un loup')),
  deux(partie('Les enfants', 'ils', 'jouer', 'près du puits'), partie('une fée', 'il', 'prendre', 'la parole')),
  deux(partie('Le chevalier', 'il', 'être', 'dans la grotte'), partie('il', 'il', 'trouver', 'une épée')),
  deux(partie('Les bergers', 'ils', 'parler', 'près du feu'), partie('deux étrangers', 'ils', 'venir', 'vers eux')),
  deux(partie('La sorcière', 'il', 'faire', 'sa soupe'), partie('ses chats', 'ils', 'sauter', 'sur la table')),
  deux(partie('Le prince', 'il', 'avoir', 'un livre à la main'), partie('il', 'il', 'aller', 'à la fenêtre')),
  deux(partie('Les marins', 'ils', 'dessiner', 'une carte'), partie('ils', 'ils', 'voir', 'une île')),
];

export interface Conte {
  readonly titre: string;
  readonly trous: readonly [Trou, Trou, Trou, Trou];
}

export const CONTES: readonly Conte[] = [
  {
    titre: 'Le veilleur de la tour',
    trous: [
      trou('En ce temps-là,', un('la tour'), 'être', 'très haute', 'décor'),
      trou('Chaque soir,', des('les deux veilleurs'), 'regarder', 'la plaine', 'habitude'),
      trou('Un soir,', des('ils'), 'voir', 'des torches au loin', 'événement'),
      trou('Aussitôt,', un('le plus jeune'), 'prendre', 'sa trompe', 'événement'),
    ],
  },
  {
    titre: 'La bergère et la clé',
    trous: [
      trou('En ce temps-là,', un('la bergère des Hautes Terres'), 'avoir', 'douze moutons', 'décor'),
      trou('Un beau matin,', un('elle'), 'trouver', 'une clé sous une pierre', 'événement'),
      trou('Soudain,', des('ses moutons'), 'venir', 'tout près d’elle', 'événement'),
      trou('Depuis toujours,', des('les anciens du village'), 'parler', 'de cette clé', 'habitude'),
    ],
  },
  {
    titre: 'Le géant du pont',
    trous: [
      trou('Un jour,', des('trois voyageurs'), 'aller', 'jusqu’au vieux pont', 'événement'),
      trou('En ce temps-là,', un('le gardien du pont'), 'être', 'un géant', 'décor'),
      trou('Chaque jour,', un('il'), 'porter', 'un énorme bâton', 'habitude'),
      trou('Soudain,', un('le géant'), 'faire', 'un pas vers eux', 'événement'),
    ],
  },
  {
    titre: 'La fontaine qui chante',
    trous: [
      trou('Chaque printemps,', un('la fontaine de la place'), 'chanter', 'toute la nuit', 'habitude'),
      trou('Un soir,', des('deux enfants curieux'), 'vouloir', 'découvrir son secret', 'événement'),
      trou('En ce temps-là,', des('les rues'), 'être', 'sans lumière', 'décor'),
      trou('Tout à coup,', un('l’eau'), 'sauter', 'hors du bassin', 'événement'),
    ],
  },
  {
    titre: 'Le navire perdu',
    trous: [
      trou('En ce temps-là,', des('les marins du port'), 'avoir', 'peur du brouillard', 'décor'),
      trou('Un matin,', un('un jeune mousse'), 'prendre', 'une petite barque', 'événement'),
      trou('Soudain,', un('il'), 'voir', 'les voiles du navire perdu', 'événement'),
      trou('Chaque soir,', un('sa mère'), 'regarder', 'la mer', 'habitude'),
    ],
  },
  {
    titre: 'L’école de la forêt',
    trous: [
      trou('Chaque matin,', des('les lutins'), 'marcher', 'vers la clairière', 'habitude'),
      trou('En ce temps-là,', un('leur maître'), 'être', 'un vieux blaireau', 'décor'),
      trou('Un matin,', un('un renard'), 'venir', 'frapper à la porte', 'événement'),
      trou('Aussitôt,', des('les élèves'), 'faire', 'silence', 'événement'),
    ],
  },
];

// ───────────────────────── 4. Discours et récit ─────────────────────────

export type Ensemble = 'discours' | 'récit';
export type TempsEnsemble = 'présent' | 'passé composé' | 'futur' | 'passé simple';

export interface Enonce {
  readonly phrase: string;
  readonly verbe: string;
  readonly ensemble: Ensemble;
  readonly temps: TempsEnsemble;
  /** Ce qui, dans la phrase, relie ou non au moment où l’on parle. */
  readonly repere: string;
}

const dis = (phrase: string, verbe: string, temps: TempsEnsemble, repere: string): Enonce => ({
  phrase,
  verbe,
  temps,
  repere,
  ensemble: 'discours',
});
const rec = (phrase: string, verbe: string, repere: string): Enonce => ({
  phrase,
  verbe,
  repere,
  temps: 'passé simple',
  ensemble: 'récit',
});

export const ENONCES_DISCOURS: readonly Enonce[] = [
  dis('Hier, j’ai trouvé une plume bleue.', 'ai trouvé', 'passé composé', 'je, hier'),
  dis('Tu as oublié ton écharpe chez moi.', 'as oublié', 'passé composé', 'tu, chez moi'),
  dis('Nous avons gagné le match ce matin !', 'avons gagné', 'passé composé', 'nous, ce matin'),
  dis('Ce matin, mon voisin a réparé notre portail.', 'a réparé', 'passé composé', 'ce matin, notre'),
  dis('Demain, je t’apporterai le livre.', 'apporterai', 'futur', 'je, demain'),
  dis('Vous visiterez notre atelier la semaine prochaine.', 'visiterez', 'futur', 'vous, la semaine prochaine'),
  dis('En ce moment, je prépare ton cadeau.', 'prépare', 'présent', 'je, en ce moment'),
  dis('Regarde, nous plantons les tulipes ici.', 'plantons', 'présent', 'nous, ici'),
];

export const ENONCES_RECIT: readonly Enonce[] = [
  rec('Ce jour-là, le chevalier traversa la rivière.', 'traversa', 'il, ce jour-là'),
  rec('La reine regarda longtemps le vieux coffre.', 'regarda', 'elle, aucun lien avec maintenant'),
  rec('Les marins quittèrent le port à l’aube.', 'quittèrent', 'ils, à l’aube'),
  rec('Le meunier trouva un sac rempli d’or.', 'trouva', 'il, aucun lien avec maintenant'),
  rec('Ce soir-là, les loups entourèrent la cabane.', 'entourèrent', 'ils, ce soir-là'),
  rec('La fée donna une noix à la bergère.', 'donna', 'elle, aucun lien avec maintenant'),
  rec('Un matin, le géant ferma son château.', 'ferma', 'il, un matin'),
  rec('Les deux frères marchèrent jusqu’à la nuit.', 'marchèrent', 'ils, aucun lien avec maintenant'),
];

/** Passage d’un temps à l’autre : le verbe, son sujet et la suite, valables dans les deux phrases. */
export interface Passage {
  readonly sujet: string;
  readonly personne: Trou['personne'];
  readonly genre?: 'm' | 'f';
  readonly verbe: VerbeTemps & VerbePs;
  readonly suite: string;
}

const passage = (
  sujet: string,
  personne: Trou['personne'],
  verbe: Passage['verbe'],
  suite: string,
  genre?: 'm' | 'f',
): Passage => ({ sujet, personne, verbe, suite, ...(genre ? { genre } : {}) });

/** Récit → message (niveau 3) : verbes réguliers en -er, auxiliaire avoir. */
export const VERS_MESSAGE: readonly Passage[] = [
  passage('le voisin', 'il', 'trouver', 'une clé'),
  passage('la boulangère', 'il', 'dessiner', 'une affiche'),
  passage('les pompiers', 'ils', 'porter', 'une grande échelle'),
  passage('mes cousines', 'ils', 'chanter', 'sur la place'),
  passage('le facteur', 'il', 'sauter', 'par-dessus la flaque'),
  passage('les voisins', 'ils', 'écouter', 'la fanfare'),
  passage('ma tante', 'il', 'regarder', 'les étoiles'),
  passage('les joueurs', 'ils', 'marcher', 'jusqu’au stade'),
];

/** Message → récit (niveau 4) : verbes irréguliers, dont des auxiliaires « être ». */
export const VERS_RECIT: readonly Passage[] = [
  passage('la voisine', 'il', 'venir', 'au marché', 'f'),
  passage('les pêcheurs', 'ils', 'aller', 'sur l’île', 'm'),
  passage('le boulanger', 'il', 'faire', 'un pain géant'),
  passage('les enfants', 'ils', 'voir', 'un arc-en-ciel'),
  passage('la gardienne', 'il', 'prendre', 'la lanterne'),
  passage('le maire', 'il', 'vouloir', 'visiter la tour'),
  passage('les voyageurs', 'ils', 'avoir', 'une surprise'),
  passage('le chien', 'il', 'être', 'très courageux'),
  passage('les musiciennes', 'ils', 'venir', 'sous le préau', 'f'),
];

export interface Scene {
  readonly titre: string;
  /** Lignes du document : narration et paroles ; les verbes étudiés sont suivis de leur lettre. */
  readonly lignes: readonly string[];
  /** Verbes étudiés (A, B, C) : récit (narration) ou discours (paroles). */
  readonly verbes: readonly (readonly ['A' | 'B' | 'C', string, Ensemble])[];
  /** Phrase de paroles à compléter au passé composé. */
  readonly message: Passage & { readonly avant: string };
  /** Phrase de narration à compléter au passé simple. */
  readonly narration: Passage & { readonly avant: string };
}

export const SCENES: readonly Scene[] = [
  {
    titre: 'La carte au trésor',
    lignes: [
      'Ce jour-là, la jeune exploratrice ouvrit (A) un vieux coffre.',
      '« Je tiens (B) enfin la preuve ! » dit-elle à son frère.',
      'Le garçon approcha (C) sa lampe.',
    ],
    verbes: [
      ['A', 'ouvrit', 'récit'],
      ['B', 'tiens', 'discours'],
      ['C', 'approcha', 'récit'],
    ],
    message: { ...passage('mon grand-père', 'il', 'dessiner', 'cette carte'), avant: 'L’an dernier, ' },
    narration: { ...passage('ils', 'ils', 'voir', 'une croix rouge'), avant: 'Puis ' },
  },
  {
    titre: 'Le message du phare',
    lignes: [
      '« J’allumerai (A) la lampe du phare ! » promit le gardien.',
      'La nuit couvrait (B) déjà la côte.',
      'Le vieil homme monta (C) les marches une à une.',
    ],
    verbes: [
      ['A', 'allumerai', 'discours'],
      ['B', 'couvrait', 'récit'],
      ['C', 'monta', 'récit'],
    ],
    message: { ...passage('mon fils', 'il', 'porter', 'l’huile là-haut'), avant: 'Ce matin, ' },
    narration: { ...passage('les bateaux', 'ils', 'venir', 'vers le port'), avant: 'Alors ' },
  },
  {
    titre: 'La visite au roi',
    lignes: [
      'Les ambassadeurs entrèrent (A) dans la grande salle.',
      'Le roi les observa (B) en silence.',
      '« Nous apportons (C) une lettre pour vous », annonça le premier.',
    ],
    verbes: [
      ['A', 'entrèrent', 'récit'],
      ['B', 'observa', 'récit'],
      ['C', 'apportons', 'discours'],
    ],
    message: { ...passage('notre reine', 'il', 'chanter', 'vos louanges'), avant: 'Hier encore, ' },
    narration: { ...passage('le roi', 'il', 'prendre', 'la lettre'), avant: 'Enfin, ' },
  },
  {
    titre: 'Le jardin secret',
    lignes: [
      '« Tu as (A) la clé ? » demanda la fillette.',
      '« Je l’ai cherchée (B) toute la matinée », répondit son ami.',
      'Il fouilla (C) dans sa poche.',
    ],
    verbes: [
      ['A', 'as', 'discours'],
      ['B', 'ai cherchée', 'discours'],
      ['C', 'fouilla', 'récit'],
    ],
    message: { ...passage('ma mère', 'il', 'trouver', 'ce passage'), avant: 'La semaine dernière, ' },
    narration: { ...passage('les deux amis', 'ils', 'aller', 'au fond du jardin'), avant: 'Ensuite, ' },
  },
  {
    titre: 'L’orage sur la ferme',
    lignes: [
      'Le fermier rentra (A) en courant.',
      '« La pluie arrive (B) ! » cria-t-il.',
      '« Je fermerai (C) les volets », répondit sa fille.',
    ],
    verbes: [
      ['A', 'rentra', 'récit'],
      ['B', 'arrive', 'discours'],
      ['C', 'fermerai', 'discours'],
    ],
    message: { ...passage('les moutons', 'ils', 'sauter', 'la barrière'), avant: 'Ce matin, ' },
    narration: { ...passage('ils', 'ils', 'faire', 'un grand feu'), avant: 'Le soir, ' },
  },
  {
    titre: 'La répétition',
    lignes: [
      '« Vous entrerez (A) après la musique », expliqua la professeure.',
      'Les comédiens attendaient (B) derrière le rideau.',
      '« J’ai oublié (C) ma première phrase ! » souffla le plus jeune.',
    ],
    verbes: [
      ['A', 'entrerez', 'discours'],
      ['B', 'attendaient', 'récit'],
      ['C', 'ai oublié', 'discours'],
    ],
    message: { ...passage('ma sœur', 'il', 'regarder', 'nos costumes'), avant: 'Ce matin, ' },
    narration: { ...passage('les comédiens', 'ils', 'vouloir', 'commencer'), avant: 'Soudain, ' },
  },
];
