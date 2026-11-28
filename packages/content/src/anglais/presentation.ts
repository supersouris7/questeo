import type { Chapter, QuestionDraft, Skill } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import {
  AGES,
  CITIES,
  NAMES,
  PHRASES,
  QUESTIONS,
  ROLES,
  SITUATIONS,
  punctuated,
  spellings,
  wordOf,
  type Role,
} from './presentation-faits.ts';

/**
 * Anglais CM1 — « Se présenter et saluer » (lot an-cm1-01, repassé : docs/adr/0034). Programme de langues vivantes du
 * cours moyen (arrêté du 26 février 2026), expression orale en interaction : « Établir un contact (saluer, se
 * présenter, présenter quelqu’un, etc.) ». Formes : British Council et programme (voir presentation-faits.ts : chaque
 * fait y porte sa source et sa citation).
 */

const PROGRAMME = 'Programme de langues vivantes, cours moyen (arrêté du 26 février 2026, BO n° 12), CM1';
const source = (detail: string) => `${PROGRAMME} — « Établir un contact (saluer, se présenter…) ». ${detail}`;

const otherOf = <T>(rng: Rng, list: readonly T[], not: readonly T[]): T =>
  rng.pick(list.filter((x) => !not.includes(x)));
/** Élément d'une liste à un indice valide (erreur de programmation sinon). */
const at = <T>(list: readonly T[], i: number): T => {
  const x = list[i];
  if (x === undefined) throw new Error(`indice ${i} hors liste`);
  return x;
};
const word = (n: number): string => wordOf(n) ?? String(n);
/** Phrase sans sa ponctuation finale (pour la citer au milieu d'une explication). */
const bare = (text: string): string => text.replace(/\s?[.!?]$/, '');
/** Questions avec ou sans point d'interrogation (collé ou précédé d'une espace). */
const asked = (...forms: string[]): string[] => forms.flatMap((f) => [f, `${f}?`, `${f} ?`]);

/** Autres façons correctes de demander l’âge, le prénom ou le lieu où l’on habite. */
const NAME_QUESTIONS = asked(
  'What’s your name',
  'What is your name',
  'What’s your first name',
  'What is your first name',
  'What are you called',
);
const AGE_QUESTIONS = asked('How old are you', 'What’s your age', 'What is your age', 'What age are you');
const LIVE_QUESTIONS = asked('Where do you live', 'Where do you live now', 'Where are you living');

/** Mélange une liste jusqu'à ce qu'elle ne soit plus dans l'ordre de départ. */
function shuffledOther<T>(rng: Rng, list: readonly T[]): T[] {
  let out = rng.shuffle(list);
  while (out.every((x, i) => x === list[i])) out = rng.shuffle(list);
  return out;
}

/** Texte à trous saisis : un segment de plus que de trous. */
const gaps = (parts: readonly string[], accepted: readonly (readonly string[])[]) => ({
  kind: 'cloze' as const,
  parts: [...parts],
  blanks: accepted.map((a) => ({ mode: 'text' as const, accepted: [...a] })),
});

// ——— 1. Saluer et prendre congé ———
const phraseTrap = (role: Role): string =>
  `« ${bare(PHRASES[role].en)} » veut dire « ${PHRASES[role].fr} » : ce n’est pas le bon moment.`;

