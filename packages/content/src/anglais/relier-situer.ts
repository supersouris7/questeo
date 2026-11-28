import type { Chapter, Level, QuestionDraft, Sens, Skill } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import { at, some } from './temps.ts';
import { coin } from './futur.ts';
import { document, ok, textTraps, typed } from './outils-lot05.ts';
import type { TextTrap } from './outils-5e.ts';

/**
 * Anglais 5e — « Relier et situer » (lot an-5e-05, docs/adr/0034). Programme d'anglais du collège (arrêté du 5 mai
 * 2025) ; règles et formes : British Council (voir relier-situer-faits.ts : chaque fait y porte sa source et sa
 * citation).
 */
const PROGRAMME = 'Programme d’anglais du collège (arrêté du 5 mai 2025), classe de 5e';
const source = (detail: string, pages?: string) =>
  `${PROGRAMME} — ${detail}.${pages ? ` Règles : British Council, ${pages}.` : ''}`;
const PROG = 'anglais-college-2025';
const sens = (type: Sens['type'], text: string, sourceId: string, citation: string): Sens => ({
  type,
  text,
  source: sourceId,
  citation,
});

/** Mots cités par plusieurs questions d’un document, avec leurs écritures acceptées. */
const blanksOf = (rows: readonly (readonly string[])[]) =>
  rows.map((accepted) => ({ mode: 'text' as const, accepted }));

// ——— 1. but, whereas, however ———
export type Link = 'but' | 'whereas' | 'however';
export interface Joined {
  /** Début de la phrase, avec sa ponctuation. */
  readonly start: string;
  /** Fin de la phrase. */
  readonly end: string;
}
/** Phrase dont le sens français départage les mots : « whereas » resterait grammatical là où l’on attend « mais ». */
export interface Translated extends Joined {
  readonly fr: string;
}
const joined = (start: string, end: string): Joined => ({ start, end });
const translated = (start: string, end: string, fr: string): Translated => ({ start, end, fr });
/** Une même personne : une idée vient contredire l’autre. */
export const CONCESSIONS: readonly Translated[] = [
  translated('I am tired,', 'I want to finish the game.', 'Je suis fatigué, mais je veux finir la partie.'),
  translated('She wants to play,', 'she has homework.', 'Elle veut jouer, mais elle a des devoirs.'),
  translated('My bike is old,', 'it is very fast.', 'Mon vélo est vieux, mais il est très rapide.'),
  translated('I want to come,', 'I am busy today.', 'Je veux venir, mais je suis occupé aujourd’hui.'),
  translated('The film is long,', 'it is not boring.', 'Le film est long, mais il n’est pas ennuyeux.'),
  translated('He is small,', 'he is very strong.', 'Il est petit, mais il est très fort.'),
  translated(
    'I like this song,',
    'I don’t know the words.',
    'J’aime cette chanson, mais je ne connais pas les paroles.',
  ),
];
/** Deux sujets que l’on compare. */
export const COMPARISONS: readonly Joined[] = [
  joined('My brother likes football,', 'my sister prefers tennis.'),
  joined('London is huge,', 'my town is tiny.'),
  joined('Lisa gets up early,', 'Emir gets up late.'),
  joined('Cats like to sleep,', 'dogs love to run.'),
  joined('Maya walks to school,', 'Tom takes the bus.'),
  joined('In Spain it is hot,', 'in Iceland it is cold.'),
  joined('My room is tidy,', 'my brother’s room is a mess.'),
];
/** Une seconde idée, après un point-virgule, qui s’oppose à la première. */
export const HOWEVERS: readonly Translated[] = [
  translated('It was raining;', 'we played outside.', 'Il pleuvait ; cependant, nous avons joué dehors.'),
  translated(
    'The museum was closed;',
    'we saw the garden.',
    'Le musée était fermé ; cependant, nous avons vu le jardin.',
  ),
  translated(
    'The test was hard;',
    'I did my best.',
    'Le contrôle était difficile ; cependant, j’ai fait de mon mieux.',
  ),
  translated(
    'We were very late;',
    'the film had not started.',
    'Nous étions très en retard ; cependant, le film n’avait pas commencé.',
  ),
  translated('The castle is old;', 'it is still beautiful.', 'Le château est vieux ; cependant, il est toujours beau.'),
  translated(
    'They did not win;',
    'they had a great day.',
    'Ils n’ont pas gagné ; cependant, ils ont passé une super journée.',
  ),
  translated('The shop is far;', 'we can walk there.', 'Le magasin est loin ; cependant, nous pouvons y aller à pied.'),
];

