import type { Level, QuestionDraft, Rich, Sens, Skill, Trap } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice, type Option } from '../build.ts';
import { inWords } from '../maths/cm/outils.ts';
import { shuffled } from './kit.ts';
import { PREUVES, type Preuve } from './se-reperer-sources.ts';

/**
 * CM1, « Se repérer dans le temps » (lot hi-cm1-04) : compétence du programme d'histoire du cycle 3 travaillée
 * sur quatre notions. Les dates tirées au sort servent à s'entraîner ; les faits historiques sont ceux de
 * `PREUVES`, avec leur citation exacte. Les textes à lire du niveau 5 sont écrits pour l'exercice.
 */

const PROG = 'Programme du cycle 3 (BOEN n° 31 du 30 juillet 2020, version 2023), histoire, classe de CM1';
const CREDIT = 'Texte écrit pour l’exercice.';

/** Élément d'indice connu (un indice hors liste serait un bug de génération). */
export function at<T>(items: readonly T[], i: number): T {
  const item = items[i];
  if (item === undefined) throw new Error(`Indice hors liste : ${i}`);
  return item;
}

const ROMAINS: readonly (readonly [number, string])[] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** Chiffres romains de 1 à 39 (assez pour les siècles étudiés). */
export function toRoman(n: number): string {
  let rest = n;
  let out = '';
  for (const [value, letters] of ROMAINS) {
    while (rest >= value) {
      out += letters;
      rest -= value;
    }
  }
  return out;
}

/** Erreur d'écriture : on ajoute les lettres sans jamais retirer (IIII, VIIII). */
const additive = (n: number) => 'X'.repeat(Math.floor(n / 10)) + (n % 10 >= 5 ? 'V' : '') + 'I'.repeat(n % 5);

/** Siècle d'une année (avant comme après J.-C.) : le Ier va de 1 à 100. */
export const centuryOf = (year: number) => Math.ceil(year / 100);

export const siecle = (c: number) => (c === 1 ? 'Ier' : `${toRoman(c)}e`);

/** Écritures acceptées d'un siècle saisi (romain ou arabe, avec ou sans « siècle »). */
export function siecleForms(c: number): string[] {
  const roman = toRoman(c);
  const base =
    c === 1
      ? ['Ier', '1er', 'I', '1']
      : [`${roman}e`, `${c}e`, roman, String(c), `${roman}ème`, `${c}ème`, `${roman}eme`, `${c}eme`];
  return base.flatMap((f) => [f, `${f} siècle`, `${f} siecle`]);
}

/** Année écrite à la française : « 1 000 » n'est pas utilisé pour une date. */
const annee = (y: number) => (y < 0 ? `${-y} av. J.-C.` : `${y}`);
const apresJc = (y: number) => (y < 0 ? annee(y) : `${y} apr. J.-C.`);

export const liste = (items: readonly string[]) => `${items.slice(0, -1).join(', ')} et ${items.at(-1) ?? ''}`;

export const cite = (p: Preuve) => `La source dit : « ${p.quote} »`;

/** Termine une phrase par un point, sans le doubler après « J.-C. ». */
const point = (text: string) => (text.endsWith('.') ? text : `${text}.`);

export const fin = (answer: string) =>
  answer.endsWith('.') ? `La réponse est donc : **${answer}**` : `La réponse est donc **${answer}**.`;

/** `n` entiers distincts, un par tranche (donc éloignés les uns des autres), dans un ordre au hasard. */
function distinctYears(rng: Rng, n: number, min: number, step: number): number[] {
  const slots = rng.shuffle(Array.from({ length: n + 2 }, (_, i) => i)).slice(0, n);
  return slots.map((s) => min + s * step + rng.int(0, step - 20));
}

export interface QcmFait {
  readonly q: string;
  readonly a: string;
  readonly wrong: readonly Option[];
  readonly preuve: Preuve;
  readonly explain: string;
  readonly hint: string;
}

export function qcm(rng: Rng, f: QcmFait): QuestionDraft {
  return {
    prompt: f.q,
    ...choice(rng, f.a, f.wrong),
    hint: f.hint,
    steps: [cite(f.preuve), f.explain, fin(f.a)],
    targetSeconds: 25,
  };
}

export function association(
  rng: Rng,
  prompt: string,
  pairs: readonly (readonly [string, string])[],
  hint: string,
  explain: readonly Rich[],
): QuestionDraft {
  const left = pairs.map((p) => p[0]);
  const right = shuffled(
    rng,
    pairs.map((p) => p[1]),
  );
  return {
    prompt,
    answer: { kind: 'match', left, right, pairs: pairs.map((p) => right.indexOf(p[1])) },
    hint,
    steps: [...explain, `Voici les paires : **${pairs.map((p) => `${p[0]} → ${p[1]}`).join(' ; ')}**.`],
    targetSeconds: 45,
  };
}

export interface Repere {
  readonly label: string;
  /** Valeur de tri (année, ou milieu de la période). */
  readonly t: number;
}

/** Remise en ordre, du plus ancien au plus récent. */
export function ranger(rng: Rng, prompt: string, reperes: readonly Repere[], hint: string, how: string): QuestionDraft {
  const sorted = [...reperes].sort((a, b) => a.t - b.t).map((r) => r.label);
  const items = shuffled(rng, sorted);
  return {
    prompt,
    answer: { kind: 'order', items, correct: sorted.map((l) => items.indexOf(l)) },
    hint,
    steps: [how, ...sorted.map((l, i) => point(`${i + 1}. ${l}`)), `En premier vient **${sorted[0] ?? ''}**`],
    targetSeconds: 45,
  };
}

