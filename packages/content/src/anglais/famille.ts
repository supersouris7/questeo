import type { Chapter, QuestionDraft, Skill } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import { BODY, CLOTHES, FAMILY, PLURALS } from './famille-faits.ts';
import { dottedTraps } from './outils-5e.ts';
import { COLOURS, type Word } from './temps-faits.ts';
import { at, others, pairs, pickEnglish, shuffledOther, some, understand, write } from './temps.ts';

/**
 * Anglais CM1 — « Famille, corps, vêtements » (lot an-cm1-04, repassé : docs/adr/0034). Programme de langues
 * vivantes du cours moyen (arrêté du 26 février 2026) : il nomme la famille, mais ni « have got », ni le corps,
 * ni les vêtements, ni le génitif. Mots et règles : British Council (voir famille-faits.ts : chaque fait y porte
 * sa source et sa citation).
 */
const PROGRAMME = 'Programme de langues vivantes, cours moyen (arrêté du 26 février 2026, BO n° 12), CM1';
const source = (objective: string, detail: string) => `${PROGRAMME} — « ${objective} ». ${detail}`;
const WORDS_GOAL = 'Repérer des mots simples et familiers';
const DESCRIBE_GOAL = 'Décrire brièvement des personnes, des objets ou des animaux familiers';
const GRAMMAR_GOAL = 'Reconnaitre quelques structures et formes grammaticales simples';

/** « de » élidé devant un prénom qui commence par une voyelle. */
const de = (name: string) => (/^[AEIOU]/.test(name) ? `d’${name}` : `de ${name}`);
const word = (list: readonly Word[], en: string): Word => {
  const w = list.find((x) => x.en === en);
  if (!w) throw new Error(`mot inconnu : ${en}`);
  return w;
};
const full = (forms: readonly string[]) => forms.flatMap((f) => [f, `${f}.`]);
/** Mots écrits : un tiret ou une espace ne comptent pas comme des lettres. */
const letters = (en: string) => en.replace(/[^a-z]/gi, '').length;

/**
 * Explications guidées et indice des questions de vocabulaire communes (temps.ts) : `think` dit comment
 * retrouver le mot.
 */
function guided(q: QuestionDraft, list: readonly Word[], think: string): QuestionDraft {
  const a = q.answer;
  if (a.kind === 'match') {
    const solved = a.left.map((l, i) => `${l} = ${at(a.right, at(a.pairs, i))}`).join(' ; ');
    return {
      ...q,
      steps: [
        'Commence par le mot anglais que tu connais le mieux.',
        'Relie ensuite les autres mots, un par un.',
        `Vérifie tes paires : **${solved}**.`,
      ],
    };
  }
  if (a.kind === 'choice') {
    const good = at(a.options, a.correct);
    const w = list.find((x) => x.en === good);
    if (w) return { ...q, steps: [`Lis le mot français : « ${w.fr} ».`, think, `Choisis **${w.en}**.`] };
    const known = list.find((x) => x.fr === good);
    if (!known) throw new Error(`mot inconnu : ${good}`);
    return {
      ...q,
      steps: [
        `Lis le mot anglais : « ${known.en} ».`,
        'Repère le mot français de la liste qui correspond.',
        `Choisis **${known.fr}**.`,
      ],
    };
  }
  if (a.kind !== 'text') return q;
  const w = word(list, at(a.accepted, 0));
  const first = w.en.slice(0, 1);
  return {
    ...q,
    hint: `Le mot commence par « ${first} » et compte ${letters(w.en)} lettres.`,
    steps: [
      `Lis le mot français : « ${w.fr} ».`,
      think,
      `Vérifie la première lettre : « ${first} ».`,
      `Écris **${w.en}**.`,
    ],
  };
}

// ——— 1. La famille ———

const THINK_FAMILY = 'Pense à cette personne dans un arbre de famille.';

/** « mère » et « maman » ne sont jamais proposés ensemble : l’élève ne saurait pas les départager. */
const FORMAL = FAMILY.filter((w) => w.en !== 'mum' && w.en !== 'dad');
const FAMILIAR = FAMILY.filter((w) => w.en !== 'mother' && w.en !== 'father');
/** Saisie : les petits noms, et « my », « the » ou « a » devant le mot, sont aussi justes. */
function familyForms(w: Word): string[] {
  const familiar = w.en === 'mother' ? ['mummy', 'mommy'] : w.en === 'father' ? ['daddy'] : [];
  return [w.en, ...(w.alt ?? []), ...familiar].flatMap((f) => {
    const one = w.en === 'parents' ? [] : [`${/^[aeiou]/.test(f) ? 'an' : 'a'} ${f}`];
    return [f, `my ${f}`, `the ${f}`, ...one];
  });
}
/** « parents » et « cousin » s’écrivent comme en français : l’énoncé donnerait la réponse. */
const FAMILY_WRITE: readonly Word[] = FORMAL.filter((w) => w.en !== 'parents' && w.en !== 'cousin').map((w) => ({
  ...w,
  alt: familyForms(w).slice(1),
}));
const FEMALE = ['Ana', 'Yuna', 'Lisa'];
const MALE = ['Emir', 'Paul', 'Tom'];

/** Lien de famille deviné : « le frère de ta mère » → uncle. */
const LINKS: readonly {
  readonly fr: string;
  /** Lien cherché, vu de la personne du milieu : « le frère ». */
  readonly role: string;
  readonly good: string;
  readonly bad: readonly string[];
  readonly chain: readonly [string, string];
  /** Prénoms possibles (fille ou garçon) de la personne du milieu et de la personne cherchée. */
  readonly names: readonly [readonly string[], readonly string[]];
}[] = [
  {
    fr: 'le frère de ta mère',
    role: 'le frère',
    good: 'uncle',
    bad: ['brother', 'grandfather'],
    chain: ['mum', 'brother'],
    names: [FEMALE, MALE],
  },
  {
    fr: 'la sœur de ton père',
    role: 'la sœur',
    good: 'auntie',
    bad: ['sister', 'grandmother'],
    chain: ['dad', 'sister'],
    names: [MALE, FEMALE],
  },
  {
    fr: 'la mère de ta mère',
    role: 'la mère',
    good: 'grandmother',
    bad: ['mother', 'auntie'],
    chain: ['mum', 'mum'],
    names: [FEMALE, FEMALE],
  },
  {
    fr: 'le père de ton père',
    role: 'le père',
    good: 'grandfather',
    bad: ['father', 'uncle'],
    chain: ['dad', 'dad'],
    names: [MALE, MALE],
  },
  {
    fr: 'le fils de ton oncle',
    role: 'le fils',
    good: 'cousin',
    bad: ['son', 'brother'],
    chain: ['uncle', 'son'],
    names: [MALE, MALE],
  },
];

