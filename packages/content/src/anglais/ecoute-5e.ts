import type { Chapter, QuestionDraft, Skill } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import { timeEn, timeForms, digital, next, type Time } from './ecoute-cm2.ts';
import { numberWord } from './ecoute-faits.ts';
import {
  ANNOUNCEMENTS,
  INTENTIONS,
  LANDMARKS,
  PLANS,
  SCENES,
  TALKS,
  TOURS,
  VISITS,
  type Announcement,
  type Landmark,
  type Plan,
} from './ecoute-5e-donnees.ts';
import { pairs, typed } from './pronoms.ts';
import { at, others, shuffledOther, some } from './temps.ts';

/**
 * Anglais 5e — « Écouter et comprendre » (lot an-5e-07, docs/adr/0034). Programme d'anglais du collège (arrêté du
 * 5 mai 2025), classe de 5e : comprendre des messages et des conversations simples, noter des informations, repères
 * sur le Royaume-Uni (axe 6). Faits : voir ecoute-5e-faits.ts. Chaque forme de question existe à écouter et à lire
 * (alternative quand l'appareil n'a pas de voix anglaise).
 */
const PROGRAMME = 'Programme d’anglais du collège (arrêté du 5 mai 2025), classe de 5e';
const source = (detail: string) => `${PROGRAMME} — ${detail}.`;
const PROG = 'anglais-college-2025';
const EN = 'en-GB';
const ABOUT = 'Écrit pour l’exercice.';

const coin = (rng: Rng) => rng.int(0, 1) === 0;
const document = (title: string, lines: readonly string[]) => ({
  kind: 'document' as const,
  title,
  lines: [...lines],
  credit: ABOUT,
});

/** Message entendu, ou affiché (une question sur trois) quand la voix anglaise manque. */
function heard(
  rng: Rng,
  lines: readonly string[],
  context: string,
  task: string,
): Pick<QuestionDraft, 'prompt' | 'audio' | 'figure'> {
  if (rng.int(0, 2) === 0) return { prompt: `${context} Lis le texte. ${task}`, figure: document('Message', lines) };
  return { prompt: `${context} Écoute. ${task}`, audio: { text: lines.join(' '), lang: EN } };
}

/** Phrase citée sans son point final : une bulle reste une seule phrase. */
const cited = (line: string) => `« ${line.replace(/\.$/, '')} »`;
/** Réplique sans ponctuation de fin de phrase (elle couperait la bulle). */
const bare = (text: string) => text.replace(/[.!?]+(?=\s)/g, ',').replace(/[.!?]+$/, '');
/** Paires de la réponse, en deux bulles courtes. */
const solved = (rows: readonly (readonly [string, string])[]) => {
  const half = (list: typeof rows) => `**${list.map(([a, b]) => `${bare(a)} = ${b}`).join(' ; ')}**`;
  return [`Vérifie les premières paires : ${half(rows.slice(0, 2))}`, `Vérifie les autres : ${half(rows.slice(2))}`];
};
/** Pourquoi une heure décalée d’une demi-heure est fausse. */
const halfWhy = (t: Time) =>
  t.m === 30 ? '« half past » veut dire « et demie ».' : 'Vérifie « past » (après l’heure) et « to » (avant l’heure).';
const dotted = (forms: readonly string[]) => forms.flatMap((f) => [f, `${f}.`]);
const noAccent = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '');
/** Réponse en français : avec ou sans point, avec ou sans accents (la notion porte sur l'anglais). */
const french = (forms: readonly string[]) => dotted([...new Set(forms.flatMap((f) => [f, noAccent(f)]))]);

/** Écritures en chiffres, sur 12 heures : aucun message ne précise le moment de la journée. */
export function digitForms(t: Time): string[] {
  const mm = String(t.m).padStart(2, '0');
  const hours = [String(t.h), String(t.h).padStart(2, '0')];
  const written = hours.flatMap((h) => [`${h}:${mm}`, `${h}.${mm}`, `${h}h${mm}`, `${h} h ${mm}`]);
  return [...new Set([digital(t), ...dotted(written)])];
}
/** Toutes les écritures d'une heure : chiffres et anglais. */
export function hourForms(t: Time): string[] {
  const minutes: Readonly<Record<number, string>> = { 15: 'fifteen', 30: 'thirty', 45: 'forty-five' };
  const said = minutes[t.m];
  const plain = said ? [`${numberWord(t.h)} ${said}`, `${numberWord(t.h)} ${said.replace('-', ' ')}`] : [];
  return [...new Set([...digitForms(t), ...dotted(plain), ...timeForms(t)])];
}
export const priceForms = (n: number): string[] =>
  dotted([
    String(n),
    `£${n}`,
    `£ ${n}`,
    `${n} £`,
    `${n}£`,
    `${n} livres`,
    `${n} livres sterling`,
    `${n} pounds`,
    numberWord(n),
    `${numberWord(n)} pounds`,
  ]);
