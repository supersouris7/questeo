import type { Chapter, QuestionDraft, Skill } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import type { TextTrap } from './outils-5e.ts';
import { COLOURS, DATES, DAYS, MONTHS, SEASONS, WEATHER, type SourcedDate, type Word } from './temps-faits.ts';

/**
 * Anglais CM1 — « Le temps qui passe » (lot an-cm1-03, repris par rp-an-cm1-03, docs/adr/0034). Programme : langues
 * vivantes, cours moyen, arrêté du 26 février 2026, en vigueur au CM1 à la rentrée 2026 (« exprimer une date ou des
 * repères temporels simples » ; mots de la météo). Mots et phrases : British Council et programmes officiels (voir
 * temps-faits.ts : chaque fait y porte sa source et sa citation).
 */
const PROGRAMME = 'Programme de langues vivantes, cours moyen (arrêté du 26 février 2026, BO n° 12), CM1';
const source = (detail: string) =>
  `${PROGRAMME} — situer dans le temps (date, repères temporels) ; mots de l’environnement proche. ${detail}`;

export const at = <T>(list: readonly T[], i: number): T => {
  const x = list[i];
  if (x === undefined) throw new Error(`indice ${i} hors liste`);
  return x;
};
/** « de » élidé devant un prénom qui commence par une voyelle : d’Ana, d’Emir. */
export const de = (name: string) => (/^[AEIOU]/.test(name) ? `d’${name}` : `de ${name}`);
export const some = <T>(rng: Rng, list: readonly T[], n: number): T[] => rng.shuffle(list).slice(0, n);
export const others = <T>(rng: Rng, list: readonly T[], not: T, n: number): T[] =>
  some(
    rng,
    list.filter((x) => x !== not),
    n,
  );
/** Mélange jusqu'à ce que l'ordre présenté ne soit plus l'ordre juste. */
export function shuffledOther<T>(rng: Rng, list: readonly T[]): T[] {
  let out = rng.shuffle(list);
  while (out.every((x, i) => x === list[i])) out = rng.shuffle(list);
  return out;
}
const accepted = (w: Word): string[] => [w.en, ...(w.alt ?? [])];
/** Saisies acceptées avec ou sans point final. */
const dotted = (forms: readonly string[]): string[] => [...new Set(forms)].flatMap((f) => [f, `${f}.`]);
/** Une saison se traduit avec ou sans article : « spring », « the spring » (et « the fall »). */
const withThe = (w: Word): string[] => accepted(w).flatMap((s) => [s, `the ${s}`]);

/** Saisies acceptées avec ou sans point ou point d’exclamation (collé ou précédé d’une espace). */
const exclaimed = (forms: readonly string[]): string[] =>
  [...new Set(forms)].flatMap((f) => [f, `${f}.`, `${f}!`, `${f} !`]);
const exclaimedTraps = (traps: readonly TextTrap[]) =>
  traps.flatMap((t) => exclaimed([t.text]).map((text) => ({ text, why: t.why })));

// ——— Questions communes au vocabulaire ———

/** Explications propres à un chapitre ; sans elles, les questions communes gardent leurs explications d’origine. */
export interface Say {
  readonly choose: (w: Word) => string[];
  readonly understand: (w: Word) => string[];
  readonly match: (rows: readonly Word[]) => string[];
  readonly write: (w: Word) => string[];
  /** Indice du niveau 2, quand le chapitre en a un plus précis. */
  readonly hint?: string;
}

/** Niveau 1 : le mot anglais parmi 3. */
export function pickEnglish(
  rng: Rng,
  list: readonly Word[],
  kind: string,
  hint: string,
  say?: Pick<Say, 'choose'>,
): QuestionDraft {
  const w = rng.pick(list);
  const { answer, traps } = choice(
    rng,
    w.en,
    others(rng, list, w, 2).map((o) => ({ label: o.en, why: `« ${o.en} » veut dire « ${o.fr} ».` })),
  );
  return {
    prompt: `Comment dit-on « ${w.fr} » en anglais (${kind}) ?`,
    answer,
    traps,
    hint,
    steps: say?.choose(w) ?? [`On cherche le mot anglais pour « ${w.fr} ».`, `Réponse : **${w.en}**`],
  };
}

/** Niveau 2 : comprendre un mot (4 choix) ou relier 3 paires. */
export function understand(
  rng: Rng,
  list: readonly Word[],
  kind: string,
  say?: Pick<Say, 'understand' | 'match' | 'hint'>,
): QuestionDraft {
  if (rng.int(0, 1) === 0) {
    const w = rng.pick(list);
    const { answer, traps } = choice(
      rng,
      w.fr,
      others(rng, list, w, 3).map((o) => ({ label: o.fr, why: `« ${o.fr} » se dit « ${o.en} » en anglais.` })),
    );
    return {
      prompt: `Que veut dire « ${w.en} » (${kind}) ?`,
      answer,
      traps,
      hint: say?.hint ?? 'Dis le mot à voix haute. Dans quelle chanson ou quelle phrase l’as-tu entendu ?',
      steps: say?.understand(w) ?? [`On lit le mot anglais « ${w.en} ».`, `Il veut dire **${w.fr}**.`],
    };
  }
  return pairs(rng, list, 3, say);
}

export function pairs(rng: Rng, list: readonly Word[], n: number, say?: Pick<Say, 'match' | 'hint'>): QuestionDraft {
  const rows = some(rng, list, n);
  const left = rows.map((w) => w.en);
  const right = shuffledOther(
    rng,
    rows.map((w) => w.fr),
  );
  return {
    prompt: `Associe chaque mot anglais à son sens : ${left.join(', ')}.`,
    answer: { kind: 'match', left, right, pairs: rows.map((w) => right.indexOf(w.fr)) },
    hint: say?.hint ?? 'Commence par le mot que tu connais le mieux. Les autres seront plus faciles.',
    steps: say?.match(rows) ?? [
      'On relie chaque mot anglais à son sens.',
      ...rows.map((w) => `${w.en} → ${w.fr}`),
      `Réponse : **${rows.map((w) => `${w.en} = ${w.fr}`).join(' ; ')}**`,
    ],
  };
}

/** Niveau 3 : écrire le mot. */
export function write(
  rng: Rng,
  list: readonly Word[],
  kind: string,
  say?: Pick<Say, 'write'>,
  forms: (w: Word) => string[] = accepted,
): QuestionDraft {
  const w = rng.pick(list);
  const other = at(others(rng, list, w, 1), 0);
  return {
    prompt: `Écris en anglais (${kind}) : « ${w.fr} »`,
    answer: { kind: 'text', accepted: forms(w) },
    traps: [
      { text: w.typo, why: `Presque ! Regarde bien les lettres : le mot s’écrit « ${w.en} ».` },
      { text: other.en, why: `« ${other.en} » veut dire « ${other.fr} ».` },
    ],
    hint: `Le mot commence par « ${w.en.slice(0, 1)} » et compte ${w.en.length} lettres.`,
    steps: say?.write(w) ?? [`On cherche le mot anglais pour « ${w.fr} ».`, `Réponse : **${w.en}**`],
  };
}

