import { choice, num, traps as numTraps } from '../build.ts';
import { r } from '../rational.ts';
import type { Rng } from '../rng.ts';
import type { Level, QuestionDraft, Sens, Skill, Trap } from '../types.ts';
import {
  A_COMPLETER,
  DECLARATIVES,
  EXCLAMATIVES,
  EXCLAMATIVES_A_RANGER,
  FAUSSES_AMIES_QUESTIONS,
  FAUSSES_AMIES_RAISONS,
  IMPERATIVES,
  INFORMATIONS,
  INTENTIONS,
  INTERROGATIVES,
  MESSAGES,
  NEGATIONS,
  OUBLIS,
  QUESTIONS,
  QUESTIONS_LUES,
  SENS,
  TRIPLETS,
  fait,
  type Tournure1,
} from './phrases.donnees.ts';

/**
 * Chapitre « Types et formes de phrases » (CM1). Programme de français du cycle 3 (BO du 17 avril 2025),
 * enseignement de la langue : « Connaître les trois types de phrases et leurs formes ».
 */
const PROGRAMME = 'francais-cycle3-2025';
const programme = (id: string) =>
  `Programme de français du cycle 3 (BO du 17 avril 2025), CM1 — « ${fait(id).citation} »`;

type TypeId = 'declarative' | 'interrogative' | 'imperative';
const TYPES: readonly TypeId[] = ['declarative', 'interrogative', 'imperative'];
const LABEL: Record<TypeId, string> = {
  declarative: 'phrase déclarative',
  interrogative: 'phrase interrogative',
  imperative: 'phrase impérative',
};
const REASON: Record<TypeId, string> = {
  declarative: 'elle donne une information',
  interrogative: 'elle pose une question',
  imperative: 'elle donne un ordre ou un conseil',
};
/** Ce qu’on observe pour reconnaître chaque type. */
const CLUE: Record<TypeId, string> = {
  declarative: 'Elle ne demande rien et n’ordonne rien.',
  interrogative: 'Elle finit par un point d’interrogation « ? ».',
  imperative: 'Le verbe est au début, sans sujet.',
};
/** Adjectifs acceptés pour chaque type (« phrase … »), avec ou sans accents ; le premier est affiché. */
const FEMININS: Record<TypeId, readonly [string, ...string[]]> = {
  declarative: ['déclarative', 'declarative'],
  interrogative: ['interrogative'],
  imperative: ['impérative', 'imperative', 'injonctive'],
};
/** Les mêmes au masculin (« type … »). */
const MASCULINS: Record<TypeId, readonly string[]> = {
  declarative: ['déclaratif', 'declaratif'],
  interrogative: ['interrogatif'],
  imperative: ['impératif', 'imperatif', 'injonctif'],
};
/** Toutes les écritures d’un type : l’adjectif seul, ou dans « une phrase … », « type … ». */
const typeAnswers = (type: TypeId): string[] => [
  ...FEMININS[type].flatMap((n) => [n, `phrase ${n}`, `une phrase ${n}`, `la phrase ${n}`]),
  ...MASCULINS[type].flatMap((n) =>
    ['', 'type ', 'de type ', 'phrase de type ', 'une phrase de type ', 'la phrase de type '].map((s) => `${s}${n}`),
  ),
];

/** Signe de fin de chaque type, avec l'espace avant « ? » et « ! ». */
const SIGN = { declarative: '.', interrogative: ' ?', imperative: '.', exclamative: ' !' } as const;
const withSign = (text: string, kind: keyof typeof SIGN) => `${text}${SIGN[kind]}`;

const sansAccents = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '');

/** Toutes les écritures d’un texte, chaque accent pouvant être omis séparément (la première est intacte). */
const accentsFacultatifs = (text: string): string[] =>
  Array.from(text).reduce<string[]>(
    (starts, c) => {
      const forms = [...new Set([c, sansAccents(c)])];
      return starts.flatMap((start) => forms.map((f) => `${start}${f}`));
    },
    [''],
  );

/** Écritures d'une phrase : avec le signe collé ou espacé, ou sans signe ; aucun accent n’est exigé. */
const variants = (text: string, signs: readonly string[]): string[] => [
  ...new Set(accentsFacultatifs(text).flatMap((t) => [...signs.map((s) => `${t}${s}`), t])),
];

/** Élément d'une liste à un indice valide (échec franc sinon). */
function at<T>(items: readonly T[], i: number): T {
  const v = items[i];
  if (v === undefined) throw new RangeError(`indice hors liste : ${i}`);
  return v;
}
const first = <T>(items: readonly T[]): T => at(items, 0);
const capital = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

const pickN = <T>(rng: Rng, items: readonly T[], n: number): T[] => rng.shuffle(items).slice(0, n);

/** Permutation de 0..n-1 qui n'est pas l'identité (les colonnes ne sont jamais déjà en face). */
function shuffledIndices(rng: Rng, n: number): number[] {
  const id = Array.from({ length: n }, (_, i) => i);
  let p = rng.shuffle(id);
  while (p.every((v, i) => v === i)) p = rng.shuffle(id);
  return p;
}