const family: Skill = {
  id: 'acm1-famille',
  title: 'La famille',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'La famille : mother = mère ; mum = maman ; father = père ; dad = papa ; sister = sœur ; brother = frère ; baby = bébé.',
      'Les grands-parents sont les **parents** de tes parents : grandmother (grandma) et grandfather (grandad).',
      'Aussi : uncle (oncle), auntie (tante), cousin (cousin ou cousine), son (fils).',
    ],
    source: source(WORDS_GOAL, 'Mots : British Council, « Family flashcards » et chanson « What is a family? ».'),
    sources: ['lve-cm-2026', 'bck-flashcards-family', 'bck-song-family', 'bc-possessive-s'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Dans un échange entre élèves, tu peux montrer des photos de ta famille.',
      source: 'lve-c2-2026',
      citation:
        'Lors d’un échange avec leurs partenaires de projet eTwinning, les élèves montrent des photos de leur famille',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1)
      return guided(
        pickEnglish(
          rng,
          FAMILY.slice(0, 7),
          'la famille',
          'Imagine cette personne dans une famille. Quel mot as-tu entendu en classe ?',
        ),
        FAMILY,
        THINK_FAMILY,
      );
    if (level === 2)
      return guided(understand(rng, rng.int(0, 1) === 0 ? FORMAL : FAMILIAR, 'la famille'), FAMILY, THINK_FAMILY);
    if (level === 3) return guided(write(rng, FAMILY_WRITE, 'la famille'), FAMILY_WRITE, THINK_FAMILY);
    if (level === 4) {
      if (rng.int(0, 1) === 0) return guided(pairs(rng, FORMAL, 5), FORMAL, THINK_FAMILY);
      const link = rng.pick(LINKS);
      const good = word(FAMILY, link.good);
      return {
        prompt: `Qui est ${link.fr} pour toi ? Écris le mot anglais.`,
        answer: { kind: 'text', accepted: familyForms(good) },
        traps: [
          ...link.bad.map((b) => ({
            text: b,
            why: `« ${b} » veut dire « ${word(FAMILY, b).fr} ». Suis le lien pas à pas.`,
          })),
          { text: good.typo, why: `La bonne personne, mais regarde les lettres : « ${good.en} ».` },
        ],
        hint: 'Dessine un petit arbre : toi, puis tes parents, puis la personne cherchée.',
        steps: [
          `Suis le lien pas à pas : ${link.fr}.`,
          `Trouve le nom français de cette personne : « ${good.fr} ».`,
          `Écris le mot anglais : **${good.en}**`,
        ],
      };
    }
    const link = rng.pick(LINKS);
    const good = word(FAMILY, link.good);
    const me = rng.pick([...FEMALE, ...MALE]);
    const mid = rng.pick(link.names[0].filter((n) => n !== me));
    const who = rng.pick(link.names[1].filter((n) => n !== me && n !== mid));
    const [first, second] = link.chain;
    return {
      prompt: `Lis le message ${de(me)}. Qui est ${who} pour ${me} ? Écris le mot anglais.`,
      figure: {
        kind: 'document',
        title: 'My family',
        lines: [`Hello! I’m ${me}.`, `${mid} is my ${first}.`, `${who} is ${mid}’s ${second}.`],
        credit: 'Écrit pour l’exercice.',
      },
      answer: { kind: 'text', accepted: familyForms(good) },
      traps: [
        ...[first, second, ...link.bad]
          .filter((b, i, all) => b !== good.en && all.indexOf(b) === i)
          .map((b) => ({ text: b, why: `« ${b} » n’est pas le lien entre ${me} et ${who}. Suis les deux phrases.` })),
        { text: good.typo, why: `La bonne personne, mais regarde les lettres : « ${good.en} ».` },
      ],
      hint: `« ${mid}’s » veut dire « ${de(mid)} ». Trouve d’abord qui est ${mid}.`,
      steps: [
        `Lis la ligne 2 : « ${mid} is my ${first}. »`,
        `Lis la ligne 3 : « ${who} is ${mid}’s ${second}. »`,
        `Cherche qui est ${link.role} ${de(mid)} pour ${me} : « ${good.fr} ».`,
        `Écris le mot anglais : **${good.en}**`,
      ],
    };
  },
};

// ——— 2. Have got ———

/** Sujet anglais, français, et forme de « have got » qui va avec. */
const SUBJECTS: readonly { readonly en: string; readonly has: 'have' | 'has' }[] = [
  { en: 'I', has: 'have' },
  { en: 'You', has: 'have' },
  { en: 'We', has: 'have' },
  { en: 'They', has: 'have' },
  { en: 'He', has: 'has' },
  { en: 'She', has: 'has' },
  { en: 'My sister', has: 'has' },
  { en: 'My brother', has: 'has' },
];
const OWNED = ['a rabbit', 'a skateboard', 'a new phone', 'brown eyes', 'long hair', 'a puppet', 'a cat', 'a bike'];
const SHORT: Readonly<Record<string, string>> = {
  I: 'I’ve',
  You: 'You’ve',
  We: 'We’ve',
  They: 'They’ve',
  He: 'He’s',
  She: 'She’s',
};
const wrongHave = (has: 'have' | 'has') => (has === 'have' ? 'has' : 'have');
/** Bulle qui relie le sujet à la bonne forme. */
const ruleHave = (s: { en: string; has: 'have' | 'has' }) => {
  if (s.has === 'have') return 'Retiens : « I, you, we, they » vont avec « have ».';
  if (s.en === 'He' || s.en === 'She') return 'Retiens : « he » et « she » vont avec « has ».';
  return `Remplace « ${s.en} » par « ${s.en === 'My sister' ? 'she' : 'he'} » : prends « has ».`;
};
const spot = (s: { en: string }) => `Repère de qui on parle : « ${s.en} ».`;
const whyHave = (s: { en: string; has: string }) =>
  s.has === 'has'
    ? `Avec « ${s.en} » (il ou elle), on dit « has got ».`
    : `Avec « ${s.en} », on dit « have got ». « has » va avec he, she, it.`;

