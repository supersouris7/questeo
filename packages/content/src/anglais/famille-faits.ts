/**
 * Anglais CM1, « Famille, corps, vêtements » (lot an-cm1-04) : données citées.
 * Chaque fait porte l'identifiant de sa source (registre `sources.ts`) et une citation exacte du texte consulté
 * le 25/11/2026 (copies d'archive web.archive.org des pages et fiches PDF du British Council) et le 27/11/2026
 * (programme de langues vivantes du cours moyen, arrêté du 26 février 2026). Les espaces et retours à la ligne des fiches PDF sont réduits à une espace.
 */
import type { Fait } from './presentation-faits.ts';
import type { Word } from './temps-faits.ts';

/** La famille : fiche « Family flashcards », chanson « What is a family? » et page « Possessive 's ». */
export const FAMILY: readonly Word[] = [
  { en: 'mother', fr: 'mère', alt: ['mum', 'mom'], typo: 'mather' },
  { en: 'father', fr: 'père', alt: ['dad'], typo: 'fater' },
  { en: 'brother', fr: 'frère', typo: 'broter' },
  { en: 'sister', fr: 'sœur', typo: 'sistre' },
  { en: 'baby', fr: 'bébé', typo: 'babby' },
  { en: 'grandmother', fr: 'grand-mère', alt: ['grandma', 'granny', 'gran', 'grannie', 'nan'], typo: 'grandmoter' },
  { en: 'grandfather', fr: 'grand-père', alt: ['grandad', 'granddad', 'grandpa'], typo: 'grandfater' },
  { en: 'mum', fr: 'maman', alt: ['mom', 'mummy', 'mommy', 'mother'], typo: 'mume' },
  { en: 'dad', fr: 'papa', alt: ['daddy', 'father'], typo: 'dade' },
  { en: 'uncle', fr: 'oncle', typo: 'uncel' },
  { en: 'auntie', fr: 'tante', alt: ['aunt', 'aunty'], typo: 'anty' },
  { en: 'cousin', fr: 'cousin ou cousine', typo: 'cousine' },
  { en: 'son', fr: 'fils', typo: 'sonn' },
  { en: 'parents', fr: 'parents', typo: 'parants' },
];

/** Le corps : fiches « Body flashcards » et « Head flashcards ». */
export const BODY: readonly Word[] = [
  { en: 'head', fr: 'la tête', typo: 'hed' },
  { en: 'hand', fr: 'la main', typo: 'hande' },
  { en: 'foot', fr: 'le pied', typo: 'fot' },
  { en: 'eye', fr: 'l’œil', typo: 'eie' },
  { en: 'nose', fr: 'le nez', typo: 'noze' },
  { en: 'mouth', fr: 'la bouche', typo: 'mouf' },
  { en: 'ear', fr: 'l’oreille', typo: 'eer' },
  { en: 'hair', fr: 'les cheveux', typo: 'hear' },
  { en: 'face', fr: 'le visage', typo: 'fase' },
  { en: 'neck', fr: 'le cou', typo: 'nek' },
  { en: 'chin', fr: 'le menton', typo: 'shin' },
  { en: 'arm', fr: 'le bras', typo: 'arme' },
  { en: 'leg', fr: 'la jambe', typo: 'legg' },
  { en: 'back', fr: 'le dos', typo: 'bak' },
  { en: 'shoulders', fr: 'les épaules', typo: 'sholders' },
  { en: 'finger', fr: 'le doigt', typo: 'fingre' },
  { en: 'toes', fr: 'les orteils', typo: 'tose' },
  { en: 'knee', fr: 'le genou', typo: 'nee' },
  { en: 'ankle', fr: 'la cheville', typo: 'ancle' },
  { en: 'teeth', fr: 'les dents', typo: 'teath' },
];

/** Pluriels des parties du corps (réguliers et irréguliers). */
export const PLURALS: readonly {
  readonly one: string;
  readonly many: string;
  readonly fr: string;
  readonly wrong: readonly string[];
}[] = [
  { one: 'foot', many: 'feet', fr: 'pieds', wrong: ['foots', 'feets'] },
  { one: 'tooth', many: 'teeth', fr: 'dents', wrong: ['tooths', 'teeths'] },
  { one: 'hand', many: 'hands', fr: 'mains', wrong: ['hand', 'handes'] },
  { one: 'eye', many: 'eyes', fr: 'yeux', wrong: ['eye', 'eyies'] },
  { one: 'ear', many: 'ears', fr: 'oreilles', wrong: ['ear', 'eares'] },
  { one: 'knee', many: 'knees', fr: 'genoux', wrong: ['knee', 'kneez'] },
];