/** Explications guidées du chapitre : `think` aide à retrouver le mot, `check` à relire ce qu’on écrit. */
const guided = (think: string, check: string): Say => ({
  choose: (w) => [`Lis le mot français : « ${w.fr} ».`, think, `Choisis **${w.en}**.`],
  understand: (w) => [
    `Lis le mot anglais : « ${w.en} ».`,
    'Dis-le tout bas, puis cherche son sens en français.',
    `Choisis **${w.fr}**.`,
  ],
  match: (rows) => [
    'Commence par le mot anglais que tu connais le mieux.',
    'Relie ensuite les autres mots, un par un.',
    `Réponds : **${rows.map((w) => `${w.en} = ${w.fr}`).join(' ; ')}**.`,
  ],
  write: (w) => [`Lis le mot français : « ${w.fr} ».`, think, check, `Écris **${w.en}**.`],
});
const CAPITAL = 'Mets une **majuscule** au début du mot.';
const LETTERS = 'Vérifie chaque lettre avant de valider.';
const SAY = {
  colours: guided('Pense à un objet de cette couleur, puis cherche son nom anglais.', LETTERS),
  days: guided('Pense à la liste des jours, dans l’ordre.', CAPITAL),
  months: guided('Compare avec le français : souvent, le début se ressemble.', CAPITAL),
};

/** Saisons : le repère est la liste du mémo, dans le même ordre en anglais et en français. */
const SEASONS_EN = 'spring, summer, autumn, winter';
const SEASONS_FR = 'printemps, été, automne, hiver';
const SEASONS_SAY: Say = {
  ...guided('', LETTERS),
  choose: (w) => [
    `Lis le mot français : « ${w.fr} ».`,
    `Retrouve sa place dans : ${SEASONS_FR}.`,
    `Prends le mot à la même place : ${SEASONS_EN}.`,
    `Choisis **${w.en}**.`,
  ],
  understand: (w) => [
    `Lis le mot anglais : « ${w.en} ».`,
    `Retrouve sa place dans : ${SEASONS_EN}.`,
    `Prends la même place dans : ${SEASONS_FR}.`,
    `Choisis **${w.fr}**.`,
  ],
  match: (rows) => [
    `Regarde l’ordre en anglais : ${SEASONS_EN}.`,
    `Associe les mêmes places en français : ${SEASONS_FR}.`,
    `Réponds : **${rows.map((w) => `${w.en} = ${w.fr}`).join(' ; ')}**.`,
  ],
  write: (w) => [
    `Lis le mot français : « ${w.fr} ».`,
    `Retrouve sa place dans : ${SEASONS_FR}.`,
    `Prends le mot à la même place : ${SEASONS_EN}.`,
    `Écris **${w.en}**.`,
  ],
};

/** Temps dit en français : une phrase naturelle pour chaque mot de la météo. */
const SAID_FR: Readonly<Record<string, string>> = {
  sunny: 'il y a du soleil',
  rainy: 'il pleut',
  cloudy: 'il y a des nuages',
  windy: 'il y a du vent',
  snowy: 'il neige',
  stormy: 'il y a de l’orage',
  foggy: 'il y a du brouillard',
  hot: 'il fait chaud',
  cold: 'il fait froid',
};
const said = (w: Word): string => SAID_FR[w.en] ?? w.fr;
/** Météo : la bulle affiche elle-même la phrase d’exemple avec « it’s ». */
const example = (w: Word) => `Lis l’exemple « It’s ${w.en} » : ${said(w)}.`;
const WEATHER_SAY: Say = {
  ...guided('', LETTERS),
  choose: (w) => [`Lis le mot français : « ${w.fr} ».`, example(w), `Choisis **${w.en}**.`],
  understand: (w) => [`Lis le mot anglais : « ${w.en} ».`, example(w), `Choisis **${w.fr}**.`],
  write: (w) => [`Lis le mot français : « ${w.fr} ».`, example(w), LETTERS, `Écris **${w.en}**.`],
  hint: 'Pense aux mots du mémo. Élimine d’abord les sens que tu connais déjà.',
};

/** Mot suivant ou précédent dans un cycle (jours, mois, saisons). */
function neighbour(
  rng: Rng,
  list: readonly Word[],
  unit: string,
  forms: (w: Word) => string[] = accepted,
  shown?: string,
): QuestionDraft {
  const i = rng.int(0, list.length - 1);
  const next = rng.int(0, 1) === 0;
  const w = at(list, i);
  const good = at(list, (i + (next ? 1 : list.length - 1)) % list.length);
  const bad = at(list, (i + (next ? list.length - 1 : 1)) % list.length);
  const two = at(list, (i + (next ? 2 : list.length - 2)) % list.length);
  const where = next ? 'juste après' : 'juste avant';
  return {
    prompt: `Écris en anglais ${unit} qui vient ${where} « ${w.en} ».`,
    answer: { kind: 'text', accepted: forms(good) },
    traps: [
      { text: bad.en, why: `Attention au sens : « ${bad.en} » vient ${next ? 'avant' : 'après'} « ${w.en} ».` },
      { text: good.typo, why: `Le bon choix, mais regarde les lettres : « ${good.en} ».` },
      ...(two.en !== bad.en && two.en !== good.en
        ? [{ text: two.en, why: `Tu as sauté un pas : « ${two.en} » est deux places plus loin.` }]
        : []),
    ],
    hint: 'Récite la liste dans l’ordre, du début, et arrête-toi sur le mot donné.',
    steps: [
      shown
        ? `Repère « ${w.en} » (${w.fr}) dans : ${shown}.`
        : `Repère « ${w.en} » dans la liste : il veut dire « ${w.fr} ».`,
      next
        ? 'Avance d’un mot. Après le dernier, reviens au premier.'
        : 'Recule d’un mot. Avant le premier, reprends le dernier.',
      `Écris **${good.en}** (${good.fr}).`,
    ],
  };
}

/**
 * Remettre des mots d'un cycle dans l'ordre : suite continue, sans passer par la fin de liste, sauf si `cue.cycle`
 * (la suite peut alors partir de n'importe quel mot et reprendre au début).
 */