const LINK_WHY: Readonly<Record<string, string>> = {
  but: 'but veut dire « mais » : ce n’est pas le mot attendu dans cette phrase.',
  whereas: 'whereas veut dire « alors que » : ce n’est pas le mot attendu dans cette phrase.',
  however: 'however veut dire « cependant » : ce n’est pas le mot attendu dans cette phrase.',
  because: 'because donne une cause : il ne dit pas le contraire.',
  so: 'so donne une conséquence : il ne dit pas le contraire.',
  and: 'and ajoute une idée : il ne marque pas l’opposition.',
};
const wrongs = (...words: readonly string[]) => words.map((w) => ({ label: w, why: LINK_WHY[w.toLowerCase()] ?? '' }));
const show = (j: Joined, gap = '…') => `${j.start} ${gap}${j.start.endsWith(',') ? '' : ','} ${j.end}`;
/** Repères des trous d’un document : « (1) … (2) … ». */
const numbered = (n: number) => [...Array.from({ length: n }, (_, i) => `${i === 0 ? '' : ' '}(${i + 1}) `), ''];

function linkFirst(rng: Rng): QuestionDraft {
  const j = rng.pick(CONCESSIONS);
  const { answer, traps } = choice(rng, 'but', wrongs('and', 'because'));
  return {
    prompt: `Choisis le mot qui oppose les deux idées : « ${show(j)} »`,
    answer,
    traps,
    hint: 'Cherche le mot qui dit « pourtant, il y a une différence ».',
    steps: [
      'Lis les deux parties de la phrase.',
      'Remarque que la seconde idée surprend après la première.',
      'Choisis : **but**.',
    ],
  };
}

function linkPick(rng: Rng): QuestionDraft {
  const kind = rng.pick(['but', 'whereas', 'however'] as const);
  const j = rng.pick(kind === 'but' ? CONCESSIONS : kind === 'whereas' ? COMPARISONS : HOWEVERS);
  const { answer, traps } = choice(rng, kind, wrongs('because', 'so', 'and'));
  return {
    prompt: `Choisis le mot qui marque l’opposition et respecte la ponctuation : « ${show(j)} »`,
    answer,
    traps,
    hint: 'Regarde le signe avant le trou, puis le signe après le trou.',
    steps: [
      'Repère la ponctuation autour du trou.',
      'Garde seulement un mot qui oppose deux idées.',
      `Choisis : **${kind}**.`,
    ],
  };
}

const MEANING: Readonly<Record<Link, string>> = { but: 'mais', whereas: 'alors que', however: 'cependant' };
const POOL: Readonly<Record<Link, readonly Joined[]>> = {
  but: CONCESSIONS,
  whereas: COMPARISONS,
  however: HOWEVERS,
};

function linkMeaning(rng: Rng): QuestionDraft {
  const kind = rng.pick(['but', 'whereas', 'however'] as const);
  const j = rng.pick(POOL[kind]);
  return {
    prompt: `Écris le mot du cours qui veut dire « ${MEANING[kind]} » : « ${show(j)} »`,
    answer: typed([kind]),
    traps: textTraps(
      [kind],
      (['but', 'whereas', 'however'] as const)
        .filter((l) => l !== kind)
        .map((l) => ({ text: l, why: LINK_WHY[l] ?? '' })),
    ),
    hint: 'Traduis la phrase entière en français, puis retrouve le mot de liaison.',
    steps: [
      'Retrouve les trois mots de contraste du mémo.',
      `Cherche celui qui se traduit par « ${MEANING[kind]} ».`,
      `Écris : **${kind}**.`,
    ],
  };
}

/** Saisie en document : la phrase française donne le sens. Pas de comparaison ici (« but » y serait juste aussi). */
type Typed = 'but' | 'however';
const TYPED: readonly Typed[] = ['but', 'however'];
const TYPED_POOL: Readonly<Record<Typed, readonly Translated[]>> = { but: CONCESSIONS, however: HOWEVERS };

/**
 * Saisie sans traduction : le mot se déduit de la phrase anglaise seule. On garde les phrases où la seconde idée
 * contrarie un souhait ou un goût (« whereas » n’y convient pas).
 */
const ALONE_STARTS: readonly string[] = ['I am tired,', 'She wants to play,', 'I want to come,', 'I like this song,'];
export const ALONE_POOL: Readonly<Record<Typed, readonly Joined[]>> = {
  but: CONCESSIONS.filter((j) => ALONE_STARTS.includes(j.start)),
  however: HOWEVERS,
};
const ALONE_WHY: Readonly<Record<Typed, readonly TextTrap[]>> = {
  but: [
    {
      text: 'whereas',
      why: 'whereas veut dire « alors que » : ici, la seconde idée contrarie la première (« mais »).',
    },
    { text: 'however', why: 'however suit un point ou un point-virgule : ici, une virgule précède le trou.' },
  ],
  however: [
    { text: 'but', why: 'Après ce point-virgule, avec une virgule derrière le trou, le cours emploie however.' },
    {
      text: 'whereas',
      why: 'whereas veut dire « alors que » : il ne convient pas entre ce point-virgule et la virgule.',
    },
  ],
};

