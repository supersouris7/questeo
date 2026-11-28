import type { Chapter, QuestionDraft, Skill } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import { asked, dotted } from './outils-5e.ts';
import {
  OWNERS,
  PREDICATES,
  PRONOUNS,
  SUBJECTS,
  THINGS,
  cap,
  rowOf,
  type Owner,
  type Pronoun,
  type PronounRow,
} from './be-faits.ts';

/**
 * Anglais CM1 — « Be et possessifs » (lot an-cm1-02, repassé : docs/adr/0034). Programme de langues vivantes du
 * cours moyen (arrêté du 26 février 2026). Formes : British Council (voir be-faits.ts : chaque fait y porte sa source
 * et sa citation).
 */
const PROGRAMME = 'Programme de langues vivantes, cours moyen (arrêté du 26 février 2026, BO n° 12), CM1';
const source = (objective: string, detail: string) => `${PROGRAMME} — « ${objective} ». ${detail}`;

const at = <T>(list: readonly T[], i: number): T => {
  const x = list[i];
  if (x === undefined) throw new Error(`indice ${i} hors liste`);
  return x;
};

/** Mélange une liste jusqu'à ce qu'elle ne soit plus dans l'ordre de départ. */
function shuffledOther<T>(rng: Rng, list: readonly T[]): T[] {
  let out = rng.shuffle(list);
  while (out.every((x, i) => x === list[i])) out = rng.shuffle(list);
  return out;
}

/** Texte à trous saisis : un segment de plus que de trous. */
const gaps = (parts: readonly string[], accepted: readonly string[]) => ({
  kind: 'cloze' as const,
  parts: [...parts],
  blanks: accepted.map((a) => ({ mode: 'text' as const, accepted: [a] })),
});
/** Texte à lire, trous numérotés, et une case à remplir par numéro. */
const numberedText = (title: string, lines: readonly string[], accepted: readonly string[]) => ({
  figure: {
    kind: 'document' as const,
    title,
    lines: lines.map((l, i) => l.replace('…', `(${i + 1}) …`)),
    credit: 'Texte écrit pour l’exercice.',
  },
  answer: gaps([...accepted.map((_, i) => `${i ? ' ' : ''}(${i + 1}) `), ''], accepted),
});
const sentence = (p: Pronoun, be: string, pred: string) => `${cap(p)} ${be} ${pred}.`;
/** Pronoms du niveau 1 : les plus simples. */
const EASY: readonly Pronoun[] = ['I', 'he', 'she', 'we'];
const pickPronoun = (rng: Rng, only?: readonly Pronoun[]): PronounRow =>
  rowOf(rng.pick(only ?? PRONOUNS.map((x) => x.en)));
/** Un pronom par forme de be (am, is, are). */
const onePerBe = (rng: Rng): PronounRow[] => [
  rowOf('I'),
  rowOf(rng.pick(['he', 'she', 'it'] as const)),
  rowOf(rng.pick(['you', 'we', 'they'] as const)),
];