/** Consigne « en chiffres » : les prix écrits en toutes lettres sont écartés. */
export const priceDigitForms = (n: number): string[] => priceForms(n).filter((f) => /\d/.test(f));

// ——— 1. Comprendre un message enregistré ———

const noteLines = (a: Announcement): readonly string[] => [
  a.opening,
  `${a.event} at ${timeEn(a.time)}.`,
  `Meet us ${a.place.en}.`,
  `It costs ${numberWord(a.price)} pounds.`,
  a.rule.en,
];
const changedLines = (a: Announcement): readonly string[] => [
  ...noteLines(a).slice(0, 4),
  'Listen carefully: there is a change today.',
  `The new time is ${timeEn(a.newTime)}.`,
  `Meet us ${a.newPlace.en}, not ${a.place.en}.`,
  a.rule.en,
];
const voice = (a: Announcement) => `${a.listener} reçoit un message enregistré.`;
const SPOT = 'Repère les mots que tu connais : ils disent qui parle.';

function origin(rng: Rng): QuestionDraft {
  const a = rng.pick(ANNOUNCEMENTS);
  const { answer, traps } = choice(
    rng,
    a.source,
    others(rng, ANNOUNCEMENTS, a, 2).map((o) => ({
      label: o.source,
      why: `Aucune phrase n’annonce « ${o.source} ». Relève plutôt « ${a.opening} »`,
    })),
  );
  return {
    ...heard(rng, noteLines(a), voice(a), 'Trouve qui l’envoie.'),
    answer,
    traps,
    hint: 'Repère surtout la première phrase : un lieu ou un métier s’y cache.',
    steps: [
      SPOT,
      `Retrouve le début : ${cited(a.opening.split(/(?<=\.) /).at(-1) ?? a.opening)}`,
      `Retiens la réponse : **${a.source}**`,
    ],
  };
}

function messageDetail(rng: Rng): QuestionDraft {
  const a = rng.pick(ANNOUNCEMENTS);
  if (coin(rng)) {
    const { answer, traps } = choice(
      rng,
      a.rule.fr,
      others(rng, ANNOUNCEMENTS, a, 3).map((o) => ({
        label: o.rule.fr,
        why: `Cette consigne serait « ${o.rule.en} » Elle n’est pas dite ici.`,
      })),
    );
    return {
      ...heard(rng, noteLines(a), voice(a), 'Choisis la consigne donnée.'),
      answer,
      traps,
      hint: 'La consigne arrive à la fin, après « please », « must » ou « mustn’t ».',
      steps: [
        'Cherche « please », « must » ou « mustn’t » : ils annoncent une consigne.',
        `Retrouve la dernière phrase : ${cited(a.rule.en)}`,
        `Retiens la réponse : **${a.rule.fr}**`,
      ],
    };
  }
  const t = a.time;
  const wrongTimes: readonly (readonly [Time, string])[] = [
    [{ h: next(t.h), m: t.m }, 'Écoute bien le nombre : il y a une heure de trop.'],
    [{ h: t.h, m: (t.m + 30) % 60 }, halfWhy(t)],
    [{ h: t.h === 1 ? 12 : t.h - 1, m: t.m }, 'Écoute bien le nombre : il manque une heure.'],
  ];
  const { answer, traps } = choice(
    rng,
    digital(t),
    wrongTimes.map(([w, why]) => ({ label: digital(w), why })),
  );
  return {
    ...heard(rng, noteLines(a), voice(a), `Choisis l’heure annoncée pour ${a.what}.`),
    answer,
    traps,
    hint: 'Attends le mot « at » : l’heure vient juste après.',
    steps: [
      'Repère le mot « at » : il annonce l’heure.',
      `Retrouve la phrase : ${cited(`${a.event} at ${timeEn(t)}`)}`,
      `Retiens la réponse : **${digital(t)}**`,
    ],
  };
}

