import { describe, expect, it } from 'vitest';
import { check } from '../check.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { createRng } from '../rng.ts';
import { sensIssues } from '../sens.ts';
import { getSource } from '../sources.ts';
import type { Level, Question } from '../types.ts';
import { validateVariants } from '../validate.ts';
import { PREUVES } from './se-reperer-sources.ts';
import { EVENEMENTS, SKILLS, centuryOf, toRoman } from './se-reperer.ts';

const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

const questions = (id: string, level: Level, count = 200): Question[] => {
  const s = SKILLS.find((x) => x.id === id)!;
  return Array.from({ length: count }, (_, seed) => ({
    traps: [],
    targetSeconds: 30,
    ...s.generate(createRng(seed), level),
    skillId: id,
    level,
    seed,
  }));
};

describe('histoire cm1 — Se repérer dans le temps', () => {
  it('propose les quatre notions du référentiel, en 5 niveaux', () => {
    expect(SKILLS.map((s) => s.id)).toEqual([
      'hcm1-siecles-romains',
      'hcm1-frise-chronologique',
      'hcm1-avant-apres-jc',
      'hcm1-ordonner-evenements',
    ]);
    for (const s of SKILLS) expect(s.levels, s.id).toBe(5);
  });

  it('cite pour chaque fait une source du registre et une citation exacte', () => {
    for (const p of Object.values(PREUVES)) {
      expect(getSource(p.source), p.source).toBeDefined();
      expect(p.quote.trim().length, p.source).toBeGreaterThan(10);
    }
    for (const s of SKILLS) for (const id of s.lesson.sources ?? []) expect(getSource(id), id).toBeDefined();
  });

  it('produit des questions valides et différentes à chaque niveau', { timeout: 60_000 }, () => {
    for (const s of SKILLS) {
      const prompts = LEVELS.map((level) => {
        const qs = questions(s.id, level);
        expect(validateVariants(qs), `${s.id} niveau ${level}`).toEqual([]);
        return [...new Set(qs.map((q) => q.prompt))].sort().join('|');
      });
      expect(new Set(prompts).size, s.id).toBe(5);
    }
  });

  it('prévoit au moins deux erreurs typiques expliquées pour chaque choix et chaque saisie', () => {
    for (const s of SKILLS) {
      for (const q of LEVELS.flatMap((level) => questions(s.id, level))) {
        if (q.answer.kind !== 'choice' && q.answer.kind !== 'text') continue;
        expect(q.traps.length, q.prompt).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('écrit les chiffres romains et calcule les siècles', () => {
    expect([1, 4, 6, 9, 11, 13, 14, 18, 19, 21].map(toRoman)).toEqual([
      'I',
      'IV',
      'VI',
      'IX',
      'XI',
      'XIII',
      'XIV',
      'XVIII',
      'XIX',
      'XXI',
    ]);
    expect([1, 100, 101, 800, 1789, 1800, 1801, 2000, 2001].map(centuryOf)).toEqual([1, 1, 2, 8, 18, 18, 19, 20, 21]);
  });

  it('juge juste le siècle écrit en chiffres romains ou arabes, et faux le siècle voisin', () => {
    for (const q of questions('hcm1-siecles-romains', 4)) {
      const year = Number(/année (\d+)/.exec(q.prompt)![1]);
      const c = Math.floor((year - 1) / 100) + 1;
      const answer = (text: string) => check(q, { kind: 'text', text }).correct;
      expect(answer(`${toRoman(c)}e siècle`), q.prompt).toBe(true);
      expect(answer(`${c}e`), q.prompt).toBe(true);
      expect(answer(`${c + 1}e`), q.prompt).toBe(false);
      expect(answer(`${c - 1}e`), q.prompt).toBe(false);
    }
  });

  it('avant J.-C., la date la plus ancienne est la plus grande', () => {
    for (const q of questions('hcm1-avant-apres-jc', 2)) {
      if (q.answer.kind !== 'choice') continue;
      const value = (label: string) => (label.includes('av.') ? -1 : 1) * Number(/\d+/.exec(label)![0]);
      expect(value(q.answer.options[q.answer.correct]!), q.prompt).toBe(Math.min(...q.answer.options.map(value)));
    }
  });

  it('niveau 5 de la frise : repères désignés par leur nom, frise variable, années en 00 au bon siècle', () => {
    const qs = questions('hcm1-frise-chronologique', 5);
    expect(new Set(qs.map((q) => JSON.stringify([q.prompt, q.figure]))).size).toBeGreaterThanOrEqual(20);
    for (const q of qs) {
      const figure = q.figure as unknown as { lines: string[] };
      const marks = new Map(
        figure.lines.flatMap((l) => {
          const m = /^│ (\d+) : (.+)$/.exec(l);
          return m ? [[m[2]!, Number(m[1])] as const] : [];
        }),
      );
      expect(marks.size).toBeGreaterThanOrEqual(4);
      expect(marks.size).toBeLessThanOrEqual(6);
      // Jamais de proposition au niveau 5 : le niveau 4 est déjà en saisie.
      if (q.answer.kind !== 'text') throw new Error('saisie attendue');
      expect(q.prompt).not.toMatch(/\d/);
      const years = [...marks.values()];
      const named = [...q.prompt.matchAll(/« ([^»]+) »/g)].map((m) => marks.get(m[1]!)!);
      const roman = /repère du ([IVX]+)e siècle/.exec(q.prompt)?.[1];
      if (roman) {
        const c = Array.from({ length: 21 }, (_, i) => i + 1).find((n) => toRoman(n) === roman)!;
        const inCentury = years.filter((y) => centuryOf(y) === c);
        expect(inCentury, q.prompt).toHaveLength(1);
        expect(years).toContain((c - 1) * 100);
        named.push(inCentury[0]!);
      }
      expect(named, q.prompt).toHaveLength(2);
      const gap = Math.abs(named[1]! - named[0]!);
      expect(gap).toBeGreaterThan(0);
      expect(q.answer.accepted[0], q.prompt).toBe(String(gap));
    }
  });

  it('frise : une durée écrite en lettres est acceptée comme en chiffres', () => {
    const words: Record<number, string> = { 3: 'trois', 4: 'quatre', 6: 'six', 9: 'neuf' };
    const seen = new Set<string>();
    for (const q of questions('hcm1-frise-chronologique', 4)) {
      if (q.answer.kind !== 'text') throw new Error('saisie attendue');
      const n = Number(q.answer.accepted[0]);
      const unit = q.prompt.includes('siècles') ? 'siècles' : 'ans';
      const word = words[unit === 'ans' ? n / 100 : n];
      if (!word) continue;
      const text = unit === 'ans' ? `${word} cents ans` : `${word} siècles`;
      expect(check(q, { kind: 'text', text }).correct, `${q.prompt} ${text}`).toBe(true);
      seen.add(unit);
    }
    expect([...seen].sort()).toEqual(['ans', 'siècles']);
    // Au niveau 5 la durée est quelconque : les trois orthographes d’un nombre composé sont admises.
    const tens = ['vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
    const units = ['deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const long = questions('hcm1-frise-chronologique', 5).find(
      (q) => q.answer.kind === 'text' && /^4[2-6][2-9]$/.test(q.answer.accepted[0]!),
    )!;
    if (long.answer.kind !== 'text') throw new Error('saisie attendue');
    const [, t, u] = long.answer.accepted[0]!;
    const end = [tens[Number(t) - 2]!, units[Number(u) - 2]!];
    for (const text of [
      `quatre-cent-${end.join('-')} ans`,
      `quatre cent ${end.join('-')} ans`,
      `quatre cent ${end.join(' ')}`,
    ]) {
      expect(check(long, { kind: 'text', text }).correct, text).toBe(true);
    }
  });

  it('niveau 5 avant J.-C. : les réponses se déduisent des indices du texte', () => {
    const modes = new Set<string>();
    for (const q of questions('hcm1-avant-apres-jc', 5)) {
      const { lines } = q.figure as unknown as { lines: string[] };
      const years = new Map<string, number>();
      for (let pass = 0; pass < 4; pass++) {
        for (const l of lines) {
          const given = /^(.+) date de (\d+) av\. J\.-C\.$/.exec(l);
          if (given) years.set(given[1]!.toLowerCase(), Number(given[2]));
          const rel = /^On a fabriqué (.+?) (\d+) ans (avant|après) (.+)\.$/.exec(l);
          const ref = rel && years.get(rel[4]!);
          if (rel && ref) years.set(rel[1]!, ref + (rel[3] === 'avant' ? 1 : -1) * Number(rel[2]));
        }
      }
      expect(years.size, lines.join(' ')).toBe(4);
      expect(Math.min(...years.values())).toBeGreaterThan(0);
      modes.add(q.answer.kind);
      if (q.answer.kind === 'order') {
        const { items, correct } = q.answer;
        const ordered = correct.map((i) => years.get(items[i]!.toLowerCase())!);
        expect(ordered).toEqual([...ordered].sort((a, b) => b - a));
        expect(new Set(ordered).size).toBe(4);
      } else if (q.answer.kind === 'text') {
        const name = /a-t-on fabriqué (.+) \?$/.exec(q.prompt)![1]!;
        const year = years.get(name)!;
        const expected = q.prompt.includes('siècle') ? `${toRoman(centuryOf(year))}e` : String(year);
        expect(check(q, { kind: 'text', text: expected }).correct, q.prompt).toBe(true);
      }
    }
    expect([...modes].sort()).toEqual(['order', 'text']);
  });

  it('niveau 5 ordonner : cinq événements ou plus, sans date chiffrée, un seul ordre', () => {
    const repere = ['Charlemagne', 'Louis IX', 'La Révolution', 'Napoléon'];
    const bounds = [800, 1250, 1789, 1804];
    for (const q of questions('hcm1-ordonner-evenements', 5)) {
      if (q.answer.kind !== 'order') throw new Error('ordre attendu');
      const { lines } = q.figure as unknown as { lines: string[] };
      expect(lines.length).toBeGreaterThanOrEqual(5);
      expect(lines.join(' ')).not.toMatch(/\d/);
      const time = (label: string) => {
        const known = repere.findIndex((r) => label.startsWith(r));
        if (known >= 0) return bounds[known]!;
        const line = lines.find((l) => l.includes(`inventé : « ${label} »`))!;
        const roman = /au ([IVX]+)e siècle/.exec(line)?.[1];
        if (roman) return Array.from({ length: 21 }, (_, i) => i + 1).find((n) => toRoman(n) === roman)! * 100 - 50;
        if (line.includes('avant le couronnement')) return 650;
        return line.includes('après le couronnement') ? 1050 : 1500;
      };
      const { items, correct } = q.answer;
      const ordered = correct.map((i) => time(items[i]!));
      expect(ordered, lines.join(' ')).toEqual([...ordered].sort((a, b) => a - b));
      expect(new Set(ordered).size).toBe(items.length);
    }
  });

  it('repasse : mêmes identifiants, version 2, un sens conforme par notion', () => {
    for (const s of SKILLS) {
      expect(s.version, s.id).toBe(2);
      expect(s.sens?.length, s.id).toBe(1);
      expect(sensIssues(s), s.id).toEqual([]);
    }
  });

  it('le détecteur ne signale plus rien', () => {
    for (const s of SKILLS) {
      const report = analyzeSkill(s, { id: 'hcm1-se-reperer', subject: 'histoire', grade: 'cm1' });
      expect({ id: s.id, counts: report.counts, words: report.words }).toEqual({ id: s.id, counts: {}, words: [] });
    }
  });

  it('la dernière bulle donne la réponse en gras, et l’indice ne la souffle pas', () => {
    for (const s of SKILLS) {
      for (const q of LEVELS.flatMap((level) => questions(s.id, level))) {
        expect(q.steps.at(-1), q.prompt).toContain('**');
        if (q.answer.kind !== 'choice') continue;
        const right = q.answer.options[q.answer.correct]!.toLowerCase();
        expect(q.hint.toLowerCase(), q.prompt).not.toContain(right);
      }
    }
  });

  it('chaque calcul écrit dans les explications est juste', () => {
    let checked = 0;
    for (const s of SKILLS) {
      for (const q of LEVELS.flatMap((level) => questions(s.id, level))) {
        for (const [, left, result] of q.steps.join(' ').matchAll(/(\d+(?: [+−] \d+)+) = (\d+)/g)) {
          const [first, ...rest] = left!.split(' ');
          let total = Number(first);
          for (let i = 0; i < rest.length; i += 2) total += (rest[i] === '+' ? 1 : -1) * Number(rest[i + 1]);
          expect(total, q.steps.join(' ')).toBe(Number(result));
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('niveau 5 des siècles : saisie sans proposition, siècle de l’objet le plus ancien ou le plus récent', () => {
    for (const q of questions('hcm1-siecles-romains', 5)) {
      expect(q.answer.kind).toBe('text');
      const { lines } = q.figure as unknown as { lines: string[] };
      const years = lines.map((l) => Number(/(\d+)\.$/.exec(l)![1]));
      const wanted = q.prompt.includes('récent') ? Math.max(...years) : Math.min(...years);
      const c = Math.ceil(wanted / 100);
      expect(check(q, { kind: 'text', text: `${toRoman(c)}e siècle` }).correct, lines.join(' ')).toBe(true);
      expect(check(q, { kind: 'text', text: `${toRoman(c + 1)}e siècle` }).correct).toBe(false);
    }
  });

  it('accepte les écritures justes d’un siècle et d’une durée', () => {
    for (const q of questions('hcm1-siecles-romains', 4)) {
      const c = centuryOf(Number(/année (\d+)/.exec(q.prompt)![1]));
      for (const text of [`le ${toRoman(c)}e siècle`, `au ${c}e siècle`]) {
        if (c > 1) expect(check(q, { kind: 'text', text }).correct, `${q.prompt} ${text}`).toBe(true);
      }
    }
    const fifteen = questions('hcm1-siecles-romains', 4).find((q) => q.steps.at(-1)!.includes('XVe '))!;
    expect(check(fifteen, { kind: 'text', text: 'Quinzième siècle' }).correct).toBe(true);
    for (const q of questions('hcm1-frise-chronologique', 4)) {
      if (q.answer.kind !== 'text') continue;
      const n = q.answer.accepted[0]!;
      const unit = q.prompt.includes('siècles') ? 'siècles' : 'ans';
      expect(check(q, { kind: 'text', text: `${n} ${unit}` }).correct, q.prompt).toBe(true);
    }
  });

  it('range les événements du plus ancien au plus récent', () => {
    const labels = EVENEMENTS.map((e) => e.label);
    expect([...EVENEMENTS].sort((a, b) => a.t - b.t).map((e) => e.label)).toEqual(labels);
    for (const level of [3, 4] as const) {
      for (const q of questions('hcm1-ordonner-evenements', level)) {
        if (q.answer.kind !== 'order') continue;
        const { items, correct } = q.answer;
        const ranks = correct.map((i) => labels.findIndex((l) => items[i]!.startsWith(l)));
        expect(ranks, q.prompt).toEqual([...ranks].sort((a, b) => a - b));
        expect(ranks).not.toContain(-1);
      }
    }
  });
});