// ——— 1. be au présent ———
const bePresent: Skill = {
  id: 'acm1-be-present',
  title: 'Le verbe be au présent',
  levels: 5,
  version: 3,
  lesson: {
    memo: [
      'Le **verbe be** veut dire « être » et change avec le pronom.',
      'Dis « I am » ; « he, she, it » vont avec « is » ; « you, we, they » avec « are ».',
      'La **contraction** « I’m » remplace « I am » : garde bien l’apostrophe.',
    ],
    source: source(
      'Reconnaitre quelques structures et formes grammaticales simples appartenant à un répertoire mémorisé',
      'Formes : British Council, LearnEnglish, English grammar reference, « Verb be ».',
    ),
    sources: ['lve-cm-2026', 'bc-verb-be'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Avec « be », tu peux dire qu’une soupe est très bonne : « This soup is very tasty ».',
      source: 'bc-verb-be',
      citation: 'with an adjective : This soup is very tasty .',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1) {
      const p = pickPronoun(rng, EASY);
      const pred = rng.pick(PREDICATES);
      const { answer, traps } = choice(
        rng,
        p.be,
        (['am', 'is', 'are'] as const)
          .filter((v) => v !== p.be)
          .map((v) => ({ label: v, why: `« ${v} » ne va pas avec « ${p.en} » : on dit « ${p.en} ${p.be} ».` })),
      );
      return {
        prompt: `Complète : « ${cap(p.en)} … ${pred}. »`,
        answer,
        traps,
        hint: 'Regarde le mot avant le trou. Quelle forme de be va avec lui ?',
        steps: [
          `Repère le pronom avant le trou : « ${p.en} ».`,
          `Retrouve sa forme de be : « ${p.en} ${p.be} ».`,
          `Choisis la réponse : **${p.be}**`,
        ],
      };
    }
    if (level === 2) {
      if (rng.int(0, 1) === 0) {
        const p = pickPronoun(rng);
        const pred = rng.pick(PREDICATES);
        const wrong = ['am', 'is', 'are', 'be'].filter((v) => v !== p.be);
        const { answer, traps } = choice(
          rng,
          sentence(p.en, p.be, pred),
          wrong.map((v) => ({
            label: sentence(p.en, v, pred),
            why:
              v === 'be'
                ? '« be » veut dire « être » : après un pronom, il faut am, is ou are.'
                : `« ${v} » ne va pas avec « ${p.en} » : on dit « ${p.en} ${p.be} ».`,
          })),
        );
        return {
          prompt: 'Laquelle de ces phrases est correcte ?',
          answer,
          traps,
          hint: 'Regarde le pronom au début de la phrase, puis cherche sa forme de be.',
          steps: [
            `Repère le pronom au début : « ${p.en} ».`,
            `Retrouve sa forme de be : « ${p.be} ».`,
            `Choisis la phrase : **${sentence(p.en, p.be, pred)}**`,
          ],
        };
      }
      const rows = onePerBe(rng);
      const left = rows.map((x) => x.en as string);
      const right = shuffledOther(rng, ['am', 'is', 'are']);
      return {
        prompt: `Associe chaque pronom à la bonne forme de be : ${left.join(', ')}.`,
        answer: { kind: 'match', left, right, pairs: rows.map((x) => right.indexOf(x.be)) },
        hint: 'Commence par « I » : il n’a qu’une seule forme, toute particulière.',
        steps: [
          'Commence par « I » : relie-le à « am ».',
          'Cherche ensuite « he, she, it » : relie-les à « is ».',
          'Relie les pronoms « you, we, they » à « are ».',
          `Vérifie tes paires : **${rows.map((x) => `${x.en} ${x.be}`).join(' ; ')}**`,
        ],
      };
    }
    if (level === 3) {
      const [a, b] = rng.shuffle(PRONOUNS).slice(0, 2) as [PronounRow, PronounRow];
      const [pa, pb] = rng.shuffle(PREDICATES).slice(0, 2) as [string, string];
      return {
        prompt: `Écris le verbe be au présent dans chaque trou : « ${cap(a.en)} … ${pa}. ${cap(b.en)} … ${pb}. »`,
        answer: {
          kind: 'cloze',
          parts: [`${cap(a.en)} `, ` ${pa}. ${cap(b.en)} `, ` ${pb}.`],
          blanks: [
            { mode: 'text', accepted: [a.be] },
            { mode: 'text', accepted: [b.be] },
          ],
        },
        hint: 'Un trou après l’autre : cherche le pronom, puis sa forme de be (am, is ou are).',
        steps: [
          `Regarde le premier pronom : « ${a.en} » va avec « ${a.be} ».`,
          `Regarde le second pronom : « ${b.en} » va avec « ${b.be} ».`,
          `Écris dans les trous : **${a.be}**, puis **${b.be}**.`,
        ],
      };
    }
    if (level === 4) {
      const p = pickPronoun(rng);
      const pred = rng.pick(PREDICATES);
      const other = at(
        ['am', 'is', 'are'].filter((v) => v !== p.be),
        rng.int(0, 1),
      );
      if (rng.int(0, 1) === 0) {
        const rest = pred;
        return {
          prompt: `Écris la phrase « ${sentence(p.en, p.be, pred)} » avec la forme courte (contraction) de be.`,
          answer: {
            kind: 'text',
            accepted: dotted([`${cap(p.short)} ${rest}`]),
          },
          traps: [
            {
              text: `${cap(p.short.replace('’', ''))} ${rest}.`,
              why: 'N’oublie pas l’apostrophe : elle remplace la lettre qui disparaît (I’m = I am).',
            },
            {
              text: `${cap(p.en)} ${other} ${rest}.`,
              why: `Ici il faut une forme courte, et « ${other} » ne va pas avec « ${p.en} ».`,
            },
          ],
          hint: 'La contraction garde le pronom, puis une apostrophe, puis la fin du verbe.',
          steps: [
            `Repère les deux mots à raccourcir : « ${p.en} ${p.be} ».`,
            `Mets une apostrophe à la place d’une lettre : « ${p.short} ».`,
            `Écris la phrase : **${cap(p.short)} ${rest}.**`,
          ],
        };
      }
      const FR: readonly { readonly p: Pronoun; readonly fr: string }[] = [
        { p: 'I', fr: 'Je suis content(e).' },
        { p: 'you', fr: 'Tu es content(e).' },
        { p: 'he', fr: 'Il est content (un garçon).' },
        { p: 'she', fr: 'Elle est contente (une fille).' },
        { p: 'we', fr: 'Nous sommes contents.' },
        { p: 'they', fr: 'Ils sont contents.' },
      ];
      const f = rng.pick(FR);
      const q = rowOf(f.p);
      const wrongBe = at(
        ['am', 'is', 'are'].filter((v) => v !== q.be),
        rng.int(0, 1),
      );
      return {
        prompt: `Écris en anglais, avec « happy » : « ${f.fr} »`,
        answer: {
          kind: 'text',
          accepted: dotted([`${cap(q.en)} ${q.be} happy`, `${cap(q.short)} happy`]),
        },
        traps: [
          { text: `${cap(q.en)} be happy.`, why: 'Ici « be » doit changer de forme : il faut am, is ou are.' },
          {
            text: sentence(q.en, wrongBe, 'happy'),
            why: `« ${wrongBe} » ne va pas avec « ${q.en} » : on dit « ${q.en} ${q.be} ».`,
          },
        ],
        hint: 'Trois mots : le pronom, la bonne forme de be, puis « happy ».',
        steps: [
          `Cherche d’abord le pronom anglais : « ${q.en} ».`,
          `Ajoute sa forme de be : « ${q.be} ».`,
          `Écris la phrase : **${sentence(q.en, q.be, 'happy')}**`,
        ],
      };
    }
    // Niveau 5 : le petit texte d'Ana, trois formes de be à écrire (« I », puis deux sujets tirés librement :
    // pas toujours une de chaque forme, pour qu'on ne réponde pas par élimination).
    const intro = { text: 'Hello! I … Ana.', be: 'am', pro: 'I' };
    const others = rng
      .shuffle([
        { text: 'My brother … ten.', be: 'is', pro: 'my brother = he' },
        { text: 'My sister … tired.', be: 'is', pro: 'my sister = she' },
        { text: 'My book … on the table.', be: 'is', pro: 'my book = it' },
        { text: 'My parents … in the kitchen.', be: 'are', pro: 'my parents = they' },
        { text: 'Emir and I … at school.', be: 'are', pro: 'Emir and I = we' },
        { text: 'Paul and Yuna … happy.', be: 'are', pro: 'Paul and Yuna = they' },
      ])
      .slice(0, 2);
    const lines = [intro, ...others];
    return {
      prompt: 'Lis le texte d’Ana. Écris le verbe be au présent dans chaque trou.',
      ...numberedText(
        'Ana se présente',
        lines.map((l) => l.text),
        lines.map((l) => l.be),
      ),
      hint: 'De qui parle chaque phrase ? Remplace ce sujet par un pronom.',
      steps: [
        'Trouve le sujet placé devant chaque trou.',
        `Remplace chaque sujet par un pronom : ${lines.map((l) => l.pro).join(' ; ')}.`,
        'Choisis « am » avec « I », « is » pour un seul, « are » pour plusieurs.',
        `Écris dans l’ordre : **${lines.map((l) => l.be).join(', ')}**`,
      ],
    };
  },
};