function ordering(
  rng: Rng,
  list: readonly Word[],
  n: number,
  unit: string,
  cue?: { readonly hint: (first: string) => string; readonly step: string; readonly cycle: boolean },
): QuestionDraft {
  const start = rng.int(0, cue?.cycle ? list.length - 1 : list.length - n);
  const right = Array.from({ length: n }, (_, i) => at(list, (start + i) % list.length).en);
  const items = shuffledOther(rng, right);
  return {
    prompt: `Remets ${unit} dans l’ordre, à partir de « ${at(right, 0)} » : ${items.join(', ')}.`,
    answer: { kind: 'order', items, correct: right.map((x) => items.indexOf(x)) },
    hint: cue?.hint(at(right, 0)) ?? 'Récite la liste dans ta tête, en commençant par le premier mot donné.',
    steps: [
      `Place d’abord « ${at(right, 0)} » : c’est le départ.`,
      cue?.step ?? 'Cherche le mot qui vient juste après, puis continue.',
      `Réponds : **${right.join(', ')}**.`,
    ],
  };
}

// ——— 1. Les couleurs ———
interface Thing {
  readonly one: string;
  readonly many: string;
  readonly frOne: string;
  readonly fr: string;
  readonly feminine?: true;
}
const THINGS: readonly Thing[] = [
  { one: 'cat', many: 'cats', frOne: 'chat', fr: 'chats' },
  { one: 'bag', many: 'bags', frOne: 'sac', fr: 'sacs' },
  { one: 'ball', many: 'balls', frOne: 'ballon', fr: 'ballons' },
  { one: 'car', many: 'cars', frOne: 'voiture', fr: 'voitures', feminine: true },
  { one: 'bird', many: 'birds', frOne: 'oiseau', fr: 'oiseaux' },
];
/** Objets du niveau 5 (on peut en avoir un chacun). */
const OWNED = THINGS.filter((t) => ['bag', 'ball', 'car'].includes(t.one)).concat({
  one: 'bike',
  many: 'bikes',
  frOne: 'vélo',
  fr: 'vélos',
});
const PLURAL_FR: Readonly<Record<string, readonly [string, string]>> = {
  red: ['rouges', 'rouges'],
  blue: ['bleus', 'bleues'],
  green: ['verts', 'vertes'],
  black: ['noirs', 'noires'],
  white: ['blancs', 'blanches'],
  yellow: ['jaunes', 'jaunes'],
};
/** Mêmes couleurs au singulier : [masculin, féminin]. */
const SINGULAR_FR: Readonly<Record<string, readonly [string, string]>> = {
  red: ['rouge', 'rouge'],
  blue: ['bleu', 'bleue'],
  green: ['vert', 'verte'],
  black: ['noir', 'noire'],
  white: ['blanc', 'blanche'],
  yellow: ['jaune', 'jaune'],
};
/** « orange » s’écrit pareil en français : la question donnerait la réponse. */
const GUESSABLE = COLOURS.filter((c) => c.en !== c.fr);
const colourWord = (en: string): Word => {
  const w = COLOURS.find((c) => c.en === en);
  if (!w) throw new Error(`couleur inconnue : ${en}`);
  return w;
};
const frColour = (c: Word, t: Thing) => at(PLURAL_FR[c.en] ?? [], t.feminine ? 1 : 0);
const NUMBERS = [
  [2, 'two'],
  [3, 'three'],
] as const;

const colours: Skill = {
  id: 'acm1-couleurs',
  title: 'Les couleurs',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Apprends : red (rouge), yellow (jaune), blue (bleu), green (vert), pink (rose).',
      'Retiens aussi : purple (violet), orange (orange), brown (marron), black (noir), white (blanc), grey (gris).',
      'La couleur est un **adjectif** : place-la avant le nom, sans s, comme dans « three black cats ».',
    ],
    source: source('Mots : British Council, « Colours flashcards » et « Adjectives ».'),
    sources: ['lve-cm-2026', 'bck-flashcards-colours', 'bck-adjectives'],
  },
  sens: [
    {
      type: 'savais-tu',
      text: 'En anglais, un adjectif, comme une couleur, ne prend pas de s au pluriel.',
      source: 'bck-adjectives',
      citation: "We don't add s to the adjective when it's plural.",
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1)
      return pickEnglish(
        rng,
        COLOURS.slice(0, 6),
        'une couleur',
        'Pense à la couleur, puis au mot entendu en classe ou en chanson.',
        SAY.colours,
      );
    if (level === 2) return understand(rng, GUESSABLE, 'une couleur', SAY.colours);
    if (level === 3) return write(rng, GUESSABLE, 'une couleur', SAY.colours);
    if (level === 4) {
      // Une seule difficulté de plus que le niveau 3 : placer la couleur avant un nom au singulier.
      const thing = rng.pick(THINGS);
      const [wanted, wrong] = some(rng, Object.keys(SINGULAR_FR), 2) as [string, string];
      const c = colourWord(wanted);
      const other = colourWord(wrong);
      const gender = thing.feminine ? 1 : 0;
      const article = thing.feminine ? 'une' : 'un';
      const good = `a ${c.en} ${thing.one}`;
      return {
        prompt: `Écris en anglais : « ${article} ${thing.frOne} ${at(SINGULAR_FR[c.en] ?? [], gender)} ». Aide : « ${article} ${thing.frOne} » se dit « a ${thing.one} ».`,
        answer: { kind: 'text', accepted: dotted([good]) },
        traps: [
          { text: `a ${thing.one} ${c.en}`, why: 'En anglais, la couleur se place avant le nom.' },
          { text: `${c.en} ${thing.one}`, why: `Il manque le petit mot « a », qui veut dire « ${article} ».` },
          { text: `a ${other.en} ${thing.one}`, why: `« ${other.en} » veut dire « ${other.fr} ».` },
        ],
        hint: 'Écris dans l’ordre : « a », la couleur, puis le nom.',
        steps: [
          `Écris d’abord « a » : il veut dire « ${article} ».`,
          `Place ensuite la couleur : « ${c.en} ».`,
          `Ajoute le nom après la couleur : « ${thing.one} ».`,
          `Réponds : **${good}**.`,
        ],
      };
    }
    // Compter les objets d’une couleur : un autre objet de la même couleur ne compte pas.
    const [thing, other] = some(rng, OWNED, 2) as [Thing, Thing];
    const [wanted, second, third] = some(rng, Object.keys(PLURAL_FR), 3) as [string, string, string];
    const c = colourWord(wanted);
    const [n, num] = rng.pick(NUMBERS);
    const kids = some(rng, ['Emir', 'Ana', 'Yuna', 'Paul', 'Lina', 'Tom'], n + 3);
    const owned: readonly (readonly [Thing, string])[] = [
      ...Array.from({ length: n }, () => [thing, wanted] as const),
      [thing, second],
      [thing, third],
      [other, wanted],
    ];
    const good = `${num} ${wanted} ${thing.many}`;
    const more = n === 2 ? 'three' : 'four';
    return {
      // « there are … » reste accepté : c’est une phrase anglaise juste qui contient la réponse demandée.
      prompt: `Lis les messages. Combien de ${thing.fr} sont ${frColour(c, thing)} ? Écris la réponse en anglais : le nombre, la couleur, puis l’objet.`,
      figure: {
        kind: 'document',
        title: 'Our things',
        lines: rng.shuffle(owned.map(([t, colour], j) => `${at(kids, j)}: My ${t.one} is ${colour}.`)),
        credit: 'Écrit pour l’exercice.',
      },
      answer: {
        kind: 'text',
        accepted: dotted([
          good,
          `${n} ${wanted} ${thing.many}`,
          `there are ${good}`,
          `there are ${n} ${wanted} ${thing.many}`,
        ]),
      },
      traps: [
        { text: `${num} ${thing.many} ${wanted}`, why: 'En anglais, la couleur se place avant le nom.' },
        { text: `${num} ${wanted}s ${thing.many}`, why: 'Un adjectif anglais ne prend jamais de s au pluriel.' },
        { text: `${num} ${wanted} ${thing.one}`, why: 'Il y en a plusieurs : le nom prend un s.' },
        { text: `${more} ${wanted} ${thing.many}`, why: `Compte seulement les ${thing.fr}, pas les autres objets.` },
      ],
      hint: 'Compte seulement le bon objet. Il y en a plusieurs : ajoute un s à son nom.',
      steps: [
        `Cherche les lignes avec « ${thing.one} » (${thing.frOne}).`,
        `Compte seulement celles qui disent « ${wanted} » (${c.fr}) : il y en a ${n}.`,
        'Écris le nombre, la couleur, puis le nom avec un s.',
        `Réponds : **${good}**.`,
      ],
    };
  },
};