function haveGotWrite(rng: Rng): QuestionDraft {
  const s = rng.pick(SUBJECTS);
  const o = rng.pick(OWNED);
  return {
    prompt: `Écris le mot qui manque pour dire « avoir » : « ${s.en} … got ${o}. »`,
    // La forme courte collée au sujet est juste aussi.
    answer: { kind: 'text', accepted: [s.has, s.has === 'has' ? '’s' : '’ve'] },
    traps: [
      { text: wrongHave(s.has), why: whyHave(s) },
      { text: 'is', why: '« is » est le verbe « être ». Pour « avoir », on utilise have ou has.' },
      { text: 'got', why: 'Le mot « got » est déjà écrit. Il manque le petit mot devant.' },
    ],
    hint: 'Regarde le sujet. Peux-tu le remplacer par « he » ou « she » ?',
    steps: [spot(s), ruleHave(s), `Écris dans le trou : **${s.has}**`],
  };
}

function haveGotShort(rng: Rng): QuestionDraft {
  const s = rng.pick(SUBJECTS.filter((x) => SHORT[x.en]));
  const o = rng.pick(OWNED);
  const short = SHORT[s.en] ?? '';
  const good = `${short} got ${o}`;
  return {
    prompt: `Écris avec la forme courte : « ${s.en} ${s.has} got ${o}. »`,
    answer: { kind: 'text', accepted: full([good]) },
    traps: dottedTraps([
      {
        text: `${short.replace('’', '')} got ${o}`,
        why: 'Il manque l’apostrophe : elle remplace les lettres enlevées.',
      },
      {
        text: `${s.en} got ${o}`,
        why: `Sans « ${s.has} », la phrase parle du passé. Ajoute sa forme courte.`,
      },
      { text: `${s.en}${s.has === 'has' ? '’ve' : '’s'} got ${o}`, why: whyHave(s) },
    ]),
    hint: 'Colle le sujet et le petit verbe. Une apostrophe prend la place des lettres enlevées.',
    steps: [
      `Repère les deux mots à raccourcir : « ${s.en} ${s.has} ».`,
      'Enlève « ha » et mets une apostrophe ’ à la place.',
      `Écris la phrase : **${good}.**`,
    ],
  };
}

function haveGotNegative(rng: Rng): QuestionDraft {
  const s = rng.pick(SUBJECTS);
  const o = rng.pick(['a dog', 'a bike', 'a skateboard', 'a rabbit']);
  const neg = s.has === 'has' ? 'hasn’t' : 'haven’t';
  const good = `${s.en} ${neg} got ${o}`;
  return {
    prompt: `Écris la phrase avec « not », en gardant « got » : « ${s.en} ${s.has} got ${o}. »`,
    answer: {
      kind: 'text',
      accepted: full([
        good,
        `${s.en} ${s.has} not got ${o}`,
        `${SHORT[s.en] ?? `${s.en}${s.has === 'has' ? '’s' : '’ve'}`} not got ${o}`,
      ]),
    },
    traps: dottedTraps([
      { text: `${s.en} ${s.has === 'has' ? 'haven’t' : 'hasn’t'} got ${o}`, why: whyHave(s) },
      { text: `${s.en} don’t got ${o}`, why: 'Avec « have got », on ajoute « not » après have ou has.' },
      { text: `${s.en} ${s.has} got not ${o}`, why: '« not » se place juste après have ou has.' },
    ]),
    hint: 'Ajoute « not » juste après le premier petit verbe.',
    steps: [
      `Repère le verbe placé après le sujet : « ${s.has} ».`,
      `Ajoute « not » juste après, puis raccourcis : « ${s.has} not » → « ${neg} ».`,
      `Écris la phrase : **${good}.**`,
    ],
  };
}

function haveGotOrder(rng: Rng): QuestionDraft {
  const [aux, subject] = rng.pick([
    ['Have', 'you'],
    ['Has', 'she'],
    ['Has', 'he'],
    ['Have', 'they'],
  ] as const);
  const o = rng.pick(['a skateboard', 'a rabbit', 'a bike', 'any pets']);
  const right = [aux, subject, 'got', o];
  const items = shuffledOther(rng, right);
  return {
    prompt: `Remets les mots dans l’ordre pour poser une question : ${items.join(' / ')} ?${
      o === 'any pets' ? ' (any pets = des animaux de compagnie)' : ''
    }`,
    answer: { kind: 'order', items, correct: right.map((x) => items.indexOf(x)) },
    hint: 'Dans une question, le petit verbe passe devant la personne.',
    steps: [
      `Commence la question par le verbe : « ${aux} ».`,
      `Place ensuite la personne, « ${subject} », puis « got ».`,
      `Range ainsi : **${right.join(' ')} ?**`,
    ],
  };
}