// ——— 2. pronoms sujets ———
const whyNotPronoun = (p: Pronoun, subj: string) => `« ${p} » sert pour ${rowOf(p).usage}, pas pour « ${subj} ».`;

const pronounOptions = (rng: Rng, right: Pronoun, subj: string, count: number) =>
  choice(
    rng,
    right,
    rng
      .shuffle(PRONOUNS.map((x) => x.en).filter((x) => x !== right))
      .slice(0, count)
      .map((x) => ({ label: x, why: whyNotPronoun(x, subj) })),
  );

/** Explication guidée : qui est le sujet, puis le pronom. */
const pronounSteps = (subj: string, pro: Pronoun, verb: 'Choisis' | 'Écris'): string[] => [
  `Regarde le sujet à remplacer : « ${subj} ».`,
  `Demande-toi qui c’est : ${rowOf(pro).usage}.`,
  `${verb} le pronom : **${pro}**`,
];

const SCENES: readonly { readonly fr: string; readonly pro: Pronoun }[] = [
  { fr: 'Tu parles de toi.', pro: 'I' },
  { fr: 'Tu parles à ton copain Emir (tu t’adresses à lui).', pro: 'you' },
  { fr: 'Tu parles à toute ta classe.', pro: 'you' },
  { fr: 'Tu parles de toi et de ton copain Emir, ensemble.', pro: 'we' },
  { fr: 'Tu parles de ton cahier (un seul).', pro: 'it' },
  { fr: 'Tu parles d’Ana et de Paul, ensemble.', pro: 'they' },
  { fr: 'Tu parles de ta sœur.', pro: 'she' },
  { fr: 'Tu parles de ton frère.', pro: 'he' },
];

