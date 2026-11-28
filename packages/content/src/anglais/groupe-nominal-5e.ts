import type { Chapter, Level, QuestionDraft, Sens, Skill, Trap } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import { at, some } from './temps.ts';
import { coin, pairs, quoted } from './futur.ts';
import { document, ok, textTraps, typed } from './outils-lot05.ts';

/**
 * Anglais 5e — « Groupe nominal et pronoms » (lot an-5e-05, docs/adr/0034). Programme d'anglais du collège (arrêté du
 * 5 mai 2025) ; règles et formes : British Council (voir groupe-nominal-5e-faits.ts : chaque fait y porte sa source
 * et sa citation).
 */
const PROGRAMME = 'Programme d’anglais du collège (arrêté du 5 mai 2025), classe de 5e';
const source = (detail: string, pages: string) => `${PROGRAMME} — ${detail}. Règles : British Council, ${pages}.`;
const PROG = 'anglais-college-2025';
const sens = (type: Sens['type'], text: string, sourceId: string, citation: string): Sens => ({
  type,
  text,
  source: sourceId,
  citation,
});

// ——— 1. much, many, some ———
export interface Noun {
  readonly en: string;
  readonly countable: boolean;
  /** « de livres », « d’eau » : après « beaucoup ». */
  readonly of: string;
  /** Peut se proposer ou se demander à table ou en classe. */
  readonly offer?: boolean;
}
const noun = (en: string, countable: boolean, of: string, offer = false): Noun => ({ en, countable, of, offer });
export const NOUNS: readonly Noun[] = [
  noun('books', true, 'de livres'),
  noun('apples', true, 'de pommes', true),
  noun('shops', true, 'de magasins'),
  noun('friends', true, 'd’amis'),
  noun('sandwiches', true, 'de sandwichs', true),
  noun('pencils', true, 'de crayons', true),
  noun('games', true, 'de jeux'),
  noun('bikes', true, 'de vélos'),
  noun('posters', true, 'd’affiches'),
  noun('eggs', true, 'd’œufs', true),
  noun('water', false, 'd’eau', true),
  noun('milk', false, 'de lait', true),
  noun('bread', false, 'de pain', true),
  noun('salt', false, 'de sel', true),
  noun('money', false, 'd’argent'),
  noun('homework', false, 'de devoirs'),
  noun('information', false, 'd’informations'),
  noun('furniture', false, 'de meubles'),
  noun('luggage', false, 'de bagages'),
];
const COUNTABLE = NOUNS.filter((n) => n.countable);
const UNCOUNTABLE = NOUNS.filter((n) => !n.countable);
const OFFERS = NOUNS.filter((n) => n.offer);

type Quant = 'much' | 'many' | 'some';
const forCount = (n: Noun): Quant => (n.countable ? 'many' : 'much');
const be = (n: Noun) => (n.countable ? 'are' : 'is');
const WHY_COUNT = (n: Noun) =>
  n.countable
    ? `« ${n.en} » se compte un par un : on emploie many.`
    : `« ${n.en} » ne se compte pas un par un : on emploie much.`;
const WHY_SOME_NEG = 'Dans une question en how ou une phrase négative, on n’emploie pas some.';
const WHY_OFFER = 'Pour proposer ou demander quelque chose, la règle du cours emploie some.';
const countLook = (n: Noun) =>
  n.countable
    ? `Regarde « ${n.en} » : on peut dire one, two, three.`
    : `Regarde « ${n.en} » : on ne le compte pas un par un.`;
/** Retenue commune aux questions en how et aux phrases avec not. */
const RETAIN_COUNT = 'Retiens : many pour des chaises que l’on compte, much pour du jus que l’on verse.';
const countSteps = (n: Noun, answer: string) => [countLook(n), RETAIN_COUNT, `Écris : **${answer}**.`];

function quantifierHow(rng: Rng): QuestionDraft {
  const n = rng.pick(NOUNS);
  const right = forCount(n);
  const { answer, traps } = choice(rng, right, [
    { label: right === 'many' ? 'much' : 'many', why: WHY_COUNT(n) },
    { label: 'some', why: WHY_SOME_NEG },
  ]);
  return {
    prompt: `Choisis le mot qui complète la question : « How … ${n.en} ${be(n)} there? »`,
    answer,
    traps,
    hint: 'Demande-toi si tu peux compter ce nom un par un.',
    steps: countSteps(n, right),
  };
}

