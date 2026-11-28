import type { Chapter, QuestionDraft, Skill } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import { ended, pairs, typed } from './pronoms.ts';
import { at, others, some } from './temps.ts';
import { spellings } from './vocabulaire-6e.ts';
import {
  ACTIVITIES,
  AXES,
  NATURE_WORDS,
  PEOPLE,
  PEOPLE_FILLS,
  REFERENCES,
  SPORT,
  TRAVEL,
  type Famous,
  type Reference,
  type Word5,
} from './vocabulaire-5e-faits.ts';

/**
 * Anglais 5e — « Vocabulaire thématique » (lot an-5e-08, docs/adr/0034). Programme d'anglais du collège (arrêté du
 * 5 mai 2025), classe de 5e : lexique en lien avec les axes culturels ; mots : programme et fiches du British
 * Council (voir vocabulaire-5e-faits.ts : chaque fait y porte sa source et sa citation).
 */
const PROGRAMME = 'Programme d’anglais du collège (arrêté du 5 mai 2025), classe de 5e';
const source = (detail: string) => `${PROGRAMME} — ${detail}.`;
const PROG = 'anglais-college-2025';
const ABOUT = 'Écrit pour l’exercice.';

const coin = (rng: Rng) => rng.int(0, 1) === 0;
const quoted = (list: readonly string[]) => list.map((l) => `« ${l} »`).join(' ');
const answered = (rows: readonly (readonly [string, string])[]) =>
  `**${rows.map(([a, b]) => `${a} = ${b}`).join(' ; ')}**`;
/** Paires de la réponse, en deux bulles courtes. */
const solved = (rows: readonly (readonly [string, string])[]) => {
  const half = (list: typeof rows) => answered(list.map(([a, b]) => [a.replace(/\.$/, ''), b.replace(/\.$/, '')]));
  return [`Vérifie les premières paires : ${half(rows.slice(0, 2))}`, `Vérifie les autres : ${half(rows.slice(2))}`];
};
const document = (title: string, lines: readonly string[]) => ({
  kind: 'document' as const,
  title,
  lines: [...lines],
  credit: ABOUT,
});

/** Texte à trous à choisir dans une liste. */
function lists(rng: Rng, rows: readonly { ask: string; good: string; options: readonly string[] }[]) {
  return {
    kind: 'cloze' as const,
    parts: [...rows.map((r, i) => `${i === 0 ? '' : '. '}${r.ask} `), '.'],
    blanks: rows.map((r) => {
      const options = rng.shuffle(r.options);
      return { mode: 'list' as const, options, correct: options.indexOf(r.good) };
    }),
  };
}

// ——— Les trois thèmes de lexique ———

interface Slot {
  /** Début de la phrase française à compléter. */
  readonly ask: string;
  readonly words: readonly string[];
  /** Phrase anglaise : le mot juste, et un autre mot écarté par la phrase. */
  readonly line: (good: string, other: string) => string;
}
const slot = (ask: string, words: readonly string[], line: Slot['line']): Slot => ({ ask, words, line });

interface Theme {
  readonly terms: readonly Word5[];
  readonly name: string;
  /** Niveau 4 : mots plus difficiles. */
  readonly hard: readonly string[];
  readonly title: string;
  readonly intro: string;
  readonly slots: readonly Slot[];
}

const find = (list: readonly Word5[], en: string): Word5 => {
  const t = list.find((x) => x.en === en);
  if (!t) throw new Error(`mot inconnu : ${en}`);
  return t;
};
const means = (t: Word5) => `« ${t.en} » veut dire « ${t.fr} ».`;
const saidAs = (t: Word5) => `« ${t.fr} » se dit « ${t.en} ».`;
/** Le mot tel qu'il se place dans la phrase à trou : « to train » s'écrit après un « to » déjà là. */
const bare = (t: Word5) => t.en.replace(/^to /, '');
export const blanked = (t: Word5) => t.ex.replace(new RegExp(`\\b${bare(t)}\\b`, 'i'), '…');