/** Saisie d'un nombre, avec ses erreurs typiques. */
export function saisie(
  prompt: string,
  accepted: readonly string[],
  traps: readonly (readonly [string, string])[],
  hint: string,
  steps: readonly Rich[],
): QuestionDraft {
  const right = new Set(accepted.map((a) => a.toLowerCase()));
  const out: Trap[] = [];
  const seen = new Set<string>();
  for (const [text, why] of traps) {
    const key = text.toLowerCase();
    if (right.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push({ text, why });
  }
  return { prompt, answer: { kind: 'text', accepted }, traps: out, hint, steps, targetSeconds: 40 };
}

export type Generator = (rng: Rng) => QuestionDraft;

/** Ce que la notion donne à lire : mémo, « sens », et les preuves de ses faits. */
interface Contenu {
  readonly memo: readonly Rich[];
  readonly sens: Sens;
  readonly preuves: readonly Preuve[];
}

function skill(
  id: string,
  title: string,
  { memo, sens, preuves }: Contenu,
  levels: readonly [Generator, Generator, Generator, Generator, Generator],
): Skill {
  return {
    id,
    title,
    levels: 5,
    version: 2,
    sens: [sens],
    lesson: {
      memo,
      source: PROG,
      sources: [...new Set(['cycle3-2020', sens.source, ...preuves.map((p) => p.source)])],
    },
    generate: (rng: Rng, level: Level) => at(levels, level - 1)(rng),
  };
}

// ——— Explications guidées (docs/contenus/README.md §3) ———

/** Dernière bulle : la réponse en gras, sans doubler le point après « J.-C. ». */
const retiens = (answer: string) => `Retiens la réponse : **${answer}**${answer.endsWith('.') ? '' : '.'}`;

/** Dernière bulle d’une remise en ordre : les noms courts, dans l’ordre. */
const rangeAinsi = (labels: readonly string[]) => `Range ainsi : **${labels.join(' → ')}**.`;

/** Question à choix du niveau 1 : ses deux bulles disent quoi faire, la troisième donne la réponse. */
interface FaitSimple {
  readonly q: string;
  readonly a: string;
  readonly wrong: readonly Option[];
  readonly hint: string;
  readonly how: readonly [Rich, Rich];
}

function fait(rng: Rng, f: FaitSimple): QuestionDraft {
  return {
    prompt: f.q,
    ...choice(rng, f.a, f.wrong),
    hint: f.hint,
    steps: [...f.how, retiens(f.a)],
    targetSeconds: 25,
  };
}

// ——— Notion 1 : siècles et chiffres romains ———

const LETTRES = 'Retiens les lettres : I vaut 1, V vaut 5, X vaut 10.';

const FAITS_SIECLE: readonly FaitSimple[] = [
  {
    q: 'Combien d’années dure un siècle ?',
    a: '100 ans',
    wrong: [
      { label: '10 ans', why: '10 ans, c’est beaucoup plus court qu’un siècle.' },
      { label: '1 000 ans', why: '1 000 ans, c’est un millénaire, soit dix siècles.' },
    ],
    hint: 'Un siècle est bien plus long qu’une enfance.',
    how: [
      'Imagine une durée plus longue que la vie de la plupart des gens.',
      'Écarte 10 ans : c’est ton âge, environ. Écarte aussi le millénaire.',
    ],
  },
  {
    q: 'En chiffres romains, que vaut la lettre X ?',
    a: '10',
    wrong: [
      { label: '1', why: 'Le chiffre 1 s’écrit I.' },
      { label: '5', why: 'Le chiffre 5 s’écrit V.' },
    ],
    hint: 'La lettre X vaut plus que la lettre V.',
    how: ['Retrouve les trois lettres à connaître : I, V et X.', 'Classe-les de la plus petite à la plus grande.'],
  },
  {
    q: 'En chiffres romains, que vaut la lettre V ?',
    a: '5',
    wrong: [
      { label: '1', why: 'Le chiffre 1 s’écrit I.' },
      { label: '10', why: 'Le nombre 10 s’écrit X.' },
    ],
    hint: 'La lettre V est entre la lettre I et la lettre X.',
    how: ['Retrouve les trois lettres à connaître : I, V et X.', 'Pense à la lettre du milieu, entre 1 et 10.'],
  },
  {
    q: 'En chiffres romains, que vaut la lettre I ?',
    a: '1',
    wrong: [
      { label: '5', why: 'Le chiffre 5 s’écrit V.' },
      { label: '10', why: 'Le nombre 10 s’écrit X.' },
    ],
    hint: 'La lettre I vaut moins que la lettre V.',
    how: ['Compte les traits de la lettre I.', 'Choisis la plus petite des trois valeurs.'],
  },
  {
    q: 'Comment écrit-on le plus souvent « le vingtième siècle » ?',
    a: 'le XXe siècle',
    wrong: [
      { label: 'le XVe siècle', why: 'XV vaut 15 : c’est le quinzième siècle.' },
      { label: 'le XIIe siècle', why: 'XII vaut 12 : c’est le douzième siècle.' },
    ],
    hint: 'Calcule la valeur des lettres de chaque proposition.',
    how: ['Calcule : X vaut 10, V vaut 5, I vaut 1.', 'Cherche les lettres qui font 20 ensemble.'],
  },
];

const NOMBRES_ROMAINS = [4, 6, 9, 11, 14, 16] as const;

/** Découpe un nombre en lettres : deux bulles concrètes (« 14 = 10 + 4, soit X puis IV »). */
function decoupage(n: number): [Rich, Rich] {
  if (n === 4 || n === 9) {
    const [letter, value] = n === 4 ? ['V', 5] : ['X', 10];
    return [`Pars de la lettre ${letter}, qui vaut ${value}.`, `Enlève 1 : place un I avant le ${letter}.`];
  }
  const values: number[] = [];
  const letters: string[] = [];
  let rest = n;
  for (const [value, l] of ROMAINS) {
    while (rest >= value) {
      values.push(value);
      letters.push(l);
      rest -= value;
    }
  }
  if (values.length === 1) return [`Cherche la lettre qui vaut exactement ${n}.`, 'Écris cette lettre toute seule.'];
  return [
    `Décompose ${n} ainsi : ${values.join(' + ')}.`,
    `Écris les morceaux dans l’ordre : ${letters.join(' puis ')}.`,
  ];
}

/** Lit un nombre romain de gauche à droite, morceau par morceau. */
function lecture(n: number): [Rich, Rich] {
  const blocks: [number, string][] = [];
  let rest = n;
  for (const [value, l] of ROMAINS) {
    while (rest >= value) {
      blocks.push([value, l]);
      rest -= value;
    }
  }
  const [first] = blocks;
  if (blocks.length === 1 && first) {
    if (n === 4 || n === 9) {
      const [letter, value] = n === 4 ? ['V', 5] : ['X', 10];
      return [`Regarde le I placé avant le ${letter}.`, `Enlève 1 à ${value}.`];
    }
    return [`Regarde la lettre ${first[1]}.`, 'Retrouve sa valeur parmi 1, 5 et 10.'];
  }
  return [
    `Décompose ${toRoman(n)} de gauche à droite : ${blocks.map((b) => b[1]).join(' puis ')}.`,
    `Additionne les valeurs : ${blocks.map((b) => b[0]).join(' + ')}.`,
  ];
}

/** Nombres écrits en lettres, de 1 à 21 : « dix-huitième siècle » est aussi une écriture juste. */
const ORDINAUX = [
  'premier',
  'deuxième',
  'troisième',
  'quatrième',
  'cinquième',
  'sixième',
  'septième',
  'huitième',
  'neuvième',
  'dixième',
  'onzième',
  'douzième',
  'treizième',
  'quatorzième',
  'quinzième',
  'seizième',
  'dix-septième',
  'dix-huitième',
  'dix-neuvième',
  'vingtième',
  'vingt et unième',
] as const;

/** Toutes les écritures justes d’un siècle saisi, avec « le » ou « au », en chiffres ou en lettres. */
function ecrituresSiecle(c: number): string[] {
  const word = at(ORDINAUX, c - 1);
  const words = [word, ...(c === 2 ? ['second'] : []), ...(c === 21 ? ['vingt-et-unième'] : [])];
  const forms = [...siecleForms(c), ...words.flatMap((w) => [w, `${w} siècle`, `${w} siecle`])];
  // « le » et « au » ne précèdent que la forme complète, avec le mot « siècle ».
  return [...forms, ...forms.filter((f) => f.endsWith(' siècle')).flatMap((f) => [`le ${f}`, `au ${f}`])];
}

const siecles1: Generator = (rng) => fait(rng, rng.pick(FAITS_SIECLE));

const siecles2: Generator = (rng) => {
  if (rng.int(0, 1) === 0) {
    const nombres = rng.shuffle([...NOMBRES_ROMAINS]).slice(0, 3);
    const q = association(
      rng,
      `Associe ces nombres romains à leur valeur : ${liste(nombres.map(toRoman))}.`,
      nombres.map((n) => [toRoman(n), String(n)] as const),
      'Regarde si la petite lettre est avant ou après la grande.',
      [],
    );
    return {
      ...q,
      steps: [
        LETTRES,
        'Regarde la petite lettre : après la grande, ajoute. Avant, enlève.',
        `Associe ainsi : **${nombres.map((n) => `${toRoman(n)} → ${n}`).join(' ; ')}**.`,
      ],
    };
  }
  const n = rng.pick(NOMBRES_ROMAINS);
  const voisins = [n - 2, n + 2, n + 1, n - 1]
    .filter((v) => v > 0)
    .map((v) => ({ label: toRoman(v), why: `${toRoman(v)} vaut ${v}, pas ${n}.` }));
  const empile = {
    label: additive(n),
    why: 'On n’empile pas les I ainsi : on enlève avec une petite lettre placée avant.',
  };
  const wrong: Option[] = [empile, ...voisins]
    .filter((o, i, all) => o.label !== toRoman(n) && all.findIndex((x) => x.label === o.label) === i)
    .slice(0, 3);
  return {
    prompt: `Attention aux pièges ! Comment s’écrit ${n} en chiffres romains ?`,
    ...choice(rng, toRoman(n), wrong),
    hint: 'Cherche la grande lettre la plus proche, puis ajoute ou enlève.',
    steps: [LETTRES, ...decoupage(n), retiens(toRoman(n))],
    targetSeconds: 30,
  };
};

const siecles3: Generator = (rng) => {
  const n = rng.int(2, 21);
  const r = toRoman(n);
  if (rng.int(0, 1) === 0) {
    return saisie(
      `Écris ${n} en chiffres romains.`,
      [r],
      [
        [additive(n), 'Ne répète pas la même lettre quatre fois : place un I avant la grande lettre.'],
        [toRoman(n + 1), `Tu as écrit ${n + 1}. Il en faut un de moins.`],
        [toRoman(n - 1), `Tu as écrit ${n - 1}. Il en manque un.`],
      ],
      'Décompose le nombre avec des 10, des 5 et des 1.',
      [LETTRES, ...decoupage(n), retiens(r)],
    );
  }
  return saisie(
    `Écris le nombre romain ${r} avec nos chiffres habituels.`,
    [String(n)],
    [
      [String(n + 1), 'Tu as compté un de trop. Relis lettre par lettre.'],
      [String(n - 1), 'Il t’en manque un. Relis lettre par lettre.'],
      [
        String(n + 2),
        /I[VX]/.test(r)
          ? 'Une petite lettre placée avant une grande s’enlève.'
          : 'Tu as compté deux de trop. Relis lettre par lettre.',
      ],
    ],
    'Lis de gauche à droite : ajoute, ou enlève si la petite lettre est devant.',
    [LETTRES, ...lecture(n), retiens(String(n))],
  );
};

const bornes = (c: number) => `le ${siecle(c)} siècle va de ${(c - 1) * 100 + 1} à ${c * 100}`;

/** Deux bulles pour trouver le siècle d’une année après J.-C. */
function trouverSiecle(year: number): [Rich, Rich] {
  if (year % 100 === 0) {
    return [
      `Regarde la fin : ${year} se termine par 00.`,
      `Garde le nombre de centaines, ${year / 100} : c’est le numéro du siècle.`,
    ];
  }
  const hundreds = Math.floor(year / 100);
  return [
    `Efface les deux derniers chiffres de ${year} : il reste ${hundreds}.`,
    `Ajoute 1 : tu obtiens ${hundreds + 1}, le numéro du siècle.`,
  ];
}

const siecles4: Generator = (rng) => {
  // Une fois sur trois, une année « ronde » : le piège classique.
  const year = rng.int(0, 2) === 0 ? rng.int(2, 20) * 100 : rng.int(101, 2000);
  const c = centuryOf(year);
  const traps = [c - 1, c + 1].flatMap((wrong) => {
    const why =
      wrong < c
        ? 'Tu as compté un siècle de moins. Les années 1 à 100 forment déjà le Ier siècle.'
        : year % 100 === 0
          ? 'C’est un siècle trop loin. Une année qui finit par 00 termine son siècle.'
          : 'C’est un siècle trop loin. Compte à partir du Ier siècle : années 1 à 100.';
    return [siecle(wrong), `${wrong}e`, `${siecle(wrong)} siècle`].map((t) => [t, why] as const);
  });
  return saisie(
    `Trouve le siècle de l’année ${year}. Écris-le.`,
    ecrituresSiecle(c),
    traps,
    'Compte les centaines, puis regarde si l’année finit par 00.',
    ['Souviens-toi : le Ier siècle va de l’année 1 à 100.', ...trouverSiecle(year), retiens(`le ${siecle(c)} siècle`)],
  );
};

const OBJETS_VITRINE = ['La clé', 'Le vase', 'La pièce', 'La lampe'] as const;

/** Niveau 5 : comparer les objets d’une vitrine, puis écrire le siècle de l’un d’eux, sans proposition. */
const siecles5: Generator = (rng) => {
  const years = distinctYears(rng, 4, 501, 200);
  const recent = rng.int(0, 1) === 0;
  const wanted = recent ? Math.max(...years) : Math.min(...years);
  const k = years.indexOf(wanted);
  // Une fois sur trois, l’année cherchée finit par 00 : elle reste dans sa tranche, donc à sa place.
  if (rng.int(0, 2) === 0) years[k] = Math.ceil(wanted / 100) * 100;
  const year = at(years, k);
  const c = centuryOf(year);
  const other = centuryOf(recent ? Math.min(...years) : Math.max(...years));
  const traps = [
    [c - 1, 'Tu as compté un siècle de moins. Le Ier siècle va de 1 à 100.'],
    [c + 1, 'Tu as compté un siècle de trop. Vérifie si l’année finit par 00.'],
    [
      other,
      recent
        ? 'C’est l’objet le plus ancien. Cherche le plus récent.'
        : 'C’est l’objet le plus récent. Cherche le plus ancien.',
    ],
  ] as const;
  const q = saisie(
    `Lis la vitrine. Écris le siècle de l’objet le plus ${recent ? 'récent' : 'ancien'}.`,
    ecrituresSiecle(c),
    traps.flatMap(([w, why]) => [siecle(w), `${w}e`, `${siecle(w)} siècle`].map((t) => [t, why] as const)),
    'Compare d’abord les quatre années. Cherche ensuite le siècle.',
    [
      `Cherche l’année la plus ${recent ? 'grande' : 'petite'} : ${year}.`,
      ...trouverSiecle(year),
      retiens(`le ${siecle(c)} siècle`),
    ],
  );
  return {
    ...q,
    figure: {
      kind: 'document',
      title: 'La vitrine du petit musée',
      lines: OBJETS_VITRINE.map((o, i) => `${o} : fabrication en ${years[i]}.`),
      credit: CREDIT,
    },
    targetSeconds: 60,
  };
};

// ——— Notion 2 : la frise chronologique ———

const FAITS_FRISE: readonly FaitSimple[] = [
  {
    q: 'À quoi sert une frise chronologique ?',
    a: 'à représenter le temps',
    wrong: [
      { label: 'à mesurer une distance', why: 'Pour une distance, on utilise une règle ou l’échelle d’une carte.' },
      { label: 'à montrer les rivières d’un pays', why: 'Pour les rivières, on regarde une carte.' },
    ],
    hint: 'Observe ce qui est écrit le long d’une frise.',
    how: ['Imagine une frise : un long dessin avec des dates.', 'Demande-toi ce que ces dates montrent.'],
  },
  {
    q: 'Quel mot désigne une durée de mille ans ?',
    a: 'un millénaire',
    wrong: [
      { label: 'un siècle', why: 'Un siècle dure cent ans.' },
      { label: 'une année', why: 'Une année dure douze mois seulement.' },
    ],
    hint: 'Compare les trois durées, de la plus courte à la plus longue.',
    how: ['Classe les trois mots, du plus court au plus long.', 'Cherche la durée qui vaut dix siècles.'],
  },
  {
    q: 'Quel mot désigne une durée de cent ans ?',
    a: 'un siècle',
    wrong: [
      { label: 'un millénaire', why: 'Un millénaire dure mille ans.' },
      { label: 'un mois', why: 'Un mois dure quelques semaines.' },
    ],
    hint: 'Pense au mot qu’on numérote avec des chiffres romains.',
    how: ['Écarte le mois : il est très court.', 'Choisis entre les deux grandes durées celle de cent ans.'],
  },
];

const LETTRES_FRISE = ['A', 'B', 'C', 'D'] as const;

/** Frise dessinée en texte : repères donnés dans l'ordre du temps. */
const frise = (title: string, marks: readonly string[]) => ({
  kind: 'document' as const,
  title,
  lines: ['Le temps avance de haut en bas sur cette frise.', ...marks.map((m) => `│ ${m}`), '▼'],
  credit: CREDIT,
});

/** Niveau 1 : lire sur une petite frise le repère le plus ancien ou le plus récent. */
function friseLecture(rng: Rng): QuestionDraft {
  const years = distinctYears(rng, 3, 101, 300).sort((a, b) => a - b);
  const recent = rng.int(0, 1) === 0;
  const k = recent ? 2 : 0;
  const answer = `le repère ${at(LETTRES_FRISE, k)}`;
  return {
    prompt: `Regarde la frise. Quel repère est le plus ${recent ? 'récent' : 'ancien'} ?`,
    figure: frise(
      'Petite frise',
      years.map((y, i) => `${y} : repère ${at(LETTRES_FRISE, i)}`),
    ),
    ...choice(
      rng,
      answer,
      [0, 1, 2]
        .filter((i) => i !== k)
        .map((i) => ({
          label: `le repère ${at(LETTRES_FRISE, i)}`,
          why: `Le repère ${at(LETTRES_FRISE, i)} est en ${years[i]} : il n’est pas le plus ${recent ? 'récent' : 'ancien'}.`,
        })),
    ),
    hint: 'Sur cette frise, le temps avance de haut en bas.',
    steps: [
      'Observe la frise : le temps avance de haut en bas.',
      recent
        ? 'Cherche la date tout en bas : c’est la plus récente.'
        : 'Cherche la date tout en haut : c’est la plus ancienne.',
      retiens(answer),
    ],
    targetSeconds: 25,
  };
}

const frise1: Generator = (rng) => (rng.int(0, 1) === 0 ? fait(rng, rng.pick(FAITS_FRISE)) : friseLecture(rng));

const frise2: Generator = (rng) => {
  if (rng.int(0, 2) === 0) {
    const q = association(
      rng,
      'Associe chaque mot du temps à ce qui lui correspond.',
      [
        ['Siècle', 'cent ans'],
        ['Millénaire', 'mille ans'],
        ['Frise chronologique', 'dessin du temps'],
      ],
      'Cherche d’abord les deux durées.',
      [],
    );
    return {
      ...q,
      steps: [
        'Commence par les deux mots qui sont des durées.',
        'Retiens : un siècle vaut 100 ans, un millénaire 1 000.',
        'Associe ainsi : **Siècle → cent ans ; Millénaire → mille ans ; Frise chronologique → dessin du temps**.',
      ],
    };
  }
  const start = rng.int(2, 8) * 100;
  const years = LETTRES_FRISE.map((_, i) => start + i * 300);
  const k = rng.int(0, 3);
  const year = at(years, k);
  const answer = `le repère ${at(LETTRES_FRISE, k)}`;
  return {
    prompt: `Lis la frise. Quel repère est placé entre ${year - 100} et ${year + 100} ?`,
    figure: frise(
      'Frise des repères',
      LETTRES_FRISE.map((l, i) => `${years[i]} : repère ${l}`),
    ),
    ...choice(
      rng,
      answer,
      LETTRES_FRISE.flatMap((l, i) =>
        i === k ? [] : [{ label: `le repère ${l}`, why: `Le repère ${l} est en ${years[i]}, hors de l’intervalle.` }],
      ),
    ),
    hint: 'Lis le nombre écrit devant chaque repère.',
    steps: [
      `Cherche une année placée entre ${year - 100} et ${year + 100}.`,
      'Lis les repères de haut en bas, un par un.',
      `Garde l’année ${year} : elle est entre les deux.`,
      retiens(answer),
    ],
    targetSeconds: 30,
  };
};

const frise3: Generator = (rng) => {
  if (rng.int(0, 1) === 0) {
    const years = distinctYears(rng, 4, 101, 300);
    const sorted = [...years].sort((a, b) => a - b).map(String);
    const q = ranger(
      rng,
      `Comme sur une frise, range ces années de la plus ancienne à la plus récente : ${liste(years.map(String))}.`,
      years.map((y) => ({ label: String(y), t: y })),
      'Cherche d’abord le plus petit nombre.',
      '',
    );
    return {
      ...q,
      steps: [
        'Cherche le plus petit nombre : c’est l’année la plus ancienne.',
        'Continue avec le plus petit des nombres qui restent.',
        rangeAinsi(sorted),
      ],
    };
  }
  const start = rng.int(1, 14) * 100;
  const hole = rng.int(1, 3);
  const years = Array.from({ length: 5 }, (_, i) => start + i * 100);
  const answer = at(years, hole);
  const q = saisie(
    `Complète la frise : quelle année se cache sous l’étoile (frise de ${start} à ${start + 400}) ?`,
    [String(answer), `en ${answer}`],
    [
      [String(answer - 100), 'C’est la date juste au-dessus de l’étoile. Avance de 100 ans.'],
      [String(answer + 100), 'C’est la date juste en dessous de l’étoile. Recule de 100 ans.'],
      [String(answer - 90), 'Ici, on avance de 100 en 100, pas de 10 en 10.'],
    ],
    'Regarde de combien on avance d’une date à la suivante.',
    [
      'Compare deux dates voisines : on avance de 100 ans.',
      `Pars de ${answer - 100}, juste au-dessus de l’étoile.`,
      `Ajoute 100 à ${answer - 100}.`,
      retiens(String(answer)),
    ],
  );
  return {
    ...q,
    figure: frise(
      'Frise graduée',
      years.map((y, i) => (i === hole ? '★' : String(y))),
    ),
  };
};

/** Un nombre en lettres : orthographe de 1990 (traits d’union), traditionnelle, ou sans trait d’union. */
function nombreEnLettres(n: number): string[] {
  const word = inWords(n);
  const classique = word
    .replace(/-(cents?|mille)(?=-|$)/g, ' $1')
    .replace(/\b(cents?|mille)-/g, '$1 ')
    .replace(/-et-/g, ' et ');
  return [...new Set([word, classique, word.replaceAll('-', ' ')])];
}

/** Écritures justes d’une durée : le nombre en chiffres ou en lettres, seul ou avec l’unité. */
function ecrituresDuree(n: number, unite: 'ans' | 'siècles'): string[] {
  const digits = [String(n), ...(n >= 1000 ? [`${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, '0')}`] : [])];
  const units = unite === 'ans' ? ['ans', 'années', 'annees'] : ['siècles', 'siecles'];
  return [...digits, ...nombreEnLettres(n)].flatMap((x) => [x, ...units.map((u) => `${x} ${u}`)]);
}

const frise4: Generator = (rng) => {
  const a = rng.int(2, 9) * 100 + rng.int(0, 1) * 50;
  const b = a + rng.int(3, 9) * 100;
  const gap = b - a;
  if (rng.int(0, 1) === 0) {
    return saisie(
      `Calcule : combien d’années séparent ${a} et ${b} ?`,
      ecrituresDuree(gap, 'ans'),
      [
        [String(a + b), 'Tu as ajouté. Pour une durée, on soustrait la date ancienne de la date récente.'],
        [String(gap / 100), 'Tu as compté les siècles. La question demande des années.'],
        [String(gap + 100), 'Cent ans de trop : vérifie ta soustraction.'],
      ],
      'Pars de la date la plus ancienne et avance jusqu’à l’autre.',
      [
        `Repère la date la plus ancienne : ${a}.`,
        'Soustrais-la de la date la plus récente.',
        `Calcule : ${b} − ${a} = ${gap}.`,
        retiens(`${gap} ans`),
      ],
    );
  }
  const siecles = gap / 100;
  return saisie(
    `Calcule : combien de siècles s’écoulent entre ${a} et ${b} ?`,
    ecrituresDuree(siecles, 'siècles'),
    [
      [String(gap), 'Ce sont des années. Un siècle vaut 100 ans.'],
      [String(siecles + 1), 'Tu as compté un bond de trop.'],
      [String(siecles - 1), 'Il manque un siècle : compte chaque bond de 100 ans.'],
    ],
    'Avance de 100 ans en 100 ans et compte les bonds.',
    [
      `Calcule d’abord les années : ${b} − ${a} = ${gap}.`,
      `Compte les paquets de 100 ans dans ${gap} ans.`,
      retiens(`${siecles} siècles`),
    ],
  );
};

/** Repères inventés d’un village imaginaire (signalés comme tels dans le document). */
const REPERES_INVENTES = [
  'Le pont de pierre est construit',
  'Le moulin du village ouvre',
  'La halle du marché est bâtie',
  'La fontaine est creusée',
  'Le grand chêne est planté',
  'La tour de guet est élevée',
  'La chapelle est terminée',
] as const;

const CHARLEMAGNE_FRISE = 'Charlemagne est couronné empereur';

interface Marque {
  readonly year: number;
  readonly text: string;
}

/** Frise de 4 à 6 repères, un seul par siècle ; `rondes` fixe les années qui finissent par 00. */
function friseVillage(rng: Rng, siecles: readonly number[], rondes: readonly number[]) {
  const noms = rng.shuffle([...REPERES_INVENTES]);
  const marques: Marque[] = [...siecles]
    .sort((a, b) => a - b)
    .map((c, i) => {
      const year = rondes.includes(c) ? c * 100 : (c - 1) * 100 + rng.int(11, 89);
      return { year, text: year === 800 ? CHARLEMAGNE_FRISE : at(noms, i) };
    });
  const charlemagne = marques.some((m) => m.year === 800);
  const figure = frise(
    'La frise d’un village imaginaire',
    marques.map((m) => `${m.year} : ${m.text}`),
  );
  const note = charlemagne
    ? 'Sauf Charlemagne (programme), ces repères sont inventés pour l’exercice.'
    : 'Ces repères sont inventés pour l’exercice.';
  return { marques, figure: { ...figure, lines: [note, ...figure.lines] } };
}

/** Niveau 5, en deux temps : trouver les années par le nom des repères, puis calculer la durée. */
function friseDuree(rng: Rng): QuestionDraft {
  const siecles = rng.shuffle([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]).slice(0, rng.int(4, 6));
  const { marques, figure } = friseVillage(rng, siecles, siecles.includes(8) ? [8] : []);
  const i = rng.int(0, marques.length - 3);
  const from = at(marques, i);
  const to = at(marques, rng.int(i + 2, marques.length - 1));
  const gap = to.year - from.year;
  const q = saisie(
    `Lis la frise, puis réponds. Combien d’années s’écoulent entre « ${from.text} » et « ${to.text} » ?`,
    ecrituresDuree(gap, 'ans'),
    [
      [String(from.year + to.year), 'Tu as ajouté les dates. Pour une durée, on soustrait.'],
      [String(gap + 100), 'Un siècle de trop : refais la soustraction.'],
      [String(gap + 10), 'Dix ans de trop : attention à la retenue.'],
      [String(gap - 100), 'Un siècle de moins : refais la soustraction.'],
    ],
    'Trouve d’abord l’année de chaque repère sur la frise.',
    [
      `Cherche le premier repère sur la frise : ${from.year}.`,
      `Cherche ensuite le second repère : ${to.year}.`,
      `Soustrais : ${to.year} − ${from.year} = ${gap}.`,
      retiens(`${gap} ans`),
    ],
  );
  return { ...q, figure, targetSeconds: 70 };
}

/** Niveau 5, en trois temps : trouver un repère par son siècle (année en 00 à la frontière), puis la durée. */
function friseSiecle(rng: Rng): QuestionDraft {
  const c = rng.int(8, 17);
  const autres = rng.shuffle([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].filter((x) => x < c - 1 || x > c + 1));
  const siecles = [c - 1, c, c + 1, ...autres.slice(0, rng.int(1, 3))];
  // L’année en 00 du siècle d’avant est toujours là ; le repère cherché finit parfois aussi par 00.
  const rondes = c === 8 || rng.int(0, 1) === 0 ? [c - 1, c] : [c - 1];
  const { marques, figure } = friseVillage(rng, siecles, rondes);
  const cible = at(
    marques.filter((m) => centuryOf(m.year) === c),
    0,
  );
  const frontiere = at(
    marques.filter((m) => m.year === (c - 1) * 100),
    0,
  );
  const autre = rng.pick(marques.filter((m) => m !== cible && m !== frontiere));
  const [ancien, recent] = autre.year < cible.year ? [autre, cible] : [cible, autre];
  const gap = recent.year - ancien.year;
  const piegeFrontiere = Math.abs(autre.year - frontiere.year);
  const q = saisie(
    `Lis la frise, puis réponds. Combien d’années séparent « ${autre.text} » et le repère du ${siecle(c)} siècle ?`,
    ecrituresDuree(gap, 'ans'),
    [
      [
        String(piegeFrontiere),
        `Tu as pris l’année ${frontiere.year} : finissant par 00, elle termine le ${siecle(c - 1)} siècle.`,
      ],
      [String(autre.year + cible.year), 'Tu as ajouté les dates. Pour une durée, on soustrait.'],
      [String(gap + 100), 'Un siècle de trop : refais la soustraction.'],
      [String(gap + 10), 'Dix ans de trop : attention à la retenue.'],
    ],
    'Trouve d’abord le repère du siècle demandé, avec les limites du siècle.',
    [
      `Écris les limites : ${bornes(c)}.`,
      `Lis les deux années sur la frise : ${cible.year} et ${autre.year}.`,
      `Soustrais : ${recent.year} − ${ancien.year} = ${gap}.`,
      retiens(`${gap} ans`),
    ],
  );
  return { ...q, figure, targetSeconds: 90 };
}

const frise5: Generator = (rng) => (rng.int(0, 1) === 0 ? friseDuree(rng) : friseSiecle(rng));

// ——— Notion 3 : avant et après J.-C. ———

const FAITS_JC: readonly FaitSimple[] = [
  {
    q: 'Que veut dire « av. J.-C. » ?',
    a: 'avant Jésus-Christ',
    wrong: [
      { label: 'après Jésus-Christ', why: '« Après » s’abrège « apr. », et non « av. ».' },
      { label: 'avant Jules César', why: 'Les lettres J.-C. désignent Jésus-Christ, pas Jules César.' },
    ],
    hint: 'Les lettres a et v commencent un petit mot de temps.',
    how: ['Regarde les deux premières lettres : a et v.', 'Rappelle-toi ce que veulent dire les lettres J.-C.'],
  },
  {
    q: 'Que veut dire « apr. J.-C. » ?',
    a: 'après Jésus-Christ',
    wrong: [
      { label: 'avant Jésus-Christ', why: '« Avant » s’abrège « av. », et non « apr. ».' },
      { label: 'après Jules César', why: 'Les lettres J.-C. désignent Jésus-Christ, pas Jules César.' },
    ],
    hint: 'Les lettres a, p et r commencent un petit mot de temps.',
    how: ['Regarde les trois premières lettres : a, p et r.', 'Rappelle-toi ce que veulent dire les lettres J.-C.'],
  },
  {
    q: 'À quel moment commence l’ère chrétienne ?',
    a: 'à la date supposée de la naissance de Jésus-Christ',
    wrong: [
      { label: 'au couronnement de Charlemagne', why: 'Charlemagne est couronné en 800 : l’ère a déjà commencé.' },
      { label: 'au début de la Révolution', why: 'La Révolution commence en 1789, bien après le début de l’ère.' },
    ],
    hint: 'Pense à ce que veut dire le mot « chrétienne ».',
    how: ['Cherche le nom caché dans le mot « chrétienne ».', 'Choisis le point de départ du compte des années.'],
  },
  {
    q: 'Quelle expression veut dire la même chose que « avant Jésus-Christ » ?',
    a: 'avant notre ère',
    wrong: [
      { label: 'de notre ère', why: '« De notre ère » désigne le temps après le point de départ.' },
      { label: 'à notre époque', why: '« À notre époque » veut dire aujourd’hui.' },
    ],
    hint: 'Cherche l’expression qui parle du temps d’avant le point de départ.',
    how: ['Repère le petit mot « avant » dans la question.', 'Choisis l’expression qui garde ce mot.'],
  },
];

/** Deux dates avant et deux après J.-C., toutes distinctes. */
function datesMelangees(rng: Rng): number[] {
  const avant = distinctYears(rng, 2, 100, 200).map((y) => -y);
  return rng.shuffle([...avant, ...distinctYears(rng, 2, 100, 200)]);
}

/** « 400 avant », « 150 après » : la forme courte des bulles. */
const court = (y: number) => (y < 0 ? `${-y} avant` : `${y} après`);

/** Écritures justes d’« avant J.-C. » après un nombre ou un siècle. */
const SUFFIXES_AV = [
  'av. J.-C.',
  'av J.-C.',
  'av. JC',
  'av JC',
  'avant J.-C.',
  'avant JC',
  'avant Jésus-Christ',
  'avant notre ère',
] as const;

const avecAvant = (forms: readonly string[]) => {
  // Le point final d’« av. J.-C. » est souvent oublié : la réponse reste juste.
  const suffixes = SUFFIXES_AV.flatMap((s) => (s.endsWith('.') ? [s, s.slice(0, -1)] : [s]));
  return forms.flatMap((f) => [f, ...suffixes.map((s) => `${f} ${s}`)]);
};

const siecleAvantForms = (c: number) => avecAvant(ecrituresSiecle(c));

/** Siècles voisins, la confusion classique. */
const siecleAvantPieges = (c: number, why: string) =>
  [c - 1, c + 1].flatMap((w) =>
    [siecle(w), `${w}e`, `${siecle(w)} siècle`, `${siecle(w)} siècle av. J.-C.`].map((t) => [t, why] as const),
  );

const jc1: Generator = (rng) => {
  if (rng.int(0, 1) === 0) return fait(rng, rng.pick(FAITS_JC));
  const year = rng.int(1, 9) * 100;
  const others = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => x * 100 + 50)).slice(0, 2);
  const answer = `${year} av. J.-C.`;
  return {
    prompt: 'Choisis la date placée avant Jésus-Christ.',
    ...choice(
      rng,
      answer,
      others.map((y) => ({ label: `${y} apr. J.-C.`, why: '« apr. » veut dire après : cette date est après.' })),
    ),
    hint: 'Lis les petites lettres écrites après chaque nombre.',
    steps: [
      'Cherche les lettres « av » : elles veulent dire avant.',
      'Écarte les dates notées « apr ».',
      retiens(answer),
    ],
    targetSeconds: 25,
  };
};