function quantifierSentence(rng: Rng): QuestionDraft {
  const n = rng.pick(NOUNS);
  const good = n.countable ? `There aren’t many ${n.en}.` : `There isn’t much ${n.en}.`;
  const wrong = n.countable
    ? [
        { label: `There aren’t much ${n.en}.`, why: WHY_COUNT(n) },
        { label: `There isn’t much ${n.en}.`, why: WHY_COUNT(n) },
        { label: `There aren’t some ${n.en}.`, why: WHY_SOME_NEG },
      ]
    : [
        { label: `There isn’t many ${n.en}.`, why: WHY_COUNT(n) },
        { label: `There aren’t much ${n.en}.`, why: 'Avec un nom qui ne se compte pas, on dit There isn’t.' },
        { label: `There isn’t some ${n.en}.`, why: WHY_SOME_NEG },
      ];
  const { answer, traps } = choice(rng, good, wrong);
  return {
    prompt: `Choisis la phrase correcte pour dire « il n’y a pas beaucoup ${n.of} ».`,
    answer,
    traps,
    hint: 'Vérifie deux choses : la forme du verbe, puis le mot de quantité.',
    steps: [countLook(n), 'Retiens : après not, on n’emploie pas some.', `Écris : **${good}**`],
  };
}

const NEGATIVES: readonly (readonly [text: (n: string) => string, countable: boolean])[] = [
  [(n) => `We haven’t got … ${n}.`, true],
  [(n) => `I don’t need … ${n}.`, true],
  [(n) => `We haven’t got … ${n}.`, false],
  [(n) => `I don’t need … ${n}.`, false],
];
const QUESTIONS: readonly (readonly [text: (n: string) => string, countable: boolean])[] = [
  [(n) => `Have you got … ${n}?`, true],
  [(n) => `Are there … ${n}?`, true],
  [(n) => `Have you got … ${n}?`, false],
  [(n) => `Is there … ${n}?`, false],
];

function quantifierWrite(rng: Rng): QuestionDraft {
  const [frame, countable] = rng.pick([...NEGATIVES, ...QUESTIONS]);
  const n = rng.pick(countable ? COUNTABLE : UNCOUNTABLE);
  const right = forCount(n);
  const other = right === 'many' ? 'much' : 'many';
  return {
    prompt: `Écris « much » ou « many » : « ${frame(n.en)} »`,
    answer: typed([right]),
    traps: textTraps([right], [{ text: other, why: WHY_COUNT(n) }]),
    hint: 'Observe le nom après le trou : se compte-t-il un par un ?',
    steps: countSteps(n, right),
  };
}

interface Gapped {
  readonly sentence: string;
  readonly right: Quant;
  readonly why: string;
  readonly rule: string;
  /** Précision de l’énoncé : sans liste de mots, elle écarte les autres réponses justes (any, a few…). */
  readonly cue: string;
  /** Seconde bulle : ce qu’il faut retenir pour ce type de phrase. */
  readonly retain: string;
}
const negative = (rng: Rng): Gapped => {
  const n = rng.pick(NOUNS);
  const right = forCount(n);
  const start = n.countable ? 'There aren’t' : 'There isn’t';
  return {
    sentence: `${start} … ${n.en}.`,
    right,
    why: WHY_COUNT(n),
    rule: countLook(n),
    cue: 'sens : pas beaucoup',
    retain: RETAIN_COUNT,
  };
};
const how = (rng: Rng): Gapped => {
  const n = rng.pick(NOUNS);
  return {
    sentence: `How … ${n.en} have we got?`,
    right: forCount(n),
    why: WHY_COUNT(n),
    rule: countLook(n),
    cue: 'sens : combien',
    retain: RETAIN_COUNT,
  };
};
const offer = (rng: Rng): Gapped => {
  const n = rng.pick(OFFERS);
  // Phrases affirmatives : dans une question d’offre ou de demande, « any » serait juste aussi.
  const sentence = coin(rng) ? `Please have … ${n.en}.` : `I’d like … ${n.en}, please.`;
  return {
    sentence,
    right: 'some',
    why: WHY_OFFER,
    rule: 'Repère qu’on propose ou qu’on demande quelque chose.',
    cue: 'en un seul mot',
    retain: 'Retiens : pour proposer ou demander, on ne donne pas de nombre précis.',
  };
};

function quantifierChoose(rng: Rng): QuestionDraft {
  const g = rng.pick([negative, how, offer, offer])(rng);
  const others = (['much', 'many', 'some'] as const).filter((q) => q !== g.right);
  return {
    prompt: `Complète avec un quantifieur du cours : « ${g.sentence} » (${g.cue})`,
    answer: typed([g.right]),
    traps: textTraps(
      [g.right],
      others.map((text) => ({ text, why: g.why })),
    ),
    hint: 'Cherche d’abord le but : compter, mesurer, proposer ou demander ?',
    steps: [g.rule, g.retain, `Écris : **${g.right}**.`],
  };
}

