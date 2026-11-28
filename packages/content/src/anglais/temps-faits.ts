/**
 * Anglais CM1, « Le temps qui passe » (lot an-cm1-03) : données citées.
 * Chaque fait porte l'identifiant de sa source (registre `sources.ts`) et une citation exacte du texte consulté
 * le 24/11/2026, puis le 27/11/2026 pour la repasse (copies d'archive web.archive.org des pages et fiches PDF du British Council ; programmes
 * officiels de langues vivantes et du collège).
 */
import type { Fait } from './presentation-faits.ts';

/** Mot de vocabulaire : anglais, français, écritures acceptées et faute d'écriture typique. */
export interface Word {
  readonly en: string;
  readonly fr: string;
  /** Autres écritures anglaises acceptées. */
  readonly alt?: readonly string[];
  /** Faute d'écriture typique (piège de saisie). */
  readonly typo: string;
}

/** Fiche « Colours flashcards » (British Council). `grey` s'écrit aussi `gray` (américain). */
export const COLOURS: readonly Word[] = [
  { en: 'red', fr: 'rouge', typo: 'read' },
  { en: 'yellow', fr: 'jaune', typo: 'yelow' },
  { en: 'blue', fr: 'bleu', typo: 'bleu' },
  { en: 'green', fr: 'vert', typo: 'gren' },
  { en: 'pink', fr: 'rose', typo: 'pinck' },
  { en: 'purple', fr: 'violet', typo: 'purpel' },
  { en: 'orange', fr: 'orange', typo: 'oranje' },
  { en: 'brown', fr: 'marron', typo: 'broun' },
  { en: 'black', fr: 'noir', typo: 'blak' },
  { en: 'white', fr: 'blanc', typo: 'withe' },
  { en: 'grey', fr: 'gris', alt: ['gray'], typo: 'gry' },
];

/** Les jours, dans l'ordre (du lundi au dimanche). */
export const DAYS: readonly Word[] = [
  { en: 'Monday', fr: 'lundi', typo: 'Munday' },
  { en: 'Tuesday', fr: 'mardi', typo: 'Tusday' },
  { en: 'Wednesday', fr: 'mercredi', typo: 'Wensday' },
  { en: 'Thursday', fr: 'jeudi', typo: 'Thusday' },
  { en: 'Friday', fr: 'vendredi', typo: 'Fryday' },
  { en: 'Saturday', fr: 'samedi', typo: 'Saterday' },
  { en: 'Sunday', fr: 'dimanche', typo: 'Sonday' },
];

/** Les mois, dans l'ordre. */
export const MONTHS: readonly Word[] = [
  { en: 'January', fr: 'janvier', typo: 'Janary' },
  { en: 'February', fr: 'février', typo: 'Febuary' },
  { en: 'March', fr: 'mars', typo: 'Mars' },
  { en: 'April', fr: 'avril', typo: 'Avril' },
  { en: 'May', fr: 'mai', typo: 'Mai' },
  { en: 'June', fr: 'juin', typo: 'Juin' },
  { en: 'July', fr: 'juillet', typo: 'Juli' },
  { en: 'August', fr: 'août', typo: 'Agust' },
  { en: 'September', fr: 'septembre', typo: 'Septembre' },
  { en: 'October', fr: 'octobre', typo: 'Octobre' },
  { en: 'November', fr: 'novembre', typo: 'Novembre' },
  { en: 'December', fr: 'décembre', typo: 'Decembre' },
];

/** Les saisons, dans l'ordre du poème « Spring to winter ». */
export const SEASONS: readonly Word[] = [
  { en: 'spring', fr: 'le printemps', typo: 'sprint' },
  { en: 'summer', fr: 'l’été', typo: 'sumer' },
  { en: 'autumn', fr: 'l’automne', alt: ['fall'], typo: 'autum' },
  { en: 'winter', fr: 'l’hiver', typo: 'winther' },
];