function spot(rng: Rng, th: Theme): QuestionDraft {
  const t = rng.pick(th.terms);
  // Trois sens très éloignés : un seul mot par famille.
  const far: Word5[] = [];
  for (const o of rng.shuffle(th.terms))
    if (far.length < 2 && o.group !== t.group && !far.some((x) => x.group === o.group)) far.push(o);
  const { answer, traps } = choice(
    rng,
    t.fr,
    far.map((o) => ({ label: o.fr, why: saidAs(o) })),
  );
  return {
    prompt: `Choisis le sens du mot « ${t.en} » (${th.name}).`,
    answer,
    traps,
    hint:
      t.en === 'to train'
        ? 'Le petit mot « to » devant montre que c’est une action.'
        : 'Dis le mot à voix haute : ressemble-t-il à un mot français ?',
    steps: [
      `Lis une phrase avec ce mot : « ${t.ex} »`,
      `Retiens le sens : ${means(t)}`,
      `Choisis la réponse : **${t.fr}**`,
    ],
  };
}

function recognise(rng: Rng, th: Theme): QuestionDraft {
  const groups = [...new Set(th.terms.map((t) => t.group))].filter(
    (g) => th.terms.filter((t) => t.group === g).length >= 4,
  );
  const group = rng.pick(groups);
  const close = th.terms.filter((t) => t.group === group);
  if (coin(rng)) {
    const t = rng.pick(close);
    const wrong = others(rng, close, t, 3);
    const { answer, traps } = choice(
      rng,
      t.en,
      wrong.map((o) => ({ label: o.en, why: means(o) })),
    );
    return {
      prompt: `Choisis le mot anglais qui veut dire « ${t.fr} ».`,
      answer,
      traps,
      hint: 'Les propositions se ressemblent : traduis-les une à une avant de choisir.',
      steps: [
        'Traduis chaque proposition et élimine celles qui disent autre chose.',
        `Retiens le sens : ${saidAs(t)}`,
        `Choisis la réponse : **${t.en}**`,
      ],
    };
  }
  const rows = some(rng, close, 3).map((t) => [t.en, t.fr] as const);
  return {
    prompt: `Associe chaque mot anglais à son sens : ${quoted(rows.map((r) => r[0]))}`,
    answer: pairs(rng, rows),
    hint: 'Commence par le mot que tu connais le mieux.',
    steps: [
      'Relie d’abord le mot que tu connais déjà.',
      'Élimine les sens utilisés, puis place les deux autres.',
      `Vérifie les paires : ${answered(rows)}`,
    ],
  };
}

/** Saisie d'un mot : une faute d'écriture et deux confusions du même thème. */
function written(rng: Rng, th: Theme, t: Word5, accepted: readonly string[]) {
  const ok = new Set(accepted.map((a) => a.toLowerCase()));
  const near = th.terms.filter((o) => o !== t && o.group === t.group);
  const confused = some(rng, near.length >= 2 ? near : th.terms.filter((o) => o !== t), 2);
  const wrong: (readonly [string, string])[] = [
    [t.typo, `Regarde bien l’orthographe : on écrit « ${t.en} ».`],
    ...confused.map((o) => [o.en, means(o)] as const),
  ];
  return {
    answer: { kind: 'text' as const, accepted: ended(accepted) },
    traps: typed(
      t.en,
      wrong.filter(([w]) => !ok.has(w.toLowerCase())),
    ),
  };
}

const spelled = (word: string) =>
  word
    .split(' ')
    .map((w) => w.split('').join('·'))
    .join(' puis ');
/** « un seul mot de 4 lettres » ou « 2 mots ». */
const size = (word: string) => {
  const count = word.split(' ').length;
  return count > 1
    ? `La réponse s’écrit en ${count} mots.`
    : `La réponse est un seul mot de ${word.length} caractères.`;
};