const jc2: Generator = (rng) => {
  const dates = datesMelangees(rng);
  const oldest = Math.min(...dates);
  return {
    prompt: 'Attention aux pièges ! Quelle date est la plus ancienne ?',
    ...choice(
      rng,
      apresJc(oldest),
      dates
        .filter((d) => d !== oldest)
        .map((d) => ({
          label: apresJc(d),
          why:
            d < 0
              ? 'Avant J.-C., plus le nombre est grand, plus la date est ancienne.'
              : 'Une date avant J.-C. est plus ancienne.',
        })),
    ),
    hint: 'Regarde d’abord les dates avant J.-C. Elles se comptent à rebours.',
    steps: [
      'Garde les dates notées « av » : elles sont les plus anciennes.',
      'Compare leurs nombres : choisis le plus grand, car on compte à rebours.',
      retiens(apresJc(oldest)),
    ],
    targetSeconds: 30,
  };
};

const jc3: Generator = (rng) => {
  const dates = datesMelangees(rng);
  const sorted = [...dates].sort((a, b) => a - b);
  const q = ranger(
    rng,
    point(`Range ces dates, de la plus ancienne à la plus récente : ${liste(dates.map(apresJc))}`),
    dates.map((d) => ({ label: apresJc(d), t: d })),
    'Place d’abord toutes les dates avant J.-C.',
    '',
  );
  return {
    ...q,
    steps: [
      'Place d’abord les dates « avant », du plus grand nombre au plus petit.',
      'Ajoute ensuite les dates « après », du plus petit au plus grand.',
      rangeAinsi(sorted.map(court)),
    ],
  };
};

