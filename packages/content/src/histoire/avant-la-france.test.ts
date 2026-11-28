import { describe, expect, it } from 'vitest';
import { getSource } from '../sources.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { createRng } from '../rng.ts';
import { sensIssues } from '../sens.ts';
import { NOTIONS, SKILLS, SOURCE } from './avant-la-france.ts';

describe('histoire cm1 — Et avant la France ?', () => {
  it('cite une source du registre et une citation exacte pour chaque fait', () => {
    expect(getSource(SOURCE)).toBeDefined();
    for (const n of NOTIONS) {
      const all = [...n.faits, ...n.libres, ...n.docs.flatMap((d) => d.qs)];
      for (const f of all) expect(f.quote.trim().length, n.id).toBeGreaterThan(20);
    }
  });

  it('prévoit au moins deux erreurs typiques expliquées par fait', () => {
    for (const n of NOTIONS) {
      for (const f of n.faits) {
        expect(f.wrong.length, n.id).toBeGreaterThanOrEqual(3);
        for (const w of f.wrong) expect(w.why.trim().length, n.id).toBeGreaterThan(0);
      }
      for (const l of n.libres) expect(l.traps.length, n.id).toBeGreaterThanOrEqual(2);
      for (const d of n.docs) for (const q of d.qs) expect(q.traps.length, n.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('propose assez de matière pour varier les niveaux', () => {
    for (const n of NOTIONS) {
      expect(n.faits.length, n.id).toBeGreaterThanOrEqual(4);
      expect(n.paires3.length, n.id).toBe(3);
      expect(n.paires5.length, n.id).toBe(5);
      expect(n.libres.length, n.id).toBeGreaterThanOrEqual(3);
      expect(n.docs.flatMap((d) => d.qs).length, n.id).toBeGreaterThanOrEqual(6);
    }
  });

  it('repasse : version 2, un sens par notion, quatre types différents', () => {
    expect(SKILLS.map((s) => s.version)).toEqual([2, 2, 2, 2]);
    for (const s of SKILLS) expect(sensIssues(s), s.id).toEqual([]);
    expect(new Set(SKILLS.map((s) => s.sens?.[0]?.type)).size).toBe(4);
  });

  it('le détecteur ne signale plus rien', () => {
    for (const s of SKILLS) {
      const report = analyzeSkill(s, { id: 'hcm1-avant-la-france', subject: 'histoire', grade: 'cm1' });
      expect({ id: s.id, counts: report.counts, words: report.words }).toEqual({ id: s.id, counts: {}, words: [] });
    }
  });

  it('la dernière bulle donne la réponse en gras', () => {
    for (const s of SKILLS) {
      for (const level of [1, 2, 3, 4, 5] as const) {
        for (let seed = 1; seed <= 30; seed++) {
          const q = s.generate(createRng(seed), level);
          expect(q.steps.at(-1), `${s.id} N${level}`).toContain('**');
        }
      }
    }
  });

  it('niveau 5 : réponse à écrire, absente du document, de la consigne et de l’indice', () => {
    for (const n of NOTIONS) {
      for (const d of n.docs) {
        for (const q of d.qs) {
          const shown = ` ${[...d.lines, d.title, q.q, q.indice].join(' ').toLowerCase()} `;
          const answer = (q.accepted[0] ?? '').toLowerCase();
          expect(shown, `${n.id} : ${answer}`).not.toMatch(new RegExp(`(?<!\\p{L})${answer}(?!\\p{L})`, 'u'));
        }
      }
    }
  });

  it('une réponse écrite n’est jamais aussi un piège', () => {
    for (const n of NOTIONS) {
      for (const l of [...n.libres, ...n.docs.flatMap((d) => d.qs)]) {
        const accepted = new Set(l.accepted.map((a) => a.toLowerCase()));
        expect(
          l.traps.filter((t) => accepted.has(t.text.toLowerCase())),
          n.id,
        ).toEqual([]);
      }
    }
  });
});
