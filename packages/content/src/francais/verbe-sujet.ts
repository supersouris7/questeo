import { choice, num, traps as numTraps } from '../build.ts';
import { r } from '../rational.ts';
import type { Rng } from '../rng.ts';
import type { Level, QuestionDraft, Sens, Skill, Trap } from '../types.ts';
import {
  AVANT_SUJET,
  AVANT_TYPES,
  GROUPES_SUJETS,
  NOMS_VERBES,
  PHRASES_DOUBLES,
  PHRASES_INFINITIF,
  PHRASES_NEGATIVES,
  PHRASES_SIMPLES,
  SENS_VS,
  SUJETS,
  SUJETS_ET_APRES_VERBE,
  SUJETS_PIEGES,
  TYPE_LABEL,
  VERBES_IRREGULIERS,
  VERBES_REGULIERS,
  faitVs,
  sentence,
  type GroupeSujet,
  type Mot,
  type NomVerbe,
  type Sujet,
  type TypeSujet,
} from './verbe-sujet.donnees.ts';
import { at, document, listes, lowerFirst, pickN, same, segments, textTrap } from './outils.ts';

/**
 * Chapitre « Le verbe et le sujet » (CM1). Programme de français du cycle 3 (BO du 17 avril 2025),
 * enseignement de la langue : « Analyser une phrase simple ».
 */
const PROGRAMME = 'francais-cycle3-2025';
const programme = (id: string) =>
  `Programme de français du cycle 3 (BO du 17 avril 2025), CM1 — « ${faitVs(id).citation} »`;

const NEGATION = ['ne', 'n’', 'pas', 'plus', 'jamais'];
const verbOf = (phrase: readonly Mot[]): Mot => {
  const v = phrase.find((m) => m.tag === 'v');
  if (!v) throw new Error('phrase sans verbe conjugué');
  return v;
};
const withDot = (phrase: readonly Mot[]) => `${sentence(phrase)}.`;

// ───────────────────────── 1. Trouver le verbe conjugué ─────────────────────────

/** Pourquoi ce mot n'est pas le verbe conjugué. */
function whyNotVerb(m: Mot): string {
  const t = m.text;
  if (NEGATION.includes(t.toLowerCase()))
    return `« ${t} » fait partie de la négation : il entoure le verbe, mais ce n’est pas le verbe.`;
  switch (m.tag) {
    case 'n':
      return `« ${t} » est un nom : il nomme une personne, un animal ou une chose. Le verbe dit ce qu’on fait.`;
    case 'd':
      return `« ${t} » est un déterminant : un petit mot qui accompagne un nom, il ne dit pas ce qu’on fait.`;
    case 'p':
      return `« ${t} » est un pronom : il dit qui fait l’action. Le verbe dit l’action.`;
    case 'i':
      return `« ${t} » est un verbe à l’infinitif : il ne change pas avec le sujet. Le verbe conjugué est l’autre verbe.`;
    default:
      return `« ${t} » ne dit pas ce que fait quelqu’un : ce n’est pas le verbe.`;
  }
}

/** Les mots qui ne sont pas le verbe, dans l'ordre de priorité des étiquettes, sans doublon. */
function otherWords(phrase: readonly Mot[], order: readonly string[]): Mot[] {
  const out: Mot[] = [];
  for (const tag of order)
    for (const m of phrase)
      if (
        m.tag === tag &&
        !out.some((o) => same(o.text, m.text)) &&
        !phrase.some((v) => v.tag === 'v' && same(v.text, m.text))
      )
        out.push(m);
  return out;
}

const textTraps = (words: readonly Mot[], n: number): Trap[] =>
  words.slice(0, n).map((m) => textTrap(m.text, whyNotVerb(m)));

/** Les écritures d'une réponse : telle quelle, sans accent circonflexe sur i ou u, sans aucun accent. */
const ecritures = (s: string): string[] => [
  ...new Set([s, s.replace(/î/g, 'i').replace(/û/g, 'u'), s.normalize('NFD').replace(/\p{M}/gu, '')]),
];

const stepsVerbe = (phrase: readonly Mot[], action: 'Choisis' | 'Écris') => [
  `Lis la phrase : « ${withDot(phrase)} »`,
  'Ajoute « hier » devant. Repère le mot qui change.',
  `${action} ce verbe : **${verbOf(phrase).text}**.`,
];

function verbeDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const phrase = rng.pick(PHRASES_SIMPLES);
      const verbe = verbOf(phrase);
      const noun = otherWords(phrase, ['n'])[0] ?? at(otherWords(phrase, ['p', 'd']), 0);
      const other = rng.pick(otherWords(phrase, ['d', 'p', 'a']).filter((m) => !same(m.text, noun.text)));
      const { answer, traps } = choice(
        rng,
        verbe.text,
        [noun, other].map((m) => ({ label: m.text, why: whyNotVerb(m) })),
      );
      return {
        prompt: `Choisis le verbe de cette phrase : « ${withDot(phrase)} »`,
        answer,
        traps,
        hint: 'Cherche le mot qui dit ce que fait quelqu’un.',
        steps: stepsVerbe(phrase, 'Choisis'),
      };
    }
    case 2: {
      const phrase = rng.pick(PHRASES_SIMPLES);
      const verbe = verbOf(phrase);
      const wrong = [...otherWords(phrase, ['n']).slice(0, 2), ...rng.shuffle(otherWords(phrase, ['d', 'p', 'a']))]
        .filter((m, i, all) => all.findIndex((x) => same(x.text, m.text)) === i)
        .slice(0, 3);
      const { answer, traps } = choice(
        rng,
        verbe.text,
        wrong.map((m) => ({ label: m.text, why: whyNotVerb(m) })),
      );
      return {
        prompt: `Choisis le verbe conjugué de cette phrase : « ${withDot(phrase)} »`,
        answer,
        traps,
        hint: 'Ajoute « hier » au début : un seul mot change.',
        steps: stepsVerbe(phrase, 'Choisis'),
      };
    }
    case 3: {
      const phrase = rng.pick(PHRASES_SIMPLES);
      const verbe = verbOf(phrase);
      return {
        prompt: `Écris le verbe conjugué de cette phrase : « ${withDot(phrase)} »`,
        answer: { kind: 'text', accepted: [verbe.text] },
        traps: textTraps(otherWords(phrase, ['n', 'p', 'd', 'a']), 2),
        hint: 'Cherche le mot qui change si tu commences par « hier ».',
        steps: stepsVerbe(phrase, 'Écris'),
      };
    }
    case 4: {
      const negative = rng.int(0, 1) === 1;
      const phrase = rng.pick(negative ? PHRASES_NEGATIVES : PHRASES_INFINITIF);
      const verbe = verbOf(phrase);
      const apres = phrase[phrase.indexOf(verbe) + 1]?.text ?? '';
      const avant = phrase[phrase.indexOf(verbe) - 1]?.text ?? '';
      const infinitif = phrase.find((m) => m.tag === 'i')?.text ?? '';
      return {
        prompt: `Attention, il y a un piège. Écris le verbe conjugué : « ${withDot(phrase)} »`,
        answer: { kind: 'text', accepted: [verbe.text] },
        traps: textTraps(otherWords(phrase, negative ? ['a', 'n', 'p'] : ['i', 'n', 'p']), 2),
        hint: negative
          ? 'Regarde les deux petits mots de la négation. Cherche entre eux.'
          : 'Il y a deux verbes. Cherche celui qui change avec « hier ».',
        steps: negative
          ? [
              `Repère « ${avant} » : le verbe vient juste après.`,
              `Repère « ${apres} » : le verbe est juste avant.`,
              `Écris le mot placé entre les deux : **${verbe.text}**.`,
            ]
          : [
              'Ajoute « hier » devant la phrase. Observe les deux verbes.',
              `Écarte « ${infinitif} » : il ne change pas.`,
              `Écris le verbe conjugué : **${verbe.text}**.`,
            ],
      };
    }
    default: {
      // Toujours un infinitif à écarter ; de zéro à deux phrases à deux verbes.
      const doubles = rng.int(0, 2);
      const avecInfinitif = rng.pick(PHRASES_INFINITIF);
      const lines = rng.shuffle([
        avecInfinitif,
        ...pickN(rng, PHRASES_DOUBLES, doubles),
        ...pickN(rng, [...PHRASES_SIMPLES, ...PHRASES_NEGATIVES], 3 - doubles),
      ]);
      const count = (tag: Mot['tag']) => lines.reduce((n, l) => n + l.filter((m) => m.tag === tag).length, 0);
      const k = count('v');
      const infinitif = avecInfinitif.find((m) => m.tag === 'i')?.text ?? '';
      return {
        prompt: 'Lis ce texte. Compte tous les verbes conjugués.',
        figure: document('Quelques phrases', lines.map(withDot)),
        answer: num(k),
        traps: numTraps(r(k), [
          [k + count('i'), 'Tu as compté aussi le verbe à l’infinitif. Seuls les verbes conjugués comptent.'],
          [lines.length, 'Tu as compté une phrase = un verbe. Certaines phrases ont deux verbes conjugués.'],
          [k - 1, 'Il t’en manque un : relis chaque ligne et ajoute « hier » devant.'],
        ]),
        hint: 'Compte ligne par ligne. Une ligne peut avoir deux verbes conjugués.',
        steps: [
          'Lis chaque ligne en ajoutant « hier » devant.',
          'Repère chaque mot qui change : c’est un verbe conjugué.',
          `Écarte « ${infinitif} » : cet infinitif ne change pas.`,
          `Compte les verbes conjugués : **${k}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 2. Trouver l'infinitif ─────────────────────────

const lastWord = (form: string) => at(form.split(' '), form.split(' ').length - 1);
const ending = (inf: string) => (inf.endsWith('er') ? '-er' : '-ir');

/** Le participe passé d'un verbe régulier (chanté, fini) : l'erreur la plus courante. */
const participe = (inf: string) => inf.slice(0, -2) + (inf.endsWith('er') ? 'é' : 'i');

const whyBare = (bare: string) =>
  `« ${bare} » est le verbe conjugué, comme dans la phrase. L’infinitif ne change jamais avec le sujet.`;
const whyOtherVerb = (other: string, form: string) => `« ${other} » est un autre verbe : « ${form} » n’en vient pas.`;

const stepsInf = (form: string, inf: string, action: 'Choisis' | 'Écris') => [
  `Lis le verbe : « ${form} ».`,
  `Pose « il faut » devant : « il faut ${inf} ».`,
  `${action} l’infinitif : **${inf}**.`,
];

function infinitifDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const v = rng.pick(VERBES_REGULIERS);
      const form = rng.pick(v.formes);
      const others = pickN(
        rng,
        VERBES_REGULIERS.filter((o) => o.inf !== v.inf),
        2,
      );
      const { answer, traps } = choice(
        rng,
        v.inf,
        others.map((o) => ({ label: o.inf, why: whyOtherVerb(o.inf, form) })),
      );
      return {
        prompt: `Choisis l’infinitif du verbe dans « ${form} ».`,
        answer,
        traps,
        hint: 'Cherche le verbe qui ressemble à celui que tu lis.',
        steps: stepsInf(form, v.inf, 'Choisis'),
      };
    }
    case 2: {
      const v = rng.pick(VERBES_REGULIERS);
      const form = rng.pick(v.formes);
      const bare = lastWord(form);
      const others = pickN(
        rng,
        VERBES_REGULIERS.filter((o) => o.inf !== v.inf),
        2,
      );
      const { answer, traps } = choice(rng, v.inf, [
        { label: bare, why: whyBare(bare) },
        ...others.map((o) => ({ label: o.inf, why: whyOtherVerb(o.inf, form) })),
      ]);
      return {
        prompt: `Retrouve l’infinitif du verbe dans « ${form} ».`,
        answer,
        traps,
        hint: 'Essaie « il faut » devant chaque proposition. Attention au verbe conjugué.',
        steps: stepsInf(form, v.inf, 'Choisis'),
      };
    }
    case 3: {
      const v = rng.pick(VERBES_REGULIERS);
      const form = rng.pick(v.formes);
      const bare = lastWord(form);
      return {
        prompt: `Écris l’infinitif de « ${form} ».`,
        answer: { kind: 'text', accepted: ecritures(v.inf) },
        traps: [
          textTrap(bare, whyBare(bare)),
          textTrap(
            participe(v.inf),
            `« ${participe(v.inf)} » ressemble à l’infinitif, mais ce n’est pas lui : l’infinitif de ce verbe se termine par ${ending(v.inf)}.`,
          ),
        ],
        hint: 'Pense à « il faut » : le verbe finit par -er ou -ir.',
        steps: stepsInf(form, v.inf, 'Écris'),
      };
    }
    case 4: {
      const v = rng.pick(VERBES_IRREGULIERS);
      const form = rng.pick(v.formes);
      const bare = lastWord(form);
      const other = rng.pick(VERBES_IRREGULIERS.filter((o) => o.inf !== v.inf));
      return {
        prompt: `Ce verbe change beaucoup. Écris l’infinitif de « ${form} ».`,
        answer: { kind: 'text', accepted: ecritures(v.inf) },
        traps: [textTrap(bare, whyBare(bare)), textTrap(other.inf, whyOtherVerb(other.inf, form))],
        hint: 'Pense à « il faut » : quel verbe viendrait juste après ?',
        steps: stepsInf(form, v.inf, 'Écris'),
      };
    }
    default: {
      const phrase = rng.pick([...PHRASES_SIMPLES, ...PHRASES_NEGATIVES, ...PHRASES_INFINITIF]);
      const verbe = verbOf(phrase);
      const inf = verbe.inf ?? '';
      const autre = phrase.find((m) => m.tag === 'i') ?? at(otherWords(phrase, ['n', 'p', 'd', 'a']), 0);
      return {
        prompt: `Trouve le verbe conjugué, puis écris son infinitif : « ${withDot(phrase)} »`,
        answer: { kind: 'text', accepted: ecritures(inf) },
        traps: [
          textTrap(
            verbe.text,
            `« ${verbe.text} » est le verbe conjugué, tel qu’il est écrit dans la phrase. On demande son infinitif.`,
          ),
          textTrap(
            autre.text,
            autre.tag === 'i'
              ? `« ${autre.text} » est l’infinitif de l’autre verbe. Cherche d’abord le verbe qui change.`
              : whyNotVerb(autre),
          ),
        ],
        hint: 'Trouve le mot qui change avec « hier ». Pense ensuite à « il faut ».',
        steps: [
          `Ajoute « hier » devant. Repère le mot qui change : « ${verbe.text} ».`,
          `Pose « il faut » devant : « il faut ${inf} ».`,
          `Écris l’infinitif : **${inf}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 3. Trouver le groupe sujet ─────────────────────────

/** « Qui est-ce qui » appelle un verbe à la 3e personne du singulier : « qui est-ce qui habite… ? ». */
const SINGULIER: Record<string, string> = {
  mangeons: 'mange',
  cours: 'court',
  lis: 'lit',
  partez: 'part',
  partent: 'part',
  dorment: 'dort',
};
const quiReste = (reste: string): string => {
  const [mot = '', ...suite] = reste.split(' ');
  const sing = SINGULIER[mot] ?? (mot.endsWith('ent') ? mot.slice(0, -2) : mot);
  return [sing, ...suite].join(' ');
};

const phraseGs = (g: GroupeSujet, pre?: string) =>
  pre ? `${pre} ${lowerFirst(g.gs)} ${g.reste}.` : `${g.gs} ${g.reste}.`;

/** Les bulles communes : le verbe, la question, la réponse ; un groupe qui dit quand est d'abord effacé. */
const stepsGs = (g: GroupeSujet, action: 'Choisis' | 'Écris', pre?: string) => [
  pre ? `Efface « ${pre.slice(0, -1)} » : ce groupe dit quand.` : `Trouve le verbe : « ${g.verbe} ».`,
  `Pose la question : « Qui est-ce qui ${quiReste(g.reste)} ? »`,
  `${action} tous les mots de la réponse : **${g.gs}**.`,
];

/** Le groupe sujet, avec ou sans accents (la notion ne porte pas sur eux). */
const sujetAccepte = (g: GroupeSujet) => ecritures(g.gs);

const whyNoyau = (g: GroupeSujet) =>
  `« ${g.noyau} » est seulement le nom principal. Le groupe sujet comprend aussi les mots qui l’accompagnent.`;
const whyReste = (g: GroupeSujet) =>
  `« ${g.reste} » commence par le verbe : c’est ce qu’on dit du sujet, pas le sujet.`;
const whyAvecVerbe = (g: GroupeSujet) =>
  `Le groupe sujet s’arrête avant le verbe : « ${g.verbe} » n’en fait pas partie.`;

function sujetDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const g = rng.pick(GROUPES_SUJETS);
      const { answer, traps } = choice(rng, g.gs, [
        { label: g.reste, why: whyReste(g) },
        { label: g.verbe, why: `« ${g.verbe} » est le verbe, pas le sujet. Le sujet dit qui fait l’action.` },
      ]);
      return {
        prompt: `Choisis le groupe sujet de cette phrase : « ${phraseGs(g)} »`,
        answer,
        traps,
        hint: 'Demande-toi qui fait l’action.',
        steps: stepsGs(g, 'Choisis'),
      };
    }
    case 2: {
      const g = rng.pick(GROUPES_SUJETS);
      const { answer, traps } = choice(rng, g.gs, [
        { label: g.noyau, why: whyNoyau(g) },
        { label: `${g.gs} ${g.verbe}`, why: whyAvecVerbe(g) },
        { label: g.reste, why: whyReste(g) },
      ]);
      return {
        prompt: `Repère le groupe sujet complet : « ${phraseGs(g)} »`,
        answer,
        traps,
        hint: 'Garde tous les mots du sujet. Laisse le verbe de côté.',
        steps: stepsGs(g, 'Choisis'),
      };
    }
    case 3: {
      const g = rng.pick(GROUPES_SUJETS);
      return {
        prompt: `Écris le groupe sujet de cette phrase : « ${phraseGs(g)} »`,
        answer: { kind: 'text', accepted: sujetAccepte(g) },
        traps: [
          textTrap(g.noyau, whyNoyau(g)),
          textTrap(`${g.gs} ${g.verbe}`, whyAvecVerbe(g)),
          textTrap(g.reste, whyReste(g)),
        ],
        hint: 'Pose « Qui est-ce qui » devant le verbe.',
        steps: stepsGs(g, 'Écris'),
      };
    }
    case 4: {
      const g = rng.pick(GROUPES_SUJETS);
      const pre = rng.pick(AVANT_SUJET);
      const preSansVirgule = pre.slice(0, -1);
      return {
        prompt: `Écris le groupe sujet. Attention au début ! « ${phraseGs(g, pre)} »`,
        answer: { kind: 'text', accepted: sujetAccepte(g) },
        traps: [
          textTrap(
            preSansVirgule,
            `« ${preSansVirgule} » dit quand. On peut le supprimer : « ${phraseGs(g)} » reste une phrase complète. Ce n’est pas le sujet.`,
          ),
          textTrap(g.noyau, whyNoyau(g)),
        ],
        hint: 'Supprime le groupe qui dit quand. Regarde ce qui reste.',
        steps: stepsGs(g, 'Écris', pre),
      };
    }
    default: {
      const gs = pickN(rng, GROUPES_SUJETS, 3);
      const t = rng.int(0, 2);
      // La ligne demandée commence toujours par un groupe qui dit quand.
      const pre = rng.pick(AVANT_SUJET);
      const pres = gs.map((_, i) => (i === t ? pre : rng.int(0, 1) === 0 ? undefined : rng.pick(AVANT_SUJET)));
      const g = at(gs, t);
      const autre = at(gs, (t + 1 + rng.int(0, 1)) % 3);
      return {
        prompt: `Lis ce texte. Écris le groupe sujet de la ligne ${t + 1}.`,
        figure: document(
          'Un petit texte',
          gs.map((x, i) => phraseGs(x, pres[i])),
        ),
        answer: { kind: 'text', accepted: sujetAccepte(g) },
        traps: [
          textTrap(g.noyau, whyNoyau(g)),
          textTrap(pre.slice(0, -1), `« ${pre.slice(0, -1)} » dit quand : ce n’est pas le sujet.`),
          textTrap(autre.gs, 'C’est le sujet d’une autre ligne. Relis bien la ligne demandée.'),
        ],
        hint: 'Lis seulement la bonne ligne. Cherche qui fait l’action.',
        steps: [`Lis seulement la ligne ${t + 1}.`, ...stepsGs(g, 'Écris', pre)],
      };
    }
  }
}

