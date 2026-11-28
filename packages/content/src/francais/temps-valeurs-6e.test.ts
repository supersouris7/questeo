import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { SUBJECT_GLOSSARIES, boldTerms, isDefined } from '../glossaires.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource } from '../sources.ts';
import { validateVariants } from '../validate.ts';
import type { Level, Question } from '../types.ts';
import { passeSimple } from './passe-simple.donnees.ts';
import {
  ACCORDEES,
  CONTES,
  DECALEES,
  DOUBLES,
  ENONCES_DISCOURS,
  ENONCES_RECIT,
  FAITS_VALEURS_TEMPS,
  MESSAGES,
  PRESENTS_DATES,
  PRESENTS_ENONCIATION,
  PRESENTS_NARRATION,
  PRESENTS_VERITE,
  RECITS_PRESENT,
  SCENES,
  TROUS,
  VERS_MESSAGE,
  VERS_RECIT,
  tempsDuRole,
} from './temps-valeurs-6e.donnees.ts';
import { F6_VALEURS_TEMPS } from './temps-valeurs-6e.ts';
import { faitTemps } from './temps.donnees.ts';

const skills = F6_VALEURS_TEMPS;
const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
const tirages = (id: string, level: Level) => Array.from({ length: 200 }, (_, seed) => generate(id, level, seed));
const compte = (texte: string, mot: string) =>
  [...texte.matchAll(new RegExp(`(?<![\\p{L}])${mot}(?![\\p{L}])`, 'giu'))].length;

describe('francais 6e — valeurs des temps', () => {
  it('le chapitre compte les quatre notions du lot, à 5 niveaux, avec un sens sourcé', () => {
    expect(skills.map((s) => s.id)).toEqual([
      'f6-temps-chronologique-verbal',
      'f6-valeurs-present',
      'f6-imparfait-passe-simple',
      'f6-discours-recit',
    ]);
    for (const s of skills) {
      expect(s.levels).toBe(5);
      expect(s.sens?.length, s.id).toBeGreaterThanOrEqual(2);
      expect(sensIssues(s), s.id).toEqual([]);
    }
  });

  it('faits et notions citent des sources du registre ; les termes en gras sont définis', () => {
    expect(new Set(FAITS_VALEURS_TEMPS.map((f) => f.id)).size).toBe(FAITS_VALEURS_TEMPS.length);
    for (const f of FAITS_VALEURS_TEMPS) {
      expect(getSource(f.source), f.id).toBeDefined();
      expect(f.citation.trim().length, f.id).toBeGreaterThan(7);
    }
    for (const s of skills) {
      for (const id of s.lesson.sources ?? []) expect(getSource(id), id).toBeDefined();
      for (const term of s.lesson.memo.flatMap(boldTerms))
        expect(isDefined(term, SUBJECT_GLOSSARIES.francais ?? []), term).toBe(true);
    }
  });

  it('questions valides et distinctes aux 5 niveaux, réponses acceptées, pièges refusés et expliqués', () => {
    for (const s of skills) {
      let niveauxAvecPieges = 0;
      const enonces = new Set<string>();
      for (const level of LEVELS) {
        const qs = tirages(s.id, level);
        expect(validateVariants(qs), `${s.id} N${level}`).toEqual([]);
        if (qs.every((q) => q.traps.length >= 2)) niveauxAvecPieges++;
        enonces.add(qs.map((q) => q.prompt).join('|'));
        for (const q of qs) {
          expect(JSON.stringify(q), `${s.id} N${level}`).not.toContain('undefined');
          if (q.answer.kind !== 'text') continue;
          for (const text of q.answer.accepted) expect(check(q, { kind: 'text', text }).correct).toBe(true);
        }
      }
      expect(niveauxAvecPieges, s.id).toBeGreaterThanOrEqual(2);
      expect(enonces.size, s.id).toBe(5);
    }
  });

  it('le détecteur de lisibilité ne signale rien', () => {
    for (const s of skills) {
      const report = analyzeSkill(s, { id: 'f6-valeurs-temps', subject: 'francais', grade: '6e' });
      expect({ id: s.id, counts: report.counts }).toEqual({ id: s.id, counts: {} });
    }
  });
});