const jc4: Generator = (rng) => {
  if (rng.int(0, 1) === 0) {
    const recent = rng.int(1, 4) * 100;
    const ancien = recent + rng.int(1, 5) * 100 + 50;
    const gap = ancien - recent;
    return saisie(
      `Calcule : combien d’années séparent ${ancien} av. J.-C. et ${recent} av. J.-C. ?`,
      ecrituresDuree(gap, 'ans'),
      [
        [String(ancien + recent), 'Les deux dates sont du même côté : on soustrait, on n’ajoute pas.'],
        [String(gap + 100), 'Cent ans de trop : refais la soustraction.'],
        [String(ancien), 'C’est la date elle-même. Cherche la durée entre les deux.'],
      ],
      'Les deux dates sont avant J.-C. Cherche l’écart entre les deux nombres.',
      [
        'Vérifie que les deux dates sont avant J.-C.',
        'Soustrais le petit nombre du grand nombre.',
        `Calcule : ${ancien} − ${recent} = ${gap}.`,
        retiens(`${gap} ans`),
      ],
    );
  }
  const year = rng.int(0, 2) === 0 ? rng.int(2, 9) * 100 : rng.int(101, 999);
  const c = centuryOf(year);
  return saisie(
    `Trouve le siècle de l’année ${year} av. J.-C. Écris-le.`,
    siecleAvantForms(c),
    siecleAvantPieges(c, 'Ce n’est pas ce siècle. Avant J.-C., le Ier va de 100 à 1, le IIe de 200 à 101.'),
    'Avant J.-C., les siècles se comptent aussi à partir du point de départ.',
    [
      'Compte à rebours : le Ier siècle va de 100 à 1.',
      year % 100 === 0
        ? `Regarde ${year} : cette année ouvre le siècle numéro ${c}.`
        : `Efface les deux derniers chiffres de ${year}, puis ajoute 1.`,
      `Vérifie : le ${siecle(c)} siècle va de ${c * 100} à ${(c - 1) * 100 + 1}.`,
      retiens(`${siecle(c)} siècle av. J.-C.`),
    ],
  );
};

