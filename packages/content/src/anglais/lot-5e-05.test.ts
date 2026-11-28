import { describe, expect, it } from 'vitest';
import { generate, getSkill } from '../catalog.ts';
import { check } from '../check.ts';
import { glossaryIssues, sourceIssues } from '../couverture.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource, isAllowedUrl } from '../sources.ts';
import type { Level, Question } from '../types.ts';
import { validateVariants } from '../validate.ts';
import { ENGLISH_PRONOUNS_5E_CHAPTER, NOUNS, PREFIX_PAIRS } from './groupe-nominal-5e.ts';
import { FAITS as GROUP_FACTS } from './groupe-nominal-5e-faits.ts';
import {
  ALONE_POOL,
  CASES,
  COMPARISONS,
  CONCESSIONS,
  ENGLISH_LINKING_5E_CHAPTER,
  HOWEVERS,
  QUALITIES,
} from './relier-situer.ts';
import { FAITS as LINK_FACTS } from './relier-situer-faits.ts';

const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
const CHAPTERS = [
  { chapter: ENGLISH_PRONOUNS_5E_CHAPTER, facts: GROUP_FACTS },
  { chapter: ENGLISH_LINKING_5E_CHAPTER, facts: LINK_FACTS },
];
const SKILLS = CHAPTERS.flatMap((c) => c.chapter.skills);
const questions = (id: string, level: Level) => Array.from({ length: 300 }, (_, i) => generate(id, level, i + 1));
const find = (id: string, level: Level, part: string) => {
  const q = questions(id, level).find((x) => x.prompt.includes(part));
  if (!q) throw new Error(`question introuvable : ${part}`);
  return q;
};
const text = (q: Question, t: string) => check(q, { kind: 'text', text: t }).correct;