/** Le mot français contient le mot anglais (« le taxi ») : l’écrire ne demanderait aucun effort. */
export const givenAway = (t: Word5) => t.fr.toLowerCase().includes(bare(t));

/** Niveau 3 : compléter une phrase ; la première lettre est donnée, les petits mots sont déjà écrits. */
function complete(rng: Rng, th: Theme): QuestionDraft {
  const t = rng.pick(th.terms.filter((x) => !givenAway(x)));
  const word = bare(t);
  const accepted = [word, ...t.alt.filter((a) => a !== word)];
  const text = blanked(t);
  return {
    prompt: `Écris le mot qui manque (« ${t.fr} », première lettre « ${word.slice(0, 1)} ») : « ${text} »`,
    ...written(rng, th, t, accepted),
    hint: size(word),
    steps: [
      `Cherche le mot anglais qui veut dire « ${t.fr} ».`,
      `Écris-le lettre par lettre : ${spelled(word)}.`,
      `Relis la phrase : **${text.replace('…', word)}**`,
    ],
  };
}

/** Niveau 4 : écrire sans aide, ou relier cinq mots plus difficiles. */
function master(rng: Rng, th: Theme): QuestionDraft {
  const hard = th.hard.map((en) => find(th.terms, en));
  if (coin(rng)) {
    const t = rng.pick(hard);
    return {
      prompt: `Écris en anglais, sans modèle : « ${t.fr} ».`,
      ...written(rng, th, t, spellings(t)),
      hint: `Le mot commence par « ${t.en.slice(0, 1)} ». ${size(t.en)}`,
      steps: [
        `Cherche le mot appris pour « ${t.fr} ».`,
        `Souviens-toi de cette phrase : « ${t.ex} »`,
        `Écris la réponse : **${t.en}**`,
      ],
    };
  }
  const rows = some(rng, hard, 5).map((t) => [t.en, t.fr] as const);
  return {
    prompt: `Associe cinq mots à leur sens : ${quoted(rows.map((r) => r[0]))}`,
    answer: pairs(rng, rows),
    hint: 'Élimine au fur et à mesure : les derniers mots se déduisent des autres.',
    steps: [
      'Relie d’abord les mots que tu connais sûrement.',
      'Compare les mots restants, puis place-les un à un.',
      `Vérifie les paires : ${answered(rows)}`,
    ],
  };
}

/** Niveau 5 : lire un texte (négations comprises) et compléter le résumé. */
function reading(rng: Rng, th: Theme): QuestionDraft {
  const rows = some(rng, th.slots, 4).map((s) => {
    const [good, other, ...rest] = rng.shuffle(s.words).map((en) => find(th.terms, en)) as [Word5, Word5, ...Word5[]];
    return {
      line: s.line(good.en, other.en),
      ask: s.ask,
      good: good.fr,
      options: [good.fr, other.fr, ...rest.slice(0, 2).map((t) => t.fr)],
      said: means(good),
    };
  });
  return {
    prompt: `Lis le texte, puis complète le résumé en français. ${th.intro}`,
    figure: document(
      th.title,
      rows.map((r) => r.line),
    ),
    answer: lists(rng, rows),
    hint: 'Chaque phrase affirme un mot et en écarte un autre avec « not » ou « n’t ».',
    steps: [
      'Repère dans chaque phrase la négation : elle écarte un mot.',
      'Garde l’autre mot, celui que la phrase affirme.',
      `Traduis les mots gardés. ${rows.map((r) => r.said).join(' ')}`.replace(/\. «/g, ' ; «'),
      `Vérifie la réponse : **${rows.map((r) => r.good).join(' ; ')}**`,
    ],
  };
}

const lexicon =
  (th: Theme): Skill['generate'] =>
  (rng, level): QuestionDraft => {
    if (level === 1) return spot(rng, th);
    if (level === 2) return recognise(rng, th);
    if (level === 3) return complete(rng, th);
    if (level === 4) return master(rng, th);
    return reading(rng, th);
  };