function linkAlone(rng: Rng): QuestionDraft {
  const kind = rng.pick(TYPED);
  const j = rng.pick(ALONE_POOL[kind]);
  return {
    prompt: `Complète avec le mot de contraste du cours : « ${show(j)} »`,
    answer: typed([kind]),
    traps: textTraps([kind], ALONE_WHY[kind]),
    hint: 'Comprends les deux idées, puis regarde la ponctuation autour du trou.',
    steps: [
      'Traduis toi-même les deux idées de la phrase.',
      'Regarde le signe avant le trou, puis le signe après le trou.',
      `Écris : **${kind}**.`,
    ],
  };
}

const NAMES = ['Ana', 'Lisa', 'Maya', 'Tom', 'Emir', 'Paul'] as const;

function linkDocument(rng: Rng): QuestionDraft {
  const name = rng.pick(NAMES);
  const rows = rng.shuffle(TYPED.flatMap((link) => some(rng, TYPED_POOL[link], 2).map((j) => ({ j, link }))));
  return {
    prompt: 'Lis le message et sa traduction, puis complète chaque trou avec le mot de contraste du cours.',
    figure: document(
      `Message from ${name}`,
      rows.flatMap((r, i) => [show(r.j, `(${i + 1})`), `= ${r.j.fr}`]),
    ),
    answer: { kind: 'cloze', parts: numbered(rows.length), blanks: blanksOf(rows.map((r) => [r.link])) },
    hint: 'Pour chaque trou, relis la phrase française placée en dessous.',
    steps: [
      'Lis chaque phrase française avant de remplir son trou.',
      'Associe « mais » et « cependant » au bon mot anglais.',
      ok(rows.map((r) => r.link)),
    ],
  };
}

const linkSkill: Skill = {
  id: 'a5-contraste',
  title: 'but, whereas, however : opposer deux idées',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'usage',
      'Pour exprimer une opposition ou un contraste entre deux idées.',
      PROG,
      'Exprimer une opposition, une concession ou un contraste : but, whereas, however, or, etc.',
    ),
  ],
  lesson: {
    memo: [
      'Un **contraste** oppose deux idées : but (mais), whereas (alors que), however (cependant).',
      'however peut suivre un point ou un point-virgule, avec une virgule derrière lui.',
      'Exemple : « The bus was slow; however, we arrived on time. »',
    ],
    source: source('exprimer une opposition, une concession ou un contraste'),
    sources: [PROG],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return linkFirst(rng);
    if (level === 2) return linkPick(rng);
    if (level === 3) return linkMeaning(rng);
    if (level === 4) return linkAlone(rng);
    return linkDocument(rng);
  },
};

// ——— 2. in the foreground / in the background ———
export interface Thing {
  readonly en: string;
  readonly plural: string;
  /** « le château », « un château ». */
  readonly the: string;
  readonly a: string;
  readonly two: string;
}
const thing = (en: string, plural: string, the: string, a: string, two: string): Thing => ({
  en,
  plural,
  the,
  a,
  two,
});
export const THINGS: readonly Thing[] = [
  thing('castle', 'castles', 'le château', 'un château', 'deux châteaux'),
  thing('dog', 'dogs', 'le chien', 'un chien', 'deux chiens'),
  thing('tree', 'trees', 'l’arbre', 'un arbre', 'deux arbres'),
  thing('boat', 'boats', 'le bateau', 'un bateau', 'deux bateaux'),
  thing('bike', 'bikes', 'le vélo', 'un vélo', 'deux vélos'),
  thing('church', 'churches', 'l’église', 'une église', 'deux églises'),
  thing('mountain', 'mountains', 'la montagne', 'une montagne', 'deux montagnes'),
  thing('bench', 'benches', 'le banc', 'un banc', 'deux bancs'),
  thing('house', 'houses', 'la maison', 'une maison', 'deux maisons'),
];

export type Plan = 'foreground' | 'background';
const PLAN_FR: Readonly<Record<Plan, string>> = { foreground: 'au premier plan', background: 'à l’arrière-plan' };
const otherPlan = (p: Plan): Plan => (p === 'foreground' ? 'background' : 'foreground');
const pickPlan = (rng: Rng): Plan => (coin(rng) ? 'foreground' : 'background');
const PLAN_RULE = 'Retiens : le premier plan est devant, l’arrière-plan est au fond.';
const WHY_PLAN = 'C’est l’autre plan : vérifie si l’on parle du devant ou du fond.';
const WHY_PREP = 'L’expression commence par in the.';
const sentence = (t: Thing, plan: Plan) => `There is a ${t.en} in the ${plan}.`;

