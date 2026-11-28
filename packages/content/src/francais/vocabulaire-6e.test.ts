import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { SUBJECT_GLOSSARIES, boldTerms, isDefined } from '../glossaires.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource } from '../sources.ts';
import { validateVariants } from '../validate.ts';
import type { Level, Question } from '../types.ts';
import {
  CHAMPS,
  DECOUPES,
  ENTREES,
  FAITS_VOCABULAIRE_6E,
  FIGURES,
  MOTS_COMPOSES,
  PHRASES_CONSTRUITES,
  POLYSEMES,
  TERMES,
  faitVocabulaire6e,
} from './vocabulaire-6e.donnees.ts';
import { F6_VOCABULAIRE } from './vocabulaire-6e.ts';
import { initiale } from './vocabulaire.ts';

const skills = F6_VOCABULAIRE;
const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
const tirages = (id: string, level: Level) => Array.from({ length: 300 }, (_, seed) => generate(id, level, seed));
const saisie = (text: string) => ({ kind: 'text' as const, text });
const trouve = (id: string, level: Level, morceau: string) => {
  const q = tirages(id, level).find((x: Question) => x.prompt.includes(morceau));
  if (!q) throw new Error(`aucune question « ${morceau} »`);
  return q;
};

describe('francais 6e — vocabulaire', () => {
  it('le chapitre compte les cinq notions du lot, à 5 niveaux', () => {
    expect(skills.map((s) => s.id)).toEqual([
      'f6-prefixe-radical-suffixe',
      'f6-synonymes-antonymes',
      'f6-sens-propre-figure',
      'f6-champ-lexical',
      'f6-mots-disciplines',
    ]);
    for (const s of skills) expect(s.levels).toBe(5);
  });

  it('faits, notions et sens citent des sources du registre ; les termes en gras sont définis', () => {
    expect(new Set(FAITS_VOCABULAIRE_6E.map((f) => f.id)).size).toBe(FAITS_VOCABULAIRE_6E.length);
    for (const f of FAITS_VOCABULAIRE_6E) {
      expect(getSource(f.source), f.id).toBeDefined();
      expect(f.citation.trim().length, f.id).toBeGreaterThan(7);
    }
    for (const s of skills) {
      expect(s.sens?.length, s.id).toBeGreaterThan(0);
      expect(sensIssues(s), s.id).toEqual([]);
      for (const id of s.lesson.sources ?? []) expect(getSource(id), id).toBeDefined();
      const textes = [...s.lesson.memo, ...LEVELS.flatMap((n) => tirages(s.id, n).flatMap((q) => q.steps.slice(0, 1)))];
      for (const term of textes.flatMap(boldTerms))
        expect(isDefined(term, SUBJECT_GLOSSARIES.francais ?? []), term).toBe(true);
    }
  });

  it('questions valides, au moins deux pièges expliqués, au moins six variantes par niveau', () => {
    for (const s of skills) {
      let niveauxAvecPieges = 0;
      for (const level of LEVELS) {
        const qs = tirages(s.id, level);
        expect(validateVariants(qs), `${s.id} N${level}`).toEqual([]);
        if (qs.some((q) => q.traps.length >= 2)) niveauxAvecPieges++;
        const variantes = new Set(qs.map((q) => JSON.stringify([q.prompt, q.figure, q.answer])));
        expect(variantes.size, `${s.id} N${level}`).toBeGreaterThanOrEqual(6);
      }
      expect(niveauxAvecPieges, s.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('explications guidées : rien à signaler par le détecteur de lisibilité', () => {
    for (const skill of skills) {
      const report = analyzeSkill(skill, { id: 'f6-vocabulaire', subject: 'francais', grade: '6e' });
      expect({ id: skill.id, counts: report.counts, words: report.words }).toEqual({
        id: skill.id,
        counts: {},
        words: [],
      });
    }
  });

  it('niveaux 1 et 2 : QCM à 3 puis 4 propositions, ou association de 3 paires', () => {
    for (const s of skills) {
      for (const level of [1, 2] as const) {
        for (const q of tirages(s.id, level)) {
          if (q.answer.kind === 'choice') expect(q.answer.options, q.prompt).toHaveLength(level + 2);
          else if (q.answer.kind === 'match' && level === 2) expect(q.answer.left, q.prompt).toHaveLength(3);
          else throw new Error(`forme inattendue : ${q.prompt}`);
        }
      }
    }
  });

  it('niveaux 3 et 4 : réponse écrite, ou association de 5 paires au niveau 4', () => {
    for (const s of skills) {
      for (const q of tirages(s.id, 3)) expect(q.answer.kind, q.prompt).toBe('text');
      for (const q of tirages(s.id, 4)) {
        if (q.answer.kind === 'match') expect(q.answer.left, q.prompt).toHaveLength(5);
        else if (q.answer.kind === 'cloze') expect(q.answer.blanks.every((b) => b.mode === 'text')).toBe(true);
        else expect(q.answer.kind, q.prompt).toBe('text');
      }
    }
  });

  it('niveau 5 : un texte de 4 lignes, une réponse écrite par ligne', () => {
    for (const s of skills) {
      for (const q of tirages(s.id, 5)) {
        if (q.figure?.kind !== 'document' || q.answer.kind !== 'cloze') throw new Error('forme inattendue');
        expect(q.figure.lines, q.prompt).toHaveLength(4);
        expect(q.answer.blanks).toHaveLength(4);
        expect(q.answer.blanks.every((b) => b.mode === 'text')).toBe(true);
        for (const line of q.figure.lines) expect(line).not.toContain('{}');
      }
    }
  });
});

describe('données', () => {
  it('sens figuré : deux sens proches ne sont jamais proposés ensemble', () => {
    const groupes = [
      ['une très grande quantité', 'beaucoup de choses à la fois', 'un ensemble compliqué et confus'],
      ['faire naître et se répandre', 'commencer à se former'],
    ];
    for (const q of tirages('f6-sens-propre-figure', 2)) {
      if (q.answer.kind !== 'choice') throw new Error('forme inattendue');
      const options = q.answer.options.map((o) => JSON.stringify(o));
      for (const g of groupes) expect(options.filter((o) => g.some((s) => o.includes(s))).length).toBeLessThan(2);
    }
  });

  it('mots découpés : les morceaux recomposent le mot et le préfixe suit la règle', () => {
    for (const d of DECOUPES) {
      expect(d.mot).toBe([d.prefixe, d.radical, d.suffixe].join('').replaceAll('-', ''));
      if (d.prefixe === 'im-') expect(d.radical).toMatch(/^[mbp]/);
      if (d.prefixe === 'il-') expect(d.radical).toMatch(/^l/);
      if (d.prefixe === 'in-') expect(d.radical).not.toMatch(/^[mbp]/);
      expect(faitVocabulaire6e(d.faitId).citation.startsWith('Dérivé'), d.mot).toBe(true);
    }
    for (const p of PHRASES_CONSTRUITES) {
      const d = DECOUPES.find((x) => x.base === p.base);
      expect(d && [d.mot, `${d.mot}s`], p.mot).toContain(p.mot);
      expect(p.phrase).toContain('{}');
    }
  });

  it('synonymes et antonymes : réponses citées, même initiale et même longueur, autre classe distincte', () => {
    for (const e of ENTREES) {
      expect(e.phrase).toContain('{}');
      expect(e.autre[1]).not.toBe(e.classe);
      for (const r of [e.synonyme, e.antonyme]) {
        if (!r) continue;
        const [principale, ...autres] = r.mots;
        const citation = faitVocabulaire6e(r.faitId).citation.toLowerCase();
        expect(citation, principale).toContain(principale);
        // Une autre réponse est citée, ou répond au même indice (initiale et longueur).
        for (const m of autres)
          expect(
            citation.includes(m) || (m.startsWith(principale.charAt(0)) && m.length === principale.length),
            m,
          ).toBe(true);
      }
    }
  });

  it('sens figuré et champs lexicaux : un seul emplacement par phrase', () => {
    for (const f of FIGURES) {
      for (const phrase of [f.propre, f.figure, f.contexte]) expect(phrase.split('{}'), f.mot).toHaveLength(2);
      expect(f.figure.toLowerCase(), f.mot).toContain(f.autre);
    }
    const mots = CHAMPS.flatMap((c) => c.mots.map((m) => m.mot));
    expect(new Set(mots).size).toBe(mots.length);
    for (const c of CHAMPS) {
      for (const m of c.mots) {
        expect(m.phrase.split('{}'), m.mot).toHaveLength(2);
        expect(c.accepte, m.mot).not.toContain(m.mot);
        // La phrase ne contient aucun autre mot de la liste des champs.
        for (const autre of mots) expect(m.phrase.toLowerCase().split(/[^\p{L}]+/u)).not.toContain(autre);
      }
    }
  });

  it('mots des disciplines : ni la phrase ni la définition ne soufflent le mot', () => {
    for (const t of TERMES) {
      expect(t.phrase.split('{}'), t.mot).toHaveLength(2);
      expect(t.phrase.toLowerCase()).not.toContain(t.mot);
      expect(t.definition.toLowerCase()).not.toContain(t.mot);
    }
    for (const p of POLYSEMES) for (const s of p.sens) expect(s.phrase.toLowerCase()).toContain(p.mot);
  });
});

describe('correction des réponses', () => {
  it('préfixe : « inbattable » est refusé avec la règle', () => {
    const q = trouve('f6-prefixe-radical-suffixe', 4, '« battre »');
    expect(check(q, saisie('imbattable')).correct).toBe(true);
    expect(check(q, saisie('inbattable')).why).toContain('im-');
  });

  it('radical : le verbe entier est refusé et expliqué', () => {
    const q = trouve('f6-prefixe-radical-suffixe', 3, '« incassable »');
    for (const mot of ['cass', 'cass-']) expect(check(q, saisie(mot)).correct).toBe(true);
    expect(check(q, saisie('casser')).why).toContain('radical');
    expect(check(q, saisie('incass')).why).toContain('préfixe');
  });

  it('radical : seuls les mots dont le radical ne change pas sont demandés en saisie', () => {
    for (const q of tirages('f6-prefixe-radical-suffixe', 3)) expect(q.prompt).not.toMatch(/illisible|imbuvable/);
  });

  it('antonyme de « habile » : la mauvaise classe est expliquée', () => {
    const q = trouve('f6-synonymes-antonymes', 3, 'antonyme de l’adjectif « habile »');
    expect(check(q, saisie('maladroit')).correct).toBe(true);
    expect(check(q, saisie('habileté')).why).toContain('nom');
  });

  it('indice « début et nombre de lettres » : chaque réponse acceptée le respecte', () => {
    const indices = [/(?:commence par) « (\p{L}+) » et compte (\d+) lettres/u, /(\p{L}+)… \((\d+) lettres\)/u];
    let controles = 0;
    const verifier = (texte: string, accepted: readonly string[]) => {
      const m = indices.map((r) => r.exec(texte)).find(Boolean);
      if (!m) return;
      controles++;
      for (const juste of accepted) {
        expect(juste.startsWith(m[1] ?? ''), `${texte} → ${juste}`).toBe(true);
        expect(juste, `${texte} → ${juste}`).toHaveLength(Number(m[2]));
      }
    };
    for (const s of skills)
      for (const level of LEVELS)
        for (const q of tirages(s.id, level)) {
          if (q.answer.kind === 'text') verifier(q.prompt, q.answer.accepted);
          if (q.answer.kind === 'cloze' && q.figure?.kind === 'document') {
            const lines = q.figure.lines;
            q.answer.blanks.forEach((b, i) => {
              if (b.mode === 'text') verifier(lines[i] ?? '', b.accepted);
            });
          }
        }
    expect(controles).toBeGreaterThan(0);
  });

  it.each([
    [3, 'antonyme du verbe « diminuer »', 'augmenter', ['accentuer', 'accroître', 'agrandir', 'allonger']],
    [4, 'synonyme du nom « pénurie »', 'manque', ['carence', 'défaut', 'insuffisance', 'rareté']],
    [3, 'antonyme de l’adjectif « habile »', 'maladroit', ['malhabile']],
    [3, 'antonyme du nom « victoire »', 'défaite', ['déroute']],
  ] as const)('N%i, %s : seul « %s » suit l’indice, les autres mots sont expliqués', (level, morceau, juste, hors) => {
    const q = trouve('f6-synonymes-antonymes', level, morceau);
    expect(check(q, saisie(juste)).correct).toBe(true);
    for (const mot of hors) {
      expect(check(q, saisie(mot)).correct, mot).toBe(false);
      expect(check(q, saisie(mot)).why, mot).toContain('compte les lettres');
    }
  });

  it('sens figuré N4 : initiale et nombre de lettres comme au niveau 3, sans le sens propre', () => {
    for (const q of tirages('f6-sens-propre-figure', 4)) {
      if (q.answer.kind !== 'text') throw new Error('forme inattendue');
      const mot = q.answer.accepted[0] ?? '';
      expect(q.prompt).toBe(`Écris le mot qui complète la phrase courte et la phrase longue. ${initiale(mot)}`);
      for (const f of FIGURES) expect([q.hint, ...q.steps].join(' '), q.prompt).not.toContain(f.sensPropre);
    }
  });

  it('sens figuré N4 : seule la phrase figurée change par rapport au niveau 3', () => {
    for (const f of FIGURES) {
      const [n3, n4] = ([3, 4] as const).map((n) => {
        const phrase = (n === 3 ? f.figure : f.contexte).replace('{}', '…');
        const q = tirages('f6-sens-propre-figure', n).find(
          (x) => x.figure?.kind === 'document' && x.figure.lines[1] === phrase,
        );
        if (!q) throw new Error(`aucune question N${n} sur « ${f.mot} »`);
        return q;
      });
      for (const q of [n3, n4]) expect(q?.prompt, f.mot).toContain(initiale(f.forme));
      expect(n4?.figure?.kind === 'document' && n4.figure.lines[0]).toBe(
        n3?.figure?.kind === 'document' && n3.figure.lines[0],
      );
      expect(f.contexte.length, f.mot).toBeGreaterThan(f.propre.length);
      expect(f.contexte.length, f.mot).toBeGreaterThan(f.figure.length);
    }
  });

  it('sens figuré N4 : « grandit » et « averse » n’ont pas le nombre de lettres demandé', () => {
    for (const [phrase, juste, rival] of [
      ['Le blé', 'germe', 'grandit'],
      ['a coupé la route', 'avalanche', 'averse'],
    ] as const) {
      const q = tirages('f6-sens-propre-figure', 4).find(
        (x) => x.figure?.kind === 'document' && x.figure.lines[0]?.includes(phrase),
      );
      if (!q) throw new Error(`aucune question sur « ${juste} »`);
      expect(q.prompt).toContain(`compte ${juste.length} lettres`);
      expect(rival).not.toHaveLength(juste.length);
      expect(check(q, saisie(juste)).correct).toBe(true);
      expect(check(q, saisie(rival)).correct).toBe(false);
    }
  });

  it('mots des disciplines : l’outil récapitulatif est rattaché au cycle 3, pas à la sixième', () => {
    const textes = skills.find((s) => s.id === 'f6-mots-disciplines')?.sens?.map((s) => s.text) ?? [];
    expect(textes.join(' ')).toMatch(/^Au cycle 3, ton outil récapitulatif/);
  });

  it('sens figuré N4 : le mot à écrire n’est montré ni dans l’énoncé, ni dans les phrases, ni dans l’indice', () => {
    for (const q of tirages('f6-sens-propre-figure', 4)) {
      if (q.answer.kind !== 'text' || q.figure?.kind !== 'document') throw new Error('forme inattendue');
      expect(q.figure.lines).toHaveLength(2);
      for (const line of q.figure.lines) expect(line, q.prompt).toContain('…');
      const visibles = [q.prompt.split(' Il commence par')[0], q.hint, ...q.figure.lines].join(' ');
      const mots = visibles.toLowerCase().split(/[^\p{L}]+/u);
      for (const juste of q.answer.accepted) expect(mots, q.prompt).not.toContain(juste);
    }
  });

  it('sens figuré N4 : le verbe est attendu conjugué, l’infinitif est expliqué', () => {
    const q = tirages('f6-sens-propre-figure', 4).find(
      (x) => x.figure?.kind === 'document' && x.figure.lines[0]?.startsWith('Le lion'),
    );
    if (!q) throw new Error('aucune question sur « dévorer »');
    expect(check(q, saisie('dévore')).correct).toBe(true);
    expect(check(q, saisie('dévorer')).why).toContain('conjugué');
  });

  it('antonyme de « diminuer » : l’indice ne désigne qu’une réponse aux niveaux 3 et 5', () => {
    const q = trouve('f6-synonymes-antonymes', 3, 'antonyme du verbe « diminuer »');
    expect(q.prompt).toContain('Il commence par « au » et compte 9 lettres.');
    const lignes = tirages('f6-synonymes-antonymes', 5).flatMap((x) =>
      x.figure?.kind === 'document' ? x.figure.lines.filter((l) => /« diminuer ».*Antonyme/.test(l)) : [],
    );
    expect(lignes.length).toBeGreaterThan(0);
    for (const l of lignes) expect(l).toContain('au… (9 lettres)');
  });

  it('sens figuré N5 : seule la forme écrite dans la phrase est acceptée', () => {
    for (const q of tirages('f6-sens-propre-figure', 5)) {
      if (q.answer.kind !== 'cloze' || q.figure?.kind !== 'document') throw new Error('forme inattendue');
      const lines = q.figure.lines;
      q.answer.blanks.forEach((b, i) => {
        if (b.mode !== 'text') throw new Error('forme inattendue');
        expect(b.accepted).toHaveLength(1);
        expect(lines[i]).toContain(b.accepted[0]);
      });
    }
  });

  it('dérivé ou composé : jamais de mot simple, un seul mot de la sorte demandée', () => {
    const composes = new Set(MOTS_COMPOSES.map((m) => m.mot));
    const questions = tirages('f6-prefixe-radical-suffixe', 2).filter((q) => /mot (dérivé|composé)\.$/.test(q.prompt));
    const bonnes = new Set<string>();
    for (const q of questions) {
      if (q.answer.kind !== 'choice') throw new Error('forme inattendue');
      const compose = q.prompt.includes('composé');
      const options = q.answer.options.map((o) => JSON.stringify(o));
      const nb = [...composes].filter((m) => options.some((o) => o.includes(`"${m}"`))).length;
      expect(nb, q.prompt).toBe(compose ? 1 : 3);
      bonnes.add(JSON.stringify(q.answer));
    }
    expect(bonnes.size).toBeGreaterThanOrEqual(6);
  });

  it('champ lexical : le thème se nomme avec ou sans article', () => {
    const q = trouve('f6-champ-lexical', 3, '« marée »');
    for (const mot of ['mer', 'la mer', 'La Mer']) expect(check(q, saisie(mot)).correct, mot).toBe(true);
    expect(check(q, saisie('marée')).why).toContain('liste');
  });

  it('champ lexical : le thème à écrire n’apparaît jamais dans l’énoncé', () => {
    for (const level of [3, 4] as const)
      for (const q of tirages('f6-champ-lexical', level)) {
        if (q.answer.kind !== 'text') continue;
        for (const juste of q.answer.accepted) expect(q.prompt, juste).not.toContain(`« ${juste} »`);
      }
  });

  it('mots des disciplines : le mot d’une opération voisine est expliqué', () => {
    const q = trouve('f6-mots-disciplines', 3, 'résultat d’une addition');
    expect(check(q, saisie('somme')).correct).toBe(true);
    expect(check(q, saisie('total')).correct).toBe(false);
  });
});