const document = (title: string, lines: readonly string[]) => ({ kind: 'document' as const, title, lines });
const textTrap = (text: string, why: string): Trap => ({ text, why });
/** Le même piège sous toutes ses écritures : le clavier de l’application n’a ni « . » ni « ? ». */
const phraseTraps = (text: string, signs: readonly string[], why: string): Trap[] =>
  variants(text, signs).map((t) => textTrap(t, why));
const ORDER_SIGNS = ['.', ' !', '!'] as const;
const QUESTION_SIGNS = [' ?', '?'] as const;

// ───────────────────────── 1. Les trois types de phrases ─────────────────────────

function phraseOf(rng: Rng, type: TypeId): string {
  const bank = type === 'declarative' ? DECLARATIVES : type === 'interrogative' ? INTERROGATIVES : IMPERATIVES;
  return rng.pick(bank);
}

/** Faute fréquente (un seul « r ») : refusée, mais expliquée. */
const UN_SEUL_R = ['interogative', 'phrase interogative', 'une phrase interogative', 'interogatif'];
const DEUX_R = 'Presque : le mot « interrogative » s’écrit avec deux « r ».';

const whyNotType = (wrong: TypeId, actual: TypeId) => `Ce n’est pas une ${LABEL[wrong]} : ici, ${REASON[actual]}.`;
const RECOPIE = 'Tu as recopié la phrase. Pour donner un ordre, enlève le sujet.';

function typesDraft(rng: Rng, level: Level): QuestionDraft {
  switch (level) {
    case 1: {
      const type = rng.pick(TYPES);
      const phrase = withSign(phraseOf(rng, type), type);
      const { answer, traps } = choice(
        rng,
        LABEL[type],
        TYPES.filter((t) => t !== type).map((t) => ({ label: LABEL[t], why: whyNotType(t, type) })),
      );
      return {
        prompt: `Choisis le type de cette phrase : « ${phrase} »`,
        answer,
        traps,
        hint: 'Demande-toi : la phrase informe, questionne ou ordonne ?',
        steps: [
          `Lis la phrase : « ${phrase} »`,
          `Cherche l’indice. ${CLUE[type]}`,
          `Demande-toi ce qu’elle fait. Ici, ${REASON[type]}.`,
          `Choisis : c’est une **${LABEL[type]}**.`,
        ],
      };
    }
    case 2: {
      const t = rng.pick(TRIPLETS);
      const rows = rng.shuffle([
        { text: withSign(t.declarative, 'declarative'), type: 'declarative' as const },
        { text: withSign(t.interrogative, 'interrogative'), type: 'interrogative' as const },
        { text: withSign(t.imperative, 'imperative'), type: 'imperative' as const },
      ]);
      let right = rng.shuffle(TYPES);
      while (rows.every((x, i) => right.indexOf(x.type) === i)) right = rng.shuffle(TYPES);
      return {
        prompt: `Ces phrases parlent de la même chose (${t.declarative.toLowerCase()}). Associe chacune à son type.`,
        answer: {
          kind: 'match',
          left: rows.map((x) => x.text),
          right: right.map((x) => LABEL[x]),
          pairs: rows.map((x) => right.indexOf(x.type)),
        },
        hint: 'Cherche d’abord la question. Cherche ensuite l’ordre.',
        steps: [
          `Trouve la question : « ${withSign(t.interrogative, 'interrogative')} »`,
          `Trouve l’ordre (l’impératif) : « ${withSign(t.imperative, 'imperative')} » Le sujet a disparu.`,
          `Regarde la dernière : « ${withSign(t.declarative, 'declarative')} » Elle informe.`,
          'Relie la question à **interrogative**, l’ordre à **impérative**, l’information à **déclarative**.',
        ],
      };
    }
    case 3: {
      const t = rng.pick(TRIPLETS);
      const type = rng.pick(TYPES);
      const phrase = withSign(t[type], type);
      return {
        prompt: `Écris le nom du type de cette phrase : « ${phrase} »`,
        answer: { kind: 'text', accepted: typeAnswers(type) },
        traps: [
          ...TYPES.filter((x) => x !== type).flatMap((x) =>
            typeAnswers(x).map((a) => textTrap(a, whyNotType(x, type))),
          ),
          ...(type === 'interrogative' ? UN_SEUL_R.map((a) => textTrap(a, DEUX_R)) : []),
        ],
        hint: 'Que fait cette phrase : informer, questionner ou ordonner ?',
        steps: [
          `Lis la phrase : « ${phrase} »`,
          `Regarde le début et la fin de la phrase. ${CLUE[type]}`,
          `Écris le nom du type : **${FEMININS[type][0]}**.`,
        ],
      };
    }
    case 4: {
      // Seuls les verbes qui changent : sinon, retirer le sujet suffit et l’énoncé contient la réponse.
      const t = rng.pick(TRIPLETS.filter((x) => x.faute !== undefined));
      return {
        prompt: `Transforme en phrase impérative, avec le même verbe : « ${t.declarative}. »`,
        answer: { kind: 'text', accepted: variants(t.imperative, ORDER_SIGNS) },
        traps: [
          ...phraseTraps(t.declarative, ORDER_SIGNS, RECOPIE),
          ...phraseTraps(
            t.interrogative,
            QUESTION_SIGNS,
            'Cette phrase pose une question. Il fallait donner un ordre.',
          ),
          ...(t.faute ? phraseTraps(t.faute, ORDER_SIGNS, t.verbe) : []),
        ],
        hint: 'Donne un ordre à quelqu’un : par quel mot commences-tu ?',
        steps: [
          `Enlève le sujet « ${t.sujet} » de la phrase.`,
          `Mets le verbe au début. ${t.verbe}`,
          `Écris l’ordre : **${t.imperative}.**`,
        ],
      };
    }
    default: {
      // Le point final ne suffit pas : l’ordre et les phrases déclaratives finissent de la même façon.
      const m = rng.pick(MESSAGES);
      // Lignes mélangées : la phrase à transformer n’a pas de place fixe.
      const messageLines = rng.shuffle([`${m.information}.`, `${m.question} ?`, `${m.ordre}.`, `${m.declarative}.`]);
      return {
        prompt:
          'Trouve la phrase déclarative qui contient « tu ». Transforme-la en phrase impérative, avec le même verbe.',
        figure: document(m.titre, messageLines),
        answer: { kind: 'text', accepted: variants(m.imperative, ORDER_SIGNS) },
        traps: [
          ...phraseTraps(m.declarative, ORDER_SIGNS, RECOPIE),
          ...phraseTraps(m.ordre, ORDER_SIGNS, 'Cette phrase donne déjà un ordre. Cherche la phrase avec « tu ».'),
          ...phraseTraps(m.question, QUESTION_SIGNS, 'Cette phrase pose une question : elle n’est pas déclarative.'),
          ...phraseTraps(
            m.information,
            ORDER_SIGNS,
            'Cette phrase informe, mais elle ne contient pas « tu ». Cherche l’autre.',
          ),
          ...phraseTraps(m.faute, ORDER_SIGNS, m.verbe),
        ],
        hint: 'Le point ne suffit pas : demande-toi ce que fait chaque phrase.',
        steps: [
          `Écarte la question (« ? ») et l’ordre (verbe au début, sans sujet).`,
          `Garde la phrase qui informe avec « tu » : « ${m.declarative}. »`,
          `Enlève « tu » et commence par le verbe. ${m.verbe}`,
          `Écris l’ordre : **${m.imperative}.**`,
        ],
      };
    }
  }
}

