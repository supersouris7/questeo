import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { glossaryIssues, sourceIssues } from '../couverture.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource, isAllowedUrl } from '../sources.ts';
import { skillLevels, type Level } from '../types.ts';
import { validateVariants } from '../validate.ts';
import { ENGLISH_FAMILY_CHAPTER } from './famille.ts';
import { FAITS } from './famille-faits.ts';

const { skills } = ENGLISH_FAMILY_CHAPTER;
const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
const questions = (id: string, level: Level) => Array.from({ length: 150 }, (_, i) => generate(id, level, i + 1));

describe('anglais cm1 : famille, corps, vêtements', () => {
  it('5 notions à 5 niveaux, sources valides et mots en gras définis', () => {
    expect(skills.map((s) => s.id)).toEqual([
      'acm1-famille',
      'acm1-have-got',
      'acm1-corps',
      'acm1-vetements',
      'acm1-genitif',
    ]);
    for (const s of skills) {
      expect(skillLevels(s)).toBe(5);
      expect(s.lesson.sources).toContain('lve-cm-2026');
      expect(s.version, s.id).toBe(2);
      expect(s.sens?.length, s.id).toBeGreaterThan(0);
      expect(sensIssues(s), s.id).toEqual([]);
      expect(sourceIssues(s)).toEqual([]);
      expect(glossaryIssues({ skill: s, chapter: ENGLISH_FAMILY_CHAPTER })).toEqual([]);
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

  it('questions valides et niveaux distincts', () => {
    for (const s of skills) {
      const byLevel = LEVELS.map((l) => questions(s.id, l));
      for (const qs of byLevel) expect(validateVariants(qs.slice(0, 20)), s.id).toEqual([]);
      expect(new Set(byLevel.map((qs) => qs.map((q) => q.prompt).join('|'))).size, s.id).toBe(5);
    }
  });

  it('saisie : réponses justes acceptées, chaque piège jugé faux et expliqué ; deux pièges au moins', () => {
    for (const s of skills) {
      const reasons = new Set<string>();
      for (const l of LEVELS)
        for (const q of questions(s.id, l)) {
          for (const t of q.traps) reasons.add(t.why);
          if (q.answer.kind !== 'text') continue;
          for (const text of q.answer.accepted) expect(check(q, { kind: 'text', text }).correct, q.prompt).toBe(true);
          for (const t of q.traps)
            if ('text' in t) expect(check(q, { kind: 'text', text: t.text }).correct, q.prompt).toBe(false);
        }
      expect(reasons.size, s.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('génitif : « James’ » et « James’s » acceptés, apostrophe droite tolérée', () => {
    const q = questions('acm1-genitif', 4).find((x) => x.prompt.includes('James'));
    expect(q).toBeDefined();
    for (const text of ['James’ bag', "James's bag"]) expect(check(q!, { kind: 'text', text }).correct).toBe(true);
    expect(check(q!, { kind: 'text', text: 'James bag' }).correct).toBe(false);
  });

  it('corps, niveau 5 : la réponse reprend le nombre écrit pour la partie demandée', () => {
    for (const q of questions('acm1-corps', 5)) {
      if (q.figure?.kind !== 'document' || q.answer.kind !== 'text') throw new Error('document attendu');
      const [, n, part] = /It’s got (\w+) (\w+)/.exec(q.answer.accepted[0] ?? '') ?? [];
      expect(q.figure.lines).toContain(`My monster has got ${n} ${part}.`);
    }
  });

  it('have got, niveau 2 : aucune proposition « got » seule (phrase juste au prétérit)', () => {
    for (const q of questions('acm1-have-got', 2)) {
      if (q.answer.kind !== 'choice') throw new Error('choix attendu');
      expect(q.answer.options).not.toContain('got');
    }
  });

  it('vêtements, niveaux 3 et 4 : les variantes courantes sont acceptées', () => {
    const accepted = ([3, 4] as const).map(
      (l) =>
        new Set(
          Array.from({ length: 600 }, (_, i) => generate('acm1-vetements', l, i + 1)).flatMap((q) =>
            q.answer.kind === 'text' ? q.answer.accepted : [],
          ),
        ),
    );
    for (const text of ['sweater', 'a sweater', 'a pullover', 'sneakers', 'a tee-shirt', 'a pair of jeans'])
      expect(accepted[0], text).toContain(text);
    for (const text of ['a pink tshirt', 'a pink tee-shirt', 'a pink sweater', 'red sneakers', 'gray trousers'])
      expect(accepted[1], text).toContain(text);
    // En anglais britannique, « pants » désigne un sous-vêtement.
    for (const set of accepted) expect([...set].filter((t) => /\bpants\b/.test(t))).toEqual([]);
  });

  it('vêtements, niveau 4 : pas de consigne « sans a » quand « a pair of » est accepté', () => {
    for (const q of questions('acm1-vetements', 4)) {
      if (q.answer.kind !== 'text') throw new Error('saisie attendue');
      if (q.answer.accepted.some((t) => t.startsWith('a pair of '))) expect(q.prompt).not.toContain('sans « a »');
    }
  });

  it('have got, niveau 5 : réponses avec « got » acceptées, pronom ou prénom, sans fausse équivalence', () => {
    const seen = new Set<string>();
    for (const q of questions('acm1-have-got', 5)) {
      const kid = /« Has (\w+) got/.exec(q.prompt)?.[1] ?? '';
      if (q.answer.kind !== 'text') throw new Error('saisie attendue');
      const yes = q.answer.accepted[0]?.startsWith('Yes') ?? false;
      const he = / (he|she) /.exec(q.answer.accepted[0] ?? '')?.[1] ?? '';
      seen.add(yes ? 'oui' : 'non');
      for (const who of [he, kid])
        for (const text of yes ? [`Yes, ${who} has got.`] : [`No, ${who} hasn’t got.`, `No, ${who} has not got.`])
          expect(check(q, { kind: 'text', text }).correct, text).toBe(true);
      expect(q.steps.join(' ')).not.toMatch(/veut dire (oui|non)/);
    }
    expect(seen.size).toBe(2);
  });

  it('vêtements, niveau 5 : couleur lue sur la ligne du bon enfant, réponse absente du texte', () => {
    for (const q of questions('acm1-vetements', 5)) {
      if (q.figure?.kind !== 'document' || q.answer.kind !== 'text') throw new Error('document attendu');
      const good = q.answer.accepted[0] ?? '';
      const [, colour, garment] = /^a (\w+) (\w+)$/.exec(good) ?? [];
      const kid = /(?:de |d’)([A-Z]\w+) \?/.exec(q.prompt)?.[1] ?? '';
      const lines = q.figure.lines;
      expect(q.prompt).not.toMatch(new RegExp(`\\b${garment}\\b`));
      expect(lines.join(' ')).not.toContain(`${colour} ${garment}`);
      expect(lines.find((l) => l.startsWith(`${kid}:`))).toMatch(new RegExp(`my ${garment} is ${colour}\\b`, 'i'));
      expect(lines.filter((l) => new RegExp(`my ${garment} is`, 'i').test(l))).toHaveLength(2);
    }
  });

  it('le détecteur d’explications ne signale plus rien', () => {
    for (const s of skills) {
      const { counts, words } = analyzeSkill(s, ENGLISH_FAMILY_CHAPTER);
      expect({ id: s.id, counts, words }).toEqual({ id: s.id, counts: {}, words: [] });
    }
  });

  it('chaque explication finit par la réponse en gras', () => {
    for (const s of skills)
      for (const l of LEVELS)
        for (const q of questions(s.id, l)) {
          const bold = /\*\*(.+?)\*\*/.exec(q.steps.at(-1) ?? '')?.[1] ?? '';
          const a = q.answer;
          const good =
            a.kind === 'text'
              ? a.accepted[0]
              : a.kind === 'choice'
                ? a.options[a.correct]
                : a.kind === 'order'
                  ? a.correct.map((i) => a.items[i]).join(' ')
                  : a.kind === 'match'
                    ? `${a.left[0]} = ${a.right[a.pairs[0] ?? 0]}`
                    : undefined;
          expect(bold, `${s.id} ${l} ${q.prompt}`).toContain(good);
        }
  });

  it('écritures correctes acceptées : petits noms, forme courte, chiffres, couleur ajoutée', () => {
    const accepted = (id: string, level: Level) =>
      new Set(
        Array.from({ length: 600 }, (_, i) => generate(id, level, i + 1)).flatMap((q) =>
          q.answer.kind === 'text' ? q.answer.accepted : [],
        ),
      );
    for (const text of ['my mother', 'mummy', 'daddy', 'the uncle'])
      expect(accepted('acm1-famille', 3), text).toContain(text);
    for (const text of ['has', 'have', '’s', '’ve']) expect(accepted('acm1-have-got', 3), text).toContain(text);
    for (const text of ['my mother’s dog', 'Tom’s bicycle', 'Ana’s sweater'])
      expect(accepted('acm1-genitif', 3), text).toContain(text);
    expect([...accepted('acm1-corps', 5)].some((t) => /^It’s got [2-5] /.test(t))).toBe(true);
    expect([...accepted('acm1-vetements', 4)].some((t) => /^a pair of \w+ jeans$/.test(t))).toBe(true);
    expect([...accepted('acm1-genitif', 5)].some((t) => /^\w+’s (red|blue|green|black) \w+$/.test(t))).toBe(true);
  });

  it('saisie de la famille : l’énoncé ne montre jamais le mot attendu', () => {
    for (const q of questions('acm1-famille', 3)) {
      if (q.answer.kind !== 'text') throw new Error('saisie attendue');
      expect(q.prompt).not.toMatch(new RegExp(`\\b${q.answer.accepted[0]}\\b`));
    }
  });

  it('indice de saisie : le tiret de « t-shirt » ne compte pas comme une lettre', () => {
    const q = Array.from({ length: 600 }, (_, i) => generate('acm1-vetements', 3, i + 1)).find(
      (x) => x.answer.kind === 'text' && x.answer.accepted[0] === 't-shirt',
    );
    expect(q?.hint).toContain('6 lettres');
  });
});
