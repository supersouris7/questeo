/**
 * Anglais CM1, « Se présenter et saluer » (lot an-cm1-01) : données citées.
 * Chaque fait porte l'identifiant de sa source (registre `sources.ts`) et une citation exacte du texte consulté
 * le 24/11/2026 et le 27/11/2026 (copies d'archive web.archive.org des pages du British Council ; programme de langues
 * vivantes, arrêté du 26 février 2026 : cycle 2 pour des exemples d'anglais, cours moyen pour le programme).
 */

export interface Fait {
  readonly id: string;
  readonly sourceId: string;
  /** Citation exacte du texte source. */
  readonly quote: string;
  /** Ce que le fait établit pour la notion. */
  readonly claim: string;
}

export type Role = 'saluer' | 'rencontre' | 'repondre' | 'conge';

export interface Phrase {
  readonly en: string;
  readonly fr: string;
  /** Moment de l'échange, tel qu'on le dit à l'élève dans l'explication. */
  readonly moment: string;
  /** Écritures acceptées en saisie (sans ponctuation finale : voir `punctuated`). */
  readonly accepted: readonly string[];
}

/** Saisies acceptées : avec ou sans point ou point d'exclamation (collé ou précédé d'une espace). */
export const punctuated = (forms: readonly string[]): string[] => forms.flatMap((f) => [f, `${f}.`, `${f}!`, `${f} !`]);

export const PHRASES: Readonly<Record<Role, Phrase>> = {
  saluer: {
    en: 'Hello!',
    fr: 'bonjour',
    moment: 'quelqu’un arrive et dit bonjour',
    accepted: ['Hello', 'Hi', 'Hey', 'Hello there', 'Hi there'],
  },
  rencontre: {
    en: 'Nice to meet you.',
    fr: 'enchanté(e)',
    moment: 'on rencontre une nouvelle personne',
    accepted: [
      'Nice to meet you',
      'It’s nice to meet you',
      'Pleased to meet you',
      'I’m pleased to meet you',
      'Very nice to meet you',
      'Glad to meet you',
      'Hello, nice to meet you',
      'Hi, nice to meet you',
    ],
  },
  repondre: {
    en: 'You too.',
    fr: 'toi aussi',
    moment: 'on répond à la phrase de rencontre',
    accepted: ['You too', 'And you', 'Nice to meet you too', 'Nice to meet you, too', 'Pleased to meet you too'],
  },
  conge: {
    en: 'Bye for now!',
    fr: 'au revoir',
    moment: 'quelqu’un s’en va',
    accepted: [
      'Bye for now',
      'Bye',
      'Bye bye',
      'Bye-bye',
      'Goodbye',
      'Good bye',
      'Good-bye',
      'Goodbye for now',
      'See you tomorrow',
      'See you',
      'See you soon',
      'See you later',
    ],
  },
};

export const ROLES: readonly Role[] = ['saluer', 'rencontre', 'repondre', 'conge'];

export interface Situation {
  readonly role: Role;
  /** Ce que vit l'élève (français, tutoiement, phrases courtes). */
  readonly text: string;
  /** Phrase attendue quand on la choisit (« Hello! » ou « Hi! » pour saluer). */
  readonly en: string;
  /** Écritures correctes propres à ce moment (« Good morning » le matin). */
  readonly extra?: readonly string[];
}

export const SITUATIONS: readonly Situation[] = [
  {
    role: 'saluer',
    text: 'Tu arrives en classe et tu vois un copain. Dis-lui bonjour.',
    en: 'Hello!',
    extra: ['Good morning', 'Good afternoon'],
  },
  {
    role: 'saluer',
    text: 'Le matin, tu retrouves une copine dans la cour. Dis-lui bonjour.',
    en: 'Hi!',
    extra: ['Good morning'],
  },
  {
    role: 'saluer',
    text: 'La visio commence : dis bonjour à ta correspondante anglaise.',
    en: 'Hello!',
    extra: ['Good morning', 'Good afternoon'],
  },
  {
    role: 'rencontre',
    text: 'On te présente un nouvel élève. Dis que cette rencontre te fait plaisir.',
    en: 'Nice to meet you.',
  },
  {
    role: 'rencontre',
    text: 'Tu vois ton nouveau voisin pour la première fois. Dis que tu as plaisir à le rencontrer.',
    en: 'Nice to meet you.',
  },
  { role: 'repondre', text: 'Un nouveau voisin te dit « Nice to meet you ». Réponds « toi aussi ».', en: 'You too.' },
  { role: 'repondre', text: 'En visio, Yuna te dit « Nice to meet you ». Réponds « toi aussi ».', en: 'You too.' },
  { role: 'conge', text: 'Tu quittes le parc. Dis au revoir à ton copain.', en: 'Bye for now!' },
  { role: 'conge', text: 'La visio se termine : dis au revoir à la classe anglaise.', en: 'Bye for now!' },
  { role: 'conge', text: 'C’est l’heure de rentrer : dis au revoir à ta copine.', en: 'Bye for now!' },
];