type Field = 'time' | 'place' | 'price';
const FIELDS: readonly Field[] = ['time', 'place', 'price'];
const ACCEPTED: Readonly<Record<Field, (a: Announcement) => readonly string[]>> = {
  time: (a) => hourForms(a.time),
  place: (a) => french(a.place.fr),
  price: (a) => priceForms(a.price),
};
const SHOWN: Readonly<Record<Field, (a: Announcement) => string>> = {
  time: (a) => digital(a.time),
  place: (a) => a.place.fr[0],
  price: (a) => `${a.price} livres`,
};
const KEY: Readonly<Record<Field, (a: Announcement) => string>> = {
  time: (a) => `${a.event} at ${timeEn(a.time)}.`,
  place: (a) => `Meet us ${a.place.en}.`,
  price: (a) => `It costs ${numberWord(a.price)} pounds.`,
};
const CLUE: Readonly<Record<Field, string>> = {
  time: 'Attends le mot « at » : l’heure vient juste après.',
  place: 'Attends « Meet us » : le lieu vient juste après.',
  price: 'Attends « It costs » : le prix vient juste après.',
};

function writeNote(rng: Rng): QuestionDraft {
  const a = rng.pick(ANNOUNCEMENTS);
  const field = rng.pick(FIELDS);
  const task = {
    time: `Écris en chiffres l’heure annoncée pour ${a.what}.`,
    place: 'Écris en français le lieu du rendez-vous.',
    price: 'Écris en chiffres le prix demandé.',
  }[field];
  const accepted = { time: digitForms(a.time), place: ACCEPTED.place(a), price: priceDigitForms(a.price) }[field];
  const wrong: readonly (readonly [string, string])[] =
    field === 'time'
      ? [
          [digital({ h: next(a.time.h), m: a.time.m }), 'Il y a une heure de trop. Réécoute le nombre.'],
          [digital({ h: a.time.h, m: (a.time.m + 30) % 60 }), halfWhy(a.time)],
        ]
      : field === 'price'
        ? [
            [String(a.price + 10), 'Ce nombre est trop grand : réécoute le nombre en entier.'],
            [String(a.price + 1), 'Réécoute le nombre placé avant « pounds ».'],
          ]
        : [
            [a.place.en, 'Tu as reconnu le lieu : écris-le maintenant en français.'],
            [a.newPlace.fr[0], 'Ce lieu n’est pas dans le message. Réécoute après « Meet us ».'],
          ];
  return {
    ...heard(rng, noteLines(a), voice(a), task),
    answer: { kind: 'text', accepted: [...accepted] },
    traps: typed(SHOWN[field](a), wrong).filter((t) => !('text' in t) || !accepted.includes(t.text)),
    hint: CLUE[field],
    steps: [
      'Cherche une seule information et laisse le reste de côté.',
      `Retrouve la phrase utile : ${cited(KEY[field](a))}`,
      `Écris la réponse : **${SHOWN[field](a)}**`,
    ],
  };
}

const NOTE_PARTS = ['Heure : ', ' · Lieu (en français) : ', ' · Prix en livres : ', ''];

function fillNote(rng: Rng, changed: boolean): QuestionDraft {
  const a = rng.pick(ANNOUNCEMENTS);
  const final: Announcement = changed ? { ...a, time: a.newTime, place: a.newPlace } : a;
  const lines = changed ? changedLines(a) : noteLines(a);
  const task = changed
    ? 'Complète la fiche avec les informations valables aujourd’hui.'
    : 'Complète la fiche du message.';
  const utile = cited(changed ? `The new time is ${timeEn(a.newTime)}` : `${a.event} at ${timeEn(a.time)}`);
  const meet = cited(changed ? `Meet us ${a.newPlace.en}, not ${a.place.en}` : `Meet us ${a.place.en}`);
  return {
    ...heard(rng, lines, voice(a), task),
    answer: {
      kind: 'cloze',
      parts: [...NOTE_PARTS],
      blanks: FIELDS.map((f) => ({ mode: 'text' as const, accepted: [...ACCEPTED[f](final)] })),
    },
    hint: changed
      ? 'Une information annoncée au début peut changer : va jusqu’au bout du message.'
      : 'Note une information à la fois : l’heure, puis le lieu, puis le prix.',
    steps: [
      changed
        ? 'Cherche jusqu’au bout : « change » annonce de nouvelles informations.'
        : 'Complète la fiche dans l’ordre : heure, lieu, prix.',
      `Relève l’heure : ${utile}.`,
      `Relève le lieu : ${meet}. Note le prix : ${cited(`It costs ${numberWord(a.price)} pounds`)}.`,
      `Écris la réponse : **${FIELDS.map((f) => SHOWN[f](final)).join(', ')}**`,
    ],
  };
}

