import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { glossaryIssues, sourceIssues } from '../couverture.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource, isAllowedUrl } from '../sources.ts';
import { skillLevels, type Level, type Question } from '../types.ts';
import { validateVariants } from '../validate.ts';
import { ANNOUNCEMENTS, LANDMARKS, TOURS, VISITS } from './ecoute-5e-donnees.ts';
import { FAITS as LISTENING_FACTS } from './ecoute-5e-faits.ts';
import { ENGLISH_LISTENING_5E_CHAPTER, digitForms, hourForms, priceDigitForms, priceForms } from './ecoute-5e.ts';
import {
  ACTIVITIES,
  AXES,
  AXIS_FACTS,
  FAITS,
  NATURE_WORDS,
  PEOPLE,
  PEOPLE_FACTS,
  PEOPLE_FILLS,
  REFERENCES,
  SPORT,
  TRAVEL,
} from './vocabulaire-5e-faits.ts';
import { ENGLISH_VOCABULARY_5E_CHAPTER, blanked, givenAway } from './vocabulaire-5e.ts';

const CHAPTERS = [ENGLISH_LISTENING_5E_CHAPTER, ENGLISH_VOCABULARY_5E_CHAPTER];
const SKILLS = CHAPTERS.flatMap((chapter) => chapter.skills.map((skill) => ({ skill, chapter })));
const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
const cache = new Map<string, Question[]>();
const questions = (id: string, level: Level) => {
  const key = `${id}-${level}`;
  const found = cache.get(key) ?? Array.from({ length: 500 }, (_, i) => generate(id, level, i + 1));
  cache.set(key, found);
  return found;
};
const good = (q: Question): readonly string[] => {
  const a = q.answer;
  if (a.kind === 'text') return [a.accepted[0]!];
  if (a.kind === 'choice') return [a.options[a.correct]!];
  if (a.kind === 'cloze') return a.blanks.flatMap((b) => (b.mode === 'text' ? [b.accepted[0]!] : []));
  return [];
};
const text = (q: Question, t: string) => check(q, { kind: 'text', text: t }).correct;