// ——— 1. Les voyages ———
const TRAVEL_THEME: Theme = {
  terms: TRAVEL,
  name: 'les voyages',
  hard: [
    'coach',
    'lorry',
    'motorbike',
    'boarding card',
    'baggage',
    'seat belt',
    'gate',
    'journey',
    'underground',
    'traffic',
  ],
  title: 'Kim’s trip',
  intro: 'Kim raconte un voyage.',
  slots: [
    slot(
      'Hier, Kim a pris',
      ['bus', 'train', 'taxi', 'coach', 'boat'],
      (g, o) => `Yesterday we didn’t take the ${o}: we took the ${g}.`,
    ),
    slot(
      'À l’aéroport, il faut attendre à cet endroit :',
      ['gate', 'check-in desk', 'departures board'],
      (g, o) => `Don’t wait at the ${o}. Wait at the ${g}.`,
    ),
    slot(
      'Le véhicule de son père est',
      ['car', 'van', 'lorry', 'motorbike', 'bike'],
      (g, o) => `My dad hasn’t got a ${o}, but he has got a ${g}.`,
    ),
    slot(
      'À Londres, Kim choisit',
      ['underground', 'bus', 'taxi', 'bike'],
      (g, o) => `In London, I don’t want to use the ${o}: I choose the ${g}.`,
    ),
    slot(
      'Kim cherche',
      ['boarding card', 'seat belt', 'overhead locker', 'baggage', 'check-in desk'],
      (g, o) => `I’m not looking for the ${o}: I’m looking for the ${g}.`,
    ),
  ],
};

// ——— 2. Le sport ———
const SPORT_THEME: Theme = {
  terms: SPORT,
  name: 'le sport',
  hard: [
    'rowing',
    'fencing',
    'wrestling',
    'athletics',
    'diving',
    'spectator',
    'winner',
    'silver medal',
    'bronze medal',
    'to train',
  ],
  title: 'Jo and sport',
  intro: 'Jo parle de sport.',
  slots: [
    slot(
      'Le lundi, Jo pratique',
      ['swimming', 'rowing', 'fencing', 'diving', 'hockey'],
      (g, o) => `On Mondays, I don’t practise ${o}: I practise ${g}.`,
    ),
    slot(
      'À la télévision, sa sœur regarde',
      ['boxing', 'athletics', 'wrestling', 'gymnastics'],
      (g, o) => `My sister doesn’t watch ${o}, but she watches ${g}.`,
    ),
    slot(
      'L’an dernier, Jo a gagné',
      ['gold medal', 'silver medal', 'bronze medal'],
      (g, o) => `Last year, I didn’t win a ${o}: I won a ${g}.`,
    ),
    slot(
      'Aujourd’hui, Jo a avec soi',
      ['flag', 'ticket', 'medal'],
      (g, o) => `I have got my ${g}, but I haven’t got my ${o}.`,
    ),
    slot(
      'La personne dont Jo parle est',
      ['athlete', 'winner', 'spectator'],
      (g, o) => `He isn’t the ${o}: he is the ${g}.`,
    ),
  ],
};

// ——— 3. La nature ———
const NATURE_THEME: Theme = {
  terms: NATURE_WORDS,
  name: 'la nature',
  hard: ['waterfall', 'flood', 'summit', 'hill', 'island', 'landscape', 'weather', 'hurricane', 'harvest', 'season'],
  title: 'Max’s nature diary',
  intro: 'Max raconte ses sorties dans la nature.',
  slots: [
    slot(
      'Au bord de l’eau, Max a vu',
      ['river', 'sea', 'lake', 'waterfall'],
      (g, o) => `We didn’t see the ${o}: we saw the ${g}.`,
    ),
    slot(
      'Max est allé à cet endroit :',
      ['mountain', 'hill', 'island', 'desert', 'forest'],
      (g, o) => `We didn’t go to the ${o}. We went to the ${g}.`,
    ),
    slot(
      'Dans le jardin, il faut regarder',
      ['grass', 'plant', 'flower', 'tree'],
      (g, o) => `Don’t look at the ${o}: look at the ${g}.`,
    ),
    slot(
      'Le reportage parle de',
      ['weather', 'climate', 'season', 'sky'],
      (g, o) => `The report isn’t about the ${o}. It is about the ${g}.`,
    ),
    slot(
      'Au village, les habitants parlent de',
      ['flood', 'hurricane', 'harvest'],
      (g, o) => `People aren’t talking about the ${o}: they are talking about the ${g}.`,
    ),
  ],
};

