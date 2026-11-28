import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource, isAllowedUrl } from '../sources.ts';
import { skillLevels } from '../types.ts';
import { ENGLISH_PRESENTATION_CHAPTER } from './presentation.ts';
import { FAITS, wordOf } from './presentation-faits.ts';

const skills = ENGLISH_PRESENTATION_CHAPTER.skills;

describe('anglais cm1 : se présenter et saluer', () => {
  it('5 notions à 5 niveaux, avec le programme en vigueur au CM1 et un « sens »', () => {
    expect(skills.map((s) => s.id)).toEqual([
      'acm1-saluer',
      'acm1-your-name',
      'acm1-how-old',
      'acm1-nombres-1-31',
      'acm1-where-live',
    ]);
    for (const s of skills) {
      expect(skillLevels(s)).toBe(5);
      expect(s.lesson.sources).toContain('lve-cm-2026');
      expect(s.sens?.length, s.id).toBeGreaterThan(0);
      expect(sensIssues(s), s.id).toEqual([]);
    }
  });

  it('chaque fait cite une source du registre (domaine autorisé) et une citation non vide', () => {
    for (const f of FAITS) {
      const src = getSource(f.sourceId);
      expect(src, f.id).toBeDefined();
      expect(isAllowedUrl(src!.url), f.id).toBe(true);
      expect(f.quote.trim().length, f.id).toBeGreaterThan(0);
    }
  });

  it('les nombres de 1 à 31 ont tous un mot anglais, composés avec un tiret', () => {
    for (let n = 1; n <= 31; n++) expect(wordOf(n), String(n)).toBeDefined();
    expect(wordOf(27)).toBe('twenty-seven');
    expect(wordOf(31)).toBe('thirty-one');
    expect(wordOf(13)).toBe('thirteen');
  });

  it('le niveau 4 des nombres accepte le tiret ou l’espace, refuse le mot collé avec une explication', () => {
    for (let seed = 1; seed < 80; seed++) {
      const q = generate('acm1-nombres-1-31', 4, seed);
      if (q.answer.kind !== 'text' || !q.prompt.includes('27')) continue;
      expect(check(q, { kind: 'text', text: 'Twenty seven' }).correct).toBe(true);
      const glued = check(q, { kind: 'text', text: 'twentyseven' });
      expect(glued.correct).toBe(false);
      expect(glued.why).toMatch(/tiret/);
      return;
    }
    throw new Error('27 jamais tiré');
  });

  it('le niveau 4 de « How old are you? » refuse « I have » avec une explication', () => {
    const q = generate('acm1-how-old', 4, 3);
    const res = check(q, { kind: 'text', text: 'I have nine' });
    expect(res.correct).toBe(false);
  });

  it('le niveau 5 de « Where do you live? » distingue la ville d’origine de la ville d’habitation', () => {
    const q = generate('acm1-where-live', 5, 7);
    expect(q.figure?.kind).toBe('document');
    if (q.answer.kind !== 'cloze') throw new Error('texte à trous attendu');
    const answers = q.answer.blanks.map((x) => (x.mode === 'text' ? (x.accepted[0] ?? '') : ''));
    expect(check(q, { kind: 'cloze', answers }).correct).toBe(true);
    expect(check(q, { kind: 'cloze', answers: [...answers].reverse() }).correct).toBe(false);
  });

  it('prendre congé : les façons courantes de dire au revoir sont acceptées au niveau 4', () => {
    for (let seed = 1; seed < 80; seed++) {
      const q = generate('acm1-saluer', 4, seed);
      if (q.answer.kind !== 'text' || !q.answer.accepted.includes('Bye')) continue;
      for (const text of ['Bye for now !', 'Goodbye.', 'good bye', 'See you soon!'])
        expect(check(q, { kind: 'text', text }).correct, text).toBe(true);
      expect(check(q, { kind: 'text', text: 'Hello' }).correct).toBe(false);
      return;
    }
    throw new Error('départ jamais tiré');
  });

  it('les autres écritures correctes des questions sont acceptées au niveau 4', () => {
    const cases = [
      ['acm1-your-name', 'What’s your name', 'What are you called?'],
      ['acm1-how-old', 'How old are you', 'What’s your age?'],
      ['acm1-where-live', 'Where do you live', 'Where are you living?'],
    ] as const;
    for (const [id, expected, other] of cases) {
      const q = Array.from({ length: 80 }, (_, i) => generate(id, 4, i + 1)).find(
        (x) => x.answer.kind === 'text' && x.answer.accepted.includes(expected),
      );
      if (!q) throw new Error(`question jamais tirée : ${id}`);
      expect(check(q, { kind: 'text', text: other }).correct, other).toBe(true);
    }
  });

  it('« first name » et « I’m called » sont acceptés', () => {
    const questions = Array.from({ length: 120 }, (_, i) => i + 1);
    const gap = questions.map((seed) => generate('acm1-your-name', 3, seed)).find((x) => x.prompt.includes('your …'));
    if (!gap) throw new Error('trou « name » jamais tiré');
    expect(check(gap, { kind: 'cloze', answers: ['first name'] }).correct).toBe(true);
    const written = questions.map((seed) => generate('acm1-your-name', 4, seed));
    const asking = written.find((x) => x.answer.kind === 'text' && x.answer.accepted.includes('What’s your name'));
    const replying = written.find((x) => x.prompt.includes('tu joues Ana'));
    if (!asking || !replying) throw new Error('question jamais tirée');
    expect(check(asking, { kind: 'text', text: 'What’s your first name?' }).correct).toBe(true);
    expect(check(replying, { kind: 'text', text: 'I’m called Ana.' }).correct).toBe(true);
  });

  it('en français, on habite « à Londres »', () => {
    for (let seed = 1; seed <= 80; seed++)
      for (const level of [3, 4] as const)
        expect(generate('acm1-where-live', level, seed).prompt).not.toContain('à London');
  });

  it('au niveau 3, la phrase à compléter pour dire où l’on habite est donnée en français', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = generate('acm1-where-live', 3, seed);
      if (q.prompt.includes('Complète : « I ')) expect(q.prompt).toContain('J’habite à');
    }
  });

  it('au niveau 5 des nombres, on écrit en lettres le nombre caché, compté en montant ou en descendant', () => {
    const numberOf = (w: string) => Array.from({ length: 31 }, (_, i) => i + 1).find((n) => wordOf(n) === w) ?? 0;
    const directions = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const q = generate('acm1-nombres-1-31', 5, seed);
      if (q.figure?.kind !== 'document' || q.answer.kind !== 'text') throw new Error('forme inattendue');
      const [first = 0, second = 0] = q.figure.lines
        .flatMap((l) => (l.split(' : ')[1] ?? '').split(', '))
        .map(numberOf);
      directions.add(second - first);
      expect(numberOf(q.answer.accepted[0] ?? ''), String(seed)).toBe(second + (second - first));
    }
    expect([...directions].sort((a, b) => a - b)).toEqual([-1, 1]);
  });

  it('le détecteur d’explications ne signale plus rien', () => {
    for (const s of skills) {
      const { counts, words } = analyzeSkill(s, ENGLISH_PRESENTATION_CHAPTER);
      expect({ id: s.id, counts, words }).toEqual({ id: s.id, counts: {}, words: [] });
    }
  });

  it('chaque notion prévoit au moins deux erreurs typiques sur l’ensemble des niveaux', () => {
    for (const s of skills) {
      const reasons = new Set<string>();
      for (const level of [1, 2, 3, 4, 5] as const)
        for (let seed = 1; seed <= 20; seed++) for (const t of generate(s.id, level, seed).traps) reasons.add(t.why);
      expect(reasons.size, s.id).toBeGreaterThanOrEqual(2);
    }
  });
});