/** Météo : fiche « Weather flashcards » et texte « The weather where I live » (British Council). */
export const WEATHER: readonly Word[] = [
  { en: 'sunny', fr: 'ensoleillé', typo: 'suny' },
  { en: 'rainy', fr: 'pluvieux', alt: ['raining'], typo: 'rany' },
  { en: 'cloudy', fr: 'nuageux', typo: 'cloudly' },
  { en: 'windy', fr: 'venteux', typo: 'windi' },
  { en: 'snowy', fr: 'neigeux', alt: ['snowing'], typo: 'snowey' },
  { en: 'stormy', fr: 'orageux', typo: 'stormi' },
  { en: 'foggy', fr: 'avec du brouillard', typo: 'fogy' },
  { en: 'hot', fr: 'chaud', alt: ['warm'], typo: 'hote' },
  { en: 'cold', fr: 'froid', typo: 'colde' },
];

/** Dates tirées des textes du British Council : jour du mois et mois. */
export interface SourcedDate {
  readonly day: number;
  readonly month: string;
}
export const DATES: readonly SourcedDate[] = [
  { day: 14, month: 'March' },
  { day: 28, month: 'April' },
  { day: 15, month: 'May' },
  { day: 19, month: 'June' },
  { day: 5, month: 'July' },
  { day: 30, month: 'July' },
  { day: 19, month: 'October' },
  { day: 31, month: 'October' },
  { day: 1, month: 'November' },
];