const haveGot: Skill = {
  id: 'acm1-have-got',
  title: 'Have got : avoir',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      '**Have got** veut dire « avoir » : I have got a sister.',
      'Avec he, she, it : **has** got ; avec I, you, we, they : **have** got ; forme courte : I’ve got, he’s got.',
      'Pour dire non, ajoute « not » ; pour demander, mets « Have » ou « Has » devant, puis réponds avec ce verbe.',
    ],
    source: source(GRAMMAR_GOAL, 'Formes : British Council, LearnEnglish Kids, « Have got ».'),
    sources: ['lve-cm-2026', 'bck-have-got'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Avec « have got », tu peux parler de tes objets, de ta famille et de ton corps.',
      source: 'bck-have-got',
      citation: 'We can use have got to talk about our things, family members and parts of the body.',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1 || level === 2) {
      const s = rng.pick(level === 1 ? SUBJECTS.slice(0, 6) : SUBJECTS);
      const o = rng.pick(OWNED);
      if (level === 1) {
        const { answer, traps } = choice(rng, s.has, [
          { label: wrongHave(s.has), why: whyHave(s) },
          { label: 'is', why: '« is » est le verbe « être ». Pour « avoir », on prend have ou has.' },
        ]);
        return {
          prompt: `Complète : « ${s.en} … got ${o}. »`,
          answer,
          traps,
          hint: 'Peux-tu remplacer le sujet par « he » ou « she » ? Ta réponse en dépend.',
          steps: [spot(s), ruleHave(s), `Choisis le mot : **${s.has}**`],
        };
      }
      const good = `${s.has} got`;
      const { answer, traps } = choice(rng, good, [
        { label: `${wrongHave(s.has)} got`, why: whyHave(s) },
        { label: 'is got', why: '« is » est le verbe « être ». Pour « avoir », on dit have got ou has got.' },
        { label: `${s.has} get`, why: `Après « ${s.has} », on écrit « got », jamais « get ».` },
      ]);
      return {
        prompt: `Quel groupe de mots complète « ${s.en} … ${o}. » ?`,
        answer,
        traps,
        hint: 'Il faut deux mots. Le premier dépend du sujet.',
        steps: [spot(s), ruleHave(s), `Ajoute « got » après ce verbe : **${good}**`],
      };
    }
    if (level === 3) return haveGotWrite(rng);
    if (level === 4) {
      const form = rng.int(0, 2);
      return form === 0 ? haveGotShort(rng) : form === 1 ? haveGotNegative(rng) : haveGotOrder(rng);
    }
    // Niveau 5 : lire deux messages, puis répondre à une question par une réponse courte.
    const [kid, he] = rng.pick([
      ['Emir', 'he'],
      ['Paul', 'he'],
      ['Ana', 'she'],
      ['Yuna', 'she'],
    ] as const);
    const [has, hasNot] = some(rng, ['dog', 'rabbit', 'bike', 'skateboard'], 2) as [string, string];
    const yes = rng.int(0, 1) === 0;
    const asked = yes ? has : hasNot;
    const good = yes ? `Yes, ${he} has` : `No, ${he} hasn’t`;
    // Le prénom à la place du pronom reste une réponse juste.
    const forms = [he, kid].flatMap((who) =>
      (yes
        ? [`${who} has`, `${who} has got`]
        : [`${who} hasn’t`, `${who} has not`, `${who} hasn’t got`, `${who} has not got`]
      ).flatMap((end) => (yes ? [`Yes, ${end}`, `Yes ${end}`] : [`No, ${end}`, `No ${end}`])),
    );
    const other = he === 'he' ? 'she' : 'he';
    const pronoun = he === 'he' ? 'He' : 'She';
    return {
      prompt: `Lis le message. Réponds en anglais par une réponse courte : « Has ${kid} got a ${asked}? »`,
      figure: {
        kind: 'document',
        title: `${kid}’s things`,
        lines: rng.shuffle([`${pronoun} has got a ${has}.`, `${pronoun} hasn’t got a ${hasNot}.`]),
        credit: 'Écrit pour l’exercice.',
      },
      answer: { kind: 'text', accepted: full(forms) },
      traps: [
        {
          text: yes ? `No, ${he} hasn’t.` : `Yes, ${he} has.`,
          why: `Relis la phrase avec « ${asked} » : y a-t-il « hasn’t » ?`,
        },
        {
          text: yes ? `Yes, ${he} is.` : `No, ${he} isn’t.`,
          why: 'La question commence par « Has » : réponds avec « has ».',
        },
        { text: yes ? `Yes, ${other} has.` : `No, ${other} hasn’t.`, why: `Pour ${kid}, on dit « ${he} ».` },
        { text: yes ? 'Yes' : 'No', why: 'Fais une réponse courte complète : Yes ou No, le pronom, puis have ou has.' },
      ],
      hint: 'Cherche la phrase qui parle de cet objet. Répète le verbe de la question dans ta réponse.',
      steps: [
        `Cherche la ligne qui parle de « ${asked} ».`,
        yes
          ? 'Regarde son verbe : « has » veut dire « a ». La réponse est oui.'
          : 'Regarde son verbe : « hasn’t » veut dire « n’a pas ». La réponse est non.',
        `Commence par « ${yes ? 'Yes' : 'No'} », puis ajoute « ${he} » et ce verbe.`,
        `Écris : **${good}.**`,
      ],
    };
  },
};

// ——— 3. Le corps ———

/** Mots à écrire : l’article est accepté (« la tête » → head, the head). */
const withArticle = (w: Word): Word => {
  // « les cheveux » : pas de « a hair » ; devant une voyelle, « an » (an eye, an ear, an arm).
  const one = w.en === 'hair' ? [] : [`${/^[aeiou]/.test(w.en) ? 'an' : 'a'} ${w.en}`];
  return { ...w, alt: [...(w.alt ?? []), `the ${w.en}`, ...one] };
};

const THINK_BODY = 'Touche cette partie sur toi et pense à son nom.';
const NUMBERS = ['two', 'three', 'four', 'five'] as const;
const DIGITS: Readonly<Record<string, number>> = { two: 2, three: 3, four: 4, five: 5 };