// ——— 2. Les jours ———
const MENU = ['chicken soup', 'green salad', 'vegetable soup', 'egg salad', 'lentil soup'];

const days: Skill = {
  id: 'acm1-jours',
  title: 'Les jours de la semaine',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Récite la semaine : Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.',
      'Chaque jour commence par une **majuscule** : on Monday (le lundi).',
    ],
    source: source(
      'Jours : British Council (menu d’école, « Prepositions of time ») ; programme d’anglais du collège.',
    ),
    sources: ['lve-cm-2026', 'bck-lunch-menu', 'bck-prepositions-time', 'anglais-college-2025'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Les jours t’aident à lire un menu de cantine anglais, comme « Monday : chicken soup ».',
      source: 'bck-lunch-menu',
      citation: 'Monday chicken soup',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1) return pickEnglish(rng, DAYS, 'un jour', 'Pense à la date écrite au tableau le matin.', SAY.days);
    if (level === 2) return understand(rng, DAYS, 'un jour', SAY.days);
    if (level === 3)
      return rng.int(0, 1) === 0 ? write(rng, DAYS, 'un jour', SAY.days) : ordering(rng, DAYS, 4, 'ces jours');
    if (level === 4) return neighbour(rng, DAYS, 'le jour');
    const soups = rng.shuffle(MENU);
    // Menu du lundi au vendredi : on part d'un plat et on avance (ou recule) d'un jour, sans sortir du menu.
    const step = rng.int(0, 1) === 0 ? 1 : -1;
    const i = step === 1 ? rng.int(0, 3) : rng.int(1, 4);
    const from = at(DAYS, i);
    const wanted = at(DAYS, i + step);
    const opposite = at(DAYS, (i - step + DAYS.length) % DAYS.length);
    const dish = at(soups, i);
    const when = step === 1 ? 'le lendemain' : 'la veille';
    const meaning = step === 1 ? 'le jour juste après' : 'le jour juste avant';
    return {
      prompt: `Lis le menu (les lignes sont mélangées). Cherche ${when} (${meaning}) du jour où l’on mange « ${dish} ». Écris ce jour en anglais.`,
      figure: {
        kind: 'document',
        title: 'Lunch menu',
        lines: shuffledOther(
          rng,
          soups.map((s, j) => `${at(DAYS, j).en}: ${s}`),
        ),
        credit: 'Écrit pour l’exercice, d’après un menu d’école du British Council.',
      },
      answer: { kind: 'text', accepted: accepted(wanted) },
      traps: [
        { text: from.en, why: `« ${from.en} » est le jour de « ${dish} ». On demande ${when}.` },
        { text: opposite.en, why: `Attention au sens : on demande ${when}.` },
        { text: wanted.fr, why: 'C’est le bon jour, mais il faut l’écrire en anglais.' },
        { text: wanted.typo, why: `Regarde bien les lettres : « ${wanted.en} ».` },
      ],
      hint: `Trouve d’abord le jour du plat. Puis ${step === 1 ? 'avance' : 'recule'} d’un jour dans la semaine.`,
      steps: [
        `Cherche la ligne avec « ${dish} » : c’est « ${from.en} » (${from.fr}).`,
        `${step === 1 ? 'Avance' : 'Recule'} d’un jour dans la semaine.`,
        `Écris **${wanted.en}** (${wanted.fr}).`,
      ],
    };
  },
};

// ——— 3. Les mois ———
const months: Skill = {
  id: 'acm1-mois',
  title: 'Les mois de l’année',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Récite les mois : January, February, March, April, May, June ; July, August, September, October, November, December.',
      'Chaque mois commence par une **majuscule** : in May (en mai).',
    ],
    source: source('Mois : British Council, chanson « Time for another year ».'),
    sources: ['lve-cm-2026', 'bck-song-year', 'bc-prepositions-time'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Avec un mois, tu dis quand tu es très occupé : « I’m always really busy in December ».',
      source: 'bc-prepositions-time',
      citation: "I'm always really busy in December.",
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1)
      return pickEnglish(
        rng,
        MONTHS,
        'un mois',
        'Beaucoup de mois ressemblent au français. Compare les débuts.',
        SAY.months,
      );
    if (level === 2) return understand(rng, MONTHS, 'un mois', SAY.months);
    if (level === 3)
      return rng.int(0, 1) === 0 ? write(rng, MONTHS, 'un mois', SAY.months) : ordering(rng, MONTHS, 4, 'ces mois');
    if (level === 4) return neighbour(rng, MONTHS, 'le mois');
    const kids = some(rng, ['Emir', 'Ana', 'Yuna', 'Paul'], 3);
    const i = rng.int(0, 10);
    const wanted = at(MONTHS, i + 1);
    const before = at(MONTHS, i);
    const [extra1, extra2] = some(
      rng,
      MONTHS.filter((m) => m !== wanted && m !== before),
      2,
    ) as [Word, Word];
    const owner = at(kids, 0);
    const lines = rng.shuffle([
      `${owner}: My birthday is in the month after ${before.en}.`,
      `${at(kids, 1)}: My birthday is in ${extra1.en}.`,
      `${at(kids, 2)}: My birthday is in ${extra2.en}.`,
    ]);
    return {
      prompt: `Lis les messages. En quel mois est l’anniversaire ${de(owner)} ? Écris le mois en anglais.`,
      figure: { kind: 'document', title: 'Birthdays', lines, credit: 'Écrit pour l’exercice.' },
      answer: { kind: 'text', accepted: accepted(wanted) },
      traps: [
        { text: before.en, why: `« after » veut dire « après » : il faut le mois qui suit « ${before.en} ».` },
        { text: wanted.fr, why: 'C’est le bon mois, mais il faut l’écrire en anglais.' },
        { text: extra1.en, why: `C’est le mois ${de(at(kids, 1))}. Lis la ligne ${de(owner)}.` },
      ],
      hint: '« after » veut dire « après ». Récite les mois jusqu’au mois écrit.',
      steps: [
        `Lis la ligne ${de(owner)} : le mois après « ${before.en} ».`,
        `Repère « ${before.en} » dans la liste des mois.`,
        'Avance d’un mois.',
        `Écris **${wanted.en}**.`,
      ],
    };
  },
};