const travel: Skill = {
  id: 'a5-voc-voyages',
  title: 'Le vocabulaire des voyages',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'usage',
      text: 'Ces mots t’aident à parler de tes trajets : bus, car ou vélo.',
      source: PROG,
      citation: 'to travel, to go on a trip, globetrotting, public transport, bus, coach, bike',
    },
  ],
  lesson: {
    memo: [
      'Ton **lexique** des voyages : « bike » (vélo), « coach » (autocar), « underground » (métro).',
      'À l’aéroport : « boarding card » (carte d’embarquement), « gate » (porte), « baggage » (bagages).',
    ],
    source: source('lexique des transports et des déplacements'),
    sources: [PROG, 'bct-voc-transport', 'bct-voc-air-travel'],
  },
  generate: lexicon(TRAVEL_THEME),
};

const sport: Skill = {
  id: 'a5-voc-sport',
  title: 'Le vocabulaire du sport',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'usage',
      text: 'En anglais, tu peux demander à quelqu’un quand il s’entraîne au base-ball.',
      source: PROG,
      citation: 'When do you train for baseball during the week in middle school?',
    },
  ],
  lesson: {
    memo: [
      'Ton **lexique** du sport : « rowing » (aviron), « fencing » (escrime), « team » (équipe).',
      'Pour une compétition : « athlete », « winner », « stadium » et « gold medal » (médaille d’or).',
    ],
    source: source('lexique des loisirs et du sport'),
    sources: [PROG, 'bct-voc-olympic-sports', 'bct-voc-sporting-events'],
  },
  generate: lexicon(SPORT_THEME),
};

const nature: Skill = {
  id: 'a5-voc-nature',
  title: 'Le vocabulaire de la nature',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'usage',
      text: 'Ces mots t’aident à décrire un paysage, ses saisons et son climat.',
      source: PROG,
      citation: 'weather, season, seasonal, pure, colourful, changing, climate, hill, mountain, forest',
    },
  ],
  lesson: {
    memo: [
      'Ton **lexique** de la nature : « river » (rivière), « hill » (colline), « forest » (forêt).',
      'Pour le ciel et le temps : « weather », « climate » et « hurricane » (ouragan).',
    ],
    source: source('lexique des paysages et des saisons'),
    sources: [PROG, 'bct-voc-nature'],
  },
  generate: lexicon(NATURE_THEME),
};

// ——— 4. Les personnages célèbres ———

const who = (p: Famous) => `Retiens ceci : **${p.name}**, ${p.deed}.`;
const clueText = (p: Famous) => p.clues.join(' ');

function famousChoice(rng: Rng): QuestionDraft {
  const p = rng.pick(PEOPLE);
  const { answer, traps } = choice(
    rng,
    p.name,
    others(rng, PEOPLE, p, 2).map((o) => ({ label: o.name, why: `${o.name} : ${o.deed}.` })),
  );
  return {
    prompt: p.who,
    answer,
    traps,
    hint: 'Pense à ce que chacun a fait : écrire, gouverner, construire ou chanter.',
    steps: ['Cherche dans la question l’action ou le lieu important.', who(p), `Choisis la réponse : **${p.name}**`],
  };
}