// ───────────────────────── 2. Poser une question ─────────────────────────

type Tournure = 'intonation' | 'estCeQue' | 'inversion';
const TOURNURES: readonly Tournure[] = ['intonation', 'estCeQue', 'inversion'];
const TOURNURE_LABEL: Record<Tournure, string> = {
  estCeQue: 'avec « est-ce que »',
  inversion: 'avec l’inversion du sujet',
  intonation: 'avec l’intonation seulement',
};
const NEGATIVE_LABEL = 'à la forme négative';

const WHY_TOURNURE: Record<Tournure | 'negative', string> = {
  estCeQue: 'Cherche « est-ce que » au début : il n’y est pas.',
  inversion: 'Dans une inversion, le sujet est après le verbe. Pas ici.',
  intonation: 'Ici, les mots changent : la voix ne fait pas tout.',
  negative: 'Il n’y a pas « ne » avant le verbe : la phrase n’est pas négative.',
};

const MANQUE_TRAIT = 'Il manque le trait d’union entre « est » et « ce ».';

/** Ce qu’on observe pour reconnaître chaque façon de poser la question. */
const OBSERVE: Record<Tournure, string> = {
  estCeQue: 'Observe : la phrase commence par « est-ce que ».',
  inversion: 'Observe : le verbe est avant le sujet, avec un trait d’union.',
  intonation: 'Observe : les mots ne changent pas, seule la voix monte.',
};

/** Bulle qui dit comment relier le verbe et le sujet inversé. */
const relier = (inversion: string) =>
  inversion.includes('-t-')
    ? 'Mets le verbe avant le sujet. Ajoute « -t- » entre les deux.'
    : 'Mets le verbe avant le sujet. Relie-les par un trait d’union.';

const sansT = (inversion: string) =>
  inversion.includes('-t-')
    ? [
        textTrap(
          `${inversion.replace('-t-', '-')} ?`,
          'Ajoute un « t » entre deux traits d’union : le verbe finit par une voyelle.',
        ),
      ]
    : [];