const saluer: Skill = {
  id: 'acm1-saluer',
  title: 'Saluer et prendre congé',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Pour **saluer**, dis « Hello » ou « Hi » : cela veut dire « bonjour ».',
      'À une rencontre : « Nice to meet you », puis la réponse « You too ».',
      'Pour **prendre congé**, c’est-à-dire dire au revoir, dis « Bye for now ».',
    ],
    source: source('Expressions : British Council, LearnEnglish, Speaking A1 « Meeting new people », et programme.'),
    sources: ['lve-cm-2026', 'lve-c2-2026', 'bc-meeting-new-people'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Saluer et dire au revoir en anglais t’aide à entrer en contact avec les autres.',
      source: 'lve-cm-2026',
      citation:
        'l’élève peut établir un contact social en utilisant quelques formules de politesse : salutations et prises de congé',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    const s = rng.pick(SITUATIONS);
    const p = PHRASES[s.role];
    const look = [`Lis la scène et repère le moment : ${p.moment}.`, `Cherche la phrase anglaise pour « ${p.fr} ».`];
    const steps = [...look, `Retiens la réponse : **${s.en}**`];
    const hint = 'Imagine la scène. Est-ce une arrivée, une rencontre, une réponse ou un départ ?';
    if (level === 1) {
      const others = rng.shuffle(ROLES.filter((x) => x !== s.role)).slice(0, 2);
      const { answer, traps } = choice(
        rng,
        s.en,
        others.map((x) => ({ label: PHRASES[x].en, why: phraseTrap(x) })),
      );
      return { prompt: `${s.text} Choisis la phrase à dire.`, answer, traps, hint, steps };
    }
    if (level === 2) {
      const roles = rng.shuffle(ROLES).slice(0, 3);
      const left = roles.map((x) => PHRASES[x].en);
      const right = shuffledOther(
        rng,
        roles.map((x) => PHRASES[x].fr),
      );
      return {
        prompt: `Associe chaque phrase anglaise à son sens : ${left.map((l) => `« ${bare(l)} »`).join(', ')}.`,
        answer: { kind: 'match', left, right, pairs: roles.map((x) => right.indexOf(PHRASES[x].fr)) },
        hint: 'Commence par la phrase que tu connais le mieux. Élimine ensuite les sens déjà pris.',
        steps: [
          'Commence par la phrase que tu connais le mieux.',
          'Relie les autres une par une, avec les sens qui restent.',
          `Vérifie tes paires : **${roles.map((x) => `${bare(PHRASES[x].en)} = ${PHRASES[x].fr}`).join(' ; ')}**`,
        ],
      };
    }
    if (level === 3) {
      if (rng.int(0, 1) === 0) {
        const name = rng.pick(NAMES);
        // Le salut suit le prénom : un même énoncé garde la même réponse.
        const hello = NAMES.indexOf(name) % 2 === 0 ? 'Hello!' : 'Hi!';
        const base = [hello, ...ROLES.slice(1).map((x) => PHRASES[x].en)];
        const items = shuffledOther(rng, base);
        return {
          prompt: `Tu rencontres ${name}. Range les phrases, de l’arrivée jusqu’au départ.`,
          answer: { kind: 'order', items, correct: base.map((b) => items.indexOf(b)) },
          hint: 'Une rencontre commence par un salut. Elle se termine par un départ.',
          steps: [
            'Place d’abord la phrase pour saluer.',
            'Ajoute la phrase de la rencontre, puis la réponse.',
            'Termine par la phrase du départ.',
            `Vérifie l’ordre : **${base.map(bare).join(' → ')}**`,
          ],
        };
      }
      const gap = rng.pick([
        { role: 'rencontre' as const, before: 'Nice to ', word: 'meet', after: ' you.' },
        { role: 'repondre' as const, before: 'You ', word: 'too', after: '.' },
        { role: 'conge' as const, before: 'Bye for ', word: 'now', after: '!' },
      ]);
      const scene = rng.pick(SITUATIONS.filter((x) => x.role === gap.role));
      const target = PHRASES[gap.role];
      return {
        prompt: `${scene.text} Complète la phrase apprise : un seul mot manque.`,
        answer: gaps([gap.before, gap.after], [[gap.word]]),
        hint: 'Redis la phrase entière dans ta tête, mot après mot.',
        steps: [
          `Repère le moment : ${target.moment}.`,
          `Pense à la phrase qui veut dire « ${target.fr} ».`,
          `Écris le mot qui manque : **${gap.word}**`,
        ],
      };
    }
    if (level === 4) {
      const accepted = [...p.accepted, ...(s.extra ?? [])];
      return {
        prompt: `${s.text} Écris la phrase en anglais.`,
        answer: { kind: 'text', accepted: punctuated(accepted) },
        traps: [
          ...(s.role === 'repondre'
            ? [{ text: 'Me too.', why: '« Me too » veut dire « moi aussi », pas « toi aussi ».' }]
            : []),
          ...ROLES.filter((x) => x !== s.role)
            .slice(0, 2)
            .map((x) => ({ text: PHRASES[x].en, why: phraseTrap(x) })),
        ],
        hint,
        steps: [...look, `Écris la phrase : **${s.en}**`],
      };
    }
    // Niveau 5 : un dialogue, deux phrases à écrire d'après le contexte.
    const [a, b] = rng.shuffle(NAMES).slice(0, 2) as [string, string];
    const [first, second] = rng.pick([
      ['rencontre', 'repondre'],
      ['rencontre', 'conge'],
      ['repondre', 'conge'],
    ] as const);
    const turns: readonly { role: Role; who: string; stage: string }[] = [
      { role: 'rencontre', who: a, stage: `(${a} a plaisir à faire cette rencontre.)` },
      { role: 'repondre', who: b, stage: `(${b} répond « toi aussi ».)` },
      { role: 'conge', who: a, stage: `(${a} s’en va.)` },
    ];
    const asking = [first, second] as const;
    const lines = [
      `${a} : Hello!`,
      `${b} : Hi!`,
      ...turns.map((t) => {
        const hole = asking.findIndex((x) => x === t.role);
        return hole < 0 ? `${t.who} : ${PHRASES[t.role].en}` : `${t.who} : … (${hole + 1}) ${t.stage}`;
      }),
    ];
    const shown = asking.map((x) => bare(PHRASES[x].en));
    return {
      prompt: `Lis le dialogue : ${a} et ${b} se voient pour la première fois. Écris les phrases (1) et (2).`,
      figure: {
        kind: 'document',
        title: `${a} et ${b} se rencontrent`,
        lines,
        credit:
          'Dialogue écrit pour l’exercice, avec les expressions de la vidéo « Meeting new people » (British Council).',
      },
      answer: gaps(
        ['(1) ', ' (2) ', ''],
        asking.map((x) => punctuated(PHRASES[x].accepted)),
      ),
      hint: 'Lis la ligne d’avant, puis la note entre parenthèses.',
      steps: [
        'Lis tout le dialogue, ligne par ligne.',
        `Trouve la phrase (1) : ${PHRASES[first].moment}.`,
        `Trouve la phrase (2) : ${PHRASES[second].moment}.`,
        `Écris les deux phrases : **${shown.join(' → ')}**`,
      ],
    };
  },
};