// ——— 4. Les saisons ———
/**
 * Indices du niveau 5 : mots simples (météo, école, loisirs, couleurs, nourriture), une seule saison possible.
 * `help` traduit dans l’énoncé les mots que la notion n’enseigne pas.
 */
interface Clue {
  readonly season: string;
  readonly en: string;
  readonly fr: string;
  readonly help?: string;
}
const CLUES: readonly Clue[] = [
  {
    season: 'spring',
    en: 'New flowers open. The trees are green again.',
    fr: 'de nouvelles fleurs s’ouvrent, les arbres redeviennent verts',
    help: '« flowers » = fleurs',
  },
  {
    season: 'spring',
    en: 'The cold days end. We see new flowers.',
    fr: 'les jours froids se terminent, on voit de nouvelles fleurs',
    help: '« flowers » = fleurs',
  },
  { season: 'summer', en: 'It’s hot and sunny. We swim in the sea.', fr: 'il fait chaud et beau, on nage dans la mer' },
  {
    season: 'summer',
    en: 'No school! We eat ice cream in the hot sun.',
    fr: 'pas d’école, on mange des glaces sous un soleil chaud',
  },
  {
    season: 'autumn',
    en: 'The green leaves are now brown and orange.',
    fr: 'les feuilles vertes sont devenues marron et orange',
    help: '« leaves » = feuilles',
  },
  {
    season: 'autumn',
    en: 'It’s windy. Red and brown leaves are on the ground.',
    fr: 'il y a du vent, des feuilles rouges et marron sont par terre',
    help: '« leaves » = feuilles, « ground » = sol',
  },
  {
    season: 'winter',
    en: 'It’s very cold and snowy. We play in the snow.',
    fr: 'il fait très froid et il neige, on joue dans la neige',
  },
  {
    season: 'winter',
    en: 'It’s cold. It’s Christmas and we want snow.',
    fr: 'il fait froid, c’est Noël et on espère la neige',
  },
];
const season = (en: string): Word => {
  const w = SEASONS.find((s) => s.en === en);
  if (!w) throw new Error(`saison inconnue : ${en}`);
  return w;
};

/** Saisie d’un mot : point ou point d’exclamation accepté, erreur typique reconnue de la même façon. */
function punctuated(q: QuestionDraft): QuestionDraft {
  if (q.answer.kind !== 'text') return q;
  const traps = (q.traps ?? []).filter((t): t is TextTrap => 'text' in t);
  return { ...q, answer: { kind: 'text', accepted: exclaimed(q.answer.accepted) }, traps: exclaimedTraps(traps) };
}
const SEASONS_ORDER = {
  hint: (first: string) => `Récite les saisons en commençant par « ${first} ».`,
  step: `Suis l’ordre : ${SEASONS_FR}. Après le dernier, reprends le premier.`,
  cycle: true,
};

/** Niveau 1, dans l’autre sens : choisir parmi 3 le sens d’un mot anglais. */
function readSeason(rng: Rng): QuestionDraft {
  const w = rng.pick(SEASONS);
  const { answer, traps } = choice(
    rng,
    w.fr,
    others(rng, SEASONS, w, 2).map((o) => ({ label: o.fr, why: `« ${o.fr} » se dit « ${o.en} ».` })),
  );
  return {
    prompt: `Choisis le sens du mot anglais « ${w.en} ».`,
    answer,
    traps,
    hint: 'Récite les saisons du mémo, dans l’ordre.',
    steps: SEASONS_SAY.understand(w),
  };
}

const seasons: Skill = {
  id: 'acm1-saisons',
  title: 'Les saisons',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Apprends les saisons : spring (printemps), summer (été), autumn (automne), winter (hiver).',
      'Devant une saison, mets **in** : in summer (en été).',
      'En anglais américain, autumn se dit aussi fall.',
    ],
    source: source('Saisons : British Council, poème « Spring to winter » et « Prepositions of time ».'),
    sources: ['lve-cm-2026', 'bck-spring-winter', 'bc-prepositions-time', 'bck-song-year', 'bc-british-american'],
  },
  sens: [
    {
      type: 'savais-tu',
      text: 'L’automne a deux noms en anglais : « autumn » et « fall ».',
      source: 'bc-british-american',
      citation: 'autumn = fall',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1) {
      if (rng.int(0, 1) === 0) return readSeason(rng);
      return pickEnglish(
        rng,
        SEASONS,
        'une saison',
        'Récite les saisons en français, puis en anglais, dans le même ordre.',
        SEASONS_SAY,
      );
    }
    if (level === 2) return understand(rng, SEASONS, 'une saison', SEASONS_SAY);
    if (level === 3)
      return rng.int(0, 1) === 0
        ? punctuated(write(rng, SEASONS, 'une saison', SEASONS_SAY, withThe))
        : ordering(rng, SEASONS, 4, 'ces saisons', SEASONS_ORDER);
    if (level === 4) {
      if (rng.int(0, 1) === 0) return punctuated(neighbour(rng, SEASONS, 'la saison', withThe, SEASONS_EN));
      const w = rng.pick(SEASONS);
      const fr = { spring: 'au printemps', summer: 'en été', autumn: 'en automne', winter: 'en hiver' }[w.en];
      return punctuated({
        prompt: `Écris en anglais, avec le petit mot devant la saison : « ${fr ?? ''} ».`,
        answer: { kind: 'text', accepted: accepted(w).flatMap((s) => [`in ${s}`, `in the ${s}`]) },
        traps: [
          { text: `on ${w.en}`, why: '« on » va avec un jour ou une date. Pour une saison, on met « in ».' },
          { text: `at ${w.en}`, why: '« at » va avec une heure. Pour une saison, on met « in ».' },
          { text: w.en, why: 'Il manque le petit mot devant la saison.' },
        ],
        hint: 'Relis le mémo : quel petit mot va devant une saison ?',
        steps: [
          `Cherche la saison en anglais : « ${w.en} ».`,
          'Place « in » devant : c’est le petit mot des saisons.',
          `Réponds : **in ${w.en}**.`,
        ],
      });
    }
    const first = rng.pick(CLUES);
    const good = season(first.season);
    return punctuated({
      prompt: `Lis le texte. De quelle saison parle-t-il ? Écris-la en anglais.${first.help ? ` Aide : ${first.help}.` : ''}`,
      figure: {
        kind: 'document',
        title: 'Which season?',
        lines: [first.en],
        credit: 'Écrit pour l’exercice.',
      },
      answer: { kind: 'text', accepted: withThe(good) },
      traps: [
        ...SEASONS.filter((s) => s !== good).map((s) => ({
          text: s.en,
          why: `Ce n’est pas ${s.fr}. Relis la scène : ${first.fr}.`,
        })),
        { text: good.typo, why: `La bonne saison, mais elle s’écrit « ${good.en} ».` },
      ],
      hint: 'Imagine la scène. Quel temps fait-il ? Que font les gens ou la nature ?',
      steps: [
        'Lis le texte et imagine la scène.',
        `Traduis les indices : ${first.fr}.`,
        `Trouve la saison : c’est ${good.fr}.`,
        `Écris **${good.en}**.`,
      ],
    });
  },
};