function questionDraft(rng: Rng, level: Level): QuestionDraft {
  const item = rng.pick(QUESTIONS);
  switch (level) {
    case 1: {
      const { answer, traps } = choice(rng, `${item.estCeQue} ?`, [
        {
          label: `${item.intonation} ?`,
          why: 'Ici, seule la voix pose la question : il n’y a pas « est-ce que ».',
        },
        {
          label: `${item.inversion} ?`,
          why: 'Ici, le sujet est après le verbe : c’est l’inversion du sujet.',
        },
      ]);
      return {
        prompt: 'Choisis la question posée avec « est-ce que ».',
        answer,
        traps,
        hint: 'Regarde le tout début de chaque phrase.',
        steps: [
          'Lis le début de chaque phrase.',
          'Cherche les mots « est-ce que » ou « est-ce qu’ ».',
          `Choisis : **${item.estCeQue} ?**`,
        ],
      };
    }
    case 2: {
      const tournure = rng.pick(TOURNURES);
      const { answer, traps } = choice(rng, TOURNURE_LABEL[tournure], [
        ...TOURNURES.filter((t) => t !== tournure).map((t) => ({ label: TOURNURE_LABEL[t], why: WHY_TOURNURE[t] })),
        { label: NEGATIVE_LABEL, why: WHY_TOURNURE.negative },
      ]);
      return {
        prompt: `Comment cette question est-elle posée ? « ${item[tournure]} ? »`,
        answer,
        traps,
        hint: 'Regarde le début, puis la place du sujet et du verbe.',
        steps: [
          `Lis la question : « ${item[tournure]} ? »`,
          OBSERVE[tournure],
          `Choisis : **${TOURNURE_LABEL[tournure]}**.`,
        ],
      };
    }
    case 3: {
      const elision = item.estCeQue.includes('qu’');
      return {
        prompt: `Pose la question avec « est-ce que » : « ${item.declarative}. »`,
        answer: { kind: 'text', accepted: variants(item.estCeQue, [' ?', '?']) },
        traps: [
          textTrap(`${item.inversion} ?`, 'C’est une inversion du sujet. Ici, il fallait « est-ce que ».'),
          textTrap(`${item.intonation} ?`, 'Seule la voix pose la question. Ajoute « est-ce que » au début.'),
          textTrap(`${item.estCeQue.replace('Est-ce', 'Est ce')} ?`, MANQUE_TRAIT),
          ...(elision
            ? [textTrap(`${item.estCeQue.replace('qu’', 'que ')} ?`, `Devant « ${item.sujet} », écris « qu’ ».`)]
            : []),
        ],
        hint: 'Ajoute les mots demandés au début. Le reste ne bouge pas.',
        steps: [
          elision
            ? `Écris « Est-ce qu’ » au début, car « ${item.sujet} » commence par une voyelle.`
            : 'Écris « Est-ce que » au début.',
          `Recopie ensuite « ${item.declarative.toLowerCase()} » sans changer l’ordre.`,
          `Termine par un point d’interrogation : **${item.estCeQue} ?**`,
        ],
      };
    }
    case 4:
      return {
        prompt: `Pose la question avec l’inversion du sujet : « ${item.declarative}. »`,
        answer: { kind: 'text', accepted: variants(item.inversion, [' ?', '?']) },
        traps: [
          textTrap(`${item.estCeQue} ?`, 'Tu as utilisé « est-ce que ». Ici, il fallait déplacer le sujet.'),
          textTrap(`${item.intonation} ?`, 'Le sujet n’a pas changé de place. Mets-le après le verbe.'),
          ...sansT(item.inversion),
        ],
        hint: 'Change la place du sujet : il passe après le verbe.',
        steps: [
          `Trouve le verbe « ${item.verbe} » et le sujet « ${item.sujet} ».`,
          relier(item.inversion),
          `Termine par un point d’interrogation : **${item.inversion} ?**`,
        ],
      };
    default: {
      const lue = rng.pick(QUESTIONS_LUES);
      // Les autres lignes informent : aucune ne montre une inversion à imiter.
      const lines = pickN(rng, DECLARATIVES, 3).map((x) => withSign(x, 'declarative'));
      lines.splice(rng.int(0, 3), 0, `${lue.estCeQue} ?`);
      return {
        prompt: 'Lis ce message. Trouve la question et réécris-la avec l’inversion du sujet.',
        figure: document('Un message', lines),
        answer: { kind: 'text', accepted: variants(lue.inversion, [' ?', '?']) },
        traps: [
          textTrap(`${lue.estCeQue} ?`, 'Tu as recopié la question. Enlève « est-ce que » et déplace le sujet.'),
          textTrap(
            `${capital(lue.estCeQue.replace(/^Est-ce qu(e |’)/, ''))} ?`,
            'Le sujet est encore avant le verbe. Change sa place.',
          ),
          ...sansT(lue.inversion),
        ],
        hint: 'Cherche la phrase qui demande une réponse. Quels mots faut-il enlever ?',
        steps: [
          `Trouve la question : « ${lue.estCeQue} ? »`,
          `Enlève « est-ce que ». Repère le verbe « ${lue.verbe} » et le sujet « ${lue.sujet} ».`,
          relier(lue.inversion),
          `Écris la question : **${lue.inversion} ?**`,
        ],
      };
    }
  }
}

// ───────────────────────── 3. La forme négative ─────────────────────────

const MARQUES = ['pas', 'jamais', 'plus'] as const;
type Marque = (typeof MARQUES)[number];
const MARQUE_LABEL: Record<Marque, string> = {
  pas: 'ne… pas',
  jamais: 'ne… jamais',
  plus: 'ne… plus',
};