interface Objet {
  readonly nom: string;
  /** Année avant J.-C. (nombre positif). */
  readonly year: number;
}

/**
 * Niveau 5 : une seule date est donnée, les autres se déduisent du texte. Tout reste avant J.-C. : aucune durée
 * n’est calculée à cheval sur le changement d’ère.
 */
const jc5: Generator = (rng) => {
  const [n0, n1, n2, n3] = rng.shuffle([
    'l’amphore',
    'la statue',
    'le vase',
    'la tablette',
    'la lampe',
    'la coupe',
  ]) as [string, string, string, string];
  const base = rng.int(5, 9) * 50;
  const d1 = rng.int(1, 4) * 50;
  const d2 = rng.int(1, 4) * 50;
  const d3 = rng.int(1, 3) * 50;
  const repere: Objet = { nom: n0, year: base };
  const avant: Objet = { nom: n1, year: base + d1 };
  const apres: Objet = { nom: n2, year: base - d2 };
  // Deux calculs à enchaîner.
  const chaine: Objet = { nom: n3, year: base + d1 + d3 };
  const maj = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const av = (y: number) => `${y} av. J.-C.`;
  const figure = {
    kind: 'document' as const,
    title: 'Quatre objets imaginaires au musée',
    lines: rng.shuffle([
      point(`${maj(repere.nom)} date de ${av(repere.year)}`),
      `On a fabriqué ${avant.nom} ${d1} ans avant ${repere.nom}.`,
      `On a fabriqué ${apres.nom} ${d2} ans après ${repere.nom}.`,
      `On a fabriqué ${chaine.nom} ${d3} ans avant ${avant.nom}.`,
    ]),
    credit: CREDIT,
  };
  const depart = `Pars de la seule date donnée : ${base}.`;
  const calculAvant = `Ajoute pour « avant » : ${base} + ${d1} = ${avant.year} (${avant.nom}).`;
  const calculChaine = `Ajoute encore : ${avant.year} + ${d3} = ${chaine.year} (${chaine.nom}).`;
  const hint = 'Pars de la seule date donnée. Avant J.-C., les années se comptent à rebours.';
  const mode = rng.pick(['annee', 'siecle', 'ranger'] as const);
  if (mode === 'ranger') {
    const tous = [repere, avant, apres, chaine];
    const q = ranger(
      rng,
      'Lis le texte, puis range ces objets, du plus ancien au plus récent.',
      tous.map((o) => ({ label: maj(o.nom), t: -o.year })),
      hint,
      '',
    );
    return {
      ...q,
      steps: [
        depart,
        `Ajoute pour « avant » : ${base} + ${d1} = ${avant.year}, puis ${avant.year} + ${d3} = ${chaine.year}.`,
        `Enlève pour « après » : ${base} − ${d2} = ${apres.year}.`,
        `Range du plus grand nombre au plus petit : **${[...tous]
          .sort((a, b) => b.year - a.year)
          .map((o) => maj(o.nom))
          .join(' → ')}**.`,
      ],
      figure,
      targetSeconds: 90,
    };
  }
  if (mode === 'annee') {
    const y = chaine.year;
    const q = saisie(
      `Lis le texte, puis réponds. En quelle année avant J.-C. a-t-on fabriqué ${chaine.nom} ?`,
      avecAvant([String(y)]),
      [
        [String(avant.year - d3), 'Avant J.-C., « plus tôt » veut dire un nombre plus grand : on ajoute.'],
        [String(avant.year), `C’est la date pour ${avant.nom}. Il reste un calcul.`],
        [String(base + d3), `Tu n’es pas parti du bon objet. Le texte compare avec ${avant.nom}.`],
      ],
      hint,
      [depart, calculAvant, calculChaine, retiens(av(y))],
    );
    return { ...q, figure, targetSeconds: 90 };
  }
  const target = rng.pick([avant, chaine]);
  const c = centuryOf(target.year);
  const calcul = target === chaine ? `Ajoute pour « avant » : ${base} + ${d1} + ${d3} = ${target.year}.` : calculAvant;
  const q = saisie(
    `Lis le texte, puis réponds. Dans quel siècle avant J.-C. a-t-on fabriqué ${target.nom} ?`,
    siecleAvantForms(c),
    siecleAvantPieges(c, `Calcule d’abord l’année. Avant J.-C., le Ier siècle va de 100 à 1, le IIe de 200 à 101.`),
    hint,
    [
      depart,
      calcul,
      `Trouve le siècle : le ${siecle(c)} va de ${c * 100} à ${(c - 1) * 100 + 1}.`,
      retiens(`${siecle(c)} siècle av. J.-C.`),
    ],
  );
  return { ...q, figure, targetSeconds: 90 };
};