/** Les vêtements : fiches « Clothes flashcards » (séries 1 et 2). */
export const CLOTHES: readonly Word[] = [
  { en: 't-shirt', fr: 'un tee-shirt', alt: ['t shirt', 'tshirt', 'tee-shirt', 'tee shirt'], typo: 't-shurt' },
  { en: 'trousers', fr: 'un pantalon', typo: 'trouser' },
  { en: 'skirt', fr: 'une jupe', typo: 'skurt' },
  { en: 'dress', fr: 'une robe', typo: 'dres' },
  { en: 'shirt', fr: 'une chemise', typo: 'shurt' },
  { en: 'jumper', fr: 'un pull', alt: ['sweater', 'pullover'], typo: 'jumpper' },
  { en: 'shorts', fr: 'un short', typo: 'short' },
  { en: 'jeans', fr: 'un jean', typo: 'jean' },
  { en: 'jacket', fr: 'une veste', typo: 'jaket' },
  { en: 'socks', fr: 'des chaussettes', typo: 'soks' },
  { en: 'shoes', fr: 'des chaussures', typo: 'shoose' },
  { en: 'coat', fr: 'un manteau', typo: 'cote' },
  { en: 'cardigan', fr: 'un gilet', typo: 'cardigane' },
  { en: 'trainers', fr: 'des baskets', alt: ['sneakers'], typo: 'traners' },
  { en: 'boots', fr: 'des bottes', typo: 'bouts' },
  { en: 'tights', fr: 'un collant', typo: 'tites' },
  { en: 'pyjamas', fr: 'un pyjama', alt: ['pajamas'], typo: 'pyjama' },
  { en: 'slippers', fr: 'des chaussons', typo: 'slipers' },
  { en: 'sandals', fr: 'des sandales', typo: 'sandales' },
];