const subjectPronouns: Skill = {
  id: 'acm1-pronoms-sujets',
  title: 'Les pronoms sujets',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Un **pronom sujet** remplace la personne ou la chose dont on parle.',
      'I = je ; you = tu ou vous ; Emir → he ; Ana → she ; the book → it.',
      'Pour un groupe, dis « they », ou « we » si tu en fais partie.',
    ],
    source: source(
      'Déterminer de qui on parle en s’appuyant sur les pronoms personnels sujets, compléments et les adjectifs possessifs',
      'Formes : British Council, LearnEnglish, « Possessives: adjectives » (tableau des pronoms sujets).',
    ),
    sources: ['lve-cm-2026', 'bc-possessives-adjectives', 'bc-verb-be'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Quand tu écoutes de l’anglais, les pronoms comme « he » ou « she » t’aident à savoir de qui on parle.',
      source: 'lve-cm-2026',
      citation:
        'Déterminer de qui on parle en s’appuyant sur les pronoms personnels sujets, compléments et les adjectifs possessifs.',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1) {
      const s = rng.pick(SUBJECTS.filter((x) => ['Ana', 'Emir', 'the bike', 'Ana and Emir'].includes(x.en)));
      const { answer, traps } = pronounOptions(rng, s.pro, s.en, 2);
      return {
        prompt: `Quel pronom sujet remplace « ${s.en} » ?`,
        answer,
        traps,
        hint: 'Demande-toi : est-ce un garçon, une fille, une chose ou plusieurs personnes ?',
        steps: pronounSteps(s.en, s.pro, 'Choisis'),
      };
    }
    if (level === 2) {
      if (rng.int(0, 1) === 0) {
        const picks: { en: string; pro: Pronoun }[] = [];
        for (const s of rng.shuffle(SUBJECTS))
          if (picks.length < 3 && !picks.some((x) => x.pro === s.pro)) picks.push(s);
        const right = shuffledOther(
          rng,
          picks.map((x) => x.pro as string),
        );
        return {
          prompt: `Associe chaque sujet au pronom qui le remplace : ${picks.map((x) => x.en).join(', ')}.`,
          answer: { kind: 'match', left: picks.map((x) => x.en), right, pairs: picks.map((x) => right.indexOf(x.pro)) },
          hint: 'Commence par le sujet le plus facile : un prénom, un objet ou un groupe.',
          steps: [
            'Lis chaque sujet et compte : un seul ou plusieurs ?',
            'Pour un seul, choisis entre garçon, fille et chose.',
            `Relie les paires : **${picks.map((x) => `${x.en} = ${x.pro}`).join(' ; ')}**`,
          ],
        };
      }
      const s = rng.pick(
        SUBJECTS.filter((x) => ['Emir and I', 'Ana and I', 'Paul and Yuna', 'Ana and Emir', 'the book'].includes(x.en)),
      );
      const { answer, traps } = pronounOptions(rng, s.pro, s.en, 3);
      return {
        prompt: `Quel pronom sujet remplace « ${s.en} » ?`,
        answer,
        traps,
        hint:
          s.pro === 'we' || s.pro === 'they'
            ? 'Il y a plusieurs personnes. Est-ce que tu en fais partie ?'
            : 'Demande-toi si c’est une personne ou une chose.',
        steps: pronounSteps(s.en, s.pro, 'Choisis'),
      };
    }
    if (level === 3) {
      const s = rng.pick(SUBJECTS);
      // Une chose n’est ni contente ni fatiguée : seulement les fins de phrase qui disent où elle est.
      const pred = rng.pick(s.pro === 'it' ? PREDICATES.filter((x) => x.includes(' ')) : PREDICATES);
      const be = rowOf(s.pro).be;
      return {
        prompt: `Écris le pronom sujet qui remplace le début de la phrase : « ${cap(s.en)} ${be} ${pred}. » → « … ${be} ${pred}. »`,
        answer: { kind: 'text', accepted: [s.pro] },
        traps: PRONOUNS.filter((x) => x.en !== s.pro && x.be === be)
          .slice(0, 2)
          .map((x) => ({ text: x.en, why: whyNotPronoun(x.en, s.en) })),
        hint: `Le verbe est « ${be} » : ça t’aide à choisir, mais regarde aussi qui on remplace.`,
        steps: pronounSteps(s.en, s.pro, 'Écris'),
      };
    }
    if (level === 4) {
      const sc = rng.pick(SCENES);
      return {
        prompt: `${sc.fr} Écris le pronom sujet anglais qu’il faut employer.`,
        answer: { kind: 'text', accepted: [sc.pro] },
        traps: PRONOUNS.filter((x) => x.en !== sc.pro)
          .slice(0, 6)
          .map((x) => ({ text: x.en, why: `« ${x.en} » sert pour ${x.usage} : ce n’est pas le cas ici.` })),
        hint: 'Qui parle ? À qui ? De qui ? Combien de personnes ?',
        steps: [
          'Cherche de qui, ou à qui, tu parles.',
          `Retiens ce cas : ${rowOf(sc.pro).usage}.`,
          `Écris le pronom : **${sc.pro}**`,
        ],
      };
    }
    // Niveau 5 : un texte, trois pronoms à écrire d'après la phrase d'avant.
    const lines = rng
      .shuffle([
        { text: 'Ana is in the garden. … is happy.', pro: 'she', clue: 'Ana = une fille' },
        { text: 'Emir is in the kitchen. … is tired.', pro: 'he', clue: 'Emir = un garçon' },
        { text: 'The book is new. … is on the table.', pro: 'it', clue: 'the book = une chose' },
        { text: 'Paul and Yuna are at school. … are ready.', pro: 'they', clue: 'Paul and Yuna = un groupe sans moi' },
        { text: 'Emir and I are at home. … are happy.', pro: 'we', clue: 'Emir and I = un groupe avec moi' },
      ])
      .slice(0, 3);
    return {
      prompt: 'Lis le texte. Écris dans chaque trou le pronom qui remplace le sujet de la phrase d’avant.',
      ...numberedText(
        'Chez nous',
        lines.map((l) => l.text),
        lines.map((l) => cap(l.pro)),
      ),
      hint: 'Pour chaque trou, relis la phrase d’avant. De qui parle-t-elle ?',
      steps: [
        'Relis la phrase placée avant chaque trou.',
        `Repère qui c’est : ${lines.map((l) => l.clue).join(' ; ')}.`,
        `Écris les pronoms avec une majuscule : **${lines.map((l) => cap(l.pro)).join(', ')}**`,
      ],
    };
  },
};

// ——— 3. questions avec be ———
const askBe = (p: PronounRow, pred: string) => `${cap(p.be)} ${p.en} ${pred}?`;

const FR_QUESTIONS: readonly {
  readonly fr: string;
  readonly en: string;
  readonly p: PronounRow;
  /** Mot anglais donné pour lever l'ambiguïté de traduction (content : happy, glad…). */
  readonly word?: string;
  /** Autres écritures correctes (contractions). */
  readonly alt?: readonly string[];
}[] = [
  { fr: 'Es-tu content(e) ?', en: 'Are you happy?', p: rowOf('you'), word: 'happy' },
  { fr: 'Est-elle fatiguée ?', en: 'Is she tired?', p: rowOf('she'), word: 'tired' },
  { fr: 'Sont-ils prêts ?', en: 'Are they ready?', p: rowOf('they'), word: 'ready' },
  { fr: 'Suis-je en retard ?', en: 'Am I late?', p: rowOf('I'), word: 'late' },
  { fr: 'Où est Emir ?', en: 'Where is Emir?', p: rowOf('he'), alt: ['Where’s Emir?'] },
  { fr: 'Où sont Ana et Emir ?', en: 'Where are Ana and Emir?', p: rowOf('they') },
];