function quantifierDocument(rng: Rng): QuestionDraft {
  const [a, b] = some(rng, COUNTABLE, 2) as [Noun, Noun];
  const [c, d] = some(rng, UNCOUNTABLE, 2) as [Noun, Noun];
  const wanted = rng.pick(OFFERS.filter((n) => n !== a && n !== b && n !== c && n !== d));
  const rows: readonly (readonly [string, string, Quant])[] = rng
    .shuffle([
      [`How … ${a.en} have we got?`, `question sur ce qu’il reste ${a.of}`, 'many'],
      [`We haven’t got … ${c.en}.`, `il n’y a pas beaucoup ${c.of}`, 'much'],
      [`I’d like … ${wanted.en}, please.`, `demande polie ${wanted.of}`, 'some'],
      [`There aren’t … ${b.en}.`, `il n’y a pas beaucoup ${b.of}`, 'many'],
      [`How … ${d.en} do we need?`, `question sur le besoin ${d.of}`, 'much'],
    ] as const)
    .slice(0, 4);
  const parts = rows.map((r, i) => {
    const before = at(r[0].split('…'), 0);
    const previous = i === 0 ? '' : `${at(at(rows, i - 1)[0].split('…'), 1)} `;
    return `${previous}${before}`;
  });
  parts.push(at(at(rows, 3)[0].split('…'), 1));
  return {
    prompt: 'Lis la liste, puis complète le message avec un quantifieur du cours.',
    figure: document(
      'Picnic list',
      rows.map((r, i) => `Phrase ${i + 1} : ${r[1]}.`),
    ),
    answer: { kind: 'cloze', parts, blanks: rows.map((r) => ({ mode: 'text' as const, accepted: [r[2]] })) },
    hint: 'Pour chaque trou, regarde le nom, puis le type de phrase.',
    steps: [
      'Regarde d’abord si la phrase demande poliment quelque chose.',
      'Pour les autres trous, vérifie si le nom se compte un par un.',
      ok(rows.map((r) => r[2])),
    ],
  };
}

const quantifierSkill: Skill = {
  id: 'a5-quantifieurs',
  title: 'much, many, some : dire une quantité',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'usage',
      'Pour parler des quantités, comme le lait que tu bois ou les magasins de ta ville.',
      'bck-much-many',
      'We can use much and many to talk about quantities.',
    ),
  ],
  lesson: {
    memo: [
      'Un **quantifieur** dit une quantité : many avec un **nom dénombrable**, much avec un **nom indénombrable**.',
      'Dans une question ou après not : how many chairs, not much juice ; pour proposer ou demander : some tea.',
    ],
    source: source('les quantifieurs much, many, some', '« Much and many », « Quantifiers », « Uncount nouns »'),
    sources: [PROG, 'bck-much-many', 'bc-quantifiers', 'bc-uncount-nouns'],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return quantifierHow(rng);
    if (level === 2) return quantifierSentence(rng);
    if (level === 3) return quantifierWrite(rng);
    if (level === 4) return quantifierChoose(rng);
    return quantifierDocument(rng);
  },
};

// ——— 2. pronoms réfléchis ———
export interface Reflexive {
  readonly subject: string;
  readonly self: string;
  readonly object: string;
}
const refl = (subject: string, self: string, object: string): Reflexive => ({ subject, self, object });
export const REFLEXIVES: readonly Reflexive[] = [
  refl('I', 'myself', 'me'),
  refl('you (une personne)', 'yourself', 'you'),
  refl('he', 'himself', 'him'),
  refl('she', 'herself', 'her'),
  refl('it', 'itself', 'it'),
  refl('we', 'ourselves', 'us'),
  refl('you (plusieurs personnes)', 'yourselves', 'you'),
  refl('they', 'themselves', 'them'),
];
const byself = (self: string) =>
  at(
    REFLEXIVES.filter((r) => r.self === self),
    0,
  );
/** Écritures fautives fréquentes. */
const BAD: Readonly<Record<string, string>> = {
  myself: 'meself',
  yourself: 'youself',
  himself: 'hisself',
  herself: 'sheself',
  itself: 'itsself',
  ourselves: 'ourself',
  yourselves: 'yourselfs',
  themselves: 'theirselves',
};
const WHY_OBJECT = 'Ce pronom désigne quelqu’un d’autre : ici l’action revient sur le sujet.';
const WHY_SELF = 'Le pronom réfléchi doit désigner la même personne que le sujet.';
const WHY_SPELLING = 'Cette écriture n’existe pas : revois la liste des pronoms réfléchis.';
const SELF_RULE = 'Retiens : si l’action revient sur le sujet, le mot finit par -self ou -selves.';

