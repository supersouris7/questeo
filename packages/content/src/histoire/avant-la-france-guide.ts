import type { Figure, Level, QuestionDraft, Sens, Skill, Trap } from '../types.ts';
import type { Rng } from '../rng.ts';
import { choice } from '../build.ts';
import { shuffled, type Preuve } from './kit.ts';

/**
 * Notions « guidées » du chapitre : l'explication tient en 3 ou 4 bulles qui disent quoi faire, la dernière donne la
 * réponse en gras (docs/contenus/README.md §3). Le niveau 5 demande d'écrire la réponse à partir d'un document.
 */
interface Guide {
  /** Indice : met sur la voie sans donner la réponse. */
  readonly indice: string;
  /** Deux bulles d'explication ; la bulle « réponse » est ajoutée à la fin. */
  readonly etapes: readonly [string, string];
}

/** Fait cité : question à choix et texte à trou. */
export interface FaitGuide extends Preuve, Guide {
  readonly q: string;
  readonly a: string;
  /** Erreurs typiques : les deux premières sont très différentes (niveau 1), les trois servent au niveau 2. */
  readonly wrong: readonly { readonly label: string; readonly why: string }[];
  /** Avant le trou, après le trou, réponses acceptées. */
  readonly gap: readonly [string, string, readonly string[]];
}

/** Réponse à écrire, sans proposition. */
export interface LibreGuide extends Preuve, Guide {
  readonly q: string;
  readonly accepted: readonly string[];
  readonly traps: readonly { readonly text: string; readonly why: string }[];
}

export interface NotionGuidee {
  readonly id: string;
  readonly title: string;
  readonly memo: readonly string[];
  readonly sens: Sens;
  readonly faits: readonly FaitGuide[];
  /** Définitions courtes : elles tiennent dans les bulles de correction. */
  readonly paires3: readonly (readonly [string, string])[];
  readonly paires5: readonly (readonly [string, string])[];
  /** Repères dans l'ordre du temps (au moins 3), avec leur explication. */
  readonly ordre?: Guide & { readonly reperes: readonly string[]; readonly reponse: string };
  readonly libres: readonly LibreGuide[];
  readonly docs: readonly {
    readonly title: string;
    readonly lines: readonly string[];
    readonly qs: readonly LibreGuide[];
  }[];
}

const PROGRAMME = 'Programme du cycle 3 (BOEN n° 31 du 30 juillet 2020, version 2023), histoire, classe de CM1';

const CREDIT = 'Texte écrit pour l’exercice, d’après le programme de CM1.';

const steps = (g: Guide, answer: string) => [...g.etapes, `Retiens la réponse : **${answer}**.`];

const relier = (pairs: readonly (readonly [string, string])[]) =>
  `Relie : ${pairs.map(([a, b]) => `**${a} → ${b}**`).join(' ; ')}.`;

function match(rng: Rng, prompt: string, pairs: readonly (readonly [string, string])[]): QuestionDraft {
  const left = pairs.map((p) => p[0]);
  const right = shuffled(
    rng,
    pairs.map((p) => p[1]),
  );
  const half = Math.floor(pairs.length / 2);
  return {
    prompt,
    answer: { kind: 'match', left, right, pairs: pairs.map((p) => right.indexOf(p[1])) },
    hint: 'Commence par le mot que tu connais le mieux.',
    steps: [
      'Lis tous les mots. Commence par ceux que tu connais.',
      relier(pairs.slice(0, half)),
      relier(pairs.slice(half)),
    ],
    targetSeconds: 40,
  };
}

const written = (prompt: string, l: LibreGuide): QuestionDraft => {
  const traps: Trap[] = l.traps.map((t) => ({ text: t.text, why: t.why }));
  return {
    prompt,
    answer: { kind: 'text', accepted: l.accepted },
    traps,
    hint: l.indice,
    steps: steps(l, l.accepted[0] ?? ''),
    targetSeconds: 30,
  };
};

function level3(rng: Rng, n: NotionGuidee): QuestionDraft {
  const ordre = n.ordre;
  if (ordre && rng.int(0, 1) === 0) {
    const items = shuffled(rng, ordre.reperes);
    return {
      prompt: 'Range ces repères du plus ancien au plus récent.',
      answer: { kind: 'order', items, correct: ordre.reperes.map((o) => items.indexOf(o)) },
      hint: ordre.indice,
      steps: steps(ordre, ordre.reponse),
      targetSeconds: 40,
    };
  }
  const f = rng.pick(n.faits);
  const [before, after, accepted] = f.gap;
  return {
    prompt: `Complète la phrase : « ${before}…${after} »`,
    answer: { kind: 'cloze', parts: [before, after], blanks: [{ mode: 'text', accepted }] },
    hint: f.indice,
    steps: steps(f, accepted[0] ?? ''),
    targetSeconds: 30,
  };
}

function question(rng: Rng, n: NotionGuidee, level: Level, credit: string): QuestionDraft {
  switch (level) {
    case 1: {
      const f = rng.pick(n.faits);
      return {
        prompt: f.q,
        ...choice(rng, f.a, f.wrong.slice(0, 2)),
        hint: f.indice,
        steps: steps(f, f.a),
        targetSeconds: 20,
      };
    }
    case 2: {
      if (rng.int(0, 1) === 0) return match(rng, 'Associe chaque mot à ce qui lui correspond.', n.paires3);
      const f = rng.pick(n.faits);
      return {
        prompt: `Attention aux pièges ! ${f.q}`,
        ...choice(rng, f.a, f.wrong),
        hint: f.indice,
        steps: steps(f, f.a),
        targetSeconds: 25,
      };
    }
    case 3:
      return level3(rng, n);
    case 4: {
      if (rng.int(0, 1) === 0) return match(rng, 'Associe les cinq mots, sans aide.', n.paires5);
      const l = rng.pick(n.libres);
      return written(l.q, l);
    }
    default: {
      const d = rng.pick(n.docs);
      const q = rng.pick(d.qs);
      const figure: Figure = {
        kind: 'document',
        title: d.title,
        lines: d.lines,
        credit,
      };
      return { ...written(`Lis le texte. ${q.q}`, q), figure, targetSeconds: 60 };
    }
  }
}

/** Notion à 5 niveaux (grille de docs/contenus/README.md §1). */
export function notionGuidee(n: NotionGuidee, programme: string, credit = CREDIT): Skill {
  const preuves: readonly Preuve[] = [...n.faits, ...n.libres, ...n.docs.flatMap((d) => d.qs)];
  const sources = [...new Set([programme, ...preuves.flatMap((p) => (p.source ? [p.source] : [])), n.sens.source])];
  return {
    id: n.id,
    title: n.title,
    levels: 5,
    version: 2,
    lesson: { memo: n.memo, source: PROGRAMME, sources },
    sens: [n.sens],
    generate: (rng: Rng, level: Level): QuestionDraft => question(rng, n, level, credit),
  };
}