/** Niveau 4 des questions : écrire la question sans aide. */
function questionWriting(rng: Rng): QuestionDraft {
  if (rng.int(0, 1) === 0) {
    const p = pickPronoun(rng);
    const pred = rng.pick(PREDICATES);
    const q = askBe(p, pred);
    const doWord = p.en === 'he' || p.en === 'she' || p.en === 'it' ? 'Does' : 'Do';
    return {
      prompt: `Écris la question qui correspond à « ${sentence(p.en, p.be, pred)} »`,
      answer: { kind: 'text', accepted: asked([q.slice(0, -1)]) },
      traps: [
        {
          text: `${doWord} ${p.en} ${pred}?`,
          why: 'Avec be, on n’utilise pas « do » : be passe devant le pronom.',
        },
        {
          text: `${at(
            ['Am', 'Is', 'Are'].filter((v) => v !== cap(p.be)),
            0,
          )} ${p.en} ${pred}?`,
          why: `Cette forme de be ne va pas avec « ${p.en} ».`,
        },
      ],
      hint: 'Cherche be dans la phrase. Où va-t-il dans une question ?',
      steps: [
        `Repère le verbe be dans la phrase : « ${p.be} ».`,
        `Place « ${cap(p.be)} » tout au début, avant « ${p.en} ».`,
        `Écris la question : **${q}**`,
      ],
    };
  }
  const f = rng.pick(FR_QUESTIONS);
  const doWord = f.p.en === 'he' || f.p.en === 'she' ? 'Does' : 'Do';
  return {
    prompt: `Écris en anglais : « ${f.fr} »${f.word ? ` (mot utile : « ${f.word} »)` : ''}`,
    answer: {
      kind: 'text',
      accepted: asked([f.en, ...(f.alt ?? [])].map((e) => e.slice(0, -1))),
    },
    traps: [
      {
        text: f.en.startsWith('Where')
          ? `Where ${f.en.slice(0, -1).split(' ').slice(2).join(' ')} ${f.en.split(' ')[1]}?`
          : `${doWord} ${f.en.split(' ').slice(1).join(' ')}`,
        why: f.en.startsWith('Where')
          ? 'Après « Where », be vient avant le sujet.'
          : 'Avec be, on n’utilise pas « do » : be passe devant le pronom.',
      },
    ],
    hint: 'Commence par le mot interrogatif s’il y en a un, sinon par be.',
    steps: f.en.startsWith('Where')
      ? [
          'Commence par le mot « Where », qui veut dire « où ».',
          `Ajoute ensuite be, puis le sujet.`,
          `Écris la question : **${f.en}**`,
        ]
      : [
          'Cherche le sujet et sa forme de be.',
          'Place be tout au début, puis le sujet.',
          `Écris la question : **${f.en}**`,
        ],
  };
}

/** Niveau 5 des questions : un dialogue où il faut écrire la question qui manque. */
function questionDialogue(rng: Rng): QuestionDraft {
  const cases = [
    { wh: 'Where', be: 'are', who: ['you'], to: 'Elle s’adresse à Emir.', a: 'I’m in the garden.' },
    { wh: 'How', be: 'are', who: ['you'], to: 'Elle s’adresse à Emir.', a: 'I’m fine, thank you.' },
    { wh: 'How old', be: 'are', who: ['you'], to: 'Elle s’adresse à Emir.', a: 'I’m nine.' },
    { wh: 'Where', be: 'is', who: ['Paul', 'he'], to: 'Elle parle de Paul.', a: 'He’s in the kitchen.' },
    { wh: 'How old', be: 'is', who: ['Paul', 'he'], to: 'Elle parle de Paul.', a: 'He’s ten.' },
    { wh: 'How', be: 'is', who: ['Yuna', 'she'], to: 'Elle parle de Yuna.', a: 'She’s tired.' },
    { wh: 'Where', be: 'is', who: ['Yuna', 'she'], to: 'Elle parle de Yuna.', a: 'She’s at home.' },
    {
      wh: 'Where',
      be: 'are',
      who: ['Yuna and Paul', 'Paul and Yuna', 'they'],
      to: 'Elle parle de Yuna et Paul.',
      a: 'They’re at school.',
    },
  ] as const;
  const c = rng.pick(cases);
  const subject: string = c.who[0];
  const q = `${c.wh} ${c.be} ${subject}?`;
  // Forme courte seulement avec « is » (Where’s, How’s) ; « How old’s » ne s’écrit pas.
  const short = c.be === 'is' && c.wh !== 'How old';
  const accepted = c.who.flatMap((w) => [`${c.wh} ${c.be} ${w}`, ...(short ? [`${c.wh}’s ${w}`] : [])]);
  const other = c.be === 'is' ? 'are' : 'is';
  const asks = { Where: 'un lieu', How: 'comment on va', 'How old': 'l’âge' }[c.wh];
  return {
    prompt: `Lis le dialogue. Écris la question d’Ana avec « Where », « How » ou « How old ». ${c.to}`,
    figure: {
      kind: 'document',
      title: 'Ana et Emir discutent',
      lines: ['Ana : Hi, Emir!', 'Emir : Hi, Ana!', 'Ana : …', `Emir : ${c.a}`],
      credit: 'Dialogue écrit pour l’exercice.',
    },
    answer: { kind: 'text', accepted: asked(accepted) },
    traps: asked([`${c.wh} ${subject} ${c.be}`])
      .map((text) => ({ text, why: 'Après le mot interrogatif, be vient avant le sujet.' }))
      .concat(
        asked([`${c.wh} ${other} ${subject}`]).map((text) => ({
          text,
          why: `« ${other} » ne va pas ici : on dit « ${c.be} ».`,
        })),
      ),
    hint: 'Lis la réponse d’Emir. Donne-t-elle un lieu, un âge ou des nouvelles ?',
    steps: [
      'Lis la réponse d’Emir à la dernière ligne.',
      `Trouve ce qu’elle donne : ${asks}.`,
      `Choisis « ${c.wh} », puis ajoute be et le sujet.`,
      `Écris la question : **${q}**`,
    ],
  };
}