interface Scene {
  readonly text: string;
  readonly fr: string;
  readonly self: string;
}
const scene = (text: string, fr: string, self: string): Scene => ({ text, fr, self });
export const SIMPLE_SCENES: readonly Scene[] = [
  scene('I cut … with the scissors.', 'Je me suis coupé tout seul.', 'myself'),
  scene('Tom hurt … in the garden.', 'Tom s’est fait mal.', 'himself'),
  scene('Lisa introduced … to the class.', 'Lisa s’est présentée.', 'herself'),
  scene('Emir teaches … the guitar.', 'Emir apprend la guitare tout seul.', 'himself'),
  scene('Maya blames … for the mistake.', 'Maya se reproche l’erreur.', 'herself'),
  scene('We enjoyed … at the party.', 'Nous nous sommes bien amusés.', 'ourselves'),
  scene('They helped … to some cake.', 'Ils se sont servis du gâteau.', 'themselves'),
  scene('Ben, be careful or you will hurt …!', 'Ben risque de se faire mal.', 'yourself'),
];
export const HARD_SCENES: readonly Scene[] = [
  scene('Tom and I made … a snack.', 'Tom et moi avons préparé un goûter pour nous.', 'ourselves'),
  scene('You and Ana must look after … .', 'Toi et Ana devez prendre soin de vous.', 'yourselves'),
  scene('Boys, you might hurt …!', 'On parle à plusieurs garçons.', 'yourselves'),
  scene('Sara, did you paint this by …?', 'On parle à Sara seule : sans aide ?', 'yourself'),
  scene('The computer turns … off at night.', 'L’ordinateur s’éteint tout seul.', 'itself'),
  scene('My parents bought … a new car.', 'Mes parents ont acheté une voiture pour eux.', 'themselves'),
  scene('My grandma lives by … .', 'Ma grand-mère vit seule.', 'herself'),
  scene('The children got dressed by … .', 'Les enfants se sont habillés sans aide.', 'themselves'),
  scene('My dad cooked dinner all by … .', 'Mon père a cuisiné sans aide.', 'himself'),
];

const selfTraps = (self: string): Trap[] => {
  const r = byself(self);
  const traps: Trap[] = [{ text: BAD[self] ?? '', why: WHY_SPELLING }];
  if (r.object !== self) traps.push({ text: r.object, why: WHY_OBJECT });
  traps.push({ text: self === 'themselves' ? 'himself' : 'themselves', why: WHY_SELF });
  if (self === 'yourselves') traps.push({ text: 'yourself', why: 'On parle à plusieurs personnes : yourselves.' });
  if (self === 'yourself') traps.push({ text: 'yourselves', why: 'On parle à une seule personne : yourself.' });
  return traps;
};

function reflexiveSubject(rng: Rng): QuestionDraft {
  const r = rng.pick(REFLEXIVES);
  const wrong = some(
    rng,
    REFLEXIVES.filter((x) => x !== r),
    2,
  );
  const { answer, traps } = choice(
    rng,
    r.self,
    wrong.map((w) => ({ label: w.self, why: WHY_SELF })),
  );
  return {
    prompt: `Choisis le pronom réfléchi qui va avec le sujet « ${r.subject} ».`,
    answer,
    traps,
    hint: 'Regarde qui fait l’action : une personne ou plusieurs ?',
    steps: [
      `Repère le sujet « ${r.subject} ».`,
      'Retiens : au singulier la fin est -self, au pluriel -selves.',
      `Choisis : **${r.self}**.`,
    ],
  };
}

function reflexivePick(rng: Rng): QuestionDraft {
  const s = rng.pick(SIMPLE_SCENES);
  const r = byself(s.self);
  const others = some(
    rng,
    REFLEXIVES.filter((x) => x.self !== s.self && x.self !== r.object),
    2,
  );
  const { answer, traps } = choice(rng, s.self, [
    { label: r.object, why: WHY_OBJECT },
    ...others.map((o) => ({ label: o.self, why: WHY_SELF })),
  ]);
  return {
    prompt: `Choisis le mot qui complète : « ${s.text} » (${s.fr})`,
    answer,
    traps,
    hint: 'Cherche le sujet : l’action revient-elle sur lui ?',
    steps: [SELF_RULE, 'Trouve le sujet de la phrase avant de choisir.', `Choisis : **${s.self}**.`],
  };
}

const writeScene =
  (scenes: readonly Scene[]) =>
  (rng: Rng): QuestionDraft => {
    const s = rng.pick(scenes);
    return {
      prompt: `Écris le pronom réfléchi : « ${s.text} » (${s.fr})`,
      answer: typed([s.self]),
      traps: textTraps([s.self], selfTraps(s.self)),
      hint: 'Trouve qui fait l’action, puis compte : une personne ou plusieurs ?',
      steps: [SELF_RULE, 'Cherche le sujet et compte les personnes.', `Écris : **${s.self}**.`],
    };
  };

function reflexiveDocument(rng: Rng): QuestionDraft {
  const rows = some(rng, [...SIMPLE_SCENES, ...HARD_SCENES], 4);
  // La ponctuation qui suit le trou colle au mot saisi.
  const after = (r: Scene) => at(r.text.split('…'), 1).replace(/^ (?=[.!?])/, '');
  const parts = rows.map((r, i) => {
    const previous = i === 0 ? '' : `${after(at(rows, i - 1))} `;
    return `${previous}${at(r.text.split('…'), 0)}`;
  });
  parts.push(after(at(rows, 3)));
  return {
    prompt: 'Lis les explications, puis complète chaque phrase avec le bon pronom réfléchi.',
    figure: document(
      'Family news',
      rows.map((r) => r.fr),
    ),
    answer: { kind: 'cloze', parts, blanks: rows.map((r) => ({ mode: 'text' as const, accepted: [r.self] })) },
    hint: 'Pour chaque phrase, entoure d’abord le sujet.',
    steps: [
      'Repère le sujet de chaque phrase.',
      'Compte les personnes : une seule ou plusieurs ?',
      ok(rows.map((r) => r.self)),
    ],
  };
}