describe('anglais 5e : groupe nominal et pronoms, relier et situer', () => {
  it('8 notions à 5 niveaux', () => {
    expect(SKILLS.map((s) => s.id)).toEqual([
      'a5-quantifieurs',
      'a5-pronoms-reflechis',
      'a5-derivation',
      'a5-antonymes',
      'a5-contraste',
      'a5-plans',
      'a5-gauche-droite',
      'a5-intensite',
    ]);
    for (const s of SKILLS) expect(getSkill(s.id)?.levels, s.id).toBe(5);
  });

  it('sources citées par un fait, domaines autorisés, mots en gras définis, sens conforme', () => {
    for (const { chapter, facts } of CHAPTERS) {
      expect(new Set(facts.map((f) => f.id)).size).toBe(facts.length);
      for (const f of facts) {
        expect(isAllowedUrl(getSource(f.sourceId)!.url), f.id).toBe(true);
        expect(f.quote.trim().length, f.id).toBeGreaterThan(0);
      }
      for (const s of chapter.skills) {
        expect(s.lesson.sources).toContain('anglais-college-2025');
        expect(sourceIssues(s)).toEqual([]);
        expect(glossaryIssues({ skill: s, chapter }), s.id).toEqual([]);
        expect(s.sens?.length, s.id).toBeGreaterThan(0);
        expect(sensIssues(s), s.id).toEqual([]);
        for (const id of [...(s.lesson.sources ?? []), ...(s.sens ?? []).map((x) => x.source)])
          expect(
            facts.some((f) => f.sourceId === id),
            `${s.id} ${id}`,
          ).toBe(true);
        for (const x of s.sens ?? [])
          expect(
            facts.some((f) => f.sourceId === x.source && f.quote.includes(x.citation.replace(/\.$/, ''))),
            `${s.id} : citation du sens`,
          ).toBe(true);
      }
    }
  });

  it('questions valides, 5 niveaux distincts, au moins deux pièges, réponses acceptées', () => {
    for (const s of SKILLS) {
      const byLevel = LEVELS.map((l) => questions(s.id, l));
      for (const qs of byLevel) {
        expect(validateVariants(qs), s.id).toEqual([]);
        expect(
          new Set(qs.map((q) => JSON.stringify([q.prompt, q.figure, q.answer]))).size,
          s.id,
        ).toBeGreaterThanOrEqual(6);
      }
      expect(new Set(byLevel.map((qs) => qs.map((q) => q.prompt).join('|'))).size, s.id).toBe(5);
      const reasons = new Set(byLevel.flat().flatMap((q) => q.traps.map((t) => t.why)));
      expect(reasons.size, s.id).toBeGreaterThanOrEqual(2);
      for (const q of byLevel.flat()) {
        if (q.answer.kind !== 'text') continue;
        for (const t of q.answer.accepted) expect(text(q, t), q.prompt).toBe(true);
      }
    }
  });

  it('explications lisibles sans adulte : aucun signalement du détecteur', () => {
    for (const { chapter } of CHAPTERS)
      for (const s of chapter.skills) {
        const report = analyzeSkill(s, chapter);
        expect({ id: s.id, counts: report.counts }).toEqual({ id: s.id, counts: {} });
      }
  });

  it('quantifieurs : many pour ce qui se compte, much sinon, some pour proposer', () => {
    for (const q of questions('a5-quantifieurs', 3)) {
      const word = /… (\w+)/.exec(q.prompt)![1]!;
      const n = NOUNS.find((x) => x.en === word)!;
      expect(text(q, n.countable ? 'many' : 'much'), q.prompt).toBe(true);
      expect(text(q, n.countable ? 'much' : 'many'), q.prompt).toBe(false);
    }
    expect(text(find('a5-quantifieurs', 4, 'I’d like'), 'some')).toBe(true);
  });

  it('pronoms réfléchis : « hisself » et le pronom complément refusés', () => {
    const q = find('a5-pronoms-reflechis', 3, 'Tom hurt');
    expect(text(q, 'Himself.')).toBe(true);
    for (const t of ['hisself', 'him', 'themselves']) expect(text(q, t), t).toBe(false);
    expect(text(find('a5-pronoms-reflechis', 4, 'Boys,'), 'yourself')).toBe(false);
  });

  it('dérivation : « e » final supprimé, autres contraires corrects acceptés', () => {
    const q = find('a5-derivation', 4, '« believe » qui veut dire « incroyable »');
    expect(text(q, 'Unbelievable.')).toBe(true);
    expect(text(q, 'unbelieveable')).toBe(false);
    const move = find('a5-derivation', 4, '« move » qui veut dire « qu’on ne peut pas déplacer »');
    for (const t of ['unmovable', 'unmoveable']) expect(text(move, t), t).toBe(true);
    for (const t of ['immovable', 'immoveable']) expect(text(move, t), t).toBe(false);
  });

  it('saisie sans propositions aux niveaux 4 et 5 : aucune liste de mots dans l’énoncé', () => {
    for (const id of ['a5-quantifieurs', 'a5-contraste', 'a5-intensite'])
      for (const q of [...questions(id, 4), ...questions(id, 5)])
        expect(q.prompt.split('«')[0], id).not.toMatch(/\b(much|many|some|but|whereas|however|very|too)\b/);
  });

  it('quantifieurs : le document donne le sens « pas beaucoup » dans les négations', () => {
    for (const q of questions('a5-quantifieurs', 5))
      expect(JSON.stringify(q.figure)).not.toMatch(/il manque|il y a peu/);
  });

  it('une seule règle par trou : non- (drink), unsocial et synonymes hors cours refusés', () => {
    const drink = find('a5-derivation', 4, '« drink »');
    for (const t of ['non-drinkable', 'nondrinkable']) expect(text(drink, t), t).toBe(false);
    const social = find('a5-antonymes', 4, '« social »');
    for (const t of ['unsocial', 'asocial']) expect(text(social, t), t).toBe(false);
    const extras = ['sad', 'fake', 'imaginary', 'unreal', 'loud', 'unsatisfied', 'non-drinkable', 'nondrinkable'];
    for (const q of [...questions('a5-antonymes', 5), ...questions('a5-derivation', 5)]) {
      if (q.answer.kind !== 'cloze') throw new Error('texte à trous attendu');
      for (const b of q.answer.blanks)
        if (b.mode === 'text') for (const t of extras) expect(b.accepted, t).not.toContain(t);
    }
  });

  it('positions : « on the top » et « on the bottom » refusés', () => {
    for (const [fr, word] of [
      ['en haut', 'top'],
      ['en bas', 'bottom'],
    ] as const) {
      const q = find('a5-gauche-droite', 4, `« ${fr} »`);
      expect(text(q, `at the ${word}`)).toBe(true);
      for (const t of [`on the ${word}`, `on the ${word} of the picture`]) expect(text(q, t), t).toBe(false);
    }
  });

  it('antonymes : seul le préfixe du cours est accepté', () => {
    const q = find('a5-antonymes', 4, '« satisfied »');
    expect(text(q, 'Dissatisfied.')).toBe(true);
    expect(text(q, 'unsatisfied')).toBe(false);
    expect(text(find('a5-antonymes', 4, '« legal »'), 'unlegal')).toBe(false);
  });

  it('contraste : however seulement après un point-virgule ; « But » jamais proposé comme faux', () => {
    for (const q of questions('a5-contraste', 2)) {
      if (q.answer.kind !== 'choice') throw new Error('choix attendu');
      if (q.prompt.includes('; …')) expect(JSON.stringify(q.answer), q.prompt).not.toMatch(/"but"/i);
    }
    for (const q of questions('a5-contraste', 4)) {
      if (q.answer.kind !== 'text') throw new Error('saisie attendue');
      const after = /([.;,]) …/.exec(q.prompt)![1];
      expect(after, q.prompt).not.toBe('.');
      expect(q.answer.accepted[0] === 'however', q.prompt).toBe(after === ';');
    }
    for (const q of questions('a5-contraste', 4)) {
      if (q.answer.kind !== 'text') throw new Error('saisie attendue');
      for (const t of ['but', 'whereas', 'however']) expect(text(q, t), q.prompt).toBe(t === q.answer.accepted[0]);
    }
    for (const q of questions('a5-contraste', 5)) {
      if (q.answer.kind !== 'cloze') throw new Error('texte à trous attendu');
      expect(q.answer.blanks).toHaveLength(4);
      for (const b of q.answer.blanks) {
        if (b.mode !== 'text') throw new Error('saisie attendue');
        expect(['but', 'however']).toContain(b.accepted.join('|'));
      }
    }
  });

  it('contraste : au niveau 5, aucune aide de plus qu’au niveau 4, quatre trous sans traduction', () => {
    const pool = [...ALONE_POOL.but, ...ALONE_POOL.however];
    for (const q of questions('a5-contraste', 5)) {
      if (q.answer.kind !== 'cloze' || q.figure?.kind !== 'document') throw new Error('document à trous attendu');
      expect([q.prompt, q.hint, ...q.figure.lines].join(' ')).not.toMatch(/\bmais\b|cependant|alors que|traduction/);
      for (const [i, line] of q.figure.lines.entries()) {
        const j = pool.find((x) => line.startsWith(x.start) && line.endsWith(x.end));
        expect(j, line).toBeDefined();
        const blank = q.answer.blanks[i]!;
        if (blank.mode !== 'text') throw new Error('saisie attendue');
        expect(blank.accepted).toEqual([j!.start.endsWith(';') ? 'however' : 'but']);
      }
    }
  });

  it('contraste : au niveau 4, ni traduction ni mot français, et jamais l’exemple du mémo', () => {
    const memo = getSkill('a5-contraste')!.lesson.memo.join(' ');
    const pool = [...ALONE_POOL.but, ...ALONE_POOL.however];
    for (const q of questions('a5-contraste', 4)) {
      const j = pool.find((x) => q.prompt.includes(x.start) && q.prompt.includes(x.end));
      expect(j, q.prompt).toBeDefined();
      expect(memo).not.toContain(j!.start);
      expect([q.prompt, q.hint].join(' ')).not.toMatch(/\bmais\b|cependant|alors que/);
    }
  });

  it('contraste : la phrase d’exemple du mémo n’est reprise dans aucun item', () => {
    const memo = getSkill('a5-contraste')!.lesson.memo.join(' ');
    const [, start, end] = /Exemple : « (.+;) however, (.+) »/.exec(memo)!;
    for (const j of [...CONCESSIONS, ...COMPARISONS, ...HOWEVERS]) {
      expect(j.start).not.toBe(start);
      expect(j.end).not.toBe(end);
    }
    for (const q of LEVELS.flatMap((l) => questions('a5-contraste', l))) {
      const shown = `${q.prompt} ${JSON.stringify(q.figure ?? null)}`;
      expect(shown).not.toContain(start);
      expect(shown).not.toContain(end);
    }
  });

  it('quantifieurs : proposer ou demander attend un seul mot, dans une phrase où « any » est faux', () => {
    const offers = questions('a5-quantifieurs', 4).filter((q) => /Please have|I’d like/.test(q.prompt));
    expect(offers.length).toBeGreaterThan(0);
    for (const q of offers) {
      expect(q.prompt).toContain('en un seul mot');
      expect(q.prompt).toContain('quantifieur du cours');
      expect(q.prompt).not.toMatch(/mémo|proposer|demander|un peu|quelques|\?/);
      expect(text(q, 'some'), q.prompt).toBe(true);
      expect(text(q, 'any'), q.prompt).toBe(false);
    }
    for (const q of [...questions('a5-quantifieurs', 4), ...questions('a5-quantifieurs', 5)])
      expect(`${q.prompt} ${q.answer.kind === 'cloze' ? q.answer.parts.join('…') : ''}`).not.toMatch(
        /Would you like|Can I have|Can you buy/,
      );
  });

  it('antonymes : chaque mot à préfixe attendu est montré dans le mémo', () => {
    const memo = getSkill('a5-antonymes')!.lesson.memo.join(' ');
    for (const [, accepted] of PREFIX_PAIRS) expect(memo).toContain(accepted[0]);
  });

  it('contraste : aucune règle de comparaison non sourcée', () => {
    const skill = getSkill('a5-contraste')!;
    const why = LEVELS.flatMap((l) => questions(skill.id, l)).flatMap((q) => q.traps.map((t) => t.why));
    for (const t of [...skill.lesson.memo, ...why, ...skill.sens!.map((x) => x.text)]) expect(t).not.toMatch(/compar/i);
  });

  it('degré : le sens français désigne un seul adverbe, sans règle liée au plaisir', () => {
    const french = { very: 'très', too: 'trop', much: 'beaucoup plus' };
    for (const c of CASES) {
      expect(c.fr, c.text).toContain(french[c.degree]);
      for (const [degree, words] of Object.entries(french))
        if (degree !== c.degree) expect(c.fr, c.text).not.toContain(words);
    }
    for (const level of [2, 3] as const)
      for (const q of questions('a5-intensite', level))
        expect(
          CASES.some((c) => q.prompt.includes(c.fr) && q.prompt.includes(c.text)),
          q.prompt,
        ).toBe(true);
    for (const level of [2, 3, 5] as const)
      for (const q of questions('a5-intensite', level))
        expect([q.hint, ...q.steps].join(' ')).not.toMatch(/plaisir|aime/);
  });

  it('positions : écritures courantes acceptées, « in the left » refusé', () => {
    const q = find('a5-gauche-droite', 4, '« à gauche »');
    for (const t of ['on the left', 'On the left.', 'to the left', 'on the left of the picture'])
      expect(text(q, t), t).toBe(true);
    expect(text(q, 'in the left')).toBe(false);
  });

  it('degré : le document fait produire quatre groupes complets, dont deux comparatifs', () => {
    for (const q of questions('a5-intensite', 5)) {
      if (q.answer.kind !== 'cloze' || q.figure?.kind !== 'document') throw new Error('document à trous attendu');
      const { lines } = q.figure;
      expect(q.answer.blanks).toHaveLength(4);
      const answers = q.answer.blanks.map((b, i) => {
        if (b.mode !== 'text') throw new Error('saisie attendue');
        const [answer = ''] = b.accepted;
        const [degree = '', ...form] = answer.split(' ');
        const quality = QUALITIES.find((x) => lines[2 * i]!.startsWith(`${x.en} (`))!;
        expect(form.join(' '), q.prompt).toBe(degree === 'much' ? quality.comparative : quality.adj);
        expect(lines[2 * i + 1]).toContain(`Mot de base : ${quality.adj}.`);
        for (const bare of ['very', 'too', 'much', quality.adj]) expect(b.accepted).not.toContain(bare);
        return degree;
      });
      expect([...answers].sort(), q.prompt).toEqual(['much', 'much', 'too', 'very']);
    }
  });

  it('textes à trous : aucun mot collé à un trou', () => {
    for (const skill of SKILLS)
      for (const q of questions(skill.id, 5)) {
        if (q.answer.kind !== 'cloze') continue;
        const { parts } = q.answer;
        for (const [i, part] of parts.entries()) {
          if (i > 0) expect(part, `${skill.id} : « ${part} »`).toMatch(/^($|[\s.,;:!?])/);
          if (i < parts.length - 1) expect(part, `${skill.id} : « ${part} »`).toMatch(/(^|\s)$/);
        }
      }
  });
});