describe('données des valeurs des temps', () => {
  it('chaque verbe étudié est écrit dans sa phrase', () => {
    for (const x of [...ACCORDEES, ...DECALEES, ...MESSAGES.flatMap((m) => m.phrases)])
      expect(compte(x.phrase, x.verbe), x.phrase).toBe(1);
    for (const x of [...ENONCES_DISCOURS, ...ENONCES_RECIT]) expect(compte(x.phrase, x.verbe), x.phrase).toBe(1);
    for (const x of [...PRESENTS_ENONCIATION, ...PRESENTS_VERITE, ...PRESENTS_NARRATION, ...PRESENTS_DATES])
      expect(compte(x.phrase, x.verbe), x.phrase).toBe(1);
    for (const r of [...RECITS_PRESENT, ...SCENES])
      for (const [lettre, verbe] of r.verbes) expect(r.lignes.join(' '), r.titre).toContain(`${verbe} (${lettre})`);
  });

  it('temps chronologique : les cas décalés sont des présents qui parlent d’une autre époque', () => {
    for (const x of ACCORDEES) {
      const attendue = { présent: 'présent', imparfait: 'passé', 'passé composé': 'passé', futur: 'futur' }[x.temps];
      expect(x.epoque, x.phrase).toBe(attendue);
    }
    for (const x of DECALEES) {
      expect(x.temps).toBe('présent');
      expect(x.epoque, x.phrase).not.toBe('présent');
    }
  });

  it('textes du présent et scènes : l’ordre des réponses n’est pas toujours le même', () => {
    expect(new Set(RECITS_PRESENT.map((r) => r.verbes.map((v) => v[2]).join())).size).toBe(6);
    expect(new Set(SCENES.map((s) => s.verbes.map((v) => v[2]).join())).size).toBeGreaterThanOrEqual(5);
  });

  it('scènes : les verbes du discours sont dans les paroles, ceux du récit hors des guillemets', () => {
    for (const s of SCENES)
      for (const [lettre, , ensemble] of s.verbes) {
        const ligne = s.lignes.find((l) => l.includes(`(${lettre})`)) ?? '';
        const paroles = [...ligne.matchAll(/«[^»]*»/g)].some((m) => m[0].includes(`(${lettre})`));
        expect(paroles, ligne).toBe(ensemble === 'discours');
      }
  });

  it('formes conjuguées : toutes relevées sur les pages de conjugaison', () => {
    for (const x of [...VERS_MESSAGE, ...VERS_RECIT, ...SCENES.map((s) => s.message)])
      expect(faitTemps(`compose-${x.verbe}`)).toBeDefined();
    for (const x of [...TROUS, ...CONTES.flatMap((c) => c.trous)]) {
      expect(passeSimple(x.verbe, x.personne).length).toBeGreaterThan(1);
      expect(faitTemps(`imparfait-${x.verbe}`)).toBeDefined();
    }
    for (const x of DOUBLES) expect(passeSimple(x.survient.verbe, x.survient.personne).length).toBeGreaterThan(1);
  });

  it('chaque conte mêle ce qui dure (imparfait) et deux événements (passé simple)', () => {
    for (const c of CONTES) {
      const temps = c.trous.map((t) => tempsDuRole(t.role));
      expect(
        temps.filter((t) => t === 'passé simple'),
        c.titre,
      ).toHaveLength(2);
    }
  });
});

