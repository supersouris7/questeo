import { describe, expect, it } from 'vitest';
import { getSource } from '../sources.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { createRng } from '../rng.ts';
import { sensIssues } from '../sens.ts';
import { NOTIONS, SKILLS, SOURCE } from './le-temps-des-rois.ts';

describe('histoire cm1 — Le temps des rois', () => {
  it('cite une source du registre et une citation exacte pour chaque fait', () => {
    expect(getSource(SOURCE)).toBeDefined();
    for (const n of NOTIONS) {
      const all = [...n.faits, ...n.libres, ...n.docs.flatMap((d) => d.qs)];
      for (const f of all) {
        expect(f.quote.trim().length, n.id).toBeGreaterThan(20);
        expect(getSource(f.source ?? ''), `${n.id} : ${f.source}`).toBeDefined();
      }
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

  it('repasse : mêmes identifiants, version 2, un sens par notion', () => {
    expect(SKILLS.map((s) => s.id)).toEqual(['hcm1-louis-ix', 'hcm1-francois-ier', 'hcm1-henri-iv', 'hcm1-louis-xiv']);
    expect(SKILLS.map((s) => s.version)).toEqual([2, 2, 2, 2]);
    for (const s of SKILLS) expect(sensIssues(s), s.id).toEqual([]);
  });

  it('le détecteur ne signale plus rien', () => {
    for (const s of SKILLS) {
      const report = analyzeSkill(s, { id: 'hcm1-le-temps-des-rois', subject: 'histoire', grade: 'cm1' });
      expect({ id: s.id, counts: report.counts, words: report.words }).toEqual({ id: s.id, counts: {}, words: [] });
    }
  });

  it('la dernière bulle donne la réponse en gras', () => {
    for (const s of SKILLS) {
      for (const level of [1, 2, 3, 4, 5] as const) {
        for (let seed = 1; seed <= 30; seed++) {
          expect(s.generate(createRng(seed), level).steps.at(-1), `${s.id} N${level}`).toContain('**');
        }
      }
    }
  });

  it('saisie : ni la consigne ni l’indice ne contiennent une réponse acceptée', () => {
    for (const n of NOTIONS) {
      const written = [
        ...n.libres,
        ...n.docs.flatMap((d) => d.qs.map((q) => ({ ...q, q: [...d.lines, d.title, q.q].join(' ') }))),
      ];
      for (const l of written) {
        const shown = `${l.q} ${l.indice}`.toLowerCase();
        for (const answer of l.accepted) {
          // « Louis XIV » ne doit pas être confondu avec « Louis XIII » : mot entier seulement.
          expect(shown, `${n.id} : ${answer}`).not.toMatch(
            new RegExp(`(?<!\\p{L})${answer.toLowerCase().replace(/[()]/g, '\\$&')}(?!\\p{L})`, 'u'),
          );
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