// ——— 5. La date ———
const suffix = (n: number): string =>
  n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
const dateEn = (d: SourcedDate) => `${d.day} ${d.month}`;
const frMonth = (en: string) => MONTHS.find((m) => m.en === en)?.fr ?? en;
const dateFr = (d: SourcedDate) => `${d.day === 1 ? '1er' : d.day} ${frMonth(d.month)}`;
/** Nombres ordinaux écrits en lettres, de 1 à 31 (écritures acceptées). */
const ORDINAL_WORDS = [
  ...['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'],
  ...['eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth'],
  ...['nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth'],
  ...['twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first'],
];
const dateAccepted = ({ day, month }: SourcedDate): string[] => {
  const o = `${day}${suffix(day)}`;
  const w = at(ORDINAL_WORDS, day - 1);
  return [
    `${day} ${month}`,
    `the ${w} of ${month}`,
    `${w} of ${month}`,
    `${month} the ${w}`,
    `${month} ${w}`,
    `${o} ${month}`,
    `the ${o} ${month}`,
    `the ${o} of ${month}`,
    `${o} of ${month}`,
    `${month} ${day}`,
    `${month} ${o}`,
    `${month} the ${o}`,
  ];
};
/** Date précédée (ou non) de « on ». */
const withOn = (forms: readonly string[]): string[] => forms.flatMap((f) => [f, `on ${f}`]);
/** Date avec son jour de la semaine : « Friday 5 July », « Friday, July 5th ». */
const withDay = (weekday: string, forms: readonly string[]): string[] =>
  forms.flatMap((f) => [`${weekday} ${f}`, `${weekday}, ${f}`]);
/** Mois de moins de 31 jours (février : 28, pour que la date existe chaque année). */
const SHORT_MONTHS: Readonly<Record<string, number>> = {
  February: 28,
  April: 30,
  June: 30,
  September: 30,
  November: 30,
};
/** Un autre mois où le même numéro de jour existe : un distracteur n’est jamais une date impossible. */
const otherMonth = (rng: Rng, { day, month }: SourcedDate): string =>
  rng.pick(MONTHS.filter((m) => m.en !== month && day <= (SHORT_MONTHS[m.en] ?? 31))).en;

