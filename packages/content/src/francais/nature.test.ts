import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { SUBJECT_GLOSSARIES, boldTerms, isDefined } from '../glossaires.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource } from '../sources.ts';
import { validateVariants } from '../validate.ts';
import type { Level } from '../types.ts';
import {
  ADVERBES_DES_LIGNES,
  CONJONCTIONS,
  DEMONSTRATIFS,
  FAITS_NATURE,
  LIGNES_ADVERBES,
  LIGNES_ARTICLES,
  LIGNES_CONJ,
  LIGNES_DETERMINANTS,
  OBJETS,
  OBJETS_PHRASES,
  PAIRES,
  PHRASES_ADVERBES,
  PHRASES_CONJ,
  PLURIELS,
  POSSESSIFS,
  possessif,
} from './nature.donnees.ts';
import { FCM1_NATURE } from './nature.ts';

const skills = FCM1_NATURE;
const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
/** Toutes les questions d'une notion à un niveau, sur de nombreuses graines. */
const tirages = (id: string, level: Level) => Array.from({ length: 200 }, (_, seed) => generate(id, level, seed));
const mots = (texte: string) => texte.toLowerCase().match(/[a-zàâçéèêëîïôûù]+/g) ?? [];
const compte = (texte: string, liste: readonly string[]) => mots(texte).filter((m) => liste.includes(m)).length;