// ——— 2. What's your name? ———
const askName = QUESTIONS.name.en;
const questionOptions = (rng: Rng, right: string, wrong: readonly (readonly [string, string])[]) =>
  choice(
    rng,
    right,
    wrong.map(([label, why]) => ({ label, why })),
  );

/** Moments où l'on veut connaître le prénom de quelqu'un. */
const NAME_SCENES = [
  'Un nouvel élève s’assoit à côté de toi. Tu veux son prénom.',
  'Au club de sport, tu veux connaître le prénom d’un enfant.',
  'En visio, tu veux connaître le prénom de ton correspondant.',
] as const;

const yourName: Skill = {
  id: 'acm1-your-name',
  title: 'What’s your name?',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Pour demander un prénom, dis « What’s your name? ».',
      '« What’s » est une **contraction** de « What is » ; « your » est un **adjectif possessif** (ton).',
      'Pour répondre : « I’m Ana » ou « My name is Ana ».',
    ],
    source: source('Formes : British Council, LearnEnglish (Question forms ; Verb be ; Possessives: adjectives).'),
    sources: [
      'lve-cm-2026',
      'lve-c2-2026',
      'bc-meeting-new-people',
      'bc-question-forms',
      'bc-verb-be',
      'bc-possessives-adjectives',
    ],
  },
  sens: [
    {
      type: 'usage',
      text: 'Te présenter en anglais t’aide à établir un contact avec une nouvelle personne.',
      source: 'lve-cm-2026',
      citation: 'Établir un contact (saluer, se présenter, présenter quelqu’un, etc.)',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    const questionSteps = [
      'Cherche d’abord le mot qui demande une chose : « What ».',
      'Ajoute le petit « ’s », puis « your » (ton) et « name » (prénom).',
      `Retiens la question : **${askName}**`,
    ];
    if (level === 1) {
      const { answer, traps } = questionOptions(rng, askName, [
        [QUESTIONS.age.en, '« How old are you? » demande l’âge, pas le prénom.'],
        [QUESTIONS.live.en, '« Where do you live? » demande où tu habites, pas ton prénom.'],
      ]);
      return {
        prompt: `${rng.pick(NAME_SCENES)} Choisis la question.`,
        answer,
        traps,
        hint: 'Cherche la question qui parle du prénom.',
        steps: [
          'Cherche le mot anglais pour le prénom : « name ».',
          'Élimine les questions sur l’âge ou sur la maison.',
          `Choisis la question : **${askName}**`,
        ],
      };
    }
    if (level === 2) {
      const wrong = rng
        .shuffle([
          ['What’s you name?', 'Avant « name », il faut « your » (ton), pas « you » (toi).'],
          ['What your name?', 'Il manque le petit « ’s » : « What’s » veut dire « What is ».'],
          ['Where’s your name?', '« Where » demande un lieu. Pour un prénom, on commence par « What ».'],
          ['What’s my name?', '« my » veut dire « mon » : tu demanderais ton propre prénom.'],
          ['How’s your name?', '« How » veut dire « comment ». En anglais, on demande avec « What ».'],
        ] as const)
        .slice(0, 3);
      const { answer, traps } = questionOptions(rng, askName, wrong);
      return {
        prompt: `${rng.pick(NAME_SCENES)} Choisis la bonne question, sans faute.`,
        answer,
        traps,
        hint: 'Vérifie le premier mot, puis chaque petit mot.',
        steps: questionSteps,
      };
    }
    if (level === 3) {
      const slot = rng.int(0, 2);
      const name = rng.pick(NAMES);
      const spec = at(
        [
          { parts: [`${name} : `, ' your name?'], accepted: ['What’s', 'What is'], missing: 'What’s' },
          { parts: [`${name} : What’s `, ' name?'], accepted: ['your'], missing: 'your' },
          { parts: [`${name} : What’s your `, '?'], accepted: ['name', 'first name'], missing: 'name' },
        ],
        slot,
      );
      return {
        prompt: `${name} veut connaître ton prénom. Complète : « ${spec.parts.join('…').replace(`${name} : `, '')} »`,
        answer: gaps(spec.parts, [spec.accepted]),
        hint: 'Redis la question entière dans ta tête. Quel morceau manque ?',
        steps: [
          'Lis la question avec le trou.',
          'Pense aux morceaux : le mot « quoi », puis « ton » et « prénom ».',
          `Écris ce qui manque : **${spec.missing}**`,
        ],
      };
    }
    if (level === 4) {
      if (rng.int(0, 1) === 0) {
        return {
          prompt: `${rng.pick(NAME_SCENES)} Écris la question en anglais.`,
          answer: { kind: 'text', accepted: NAME_QUESTIONS },
          traps: [
            { text: 'What’s you name?', why: 'Il faut « your » (ton) avant « name ».' },
            { text: 'What your name?', why: 'Il manque « ’s » : « What’s » veut dire « What is ».' },
          ],
          hint: 'Commence par le mot anglais pour « quoi ». Termine par le mot pour « prénom ».',
          steps: questionSteps,
        };
      }
      const n = rng.pick(NAMES);
      const forms = [
        `I’m ${n}`,
        `I am ${n}`,
        `My name is ${n}`,
        `My name’s ${n}`,
        `It’s ${n}`,
        `I’m called ${n}`,
        `I am called ${n}`,
      ];
      return {
        prompt: `Dans un jeu, tu joues ${n}. On te demande « What’s your name? ». Réponds par une phrase.`,
        answer: {
          kind: 'text',
          accepted: punctuated(forms.flatMap((f) => [f, `Hello, ${f}`, `Hi, ${f}`, `Hello! ${f}`, `Hi! ${f}`])),
        },
        traps: [
          { text: n, why: 'Le prénom seul n’est pas une phrase. Écris les mots pour « je suis » devant.' },
          { text: `Im ${n}`, why: 'N’oublie pas l’apostrophe : « I’m » veut dire « I am ».' },
        ],
        hint: 'Écris d’abord les mots pour « je suis », puis le prénom.',
        steps: [
          'Commence par « I’m », qui veut dire « je suis ».',
          `Ajoute le prénom du personnage : ${n}.`,
          `Écris la phrase : **I’m ${n}.**`,
        ],
      };
    }
    // Niveau 5 : la question entière, la réponse et le « toi aussi » du premier dialogue.
    const [a, b] = rng.shuffle(NAMES).slice(0, 2) as [string, string];
    return {
      prompt: 'Lis le dialogue. Écris les morceaux (1), (2) et (3) en anglais.',
      figure: {
        kind: 'document',
        title: `${a} et ${b} se rencontrent`,
        lines: [`${a} : Hello! … (1)`, `${b} : … (2) ${b}.`, `${a} : Nice to meet you.`, `${b} : You … (3).`],
        credit:
          'Dialogue écrit pour l’exercice, avec les expressions de la vidéo « Meeting new people » (British Council).',
      },
      answer: gaps(
        ['(1) ', ' (2) ', ' (3) ', ''],
        [
          NAME_QUESTIONS,
          [
            'I’m',
            'I am',
            'My name is',
            'My name’s',
            'It’s',
            'I’m called',
            'I am called',
            'Hi, I’m',
            'Hello, I’m',
            'Hi, I am',
            'Hello, I am',
            'Hi, my name is',
            'Hello, my name is',
          ],
          punctuated(['too']),
        ],
      ),
      hint: 'La ligne 2 donne un prénom. Quelle question vient juste avant ?',
      steps: [
        `Lis la ligne 2 : ${b} donne son prénom.`,
        'Trouve la question du prénom pour le trou (1).',
        'Ajoute les mots « je suis », puis le mot « aussi ».',
        `Vérifie les trois trous : **What’s your name → I’m → too**`,
      ],
    };
  },
};