function planMeaning(rng: Rng): QuestionDraft {
  const t = rng.pick(THINGS);
  const plan = pickPlan(rng);
  const right = PLAN_FR[plan];
  const { answer, traps } = choice(rng, right, [
    { label: PLAN_FR[otherPlan(plan)], why: WHY_PLAN },
    { label: 'à gauche', why: 'L’expression parle de la profondeur, pas du côté.' },
  ]);
  return {
    prompt: `Lis « ${sentence(t, plan)} » puis choisis où se trouve ${t.the}.`,
    answer,
    traps,
    hint: 'Coupe le dernier mot en deux : que veut dire le début ?',
    steps: ['Regarde la fin de la phrase.', PLAN_STEP, `Choisis : **${right}**.`],
  };
}
const PLAN_STEP = 'Repère le mot : fore- annonce le devant, back- annonce le fond.';

function planPick(rng: Rng): QuestionDraft {
  const t = rng.pick(THINGS);
  const plan = pickPlan(rng);
  const good = sentence(t, plan);
  const { answer, traps } = choice(rng, good, [
    { label: sentence(t, otherPlan(plan)), why: WHY_PLAN },
    { label: `There is a ${t.en} on the ${plan}.`, why: WHY_PREP },
    { label: `There is a ${t.en} at the ${plan}.`, why: WHY_PREP },
  ]);
  return {
    prompt: `Choisis la phrase correcte pour dire qu’il y a ${t.a} ${PLAN_FR[plan]}.`,
    answer,
    traps,
    hint: 'Vérifie d’abord le petit mot au début de l’expression, puis le plan.',
    steps: ['Cherche le petit mot placé avant the.', PLAN_RULE, `Choisis : **${good}**`],
  };
}

function planWord(rng: Rng): QuestionDraft {
  const t = rng.pick(THINGS);
  const plan = pickPlan(rng);
  return {
    prompt: `Écris en un seul mot la fin : « There is a ${t.en} in the … . » (${PLAN_FR[plan]})`,
    answer: typed([plan]),
    traps: textTraps(
      [plan],
      [
        { text: otherPlan(plan), why: WHY_PLAN },
        { text: plan === 'foreground' ? 'front' : 'back', why: 'Le cours attend un mot qui finit par -ground.' },
      ],
    ),
    hint: 'Le mot attendu finit comme « ground », le sol.',
    steps: [PLAN_RULE, 'Ajoute le bon début devant -ground.', `Écris : **${plan}**.`],
  };
}

function planPhrase(rng: Rng): QuestionDraft {
  const t = rng.pick(THINGS);
  const plan = pickPlan(rng);
  const accepted = [`in the ${plan}`];
  return {
    prompt: `Écris « ${PLAN_FR[plan]} » en anglais, avec l’expression du cours : « There is a ${t.en} … . »`,
    answer: typed(accepted),
    traps: textTraps(accepted, [
      { text: `in the ${otherPlan(plan)}`, why: WHY_PLAN },
      { text: `on the ${plan}`, why: WHY_PREP },
      { text: `at the ${plan}`, why: WHY_PREP },
      { text: plan === 'foreground' ? 'in the first plan' : 'in the last plan', why: 'On ne traduit pas mot à mot.' },
    ]),
    hint: 'Trois mots : un petit mot de lieu, the, puis le nom du plan.',
    steps: [PLAN_RULE, 'Commence par in the, puis ajoute le nom du plan.', `Écris : **${at(accepted, 0)}**.`],
  };
}

function planDocument(rng: Rng): QuestionDraft {
  const [first, second] = some(rng, THINGS, 2) as [Thing, Thing];
  const plan = pickPlan(rng);
  const pair = rng.shuffle([
    { t: first, many: true },
    { t: second, many: false },
  ]);
  const plans = [plan, otherPlan(plan)] as const;
  const lines = pair.map((p, i) => `${PLAN_FR[at(plans, i)]} : ${p.many ? p.t.two : p.t.a}.`);
  const verbs = pair.map((p) => (p.many ? 'are' : 'is'));
  const things = pair.map((p) => (p.many ? `two ${p.t.plural}` : `a ${p.t.en}`));
  return {
    prompt: 'Lis la description de la photo, puis complète en anglais : l’expression de lieu et is ou are.',
    figure: document('Description de la photo', lines),
    answer: {
      kind: 'cloze',
      parts: ['', ' there ', ` ${at(things, 0)}. `, ' there ', ` ${at(things, 1)}.`],
      blanks: blanksOf([[`in the ${at(plans, 0)}`], [at(verbs, 0)], [`in the ${at(plans, 1)}`], [at(verbs, 1)]]),
    },
    hint: 'Compte les objets avant de choisir le verbe.',
    steps: [
      'Repère le plan de chaque ligne.',
      'Compte les objets : un seul ou plusieurs ?',
      ok([`in the ${at(plans, 0)}`, at(verbs, 0), `in the ${at(plans, 1)}`, at(verbs, 1)]),
    ],
  };
}