const date: Skill = {
  id: 'acm1-date',
  title: 'La date',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Écris le numéro, puis le mois : 2 August (le 2 août).',
      'Devant un jour ou une date, mets **on** : on Friday 2 August.',
      'Devant un mois seul ou une saison, mets **in** : in August.',
    ],
    source: source('Dates : British Council, « Prepositions of time » ; programme d’anglais du collège (ordinaux).'),
    sources: [
      'lve-cm-2026',
      'bc-prepositions-time',
      'bck-prepositions-time',
      'bck-halloween-invitation',
      'bck-sports-day',
      'anglais-college-2025',
    ],
  },
  sens: [
    {
      type: 'usage',
      text: 'Une invitation anglaise te dit quand vient la fête : « Party starts: Friday 31 October ».',
      source: 'bck-halloween-invitation',
      citation: 'Party starts: Friday 31 October at 5 p.m.',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    const d = rng.pick(DATES);
    if (level === 1) {
      const m = otherMonth(rng, d);
      const { answer, traps } = choice(rng, dateEn(d), [
        { label: `${d.day} ${m}`, why: `« ${m} » veut dire « ${frMonth(m)} » : ce n’est pas le bon mois.` },
        {
          label: `${d.day > 20 ? d.day - 10 : d.day + 10} ${d.month}`,
          why: 'Le mois est bon, mais le numéro du jour a changé.',
        },
      ]);
      return {
        prompt: `Comment écrit-on « le ${dateFr(d)} » en anglais ?`,
        answer,
        traps,
        hint: 'Vérifie les deux morceaux : le numéro, puis le mois.',
        steps: [
          `Cherche d’abord le numéro : ${d.day}.`,
          `Traduis ensuite le mois : « ${frMonth(d.month)} » se dit « ${d.month} ».`,
          `Choisis **${dateEn(d)}**.`,
        ],
      };
    }
    if (level === 2) {
      const [kind, text, good] = rng.pick([
        ['une date', `My birthday is … ${dateEn(d)}.`, 'on'],
        ['un jour', `The party is … ${rng.pick(DAYS).en}.`, 'on'],
        ['un mois', `My birthday is … ${d.month}.`, 'in'],
        ['une saison', `It is cold … ${rng.pick(['winter', 'autumn'])}.`, 'in'],
      ] as const);
      const why: Readonly<Record<string, string>> = {
        on: '« on » va avec un jour ou une date.',
        in: '« in » va avec un mois, une saison ou une année.',
        at: '« at » va avec une heure.',
      };
      const { answer, traps } = choice(
        rng,
        good,
        ['on', 'in', 'at']
          .filter((x) => x !== good)
          .map((x) => ({ label: x, why: `${why[x] ?? ''} Ici, après le trou, on lit ${kind}.` })),
      );
      return {
        prompt: `Complète : « ${text} »`,
        answer,
        traps,
        hint: 'Regarde le mot après le trou : un jour, une date, un mois ou une saison ?',
        steps: [
          `Regarde après le trou : c’est ${kind}.`,
          good === 'on'
            ? 'Retiens : devant un jour ou une date, mets « on ».'
            : 'Retiens : devant un mois ou une saison, mets « in ».',
          `Réponds : **${good}**.`,
        ],
      };
    }
    if (level === 3) {
      if (rng.int(0, 1) === 0) {
        const other = rng.pick(DATES.filter((x) => x.month !== d.month));
        const holes = [
          { before: 'The match is ', word: dateEn(d), good: 'on', what: 'une date' },
          { before: 'The party is ', word: other.month, good: 'in', what: 'un mois seul' },
        ] as const;
        // L’ordre des phrases change : la réponse ne peut pas s’apprendre par cœur.
        const [one, two] = rng.int(0, 1) === 0 ? holes : ([holes[1], holes[0]] as const);
        return {
          prompt: `Écris « on » ou « in » dans chaque trou : « ${one.before}… ${one.word}. ${two.before}… ${two.word}. »`,
          answer: {
            kind: 'cloze',
            parts: [one.before, ` ${one.word}. ${two.before}`, ` ${two.word}.`],
            blanks: [
              { mode: 'text', accepted: [one.good] },
              { mode: 'text', accepted: [two.good] },
            ],
          },
          hint: 'Un trou après l’autre : y a-t-il un numéro de jour, ou seulement un mois ?',
          steps: [
            'Retiens la règle : devant un mois, mets « in ». Devant une date, mets « on ».',
            `Premier trou : lis « ${one.word} ». C’est ${one.what}.`,
            `Second trou : lis « ${two.word} ». C’est ${two.what}.`,
            `Réponds : **${one.good}**, puis **${two.good}**.`,
          ],
        };
      }
      const m = otherMonth(rng, d);
      return {
        prompt: `Écris en anglais la date : « le ${dateFr(d)} ».`,
        answer: { kind: 'text', accepted: exclaimed(withOn(dateAccepted(d))) },
        traps: exclaimedTraps([
          { text: `${d.day} ${frMonth(d.month)}`, why: `Écris le mois en anglais : « ${d.month} ».` },
          { text: `${d.day} ${m}`, why: `« ${m} » veut dire « ${frMonth(m)} ».` },
          { text: d.month, why: 'Il manque le numéro du jour.' },
        ]),
        hint: 'Écris d’abord le numéro, puis le mois en anglais avec sa majuscule.',
        steps: [
          `Écris d’abord le numéro : ${d.day}.`,
          `Cherche le mois « ${frMonth(d.month)} » : c’est « ${d.month} ».`,
          'Mets une **majuscule** au début du mois.',
          `Réponds : **${dateEn(d)}**.`,
        ],
      };
    }
    if (level === 4) {
      const day = rng.pick(DAYS);
      const good = `on ${day.en} ${dateEn(d)}`;
      return {
        prompt: `Écris en anglais, avec le petit mot qui va devant : « le ${day.fr} ${dateFr(d)} ».`,
        answer: { kind: 'text', accepted: exclaimed(withDay(day.en, dateAccepted(d)).map((f) => `on ${f}`)) },
        traps: exclaimedTraps([
          { text: `${day.en} ${dateEn(d)}`, why: 'Il manque le petit mot qui va devant une date.' },
          { text: `in ${day.en} ${dateEn(d)}`, why: '« in » va avec un mois seul. Devant une date, on met « on ».' },
          { text: `on ${day.en} ${d.day} ${frMonth(d.month)}`, why: `Écris le mois en anglais : « ${d.month} ».` },
        ]),
        hint: 'Trouve d’abord le petit mot qui va devant une date. Chaque jour et chaque mois prend une majuscule.',
        steps: [
          'Mets d’abord « on » : c’est une date.',
          `Écris le jour « ${day.en} », puis le numéro ${d.day}.`,
          `Ajoute le mois : « ${d.month} ».`,
          `Réponds : **${good}**.`,
        ],
      };
    }
    const start = rng.int(1, 20);
    const month = rng.pick(MONTHS).en;
    const gap = rng.int(1, 4);
    const asked = at(DAYS, gap);
    const good: SourcedDate = { day: start + gap, month };
    return {
      prompt: 'Lis le mot de la classe. Quelle est la date de la sortie (« class trip ») ? Écris-la en anglais.',
      figure: {
        kind: 'document',
        title: 'School week',
        lines: [`Week beginning: Monday ${start} ${month}`, `${asked.en}: class trip!`],
        credit: 'Écrit pour l’exercice.',
      },
      answer: {
        kind: 'text',
        accepted: exclaimed(withOn([...dateAccepted(good), ...withDay(asked.en, dateAccepted(good))])),
      },
      traps: exclaimedTraps([
        { text: `${start} ${month}`, why: `C’est la date de « Monday ». Compte les jours jusqu’à « ${asked.en} ».` },
        { text: `${good.day + 1} ${month}`, why: 'Tu as compté un jour de trop.' },
        { text: asked.en, why: 'On demande la date : un numéro et un mois.' },
      ]),
      hint: '« Week beginning » veut dire « la semaine commence ». Compte les jours depuis Monday.',
      steps: [
        `Cherche la ligne « class trip » : c’est « ${asked.en} ».`,
        `Compte depuis « Monday ${start} » : avance de ${gap} jour${gap > 1 ? 's' : ''}.`,
        `Ajoute ces jours au numéro : ${start} + ${gap} = ${good.day}.`,
        `Écris **${dateEn(good)}**.`,
      ],
    };
  },
};

// ——— 6. La météo ———
/**
 * Début d’une phrase juste pour dire un temps : « It’s sunny », « It is a sunny day », « The weather is sunny » (et
 * « The weather today is … », « The weather in London is … »). Pas de « a … day » ni de « The weather is » avec
 * « raining » ou « snowing ». La première forme est la réponse montrée.
 */
const weatherCores = (w: Word): string[] =>
  accepted(w).flatMap((f) =>
    ['It’s', 'It is'].flatMap((it) => [`${it} ${f}`, ...(f.endsWith('ing') ? [] : [`${it} a ${f} day`])]),
  );
/** Compléments dans chaque ordre possible, du plus court au plus long (deux au plus). */
const arrangements = (parts: readonly string[]): string[][] => [
  [],
  ...parts.flatMap((a) => [[a], ...parts.filter((b) => b !== a).map((b) => [a, b])]),
];
const capital = (text: string) => text.slice(0, 1).toUpperCase() + text.slice(1);
/** Chaque complément (« today », la ville) en tête, avec ou sans virgule, ou en fin de phrase. */
const placed = (core: string, parts: readonly string[]): string[] =>
  arrangements(parts).flatMap((head) =>
    arrangements(parts.filter((p) => !head.includes(p))).flatMap((tail) => {
      const end = tail.map((p) => ` ${p}`).join('');
      if (head.length === 0) return [`${core}${end}`];
      const inner = core.replace(/^(It|The)/, (x) => x.toLowerCase());
      return [head.join(' '), head.join(', ')].flatMap((start) =>
        [' ', ', '].map((comma) => `${capital(start)}${comma}${inner}${end}`),
      );
    }),
  );