// ——— 3. How old are you? ———
const askAge = QUESTIONS.age.en;
const AGE_SCENES = [
  'Tu veux connaître l’âge d’un nouveau copain.',
  'Au club de sport, tu demandes son âge à une fille.',
  'En visio, tu veux savoir l’âge de ton correspondant.',
] as const;

const howOld: Skill = {
  id: 'acm1-how-old',
  title: 'How old are you?',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Pour demander l’âge, dis « How old are you? ».',
      'Pour répondre, utilise le **verbe be** : « I’m nine » (j’ai neuf ans).',
      'En anglais, l’âge se dit avec « I am », pas avec « have ».',
    ],
    source: source(
      'Formes : British Council, LearnEnglish (Possessives: adjectives ; Verb be) ; nombres : LearnEnglish Kids.',
    ),
    sources: [
      'lve-cm-2026',
      'lve-c2-2026',
      'bc-possessives-adjectives',
      'bc-verb-be',
      'bc-question-forms',
      'bck-flashcards-1-12',
    ],
  },
  sens: [
    {
      type: 'usage',
      text: 'Avec des questions très simples, tu peux parler en anglais de sujets que tu connais.',
      source: 'lve-cm-2026',
      citation:
        'l’élève peut répondre à des questions très simples et en poser de manière ritualisée sur des sujets familiers',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    const questionSteps = [
      'Commence par « How old », qui demande l’âge.',
      'Place ensuite « are », puis « you ».',
      `Retiens la question : **${askAge}**`,
    ];
    if (level === 1) {
      const { answer, traps } = questionOptions(rng, askAge, [
        [QUESTIONS.name.en, '« What’s your name? » demande le prénom, pas l’âge.'],
        [QUESTIONS.live.en, '« Where do you live? » demande où tu habites, pas ton âge.'],
      ]);
      return {
        prompt: `${rng.pick(AGE_SCENES)} Choisis la question.`,
        answer,
        traps,
        hint: 'Cherche la question qui parle de l’âge.',
        steps: [
          'Cherche le petit mot « old », qui parle de l’âge.',
          'Élimine les questions sur le prénom ou la maison.',
          `Choisis la question : **${askAge}**`,
        ],
      };
    }
    if (level === 2) {
      const wrong = rng
        .shuffle([
          ['How are you old?', 'L’ordre est faux : « old » se place juste après « How ».'],
          ['How old you are?', 'Dans la question, « are » se place avant « you ».'],
          ['What old are you?', 'Pour l’âge, on commence par « How », pas par « What ».'],
          ['How many years are you?', 'Pour l’âge, l’anglais ne compte pas les années : on dit « How old ».'],
        ] as const)
        .slice(0, 3);
      const { answer, traps } = questionOptions(rng, askAge, wrong);
      return {
        prompt: `${rng.pick(AGE_SCENES)} Choisis la bonne question, sans faute.`,
        answer,
        traps,
        hint: 'Vérifie le premier mot, puis l’ordre des autres mots.',
        steps: questionSteps,
      };
    }
    if (level === 3) {
      const slot = rng.int(0, 2);
      const name = rng.pick(NAMES);
      const spec = at(
        [
          { parts: [`${name} : How `, ' are you?'], missing: 'old' },
          { parts: [`${name} : How old `, ' you?'], missing: 'are' },
          { parts: [`${name} : How old are `, '?'], missing: 'you' },
        ],
        slot,
      );
      return {
        prompt: `${name} veut connaître ton âge. Complète : « ${spec.parts.join('…').replace(`${name} : `, '')} »`,
        answer: gaps(spec.parts, [[spec.missing]]),
        hint: 'Redis la question entière dans ta tête. Quel mot manque ?',
        steps: [
          'Lis la question avec le trou.',
          'Pense aux mots pour « quel âge », puis « es-tu ».',
          `Écris le mot qui manque : **${spec.missing}**`,
        ],
      };
    }
    if (level === 4) {
      if (rng.int(0, 2) === 0) {
        return {
          prompt: `${rng.pick(AGE_SCENES)} Écris la question en anglais.`,
          answer: { kind: 'text', accepted: AGE_QUESTIONS },
          traps: [
            { text: 'How old you are?', why: 'Dans la question, « are » se place avant « you ».' },
            { text: 'How are you old?', why: '« old » se place juste après « How ».' },
          ],
          hint: 'La question a quatre mots. Le verbe passe avant « tu ».',
          steps: questionSteps,
        };
      }
      const age = rng.pick(AGES);
      const w = word(age);
      const forms = [`I’m ${w}`, `I am ${w}`, `I’m ${w} years old`, `I am ${w} years old`];
      return {
        prompt: `Dans un jeu, tu as ${age} ans. Réponds à « How old are you? » par une phrase, âge en lettres.`,
        answer: { kind: 'text', accepted: punctuated(forms) },
        traps: [
          { text: `I have ${w}`, why: 'En anglais, on dit « I am », pas « I have » comme dans « j’ai ».' },
          { text: `I have ${w} years old`, why: 'Pour l’âge, commence par « I am », pas par « I have ».' },
          { text: `I’m ${w} years`, why: 'Ajoute « old » à la fin, ou enlève « years ».' },
          { text: `I’m ${age}`, why: `On demande l’âge en lettres : ${age} s’écrit « ${w} ».` },
          { text: w, why: 'Le nombre seul n’est pas une phrase. Écris les mots pour « je suis » devant.' },
        ],
        hint: 'Écris d’abord les mots pour « je suis », puis le nombre.',
        steps: [
          'Commence par « I’m », qui veut dire « je suis ».',
          `Ajoute le nombre ${age} en lettres : « ${w} ».`,
          `Écris la phrase : **I’m ${w}.**`,
        ],
      };
    }
    // Niveau 5 : lire une fiche, poser la question et donner les deux âges.
    const [a, b] = rng.shuffle(NAMES).slice(0, 2) as [string, string];
    const [ageA, ageB] = rng.shuffle(AGES).slice(0, 2) as [number, number];
    const reply = (n: number) =>
      punctuated([`I’m ${word(n)}`, `I am ${word(n)}`, `I’m ${word(n)} years old`, `I am ${word(n)} years old`]);
    return {
      prompt: 'Lis la fiche et le dialogue. Écris les phrases (1), (2) et (3), nombres en lettres.',
      figure: {
        kind: 'document',
        title: `${a} et ${b} parlent de leur âge`,
        lines: [
          `Fiche : ${a} a ${ageA} ans, ${b} a ${ageB} ans.`,
          `${a} : … (1), ${b}?`,
          `${b} : … (2)`,
          `(${b} pose la même question à ${a}.)`,
          `${a} : … (3)`,
        ],
        credit: 'Dialogue écrit pour l’exercice. Nombres : LearnEnglish Kids (British Council).',
      },
      answer: gaps(['(1) ', ' (2) ', ' (3) ', ''], [AGE_QUESTIONS, reply(ageB), reply(ageA)]),
      hint: 'Pour chaque réponse, regarde qui parle. Cherche ensuite son âge sur la fiche.',
      steps: [
        'Écris la question de l’âge dans le trou (1).',
        `Lis la fiche : ${b} a ${ageB} ans, écris « I’m ${word(ageB)} ».`,
        `Fais pareil pour ${a}, qui a ${ageA} ans.`,
        `Vérifie les trois trous : **How old are you → I’m ${word(ageB)} → I’m ${word(ageA)}**`,
      ],
    };
  },
};