const reflexiveSkill: Skill = {
  id: 'a5-pronoms-reflechis',
  title: 'myself, himself, themselves : les pronoms réfléchis',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'usage',
      'Avec « by » et ce petit mot, tu montres que quelqu’un a agi sans aide.',
      'bc-reflexive-pronouns',
      'to show that someone did something without any help',
    ),
  ],
  lesson: {
    memo: [
      'Un **pronom réfléchi** reprend le sujet : myself, yourself, himself, herself, itself.',
      'Au pluriel : ourselves, yourselves, themselves ; exemple : I hurt myself.',
    ],
    source: source('les pronoms personnels réfléchis', '« Reflexive pronouns »'),
    sources: [PROG, 'bc-reflexive-pronouns'],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return reflexiveSubject(rng);
    if (level === 2) return reflexivePick(rng);
    if (level === 3) return writeScene(SIMPLE_SCENES)(rng);
    if (level === 4) return writeScene(HARD_SCENES)(rng);
    return reflexiveDocument(rng);
  },
};

// ——— 3. dérivation : -able, un- ———
export interface Derived {
  readonly base: string;
  /** Adjectif en -able, ses autres écritures, et le sens en français. */
  readonly able: string;
  readonly also: readonly string[];
  readonly fr: string;
  readonly notFr: string;
}
const derived = (base: string, able: string, fr: string, notFr: string, ...also: string[]): Derived => ({
  also,
  base,
  able,
  fr,
  notFr,
});
/** Le verbe garde toutes ses lettres. */
export const PLAIN: readonly Derived[] = [
  derived('wash', 'washable', 'lavable', 'qu’on ne peut pas laver'),
  derived('enjoy', 'enjoyable', 'agréable', 'désagréable'),
  derived('drink', 'drinkable', 'qu’on peut boire', 'imbuvable'),
  derived('read', 'readable', 'lisible', 'illisible'),
  derived('break', 'breakable', 'cassable', 'incassable'),
  derived('accept', 'acceptable', 'qu’on peut admettre', 'qu’on ne peut pas admettre'),
];
/** Le verbe perd son « e » final (écritures avec « e » acceptées quand elles existent). */
export const SPELLED: readonly Derived[] = [
  derived('believe', 'believable', 'croyable', 'incroyable'),
  derived('move', 'movable', 'qu’on peut déplacer', 'qu’on ne peut pas déplacer', 'moveable'),
  derived('use', 'usable', 'utilisable', 'inutilisable', 'useable'),
];

export interface Negated {
  readonly base: string;
  readonly fr: string;
  readonly notFr: string;
}
export const UN_WORDS: readonly Negated[] = [
  { base: 'happy', fr: 'heureux', notFr: 'malheureux' },
  { base: 'kind', fr: 'gentil', notFr: 'pas gentil' },
  { base: 'tidy', fr: 'bien rangé', notFr: 'en désordre' },
  { base: 'lucky', fr: 'chanceux', notFr: 'malchanceux' },
  { base: 'usual', fr: 'habituel', notFr: 'inhabituel' },
  { base: 'fair', fr: 'juste', notFr: 'injuste' },
  { base: 'safe', fr: 'sans danger', notFr: 'dangereux' },
  { base: 'friendly', fr: 'amical', notFr: 'pas amical' },
];

const un = (forms: readonly string[]) => forms.map((f) => `un${f}`);
const WHY_UN = 'Le préfixe un- donne le sens contraire : il se place devant le mot.';
const WHY_NOT_UN = 'Le préfixe un- donne le sens contraire : ici le sens n’est pas contraire.';
const WHY_ORDER = 'Un préfixe se place au début du mot, pas à la fin.';
const WHY_ABLE = 'Le suffixe -able se place après le verbe pour former un adjectif.';
const WHY_E = 'Devant -able, ce verbe perd son « e » final.';
const WHY_ENDING = 'La fin demandée est -able.';
const PREFIX_STEP = 'Ajoute un préfixe au début pour dire le contraire.';

function derivationPrefix(rng: Rng): QuestionDraft {
  const w = rng.pick(UN_WORDS);
  const right = `un${w.base}`;
  const { answer, traps } = choice(rng, right, [
    { label: w.base, why: `« ${w.base} » veut dire « ${w.fr} » : il manque le préfixe du contraire.` },
    { label: `${w.base}un`, why: WHY_ORDER },
  ]);
  return {
    prompt: `Choisis le mot anglais qui veut dire « ${w.notFr} ».`,
    answer,
    traps,
    hint: 'Cherche le petit morceau ajouté au début qui renverse le sens.',
    steps: [`Retrouve le mot de départ : il veut dire « ${w.fr} ».`, PREFIX_STEP, `Choisis : **${right}**.`],
  };
}