const questionsBe: Skill = {
  id: 'acm1-questions-be',
  title: 'Les questions avec be',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Pour questionner avec be, **inverse** : place be avant le pronom.',
      '« She is happy » devient « Is she happy? ».',
      'Un **mot interrogatif** comme « where » se met tout au début.',
    ],
    source: source(
      'Poser quelques questions simples à l’aide d’une gamme réduite de pronoms interrogatifs',
      'Formes : British Council, LearnEnglish (Verb be ; Question forms), page A1-A2.',
    ),
    sources: ['lve-cm-2026', 'bc-verb-be', 'bc-question-forms'],
  },
  sens: [
    {
      type: 'savais-tu',
      text: 'En anglais, pour poser une question, on met souvent le verbe avant le sujet.',
      source: 'bc-question-forms',
      citation: 'To make questions, we often put the verb before the subject.',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1) {
      const p = pickPronoun(rng, EASY.concat(['you', 'they']));
      const pred = rng.pick(PREDICATES);
      const q = askBe(p, pred);
      const { answer, traps } = choice(rng, q, [
        { label: sentence(p.en, p.be, pred), why: 'Cette phrase affirme quelque chose : ce n’est pas une question.' },
        {
          label: `${cap(p.en)} ${pred} ${p.be}.`,
          why: 'Les mots sont dans le désordre : be vient juste après le pronom.',
        },
      ]);
      return {
        prompt: 'Laquelle de ces phrases est une question ?',
        answer,
        traps,
        hint: 'Compare le début des phrases : dans une question, be change de place.',
        steps: [
          'Regarde le premier mot de chaque phrase.',
          'Cherche celle qui commence par am, is ou are.',
          `Choisis la question : **${q}**`,
        ],
      };
    }
    if (level === 2) {
      if (rng.int(0, 1) === 0) {
        const p = pickPronoun(rng);
        const pred = rng.pick(PREDICATES);
        const q = askBe(p, pred);
        const wrongBe = at(
          ['Am', 'Is', 'Are'].filter((v) => v !== cap(p.be)),
          rng.int(0, 1),
        );
        const doWord = p.en === 'he' || p.en === 'she' || p.en === 'it' ? 'Does' : 'Do';
        const { answer, traps } = choice(rng, q, [
          {
            label: `${wrongBe} ${p.en} ${pred}?`,
            why: `« ${wrongBe} » ne va pas avec « ${p.en} » : on dit « ${cap(p.be)} ${p.en} ».`,
          },
          { label: `${doWord} ${p.en} ${pred}?`, why: 'Avec be, on n’utilise pas « do » : be passe devant le pronom.' },
          {
            label: `${cap(p.be)} ${pred} ${p.en}?`,
            why: 'Les mots sont dans le désordre : le pronom vient juste après be.',
          },
        ]);
        return {
          prompt: `Comment poser la question à partir de « ${sentence(p.en, p.be, pred)} » ?`,
          answer,
          traps,
          hint: 'Prends le verbe be et mets-le tout au début, avec une majuscule.',
          steps: [
            `Repère le verbe be : « ${p.be} ».`,
            `Place-le tout au début, avant « ${p.en} ».`,
            `Choisis la question : **${q}**`,
          ],
        };
      }
      const rows = onePerBe(rng);
      const pred = rng.pick(PREDICATES);
      const left = rows.map((x) => sentence(x.en, x.be, pred));
      const right = shuffledOther(
        rng,
        rows.map((x) => askBe(x, pred)),
      );
      return {
        prompt: `Associe chaque phrase à sa question : ${left.join(' / ')}`,
        answer: { kind: 'match', left, right, pairs: rows.map((x) => right.indexOf(askBe(x, pred))) },
        hint: 'Repère le pronom : la question garde le même, mais be change de place.',
        steps: [
          'Repère le pronom dans chaque phrase.',
          'Cherche la question avec le même pronom, placé après be.',
          `Relie les paires : **${rows.map((x) => `${x.en} → ${askBe(x, pred).slice(0, -1)}`).join(' ; ')}**`,
        ],
      };
    }
    if (level === 3) {
      const p = pickPronoun(rng);
      const wh = rng.int(0, 1) === 0;
      const final = wh ? ['Where', p.be, p.en] : [cap(p.be), p.en, rng.pick(['happy', 'tired', 'ready'] as const)];
      const items = shuffledOther(rng, final);
      return {
        prompt: `Remets les mots dans l’ordre pour former une question : ${items.join(' / ')}`,
        answer: { kind: 'order', items, correct: final.map((w) => items.indexOf(w)) },
        hint: wh ? 'Cherche d’abord la place du mot « Where ».' : 'Quel mot change de place pour poser une question ?',
        steps: [
          wh ? 'Place d’abord le mot interrogatif « Where ».' : `Place d’abord be : « ${cap(p.be)} ».`,
          wh ? `Ajoute ensuite be : « ${p.be} ».` : `Ajoute ensuite le pronom : « ${p.en} ».`,
          `Termine la question : **${final.join(' ')}?**`,
        ],
      };
    }
    if (level === 4) return questionWriting(rng);
    return questionDialogue(rng);
  },
};

// ——— 4. adjectifs possessifs ———
const ownerOf = (rng: Rng) => rng.pick(OWNERS);
/** La chose possédée : celle du propriétaire s’il en impose une (la porte d’un bus), sinon au hasard. */
const thingOf = (rng: Rng, o: Owner) => o.thing ?? rng.pick(THINGS);
/** Explication guidée : le propriétaire, son pronom, son possessif. */
const ownerSteps = (who: string, row: PronounRow, verb: 'Choisis' | 'Écris'): string[] => [
  `Cherche le propriétaire : ${who}.`,
  `Remplace-le par un pronom anglais : « ${row.en} ».`,
  `${verb} son possessif : **${row.poss}**`,
];