const recorded: Skill = {
  id: 'a5-message-enregistre',
  title: 'Comprendre un message enregistré',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'usage',
      text: 'Noter l’heure d’un train ou d’un spectacle t’aide à préparer un projet.',
      source: PROG,
      citation:
        'prendre en note des informations factuelles nécessaires à la réalisation d’un projet, telles que les horaires de trains ou de spectacles',
    },
  ],
  lesson: {
    memo: [
      'Écoute d’abord pour savoir qui parle, puis repère les **mots-clés** : heure, lieu, prix, consigne.',
      'Dans ces messages, l’heure vient après « at » et le prix après « It costs ».',
      'Écoute jusqu’au bout : « change » ou « not » annonce parfois une correction.',
    ],
    source: source('compréhension de l’oral : noter des horaires, des lieux et des consignes'),
    sources: [PROG, 'bck-tell-time'],
  },
  generate: (rng, level): QuestionDraft => {
    if (level === 1) return origin(rng);
    if (level === 2) return messageDetail(rng);
    if (level === 3) return writeNote(rng);
    return fillNote(rng, level === 5);
  },
};

// ——— 2. Comprendre un dialogue ———

const TWO = 'Repère le nom donné avant chaque réplique : il dit qui parle.';

function topic(rng: Rng): QuestionDraft {
  const t = rng.pick(TALKS);
  const { answer, traps } = choice(
    rng,
    t.topic,
    others(rng, TALKS, t, 2).map((o) => ({
      label: o.topic,
      why: `Ce n’est pas le sujet : « ${o.topic} » n’apparaît dans aucune réplique.`,
    })),
  );
  return {
    ...heard(rng, t.lines, t.context, 'Trouve le sujet de la conversation.'),
    answer,
    traps,
    hint: 'Ne traduis pas tout : retiens deux mots que tu connais.',
    steps: [TWO, `Retrouve la première réplique : ${cited(at(t.lines, 0))}`, `Retiens la réponse : **${t.topic}**`],
  };
}

function reaction(rng: Rng): QuestionDraft {
  const t = rng.pick(TALKS);
  const { answer, traps } = choice(rng, t.good, t.wrong);
  return {
    ...heard(rng, t.lines, t.context, t.question),
    answer,
    traps,
    hint: 'La réponse se trouve dans une réplique précise : trouve qui est interrogé.',
    steps: [
      TWO,
      `Retrouve la réplique utile : ${cited(t.key)}`,
      `Retiens ceci : ${t.why}`,
      `Retiens la réponse : **${t.good}**`,
    ],
  };
}

const planLines = (p: Plan): readonly string[] => {
  const [a, b] = p.names;
  return [
    `${a}: ${p.invitation} on ${p.no.en}?`,
    `${b}: Sorry, I can’t. ${p.excuse}`,
    `${a}: What about ${p.yes.en}?`,
    `${b}: Yes, great! Where do we meet?`,
    `${a}: Meet me ${p.place.en} at ${timeEn(p.time)}.`,
    `${b}: OK, see you!`,
  ];
};
const planContext = (p: Plan) => `${p.names[0]} invite ${p.names[1]}.`;
type Slot = 'day' | 'place' | 'time';
const SLOTS: readonly Slot[] = ['day', 'place', 'time'];
const slotForms: Readonly<Record<Slot, (p: Plan) => readonly string[]>> = {
  day: (p) => french([p.yes.fr, `le ${p.yes.fr}`]),
  place: (p) => french(p.place.fr),
  time: (p) => hourForms(p.time),
};
const slotShown: Readonly<Record<Slot, (p: Plan) => string>> = {
  day: (p) => p.yes.fr,
  place: (p) => p.place.fr[0],
  time: (p) => digital(p.time),
};
const slotKey: Readonly<Record<Slot, (p: Plan) => string>> = {
  day: (p) => `What about ${p.yes.en}?`,
  place: (p) => `Meet me ${p.place.en} at ${timeEn(p.time)}.`,
  time: (p) => `Meet me ${p.place.en} at ${timeEn(p.time)}.`,
};