// ——— Notion 4 : ordonner des événements ———

interface Evenement extends Repere {
  /** Nom court, pour l’énoncé et les bulles. */
  readonly court: string;
  /** Date écrite comme dans le programme. */
  readonly date: string;
  readonly preuve: Preuve;
}

const MIGRATIONS: Evenement = {
  court: 'les peuples venus de l’est',
  label: 'Des peuples venus de l’est commencent à s’installer dans l’empire romain',
  date: 'à partir du IVe siècle',
  t: 350,
  preuve: PREUVES.migrations,
};
const CHUTE: Evenement = {
  court: 'la fin de l’empire',
  label: 'L’empire romain d’Occident s’effondre',
  date: 'vers la fin du Ve siècle',
  t: 480,
  preuve: PREUVES.migrations,
};
const CHARLEMAGNE: Evenement = {
  court: 'Charlemagne',
  label: 'Charlemagne est couronné empereur',
  date: 'en 800',
  t: 800,
  preuve: PREUVES.charlemagne,
};
const LOUIS_IX: Evenement = {
  court: 'Louis IX',
  label: 'Louis IX est roi',
  date: 'au XIIIe siècle',
  t: 1250,
  preuve: PREUVES.louisIx,
};
const REVOLUTION: Evenement = {
  court: 'la Révolution',
  label: 'La Révolution commence',
  date: 'en 1789',
  t: 1789,
  preuve: PREUVES.revolution,
};
const NAPOLEON: Evenement = {
  court: 'Napoléon',
  label: 'Napoléon est proclamé empereur des Français',
  date: 'en 1804',
  t: 1804,
  preuve: PREUVES.napoleon,
};