export const FAITS: readonly Fait[] = [
  {
    id: 'programme-date',
    sourceId: 'lve-cm-2026',
    quote: 'Situer dans le temps : exprimer une date ou des repères temporels simples.',
    claim: 'Au CM1, l’élève dit une date et des repères de temps simples.',
  },
  {
    id: 'programme-lexique',
    sourceId: 'lve-cm-2026',
    quote:
      'Reconnaitre quelques mots simples du champ lexical de l’environnement proche (famille, école, activités de loisirs, météo,',
    claim: 'La météo fait partie des mots de l’environnement proche à reconnaître au CM1.',
  },
  {
    id: 'couleurs-1',
    sourceId: 'bck-flashcards-colours',
    quote: 'red yellow blue green',
    claim: 'red = rouge, yellow = jaune, blue = bleu, green = vert.',
  },
  {
    id: 'couleurs-2',
    sourceId: 'bck-flashcards-colours',
    quote: 'pink purple orange brown',
    claim: 'pink = rose, purple = violet, orange = orange, brown = marron.',
  },
  {
    id: 'couleurs-3',
    sourceId: 'bck-flashcards-colours',
    quote: 'black white grey gold',
    claim: 'black = noir, white = blanc, grey = gris.',
  },
  {
    id: 'adjectif-invariable',
    sourceId: 'bck-adjectives',
    quote: "We don't add s to the adjective when it's plural.",
    claim: 'L’adjectif de couleur ne prend pas de s au pluriel.',
  },
  {
    id: 'adjectif-avant-nom',
    sourceId: 'bck-adjectives',
    quote: "We've got three black cats.",
    claim: 'La couleur se place avant le nom : three black cats.',
  },
  {
    id: 'taille-couleur',
    sourceId: 'bck-adjectives',
    quote: 'Put size adjectives before colour adjectives.',
    claim: 'La taille se place avant la couleur : a big blue ball.',
  },
  {
    id: 'jours-semaine',
    sourceId: 'bck-lunch-menu',
    quote: 'Week beginning: Monday 14 March',
    claim: 'Le menu va de Monday à Friday, et la semaine commence Monday.',
  },
  {
    id: 'jours-menu',
    sourceId: 'bck-lunch-menu',
    quote: 'Tuesday green salad spaghetti bolognaise yoghurt Wednesday vegetable soup',
    claim: 'Après Tuesday vient Wednesday ; puis Thursday et Friday.',
  },
  {
    id: 'samedi',
    sourceId: 'bck-prepositions-time',
    quote: 'He goes to the park on Saturdays.',
    claim: 'Saturday = samedi.',
  },
  {
    id: 'dimanche',
    sourceId: 'anglais-college-2025',
    quote: 'we will go home. I’d like to stay until Sunday.',
    claim: 'Sunday = dimanche.',
  },
  {
    id: 'mois',
    sourceId: 'bck-song-year',
    quote:
      "January, February, March April, May and June July and August, goodbye summer Autumn's coming soon. Hey September, October, November It's December",
    claim: 'Les douze mois dans l’ordre.',
  },
  {
    id: 'saisons-poeme',
    sourceId: 'bck-spring-winter',
    quote: 'These are things that tell us when Spring’s here again.',
    claim: 'spring = le printemps ; le poème décrit les saisons dans l’ordre spring, summer, autumn, winter.',
  },
  {
    id: 'saisons-ete',
    sourceId: 'bck-spring-winter',
    quote: 'Children swimming in the sea Ice cream in the hot bright sun',
    claim: 'En été (summer), on se baigne sous un soleil chaud.',
  },
  {
    id: 'saisons-automne',
    sourceId: 'bck-spring-winter',
    quote: 'Leaves are falling on the ground',
    claim: 'En automne (autumn), les feuilles tombent.',
  },
  {
    id: 'saisons-hiver',
    sourceId: 'bck-spring-winter',
    quote: 'All the children wish for snow',
    claim: 'En hiver (winter), on espère la neige.',
  },
  {
    id: 'saisons-fall',
    sourceId: 'bc-british-american',
    quote: 'autumn = fall',
    claim: 'En anglais américain, autumn (l’automne) se dit aussi fall.',
  },
  {
    id: 'preposition-saisons',
    sourceId: 'bc-prepositions-time',
    quote: 'seasons in (the) spring/summer/autumn/winter',
    claim: 'Avec une saison, on emploie in.',
  },
  {
    id: 'preposition-mois-jours',
    sourceId: 'bck-prepositions-time',
    quote: 'Use in before months and years, on before days and dates, and at before times.',
    claim: 'in devant un mois, on devant un jour ou une date, at devant une heure.',
  },
  {
    id: 'date-ecrite',
    sourceId: 'bc-prepositions-time',
    quote: "It's his birthday on 19 October.",
    claim: 'La date s’écrit : le jour (en chiffres) puis le mois, avec on.',
  },
  {
    id: 'date-ordinal',
    sourceId: 'bc-prepositions-time',
    quote: 'dates on 30 July on the second of August',
    claim: '« 2 August » peut se dire « the second of August ».',
  },
  {
    id: 'date-ordinaux-programme',
    sourceId: 'anglais-college-2025',
    quote: 'indiquer la date du jour en utilisant les ordinaux',
    claim: 'La date se dit avec les nombres ordinaux (repère officiel).',
  },
  {
    id: 'date-fete',
    sourceId: 'bck-halloween-invitation',
    quote: 'Party starts: Friday 31 October at 5 p.m.',
    claim: 'Une date complète : jour de la semaine, numéro, mois.',
  },
  {
    id: 'date-sport',
    sourceId: 'bck-sports-day',
    quote: 'Date: 28 April',
    claim: 'Une date s’écrit numéro puis mois (28 April, 15 May, 19 June, 5 July).',
  },
  {
    id: 'meteo-cartes-1',
    sourceId: 'bck-flashcards-weather',
    quote: 'rainy cloudy windy snowy',
    claim: 'rainy = pluvieux, cloudy = nuageux, windy = venteux, snowy = neigeux.',
  },
  {
    id: 'meteo-cartes-2',
    sourceId: 'bck-flashcards-weather',
    quote: 'stormy foggy freezing',
    claim: 'stormy = orageux, foggy = avec du brouillard.',
  },
  {
    id: 'meteo-chaud-froid',
    sourceId: 'bck-weather-live',
    quote: "Sometimes it's cloudy or rainy here, but it's never cold.",
    claim: 'cold = froid ; on dit it’s + adjectif de météo.',
  },
  {
    id: 'meteo-phrase',
    sourceId: 'bck-weather-live',
    quote: "Today it's hot and sunny in Brazil.",
    claim: 'Pour dire le temps : It’s hot and sunny.',
  },
  {
    id: 'meteo-doux',
    sourceId: 'bc-prepositions-time',
    quote: 'In spring, the weather is warmer.',
    claim: 'warm qualifie le temps (« warmer » : plus chaud) ; la saisie « warm » est acceptée.',
  },
  {
    id: 'meteo-question',
    sourceId: 'bck-weather-your-turn',
    quote: "What's the weather like today where you are?",
    claim: 'La question sur le temps : What’s the weather like today?',
  },
];