const body: Skill = {
  id: 'acm1-corps',
  title: 'Le corps',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'En haut : head = tête, face = visage, hair = cheveux, eye = œil ; ear = oreille, nose = nez, mouth = bouche, neck = cou.',
      'Aussi : arm = bras, hand = main, leg = jambe ; foot = pied, knee = genou, back = dos.',
      'Au **pluriel**, on ajoute souvent un s, mais foot → feet et tooth → teeth !',
    ],
    source: source(DESCRIBE_GOAL, 'Mots : British Council, « Body flashcards », « Head flashcards » et chansons.'),
    sources: ['lve-cm-2026', 'bck-flashcards-body', 'bck-flashcards-head', 'bck-song-trousers', 'bck-song-tooth'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Avec la comptine « Head, Shoulders, Knees and Toes », tu peux montrer les parties du corps.',
      source: 'lve-c2-2026',
      citation:
        "comptine Head, Shoulders, Knees and Toes, l'élève associe les mots aux parties du corps énoncées en les désignant",
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1)
      return guided(
        pickEnglish(
          rng,
          BODY.slice(0, 7),
          'le corps',
          'Touche cette partie de ton corps. Quel mot as-tu entendu en chanson ?',
        ),
        BODY,
        THINK_BODY,
      );
    if (level === 2) return guided(understand(rng, BODY, 'le corps'), BODY, THINK_BODY);
    if (level === 3) {
      const list = BODY.slice(0, 14).map(withArticle);
      return guided(write(rng, list, 'le corps'), list, THINK_BODY);
    }
    if (level === 4) {
      if (rng.int(0, 2) === 0) return guided(pairs(rng, BODY, 5), BODY, THINK_BODY);
      const p = rng.pick(PLURALS);
      return {
        prompt: `Écris le pluriel en anglais : « one ${p.one} » → « two … » (${p.fr}).`,
        answer: { kind: 'text', accepted: [p.many, `two ${p.many}`] },
        traps: p.wrong.map((w) => ({ text: w, why: `Le pluriel de « ${p.one} » est « ${p.many} ».` })),
        hint: 'Certains pluriels ajoutent un s. D’autres changent les lettres du milieu.',
        steps: [
          `Regarde le nombre « two » : mets « ${p.one} » au pluriel.`,
          p.many === `${p.one}s`
            ? 'Ajoute simplement un s à la fin du mot.'
            : 'Remplace les deux « o » par deux « e », sans ajouter de s.',
          `Écris le pluriel : **${p.many}**`,
        ],
      };
    }
    // Niveau 5 : un monstre imaginaire à décrire (have got + nombres).
    const parts = some(rng, ['eyes', 'arms', 'legs', 'ears'], 3);
    const nums = some(rng, [...NUMBERS], 3);
    const i = rng.int(0, 2);
    const asked = at(parts, i);
    const n = at(nums, i);
    const fr: Readonly<Record<string, string>> = {
      eyes: 'd’yeux',
      arms: 'de bras',
      legs: 'de jambes',
      ears: 'd’oreilles',
    };
    const otherIndex = (i + 1) % 3;
    const good = `It’s got ${n} ${asked}`;
    return {
      prompt: `Lis la fiche du monstre. Combien ${fr[asked] ?? ''} a-t-il ? Réponds en anglais : commence par « It’s got » ou « It has got ».`,
      figure: {
        kind: 'document',
        title: 'My monster',
        lines: parts.map((p, j) => `My monster has got ${at(nums, j)} ${p}.`),
        credit: 'Écrit pour l’exercice.',
      },
      answer: {
        kind: 'text',
        accepted: full([n, String(DIGITS[n])].flatMap((x) => [`It’s got ${x} ${asked}`, `It has got ${x} ${asked}`])),
      },
      traps: [
        {
          text: `It’s got ${at(nums, otherIndex)} ${asked}.`,
          why: 'Ce nombre est écrit pour une autre partie du corps.',
        },
        {
          text: `It’s got ${n} ${at(parts, otherIndex)}.`,
          why: 'Le nombre est bon, mais pas la partie du corps demandée.',
        },
        { text: `${n} ${asked}`, why: 'Fais une phrase : commence par « It’s got ».' },
        { text: `It’s got ${n} ${asked.slice(0, -1)}.`, why: `Il y en a plusieurs : écris « ${asked} » avec un s.` },
      ],
      hint: 'Trouve la ligne qui parle de cette partie du corps. Recopie son nombre.',
      steps: [
        `Cherche la ligne qui finit par « ${asked} ».`,
        `Recopie son nombre : « ${n} ».`,
        'Commence par « It’s got » : « it » désigne le monstre.',
        `Écris la phrase : **${good}.**`,
      ],
    };
  },
};

// ——— 4. Les vêtements ———

/** Vêtements au singulier (avec « a ») et au pluriel (sans « a »). */
const ONE_CLOTHES = ['t-shirt', 'skirt', 'dress', 'shirt', 'jumper', 'jacket', 'coat', 'cardigan'];
const MANY_CLOTHES = ['trousers', 'shorts', 'jeans', 'socks', 'shoes', 'trainers', 'boots', 'slippers', 'sandals'];
/** Couleurs sans « an » devant (orange écarté). */
const PLAIN_COLOURS = COLOURS.filter((c) => c.en !== 'orange' && c.en !== 'purple');
/** Un mot et ses variantes acceptées. */
const names = (w: Word): string[] => [w.en, ...(w.alt ?? [])];
/** Réponses « (a) couleur vêtement » : toutes les variantes de couleur et de vêtement. */
const coloured = (w: Word, c: Word, article: string) =>
  names(c).flatMap((col) => names(w).map((name) => `${article}${col} ${name}`));
/** « un pull » → « le pull », « une jupe » → « la jupe ». */
const definite = (fr: string) => fr.replace(/^une /, 'la ').replace(/^un /, 'le ');
const THINK_CLOTHES = 'Imagine ce vêtement et pense à son nom.';
/** « a skirt » ; « a pair of jeans » quand le français dit « un » pour un mot anglais pluriel. */
const CLOTHES_WRITE: readonly Word[] = CLOTHES.map((w) => {
  const article = ONE_CLOTHES.includes(w.en) ? 'a ' : w.fr.startsWith('un ') ? 'a pair of ' : '';
  return article ? { ...w, alt: [...(w.alt ?? []), ...names(w).map((n) => `${article}${n}`)] } : w;
});