const planSkill: Skill = {
  id: 'a5-plans',
  title: 'in the foreground / background : situer sur une image',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'usage',
      'À un oral d’anglais, on peut te demander de décrire une photo.',
      'bct-describe-picture',
      'In some speaking exams you have to talk about photos or pictures.',
    ),
  ],
  lesson: {
    memo: [
      'Sur une image, le **premier plan** (devant) se dit in the foreground.',
      'L’**arrière-plan** (au fond) se dit in the background.',
      'Exemple : « There are people in the background. »',
    ],
    source: source('situer dans l’espace : in the foreground, in the background'),
    sources: [PROG],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return planMeaning(rng);
    if (level === 2) return planPick(rng);
    if (level === 3) return planWord(rng);
    if (level === 4) return planPhrase(rng);
    return planDocument(rng);
  },
};

// ——— 3. on the left / on the right ———
export interface Spot {
  readonly word: 'left' | 'right' | 'top' | 'bottom';
  readonly fr: string;
  readonly phrase: string;
  readonly accepted: readonly string[];
}
const spot = (word: Spot['word'], fr: string, phrase: string, ...more: string[]): Spot => ({
  word,
  fr,
  phrase,
  accepted: [phrase, ...more].flatMap((p) => [p, `${p} of the picture`]),
});
export const SPOTS: readonly Spot[] = [
  spot('left', 'à gauche', 'on the left', 'on the left side', 'on the left-hand side', 'to the left'),
  spot('right', 'à droite', 'on the right', 'on the right side', 'on the right-hand side', 'to the right'),
  spot('top', 'en haut', 'at the top'),
  spot('bottom', 'en bas', 'at the bottom'),
];
export const OBJECTS: readonly (readonly [en: string, the: string])[] = [
  ['The sun', 'le soleil'],
  ['The dog', 'le chien'],
  ['The tree', 'l’arbre'],
  ['The house', 'la maison'],
  ['The car', 'la voiture'],
  ['The bird', 'l’oiseau'],
  ['The boat', 'le bateau'],
  ['The clock', 'l’horloge'],
];
const SPOT_RULE = 'Retiens : on the pour un côté, at the pour le haut ou le bas.';
const WHY_SPOT = 'Cette expression désigne une autre position.';
const WHY_IN = 'Pour un côté d’une image on dit on the ; pour le haut ou le bas, at the.';
const prep = (s: Spot) => s.phrase.split(' ')[0] ?? '';
const otherSpots = (rng: Rng, s: Spot, n: number) =>
  some(
    rng,
    SPOTS.filter((x) => x !== s),
    n,
  );

function spotMeaning(rng: Rng): QuestionDraft {
  const s = rng.pick(SPOTS);
  const [en, the] = rng.pick(OBJECTS);
  const { answer, traps } = choice(
    rng,
    s.fr,
    otherSpots(rng, s, 2).map((o) => ({ label: o.fr, why: WHY_SPOT })),
  );
  return {
    prompt: `Lis « ${en} is ${s.phrase}. » puis choisis où se trouve ${the}.`,
    answer,
    traps,
    hint: 'Concentre-toi sur le dernier mot de la phrase.',
    steps: [
      'Regarde le dernier mot de la phrase.',
      'Associe ce mot à un côté ou à une hauteur.',
      `Choisis : **${s.fr}**.`,
    ],
  };
}

function spotPick(rng: Rng): QuestionDraft {
  const s = rng.pick(SPOTS);
  const [en, the] = rng.pick(OBJECTS);
  const good = `${en} is ${s.phrase}.`;
  const { answer, traps } = choice(
    rng,
    good,
    otherSpots(rng, s, 3).map((o) => ({ label: `${en} is ${o.phrase}.`, why: WHY_SPOT })),
  );
  return {
    prompt: `Choisis la phrase qui dit que ${the} est ${s.fr} de l’image.`,
    answer,
    traps,
    hint: 'Cherche d’abord si la consigne parle d’un côté ou d’une hauteur.',
    steps: [SPOT_RULE, 'Retrouve le mot qui désigne la position demandée.', `Choisis : **${good}**`],
  };
}

function spotWord(rng: Rng): QuestionDraft {
  const s = rng.pick(SPOTS);
  const [en] = rng.pick(OBJECTS);
  return {
    prompt: `Écris le mot qui manque : « ${en} is ${prep(s)} the … . » (${s.fr})`,
    answer: typed([s.word]),
    traps: textTraps(
      [s.word],
      SPOTS.filter((x) => x !== s).map((x) => ({ text: x.word, why: WHY_SPOT })),
    ),
    hint: 'Pense aux quatre positions du mémo, puis choisis la bonne.',
    steps: [
      'Traduis la position écrite entre parenthèses.',
      'Retrouve le mot anglais de cette position.',
      `Écris : **${s.word}**.`,
    ],
  };
}