/** Retire le « ne » (ou « n’ ») de la phrase négative : l'oubli le plus courant. */
const withoutNe = (text: string) => capital(text.replace(/^Ne |^N’| ne | n’/, (m) => (m.startsWith(' ') ? ' ' : '')));

const MANQUE_NE = 'Il manque « ne » (ou « n’ ») avant le verbe : la négation a deux mots.';

/** « ne » ou « n’ » : ce qu’il faut placer avant le verbe, et pourquoi. */
const placer = (negative: string, verbe: string, second: string) =>
  negative.includes('n’')
    ? `Place « n’ » avant « ${verbe} », qui commence par une voyelle. Ajoute « ${second} » après.`
    : `Place « ne » avant « ${verbe} » et « ${second} » juste après.`;

/** Piège « ne » devant une voyelle. */
const sansElision = (negative: string) =>
  negative.includes('n’')
    ? [textTrap(`${negative.replace('n’', 'ne ')}.`, 'Devant une voyelle, « ne » devient « n’ ».')]
    : [];

function negationDraft(rng: Rng, level: Level): QuestionDraft {
  const n = rng.pick(NEGATIONS);
  switch (level) {
    case 1: {
      const others = pickN(
        rng,
        NEGATIONS.filter((x) => x !== n),
        2,
      );
      const { answer, traps } = choice(
        rng,
        `${n.pas}.`,
        others.map((o) => ({
          label: `${o.affirmative}.`,
          why: 'Cette phrase est affirmative : il n’y a ni « ne » ni « pas ».',
        })),
      );
      return {
        prompt: 'Choisis la phrase à la forme négative.',
        answer,
        traps,
        hint: 'Cherche deux petits mots autour d’un verbe.',
        steps: [
          'Lis chaque phrase et cherche « ne » ou « n’ ».',
          'Vérifie qu’un mot comme « pas » suit le verbe.',
          `Choisis : **${n.pas}.**`,
        ],
      };
    }
    case 2: {
      const m = rng.pick(MARQUES);
      const { answer, traps } = choice(
        rng,
        MARQUE_LABEL[m],
        MARQUES.filter((l) => l !== m).map((l) => ({
          label: MARQUE_LABEL[l],
          why: `Regarde après le verbe : on lit « ${m} », pas « ${l} ».`,
        })),
        true,
      );
      return {
        prompt: `Choisis les mots qui forment la négation : « ${n[m]}. »`,
        answer,
        traps,
        hint: 'Repère le mot avant le verbe, puis le mot après.',
        steps: [
          'Cherche « ne » ou « n’ » avant le verbe.',
          `Regarde le mot placé juste après le verbe : « ${m} ».`,
          `Choisis : **${MARQUE_LABEL[m]}**.`,
        ],
      };
    }
    case 3:
      return {
        prompt: `Écris cette phrase à la forme négative avec « ne… pas » : « ${n.affirmative}. »`,
        answer: { kind: 'text', accepted: variants(n.pas, ['.']) },
        traps: [
          textTrap(withoutNe(n.pas), MANQUE_NE),
          textTrap(`${withoutNe(n.pas)}.`, MANQUE_NE),
          textTrap(n.pas.replace(' pas', ''), 'Il manque « pas » après le verbe : la négation a deux mots.'),
          textTrap(`${n.pas.replace(' pas', '')}.`, 'Il manque « pas » après le verbe : la négation a deux mots.'),
          ...sansElision(n.pas),
        ],
        hint: 'Entoure le verbe avec les deux mots de la négation.',
        steps: [`Trouve le verbe : « ${n.verbe} ».`, placer(n.pas, n.verbe, 'pas'), `Écris la phrase : **${n.pas}.**`],
      };
    case 4: {
      const m = rng.pick(['jamais', 'plus'] as const);
      return {
        prompt: `Écris cette phrase à la forme négative avec « ne… ${m} » : « ${n.affirmative}. »`,
        answer: { kind: 'text', accepted: variants(n[m], ['.']) },
        traps: [
          textTrap(`${n.pas}.`, `Tu as écrit « ne… pas ». La consigne demande « ne… ${m} ».`),
          textTrap(`${withoutNe(n[m])}.`, MANQUE_NE),
          ...sansElision(n[m]),
        ],
        hint: 'Garde deux mots autour du verbe. Relis bien la consigne.',
        steps: [`Trouve le verbe : « ${n.verbe} ».`, placer(n[m], n.verbe, m), `Écris la phrase : **${n[m]}.**`],
      };
    }
    default: {
      const o = rng.pick(OUBLIS);
      // Les autres lignes sont affirmatives : aucune négation complète ne sert de modèle.
      const lines = pickN(rng, NEGATIONS, 2).map((x) => `${x.affirmative}.`);
      lines.splice(rng.int(0, 2), 0, `${o.fautive}.`);
      return {
        prompt: 'Un mot de la négation manque dans ce message. Écris la phrase corrigée en entier.',
        figure: document('Un message', lines),
        answer: { kind: 'text', accepted: variants(o.corrigee, ['.']) },
        traps: [
          textTrap(`${o.fautive}.`, 'Tu as recopié la phrase. Ajoute le mot oublié avant le verbe.'),
          ...sansElision(o.corrigee),
        ],
        hint: 'Cherche la phrase qui dit non. Compte les mots de sa négation.',
        steps: [
          `Trouve la phrase qui contient « ${o.marque} » : son verbe est « ${o.verbe} ».`,
          placer(o.corrigee, o.verbe, o.marque),
          `Écris la phrase : **${o.corrigee}.**`,
        ],
      };
    }
  }
}