export const EVENEMENTS: readonly Evenement[] = [MIGRATIONS, CHUTE, CHARLEMAGNE, LOUIS_IX, REVOLUTION, NAPOLEON];

const dated = (e: Evenement) => `${e.label} (${e.date})`;
const bref = (e: Evenement) => `${e.court}, ${e.date}`;
const chrono = (list: readonly Evenement[]) => [...list].sort((a, b) => a.t - b.t);
const XIII = 'Souviens-toi : le XIIIe siècle va de 1201 à 1300.';

const FAITS_ORDRE: readonly FaitSimple[] = [
  {
    q: 'Que veut dire ranger des événements dans l’ordre chronologique ?',
    a: 'les ranger selon le moment où ils arrivent',
    wrong: [
      { label: 'les ranger par ordre alphabétique', why: 'L’alphabet range les lettres, pas les moments.' },
      { label: 'les ranger du plus court nom au plus long', why: 'La longueur du nom ne dit rien du temps.' },
    ],
    hint: 'Pense au temps qui passe.',
    how: ['Pense à une histoire : un début, une suite, une fin.', 'Demande-toi ce qui arrive avant et après.'],
  },
  {
    q: 'Quel mot désigne des faits rangés dans l’ordre du temps ?',
    a: 'une chronologie',
    wrong: [
      { label: 'un millénaire', why: 'Un millénaire est une durée de mille ans.' },
      { label: 'une carte', why: 'Une carte montre des lieux, pas un ordre dans le temps.' },
    ],
    hint: 'Pense à des faits placés les uns après les autres.',
    how: ['Écarte ce qui montre des lieux.', 'Écarte aussi ce qui est seulement une durée.'],
  },
];

const premier: Generator = (rng) => {
  const choisis = rng.shuffle([...EVENEMENTS]).slice(0, 3);
  const [first, ...apres] = chrono(choisis) as [Evenement, ...Evenement[]];
  return {
    prompt: 'Lequel de ces événements arrive en premier ?',
    ...choice(
      rng,
      dated(first),
      apres.map((e) => ({ label: dated(e), why: `Cet événement arrive plus tard : ${e.date}.` })),
    ),
    hint: 'Compare les siècles et les années entre parenthèses.',
    steps: [
      'Lis la date écrite entre parenthèses après chaque événement.',
      ...(choisis.includes(LOUIS_IX) ? [XIII] : []),
      'Cherche la date la plus ancienne des trois.',
      retiens(bref(first)),
    ],
    targetSeconds: 25,
  };
};

const ordre1: Generator = (rng) => (rng.int(0, 3) === 0 ? fait(rng, rng.pick(FAITS_ORDRE)) : premier(rng));

const ordre2: Generator = (rng) => {
  const i = rng.int(1, 3);
  const ref = at(EVENEMENTS, i);
  const next = at(EVENEMENTS, i + 1);
  // Au moins un événement antérieur parmi les pièges.
  const avant = rng.pick(EVENEMENTS.slice(0, i));
  const reste = EVENEMENTS.filter((e) => e !== ref && e !== next && e !== avant);
  const autres = [avant, ...rng.shuffle(reste).slice(0, 2)];
  return {
    prompt: `Attention aux pièges ! Parmi ces événements, lequel arrive le premier après : « ${dated(ref)} » ?`,
    ...choice(
      rng,
      dated(next),
      autres.map((e) => ({
        label: dated(e),
        why: e.t < ref.t ? 'Cet événement arrive avant.' : 'Il arrive après, mais un autre arrive plus tôt.',
      })),
    ),
    hint: 'Écarte ce qui est avant, puis prends le plus proche.',
    steps: [
      `Repère la date de départ : ${ref.date}.`,
      'Écarte les événements plus anciens que cette date.',
      'Garde le plus proche parmi ceux qui restent.',
      retiens(bref(next)),
    ],
    targetSeconds: 35,
  };
};

const ordre3: Generator = (rng) => {
  const choisis = rng.shuffle([...EVENEMENTS]).slice(0, 4);
  const q = ranger(
    rng,
    `Range du plus ancien au plus récent : ${liste(choisis.map((e) => e.court))}.`,
    choisis.map((e) => ({ label: dated(e), t: e.t })),
    'Lis les dates : un siècle en chiffres romains se compare aux années.',
    '',
  );
  return {
    ...q,
    steps: [
      'Lis la date écrite entre parenthèses après chaque événement.',
      ...(choisis.includes(LOUIS_IX) ? [XIII] : ['Commence par la date la plus ancienne.']),
      rangeAinsi(chrono(choisis).map((e) => e.court)),
    ],
  };
};