describe('réponses des niveaux', () => {
  const saisir = (q: Question, answers: string[]) => check(q, { kind: 'cloze', answers }).correct;

  it('temps chronologique N4 : écritures avec article ou sans accent acceptées', () => {
    const q = tirages('f6-temps-chronologique-verbal', 4).find(
      (x) =>
        x.answer.kind === 'cloze' && x.answer.blanks[1]?.mode === 'text' && x.answer.blanks[1].accepted[0] === 'futur',
    );
    if (!q) throw new Error('aucun cas au futur');
    expect(saisir(q, ['Le présent', 'l’avenir'])).toBe(true);
    expect(saisir(q, ['present', 'futur'])).toBe(true);
    expect(saisir(q, ['futur', 'futur'])).toBe(false);
  });

  it('valeurs du présent N4 : nom court ou complet accepté, autre valeur refusée', () => {
    for (const q of tirages('f6-valeurs-present', 4)) {
      if (q.answer.kind !== 'text') throw new Error('forme inattendue');
      const court = q.answer.accepted[0] ?? '';
      for (const text of [court, `présent de ${court}`.replace('de énonciation', 'd’énonciation')])
        expect(check(q, { kind: 'text', text }).correct, text).toBe(true);
      for (const t of q.traps) expect('text' in t && check(q, { kind: 'text', text: t.text }).correct).toBe(false);
    }
  });

  it('imparfait et passé simple : une seule forme juste', () => {
    for (const q of tirages('f6-imparfait-passe-simple', 3)) {
      if (q.answer.kind !== 'text') throw new Error('forme inattendue');
      expect(q.answer.accepted).toHaveLength(1);
      expect(q.traps.length).toBeGreaterThanOrEqual(2);
    }
    for (const q of tirages('f6-imparfait-passe-simple', 5)) {
      if (q.answer.kind !== 'cloze') throw new Error('forme inattendue');
      expect(q.answer.blanks).toHaveLength(4);
      expect(q.answer.parts).toHaveLength(5);
    }
  });

  it('imparfait et passé simple N4 : la phrase donne les indices, la consigne ne donne pas les rôles', () => {
    for (const q of tirages('f6-imparfait-passe-simple', 4)) {
      if (q.answer.kind !== 'cloze') throw new Error('forme inattendue');
      expect(q.prompt).not.toMatch(/en cours|survient/);
      expect(q.answer.parts[1]).toContain('quand, soudain, ');
      const x = DOUBLES.find((d) => q.prompt.includes(`« ${d.cours.verbe} » et « ${d.survient.verbe} »`));
      expect(x, q.prompt).toBeDefined();
      expect(q.answer.blanks).toHaveLength(2);
    }
  });

  it('niveau 5 : ni liste ni proposition, tout s’écrit', () => {
    for (const s of skills)
      for (const q of tirages(s.id, 5)) {
        if (q.answer.kind !== 'cloze') throw new Error('forme inattendue');
        expect(
          q.answer.blanks.every((b) => b.mode === 'text'),
          s.id,
        ).toBe(true);
      }
  });

  it('QCM : la dernière bulle met en gras la réponse sans espace parasite', () => {
    for (const s of skills)
      for (const level of [1, 2] as const)
        for (const q of tirages(s.id, level)) expect(q.steps.at(-1)).not.toMatch(/\s\*\*\.$/);
  });

  it('discours et récit N3 et N4 : du passé simple au passé composé, puis l’inverse', () => {
    for (const q of tirages('f6-discours-recit', 3)) {
      if (q.answer.kind !== 'text') throw new Error('forme inattendue');
      expect(q.answer.accepted[0]).toMatch(/^(a|ont) /);
    }
    for (const q of tirages('f6-discours-recit', 4)) {
      if (q.answer.kind !== 'text') throw new Error('forme inattendue');
      expect(q.answer.accepted[0]).not.toContain(' ');
    }
  });

  it('QCM : la bonne réponse n’est pas toujours la plus longue ni la plus courte', () => {
    for (const s of skills)
      for (const level of [1, 2] as const) {
        const qs = tirages(s.id, level).filter((q) => q.answer.kind === 'choice');
        const extreme = (f: (a: number, b: number) => boolean) =>
          qs.filter((q) => {
            if (q.answer.kind !== 'choice') return false;
            const { options, correct } = q.answer;
            const n = options[correct]?.length ?? 0;
            return options.every((o, i) => i === correct || f(n, o.length));
          }).length / Math.max(1, qs.length);
        expect(
          extreme((a, b) => a > b),
          `${s.id} N${level} longue`,
        ).toBeLessThan(0.75);
        expect(
          extreme((a, b) => a < b),
          `${s.id} N${level} courte`,
        ).toBeLessThan(0.75);
      }
  });
});