export const QUESTIONS = {
  name: { en: 'What’s your name?', asks: 'le prénom' },
  age: { en: 'How old are you?', asks: 'l’âge' },
  live: { en: 'Where do you live?', asks: 'le lieu où on habite' },
} as const;

/** Prénoms des personnages de la vidéo du British Council (aucun prénom d'élève réel). */
export const NAMES = ['Ana', 'Emir', 'Yuna', 'Vanya', 'Paul'] as const;

/** Villes citées dans la transcription « Talking about where you’re from ». */
export const CITIES = ['Glasgow', 'Istanbul', 'London', 'Cambridge'] as const;

/** Âges possibles d'un élève de cycle 3, avec un nombre cité par les cartes du British Council (6 à 12). */
export const AGES = [7, 8, 9, 10, 11, 12] as const;

/** Mots-nombres cités par le British Council (cartes 1-12, 13-24, fiche 10-100). */
const WORDS: Readonly<Record<number, string>> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
  21: 'twenty-one',
  22: 'twenty-two',
  23: 'twenty-three',
  24: 'twenty-four',
  30: 'thirty',
  40: 'forty',
  50: 'fifty',
  60: 'sixty',
  70: 'seventy',
  80: 'eighty',
  90: 'ninety',
};

/**
 * Mot d'un nombre : cité tel quel jusqu'à 24 et pour les dizaines ; 25 à 29 et 31 suivent la même règle
 * que « twenty-one » à « twenty-four » (dizaine, tiret, unité).
 */
export function wordOf(n: number): string | undefined {
  const cited = WORDS[n];
  if (cited) return cited;
  if (n >= 25 && n <= 29) return `twenty-${WORDS[n - 20]}`;
  if (n === 31) return 'thirty-one';
  return undefined;
}

/** Variantes d'écriture d'un mot-nombre composé (tiret ou espace). */
export const spellings = (word: string): string[] => (word.includes('-') ? [word, word.replace('-', ' ')] : [word]);

const unitsFact = (sourceId: string, from: number, to: number, quote: string): Fait[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => ({
    id: `nombre-${n}`,
    sourceId,
    quote,
    claim: `${n} s’écrit « ${WORDS[n]} »`,
  }));