// ——— 4. Les nombres de 1 à 31 ———
/** Mot d'un nombre ou, à défaut, son écriture en chiffres. */
const confusers = (n: number): number[] => {
  const out: number[] = [];
  if (n >= 13 && n <= 19) out.push((n - 10) * 10);
  if (n === 20) out.push(12);
  if (n >= 21 && n <= 29) out.push(n - 10);
  if (n === 30 || n === 31) out.push(13);
  out.push(n - 1, n + 1, n - 2, n + 2);
  return out.filter((x, i, a) => x > 0 && x !== n && wordOf(x) !== undefined && a.indexOf(x) === i);
};

const MISSPELLED: Readonly<Record<number, string>> = {
  12: 'twelf',
  13: 'threeteen',
  14: 'forteen',
  15: 'fiveteen',
  18: 'eightteen',
};

/** Ce que l'élève fait pour trouver comment un nombre s'écrit. */
const howToWrite = (n: number): [string, string] => {
  if (n <= 12) return ['Compte dans l’ordre depuis « one ».', `Garde le mot qui arrive au nombre ${n}.`];
  if (n <= 19)
    return [
      `Repère que ${n} fait partie des nombres de 13 à 19.`,
      'Pense au début du mot, puis ajoute la fin « -teen ».',
    ];
  if (n % 10 === 0) return [`Repère que ${n} est un nombre rond.`, 'Cherche le mot qui finit par « -ty ».'];
  return [
    `Coupe ${n} en deux : la dizaine ${n - (n % 10)} et l’unité ${n % 10}.`,
    'Écris la dizaine, un tiret, puis l’unité.',
  ];
};
const writeSteps = (n: number): string[] => [...howToWrite(n), `Écris le mot : **${word(n)}**`];
const readSteps = (n: number): string[] => [
  n <= 12
    ? 'Compte « one, two, three » jusqu’au mot demandé.'
    : n <= 19
      ? 'Regarde la fin « -teen » : le nombre est entre 13 et 19.'
      : 'Regarde la fin « -ty » : c’est un nombre rond.',
  `Associe « ${word(n)} » à son nombre.`,
  `Choisis la réponse : **${n}**`,
];
const means = (x: number, n: number): string => `« ${word(x)} » veut dire ${x}, pas ${n}.`;
const glued = (n: number) =>
  word(n).includes('-')
    ? [{ text: word(n).replace('-', ''), why: 'Entre la dizaine et l’unité, il faut un tiret, comme dans twenty-one.' }]
    : [];