const clothes: Skill = {
  id: 'acm1-vetements',
  title: 'Les vêtements',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Les habits : jumper = pull, coat = manteau, skirt = jupe ; dress = robe, shirt = chemise, socks = chaussettes.',
      'Au **pluriel** aussi : trousers = pantalon, jeans = jean, shorts = short, shoes = chaussures.',
      'La couleur se place avant le nom : a red jumper, ou red socks sans « a ».',
    ],
    source: source(DESCRIBE_GOAL, 'Mots : British Council, « Clothes flashcards » (séries 1 et 2) ; « Adjectives ».'),
    sources: ['lve-cm-2026', 'bck-flashcards-clothes-1', 'bck-flashcards-clothes-2', 'bck-adjectives', 'bck-have-got'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Pour demander ce que porte une fille ou une femme, tu dis « What is she wearing? ».',
      source: 'lve-c2-2026',
      citation: 'What is she wearing?',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1)
      return guided(
        pickEnglish(
          rng,
          ['skirt', 'dress', 'jumper', 'socks', 'shoes', 'coat', 'jeans'].map((en) => word(CLOTHES, en)),
          'un vêtement',
          'Regarde tes habits. Quel mot anglais as-tu entendu pour celui-ci ?',
        ),
        CLOTHES,
        THINK_CLOTHES,
      );
    if (level === 2) {
      if (rng.int(0, 2) === 0) {
        const w = rng.pick(CLOTHES.slice(0, 8));
        const { answer, traps } = choice(
          rng,
          w.fr,
          others(rng, CLOTHES.slice(0, 8), w, 3).map((o) => ({ label: o.fr, why: `« ${o.fr} » se dit « ${o.en} ».` })),
        );
        return {
          prompt: 'Écoute. De quel vêtement parle-t-on ?',
          audio: { text: `Look at my ${w.en}.`, lang: 'en-GB' },
          answer,
          traps,
          hint: 'Écoute bien le dernier mot de la phrase.',
          steps: [
            'Écoute encore une fois la phrase.',
            `Repère le dernier mot : « ${w.en} ».`,
            `Choisis son sens : **${w.fr}**`,
          ],
        };
      }
      return guided(understand(rng, CLOTHES, 'un vêtement'), CLOTHES, THINK_CLOTHES);
    }
    if (level === 3) return guided(write(rng, CLOTHES_WRITE, 'un vêtement'), CLOTHES_WRITE, THINK_CLOTHES);
    if (level === 4) {
      const many = rng.int(0, 1) === 0;
      const w = word(CLOTHES, rng.pick(many ? MANY_CLOTHES : ONE_CLOTHES));
      const c = rng.pick(PLAIN_COLOURS);
      const good = many ? `${c.en} ${w.en}` : `a ${c.en} ${w.en}`;
      const pair = many && w.fr.startsWith('un ') ? coloured(w, c, 'a pair of ') : [];
      const forms = [...coloured(w, c, many ? '' : 'a '), ...pair];
      const frPhrase = `${w.fr} de couleur « ${c.fr} »`;
      return {
        // « a pair of … » est juste aussi : pas de consigne « sans a » pour ces mots.
        prompt: `Écris en anglais : ${frPhrase}${pair.length > 0 ? '' : many ? ' (sans « a »)' : ' (avec « a »)'}.`,
        answer: { kind: 'text', accepted: full(forms) },
        traps: [
          {
            text: many ? `${w.en} ${c.en}` : `a ${w.en} ${c.en}`,
            why: 'En anglais, la couleur se place avant le nom.',
          },
          {
            text: many ? `a ${c.en} ${w.en}` : `${c.en} ${w.en}`,
            why: many ? `« ${w.en} » est au pluriel : pas de « a ».` : 'Il manque le petit mot « a » au début.',
          },
          ...(many ? [{ text: `${c.en}s ${w.en}`, why: 'Un adjectif anglais ne prend jamais de s.' }] : []),
        ],
        hint: 'Dans l’ordre : (a), la couleur, puis le vêtement.',
        steps: [
          `Traduis les deux mots : « ${c.en} » et « ${w.en} ».`,
          'Place la couleur avant le vêtement.',
          many ? 'Oublie « a » : le vêtement est au pluriel.' : 'Ajoute « a » tout au début.',
          `Écris : **${good}**`,
        ],
      };
    }
    // Niveau 5 : retrouver une couleur (le vêtement n’est nommé qu’en français), puis écrire le groupe.
    const kids = some(rng, ['Ana', 'Emir', 'Yuna', 'Paul', 'Lisa', 'Tom'], 3);
    const garments = some(rng, ['jumper', 'coat', 'skirt', 'dress', 'jacket', 'shirt', 'cardigan'], 3);
    const [c1, c2, c3, c4, c5, c6] = some(rng, PLAIN_COLOURS, 6) as [Word, Word, Word, Word, Word, Word];
    const kid = at(kids, 0);
    const asked = at(garments, 0);
    const mate = at(garments, 1);
    const third = at(garments, 2);
    const line = (name: string, x: readonly [string, Word], y: readonly [string, Word]) => {
      const [p, q] = rng.shuffle([x, y]) as [readonly [string, Word], readonly [string, Word]];
      return `${name}: My ${p[0]} is ${p[1].en} and my ${q[0]} is ${q[1].en}.`;
    };
    // Le même vêtement existe chez un autre enfant, d’une autre couleur : il faut trouver la bonne ligne.
    const lines = rng.shuffle([
      line(kid, [asked, c1], [mate, c2]),
      line(at(kids, 1), [asked, c3], [third, c4]),
      line(at(kids, 2), [mate, c5], [third, c6]),
    ]);
    const w = word(CLOTHES, asked);
    const good = `a ${c1.en} ${asked}`;
    return {
      prompt: `Lis les messages. De quelle couleur est ${definite(w.fr)} ${de(kid)} ? Réponds en anglais : a + couleur + vêtement.`,
      figure: { kind: 'document', title: 'My clothes', lines, credit: 'Écrit pour l’exercice.' },
      answer: { kind: 'text', accepted: full(coloured(w, c1, 'a ')) },
      traps: [
        { text: `a ${c3.en} ${asked}`, why: `C’est la couleur écrite pour ${at(kids, 1)}, pas pour ${kid}.` },
        { text: `a ${c2.en} ${asked}`, why: `« ${c2.en} » est la couleur d’un autre habit ${de(kid)}.` },
        { text: `a ${asked} ${c1.en}`, why: 'En anglais, la couleur se place avant le nom.' },
        { text: `${c1.en} ${asked}`, why: 'Il manque le petit mot « a » au début.' },
        { text: c1.en, why: 'Il manque « a » et le vêtement.' },
      ],
      hint: `Comment dit-on « ${w.fr} » en anglais ? Cherche ce mot sur la ligne ${de(kid)}.`,
      steps: [
        `Traduis « ${w.fr} » : c’est « ${asked} ».`,
        `Cherche la ligne ${de(kid)} : « ${asked} is ${c1.en} ».`,
        'Place « a », puis la couleur, puis le vêtement.',
        `Écris : **${good}**`,
      ],
    };
  },
};