// ───────────────────────── 4. La forme exclamative ─────────────────────────

const TOURNURES_EXCLAMATIVES: readonly Tournure1[] = ['Quel', 'Quelle', 'Comme'];

function exclamativeDraft(rng: Rng, level: Level): QuestionDraft {
  const e = rng.pick(EXCLAMATIVES);
  switch (level) {
    case 1: {
      const { answer, traps } = choice(rng, withSign(e, 'exclamative'), [
        {
          label: withSign(rng.pick(DECLARATIVES), 'declarative'),
          why: 'Cette phrase informe : elle ne finit pas par un point d’exclamation.',
        },
        {
          label: withSign(rng.pick(INTERROGATIVES), 'interrogative'),
          why: 'Cette phrase pose une question : elle finit par un point d’interrogation.',
        },
      ]);
      return {
        prompt: 'Choisis la phrase à la forme exclamative.',
        answer,
        traps,
        hint: 'Cherche une émotion vive : joie, surprise, admiration.',
        steps: [
          'Regarde le signe à la fin de chaque phrase.',
          'Cherche celle qui montre une émotion, avec un point d’exclamation.',
          `Choisis : **${withSign(e, 'exclamative')}**`,
        ],
      };
    }
    case 2: {
      const [q1, q2] = pickN(rng, FAUSSES_AMIES_QUESTIONS, 2);
      const raison = rng.pick(FAUSSES_AMIES_RAISONS);
      const question = 'Cette phrase demande une réponse : c’est une question.';
      const { answer, traps } = choice(rng, e, [
        { label: q1 ?? '', why: question },
        { label: q2 ?? '', why: question },
        { label: raison, why: 'Ici, « Comme » donne une raison. La phrase informe.' },
      ]);
      return {
        prompt: 'Les signes de fin ont disparu. Choisis la phrase exclamative.',
        answer,
        traps,
        hint: 'Lis chaque phrase à voix haute. Laquelle montre une émotion ?',
        steps: [
          'Écarte les questions : elles demandent une réponse.',
          'Écarte la phrase qui donne une raison avec « Comme ».',
          `Choisis l’émotion vive : **${e} !**`,
        ],
      };
    }
    case 3: {
      const phrase = rng.pick(EXCLAMATIVES_A_RANGER);
      const words = `${phrase} !`.split(' ');
      const perm = shuffledIndices(rng, words.length);
      return {
        prompt: `Remets les mots dans l’ordre pour écrire une phrase exclamative : ${perm.map((i) => words[i]).join(' / ')}`,
        answer: {
          kind: 'order',
          items: perm.map((i) => at(words, i)),
          correct: words.map((_, pos) => perm.indexOf(pos)),
        },
        hint: 'Repère la majuscule. Garde le signe pour la fin.',
        steps: [
          `Place en premier le mot avec une majuscule : « ${first(words)} ».`,
          'Mets le point d’exclamation tout à la fin.',
          `Relis ta phrase : **${phrase} !**`,
        ],
      };
    }
    case 4: {
      // Une phrase par tournure, dans le désordre : l’élève choisit lui-même.
      const trous = rng.shuffle(TOURNURES_EXCLAMATIVES).map((m) => rng.pick(A_COMPLETER.filter((t) => t.mot === m)));
      const [p1 = '', p2 = '', p3 = ''] = trous.map((t) => `${t.suite} !`);
      return {
        prompt: `Choisis « Quel », « Quelle » ou « Comme » devant : ${trous.map((t) => `« ${t.suite} »`).join(', ')}.`,
        answer: {
          kind: 'cloze',
          parts: ['', ` ${p1} · `, ` ${p2} · `, ` ${p3}`],
          blanks: trous.map((t) => ({
            mode: 'list' as const,
            options: [...TOURNURES_EXCLAMATIVES],
            correct: TOURNURES_EXCLAMATIVES.indexOf(t.mot),
          })),
        },
        hint: 'Regarde ce qui suit le trou : un nom, ou bien un sujet et son verbe ?',
        steps: [
          'Cherche la phrase avec un sujet et un verbe : écris « Comme ».',
          'Dans les autres phrases, trouve le nom.',
          'Choisis « Quel » devant un nom masculin, « Quelle » devant un nom féminin.',
          `Écris dans l’ordre : **${trous.map((t) => t.mot).join(', ')}**.`,
        ],
      };
    }
    default: {
      const k = rng.int(1, 3);
      const q = rng.int(1, 4 - k);
      const r5 = 5 - k - q;
      const lines = rng.shuffle([
        ...pickN(rng, EXCLAMATIVES, k),
        ...pickN(rng, FAUSSES_AMIES_QUESTIONS, q),
        ...pickN(rng, FAUSSES_AMIES_RAISONS, r5),
      ]);
      return {
        prompt: 'Les signes de fin ont disparu. Combien de phrases sont exclamatives ?',
        figure: document('Quelques phrases', lines),
        answer: num(k),
        traps: numTraps(r(k), [
          [q, 'Tu as compté les questions : elles demandent une réponse.'],
          [k + r5, 'Tu as aussi compté les raisons : ici, « Comme » explique pourquoi.'],
          [k + 1, 'Tu en as compté une de trop : relis chaque ligne à voix haute.'],
        ]),
        hint: 'Le premier mot ne suffit pas. Lis toute la phrase.',
        steps: [
          'Écarte les questions : elles demandent une réponse.',
          'Écarte les raisons, comme « Comme il pleut, nous restons ici ».',
          `Compte les émotions vives. Écris : **${k}**.`,
        ],
      };
    }
  }
}