function famousRecognise(rng: Rng): QuestionDraft {
  if (coin(rng)) {
    const p = rng.pick(PEOPLE);
    const { answer, traps } = choice(
      rng,
      p.name,
      others(rng, PEOPLE, p, 3).map((o) => ({ label: o.name, why: `${o.name} : ${o.deed}.` })),
    );
    return {
      prompt: `Trouve qui pourrait dire : « ${clueText(p)} »`,
      answer,
      traps,
      hint: 'Repère les noms propres et les verbes : « wrote », « designed », « born ».',
      steps: [
        'Cherche les noms propres et les verbes au passé.',
        `Relie ces indices : « ${at(p.clues, 0)} »`,
        `Choisis la réponse : **${p.name}**`,
      ],
    };
  }
  const rows = some(rng, PEOPLE, 3).map((p) => [p.name, p.deed] as const);
  return {
    prompt: `Associe chaque personne à ce qui la concerne : ${rows.map((r) => r[0]).join(', ')}.`,
    answer: pairs(rng, rows),
    hint: 'Commence par la personne que tu connais le mieux.',
    steps: [
      'Place d’abord les personnes que tu connais déjà.',
      'Élimine les réponses prises, puis relie la dernière.',
      `Vérifie les paires : ${answered(rows)}`,
    ],
  };
}

function famousFill(rng: Rng): QuestionDraft {
  const f = rng.pick(PEOPLE_FILLS);
  const [good] = f.accepted;
  return {
    prompt: `Complète la phrase avec le mot anglais qui veut dire « ${f.fr} » : « ${f.text} »`,
    answer: { kind: 'text', accepted: ended(f.accepted) },
    traps: typed(good, [f.trap]),
    hint: 'Relis la phrase : il manque un métier, un titre ou une action passée.',
    steps: [
      'Regarde le sens français donné et cherche le mot anglais.',
      `Écris-le lettre par lettre : ${spelled(good)}.`,
      `Relis la phrase : **${f.text.replace('…', good)}**`,
    ],
  };
}

function famousWrite(rng: Rng): QuestionDraft {
  const p = rng.pick(PEOPLE);
  const other = at(others(rng, PEOPLE, p, 1), 0);
  return {
    prompt: `Écris le nom de la personne qui pourrait dire : « ${clueText(p)} »`,
    answer: { kind: 'text', accepted: ended(p.accepted) },
    traps: typed(p.name, [[other.name, `${other.name} : ${other.deed}.`]]),
    hint: 'Repère l’action principale : à qui peux-tu l’attribuer ?',
    steps: ['Cherche l’action ou le lieu cité dans les phrases.', who(p), `Écris la réponse : **${p.name}**`],
  };
}

function famousMatch(rng: Rng): QuestionDraft {
  const rows = some(rng, PEOPLE, 5).map((p) => [p.name, at(p.clues, 0)] as const);
  return {
    prompt: `Associe chaque nom à la phrase que cette personne pourrait dire : ${rows.map((r) => r[0]).join(', ')}.`,
    answer: pairs(rng, rows),
    hint: 'Commence par les phrases qui citent un lieu ou une œuvre.',
    steps: ['Repère un nom d’œuvre ou de lieu dans chaque phrase.', ...solved(rows)],
  };
}

function portraits(rng: Rng): QuestionDraft {
  const chosen = some(rng, PEOPLE, 3);
  const letters = ['A', 'B', 'C'];
  return {
    prompt: 'Lis les trois portraits et écris le nom de chaque personne.',
    figure: document(
      'Who am I?',
      chosen.map((p, i) => `${at(letters, i)}: ${clueText(p)}`),
    ),
    answer: {
      kind: 'cloze',
      parts: ['A : ', ' · B : ', ' · C : ', ''],
      blanks: chosen.map((p) => ({ mode: 'text' as const, accepted: ended(p.accepted) })),
    },
    hint: 'Pour chaque portrait, trouve le détail unique : un livre, un lieu, un métier.',
    steps: [
      'Lis un portrait à la fois et cherche son détail unique.',
      `Associe le détail à la personne : ${chosen.map((p) => p.deed).join(' ; ')}.`,
      `Écris la réponse : **${chosen.map((p) => p.name).join(', ')}**`,
    ],
  };
}