function derivationPick(rng: Rng): QuestionDraft {
  const d = rng.pick(PLAIN);
  const negative = coin(rng);
  const right = negative ? `un${d.able}` : d.able;
  const { answer, traps } = choice(rng, right, [
    { label: negative ? d.able : `un${d.able}`, why: negative ? WHY_UN : WHY_NOT_UN },
    { label: `${d.base}ing`, why: WHY_ENDING },
    { label: `un${d.base}`, why: WHY_ENDING },
  ]);
  return {
    prompt: `Choisis l’adjectif formé sur « ${d.base} » qui veut dire « ${negative ? d.notFr : d.fr} ».`,
    answer,
    traps,
    hint: 'Regarde la fin du mot, puis demande-toi si le sens est contraire.',
    steps: [
      'Cherche l’adjectif qui finit comme dans le mémo.',
      'Demande-toi si la phrase dit le contraire : le préfixe change alors le sens.',
      `Choisis : **${right}**.`,
    ],
  };
}

function derivationWrite(rng: Rng): QuestionDraft {
  const d = rng.pick(PLAIN);
  return {
    prompt: `Écris l’adjectif en -able formé sur « ${d.base} », qui veut dire « ${d.fr} ».`,
    answer: typed([d.able]),
    traps: textTraps(
      [d.able],
      [
        { text: `${d.base}ible`, why: WHY_ENDING },
        { text: `${d.base}abel`, why: 'La fin s’écrit -able.' },
        { text: `able ${d.base}`, why: WHY_ABLE },
        { text: `un${d.able}`, why: WHY_NOT_UN },
      ],
    ),
    hint: 'Garde le verbe entier et colle le suffixe juste derrière.',
    steps: [
      `Écris d’abord le verbe « ${d.base} ».`,
      'Ajoute le suffixe à la fin, sans espace.',
      `Écris : **${d.able}**.`,
    ],
  };
}

function derivationHard(rng: Rng): QuestionDraft {
  const spelled = coin(rng);
  const d = rng.pick(spelled ? SPELLED : PLAIN.filter((p) => ['drink', 'read', 'break', 'wash'].includes(p.base)));
  const negative = spelled ? coin(rng) : true;
  const forms = [d.able, ...d.also];
  const accepted = negative ? un(forms) : forms;
  const right = at(accepted, 0);
  const traps: Trap[] = [{ text: negative ? d.able : `un${d.able}`, why: negative ? WHY_UN : WHY_NOT_UN }];
  if (spelled) traps.push({ text: `${negative ? 'un' : ''}${d.base}able`, why: WHY_E });
  if (negative)
    traps.push(
      ...['in', 'im'].map((p) => ({ text: `${p}${d.able}`, why: 'Avec ce mot, le préfixe du cours est un-.' })),
    );
  return {
    prompt: `Avec les ajouts du mémo, écris l’adjectif formé sur « ${d.base} » qui veut dire « ${negative ? d.notFr : d.fr} ».`,
    answer: typed(accepted),
    traps: textTraps(accepted, traps),
    hint: 'Deux questions : le sens est-il contraire ? Le verbe garde-t-il sa dernière lettre ?',
    steps: [
      'Ajoute un préfixe seulement si le sens est contraire.',
      'Vérifie la fin du verbe avant de coller le suffixe.',
      `Écris : **${right}**.`,
    ],
  };
}

interface Context {
  readonly text: string;
  readonly base: string;
  readonly accepted: readonly string[];
}
const context = (text: string, base: string, ...accepted: string[]): Context => ({ text, base, accepted });
export const CONTEXTS: readonly Context[] = [
  context('The river water is very dirty: it is …', 'drink', 'undrinkable'),
  context('This glass never breaks: it is …', 'break', 'unbreakable'),
  context('You can put this shirt in the machine: it is …', 'wash', 'washable'),
  context('I love this game, it is really …', 'enjoy', 'enjoyable'),
  context('A cat that speaks French? That story is …', 'believe', 'unbelievable'),
  context('The old letters are so faded: they are …', 'read', 'unreadable'),
  context('Lisa never shares and always shouts: she is …', 'kind', 'unkind'),
  context('Clothes are all over the floor: the room is …', 'tidy', 'untidy'),
  context('Playing near the road is dangerous: it is …', 'safe', 'unsafe'),
];

function derivationDocument(rng: Rng): QuestionDraft {
  const rows = some(rng, CONTEXTS, 4);
  const parts = rows.map((r, i) => `${i === 0 ? '' : '. '}${r.text.replace('…', '')}`);
  parts.push('.');
  return {
    prompt: 'Lis chaque phrase, puis écris l’adjectif avec le mot donné : ajoute -able ou un- selon le sens.',
    figure: document(
      'Mots de départ',
      rows.map((r, i) => `Trou ${i + 1} : « ${r.base} ».`),
    ),
    answer: { kind: 'cloze', parts, blanks: rows.map((r) => ({ mode: 'text' as const, accepted: r.accepted })) },
    hint: 'Pour chaque trou, lis la phrase : le sens est-il positif ou contraire ?',
    steps: [
      'Lis la phrase entière pour trouver le sens.',
      'Choisis un préfixe, un suffixe, ou les deux.',
      ok(rows.map((r) => at(r.accepted, 0))),
    ],
  };
}

