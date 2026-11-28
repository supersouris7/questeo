import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource } from '../sources.ts';
import { FCM1_COMPLEMENTS } from './complements.ts';
import { ENTREES, FAITS_COMPL, MANIPS, base, deux, devant, resultat } from './complements.donnees.ts';

const skills = FCM1_COMPLEMENTS;

describe('francais cm1 — les compléments', () => {
  it('le chapitre compte les quatre notions du lot, à 5 niveaux', () => {
    expect(skills.map((s) => s.id)).toEqual([
      'fcm1-objet-circonstanciel',
      'fcm1-cod-coi',
      'fcm1-groupes-circonstanciels',
      'fcm1-manipulations',
    ]);
    for (const s of skills) expect(s.levels).toBe(5);
  });

  it('chaque fait cite une source du registre et une citation non vide', () => {
    for (const f of FAITS_COMPL) {
      expect(getSource(f.source), f.id).toBeDefined();
      expect(f.citation.trim().length, f.id).toBeGreaterThan(10);
    }
  });

  it('au moins deux erreurs typiques expliquées par notion', () => {
    for (const s of skills) {
      const withTraps = new Set<number>();
      for (let level = 1; level <= 5; level++)
        for (let seed = 0; seed < 20; seed++) {
          const q = generate(s.id, level as 1, seed);
          if (q.traps.length >= 2) withTraps.add(level);
          for (const t of q.traps) expect(t.why.trim().length).toBeGreaterThan(5);
        }
      expect(withTraps.size, s.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('la réponse attendue est juste et chaque piège est faux, à tous les niveaux', () => {
    for (const s of skills)
      for (let level = 1; level <= 5; level++)
        for (let seed = 0; seed < 20; seed++) {
          const q = generate(s.id, level as 1, seed);
          if (q.answer.kind === 'choice')
            expect(check(q, { kind: 'choice', index: q.answer.correct }).correct).toBe(true);
          if (q.answer.kind === 'text') {
            for (const a of q.answer.accepted)
              expect(check(q, { kind: 'text', text: a }).correct, `${s.id} N${level} g${seed}`).toBe(true);
            for (const t of q.traps)
              if ('text' in t) expect(check(q, { kind: 'text', text: t.text }).correct, t.text).toBe(false);
          }
        }
  });
});

describe('banque de phrases', () => {
  it('sujets sans voyelle initiale, objets sans « du » ni « des », aucun doublon', () => {
    for (const e of ENTREES) {
      expect(e.gs, e.gs).toMatch(/^[^aeiouyhéèêAEIOUYH]/);
      expect(e.obj.split(' ')[0], e.obj).not.toMatch(/^(du|des)$/);
      if (e.type === 'coi') expect(e.obj.startsWith(`${e.prep}`), e.obj).toBe(true);
      else expect(e.prep).toBeUndefined();
      expect(e.autre).not.toBe(e.circ);
    }
    const phrases = ENTREES.map((e) => resultat(e, 'supprimer'));
    expect(new Set(phrases).size).toBe(phrases.length);
  });

  it('chaque manipulation donne une phrase différente', () => {
    for (const e of ENTREES) expect(new Set(MANIPS.map((m) => resultat(e, m))).size).toBe(MANIPS.length);
  });

  it('aucun repère passé avec le présent, pas de dimanche à l’école', () => {
    for (const e of ENTREES)
      for (const a of e.avant ?? []) {
        expect(a, e.gs).not.toMatch(/hier|dernier|dernière|veille|autrefois/i);
        if (/classe|bibliothèque|tableau/.test(e.circ)) expect(a, e.circ).not.toMatch(/dimanche/i);
      }
  });
});

/** Une écriture sans accent, sauf celui de « à ». */
const sansAccentSaufA = (texte: string): string =>
  texte
    .split(/([àÀ])/)
    .map((t) => (/^[àÀ]$/.test(t) ? t : t.normalize('NFD').replace(/\p{M}/gu, '')))
    .join('');

/** Toutes les questions d'une notion à un niveau, sur de nombreuses graines. */
const tirages = (id: string, level: 1 | 2 | 3 | 4 | 5) =>
  Array.from({ length: 200 }, (_, seed) => generate(id, level, seed));

describe('corrections de relecture', () => {
  it('le critère « déplacer ou supprimer » n’est jamais employé', () => {
    for (const s of skills)
      for (let level = 1; level <= 5; level++)
        for (const q of tirages(s.id, level as 1))
          expect(JSON.stringify([q, s.lesson.memo])).not.toMatch(
            /(déplac\w*|déplacé) ou (se |le )?(supprim|disparaître)/,
          );
  });

  it('une phrase déplacée est acceptée avec ou sans virgule, avec ou sans point', () => {
    let vus = 0;
    for (const q of tirages('fcm1-manipulations', 3)) {
      const e = ENTREES.find((x) => q.prompt.includes(`« ${base(x)} » Consigne : déplace`));
      if (!e) continue;
      vus++;
      const sansVirgule = devant(e).replace(',', '');
      for (const text of [devant(e), sansVirgule, sansVirgule.replace(/\.$/, '')])
        expect(check(q, { kind: 'text', text }).correct, text).toBe(true);
    }
    expect(vus).toBeGreaterThan(0);
  });

  it('« souvent » n’est jamais ajouté à une phrase qui porte déjà un moment ou une fréquence', () => {
    const interdites = ENTREES.filter((e) => !e.avant);
    for (let level = 1; level <= 5; level++)
      for (const q of tirages('fcm1-manipulations', level as 1)) {
        const texte = JSON.stringify(q);
        for (const e of interdites) expect(texte).not.toContain(resultat(e, 'ajouter'));
      }
  });

  it('au niveau 5, les deux manipulations enchaînées donnent une phrase juste', () => {
    for (const q of tirages('fcm1-manipulations', 5)) {
      expect(q.answer.kind).toBe('text');
      if (q.answer.kind !== 'text') continue;
      for (const text of q.answer.accepted) expect(check(q, { kind: 'text', text }).correct).toBe(true);
      for (const t of q.traps) if ('text' in t) expect(check(q, { kind: 'text', text: t.text }).correct).toBe(false);
    }
  });

  it('COD ou COI, niveau 3 : il faut trouver le groupe et son type parmi quatre propositions', () => {
    for (const q of tirages('fcm1-cod-coi', 3)) {
      expect(q.answer.kind === 'choice' && q.answer.options.length).toBe(4);
    }
  });

  it('groupes circonstanciels : N3 vise la fin de la phrase, N5 contient une phrase à deux groupes', () => {
    for (const q of tirages('fcm1-groupes-circonstanciels', 3)) expect(q.prompt).toContain('à la fin');
    for (const q of tirages('fcm1-groupes-circonstanciels', 5)) {
      expect(q.answer.kind === 'number' && q.answer.value.n >= 4).toBeTruthy();
    }
  });
});

describe('repasse : explications, sens et saisies', () => {
  it('chaque notion est en version 2 et dit pourquoi l’apprendre, avec une source', () => {
    for (const s of skills) {
      expect(s.version, s.id).toBe(2);
      expect(s.sens, s.id).toHaveLength(1);
      expect(sensIssues(s), s.id).toEqual([]);
      for (const sens of s.sens ?? []) expect(s.lesson.sources?.includes(sens.source), s.id).toBe(true);
    }
  });

  it('le détecteur de lisibilité ne signale plus rien', () => {
    for (const s of skills) {
      const report = analyzeSkill(s, { id: 'fcm1-complements', subject: 'francais', grade: 'cm1' });
      expect({ id: s.id, counts: report.counts, words: report.words }).toEqual({ id: s.id, counts: {}, words: [] });
    }
  });

  it('la dernière bulle donne la réponse en gras', () => {
    for (const s of skills)
      for (let level = 1; level <= 5; level++)
        for (const q of tirages(s.id, level as 1)) expect(q.steps.at(-1), `${s.id} N${level}`).toMatch(/\*\*.+\*\*/);
  });

  it('un groupe recopié est accepté sans accent, avec un point ou une virgule', () => {
    let vus = 0;
    for (const q of tirages('fcm1-groupes-circonstanciels', 4)) {
      if (q.answer.kind !== 'text') continue;
      const groupe = q.answer.accepted.find((a) => q.prompt.includes(a) && !/[.,]$/.test(a));
      if (!groupe) continue;
      vus++;
      for (const text of [`${groupe}.`, `${groupe},`, sansAccentSaufA(groupe)])
        expect(check(q, { kind: 'text', text }).correct, text).toBe(true);
    }
    expect(vus).toBeGreaterThan(0);
  });

  it('une phrase est acceptée sans accent, hors celui de « à »', () => {
    for (let level = 3; level <= 5; level++)
      for (const q of tirages('fcm1-manipulations', level as 3)) {
        if (q.answer.kind !== 'text') continue;
        const text = sansAccentSaufA(q.answer.accepted[0] ?? '');
        expect(check(q, { kind: 'text', text }).correct, text).toBe(true);
      }
  });

  it('« a » (verbe avoir) n’est jamais accepté à la place de « à »', () => {
    const vues = new Set<string>();
    for (const s of skills)
      for (let level = 1; level <= 5; level++)
        for (const q of tirages(s.id, level as 1)) {
          if (q.answer.kind !== 'text') continue;
          const attendu = q.answer.accepted[0] ?? '';
          if (!/(^| )à /i.test(attendu)) continue;
          vues.add(s.id);
          for (const a of [attendu, sansAccentSaufA(attendu)]) {
            const text = a.replace(/(^| )à /gi, '$1a ');
            expect(check(q, { kind: 'text', text }).correct, text).toBe(false);
          }
        }
    expect(vues.size).toBe(skills.length);
  });

  it('groupes circonstanciels, N4 : la phrase du N3, avec un complément d’objet en « à » ou « de », sans aide', () => {
    const phrases = (type: 'cod' | 'coi') =>
      ENTREES.filter((e) => e.type === type).flatMap((e) => (e.avant ?? []).map((a) => deux(e, a)));
    for (const [level, type] of [
      [3, 'cod'],
      [4, 'coi'],
    ] as const)
      for (const q of tirages('fcm1-groupes-circonstanciels', level)) {
        const phrase = phrases(type).find((p) => q.prompt.includes(p));
        expect(q.prompt).toBe(`Écris le groupe circonstanciel qui est à la fin de cette phrase : « ${phrase} »`);
        expect(q.hint).toBe('Trouve le complément d’objet. Regarde ce qui vient après lui.');
      }
  });

  it('au niveau 5, chaque erreur de comptage typique garde son explication', () => {
    for (const q of tirages('fcm1-groupes-circonstanciels', 5))
      expect(q.traps.some((t) => t.why.includes('un groupe par phrase'))).toBe(true);
    for (const q of tirages('fcm1-cod-coi', 5)) {
      if (q.answer.kind !== 'number') continue;
      const k = q.answer.value.n;
      const why = (n: number): string => {
        const result = check(q, { kind: 'number', text: String(n) });
        expect(result.correct).toBe(false);
        return JSON.stringify(result);
      };
      expect(why(k + 1)).toContain('compté trop');
      expect(why(k - 1)).toContain('Il t’en manque');
    }
  });
});