function spotPhrase(rng: Rng): QuestionDraft {
  const s = rng.pick(SPOTS);
  const [en] = rng.pick(OBJECTS);
  return {
    prompt: `Écris « ${s.fr} » en anglais pour finir la phrase : « ${en} is … . »`,
    answer: typed(s.accepted),
    traps: textTraps(s.accepted, [
      { text: `in the ${s.word}`, why: WHY_IN },
      { text: `${prep(s) === 'on' ? 'at' : 'on'} the ${s.word}`, why: WHY_IN },
      ...SPOTS.filter((x) => x !== s).map((x) => ({ text: x.phrase, why: WHY_SPOT })),
    ]),
    hint: 'Trois mots : un petit mot de lieu, the, puis la position.',
    steps: [SPOT_RULE, 'Choisis le petit mot de lieu qui va avec la position.', `Écris : **${s.phrase}**.`],
  };
}

function spotDocument(rng: Rng): QuestionDraft {
  const sides = some(rng, SPOTS, 3);
  const plan = pickPlan(rng);
  const items = some(rng, OBJECTS, 4);
  const rows = rng.shuffle([
    ...sides.map((s) => ({ fr: s.fr, accepted: [...s.accepted], first: s.phrase })),
    { fr: PLAN_FR[plan], accepted: [`in the ${plan}`], first: `in the ${plan}` },
  ]);
  const parts = rows.map((_, i) => `${i === 0 ? '' : '. '}${at(items, i)[0]} is `);
  parts.push('.');
  return {
    prompt: 'Lis la description de l’image, puis écris en anglais la position de chaque élément.',
    figure: document(
      'Description de l’image',
      rows.map((r, i) => `${r.fr} : ${at(items, i)[1]}.`),
    ),
    answer: { kind: 'cloze', parts, blanks: blanksOf(rows.map((r) => r.accepted)) },
    hint: 'Traite une ligne à la fois : côté, hauteur ou plan ?',
    steps: [
      'Lis chaque ligne et repère la position.',
      'Choisis le petit mot de lieu qui convient à chaque position.',
      ok(rows.map((r) => r.first)),
    ],
  };
}

const spotSkill: Skill = {
  id: 'a5-gauche-droite',
  title: 'on the left, on the right, at the top, at the bottom',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'usage',
      'Sur une photo, ces mots montrent à ton auditeur de quelle partie tu parles.',
      'bct-describe-picture',
      'so you can explain which part of the picture you are talking about',
    ),
  ],
  lesson: {
    memo: [
      'Pour les côtés d’une image : on the left (à gauche), on the right (à droite).',
      'Pour la hauteur : at the top (en haut), at the bottom (en bas).',
      'Exemple : « The moon is at the top. »',
    ],
    source: source(
      'situer dans l’espace : on the right / left, at the top / bottom',
      '« Describe a photo or picture »',
    ),
    sources: [PROG, 'bct-describe-picture'],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return spotMeaning(rng);
    if (level === 2) return spotPick(rng);
    if (level === 3) return spotWord(rng);
    if (level === 4) return spotPhrase(rng);
    return spotDocument(rng);
  },
};

// ——— 4. very, much, too ———
export type Degree = 'very' | 'much' | 'too';
export interface Case {
  readonly text: string;
  /** Sens français : lui seul départage very et too, tous deux possibles dans bien des phrases anglaises. */
  readonly fr: string;
  readonly degree: Degree;
}
const cases = (degree: Degree, ...rows: (readonly [text: string, fr: string])[]): Case[] =>
  rows.map(([text, fr]) => ({ text, fr, degree }));