const famous: Skill = {
  id: 'a5-personnages-celebres',
  title: 'Parler de personnages célèbres',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'savais-tu',
      text: 'Arthur Conan Doyle a écrit plus de cinquante récits.',
      source: PROG,
      citation: 'Conan Doyle wrote over fifty stories.',
    },
  ],
  lesson: {
    memo: [
      'Pour un **portrait**, dis qui est la personne et ce qu’elle a fait.',
      'Raconte au **prétérit** : « He wrote many stories. »',
    ],
    source: source('portraits : présenter des personnes et raconter au passé'),
    sources: [PROG],
  },
  generate: (rng, level): QuestionDraft => {
    if (level === 1) return famousChoice(rng);
    if (level === 2) return famousRecognise(rng);
    if (level === 3) return famousFill(rng);
    if (level === 4) return coin(rng) ? famousMatch(rng) : famousWrite(rng);
    return portraits(rng);
  },
};

// ——— 5. Les repères des axes culturels ———

const AXIS_RULE = 'Cherche le grand thème : portrait, quotidien, imaginaire, école, langues ou Royaume-Uni.';
const whatIs = (r: Reference) => `Retiens que « ${r.name} » désigne ${r.about}.`;

function referenceSpot(rng: Rng): QuestionDraft {
  const r = rng.pick(REFERENCES);
  const { answer, traps } = choice(
    rng,
    r.about,
    others(rng, REFERENCES, r, 2).map((o) => ({ label: o.about, why: `C’est la définition de « ${o.name} ».` })),
  );
  return {
    prompt: `Choisis ce que désigne « ${r.name} ».`,
    answer,
    traps,
    hint: r.hint ?? 'Cherche un mot ou des lettres que tu connais dans ce nom.',
    steps: [
      r.hint ? 'Souviens-toi de ce que la leçon dit de ce nom.' : 'Observe le nom et cherche ce que tu connais.',
      whatIs(r),
      `Choisis la réponse : **${r.about}**`,
    ],
  };
}

function referenceRecognise(rng: Rng): QuestionDraft {
  if (coin(rng)) {
    const r = rng.pick(REFERENCES);
    const { answer, traps } = choice(
      rng,
      r.name,
      others(rng, REFERENCES, r, 3).map((o) => ({ label: o.name, why: `« ${o.name} » désigne ${o.about}.` })),
    );
    return {
      prompt: `Choisis le repère décrit : ${r.about}.`,
      answer,
      traps,
      hint: 'Relis la description : un lieu, une personne ou un objet ?',
      steps: ['Relis le mot important de la description.', whatIs(r), `Choisis la réponse : **${r.name}**`],
    };
  }
  const rows = some(rng, REFERENCES, 3).map((r) => [r.name, r.short] as const);
  return {
    prompt: `Associe chaque repère à sa description : ${rows.map((r) => r[0]).join(', ')}.`,
    answer: pairs(rng, rows),
    hint: 'Commence par le repère que tu connais le mieux.',
    steps: [
      'Relie d’abord le repère que tu connais le mieux.',
      'Élimine, puis place les deux autres.',
      `Vérifie les paires : ${answered(rows)}`,
    ],
  };
}

function referenceWrite(rng: Rng): QuestionDraft {
  const r = rng.pick(REFERENCES);
  const [good] = r.accepted;
  return {
    prompt: `Écris le nom anglais du repère : ${r.about}.`,
    answer: { kind: 'text', accepted: ended(r.accepted) },
    traps: typed(good, [[r.typo, `Regarde bien l’orthographe : on écrit « ${good} ».`]]),
    hint: `Les initiales du nom sont : ${good
      .split(' ')
      .map((w) => `« ${w.slice(0, 1)} »`)
      .join(', ')}.`,
    steps: ['Cherche le repère appris dans la leçon.', whatIs(r), `Écris la réponse : **${good}**`],
  };
}