const whyPoss = (poss: string) => {
  const row = PRONOUNS.find((x) => x.poss === poss);
  return `« ${poss} » va avec « ${row?.en ?? '?'} » : ${row?.usage ?? ''}.`;
};

/** Niveau 5 des possessifs : un petit texte, trois possessifs à écrire. */
function possessiveText(rng: Rng): QuestionDraft {
  const intro = { text: 'Hello! … name is Ana.', poss: 'my', clue: 'Ana parle d’elle = I' };
  const others = [
    { text: 'This is Emir. … room is blue.', poss: 'his', clue: 'Emir = he' },
    { text: 'This is Yuna. … bike is red.', poss: 'her', clue: 'Yuna = she' },
    { text: 'Look at the bus. … door is open.', poss: 'its', clue: 'the bus = it' },
    { text: 'Emir and I are here. … house is big.', poss: 'our', clue: 'Emir and I = we' },
    { text: 'Paul and Yuna are here. … bags are green.', poss: 'their', clue: 'Paul and Yuna = they' },
  ];
  const lines = [intro, ...rng.shuffle(others).slice(0, 2)];
  return {
    prompt: 'Lis le texte d’Ana. Écris le possessif de chaque trou. Regarde bien la phrase d’avant.',
    ...numberedText(
      'Le texte d’Ana',
      lines.map((l) => l.text),
      lines.map((l) => cap(l.poss)),
    ),
    hint: 'La première phrase parle d’Ana elle-même. Ensuite, relis la phrase d’avant.',
    steps: [
      'Trouve à qui est chaque chose.',
      `Remplace chaque propriétaire par un pronom : ${lines.map((l) => l.clue).join(' ; ')}.`,
      `Écris les possessifs avec une majuscule : **${lines.map((l) => cap(l.poss)).join(', ')}**`,
    ],
  };
}