// ───────────────────────── 5. La ponctuation de fin de phrase ─────────────────────────

type Fin = 'declarative' | 'interrogative' | 'exclamative';
const FINS: readonly Fin[] = ['declarative', 'interrogative', 'exclamative'];
const MARK: Record<Fin, string> = { declarative: '.', interrogative: '?', exclamative: '!' };
const WHY_MARK: Record<string, string> = {
  '.': 'Le point termine une phrase qui donne une information.',
  '?': 'Le point d’interrogation termine une question.',
  '!': 'Le point d’exclamation termine une phrase qui exprime une émotion vive.',
  ',': 'La virgule sépare des mots dans une phrase : elle ne la termine pas.',
  ';': 'Le point-virgule sépare deux parties d’une phrase : il ne la termine pas.',
};
const FIN_REASON: Record<Fin, string> = {
  declarative: 'cette phrase donne une information',
  interrogative: 'cette phrase pose une question',
  exclamative: 'cette phrase exprime une émotion vive',
};
/** Signes proposés à tort : jamais un signe qui pourrait aussi convenir. */
const WRONG_MARKS: Record<Fin, readonly string[]> = {
  declarative: ['?', ',', ';'],
  interrogative: ['.', ',', ';'],
  exclamative: ['?', ',', ';'],
};
/** Au niveau 1 : deux signes très différents. */
const EASY_WRONG: Record<Fin, readonly string[]> = {
  declarative: ['?', ','],
  interrogative: ['.', '!'],
  exclamative: ['?', ','],
};
const bankOf = (fin: Fin) =>
  fin === 'declarative' ? INFORMATIONS : fin === 'interrogative' ? INTERROGATIVES : EXCLAMATIVES;
const whyWrongMark = (mark: string, fin: Fin) => `${WHY_MARK[mark]} Ici, ${FIN_REASON[fin]}.`;
/** Trou en liste : le clavier des réponses écrites n’a aucun signe de ponctuation. */
const markBlank = (fin: Fin) => ({
  mode: 'list' as const,
  options: FINS.map((f) => MARK[f]),
  correct: FINS.indexOf(fin),
});
/** La phrase suivie d'un signe, à la française : « . » et « , » collés, les autres après une espace. */
const marked = (text: string, mark: string) => `${text}${mark === '.' || mark === ',' ? '' : ' '}${mark}`;