describe('francais cm1 — nature des mots', () => {
  it('le chapitre compte les six notions du lot, à 5 niveaux', () => {
    expect(skills.map((s) => s.id)).toEqual([
      'fcm1-nature-fonction',
      'fcm1-articles',
      'fcm1-determinants-poss-dem',
      'fcm1-conjonctions-coordination',
      'fcm1-adverbes',
      'fcm1-pronoms-personnels',
    ]);
    for (const s of skills) expect(s.levels).toBe(5);
  });

  it('faits et notions citent des sources du registre ; les termes en gras sont définis', () => {
    for (const f of FAITS_NATURE) {
      expect(getSource(f.source), f.id).toBeDefined();
      expect(f.citation.trim().length, f.id).toBeGreaterThan(10);
    }
    for (const s of skills) {
      for (const id of s.lesson.sources ?? []) expect(getSource(id), id).toBeDefined();
      for (const term of s.lesson.memo.flatMap(boldTerms))
        expect(isDefined(term, SUBJECT_GLOSSARIES.francais ?? []), term).toBe(true);
    }
  });

  it('questions valides aux 5 niveaux, réponse juste acceptée, pièges refusés et expliqués', () => {
    for (const s of skills) {
      let niveauxAvecPieges = 0;
      for (const level of LEVELS) {
        const qs = tirages(s.id, level);
        expect(validateVariants(qs), `${s.id} N${level}`).toEqual([]);
        if (qs.some((q) => q.traps.length >= 2)) niveauxAvecPieges++;
        for (const q of qs) {
          if (q.answer.kind !== 'text') continue;
          for (const text of q.answer.accepted) expect(check(q, { kind: 'text', text }).correct).toBe(true);
        }
      }
      expect(niveauxAvecPieges, s.id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('banques de phrases', () => {
  it('les décomptes annoncés correspondent aux mots des lignes', () => {
    for (const l of LIGNES_CONJ) expect(compte(l.texte, CONJONCTIONS), l.texte).toBe(l.n);
    for (const l of LIGNES_DETERMINANTS) {
      expect(compte(l.texte, POSSESSIFS), l.texte).toBe(l.possessifs);
      expect(compte(l.texte, DEMONSTRATIFS), l.texte).toBe(l.demonstratifs);
    }
    for (const l of LIGNES_ARTICLES) {
      // « l’ » est découpé en « l » ; aucun article contracté.
      expect(compte(l.texte, ['le', 'la', 'l', 'les']), l.texte).toBe(l.definis);
      expect(compte(l.texte, ['un', 'une', 'des']), l.texte).toBe(l.indefinis);
      expect(compte(l.texte, ['du', 'au', 'aux', 'de']), l.texte).toBe(0);
    }
    for (const l of LIGNES_ADVERBES) expect(compte(l.texte, ADVERBES_DES_LIGNES), l.texte).toBe(l.n);
  });

  it('une seule conjonction par phrase, aucune parmi les distracteurs', () => {
    for (const p of PHRASES_CONJ) {
      expect(compte(p.texte, CONJONCTIONS), p.texte).toBe(1);
      expect(mots(p.texte)).toContain(p.conj);
      for (const a of p.autres) expect(CONJONCTIONS as readonly string[]).not.toContain(a.toLowerCase());
    }
  });

  it('un seul adverbe par phrase, sans négation', () => {
    for (const p of PHRASES_ADVERBES) {
      expect(mots(p.texte), p.texte).not.toContain('ne');
      expect(p.autres).not.toContain(p.adverbe);
    }
  });

  it('le possessif demandé s’accorde dans l’énoncé : « qui sont » au pluriel', () => {
    for (const q of tirages('fcm1-determinants-poss-dem', 4)) expect(q.prompt).not.toMatch(/« les [^»]* qui est /);
  });

  it('l’adverbe ne change pas au pluriel', () => {
    for (const p of PLURIELS) {
      expect(p.pluriel).toContain(` ${p.adverbe}.`);
      expect(p.faux).not.toBe(p.pluriel);
    }
  });

  it('devant une voyelle, le possessif féminin est « mon, ton, son »', () => {
    const o = (nom: string) => {
      const x = OBJETS.find((y) => y.nom === nom);
      if (!x) throw new Error(nom);
      return x;
    };
    expect(possessif('moi', o('écharpe'))).toBe('mon');
    expect(possessif('lui', o('assiette'))).toBe('son');
    expect(possessif('toi', o('trousse'))).toBe('ta');
    expect(possessif('eux', o('billes'))).toBe('leurs');
  });

  it('pronoms compléments : les verbes commencent par une consonne', () => {
    for (const p of OBJETS_PHRASES) expect(p.verbe).toMatch(/^[^aeéèiouh]/);
  });
});

describe('repasse : explications, mémo, sens', () => {
  const chapitre = { id: 'fcm1-nature-mots', subject: 'francais', grade: 'cm1' } as const;

  it.each(skills.map((s) => [s.id, s] as const))('%s : le détecteur ne signale plus rien', (_, s) => {
    const report = analyzeSkill(s, chapitre);
    expect({ counts: report.counts, words: report.words }).toEqual({ counts: {}, words: [] });
  });

  it('chaque notion est en version 2, avec un sens sourcé et conforme', () => {
    for (const s of skills) {
      expect(s.version, s.id).toBe(2);
      expect(s.sens, s.id).toHaveLength(1);
      expect(sensIssues(s), s.id).toEqual([]);
      expect(s.lesson.sources, s.id).toContain(s.sens?.[0]?.source);
    }
  });

  it('« combien ? » : l’explication cite exactement autant de mots que la réponse', () => {
    for (const s of skills.slice(1, 5)) {
      for (const q of tirages(s.id, 5)) {
        if (q.answer.kind !== 'number') throw new Error(s.id);
        const liste = q.steps.at(-2) ?? '';
        expect(liste.match(/« /g)?.length, `${s.id} ${liste}`).toBe(q.answer.value.n);
        expect(q.steps.at(-1)).toContain(`**${q.answer.value.n}**`);
      }
    }
  });

  it('la dernière bulle donne la réponse en gras', () => {
    for (const s of skills) {
      for (const level of LEVELS) {
        for (const q of tirages(s.id, level)) expect(q.steps.at(-1), `${s.id} N${level}`).toMatch(/\*\*.+\*\*/);
      }
    }
  });

  it('le mémo ne reprend aucune phrase ni aucun groupe des questions à produire', () => {
    const memos = skills.flatMap((s) => s.lesson.memo).join(' ');
    const banque = [
      ...OBJETS_PHRASES.map((o) => o.groupe),
      ...PAIRES.map((p) => p.defini),
      ...PHRASES_CONJ.map((p) => p.texte),
      ...PHRASES_ADVERBES.map((p) => p.texte),
      ...PLURIELS.map((p) => p.pluriel),
    ];
    for (const texte of banque) expect(memos, texte).not.toContain(texte);
  });
});