export const CASES: readonly Case[] = [
  ...cases(
    'too',
    ['I am … young to drive.', 'Je suis trop jeune pour conduire.'],
    ['This soup is … hot to eat.', 'Cette soupe est trop chaude pour être mangée.'],
    ['The box is … heavy to carry.', 'La boîte est trop lourde à porter.'],
    ['I am … tired to play.', 'Je suis trop fatigué pour jouer.'],
    ['The shop is … far for us to walk.', 'Le magasin est trop loin pour y aller à pied.'],
    ['This bike is … small for me to ride.', 'Ce vélo est trop petit pour moi.'],
    ['The water is … cold to swim in.', 'L’eau est trop froide pour s’y baigner.'],
  ),
  ...cases(
    'very',
    ['It was … sunny yesterday and I loved it!', 'Il y avait un très beau soleil hier et j’ai adoré !'],
    ['The game is … funny: we love it!', 'Le jeu est très drôle : nous l’adorons !'],
    ['This cake is … good, I want more!', 'Ce gâteau est très bon, j’en veux encore !'],
    ['Your drawing is … nice, I like it a lot.', 'Ton dessin est très joli, je l’adore.'],
    ['The film was … interesting and I enjoyed it.', 'Le film était très intéressant et il m’a plu.'],
    ['I am … happy: we won the match!', 'Je suis très content : nous avons gagné le match !'],
    ['The new park is … beautiful, we love it.', 'Le nouveau parc est très beau, nous l’adorons.'],
  ),
  ...cases(
    'much',
    ['My brother is … taller than me.', 'Mon frère est beaucoup plus grand que moi.'],
    ['This phone is … newer than that one.', 'Ce téléphone est beaucoup plus récent que celui-là.'],
    ['London is … bigger than my town.', 'Londres est beaucoup plus grande que ma ville.'],
    ['Today is … colder than yesterday.', 'Aujourd’hui, il fait beaucoup plus froid qu’hier.'],
    ['My new bag is … lighter than the old one.', 'Mon nouveau sac est beaucoup plus léger que l’ancien.'],
    ['A plane is … faster than a car.', 'Un avion est beaucoup plus rapide qu’une voiture.'],
    ['This test is … easier than the last one.', 'Ce contrôle est beaucoup plus facile que le dernier.'],
  ),
];
const WHY_DEGREE: Readonly<Record<Degree | 'many', string>> = {
  very: 'very renforce un adjectif : il ne dit pas qu’il y en a trop et ne va pas devant than.',
  too: 'too veut dire trop : plus que ce que l’on veut.',
  much: 'much renforce un adjectif au comparatif, devant than.',
  many: 'many compte des choses : il ne renforce pas un adjectif.',
};
const DEGREE_STEP: Readonly<Record<Degree, string>> = {
  too: 'Repère « trop » dans la phrase française : c’est plus que ce que l’on veut.',
  very: 'Repère « très » dans la phrase française : la qualité est renforcée.',
  much: 'Repère « beaucoup plus » en français et than (que) en anglais.',
};
const DEGREE_RULE = 'Choisis selon le sens : très, trop, ou beaucoup plus.';
const caseSteps = (c: Case) => [DEGREE_STEP[c.degree], DEGREE_RULE, `Écris : **${c.degree}**.`];

export interface Quality {
  readonly en: string;
  readonly fr: string;
  readonly adj: string;
  readonly comparative: string;
  readonly frAdj: string;
}
const quality = (en: string, fr: string, adj: string, comparative: string, frAdj: string): Quality => ({
  en,
  fr,
  adj,
  comparative,
  frAdj,
});
export const QUALITIES: readonly Quality[] = [
  quality('This bag is', 'Ce sac est', 'heavy', 'heavier', 'lourd'),
  quality('This soup is', 'Cette soupe est', 'hot', 'hotter', 'chaude'),
  quality('This box is', 'Cette boîte est', 'big', 'bigger', 'grosse'),
  quality('This music is', 'Cette musique est', 'loud', 'louder', 'forte'),
  quality('This test is', 'Ce contrôle est', 'difficult', 'more difficult', 'difficile'),
  quality('This coat is', 'Ce manteau est', 'expensive', 'more expensive', 'cher'),
  quality('This book is', 'Ce livre est', 'long', 'longer', 'long'),
  quality('This bike is', 'Ce vélo est', 'fast', 'faster', 'rapide'),
];
const french = (q: Quality, d: Degree) => `${q.fr} ${DEGREE_FR[d]} ${q.frAdj}.`;
const english = (q: Quality, d: Degree) => `${d} ${d === 'much' ? q.comparative : q.adj}`;
const DEGREES = ['very', 'too', 'much'] as const;
const DEGREE_FR: Readonly<Record<Degree, string>> = { very: 'très', too: 'trop', much: 'beaucoup plus' };

function degreeMeaning(rng: Rng): QuestionDraft {
  const q = rng.pick(QUALITIES);
  const d = rng.pick(DEGREES);
  const right = french(q, d);
  const { answer, traps } = choice(
    rng,
    right,
    DEGREES.filter((x) => x !== d).map((x) => ({
      label: french(q, x),
      why: `« ${DEGREE_FR[x]} » traduit ${x} : ici, tu lis ${d}, qui veut dire « ${DEGREE_FR[d]} ».`,
    })),
  );
  return {
    prompt: `Choisis le sens de « ${q.en} ${english(q, d)}. »`,
    answer,
    traps,
    hint: 'Regarde le petit mot placé avant la qualité.',
    steps: ['Repère le petit mot devant la qualité.', DEGREE_RULE, `Choisis : **${right}**`],
  };
}