const axisOf = (i: number) => at(AXES, i);
const whyActivity = (i: number, key: string) => `« ${key} » va avec « ${axisOf(i)} ».`;

function axisMatch(rng: Rng): QuestionDraft {
  const picked = some(rng, [0, 1, 2, 3, 4, 5], 5).map((i) => rng.pick(ACTIVITIES.filter((a) => a[0] === i)));
  const rows = picked.map(([i, text]) => [text, axisOf(i)] as const);
  return {
    prompt: `Associe chaque activité à son axe culturel : ${quoted(rows.map((r) => r[0]))}`,
    answer: pairs(rng, rows),
    hint: 'Repère le mot clé : « portrait », « seasons », « fantasy », « clubs », « language ».',
    steps: [AXIS_RULE, ...solved(picked.map(([i, , key]) => [key, axisOf(i)] as const))],
  };
}

function week(rng: Rng): QuestionDraft {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'] as const;
  const frenchDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi'] as const;
  const chosen = some(rng, [0, 1, 2, 3, 4, 5], 4).map((i) => rng.pick(ACTIVITIES.filter((a) => a[0] === i)));
  const rows = chosen.map(([i, text, key], n) => ({
    line: `${at(days, n)}: ${text}`,
    ask: `${at(frenchDays, n)}, l’axe est`,
    good: axisOf(i),
    options: [...AXES],
    why: whyActivity(i, key),
  }));
  return {
    prompt: 'Lis le programme de la semaine, puis choisis l’axe culturel de chaque journée.',
    figure: document(
      'Culture week',
      rows.map((r) => r.line),
    ),
    answer: lists(rng, rows),
    hint: 'Lis chaque ligne en entier : de quoi parle la classe ce jour-là ?',
    steps: [
      AXIS_RULE,
      'Repère dans chaque ligne le mot qui annonce le thème.',
      `Compare avec les titres, par exemple : ${at(rows, 0).why}`,
      `Vérifie la réponse : **${rows.map((r) => r.good).join(' ; ')}**`,
    ],
  };
}

const axes: Skill = {
  id: 'a5-reperes-axes',
  title: 'Les repères des axes culturels de 5e',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'savais-tu',
      text: 'Les « yearbooks » sont une tradition appréciée des écoles américaines.',
      source: PROG,
      citation: 'Yearbooks are a popular tradition in American schools.',
    },
  ],
  lesson: {
    memo: [
      'Six **axes culturels**, dont cinq étudiés en 5e : Portrait, autoportrait ; Le quotidien : lieux, rythmes, saisons ; Le réel et l’imaginaire.',
      'Puis École et loisirs ; Des langues, des lieux, des histoires ; Le Royaume-Uni, toujours étudié.',
      'Repères : yearbook (album scolaire) ; National Portrait Gallery (portraits) ; National Trust (patrimoine) ; BBC (séries) ; Cadbury et Roald Dahl (imaginaire) ; Thanksgiving (dinde).',
    ],
    source: source('les six axes culturels et leurs objets d’étude (proposés à titre indicatif)'),
    sources: [PROG, 'bc-teens-thanksgiving'],
  },
  generate: (rng, level): QuestionDraft => {
    if (level === 1) return referenceSpot(rng);
    if (level === 2) return referenceRecognise(rng);
    if (level === 3) return referenceWrite(rng);
    if (level === 4) return axisMatch(rng);
    return week(rng);
  },
};

export const ENGLISH_VOCABULARY_5E_CHAPTER: Chapter = {
  id: 'a5-vocabulaire-thematique',
  subject: 'anglais',
  grade: '5e',
  domain: 'langue',
  title: 'Vocabulaire thématique',
  skills: [travel, sport, nature, famous, axes],
};