describe('anglais 5e : écouter et comprendre, vocabulaire thématique', () => {
  it('8 notions à 5 niveaux, sources, sens et mots en gras définis', () => {
    expect(SKILLS.map((s) => s.skill.id)).toEqual([
      'a5-message-enregistre',
      'a5-dialogue',
      'a5-ecoute-reperes',
      'a5-voc-voyages',
      'a5-voc-sport',
      'a5-voc-nature',
      'a5-personnages-celebres',
      'a5-reperes-axes',
    ]);
    for (const { skill, chapter } of SKILLS) {
      expect(skillLevels(skill)).toBe(5);
      expect(skill.lesson.sources).toContain('anglais-college-2025');
      expect(sourceIssues(skill), skill.id).toEqual([]);
      expect(skill.sens?.length, skill.id).toBeGreaterThan(0);
      expect(sensIssues(skill), skill.id).toEqual([]);
      expect(glossaryIssues({ skill, chapter }), skill.id).toEqual([]);
    }
  });

  it('chaque fait a un identifiant unique, une source autorisée et une citation', () => {
    for (const facts of [LISTENING_FACTS, [...FAITS, ...PEOPLE_FACTS, ...AXIS_FACTS]]) {
      expect(new Set(facts.map((f) => f.id)).size).toBe(facts.length);
      for (const f of facts) {
        expect(isAllowedUrl(getSource(f.sourceId)!.url), f.id).toBe(true);
        expect(f.quote.trim().length, f.id).toBeGreaterThan(0);
      }
    }
  });

  it('questions valides, niveaux distincts, au moins deux erreurs expliquées', () => {
    for (const { skill } of SKILLS) {
      const byLevel = LEVELS.map((l) => questions(skill.id, l));
      for (const qs of byLevel) expect(validateVariants(qs), skill.id).toEqual([]);
      expect(new Set(byLevel.map((qs) => qs.map((q) => q.prompt).join('|'))).size, skill.id).toBe(5);
      const reasons = new Set(byLevel.flatMap((qs) => qs.flatMap((q) => q.traps.map((t) => t.why))));
      expect(reasons.size, skill.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('explications lisibles sans adulte et variété suffisante : aucun indice du détecteur', () => {
    for (const { skill, chapter } of SKILLS) expect(analyzeSkill(skill, chapter).counts, skill.id).toEqual({});
  });

  it('écoute : voix anglaise et alternative à lire à chaque niveau', () => {
    for (const skill of ENGLISH_LISTENING_5E_CHAPTER.skills)
      for (const l of LEVELS) {
        const qs = questions(skill.id, l);
        expect(
          qs.some((q) => q.audio?.lang === 'en-GB'),
          `${skill.id} ${l}`,
        ).toBe(true);
        expect(
          qs.some((q) => !q.audio),
          `${skill.id} ${l}`,
        ).toBe(true);
      }
  });

  it('un même énoncé entendu attend toujours le même texte lu', () => {
    for (const skill of ENGLISH_LISTENING_5E_CHAPTER.skills)
      for (const l of LEVELS) {
        const seen = new Map<string, string>();
        for (const q of questions(skill.id, l)) {
          if (!q.audio) continue;
          expect(seen.get(q.prompt) ?? q.audio.text, q.prompt).toBe(q.audio.text);
          seen.set(q.prompt, q.audio.text);
        }
      }
  });

  it('saisie : variantes acceptées, pièges refusés, indice sans la réponse', () => {
    for (const { skill } of SKILLS)
      for (const l of LEVELS)
        for (const q of questions(skill.id, l)) {
          if (q.answer.kind === 'text') {
            for (const a of q.answer.accepted) expect(text(q, a), `${q.prompt} ${a}`).toBe(true);
            for (const t of q.traps) if ('text' in t) expect(text(q, t.text), `${q.prompt} ${t.text}`).toBe(false);
          }
          for (const answer of good(q))
            if (answer.length >= 4)
              expect(q.hint.toLowerCase(), `${q.prompt} ${answer}`).not.toContain(answer.toLowerCase());
        }
  });

  it('heures et prix : chiffres sur 12 heures et anglais', () => {
    expect(hourForms({ h: 5, m: 30 })).toEqual(
      expect.arrayContaining(['5:30', '5h30', '05:30', 'half past five', 'five thirty']),
    );
    expect(hourForms({ h: 5, m: 30 })).not.toContain('17:30');
    expect(hourForms({ h: 5, m: 30 })).not.toContain('6:30');
    expect(hourForms({ h: 12, m: 15 })).not.toContain('0:15');
    expect(priceForms(12)).toEqual(expect.arrayContaining(['12', '£12', '12 pounds', 'twelve']));
  });

  it('heure : aucune forme sur 24 heures, le message ne précisant pas le moment', () => {
    for (const id of ['a5-message-enregistre', 'a5-dialogue'])
      for (const l of [3, 4] as const)
        for (const q of questions(id, l)) {
          const a = q.answer;
          const lists =
            a.kind === 'text'
              ? [a.accepted]
              : a.kind === 'cloze'
                ? a.blanks.map((b) => (b.mode === 'text' ? b.accepted : []))
                : [];
          for (const f of lists.flat()) expect(f, q.prompt).not.toMatch(/^(1[3-9]|2[0-3]) ?[:.h] ?\d/);
        }
  });

  it('consigne « en chiffres » : les réponses en lettres sont refusées', () => {
    expect(digitForms({ h: 8, m: 15 })).not.toContain('quarter past eight');
    expect(priceDigitForms(12)).not.toContain('twelve');
    let seen = 0;
    for (const id of ['a5-message-enregistre', 'a5-dialogue'])
      for (const q of questions(id, 3)) {
        if (q.answer.kind !== 'text' || !q.prompt.includes('en chiffres')) continue;
        seen += 1;
        for (const f of q.answer.accepted) expect(f, q.prompt).toMatch(/\d/);
      }
    expect(seen).toBeGreaterThan(0);
  });

  it('lieu en français : accepté avec ou sans accents', () => {
    const find = (id: string, needle: string) =>
      questions(id, 3).find((q) => q.answer.kind === 'text' && q.answer.accepted.includes(needle))!;
    const gate = find('a5-message-enregistre', 'au portail de l’école');
    for (const t of ['au portail de l’école', "Au portail de l'ecole."]) expect(text(gate, t), t).toBe(true);
    for (const [needle, typedText] of [
      ['à l’arrêt de bus', "a l'arret de bus"],
      ['près de la bibliothèque', 'pres de la bibliotheque'],
      ['près du pont', 'a cote du pont'],
    ] as const)
      expect(text(find('a5-dialogue', needle), typedText), typedText).toBe(true);
  });

  it('fiche corrigée au niveau 5 : seules les nouvelles informations sont justes', () => {
    for (const q of questions('a5-message-enregistre', 5)) {
      if (q.answer.kind !== 'cloze') throw new Error('texte à trous attendu');
      const a = ANNOUNCEMENTS.find((x) => q.prompt.startsWith(x.listener))!;
      const [hour, place, price] = q.answer.blanks.map((b) => (b.mode === 'text' ? b.accepted : []));
      expect(hour).toEqual(hourForms(a.newTime));
      expect(hour).not.toContain(hourForms(a.time)[0]);
      expect(place).toContain(a.newPlace.fr[0]);
      expect(place).not.toContain(a.place.fr[0]);
      expect(price).toEqual(priceForms(a.price));
    }
  });

  it('repères entendus : la réponse à écrire figure dans le message, chaque voyage a quatre visites', () => {
    for (const l of LANDMARKS)
      expect(
        l.typed.accepted.some((a) => l.lines.join(' ').includes(a)),
        l.id,
      ).toBe(true);
    expect(new Set(LANDMARKS.map((l) => l.listener)).size).toBe(LANDMARKS.length);
    expect(new Set(TOURS.map((t) => t.guest)).size).toBe(TOURS.length);
    for (const t of TOURS) {
      expect(new Set(t.stops).size).toBe(4);
      for (const s of t.stops) expect(VISITS[s].clue.length).toBeGreaterThan(0);
    }
  });

  it('lexique : chaque mot a sa phrase à trou, une faute différente des réponses, des identifiants uniques', () => {
    for (const list of [TRAVEL, SPORT, NATURE_WORDS]) {
      expect(new Set(list.map((t) => t.en)).size).toBe(list.length);
      expect(new Set(list.map((t) => t.fr)).size).toBe(list.length);
      for (const t of list) {
        expect(blanked(t), t.en).toContain('…');
        expect(blanked(t).toLowerCase(), t.en).not.toContain(t.en);
        expect([t.en, ...t.alt], t.en).not.toContain(t.typo);
      }
    }
  });

  it('lexique : au niveau 3, la consigne en français ne donne pas le mot anglais', () => {
    for (const list of [TRAVEL, SPORT, NATURE_WORDS])
      for (const t of list.filter((x) => !givenAway(x))) expect(t.fr.toLowerCase(), t.en).not.toContain(t.en);
    for (const id of ['a5-voc-voyages', 'a5-voc-sport', 'a5-voc-nature'])
      for (const q of questions(id, 3)) {
        if (q.answer.kind !== 'text') throw new Error('saisie attendue');
        expect(q.prompt.toLowerCase(), q.prompt).not.toContain(q.answer.accepted[0]!.toLowerCase());
      }
  });

  it('lexique : les synonymes corrects sont acceptés', () => {
    const q = questions('a5-voc-voyages', 3).find((x) => x.prompt.includes('l’avion'))!;
    for (const t of ['plane', 'airplane', 'Aeroplane.']) expect(text(q, t), t).toBe(true);
    expect(text(q, 'plain')).toBe(false);
    const train = questions('a5-voc-sport', 3).find((x) => x.prompt.includes('s’entraîner'))!;
    expect(train.prompt).toContain('We need to … twice a week.');
    expect(text(train, 'train')).toBe(true);
  });

  it('personnages : noms courts acceptés, un portrait par personne, trous à réponse expliquée', () => {
    const kennedy = questions('a5-personnages-celebres', 4).find(
      (q) => q.answer.kind === 'text' && q.answer.accepted.includes('JFK'),
    )!;
    for (const t of ['Kennedy', 'jfk', 'John F. Kennedy']) expect(text(kennedy, t), t).toBe(true);
    expect(new Set(PEOPLE.map((p) => p.clues[0])).size).toBe(PEOPLE.length);
    for (const f of PEOPLE_FILLS) expect(f.accepted, f.text).not.toContain(f.trap[0]);
  });

  it('axes : les six axes officiels, une activité au moins par axe', () => {
    expect(AXES).toHaveLength(6);
    for (const [i] of AXES.entries()) expect(ACTIVITIES.filter((a) => a[0] === i).length).toBeGreaterThanOrEqual(2);
    expect(new Set(REFERENCES.map((r) => r.short)).size).toBe(REFERENCES.length);
  });
});