export const FAITS: readonly Fait[] = [
  {
    id: 'programme-contact-social',
    sourceId: 'lve-cm-2026',
    quote: 'Établir un contact (saluer, se présenter, présenter quelqu’un, etc.)',
    claim: 'Saluer et se présenter font partie du programme du CM1 (expression orale en interaction).',
  },
  {
    id: 'conge-good-bye',
    sourceId: 'lve-c2-2026',
    quote: 'Thank you for everything! Good bye!',
    claim: '« Good bye » sert aussi à prendre congé.',
  },
  {
    id: 'conge-see-you-soon',
    sourceId: 'lve-c2-2026',
    quote: 'See you soon!',
    claim: '« See you soon » sert aussi à prendre congé.',
  },
  {
    id: 'my-name-is',
    sourceId: 'lve-c2-2026',
    quote: 'My name is/My name’s Billy.',
    claim: 'On répond aussi avec « My name is » ou « My name’s » + prénom.',
  },
  {
    id: 'age-years-old',
    sourceId: 'lve-c2-2026',
    quote: 'I’m 6 years old.',
    claim: 'On peut ajouter « years old » après l’âge.',
  },
  {
    id: 'where-do-you-live',
    sourceId: 'lve-c2-2026',
    quote: 'I live in Boston.',
    claim: 'À « Where do you live? », on répond « I live in » + ville.',
  },
  {
    id: 'saluer-hello-hi',
    sourceId: 'bc-meeting-new-people',
    quote: 'Vanya: Hi. Emir: Hello.',
    claim: '« Hello » et « Hi » servent à saluer.',
  },
  {
    id: 'rencontre-nice-to-meet-you',
    sourceId: 'bc-meeting-new-people',
    quote: "Oh, hi, I'm Yuna. Nice to meet you.",
    claim: '« Nice to meet you » se dit en rencontrant quelqu’un.',
  },
  {
    id: 'repondre-you-too',
    sourceId: 'bc-meeting-new-people',
    quote: 'Nice to meet you. Emir: You too.',
    claim: '« You too » répond à « Nice to meet you ».',
  },
  {
    id: 'conge-bye-for-now',
    sourceId: 'bc-meeting-new-people',
    quote: 'Try and use some of these phrases the next time you meet new people in English. Bye for now!',
    claim: '« Bye for now! » se dit pour prendre congé.',
  },
  {
    id: 'je-suis-im',
    sourceId: 'bc-meeting-new-people',
    quote: "Hi, I'm Yuna.",
    claim: 'On se présente avec « I’m » + prénom.',
  },
  {
    id: 'mot-interrogatif-avant-verbe',
    sourceId: 'bc-question-forms',
    quote: 'If there is a question word (why, what, where, how, etc.), it goes before the verb.',
    claim: 'Le mot interrogatif (what, where, how) ouvre la question.',
  },
  {
    id: 'contraction-is',
    sourceId: 'bc-verb-be',
    quote: "He/She/It is, He/She/It's",
    claim: '« ’s » est la contraction de « is » (What’s = What is).',
  },
  {
    id: 'possessif-your',
    sourceId: 'bc-possessives-adjectives',
    quote: 'you you your',
    claim: 'Le possessif de « you » est « your » (« What’s your name? »).',
  },
  {
    id: 'how-old',
    sourceId: 'bc-possessives-adjectives',
    quote: 'How old is your sister',
    claim: 'On demande l’âge avec « How old ».',
  },
  {
    id: 'be-am-im',
    sourceId: 'bc-verb-be',
    quote: "I am, I'm You are, You're",
    claim: 'On donne son âge avec be : « I’m nine ».',
  },
  {
    id: 'where-do-you-work',
    sourceId: 'bc-question-forms',
    quote: 'You work at home. Do you work at home? Where do you work ?',
    claim: '« Where do you … ? » : mot interrogatif + do + you + verbe (work → live).',
  },
  {
    id: 'do-auxiliaire',
    sourceId: 'bc-question-forms',
    quote: 'we use the auxiliary verb do / does in the question',
    claim: 'Au présent simple, la question prend « do ».',
  },
  {
    id: 'live-in',
    sourceId: 'bc-where-from',
    quote: 'I live in Glasgow now.',
    claim: 'On dit où on habite avec « I live in » + ville.',
  },
  {
    id: 'where-from',
    sourceId: 'bc-where-from',
    quote: 'Where are you from?',
    claim: '« Where are you from? » demande d’où on vient, pas où on habite.',
  },
  {
    id: 'from-city',
    sourceId: 'bc-where-from',
    quote: "I'm from Istanbul.",
    claim: '« I’m from » + ville : d’où l’on vient.',
  },
  ...unitsFact('bck-flashcards-1-12', 1, 12, 'cartes « Numbers flashcards 1-12 » : one … twelve'),
  ...unitsFact('bck-flashcards-13-24', 13, 24, 'cartes « Numbers flashcards 13-24 » : thirteen … twenty-four'),
  {
    id: 'nombre-30',
    sourceId: 'bck-worksheet-10-100',
    quote: 'twenty thirty forty fifty',
    claim: '30 s’écrit « thirty » ; les dizaines : twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety.',
  },
  {
    id: 'nombres-25-31',
    sourceId: 'bck-flashcards-13-24',
    quote: 'twenty-one twenty-two twenty-three twenty-four',
    claim: '25 à 29 et 31 suivent la même règle : dizaine, tiret, unité (twenty-five, thirty-one).',
  },
];