export const FAITS: readonly Fait[] = [
  {
    id: 'programme-famille',
    sourceId: 'lve-cm-2026',
    quote: 'champ lexical de la famille, de l’environnement immédiat',
    claim: 'Les mots de la famille sont à repérer au CM1.',
  },
  {
    id: 'programme-description',
    sourceId: 'lve-cm-2026',
    quote: 'l’élève peut décrire brièvement des personnes, des objets ou des animaux familiers',
    claim: 'Décrire au CM1 : le corps, les vêtements et « have got » y servent (le programme ne les nomme pas).',
  },
  {
    id: 'programme-structures',
    sourceId: 'lve-cm-2026',
    quote: 'Reconnaitre quelques structures et formes grammaticales simples appartenant à un répertoire mémorisé.',
    claim: 'Cadre de « have got » et du génitif au CM1 (le programme ne les nomme pas).',
  },
  {
    id: 'famille-fiche-1',
    sourceId: 'bck-flashcards-family',
    quote: 'mother father grandmother grandfather',
    claim: 'mother = mère, father = père, grandmother = grand-mère, grandfather = grand-père.',
  },
  {
    id: 'famille-fiche-2',
    sourceId: 'bck-flashcards-family',
    quote: 'brother sister baby family',
    claim: 'brother = frère, sister = sœur, baby = bébé.',
  },
  {
    id: 'famille-mum-dad',
    sourceId: 'bck-song-family',
    quote: 'You can have one mum You can have one dad',
    claim: 'mum = maman, dad = papa.',
  },
  {
    id: 'famille-cousins',
    sourceId: 'bck-song-family',
    quote: 'Then there’s our cousins, aunties and uncles',
    claim: 'cousin = cousin ou cousine, auntie = tante, uncle = oncle.',
  },
  {
    id: 'famille-grands-parents',
    sourceId: 'bck-song-family',
    quote: 'Be raised by your grandma Or by your grandad',
    claim: 'grandma = mamie, grandad = papi.',
  },
  {
    id: 'famille-fils',
    sourceId: 'bc-possessive-s',
    quote: "Mohammed is my brother's son.",
    claim: 'son = fils.',
  },
  {
    id: 'famille-parents',
    sourceId: 'bc-possessive-s',
    quote: "Grandma and Grandpa are my mum's parents.",
    claim: 'parents = parents ; les parents de maman sont les grands-parents.',
  },
  {
    id: 'have-got-usage',
    sourceId: 'bck-have-got',
    quote: 'We can use have got to talk about our things, family members and parts of the body.',
    claim: 'have got dit ce qu’on a : objets, famille, parties du corps.',
  },
  {
    id: 'have-got-accord',
    sourceId: 'bck-have-got',
    quote: 'Use have for I, you, we and they. Use has for he, she and it.',
    claim: 'have avec I, you, we, they ; has avec he, she, it.',
  },
  {
    id: 'have-got-court',
    sourceId: 'bck-have-got',
    quote: "I have got long hair. = I've got long hair.",
    claim: 'Forme courte : I’ve got, he’s got.',
  },
  {
    id: 'have-got-negation',
    sourceId: 'bck-have-got',
    quote: 'For negatives, use not after have or has.',
    claim: 'Négation : haven’t got, hasn’t got.',
  },
  {
    id: 'have-got-question',
    sourceId: 'bck-have-got',
    quote: 'For questions, change the order of have or has and the person.',
    claim: 'Question : Have you got…? Has she got…?',
  },
  {
    id: 'have-got-reponse',
    sourceId: 'bck-have-got',
    quote: "Has she got any pets? No, she hasn't.",
    claim: 'Réponse courte : Yes, I have. No, she hasn’t.',
  },
  {
    id: 'corps-fiche-1',
    sourceId: 'bck-flashcards-body',
    quote: 'body head shoulders back',
    claim: 'head = tête, shoulders = épaules, back = dos.',
  },
  {
    id: 'corps-fiche-2',
    sourceId: 'bck-flashcards-body',
    quote: 'arm leg hand foot',
    claim: 'arm = bras, leg = jambe, hand = main, foot = pied.',
  },
  {
    id: 'corps-fiche-3',
    sourceId: 'bck-flashcards-body',
    quote: 'finger toes knee ankle',
    claim: 'finger = doigt, toes = orteils, knee = genou, ankle = cheville.',
  },
  {
    id: 'corps-visage',
    sourceId: 'bck-flashcards-head',
    quote: 'face eye nose mouth ear cheek chin neck hair brain teeth throat',
    claim: 'face, eye, nose, mouth, ear, chin, neck, hair, teeth : les mots du visage et de la tête.',
  },
  {
    id: 'corps-pieds',
    sourceId: 'bck-song-trousers',
    quote: "And don't wear gloves upon your feet, Pete",
    claim: 'Le pluriel de foot est feet.',
  },
  {
    id: 'corps-dent',
    sourceId: 'bck-song-tooth',
    quote: 'Tooth family Song This little baby only has two teeth',
    claim: 'tooth = dent (au pluriel : teeth, fiche « Head »).',
  },
  {
    id: 'vetements-1',
    sourceId: 'bck-flashcards-clothes-1',
    quote: 't-shirt trousers skirt dress',
    claim: 't-shirt, trousers (pantalon), skirt (jupe), dress (robe).',
  },
  {
    id: 'vetements-2',
    sourceId: 'bck-flashcards-clothes-1',
    quote: 'shirt blouse jumper shorts',
    claim: 'shirt (chemise), jumper (pull), shorts (short).',
  },
  {
    id: 'vetements-3',
    sourceId: 'bck-flashcards-clothes-1',
    quote: 'jeans jacket socks shoes',
    claim: 'jeans (jean), jacket (veste), socks (chaussettes), shoes (chaussures).',
  },
  {
    id: 'vetements-4',
    sourceId: 'bck-flashcards-clothes-2',
    quote: 'cardigan coat trainers boots',
    claim: 'cardigan (gilet), coat (manteau), trainers (baskets), boots (bottes).',
  },
  {
    id: 'vetements-5',
    sourceId: 'bck-flashcards-clothes-2',
    quote: 'tights sandals',
    claim: 'tights (collant), sandals (sandales).',
  },
  {
    id: 'vetements-6',
    sourceId: 'bck-flashcards-clothes-2',
    quote: 'pyjamas slippers',
    claim: 'pyjamas (pyjama), slippers (chaussons).',
  },
  {
    id: 'genitif-singulier',
    sourceId: 'bc-possessives-nouns',
    quote: "We add 's to singular nouns to show possession",
    claim: 'On ajoute ’s à un nom au singulier pour dire à qui est une chose.',
  },
  {
    id: 'genitif-apres-nom',
    sourceId: 'bc-possessive-s',
    quote: "Possessive 's always comes after a noun or a name.",
    claim: 'Le ’s se place après le nom ou le prénom du propriétaire.',
  },
  {
    id: 'genitif-pluriel',
    sourceId: 'bc-possessives-nouns',
    quote: "We add ' to plural nouns ending in -s",
    claim: 'Pluriel en -s : seulement l’apostrophe (my parents’ house).',
  },
  {
    id: 'genitif-irregulier',
    sourceId: 'bc-possessives-nouns',
    quote: "But we use 's with irregular plural nouns",
    claim: 'Pluriel sans s : on ajoute ’s (children’s).',
  },
  {
    id: 'genitif-deux-noms',
    sourceId: 'bc-possessive-s',
    quote: "Liam is Anne and Gary's son.",
    claim: 'Pour deux propriétaires cités, ’s après le dernier nom.',
  },
  {
    id: 'genitif-fin-s',
    sourceId: 'bc-possessive-s',
    quote: "If a name or noun ends in s, we can add either ' or 's.",
    claim: 'Nom qui finit par s : ’ ou ’s sont justes.',
  },
  {
    id: 'genitif-pas-pluriel',
    sourceId: 'bc-possessive-s',
    quote: "this doesn't show possession",
    claim: 'Un s sans apostrophe marque le pluriel, pas la possession.',
  },
];