// ───────────────────────── 4. Pronom, groupe nominal ou plusieurs noms ─────────────────────────

const OPTION_LABEL: Record<TypeSujet, string> = {
  pronom: 'un pronom personnel (il, elle, nous…)',
  gn: 'un groupe nominal (un nom avec son déterminant)',
  noms: 'plusieurs noms (reliés par « et » ou une virgule)',
};
const TYPES: readonly TypeSujet[] = ['pronom', 'gn', 'noms'];

/** Pourquoi le sujet n'est pas de ce type (faux) alors qu'il est de l'autre (vrai). */
const WHY_TYPE: Record<TypeSujet, Record<TypeSujet, string>> = {
  pronom: {
    pronom: '',
    gn: 'Il n’y a aucun nom dans le sujet : c’est un seul petit mot, un pronom.',
    noms: 'Il n’y a aucun nom dans le sujet : c’est un seul petit mot, un pronom.',
  },
  gn: {
    pronom: 'Le sujet n’est pas un petit mot comme il, elle, nous : il contient un nom.',
    gn: '',
    noms: 'Il n’y a qu’un seul nom, avec son déterminant : c’est un groupe nominal.',
  },
  noms: {
    pronom: 'Le sujet n’est pas un petit mot comme il, elle, nous : il contient des noms.',
    gn: 'Il y a plusieurs noms reliés par « et » (ou une virgule), pas un seul.',
    noms: '',
  },
};
/** « est un pronom personnel », « est formé de plusieurs noms »… */
const EST_UN: Record<TypeSujet, string> = {
  pronom: 'un pronom personnel',
  gn: 'un groupe nominal',
  noms: 'formé de plusieurs noms',
};
const whyType = (s: Sujet, wrong: TypeSujet) =>
  `Le sujet « ${s.s} » n’est pas ${EST_UN[wrong]}. ${WHY_TYPE[s.type][wrong]}`;