function writeMeeting(rng: Rng): QuestionDraft {
  const p = rng.pick(PLANS);
  const slot = rng.pick(SLOTS);
  const task = {
    day: 'Écris en français le jour choisi pour se voir.',
    place: 'Écris en français le lieu du rendez-vous.',
    time: 'Écris en chiffres l’heure du rendez-vous.',
  }[slot];
  const wrong: readonly (readonly [string, string])[] =
    slot === 'day'
      ? [
          [p.no.fr, 'Ce jour est refusé : « I can’t ». Cherche le jour accepté.'],
          [p.yes.en, 'Tu as reconnu le jour : écris-le en français.'],
        ]
      : slot === 'time'
        ? [
            [digital({ h: next(p.time.h), m: p.time.m }), 'Il y a une heure de trop. Réécoute le nombre.'],
            [digital({ h: p.time.h, m: (p.time.m + 30) % 60 }), halfWhy(p.time)],
          ]
        : [
            [p.place.en, 'Tu as reconnu le lieu : écris-le en français.'],
            [p.yes.fr, 'C’est un jour. On demande un lieu.'],
          ];
  return {
    ...heard(rng, planLines(p), planContext(p), task),
    answer: { kind: 'text', accepted: [...(slot === 'time' ? digitForms(p.time) : slotForms[slot](p))] },
    traps: typed(slotShown[slot](p), wrong),
    hint:
      slot === 'day' ? 'Le premier jour cité est-il accepté ?' : 'La phrase « Meet me… » donne le lieu puis l’heure.',
    steps: [
      TWO,
      `Retrouve la phrase utile : ${cited(slotKey[slot](p))}`,
      `Écris la réponse : **${slotShown[slot](p)}**`,
    ],
  };
}

function fillMeeting(rng: Rng): QuestionDraft {
  const p = rng.pick(PLANS);
  return {
    ...heard(rng, planLines(p), planContext(p), 'Complète le rendez-vous en français.'),
    answer: {
      kind: 'cloze',
      parts: ['Jour : ', ' · Lieu : ', ' · Heure : ', ''],
      blanks: SLOTS.map((s) => ({ mode: 'text' as const, accepted: [...slotForms[s](p)] })),
    },
    hint: 'Un premier jour est proposé puis refusé : ne le note pas.',
    steps: [
      'Écarte le jour refusé avec « Sorry, I can’t ».',
      `Relève le jour accepté : « What about ${p.yes.en} »`,
      `Relève le lieu et l’heure : « Meet me ${p.place.en} at ${timeEn(p.time)} »`,
      `Écris la réponse : **${SLOTS.map((s) => slotShown[s](p)).join(', ')}**`,
    ],
  };
}

function intentions(rng: Rng): QuestionDraft {
  const rows = some(rng, INTENTIONS, 5).map((i) => [i.en, i.fr] as const);
  return {
    prompt: `Associe chaque réplique à ce que la personne veut faire : ${rows.map(([en]) => `« ${en} »`).join(' ')}`,
    answer: pairs(rng, rows),
    hint: 'Commence par les répliques qui ont un mot très clair, comme « Thanks » ou « sorry ».',
    steps: ['Demande-toi ce que veut la personne qui parle.', ...solved(rows)],
  };
}

function scene(rng: Rng): QuestionDraft {
  const s = rng.pick(SCENES);
  const items = shuffledOther(rng, s.moments);
  return {
    ...heard(rng, s.lines, s.context, 'Range les moments dans l’ordre où ils se passent.'),
    answer: { kind: 'order', items, correct: s.moments.map((m) => items.indexOf(m)) },
    hint: 'L’ordre des phrases n’est pas toujours celui des faits : repère « before », « after », « then ».',
    steps: [
      'Repère les petits mots de temps : « first », « before », « after », « then », « finally ».',
      s.how,
      `Vérifie la réponse : **${s.moments.join(', ')}**`,
    ],
  };
}