// ——— 5. Le génitif 's ———

const OWNERS: readonly { readonly en: string; readonly fr: string; readonly alt?: readonly string[] }[] = [
  { en: 'Tom', fr: 'de Tom' },
  { en: 'Lisa', fr: 'de Lisa' },
  { en: 'Ana', fr: 'd’Ana' },
  { en: 'Emir', fr: 'd’Emir' },
  { en: 'my sister', fr: 'de ma sœur' },
  { en: 'my brother', fr: 'de mon frère' },
  { en: 'my mum', fr: 'de ma mère', alt: ['my mother', 'my mom', 'my mummy', 'my mommy'] },
];
const THINGS: readonly { readonly en: string; readonly fr: string; readonly alt?: readonly string[] }[] = [
  { en: 'dog', fr: 'Le chien' },
  { en: 'cat', fr: 'Le chat' },
  { en: 'bike', fr: 'Le vélo', alt: ['bicycle'] },
  { en: 'bag', fr: 'Le sac' },
  { en: 'jumper', fr: 'Le pull', alt: ['sweater', 'pullover'] },
  { en: 'coat', fr: 'Le manteau' },
];
const phrase = (owner: string, thing: string) => `${owner}’s ${thing}`;

const PLURAL_S = 'Ajoute seulement l’apostrophe : ce pluriel finit déjà par s.';
const PLURAL_NO_S = 'Ajoute ’s : ce pluriel ne finit pas par s.';

/** Pluriels (réguliers et irréguliers) et deux propriétaires. */
const HARD: readonly {
  readonly fr: string;
  readonly good: readonly string[];
  /** Mots anglais donnés à l’élève (ordre alphabétique) : la question porte sur l’apostrophe. */
  readonly words: string;
  /** La règle qui explique la réponse. */
  readonly rule: string;
  readonly traps: readonly (readonly [string, string])[];
}[] = [
  {
    fr: 'La maison de mes parents',
    words: 'house, my, parents',
    good: ['my parents’ house'],
    rule: PLURAL_S,
    traps: [
      ['my parents’s house', '« parents » finit déjà par s : ajoute seulement l’apostrophe.'],
      ['my parents house', 'Sans apostrophe, le s ne montre que le pluriel.'],
    ],
  },
  {
    fr: 'Le chien de mes grands-parents',
    words: 'dog, grandparents, my',
    good: ['my grandparents’ dog'],
    rule: PLURAL_S,
    traps: [
      ['my grandparents’s dog', 'Pluriel en s : ajoute seulement l’apostrophe.'],
      ['my grandparents dog', 'Sans apostrophe, le s ne montre que le pluriel.'],
    ],
  },
  {
    fr: 'L’école de nos enfants',
    words: 'children, our, school',
    good: ['our children’s school'],
    rule: PLURAL_NO_S,
    traps: [
      ['our childrens’ school', '« children » est déjà un pluriel : écris « children’s ».'],
      ['our childrens school', 'Il faut une apostrophe : « children’s ».'],
    ],
  },
  {
    fr: 'Le fils d’Anne et Gary',
    words: 'and, Anne, Gary, son',
    good: ['Anne and Gary’s son'],
    rule: 'Ajoute ’s après le dernier des deux noms seulement.',
    traps: [
      ['Anne’s and Gary son', 'Pour deux propriétaires ensemble, ’s va après le dernier nom.'],
      ['Anne and Gary son', 'Il manque le ’s après le dernier nom.'],
    ],
  },
  {
    fr: 'La voiture de mes cousins',
    words: 'car, cousins, my',
    good: ['my cousins’ car'],
    rule: PLURAL_S,
    traps: [
      ['my cousins’s car', '« cousins » finit déjà par s : ajoute seulement l’apostrophe.'],
      ['my cousins car', 'Sans apostrophe, le s ne montre que le pluriel.'],
    ],
  },
  {
    fr: 'Les chaussures des femmes',
    words: 'shoes, the, women',
    good: ['the women’s shoes', 'women’s shoes'],
    rule: PLURAL_NO_S,
    traps: [
      ['the womens’ shoes', '« women » est déjà un pluriel : écris « women’s ».'],
      ['the womens shoes', 'Il faut une apostrophe : « women’s ».'],
    ],
  },
  {
    fr: 'Le sac de James',
    words: 'bag, James',
    good: ['James’ bag', 'James’s bag'],
    rule: 'Ajoute l’apostrophe seule, ou ’s : les deux sont justes.',
    traps: [
      ['Jame’s bag', 'Le prénom est « James » : garde le s, puis ajoute l’apostrophe.'],
      ['James bag', 'Il manque l’apostrophe.'],
    ],
  },
];