/** Toutes les phrases justes, avec « today » et, s’il y en a une, la ville. */
const weatherAnswers = (w: Word, town?: string): string[] => {
  const place = town ? [`in ${town}`] : [];
  const all = ['today', ...place];
  const plain = accepted(w).filter((f) => !f.endsWith('ing'));
  return [
    ...weatherCores(w).flatMap((c) => placed(c, all)),
    ...plain.flatMap((f) => [
      ...placed(`The weather is ${f}`, all),
      ...placed(`The weather today is ${f}`, place),
      ...(town
        ? [
            ...placed(`The weather in ${town} is ${f}`, ['today']),
            `The weather in ${town} today is ${f}`,
            `The weather today in ${town} is ${f}`,
          ]
        : []),
    ]),
  ];
};
const ITS = '« its » veut dire « son » ou « sa ». Il faut « it’s », avec une apostrophe.';
/** Temps du niveau 5, dit en français dans la question. */
const CONDITIONS: Readonly<Record<string, string>> = {
  cold: 'il fait froid',
  windy: 'il y a du vent',
  cloudy: 'il y a des nuages',
  rainy: 'il pleut',
  snowy: 'il neige',
  foggy: 'il y a du brouillard',
};
const weatherWord = (en: string): Word => {
  const w = WEATHER.find((x) => x.en === en);
  if (!w) throw new Error(`temps inconnu : ${en}`);
  return w;
};

const weather: Skill = {
  id: 'acm1-meteo',
  title: 'La météo',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'À « What’s the weather like » (quel temps fait-il), réponds avec **it’s** : It’s sunny (ensoleillé, il y a du soleil).',
      'Apprends : rainy (pluvieux), cloudy (nuageux), windy (venteux), snowy (neigeux).',
      'Retiens aussi : stormy (orageux), foggy (avec du brouillard), hot (chaud), cold (froid).',
    ],
    source: source('Météo : British Council, « Weather flashcards » et « The weather where I live ».'),
    sources: [
      'lve-cm-2026',
      'bck-flashcards-weather',
      'bck-weather-live',
      'bck-weather-your-turn',
      'bc-prepositions-time',
    ],
  },
  sens: [
    {
      type: 'usage',
      text: "Tu comprends un enfant qui écrit du Brésil : « Today it's hot and sunny in Brazil ».",
      source: 'bck-weather-live',
      citation: "Today it's hot and sunny in Brazil.",
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1)
      return pickEnglish(
        rng,
        // Les 5 premiers mots, puis « hot » et « cold » : assez de questions différentes.
        [...WEATHER.slice(0, 5), ...WEATHER.slice(-2)],
        'la météo',
        'Pense aux mots du mémo. Élimine ceux dont tu connais déjà le sens.',
        WEATHER_SAY,
      );
    if (level === 2) {
      if (rng.int(0, 2) === 0) {
        const w = rng.pick(WEATHER);
        const { answer, traps } = choice(
          rng,
          w.fr,
          others(rng, WEATHER, w, 3).map((o) => ({ label: o.fr, why: `« ${o.fr} » se dit « ${o.en} ».` })),
        );
        return {
          prompt: 'Écoute. Quel temps fait-il ?',
          audio: { text: `It’s ${w.en} today.`, lang: 'en-GB' },
          answer,
          traps,
          hint: 'Écoute bien le mot juste avant « today ».',
          steps: [
            'Écoute le mot juste avant « today ».',
            `Traduis la phrase : « It’s ${w.en} today. »`,
            `Choisis **${w.fr}**.`,
          ],
        };
      }
      return understand(rng, WEATHER, 'la météo', WEATHER_SAY);
    }
    if (level === 3) return punctuated(write(rng, WEATHER, 'la météo', WEATHER_SAY));
    if (level === 4) {
      const w = rng.pick(WEATHER);
      const other = at(others(rng, WEATHER, w, 1), 0);
      return {
        prompt: `Réponds à « What’s the weather like? » (quel temps fait-il ?) : « ${said(w)} ». Commence par « It’s ».`,
        answer: { kind: 'text', accepted: exclaimed(weatherAnswers(w)) },
        traps: exclaimedTraps([
          { text: w.en, why: 'Le mot est bon. Fais une phrase : commence par « It’s ».' },
          { text: `Its ${w.en}`, why: ITS },
          { text: `It’s ${other.en}`, why: `« ${other.en} » veut dire « ${other.fr} ».` },
        ]),
        hint: 'Commence par « It’s », puis ajoute le mot de la météo.',
        steps: [
          'Commence la phrase par « It’s ».',
          `Cherche le mot pour « ${said(w)} » : c’est « ${w.en} ».`,
          `Écris **It’s ${w.en}.**`,
        ],
      };
    }
    // Aucun mot n’est répété : seul le sens du temps demandé désigne la bonne ville.
    const words = rng.shuffle(Object.keys(CONDITIONS));
    const towns = some(rng, ['London', 'Glasgow', 'Cardiff', 'Belfast'], 3);
    const rows = towns.map((town, i) => ({ town, pair: [at(words, 2 * i), at(words, 2 * i + 1)] }));
    const row = rng.pick(rows);
    const [asked, wanted] = rng.shuffle(row.pair) as [string, string];
    const good = weatherWord(wanted);
    const condition = CONDITIONS[asked] ?? '';
    const day = rng.pick(DAYS).en;
    return {
      prompt: `Lis la météo des villes. Dans la ville où ${condition}, quel autre temps fait-il ? Réponds en anglais : commence par « It’s ».`,
      figure: {
        kind: 'document',
        title: `Weather on ${day}`,
        lines: rows.map(({ town, pair }) => `In ${town}, it’s ${pair.join(' and ')}.`),
        credit: 'Météo imaginaire, écrite pour l’exercice.',
      },
      answer: { kind: 'text', accepted: exclaimed(weatherAnswers(good, row.town)) },
      traps: exclaimedTraps([
        { text: good.en, why: 'Le mot est bon. Fais une phrase : commence par « It’s ».' },
        { text: `Its ${good.en}`, why: ITS },
        { text: `It’s ${asked}`, why: 'C’est le temps de la question. On demande l’autre temps de cette ville.' },
        ...words
          .filter((x) => !row.pair.includes(x))
          .map((x) => ({
            text: `It’s ${x}`,
            why: `Ce temps est écrit pour une autre ville. Cherche d’abord la ville où ${condition}.`,
          })),
      ]),
      hint: 'Trouve le mot anglais pour le temps de la question. Lis ensuite toute sa ligne.',
      steps: [
        `Pour dire « ${condition} », cherche le mot « ${asked} ».`,
        `Trouve sa ligne : c’est celle de ${row.town}.`,
        `Garde l’autre mot de cette ligne : « ${wanted} ».`,
        `Écris **It’s ${wanted}.**`,
      ],
    };
  },
};

export const ENGLISH_TIME_CHAPTER: Chapter = {
  id: 'acm1-temps',
  subject: 'anglais',
  grade: 'cm1',
  domain: 'langue',
  title: 'Le temps qui passe',
  skills: [colours, days, months, seasons, date, weather],
};