const ordre4: Generator = (rng) => {
  const choisis = rng.shuffle([...EVENEMENTS]).slice(1);
  const noms = liste(choisis.map((e) => e.court));
  const sorted = chrono(choisis);
  if (rng.int(0, 1) === 0) {
    const q = ranger(
      rng,
      `Sans les dates, remets en ordre : ${noms}.`,
      choisis.map((e) => ({ label: e.label, t: e.t })),
      'Souviens-toi : l’empire romain, puis les rois, puis la Révolution.',
      '',
    );
    return {
      ...q,
      steps: [
        'Retrouve de mémoire la date de chaque événement.',
        `Compare ces dates : ${sorted.map((e) => e.date).join(' ; ')}.`,
        rangeAinsi(sorted.map((e) => e.court)),
      ],
    };
  }
  const q = association(
    rng,
    `Sans aide, associe chaque événement à sa date : ${noms}.`,
    choisis.map((e) => [e.label, e.date] as const),
    'Commence par les dates dont tu es sûr.',
    [],
  );
  const paires = (list: readonly Evenement[]) => list.map((e) => `${e.court} → ${e.date}`).join(' ; ');
  return {
    ...q,
    steps: [
      'Commence par les événements dont tu connais bien la date.',
      `Associe les plus anciens : **${paires(sorted.slice(0, 2))}**.`,
      `Associe les suivants : **${paires(sorted.slice(2))}**.`,
    ],
  };
};

/** Événements inventés du récit (signalés comme tels). */
const INVENTIONS = [
  'Le moulin du village ouvre',
  'La halle du marché est bâtie',
  'Le pont de pierre est construit',
  'La fontaine est creusée',
  'La tour de guet est élevée',
  'Le grand chêne est planté',
] as const;

/** Intervalle entre deux repères du programme, où un seul événement inventé peut se placer. */
interface Creux {
  /** Position dans le temps. */
  readonly t: number;
  /** Siècles entièrement compris dans l’intervalle. */
  readonly siecles: readonly number[];
  /** Indice par comparaison avec les repères voisins. */
  readonly relatif: string;
}

const CREUX: readonly Creux[] = [
  { t: 650, siecles: [6, 7], relatif: 'avant le couronnement de Charlemagne' },
  { t: 1050, siecles: [10, 11, 12], relatif: 'après le couronnement de Charlemagne, mais avant le règne de Louis IX' },
  { t: 1500, siecles: [14, 15, 16, 17], relatif: 'après le règne de Louis IX, mais avant la Révolution' },
];

const ordre5: Generator = (rng) => {
  // Les dates des repères du programme sont à retrouver de mémoire ; les autres se déduisent d’indices.
  const programme = [CHARLEMAGNE, LOUIS_IX, REVOLUTION, ...(rng.int(0, 1) === 0 ? [NAPOLEON] : [])];
  const [creuxSiecle, creuxRelatif] = rng.shuffle([...CREUX]) as [Creux, Creux, Creux];
  const [nomSiecle, nomRelatif] = rng.shuffle([...INVENTIONS]) as [string, string, ...string[]];
  const c = rng.pick(creuxSiecle.siecles);
  const recit = [
    ...programme.map((e) => `Repère du programme : « ${e.label} ».`),
    `Événement inventé : « ${nomSiecle} », au ${siecle(c)} siècle.`,
    `Événement inventé : « ${nomRelatif} », ${creuxRelatif.relatif}.`,
  ];
  const tous: readonly Repere[] = [
    ...programme,
    { label: nomSiecle, t: creuxSiecle.t },
    { label: nomRelatif, t: creuxRelatif.t },
  ];
  const q = ranger(
    rng,
    'Lis le récit : la guide mélange tout ! Remets les événements dans l’ordre du temps.',
    tous,
    'Retrouve les dates que tu connais. Place ensuite les événements inventés grâce aux indices.',
    '',
  );
  return {
    ...q,
    steps: [
      `Retrouve les dates : ${programme.map((e) => `${e.court} ${e.date}`).join(' ; ')}.`,
      `Place « ${nomSiecle} » : ${bornes(c)}.`,
      `Place « ${nomRelatif} » : ${creuxRelatif.relatif}.`,
      rangeAinsi(
        [...tous].sort((a, b) => a.t - b.t).map((r) => programme.find((e) => e.label === r.label)?.court ?? r.label),
      ),
    ],
    figure: {
      kind: 'document',
      title: 'Le récit dans le désordre',
      lines: rng.shuffle(recit),
      credit: 'Texte écrit pour l’exercice ; les repères viennent du programme du cycle 3.',
    },
    targetSeconds: 90,
  };
};

// ——— Chapitre ———

export const SKILLS: readonly Skill[] = [
  skill(
    'hcm1-siecles-romains',
    'Siècles et chiffres romains',
    {
      memo: [
        'Un **siècle** dure 100 ans ; en **chiffres romains**, I vaut 1, V vaut 5, X vaut 10.',
        'Ajoute un I placé après (VI = 6), enlève un I placé avant (IV = 4).',
        'Le Ier siècle va de 1 à 100, le IIe de 101 à 200.',
      ],
      sens: {
        type: 'usage',
        text: 'Pour lire un siècle dans un livre : son numéro s’écrit le plus souvent en chiffres romains.',
        source: 'tlfi-siecle',
        citation:
          "Quand l'adj. numéral ordinal est écrit en chiffres, il l'est gén. en chiffres romains plutôt qu'en chiffres arabes.",
      },
      preuves: [
        PREUVES.siecle,
        PREUVES.bornes,
        PREUVES.lettres,
        PREUVES.quatre,
        PREUVES.neuf,
        PREUVES.quatorze,
        PREUVES.siecleRomain,
      ],
    },
    [siecles1, siecles2, siecles3, siecles4, siecles5],
  ),
  skill(
    'hcm1-frise-chronologique',
    'La frise chronologique',
    {
      memo: [
        'La **frise chronologique** est un dessin qui montre le temps.',
        'Sur nos frises, lis de haut en bas : du plus ancien au plus récent.',
        'Pour une durée, soustrais : un **siècle** vaut 100 ans, un **millénaire** 1 000.',
      ],
      sens: {
        type: 'usage',
        text: 'En histoire, les frises chronologiques te montrent le temps, à différentes échelles.',
        source: 'cycle3-2020',
        citation:
          'Utiliser des documents donnant à voir une représentation du temps (dont les frises chronologiques), à différentes échelles',
      },
      preuves: [
        PREUVES.frise,
        PREUVES.siecle,
        PREUVES.millenaire,
        PREUVES.charlemagne,
        PREUVES.revolution,
        PREUVES.napoleon,
      ],
    },
    [frise1, frise2, frise3, frise4, frise5],
  ),
  skill(
    'hcm1-avant-apres-jc',
    'Avant et après J.-C.',
    {
      memo: [
        'L’**ère chrétienne** commence à la naissance supposée de Jésus-Christ (**J.-C.**).',
        'Avant elle, compte à rebours : 500 est plus ancien que 100.',
        'Après elle, plus le nombre est grand, plus la date est récente.',
      ],
      sens: {
        type: 'savais-tu',
        text: 'L’ère chrétienne part de la naissance du Christ, mais cette date est seulement présumée !',
        source: 'academie-ere',
        citation: 'L’ère chrétienne commence à la date présumée de la naissance du Christ',
      },
      preuves: [PREUVES.ere, PREUVES.jc, PREUVES.siecle, PREUVES.charlemagne, PREUVES.revolution],
    },
    [jc1, jc2, jc3, jc4, jc5],
  ),
  skill(
    'hcm1-ordonner-evenements',
    'Ordonner des événements',
    {
      memo: [
        'La **chronologie** range chaque **événement** dans l’ordre du temps.',
        'Après J.-C., la plus petite date vient en premier : 800 avant 1789.',
        'Repères : Charlemagne en 800, Louis IX au XIIIe siècle, la Révolution en 1789.',
      ],
      sens: {
        type: 'metier',
        text: 'La chronologie est aussi une science : elle cherche les dates des événements de l’histoire.',
        source: 'academie-chronologie',
        citation: 'Science qui a pour objet la datation des évènements historiques.',
      },
      preuves: [PREUVES.ordonner, PREUVES.chronologie, ...EVENEMENTS.map((e) => e.preuve)],
    },
    [ordre1, ordre2, ordre3, ordre4, ordre5],
  ),
];