const possessives: Skill = {
  id: 'acm1-possessifs',
  title: 'Les adjectifs possessifs',
  levels: 5,
  version: 3,
  lesson: {
    memo: [
      'Un **adjectif possessif** dit à qui est une chose.',
      'I → my ; you → your ; he → his ; she → her ; it → its ; we → our ; they → their.',
      'Écris **its** sans apostrophe, car « it’s » veut dire « it is ».',
    ],
    source: source(
      'Déterminer de qui on parle en s’appuyant sur les pronoms personnels sujets, compléments et les adjectifs possessifs',
      'Formes : British Council, LearnEnglish, English grammar reference, « Possessives: adjectives ».',
    ),
    sources: ['lve-cm-2026', 'bc-possessives-adjectives'],
  },
  sens: [
    {
      type: 'savais-tu',
      text: 'En anglais, « it’s » veut toujours dire « it is » ou « it has ».',
      source: 'bc-possessives-adjectives',
      citation: "it's always means it is or it has",
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1) {
      const p = pickPronoun(rng);
      const { answer, traps } = choice(
        rng,
        p.poss,
        rng
          .shuffle(PRONOUNS.filter((x) => x.poss !== p.poss))
          .slice(0, 2)
          .map((x) => ({ label: x.poss, why: `${whyPoss(x.poss)} Ici on cherche celui de « ${p.en} ».` })),
      );
      return {
        prompt: `Quel adjectif possessif va avec « ${p.en} » ?`,
        answer,
        traps,
        hint: 'Chaque pronom a son petit mot à lui. Récite la liste.',
        steps: [
          `Regarde le pronom donné : « ${p.en} ».`,
          `Pense à qui il désigne : ${p.usage}.`,
          `Choisis son possessif : **${p.poss}**`,
        ],
      };
    }
    if (level === 2) {
      if (rng.int(0, 1) === 0) {
        const rows = rng.shuffle(PRONOUNS).slice(0, 3);
        const right = shuffledOther(
          rng,
          rows.map((x) => x.poss),
        );
        return {
          prompt: `Associe chaque pronom à son adjectif possessif : ${rows.map((x) => x.en).join(', ')}.`,
          answer: {
            kind: 'match',
            left: rows.map((x) => x.en as string),
            right,
            pairs: rows.map((x) => right.indexOf(x.poss)),
          },
          hint: 'Commence par le pronom que tu connais le mieux.',
          steps: [
            'Lis chaque pronom, un par un.',
            'Cherche son possessif dans l’autre colonne.',
            `Relie les paires : **${rows.map((x) => `${x.en} → ${x.poss}`).join(' ; ')}**`,
          ],
        };
      }
      const o = ownerOf(rng);
      const th = thingOf(rng, o);
      const row = rowOf(o.pro);
      const { answer, traps } = choice(
        rng,
        row.poss,
        rng
          .shuffle(PRONOUNS.map((x) => x.poss).filter((x) => x !== row.poss))
          .slice(0, 3)
          .map((x) => ({ label: x, why: `${whyPoss(x)} Ici, le propriétaire se dit « ${row.en} ».` })),
      );
      return {
        prompt: `Complète : « This is … ${th.en}. » (${th.fr} est ${o.fr}.)`,
        answer,
        traps,
        hint: 'Remplace le propriétaire par un pronom (I, he, she…), puis cherche son possessif.',
        steps: ownerSteps(o.who, row, 'Choisis'),
      };
    }
    if (level === 3) {
      const o = ownerOf(rng);
      const th = thingOf(rng, o);
      const row = rowOf(o.pro);
      const others = PRONOUNS.filter((x) => x.poss !== row.poss);
      return {
        prompt: `Écris le possessif qui manque : « This is … ${th.en}. » (${th.fr} est ${o.fr}.)`,
        answer: { kind: 'text', accepted: [row.poss] },
        traps: [
          { text: row.en, why: `« ${row.en} » est un pronom sujet. Devant un nom, il faut le possessif.` },
          ...(row.poss === 'its'
            ? [{ text: 'it’s', why: '« it’s » veut dire « it is » : le possessif s’écrit « its », sans apostrophe.' }]
            : []),
          ...others.slice(0, 2).map((x) => ({ text: x.poss, why: whyPoss(x.poss) })),
        ],
        hint: `Le propriétaire se dit « ${row.en} » en anglais. Quel est son possessif ?`,
        steps: ownerSteps(o.who, row, 'Écris'),
      };
    }
    if (level === 4) {
      if (rng.int(0, 1) === 0) {
        const cases = [
          { b: 'Look at the bus.', a: 'door is open.', ctx: 'C’est la porte du bus.', poss: 'its' },
          { b: 'She’s washing', a: 'hair.', ctx: 'Ce sont les cheveux d’Ana.', poss: 'her' },
          { b: 'He’s broken', a: 'arm.', ctx: 'C’est le bras d’Emir.', poss: 'his' },
          {
            b: 'How old is',
            a: 'sister?',
            ctx: 'Tu parles à Ana : la sœur de la personne à qui tu parles.',
            poss: 'your',
          },
          { b: 'That’s', a: 'house.', ctx: 'La maison est à Emir et à moi.', poss: 'our' },
          { b: 'I need to clean', a: 'teeth.', ctx: 'Ce sont les dents de celui ou celle qui parle.', poss: 'my' },
          { b: 'Ana and Emir are in', a: 'kitchen.', ctx: 'La cuisine est à Ana et Emir.', poss: 'their' },
        ] as const;
        const c = rng.pick(cases);
        const row = PRONOUNS.find((x) => x.poss === c.poss);
        return {
          prompt: `Écris le possessif qui manque : « ${c.b} … ${c.a} » (${c.ctx})`,
          answer: { kind: 'text', accepted: [c.poss] },
          traps: [
            ...(c.poss === 'its'
              ? [{ text: 'it’s', why: '« it’s » veut dire « it is » : le possessif s’écrit « its », sans apostrophe.' }]
              : []),
            ...(row
              ? [
                  {
                    text: row.en as string,
                    why: `« ${row.en} » est un pronom sujet. Devant un nom, il faut le possessif.`,
                  },
                ]
              : []),
            ...(c.poss === 'her' ? [{ text: 'his', why: 'Ana est une fille : on dit « her », pas « his ».' }] : []),
            ...(c.poss === 'his' ? [{ text: 'her', why: 'Emir est un garçon : on dit « his », pas « her ».' }] : []),
          ],
          hint: 'Qui possède la chose ? Trouve son pronom, puis son possessif.',
          steps: [
            'Lis la précision entre parenthèses pour trouver le propriétaire.',
            `Remplace ce propriétaire par un pronom : « ${row?.en ?? ''} ».`,
            `Écris son possessif : **${c.poss}**`,
          ],
        };
      }
      const cases = [
        { fr: 'ma maison', en: 'my house', p: 'my', alt: 'my home' },
        { fr: 'ton chien', en: 'your dog', p: 'your' },
        { fr: 'son sac (le sac d’un garçon)', en: 'his bag', p: 'his' },
        { fr: 'son sac (le sac d’une fille)', en: 'her bag', p: 'her' },
        { fr: 'notre chambre', en: 'our room', p: 'our', alt: 'our bedroom' },
        { fr: 'leur vélo', en: 'their bike', p: 'their', alt: 'their bicycle' },
        { fr: 'sa porte (la porte d’un bus)', en: 'its door', p: 'its' },
      ];
      const c = rng.pick(cases);
      const noun = c.en.split(' ')[1] ?? '';
      const owner = PRONOUNS.find((x) => x.poss === c.p)?.en ?? '';
      const swap = at(
        ['my', 'your', 'his', 'her', 'our', 'their'].filter((x) => x !== c.p && !(c.p === 'its' && x === 'his')),
        rng.int(0, 3),
      );
      return {
        prompt: `Écris en anglais : « ${c.fr} »`,
        answer: { kind: 'text', accepted: dotted([c.en, ...(c.alt ? [c.alt] : [])]) },
        traps: [
          { text: noun, why: 'Il manque le possessif devant le nom.' },
          { text: `${swap} ${noun}`, why: whyPoss(swap) },
          ...(c.p === 'its'
            ? [{ text: `it’s ${noun}`, why: '« it’s » veut dire « it is » : il faut « its », sans apostrophe.' }]
            : []),
        ],
        hint: 'Trouve d’abord le pronom. Cherche ensuite son possessif, puis le nom.',
        steps: [
          'Cherche à qui est la chose.',
          `Trouve le pronom « ${owner} » : son possessif est « ${c.p} ».`,
          `Écris le possessif puis le nom : **${c.en}**`,
        ],
      };
    }
    return possessiveText(rng);
  },
};

export const ENGLISH_BE_CHAPTERS: readonly Chapter[] = [
  {
    id: 'acm1-be',
    subject: 'anglais',
    grade: 'cm1',
    domain: 'langue',
    title: 'Le verbe be',
    skills: [bePresent, subjectPronouns, questionsBe],
  },
  {
    id: 'acm1-possessifs',
    subject: 'anglais',
    grade: 'cm1',
    domain: 'langue',
    title: 'Les possessifs',
    skills: [possessives],
  },
];