function degreePick(rng: Rng): QuestionDraft {
  const c = rng.pick(CASES);
  const { answer, traps } = choice(
    rng,
    c.degree,
    [...DEGREES.filter((x) => x !== c.degree), 'many' as const].map((x) => ({ label: x, why: WHY_DEGREE[x] })),
  );
  return {
    prompt: `Choisis le mot qui donne le sens « ${c.fr} » à la phrase : « ${c.text} »`,
    answer,
    traps,
    hint: 'Dans la phrase française, cherche les mots placés devant la qualité.',
    steps: [DEGREE_STEP[c.degree], DEGREE_RULE, `Choisis : **${c.degree}**.`],
  };
}

function degreeWrite(rng: Rng): QuestionDraft {
  const c = rng.pick(CASES);
  return {
    prompt: `Complète avec very, much ou too pour dire « ${c.fr} » : « ${c.text} »`,
    answer: typed([c.degree]),
    traps: textTraps(
      [c.degree],
      [...DEGREES, 'many' as const].map((x) => ({ text: x, why: WHY_DEGREE[x] })),
    ),
    hint: 'Dans la phrase française, cherche les mots placés devant la qualité.',
    steps: caseSteps(c),
  };
}

function degreeTranslate(rng: Rng): QuestionDraft {
  const q = rng.pick(QUALITIES);
  const d = rng.pick(DEGREES);
  const accepted = [english(q, d)];
  const wrong = DEGREES.filter((x) => x !== d).map((x) => ({
    text: `${x} ${d === 'much' ? q.comparative : q.adj}`,
    why: `${x} veut dire « ${DEGREE_FR[x]} » : la phrase française dit « ${DEGREE_FR[d]} ».`,
  }));
  const extra =
    d === 'much' ? [{ text: `much more ${q.adj}`, why: `Le comparatif attendu est ${q.comparative}.` }] : [];
  return {
    prompt: `Écris la fin en anglais avec un adverbe de degré du cours : « ${french(q, d)} » → ${q.en} … .`,
    answer: typed(accepted),
    traps: textTraps(accepted, [...wrong, ...(q.comparative.startsWith('more') ? [] : extra)]),
    hint: `Le mot de base est « ${q.adj} ». Choisis le petit mot, puis la bonne forme.`,
    steps: [
      'Trouve le sens : très, trop ou beaucoup plus.',
      'Pour « beaucoup plus », utilise la forme de comparaison de la qualité.',
      `Écris : **${at(accepted, 0)}**.`,
    ],
  };
}

/** Quatre qualités différentes, les trois adverbes, dont deux « beaucoup plus » (forme à construire). */
function degreeDocument(rng: Rng): QuestionDraft {
  const name = rng.pick(NAMES);
  const degrees = rng.shuffle([...DEGREES, 'much' as const]);
  const rows = some(rng, QUALITIES, degrees.length).map((q, i) => ({ q, d: at(degrees, i) }));
  const answers = rows.map((r) => english(r.q, r.d));
  return {
    prompt:
      'Lis le journal et sa traduction. Écris dans chaque trou, en anglais, l’adverbe de degré et la qualité à la bonne forme.',
    figure: document(
      `Diary of ${name}`,
      rows.flatMap((r, i) => [`${r.q.en} (${i + 1}).`, `= ${french(r.q, r.d)} Mot de base : ${r.q.adj}.`]),
    ),
    answer: { kind: 'cloze', parts: numbered(rows.length), blanks: blanksOf(answers.map((a) => [a])) },
    hint: 'Pour chaque trou, relis la phrase française, puis le mot de base.',
    steps: [
      'Pour chaque trou, trouve le sens : très, trop ou beaucoup plus.',
      'Pour « beaucoup plus », utilise la forme de comparaison de la qualité.',
      ok(answers),
    ],
  };
}

const degreeSkill: Skill = {
  id: 'a5-intensite',
  title: 'very, much, too : doser une qualité',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'usage',
      'Pour dire à quel point une musique est forte, par exemple « very loud ».',
      'bc-intensifiers',
      'We use words like very, really and extremely to make adjectives stronger',
    ),
  ],
  lesson: {
    memo: [
      'Ces **adverbes de degré** dosent une qualité : very (très), too (trop).',
      'much (beaucoup) renforce un **comparatif** : much older.',
      'too dit plus que ce que l’on veut : « It is too dark. »',
    ],
    source: source('adverbes de degré very, much, too', '« Too big, too small », « Intensifiers »'),
    sources: [PROG, 'bck-too-adjective', 'bc-intensifiers'],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return degreeMeaning(rng);
    if (level === 2) return degreePick(rng);
    if (level === 3) return degreeWrite(rng);
    if (level === 4) return degreeTranslate(rng);
    return degreeDocument(rng);
  },
};

export const ENGLISH_LINKING_5E_CHAPTER: Chapter = {
  id: 'a5-relier-situer',
  subject: 'anglais',
  grade: '5e',
  domain: 'langue',
  title: 'Relier et situer',
  skills: [linkSkill, planSkill, spotSkill, degreeSkill],
};