const derivationSkill: Skill = {
  id: 'a5-derivation',
  title: '-able, un- : former des adjectifs',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'savais-tu',
      'Un préfixe ou un suffixe t’aide à comprendre un mot que tu ne connais pas.',
      'bct-prefix-suffix',
      'Prefixes and suffixes can help you understand a word.',
    ),
  ],
  lesson: {
    memo: [
      'Le **suffixe** -able, à la fin, forme un **adjectif** : wash → washable.',
      'Le **préfixe** un-, au début, donne le contraire : happy → unhappy.',
      'Parfois le verbe perd son e : recognise → recognisable → unrecognisable.',
    ],
    source: source('la dérivation avec un suffixe ou un préfixe', '« Does it have a prefix or a suffix? »'),
    sources: [PROG, 'bct-prefix-suffix'],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return derivationPrefix(rng);
    if (level === 2) return derivationPick(rng);
    if (level === 3) return derivationWrite(rng);
    if (level === 4) return derivationHard(rng);
    return derivationDocument(rng);
  },
};

// ——— 4. antonymes ———
export type Pair = readonly [a: string, b: string, fra: string, frb: string];
/** Paires données par le programme. */
export const PROGRAMME_PAIRS: readonly Pair[] = [
  ['quiet', 'noisy', 'calme', 'bruyant'],
  ['urban', 'rural', 'urbain', 'rural'],
  ['real', 'virtual', 'réel', 'virtuel'],
  ['lonely', 'popular', 'solitaire', 'populaire'],
  ['separation', 'union', 'séparation', 'union'],
  ['freedom', 'constraint', 'liberté', 'contrainte'],
];
/** Paires formées avec un préfixe : mot de départ, contraires acceptés (le premier est celui du cours). */
export const PREFIX_PAIRS: readonly (readonly [base: string, accepted: readonly string[], fr: string])[] = [
  ['happy', ['unhappy'], 'heureux'],
  ['possible', ['impossible'], 'possible'],
  ['satisfied', ['dissatisfied'], 'satisfait'],
  ['regular', ['irregular'], 'régulier'],
  ['legal', ['illegal'], 'légal'],
  ['social', ['antisocial', 'anti-social'], 'sociable'],
  ['recognisable', ['unrecognisable', 'unrecognizable'], 'reconnaissable'],
];
const ALL_PAIRS: readonly (readonly [string, string])[] = [
  ...PROGRAMME_PAIRS.map((p) => [p[0], p[1]] as const),
  ...PREFIX_PAIRS.map((p) => [p[0], at(p[1], 0)] as const),
];
/** Distracteurs sans lien de sens avec les autres paires. */
const NEUTRAL = ['noisy', 'urban', 'virtual', 'union', 'legal', 'regular', 'possible'] as const;
const WHY_OTHER = 'Ce mot appartient à une autre paire : il ne dit pas le contraire.';
const ANTONYM_RULE = 'Retiens : un antonyme est un mot de sens contraire.';

function antonymPick(rng: Rng): QuestionDraft {
  const [a, b] = rng.pick(ALL_PAIRS);
  const wrong = some(
    rng,
    NEUTRAL.filter((w) => w !== a && w !== b),
    2,
  );
  const { answer, traps } = choice(
    rng,
    b,
    wrong.map((label) => ({ label, why: WHY_OTHER })),
  );
  return {
    prompt: `Choisis le contraire de « ${a} ».`,
    answer,
    traps,
    hint: 'Traduis le mot dans ta tête, puis cherche le sens opposé.',
    steps: [ANTONYM_RULE, `Cherche le sens contraire de « ${a} ».`, `Choisis : **${b}**.`],
  };
}

function antonymMatch(rng: Rng): QuestionDraft {
  const rows = some(rng, ALL_PAIRS, 3);
  return {
    prompt: `Associe chaque mot à son contraire : ${quoted(rows.map((r) => r[0]))}`,
    answer: pairs(rng, rows),
    hint: 'Commence par le mot que tu connais le mieux.',
    steps: [
      ANTONYM_RULE,
      'Associe d’abord les paires dont tu es sûr.',
      `Vérifie : **${rows.map(([l, r]) => `${l} = ${r}`).join(' ; ')}**.`,
    ],
  };
}

function antonymLetter(rng: Rng): QuestionDraft {
  const p = rng.pick(PROGRAMME_PAIRS);
  const flip = coin(rng);
  const from = flip ? p[1] : p[0];
  const right = flip ? p[0] : p[1];
  return {
    prompt: `Écris le contraire de « ${from} » : le mot du cours commence par « ${right.charAt(0)} ».`,
    answer: typed([right]),
    traps: textTraps([right], [{ text: from, why: 'C’est le mot de départ : il faut le sens opposé.' }]),
    hint: `Trouve le sens de « ${from} » en français, puis pense à l’opposé.`,
    steps: [ANTONYM_RULE, 'Retrouve la paire du cours.', `Écris : **${right}**.`],
  };
}