const numbers: Skill = {
  id: 'acm1-nombres-1-31',
  title: 'Les nombres de 1 à 31',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'De 13 à 19, les nombres finissent par « -teen » : thirteen, fourteen.',
      'Les **dizaines** finissent par « -ty » : twenty, thirty.',
      'Dans 21 ou 31, mets un **tiret** avant l’**unité** : twenty-one, thirty-one.',
    ],
    source: source('Nombres : British Council, LearnEnglish Kids (cartes 1-12 et 13-24, fiche « Numbers 10-100 »).'),
    sources: ['lve-cm-2026', 'bck-flashcards-1-12', 'bck-flashcards-13-24', 'bck-worksheet-10-100'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Repérer les chiffres en anglais t’aide à réaliser une tâche.',
      source: 'lve-cm-2026',
      citation: 'Repérer les lettres de l’alphabet et les chiffres pour réaliser une tâche.',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    if (level === 1) {
      const n = rng.int(1, 12);
      const pool = rng.shuffle(Array.from({ length: 12 }, (_, i) => i + 1).filter((x) => Math.abs(x - n) >= 3));
      const { answer, traps } = choice(
        rng,
        String(n),
        pool.slice(0, 2).map((x) => ({ label: String(x), why: means(x, n) })),
      );
      return {
        prompt: `Lis le mot « ${word(n)} ». Choisis le bon nombre.`,
        answer,
        traps,
        hint: 'Récite la comptine des nombres anglais dans ta tête.',
        steps: readSteps(n),
      };
    }
    if (level === 2) {
      const n = rng.int(13, 20);
      const wrong = confusers(n).slice(0, 3);
      const hint = 'Regarde bien la fin du mot : elle change le nombre.';
      if (rng.int(0, 1) === 0) {
        const { answer, traps } = choice(
          rng,
          String(n),
          wrong.map((x) => ({ label: String(x), why: means(x, n) })),
        );
        return {
          prompt: `Lis le mot « ${word(n)} ». Choisis le bon nombre.`,
          answer,
          traps,
          hint,
          steps: readSteps(n),
        };
      }
      const { answer, traps } = choice(
        rng,
        word(n),
        wrong.map((x) => ({ label: word(x), why: means(x, n) })),
      );
      return {
        prompt: `Choisis le mot anglais pour le nombre ${n}.`,
        answer,
        traps,
        hint,
        steps: [...howToWrite(n), `Choisis le mot : **${word(n)}**`],
      };
    }
    if (level === 3) {
      const n = rng.int(1, 20);
      const bad = at(confusers(n), 0);
      const typo = MISSPELLED[n];
      return {
        prompt: `Écris en anglais, en lettres, le nombre ${n}.`,
        answer: { kind: 'text', accepted: spellings(word(n)) },
        traps: [
          { text: word(bad), why: means(bad, n) },
          ...(typo ? [{ text: typo, why: `Vérifie l’orthographe : le mot pour ${n} s’écrit autrement.` }] : []),
        ],
        hint: 'Dis la comptine des nombres dans ta tête, puis écris le mot.',
        steps: writeSteps(n),
      };
    }
    if (level === 4) {
      const n = rng.int(21, 31);
      const bad = at(confusers(n), 0);
      return {
        prompt: `Écris en anglais, en lettres, le nombre ${n}.`,
        answer: { kind: 'text', accepted: spellings(word(n)) },
        traps: [...glued(n), { text: word(bad), why: means(bad, n) }],
        hint:
          n % 10 === 0 ? 'Regarde bien la fin du mot des dizaines.' : 'Sépare la dizaine et l’unité avant d’écrire.',
        steps: writeSteps(n),
      };
    }
    // Niveau 5 : compter en montant ou en descendant, puis écrire le nombre caché.
    const dir = rng.pick([1, -1]);
    const start = dir === 1 ? rng.int(13, 27) : rng.int(17, 31);
    const seq = Array.from({ length: 5 }, (_, i) => start + dir * i);
    const hidden = at(seq, 2);
    const a = rng.pick(NAMES);
    const b = otherOf(rng, NAMES, [a]);
    const [s0, s1, , s3, s4] = seq.map(word);
    return {
      prompt: `${a} et ${b} comptent à voix haute. Écris en anglais le nombre caché par « … ».`,
      figure: {
        kind: 'document',
        title: 'On compte !',
        lines: [`${a} : ${s0}, ${s1}, …`, `${b} : ${s3}, ${s4}`],
        credit: 'Écrit pour l’exercice. Nombres : LearnEnglish Kids (British Council).',
      },
      answer: { kind: 'text', accepted: spellings(word(hidden)) },
      traps: [
        ...glued(hidden),
        { text: word(hidden - dir), why: `${a} a déjà dit ce nombre.` },
        { text: word(hidden + dir), why: `${b} dit ce nombre juste après.` },
      ],
      hint: 'Regarde si les nombres montent ou descendent.',
      steps: [
        'Observe les nombres : montent-ils ou descendent-ils ?',
        `Trouve le nombre entre ${hidden - dir} et ${hidden + dir} : c’est ${hidden}.`,
        `Écris-le en anglais : **${word(hidden)}**`,
      ],
    };
  },
};