const dialogue: Skill = {
  id: 'a5-dialogue',
  title: 'Comprendre un dialogue',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'usage',
      text: 'Suivre une conversation t’aide à repérer des informations simples quand des gens parlent anglais.',
      source: PROG,
      citation:
        'Il peut comprendre et repérer des informations simples, relevant de situations prévisibles, exprimées dans une langue usuelle',
    },
  ],
  lesson: {
    memo: [
      'Dans un **dialogue**, repère qui parle, puis ce que chacun veut : inviter, accepter, refuser.',
      '« I’m sorry, I can’t » refuse ; « Good idea » accepte ; « Can you repeat » demande de répéter.',
      '« What about Friday » propose un autre jour : le premier ne compte plus.',
    ],
    source: source('compréhension de l’oral : conversations simples, accord, désaccord, demandes'),
    sources: [PROG, 'bck-tell-time'],
  },
  generate: (rng, level): QuestionDraft => {
    if (level === 1) return topic(rng);
    if (level === 2) return reaction(rng);
    if (level === 3) return writeMeeting(rng);
    if (level === 4) return coin(rng) ? intentions(rng) : fillMeeting(rng);
    return scene(rng);
  },
};

// ——— 3. Repères culturels à l'écoute ———

type Stop = (typeof VISITS)[keyof typeof VISITS];
const UK_RULE = 'Repère un nom propre : il désigne un lieu, une personne ou un objet.';
/** Deux repères sur la même idée : jamais dans les mêmes propositions. */
const CLOSE_TOPICS: readonly (readonly string[])[] = [
  ['hampton', 'chartwell', 'tower'],
  ['causeway', 'dragon'],
];
const apart = (a: Landmark, b: Landmark) => !CLOSE_TOPICS.some((g) => g.includes(a.id) && g.includes(b.id));

const guided = (l: Landmark) => `${l.listener} écoute un guide au Royaume-Uni.`;
/** La phrase du message qui contient la réponse à écrire. */
const answerLine = (l: Landmark) => l.lines.find((line) => l.typed.accepted.some((a) => line.includes(a))) ?? l.key;

function aboutWhat(rng: Rng): QuestionDraft {
  const l = rng.pick(LANDMARKS);
  const wrong = some(
    rng,
    LANDMARKS.filter((o) => o !== l && apart(l, o)),
    2,
  );
  const { answer, traps } = choice(
    rng,
    l.topic,
    wrong.map((o) => ({ label: o.topic, why: `Le guide ne parle pas de ceci : « ${o.topic} ».` })),
  );
  return {
    ...heard(rng, l.lines, guided(l), 'Trouve de quoi parle le guide.'),
    answer,
    traps,
    hint: 'Repère le nom propre et le mot qui le suit.',
    steps: [
      UK_RULE,
      `Retrouve la phrase : ${cited(at(l.lines, 0))}`,
      ...(l.help ? [l.help] : []),
      `Retiens la réponse : **${l.topic}**`,
    ],
  };
}

function landmarkDetail(rng: Rng): QuestionDraft {
  const l = rng.pick(LANDMARKS);
  const { answer, traps } = choice(rng, l.good, l.wrong);
  return {
    ...heard(rng, l.lines, guided(l), l.question),
    answer,
    traps,
    hint: 'La réponse est dans une phrase : repère les noms et les verbes.',
    steps: [UK_RULE, `Retrouve la phrase utile : ${cited(l.key)}`, `Retiens la réponse : **${l.good}**`],
  };
}

function landmarkWrite(rng: Rng): QuestionDraft {
  const l = rng.pick(LANDMARKS);
  const [good] = l.typed.accepted;
  return {
    ...heard(rng, l.lines, guided(l), l.typed.ask),
    answer: { kind: 'text', accepted: dotted(l.typed.accepted.flatMap((f) => [f, f.replaceAll('’', '')])) },
    traps: typed(good, [l.typed.trap]),
    hint: 'Cherche le mot précis, puis écris-le avec une majuscule si c’est un nom propre.',
    steps: [
      'Cherche un seul mot ou groupe de mots.',
      `Cherche dans cette phrase : ${cited(answerLine(l))}`,
      `Écris la réponse : **${good}**`,
    ],
  };
}