function ponctuationDraft(rng: Rng, level: Level): QuestionDraft {
  const fin = rng.pick(FINS);
  const phrase = rng.pick(bankOf(fin));
  const mark = MARK[fin];
  const intention = (f: Fin) => rng.pick(INTENTIONS[f]);
  const contexte = intention(fin);
  const lire = `Regarde qui parle. ${contexte} : « ${phrase} » (sans signe)`;
  const penser = `Demande-toi ce qu’elle fait. Ici, ${FIN_REASON[fin]}.`;
  switch (level) {
    case 1: {
      const { answer, traps } = choice(
        rng,
        mark,
        EASY_WRONG[fin].map((w) => ({ label: w, why: whyWrongMark(w, fin) })),
      );
      return {
        prompt: `Choisis le signe de fin. ${contexte} : « ${phrase} » (sans signe)`,
        answer,
        traps,
        hint: 'La phrase informe, questionne ou montre une émotion ?',
        steps: [lire, penser, `Choisis le signe : **${mark}**`],
      };
    }
    case 2: {
      const { answer, traps } = choice(
        rng,
        marked(phrase, mark),
        WRONG_MARKS[fin].map((w) => ({ label: marked(phrase, w), why: whyWrongMark(w, fin) })),
      );
      return {
        prompt: `Choisis la phrase bien ponctuée. ${contexte} :`,
        answer,
        traps,
        hint: 'Relis qui parle. Que veut faire cette personne ?',
        steps: [lire, penser, `Choisis : **${marked(phrase, mark)}**`],
      };
    }
    case 3:
      return {
        prompt: `Choisis le signe qui manque. ${contexte} : « ${phrase} » (sans signe)`,
        answer: { kind: 'cloze', parts: ['Signe de fin : ', ''], blanks: [markBlank(fin)] },
        hint: 'Trouve d’abord ce que fait la phrase.',
        steps: [lire, penser, `Choisis le signe : **${mark}**`],
      };
    case 4: {
      const order = rng.shuffle(FINS);
      const sentences = order.map((f) => `${intention(f)} : « ${rng.pick(bankOf(f))} »`);
      return {
        prompt: 'Choisis le signe de fin de chacune de ces trois phrases.',
        // Les phrases sont dans la figure ; les trous ne les répètent pas.
        figure: document('Sans signe de fin', sentences),
        answer: {
          kind: 'cloze',
          parts: ['Phrase 1 : ', ' · Phrase 2 : ', ' · Phrase 3 : ', ''],
          blanks: order.map(markBlank),
        },
        hint: 'Traite une phrase à la fois : que fait-elle ?',
        steps: [
          'Lis chaque phrase et regarde qui parle.',
          'Cherche la question, puis la phrase qui montre une émotion.',
          'Garde le point pour la phrase qui informe.',
          `Choisis dans l’ordre : **${order.map((f) => MARK[f]).join(' ')}**`,
        ],
      };
    }
    default: {
      const kinds = rng.shuffle([...FINS, rng.pick(FINS)]);
      const stock = new Map(FINS.map((f) => [f, rng.shuffle(bankOf(f))]));
      const lines = kinds.map((f, i) => `${intention(f)} : « ${at(stock.get(f) ?? [], i)} »`);
      return {
        prompt: 'Lis ces phrases. Choisis le signe de fin de chaque ligne.',
        figure: document('Sans signe de fin', lines),
        answer: {
          kind: 'cloze',
          parts: ['Ligne 1 : ', ' · Ligne 2 : ', ' · Ligne 3 : ', ' · Ligne 4 : ', ''],
          blanks: kinds.map(markBlank),
        },
        hint: 'Attention : un même signe peut servir deux fois.',
        steps: [
          'Lis chaque ligne et regarde qui parle.',
          'Repère les questions et les émotions vives.',
          'Garde le point pour les informations.',
          `Choisis dans l’ordre : **${kinds.map((f) => MARK[f]).join(' ')}**`,
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
  readonly sources?: readonly string[];
  readonly sens: Sens;
  readonly generate: Skill['generate'];
}

const skill = (n: Notion): Skill => ({
  id: n.id,
  title: n.title,
  levels: 5,
  version: 2,
  sens: [n.sens],
  lesson: { memo: n.memo, source: programme(n.factId), sources: [PROGRAMME, ...(n.sources ?? [])] },
  generate: n.generate,
});

export const FCM1_PHRASES: readonly Skill[] = [
  skill({
    id: 'fcm1-types-phrases',
    title: 'Phrase déclarative, interrogative, impérative',
    memo: [
      'Une **phrase déclarative** informe : « Léo chante. »',
      'Une **phrase interrogative** questionne : « Qui chante ? »',
      'Une **phrase impérative** ordonne ou conseille : « Chante avec nous. »',
    ],
    factId: 'types',
    sens: SENS.types,
    generate: typesDraft,
  }),
  skill({
    id: 'fcm1-poser-question',
    title: 'Poser une question',
    memo: [
      'Avec l’**intonation**, ta voix monte à la fin : « Tu danses ? »',
      'Tu peux ajouter **est-ce que** au début : « Est-ce que tu danses ? »',
      'Avec l’**inversion du sujet**, le verbe passe devant : « Danses-tu ? »',
    ],
    factId: 'interroger',
    sources: ['cnrtl-interrogation'],
    sens: SENS.question,
    generate: questionDraft,
  }),
  skill({
    id: 'fcm1-forme-negative',
    title: 'La forme négative',
    memo: [
      'La **forme négative** dit qu’une chose n’est pas ou ne se fait pas.',
      'Mets « ne » avant le verbe, puis « pas », « jamais » ou « plus » après.',
      'Devant une voyelle, écris « n’ » : « Léo n’arrive pas. »',
    ],
    factId: 'formes',
    sources: ['cnrtl-ne'],
    sens: SENS.negation,
    generate: negationDraft,
  }),
  skill({
    id: 'fcm1-forme-exclamative',
    title: 'La forme exclamative',
    memo: [
      'La **forme exclamative** montre une **émotion vive**, comme la joie.',
      'Elle finit par un **point d’exclamation** : « Quel joli vélo ! »',
      'Écris « Quel » ou « Quelle » avec un nom, « Comme » avec un verbe.',
    ],
    factId: 'formes',
    sources: ['cnrtl-exclamation'],
    sens: SENS.exclamative,
    generate: exclamativeDraft,
  }),
  skill({
    id: 'fcm1-ponctuation-fin',
    title: 'La ponctuation de fin de phrase',
    memo: [
      'Une phrase qui informe finit par un point.',
      'Une question finit par un **point d’interrogation**.',
      'Une émotion vive finit par un **point d’exclamation**.',
    ],
    factId: 'interroger',
    sources: ['cnrtl-interrogation', 'cnrtl-exclamation'],
    sens: SENS.ponctuation,
    generate: ponctuationDraft,
  }),
];