// ——— 5. Where do you live? ———
/** Nom français de la ville (seule « London » s’écrit autrement). */
const cityFr = (city: string): string => (city === 'London' ? 'Londres' : city);
const askLive = QUESTIONS.live.en;

const LIVE_SCENES = [
  'Tu veux savoir où habite un nouveau copain.',
  'En visio, tu veux savoir où habite ton correspondant.',
  'Au club de sport, tu veux savoir où habite une fille.',
] as const;

const whereLive: Skill = {
  id: 'acm1-where-live',
  title: 'Where do you live?',
  levels: 5,
  version: 2,
  lesson: {
    memo: [
      'Pour demander où on habite, utilise **do** : « Where do you live? ».',
      'Pour répondre : « I live in Glasgow ».',
      'Attention, pour demander d’où tu viens : « Where are you from? ».',
    ],
    source: source(
      'Formes : British Council, LearnEnglish (Question forms) et Speaking A1 « Talking about where you’re from ».',
    ),
    sources: ['lve-cm-2026', 'lve-c2-2026', 'bc-question-forms', 'bc-where-from'],
  },
  sens: [
    {
      type: 'usage',
      text: 'Dire où tu habites, c’est une façon de donner en anglais une information sur toi.',
      source: 'lve-cm-2026',
      citation: 'Exprimer simplement des informations sur soi et sur les autres',
    },
  ],
  generate: (rng, level): QuestionDraft => {
    const questionSteps = [
      'Commence par « Where », qui demande un lieu.',
      'Ajoute « do you », puis le verbe « live » (habiter).',
      `Retiens la question : **${askLive}**`,
    ];
    if (level === 1) {
      const { answer, traps } = questionOptions(rng, askLive, [
        [QUESTIONS.name.en, '« What’s your name? » demande le prénom, pas le lieu où on habite.'],
        [QUESTIONS.age.en, '« How old are you? » demande l’âge, pas le lieu où on habite.'],
      ]);
      return {
        prompt: `${rng.pick(LIVE_SCENES)} Choisis la question.`,
        answer,
        traps,
        hint: 'Cherche la question qui demande un lieu.',
        steps: [
          'Cherche le mot « live », qui veut dire « habiter ».',
          'Élimine les questions sur le prénom ou sur l’âge.',
          `Choisis la question : **${askLive}**`,
        ],
      };
    }
    if (level === 2) {
      const wrong = rng
        .shuffle([
          ['Where are you from?', 'Cette question demande d’où tu viens (from), pas où tu habites (live).'],
          ['Where you live?', 'Il manque « do » devant « you ».'],
          ['Where do you lives?', 'Après « do you », le verbe reste « live », sans s.'],
          ['What do you live?', '« What » demande une chose. Pour un lieu, on dit « Where ».'],
        ] as const)
        .slice(0, 3);
      const { answer, traps } = questionOptions(rng, askLive, wrong);
      return {
        prompt: `${rng.pick(LIVE_SCENES)} Choisis la bonne question, sans faute.`,
        answer,
        traps,
        hint: 'Vérifie le premier mot, puis le petit mot avant « you ».',
        steps: questionSteps,
      };
    }
    if (level === 3) {
      const slot = rng.int(0, 3);
      const name = rng.pick(NAMES);
      const city = rng.pick(CITIES);
      const spec = at(
        [
          { parts: [`${name} : Where `, ' you live?'], missing: 'do', clue: 'le petit mot qui aide à questionner' },
          { parts: [`${name} : Where do you `, '?'], missing: 'live', clue: 'le verbe qui veut dire « habiter »' },
          { parts: [`${name} : I `, ` in ${city}.`], missing: 'live', clue: 'le verbe qui veut dire « habiter »' },
          { parts: [`${name} : I live `, ` ${city}.`], missing: 'in', clue: 'le petit mot placé avant la ville' },
        ],
        slot,
      );
      return {
        prompt: `${
          slot < 2
            ? `${name} veut savoir où tu habites.`
            : `${name} veut dire « J’habite à ${cityFr(city)} » en anglais.`
        } Complète : « ${spec.parts.join('…').replace(`${name} : `, '')} »`,
        answer: gaps(spec.parts, [[spec.missing]]),
        hint: `Cherche ${spec.clue}.`,
        steps: ['Lis la phrase avec le trou.', `Trouve ${spec.clue}.`, `Écris le mot qui manque : **${spec.missing}**`],
      };
    }
    if (level === 4) {
      if (rng.int(0, 1) === 0) {
        return {
          prompt: `${rng.pick(LIVE_SCENES)} Écris la question en anglais.`,
          answer: { kind: 'text', accepted: LIVE_QUESTIONS },
          traps: [
            { text: 'Where you live?', why: 'Il manque « do » devant « you ».' },
            { text: 'Where are you from?', why: 'Cette question demande d’où tu viens, pas où tu habites.' },
          ],
          hint: 'La question a quatre mots. Le premier demande un lieu.',
          steps: questionSteps,
        };
      }
      const city = rng.pick(CITIES);
      const forms = [`I live in ${city}`, `I live in ${city} now`, `I’m living in ${city}`, `I am living in ${city}`];
      return {
        prompt: `Dans un jeu, tu habites à ${cityFr(city)}${
          city === cityFr(city) ? '' : ` (en anglais : ${city})`
        }. Réponds à « Where do you live? » par une phrase.`,
        answer: { kind: 'text', accepted: punctuated(forms) },
        traps: [
          { text: `I live ${city}`, why: 'Il manque le petit mot « in » avant la ville.' },
          { text: `I’m from ${city}`, why: '« I’m from » dit d’où tu viens. Ici, on demande où tu habites.' },
        ],
        hint: 'Écris « je », le verbe habiter, un petit mot, puis la ville.',
        steps: [
          'Commence par « I live », qui veut dire « j’habite ».',
          `Ajoute « in » et la ville : ${city}.`,
          `Écris la phrase : **I live in ${city}.**`,
        ],
      };
    }
    // Niveau 5 : retrouver les deux questions d'après les réponses, sans confondre « from » et « live ».
    const [a, b] = rng.shuffle(NAMES).slice(0, 2) as [string, string];
    const [home, from] = rng.shuffle(CITIES).slice(0, 2) as [string, string];
    const turns = rng.shuffle([
      {
        reply: `I live in ${home}.`,
        about: 'de la maison',
        shown: 'Where do you live',
        accepted: LIVE_QUESTIONS,
      },
      {
        reply: `I’m from ${from}.`,
        about: 'de l’origine',
        shown: 'Where are you from',
        accepted: asked('Where are you from', 'Where do you come from'),
      },
    ]);
    return {
      prompt: 'Lis le dialogue. Écris en anglais les questions (1) et (2).',
      figure: {
        kind: 'document',
        title: `${a} et ${b} parlent de leur ville`,
        lines: turns.flatMap((t, i) => [`${a} : … (${i + 1}), ${b}?`, `${b} : ${t.reply}`]),
        credit:
          'Dialogue écrit pour l’exercice, avec les expressions de la vidéo « Talking about where you’re from » (British Council).',
      },
      answer: gaps(
        ['(1) ', ' (2) ', ''],
        turns.map((t) => t.accepted),
      ),
      hint: 'Lis la réponse sous chaque question. Parle-t-elle de la maison ou de l’origine ?',
      steps: [
        ...turns.map((t, i) => `Lis la réponse sous la question (${i + 1}) : elle parle ${t.about}.`),
        'Commence chaque question par « Where », qui demande un lieu.',
        `Vérifie les deux questions : **${turns.map((t) => t.shown).join(' → ')}**`,
      ],
    };
  },
};

export const ENGLISH_PRESENTATION_CHAPTER: Chapter = {
  id: 'acm1-se-presenter',
  subject: 'anglais',
  grade: 'cm1',
  domain: 'langue',
  title: 'Se présenter et saluer',
  skills: [saluer, yourName, howOld, numbers, whereLive],
};