function landmarkPairs(rng: Rng): QuestionDraft {
  const rows = some(rng, LANDMARKS, 5).map((l) => [l.name, l.clue] as const);
  return {
    prompt: `Associe chaque repère britannique à ce qui lui correspond : ${rows.map((r) => r[0]).join(', ')}.`,
    answer: pairs(rng, rows),
    hint: 'Commence par le repère que tu connais le mieux : il en restera moins à placer.',
    steps: ['Relie d’abord les repères que tu connais déjà.', ...solved(rows)],
  };
}

function twoLandmarks(rng: Rng): QuestionDraft {
  const [a, b] = some(rng, LANDMARKS, 2) as [Landmark, Landmark];
  return {
    ...heard(
      rng,
      [...a.lines, ...b.lines],
      'Un guide parle de deux repères.',
      `Complète les réponses. 1) ${a.typed.ask} 2) ${b.typed.ask}`,
    ),
    answer: {
      kind: 'cloze',
      parts: ['1) ', ' 2) ', ''],
      blanks: [a, b].map((l) => ({ mode: 'text' as const, accepted: dotted(l.typed.accepted) })),
    },
    hint: 'Les réponses arrivent dans l’ordre des questions.',
    steps: [
      'Lis les deux questions avant d’écouter.',
      `Cherche la première information : ${cited(answerLine(a))}.`,
      `Cherche la seconde information : ${cited(answerLine(b))}.`,
      `Écris la réponse : **${a.typed.accepted[0]}, ${b.typed.accepted[0]}**`,
    ],
  };
}

function tour(rng: Rng): QuestionDraft {
  const t = rng.pick(TOURS);
  const [a, b, c, d] = t.stops.map((k) => VISITS[k]) as [Stop, Stop, Stop, Stop];
  const lines = [
    'Welcome! Here is our plan for the week.',
    `First, we will visit ${a.say}.`,
    `Then we will see ${c.say}, but before that, we will see ${b.say}.`,
    `Finally, we will visit ${d.say}.`,
  ];
  const right = [a, b, c, d].map((s) => s.clue);
  const items = shuffledOther(rng, right);
  return {
    ...heard(rng, lines, `Un guide présente son voyage à ${t.guest}.`, 'Range les visites dans l’ordre prévu.'),
    answer: { kind: 'order', items, correct: right.map((r) => items.indexOf(r)) },
    hint: 'Relie chaque nom à sa description, puis méfie-toi de « before that ».',
    steps: [
      'Associe d’abord chaque nom entendu à sa description.',
      'Repère « but before that » : cette visite passe avant la précédente.',
      `Suis cet ordre : ${[a, b, c, d].map((s) => s.say).join(' → ')}.`,
      `Vérifie la réponse : **${right.join(' → ')}**`,
    ],
  };
}

const landmarks: Skill = {
  id: 'a5-ecoute-reperes',
  title: 'Écouter des repères culturels sur le Royaume-Uni',
  levels: 5,
  version: 1,
  sens: [
    {
      type: 'savais-tu',
      text: 'Le Royaume-Uni réunit plusieurs nations et régions, avec des accents et des traditions propres.',
      source: PROG,
      citation: 'qui comprend plusieurs nations et régions avec des accents, traditions et identités propres',
    },
  ],
  lesson: {
    memo: [
      'Un **repère culturel** : Chartwell, maison de Winston Churchill ; Hampton Court Palace, demeure du roi Henry VIII.',
      'Le Royaume-Uni compte l’Angleterre, l’Écosse, le pays de Galles et l’Irlande du Nord.',
      'À l’écoute, attrape d’abord le nom propre, puis le mot qui explique ce que c’est.',
    ],
    source: source('compréhension de l’oral ; axe 6, le Royaume-Uni'),
    sources: [PROG, 'bck-uk'],
  },
  generate: (rng, level): QuestionDraft => {
    if (level === 1) return aboutWhat(rng);
    if (level === 2) return landmarkDetail(rng);
    if (level === 3) return landmarkWrite(rng);
    if (level === 4) return coin(rng) ? landmarkPairs(rng) : twoLandmarks(rng);
    return tour(rng);
  },
};

export const ENGLISH_LISTENING_5E_CHAPTER: Chapter = {
  id: 'a5-ecouter-comprendre',
  subject: 'anglais',
  grade: '5e',
  domain: 'langue',
  title: 'Écouter et comprendre',
  skills: [recorded, dialogue, landmarks],
};