function antonymPrefix(rng: Rng): QuestionDraft {
  const [base, accepted] = rng.pick(PREFIX_PAIRS);
  const right = at(accepted, 0);
  // Pas de piège « unsocial » : refusé comme toute autre réponse, sans commentaire sur ce mot.
  const prefixes = ['un', 'in', 'im', 'il', 'ir', 'dis'].filter((p) => `${p}${base}` !== 'unsocial');
  const wrong = prefixes.map((p) => ({
    text: `${p}${base}`,
    why: 'Ce n’est pas le mot du cours : retrouve dans le mémo le préfixe de ce mot.',
  }));
  return {
    prompt: `Écris le contraire de « ${base} » appris dans le cours : ajoute un préfixe au début.`,
    answer: typed(accepted),
    traps: textTraps(accepted, [{ text: base, why: 'C’est le mot de départ : il manque le préfixe.' }, ...wrong]),
    hint: 'Cherche dans le mémo le mot formé à partir de celui-ci.',
    steps: [
      'Garde le mot de départ en entier.',
      'Retrouve son préfixe dans le mémo, puis ajoute-le devant.',
      `Écris : **${right}**.`,
    ],
  };
}

interface Opposite {
  /** « … » marque le trou : le reste de la phrase écarte les autres contraires. */
  readonly line: string;
  readonly from: string;
  /** Une seule réponse : le contraire appris dans le cours. */
  readonly answer: string;
}
const opposite = (line: string, from: string, answer: string): Opposite => ({ line, from, answer });
export const OPPOSITES: readonly Opposite[] = [
  opposite('This village is not urban, it is …', 'urban', 'rural'),
  opposite('This is not the real world, it is … reality', 'real', 'virtual'),
  opposite('Your plan is not possible, it is …', 'possible', 'impossible'),
  opposite('Parking here is not legal, it is …', 'legal', 'illegal'),
  opposite('The verb “play” is regular, but the verb “go” is …', 'regular', 'irregular'),
  opposite('Tom is happy with his mark, but Emir is … with his', 'happy', 'unhappy'),
  opposite('Sam is not lonely: he is the most … boy at school, and everyone invites him', 'lonely', 'popular'),
];

function antonymDocument(rng: Rng): QuestionDraft {
  const rows = some(rng, OPPOSITES, 4);
  const halves = rows.map((r) => r.line.split('…'));
  const parts = halves.map((h, i) => `${i === 0 ? '' : `${at(at(halves, i - 1), 1)}. `}${at(h, 0)}`);
  parts.push(`${at(at(halves, 3), 1)}.`);
  return {
    prompt:
      'Complète avec le contraire appris dans le mémo, pas un synonyme : l’autre mot de la paire, sinon le même mot avec un préfixe.',
    figure: document(
      'Mots à renverser',
      rows.map((r, i) => `Trou ${i + 1} : le contraire de « ${r.from} ».`),
    ),
    answer: { kind: 'cloze', parts, blanks: rows.map((r) => ({ mode: 'text' as const, accepted: [r.answer] })) },
    hint: 'Certains contraires sont des mots nouveaux, d’autres ajoutent un préfixe.',
    steps: [
      'Lis chaque phrase jusqu’au bout.',
      'Choisis un mot du cours ou ajoute un préfixe.',
      ok(rows.map((r) => r.answer)),
    ],
  };
}

const antonymSkill: Skill = {
  id: 'a5-antonymes',
  title: 'Les antonymes : dire le contraire',
  levels: 5,
  version: 1,
  sens: [
    sens(
      'savais-tu',
      'En anglais, un petit préfixe peut donner à un adjectif le sens contraire.',
      'bct-prefix-suffix',
      'Some prefixes give adjectives the opposite meaning',
    ),
  ],
  lesson: {
    memo: [
      'Un **antonyme** est un mot de sens contraire : quiet et noisy, urban et rural, real et virtual ; lonely et popular, freedom et constraint, separation et union.',
      'Un **préfixe** se place au début : unhappy, unrecognisable, impossible, irregular, illegal, dissatisfied.',
      'Le préfixe anti- rend le mot négatif : antisocial.',
    ],
    source: source('utiliser des antonymes', '« Does it have a prefix or a suffix? »'),
    sources: [PROG, 'bct-prefix-suffix'],
  },
  generate: (rng, level: Level): QuestionDraft => {
    if (level === 1) return antonymPick(rng);
    if (level === 2) return antonymMatch(rng);
    if (level === 3) return antonymLetter(rng);
    if (level === 4) return antonymPrefix(rng);
    return antonymDocument(rng);
  },
};

export const ENGLISH_PRONOUNS_5E_CHAPTER: Chapter = {
  id: 'a5-groupe-nominal-pronoms',
  subject: 'anglais',
  grade: '5e',
  domain: 'langue',
  title: 'Groupe nominal et pronoms',
  skills: [quantifierSkill, reflexiveSkill, derivationSkill, antonymSkill],
};