const genitive: Skill = {
  id: 'acm1-genitif',
  title: 'Le génitif ’s',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Le **génitif** dit à qui est une chose : Tom’s dog = le chien de Tom.',
      'Mets le propriétaire, puis **’s**, puis la chose ; après un **pluriel** en s, seulement l’apostrophe.',
      'Cas spéciaux : children’s, James’ ou James’s, et Anne and Gary’s son.',
    ],
    source: source(
      GRAMMAR_GOAL,
      'Règles : British Council, LearnEnglish, « Possessive ’s » et « Possessives: nouns ».',
    ),
    sources: ['lve-cm-2026', 'bc-possessive-s', 'bc-possessives-nouns'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Avec « ’s », tu peux dire à qui est une chose ou quel lien unit deux personnes.',
      source: 'bc-possessive-s',
      citation: "We can use possessive 's to talk about the relationship between people or to say who owns something.",
    },
  ],
  generate: (rng, level): QuestionDraft => {
    const owner = rng.pick(level === 1 ? OWNERS.slice(0, 4) : OWNERS);
    const thing = rng.pick(THINGS);
    const good = phrase(owner.en, thing.en);
    const fr = `${thing.fr} ${owner.fr}`;
    if (level === 1 || level === 2) {
      const wrong = [
        { label: `${thing.en}’s ${owner.en}`, why: 'Ordre inversé : le propriétaire vient en premier.' },
        { label: `${owner.en}s ${thing.en}`, why: 'Sans apostrophe, le s ne montre pas à qui est la chose.' },
        ...(level === 2 ? [{ label: `${owner.en} ${thing.en}`, why: 'Il manque le ’s après le propriétaire.' }] : []),
      ];
      const { answer, traps } = choice(rng, good, wrong);
      return {
        prompt: `Comment dit-on « ${fr} » en anglais ?`,
        answer,
        traps,
        hint: 'Qui possède ? Il se place en premier, avec un petit signe et une lettre.',
        steps: [
          `Cherche à qui est la chose : « ${owner.en} ».`,
          `Place ce propriétaire en premier, avec ’s.`,
          `Choisis la réponse : **${good}**`,
        ],
      };
    }
    if (level === 3)
      return {
        prompt: `Écris en anglais, avec ’s : « ${fr} ».`,
        answer: {
          kind: 'text',
          accepted: full(
            [owner.en, ...(owner.alt ?? [])].flatMap((o) => [thing.en, ...(thing.alt ?? [])].map((t) => phrase(o, t))),
          ),
        },
        traps: [
          { text: `${owner.en}s ${thing.en}`, why: 'Il manque l’apostrophe avant le s.' },
          { text: `${owner.en} ${thing.en}`, why: 'Il manque le ’s après le propriétaire.' },
          { text: `${thing.en}’s ${owner.en}`, why: 'Ordre inversé : le propriétaire vient en premier.' },
        ],
        hint: 'Commence par le propriétaire. Ajoute l’apostrophe et un s. Termine par la chose.',
        steps: [
          `Repère le propriétaire : « ${owner.en} ».`,
          'Écris-le, puis ajoute ’s.',
          `Termine par la chose : « ${thing.en} ».`,
          `Vérifie ta réponse : **${good}**`,
        ],
      };
    if (level === 4) {
      const h = rng.pick(HARD);
      const answer = at(h.good, 0);
      return {
        prompt: `Écris en anglais, avec l’apostrophe : « ${h.fr} ». Mots à utiliser : ${h.words}.`,
        answer: { kind: 'text', accepted: full(h.good) },
        traps: h.traps.map(([text, why]) => ({ text, why })),
        hint: 'Le propriétaire finit-il par un s ? Est-ce un seul nom ou plusieurs ?',
        steps: ['Repère le propriétaire et regarde comment son nom finit.', h.rule, `Écris la réponse : **${answer}**`],
      };
    }
    // Niveau 5 : lire des messages, puis trouver le propriétaire (liens de famille).
    const [rel, relFr, names] = rng.pick([
      ['sister', 'la sœur', FEMALE],
      ['brother', 'le frère', MALE],
      ['cousin', 'le cousin ou la cousine', [...FEMALE, ...MALE]],
    ] as const);
    const sibling = rng.pick(names);
    const [boss, third] = some(
      rng,
      [...FEMALE, ...MALE].filter((n) => n !== sibling),
      2,
    ) as [string, string];
    const [g1, g2] = some(rng, ['jumper', 'coat', 'bag', 'bike'], 2) as [string, string];
    const [c1, c2] = some(rng, ['red', 'blue', 'green', 'black'], 2) as [string, string];
    const lines = [
      `${boss}’s ${rel} has got a ${c1} ${g1}.`,
      `${boss}’s ${rel} is ${sibling}.`,
      `${third} has got a ${c2} ${g2}.`,
    ];
    const phraseGood = `${sibling}’s ${g1}`;
    return {
      prompt: `Lis le texte. À qui est « the ${c1} ${g1} » ? Écris en anglais le prénom, ’s et « ${g1} ». La couleur est permise.`,
      figure: { kind: 'document', title: 'Whose is it?', lines, credit: 'Écrit pour l’exercice.' },
      answer: {
        kind: 'text',
        accepted: full([phraseGood, `${sibling}’s ${c1} ${g1}`].flatMap((x) => [x, `It’s ${x}`, `It is ${x}`])),
      },
      traps: [
        { text: `${boss}’s ${g1}`, why: `Ce n’est pas ${boss} : la phrase parle de « ${boss}’s ${rel} ».` },
        { text: `${third}’s ${g1}`, why: `${third} a un autre objet.` },
        { text: `${sibling}s ${g1}`, why: 'Il manque l’apostrophe avant le s.' },
        { text: `${g1}’s ${sibling}`, why: 'Ordre inversé : le propriétaire vient en premier.' },
      ],
      hint: 'Cherche qui a cet objet. Puis trouve le prénom de cette personne.',
      steps: [
        `Cherche « ${c1} ${g1} » : c’est à « ${boss}’s ${rel} ».`,
        `Traduis ces mots : ${relFr} ${de(boss)}.`,
        `Trouve son prénom : « ${sibling} ».`,
        `Écris : **${phraseGood}**`,
      ],
    };
  },
};

export const ENGLISH_FAMILY_CHAPTER: Chapter = {
  id: 'acm1-famille-corps',
  subject: 'anglais',
  grade: 'cm1',
  domain: 'langue',
  title: 'Famille, corps, vêtements',
  skills: [family, haveGot, body, clothes, genitive],
};