const phraseS = (s: Sujet, pre?: string) => (pre ? `${pre} ${lowerFirst(s.s)} ${s.reste}.` : `${s.s} ${s.reste}.`);
const byType = (type: TypeSujet) => SUJETS.filter((s) => s.type === type);

/** La bulle qui fait regarder les noms du sujet. */
const observeType = (s: Sujet): string => {
  if (s.type === 'pronom') return `Cherche un nom dans « ${s.s} » : aucun.`;
  if (s.type === 'noms') return `Compte les noms de « ${s.s} » : plusieurs.`;
  return `Compte les noms de « ${s.s} » : un seul.`;
};

const stepsType = (s: Sujet) => [
  `Pose la question : « Qui est-ce qui ${quiReste(s.reste)} ? »`,
  `Repère le sujet : « ${s.s} ».`,
  observeType(s),
  `Choisis la réponse : **${TYPE_LABEL[s.type]}**.`,
];

/** Texte à trous des niveaux 3 et 4 : une liste des trois types par phrase, sans leur définition. */
function trousTypes(rng: Rng, avecQuand: boolean): QuestionDraft {
  const sujets = pickN(rng, SUJETS, 3);
  const quand = rng.shuffle(AVANT_TYPES);
  const pres = sujets.map((_, i) => (avecQuand ? at(quand, i) : undefined));
  const reponses = sujets.map((s) => TYPE_LABEL[s.type]);
  return {
    prompt: `${avecQuand ? 'Attention au début ! ' : 'Lis ce texte. '}Choisis le type du sujet de chaque phrase.`,
    figure: document(
      'Trois phrases',
      sujets.map((s, i) => phraseS(s, pres[i])),
    ),
    answer: {
      kind: 'cloze',
      parts: segments(sujets.map((_, i) => `Phrase ${i + 1} : `)),
      blanks: listes(Object.values(TYPE_LABEL), reponses),
    },
    hint: avecQuand
      ? 'Efface le groupe qui dit quand. Cherche ensuite qui fait l’action.'
      : 'Cherche chaque sujet avec « Qui est-ce qui ». Compte ensuite ses noms.',
    steps: [
      ...sujets.map((s, i) => {
        const pre = pres[i];
        const efface = pre ? `efface « ${pre.slice(0, -1)} ». ` : '';
        return `Phrase ${i + 1} : ${efface}${observeType(s)}`;
      }),
      `Choisis dans l’ordre : **${reponses.join(' ; ')}**.`,
    ],
  };
}

function typesSujetsDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const s = rng.pick(SUJETS);
      const { answer, traps } = choice(
        rng,
        OPTION_LABEL[s.type],
        TYPES.filter((t) => t !== s.type).map((t) => ({ label: OPTION_LABEL[t], why: whyType(s, t) })),
      );
      return {
        prompt: `Dans « ${phraseS(s)} », le sujet est « ${s.s} ». Choisis son type.`,
        answer,
        traps,
        hint: 'Cherche s’il y a un nom, et combien.',
        steps: stepsType(s),
      };
    }
    case 2: {
      const target = rng.pick(TYPES);
      const good = rng.pick(byType(target));
      const wrong = pickN(
        rng,
        SUJETS.filter((s) => s.type !== target),
        3,
      );
      const options = rng.shuffle([good, ...wrong]);
      return {
        prompt: `Choisis la phrase où le sujet est ${EST_UN[target]}.`,
        answer: { kind: 'choice', options: options.map((s) => phraseS(s)), correct: options.indexOf(good) },
        traps: options.flatMap((s, i) =>
          s === good
            ? []
            : [
                {
                  option: i,
                  why: `Dans cette phrase, le sujet « ${s.s} » est ${EST_UN[s.type]}, pas ${EST_UN[target]}.`,
                },
              ],
        ),
        hint: 'Trouve le sujet de chaque phrase. Compte ensuite ses noms.',
        steps: [
          'Cherche le sujet de chaque phrase avec « Qui est-ce qui ».',
          observeType(good),
          `Choisis cette phrase : **${phraseS(good)}**`,
        ],
      };
    }
    case 3:
      return trousTypes(rng, false);
    case 4:
      // Seule nouveauté du niveau : le groupe qui dit quand. Les phrases à piège arrivent au niveau 5.
      return trousTypes(rng, true);
    default: {
      const k = rng.int(1, 3);
      const piege = rng.pick(SUJETS_PIEGES);
      const piegeEt = rng.pick(SUJETS_ET_APRES_VERBE);
      const rest = pickN(
        rng,
        SUJETS.filter((s) => s.type !== 'noms' && s.s !== piegeEt.s),
        3 - k,
      );
      const noms = pickN(rng, byType('noms'), k);
      const lines = rng.shuffle<Sujet>([...noms, piege, piegeEt, ...rest]);
      const p = lines.filter((s) => s.type === 'pronom').length;
      const g = lines.filter((s) => s.type === 'gn').length;
      const comptes = lines.filter((s) => s.type === 'noms').map((s) => `« ${s.s} »`);
      return {
        prompt: 'Lis ce texte. Dans combien de phrases le sujet est-il formé de plusieurs noms ?',
        figure: document(
          'Quelques phrases',
          lines.map((s) => phraseS(s)),
        ),
        answer: num(k),
        traps: numTraps(r(k), [
          // En premier (un de trop, un oublié) : à valeur égale, seule la première explication est gardée.
          [
            k + 1,
            `Tu en as compté un de trop. Dans « ${piege.s} », ${piege.piege ?? ''} Dans « ${piegeEt.s} ${piegeEt.reste} », « et » n’est pas dans le sujet.`,
          ],
          [k - 1, `Tu en as oublié un. Relis chaque sujet, comme « ${at(noms, 0).s} » : il a plusieurs noms.`],
          [g, 'Tu as compté les groupes nominaux : ils n’ont qu’un seul nom noyau.'],
          ...(p > 0
            ? [[p, 'Tu as compté les pronoms : un pronom remplace un nom, ce n’est pas « plusieurs noms ».'] as const]
            : []),
        ]),
        hint: 'Trouve d’abord chaque sujet. Compte les noms du sujet seulement.',
        steps: [
          'Trouve le sujet de chaque ligne avec « Qui est-ce qui ».',
          'Écarte les « et » placés après le verbe.',
          `Garde les sujets à plusieurs noms : ${comptes.join(' ; ')}.`,
          `Compte les sujets gardés : **${k}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 5. Nom ou verbe ─────────────────────────

const words = (text: string): string[] => text.replace(/\.$/, '').split(' ');
const nSg = (e: NomVerbe) => `${e.det} ${e.mot}`;
const nPl = (e: NomVerbe) => `des ${e.mot}s`;
const vSg = (e: NomVerbe) => `${e.sujet} ${e.mot}`;
const vPl = (e: NomVerbe) => `${e.sujet}s ${e.mot}nt`;

const NATURES = ['un nom', 'un verbe', 'un adjectif'] as const;

/** Le mot placé juste avant le mot étudié : un déterminant (nom) ou un pronom (verbe). */
const motAvant = (e: NomVerbe, text: string) => {
  const ws = words(text);
  return at(ws, ws.findIndex((w) => same(w, e.mot)) - 1);
};

/** Les bulles pour trouver le verbe d'une phrase où le mot étudié est un nom ou un verbe. */
const stepsTrouver = (e: NomVerbe, isVerb: boolean, action: 'Choisis' | 'Écris') => {
  const text = isVerb ? e.verbe : e.nom;
  const verb = isVerb ? e.mot : e.verbeDuNom;
  const regarde = `Regarde le mot avant « ${e.mot} » : « ${motAvant(e, text)} ».`;
  return isVerb
    ? [regarde, `Mets le sujet au pluriel : « ${vPl(e)} ». Le mot change.`, `${action} le verbe : **${verb}**.`]
    : [
        regarde,
        `Écarte « ${e.mot} » : ici, c’est un nom.`,
        'Ajoute « hier » devant la phrase. Repère le mot qui change.',
        `${action} le verbe : **${verb}**.`,
      ];
};

function nomVerbeDraft(rng: Rng, level: Level): QuestionDraft {
  const e = rng.pick(NOMS_VERBES);
  const isVerb = rng.int(0, 1) === 1;
  const text = isVerb ? e.verbe : e.nom;
  switch (level) {
    case 1: {
      const correct = isVerb ? 'un verbe' : 'un nom';
      const why: Record<(typeof NATURES)[number], string> = {
        'un nom': `Ici, « ${e.mot} » dit ce que fait quelqu’un et change avec le sujet (${vSg(e)}, ${vPl(e)}) : c’est un verbe.`,
        'un verbe': `Ici, on peut dire « ${nSg(e)} » et « ${nPl(e)} » : c’est un nom. Il ne change pas avec un sujet.`,
        'un adjectif': `Un adjectif décrit un nom (un chat noir). Ici, « ${e.mot} » ne décrit aucun nom.`,
      };
      return {
        prompt: `Choisis la nature du mot « ${e.mot} » dans « ${text} »`,
        answer: { kind: 'choice', options: NATURES, correct: NATURES.indexOf(correct) },
        traps: NATURES.flatMap((n, option) => (n === correct ? [] : [{ option, why: why[n] }])),
        hint: 'Regarde le mot juste avant. Que t’apprend-il ?',
        steps: isVerb
          ? [
              `Regarde le mot avant « ${e.mot} » : « ${motAvant(e, text)} ».`,
              `Mets le sujet au pluriel : « ${vPl(e)} ». Le mot change.`,
              `Choisis la réponse : « ${e.mot} » est **un verbe**.`,
            ]
          : [
              `Regarde le mot avant « ${e.mot} » : « ${motAvant(e, text)} ».`,
              `Mets au pluriel : « ${nPl(e)} ». C’est le pluriel d’un nom.`,
              `Choisis la réponse : « ${e.mot} » est **un nom**.`,
            ],
      };
    }
    case 2: {
      const verb = isVerb ? e.mot : e.verbeDuNom;
      const others = words(text).filter((w) => !same(w, verb));
      const noun = !isVerb ? others.filter((w) => same(w, e.mot)) : [];
      const wrong = [...noun, ...rng.shuffle(others.filter((w) => !noun.includes(w)))].slice(0, 3);
      const { answer, traps } = choice(
        rng,
        verb,
        wrong.map((w) => ({
          label: w,
          why: same(w, e.mot)
            ? `Ici, « ${e.mot} » est un nom : on peut dire « ${nSg(e)} », « ${nPl(e)} ». Le verbe est un autre mot.`
            : `« ${w} » ne change pas si tu ajoutes « hier » : ce n’est pas le verbe.`,
        })),
      );
      return {
        prompt: `Choisis le verbe de cette phrase : « ${text} »`,
        answer,
        traps,
        hint: 'Attention : un nom peut ressembler à un verbe.',
        steps: stepsTrouver(e, isVerb, 'Choisis'),
      };
    }
    case 3: {
      const sg = isVerb ? vSg(e) : nSg(e);
      const pl = isVerb ? vPl(e) : nPl(e);
      return {
        prompt: `Mets au pluriel : « ${sg} ».`,
        answer: { kind: 'text', accepted: ecritures(pl) },
        traps: isVerb
          ? [
              textTrap(
                `${e.sujet}s ${e.mot}`,
                'Avec « ils » ou « elles », le verbe prend la terminaison -nt : il faut le changer.',
              ),
              textTrap(
                `${e.sujet}s ${e.mot}s`,
                'Le -s est la marque du pluriel des noms. Un verbe écrit avec « ils » ou « elles » finit par -nt.',
              ),
            ]
          : [
              textTrap(`des ${e.mot}`, 'Un nom prend un -s au pluriel : des ' + e.mot + 's.'),
              textTrap(`des ${e.mot}nt`, 'La terminaison -nt est celle des verbes. Un nom prend un -s au pluriel.'),
            ],
        hint: 'Regarde le premier mot : annonce-t-il un nom ou un verbe ?',
        steps: isVerb
          ? [
              `Repère « ${e.sujet} » : ici, « ${e.mot} » est un verbe.`,
              `Remplace « ${e.sujet} » par « ${e.sujet}s ». Ajoute -nt au verbe.`,
              `Écris au pluriel : **${pl}**.`,
            ]
          : [
              `Repère « ${e.det} » : ici, « ${e.mot} » est un nom.`,
              `Remplace « ${e.det} » par « des ». Ajoute -s au nom.`,
              `Écris au pluriel : **${pl}**.`,
            ],
      };
    }
    case 4: {
      const verb = isVerb ? e.mot : e.verbeDuNom;
      const ws = words(text);
      const sujet = at(ws, 0);
      const autres = ws.filter((w) => !same(w, verb) && !same(w, e.mot));
      const last = at(autres, autres.length - 1);
      // Vrai pour tout mot qui n'est pas le verbe, y compris un adjectif (il s'accorde, lui, avec le sujet).
      const whyLast = `« ${last} » ne change pas si tu ajoutes « hier » : ce n’est pas le verbe.`;
      return {
        prompt: `Écris le verbe conjugué de cette phrase : « ${text} »`,
        answer: { kind: 'text', accepted: ecritures(verb) },
        traps: isVerb
          ? [
              textTrap(
                sujet,
                `« ${sujet} » est le pronom sujet : il dit qui fait l’action, mais ce n’est pas le verbe.`,
              ),
              textTrap(last, whyLast),
            ]
          : [
              textTrap(
                e.mot,
                `Ici, « ${e.mot} » est un nom : on peut dire « ${nSg(e)} », « ${nPl(e)} ». Ce n’est pas le verbe.`,
              ),
              textTrap(last, whyLast),
            ],
        hint: 'Ajoute « hier » devant : un seul mot change.',
        steps: stepsTrouver(e, isVerb, 'Écris'),
      };
    }
    default: {
      const k = rng.int(1, 3);
      const entries = pickN(rng, NOMS_VERBES, 4);
      const flags = rng.shuffle([0, 1, 2, 3].map((i) => i < k));
      const lines = entries.map((x, i) => `${flags[i] ? x.verbe : x.nom} (mot à étudier : ${x.mot})`);
      return {
        prompt: 'Lis ce texte. Dans combien de phrases le mot à étudier est-il un verbe ?',
        figure: document('Quelques phrases', lines),
        answer: num(k),
        traps: numTraps(r(k), [
          [4 - k, 'Tu as compté les noms au lieu des verbes.'],
          [k + 1, 'Tu en as compté un de trop : regarde le mot placé avant chaque mot à étudier.'],
          [k - 1, 'Il t’en manque un : un mot qui change avec le sujet est un verbe, même s’il ressemble à un nom.'],
        ]),
        hint: 'Regarde le mot juste avant. Est-ce un déterminant ou un pronom ?',
        steps: [
          'Lis chaque ligne. Regarde le mot avant le mot à étudier.',
          'Garde les lignes où « il » ou « elle » le précède.',
          `Compte les lignes gardées : **${k}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── Notions du chapitre ─────────────────────────

interface Notion {
  readonly id: string;
  readonly title: string;
  readonly memo: readonly string[];
  readonly factId: string;
  readonly sens: Sens;
  readonly generate: Skill['generate'];
}

const skill = (n: Notion): Skill => ({
  id: n.id,
  title: n.title,
  levels: 5,
  version: 2,
  sens: [n.sens],
  lesson: { memo: n.memo, source: programme(n.factId), sources: [PROGRAMME] },
  generate: n.generate,
});

export const FCM1_VERBE_SUJET: readonly Skill[] = [
  skill({
    id: 'fcm1-verbe-conjugue',
    title: 'Trouver le verbe conjugué',
    memo: [
      'Le **verbe conjugué** change avec le sujet et le temps.',
      'Ajoute « hier » : « je chante » devient « hier, je chantais ».',
      'Un verbe à l’**infinitif**, comme « chanter », ne change pas.',
    ],
    factId: 'verbe-conjugue',
    sens: SENS_VS.verbe,
    generate: verbeDraft,
  }),
  skill({
    id: 'fcm1-infinitif',
    title: 'Trouver l’infinitif',
    memo: [
      'L’**infinitif** est la forme du verbe qui ne change pas avec le sujet.',
      'Pose « il faut » devant : « nous chantons » donne « il faut chanter ».',
    ],
    factId: 'infinitif',
    sens: SENS_VS.infinitif,
    generate: infinitifDraft,
  }),
  skill({
    id: 'fcm1-groupe-sujet',
    title: 'Trouver le groupe sujet',
    memo: [
      'Le **groupe sujet** dit qui fait l’action.',
      'Pose « Qui est-ce qui » devant le verbe.',
      'Garde tous les mots : « le petit chat », pas seulement le **nom noyau** « chat ».',
    ],
    factId: 'groupe-sujet',
    sens: SENS_VS.groupeSujet,
    generate: sujetDraft,
  }),
  skill({
    id: 'fcm1-types-sujets',
    title: 'Sujet pronom, groupe nominal ou plusieurs noms',
    memo: [
      'Un **pronom personnel sujet** est un petit mot sujet : « elle chante ».',
      'Un **groupe nominal** a un nom noyau : « le petit chat dort ».',
      'Le sujet peut réunir plusieurs noms : « mon père et ma mère cuisinent ».',
    ],
    factId: 'types-sujets',
    sens: SENS_VS.typesSujets,
    generate: typesSujetsDraft,
  }),
  skill({
    id: 'fcm1-nom-ou-verbe',
    title: 'Nom ou verbe : une élève, il élève',
    memo: [
      'Dans « une élève », le mot « élève » est un **nom**.',
      'Dans « il élève des lapins », c’est un **verbe**.',
      'Au pluriel, compare : « des élèves », mais « ils élèvent ».',
    ],
    factId: 'variations',
    sens: SENS_VS.nomVerbe,
    generate: nomVerbeDraft,
  }),
];
