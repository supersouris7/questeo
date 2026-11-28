import { describe, expect, it } from 'vitest';
import { generate } from '../catalog.ts';
import { check } from '../check.ts';
import { analyzeSkill } from '../lisibilite.ts';
import { sensIssues } from '../sens.ts';
import { getSource } from '../sources.ts';
import type { Level, Question } from '../types.ts';
import { FCM1_VERBE_SUJET } from './verbe-sujet.ts';
import {
  AVANT_SUJET,
  AVANT_TYPES,
  FAITS_VS,
  GROUPES_SUJETS,
  NOMS_VERBES,
  PHRASES_DOUBLES,
  PHRASES_INFINITIF,
  PHRASES_NEGATIVES,
  PHRASES_SIMPLES,
  SUJETS,
  SUJETS_ET_APRES_VERBE,
  SUJETS_PIEGES,
  VERBES_IRREGULIERS,
  VERBES_REGULIERS,
  sentence,
} from './verbe-sujet.donnees.ts';

const skills = FCM1_VERBE_SUJET;

describe('francais cm1 — le verbe et le sujet', () => {
  it('le chapitre compte les cinq notions du lot, à 5 niveaux', () => {
    expect(skills.map((s) => s.id)).toEqual([
      'fcm1-verbe-conjugue',
      'fcm1-infinitif',
      'fcm1-groupe-sujet',
      'fcm1-types-sujets',
      'fcm1-nom-ou-verbe',
    ]);
    for (const s of skills) expect(s.levels).toBe(5);
  });

  it('chaque fait cite une source du registre et une citation non vide', () => {
    for (const f of FAITS_VS) {
      expect(getSource(f.source), f.id).toBeDefined();
      expect(f.citation.trim().length, f.id).toBeGreaterThan(10);
    }
  });

  it('au moins deux erreurs typiques expliquées par notion (niveaux 1 à 5, 20 graines)', () => {
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
            const [first] = q.answer.accepted;
            expect(check(q, { kind: 'text', text: first ?? '' }).correct, `${s.id} N${level} g${seed}`).toBe(true);
            for (const t of q.traps)
              if ('text' in t) expect(check(q, { kind: 'text', text: t.text }).correct, t.text).toBe(false);
          }
        }
  });
});

describe('banques de phrases', () => {
  it('chaque phrase étiquetée a le bon nombre de verbes', () => {
    const verbs = (p: readonly { tag: string }[]) => p.filter((m) => m.tag === 'v').length;
    for (const p of [...PHRASES_SIMPLES, ...PHRASES_INFINITIF, ...PHRASES_NEGATIVES]) expect(verbs(p)).toBe(1);
    for (const p of PHRASES_DOUBLES) expect(verbs(p)).toBe(2);
    for (const p of [...PHRASES_SIMPLES, ...PHRASES_NEGATIVES])
      for (const m of p) if (m.tag === 'v') expect(m.inf).toBeTruthy();
  });

  it('les infinitifs régulièrement formés se terminent par -er ou -ir', () => {
    for (const v of VERBES_REGULIERS) expect(v.inf).toMatch(/(er|ir)$/);
    for (const v of [...VERBES_REGULIERS, ...VERBES_IRREGULIERS]) expect(v.formes.length).toBeGreaterThanOrEqual(4);
  });

  it('nom ou verbe : les formes plurielles suivent la règle (-s pour le nom, -nt pour le verbe)', () => {
    for (const e of NOMS_VERBES) {
      expect(e.mot).toMatch(/e$/);
      expect(e.verbe.toLowerCase()).toContain(e.mot);
      expect(e.nom.toLowerCase()).toContain(e.mot);
    }
  });
});

describe('repasse du chapitre', () => {
  const each = (id: string, level: Level, test: (q: Question) => void) => {
    for (let seed = 0; seed < 80; seed++) test(generate(id, level, seed));
  };
  const typed = (q: Question, text: string) => check(q, { kind: 'text', text }).correct;
  const lines = (q: Question) => (q.figure?.kind === 'document' ? q.figure.lines : []);
  const bank = [...PHRASES_SIMPLES, ...PHRASES_INFINITIF, ...PHRASES_NEGATIVES, ...PHRASES_DOUBLES];

  it('version 2, un sens conforme et rien à reprendre selon le détecteur', () => {
    const chapter = { id: 'fcm1-verbe-sujet', subject: 'francais' as const, grade: 'cm1' as const };
    for (const s of skills) {
      expect(s.version, s.id).toBe(2);
      expect(s.sens?.length, s.id).toBeGreaterThanOrEqual(1);
      expect(sensIssues(s), s.id).toEqual([]);
      expect(analyzeSkill(s, chapter).counts, s.id).toEqual({});
    }
  });

  it('la dernière bulle donne la réponse en gras', () => {
    for (const s of skills)
      for (const level of [1, 2, 3, 4, 5] as const)
        each(s.id, level, (q) => expect(q.steps.at(-1), q.prompt).toMatch(/\*\*.+\*\*/));
  });

  it('verbe conjugué, niveau 5 : le total compte les verbes de chaque ligne, avec un infinitif à écarter', () => {
    const totals = new Set<number>();
    each('fcm1-verbe-conjugue', 5, (q) => {
      const phrases = lines(q).map((l) => bank.find((p) => `${sentence(p)}.` === l) ?? []);
      const count = (tag: string) => phrases.flat().filter((m) => m.tag === tag).length;
      expect(count('i')).toBeGreaterThanOrEqual(1);
      expect(check(q, { kind: 'number', text: String(count('v')) }).correct).toBe(true);
      totals.add(count('v'));
    });
    expect([...totals].sort()).toEqual([4, 5, 6]);
  });

  it('saisies : les accents ne sont pas exigés, la faute typique reste refusée', () => {
    const seen = new Set<string>();
    each('fcm1-infinitif', 4, (q) => {
      if (!/« (tu es|il est|vous êtes) »/.test(q.prompt)) return;
      seen.add('etre');
      expect(typed(q, 'être')).toBe(true);
      expect(typed(q, 'etre')).toBe(true);
    });
    each('fcm1-groupe-sujet', 3, (q) => {
      if (!q.prompt.includes('La maîtresse')) return;
      seen.add('maitresse');
      expect(typed(q, 'la maitresse')).toBe(true);
      expect(typed(q, 'maîtresse')).toBe(false);
    });
    each('fcm1-nom-ou-verbe', 3, (q) => {
      if (!q.prompt.includes('il élève')) return;
      seen.add('eleve');
      expect(typed(q, 'ils élèvent')).toBe(true);
      expect(typed(q, 'ils élèves')).toBe(false);
    });
    expect(seen.size).toBe(3);
  });

  it('aucune forme d’« être » qui soit aussi un autre verbe', () => {
    expect(VERBES_IRREGULIERS.flatMap((v) => v.formes)).not.toContain('je suis');
  });

  it('niveaux 4 et 5 du groupe sujet : la ligne demandée commence par un groupe qui dit quand', () => {
    each('fcm1-groupe-sujet', 5, (q) => {
      const n = Number(/ligne (\d)/.exec(q.prompt)?.[1]);
      expect(AVANT_SUJET.some((a) => lines(q)[n - 1]?.startsWith(a))).toBe(true);
    });
    for (const level of [4, 5] as const)
      each('fcm1-groupe-sujet', level, (q) => {
        for (const line of q.figure ? lines(q) : [q.prompt])
          expect(line).not.toMatch(/(matin|nuit|demain).*(matin|nuit|demain)/i);
      });
  });

  it('nom ou verbe, niveau 1 : les choix gardent le même ordre et la réponse suit la phrase', () => {
    const correct = new Set<number>();
    each('fcm1-nom-ou-verbe', 1, (q) => {
      if (q.answer.kind !== 'choice') throw new Error('choix attendu');
      expect(q.answer.options).toEqual(['un nom', 'un verbe', 'un adjectif']);
      const verbe = NOMS_VERBES.some((e) => q.prompt.endsWith(`« ${e.verbe} »`));
      expect(q.answer.correct).toBe(verbe ? 1 : 0);
      correct.add(q.answer.correct);
    });
    expect(correct.size).toBe(2);
  });

  it('groupes nominaux du CM1 seulement : aucun complément du nom parmi les sujets', () => {
    const groupes = [
      ...GROUPES_SUJETS.map((g) => g.gs),
      ...[...SUJETS, ...SUJETS_PIEGES, ...SUJETS_ET_APRES_VERBE].map((x) => x.s),
    ];
    for (const g of groupes) expect(g).not.toMatch(/ (de|du|des|d’|à|au|aux) /);
  });

  const LABELS = ['un pronom personnel', 'un groupe nominal', 'plusieurs noms'];
  const typeDe = (line: string) =>
    SUJETS.find((x) => line.toLowerCase().includes(`${x.s} ${x.reste}`.toLowerCase()))?.type ?? '';

  it('types de sujets, niveaux 3 et 4 : trois phrases à trier, chacune avec la liste des trois types', () => {
    for (const level of [3, 4] as const) {
      const attendus = new Set<string>();
      each('fcm1-types-sujets', level, (q) => {
        if (q.answer.kind !== 'cloze') throw new Error('texte à trous attendu');
        expect(lines(q)).toHaveLength(3);
        expect(new Set(lines(q)).size).toBe(3);
        expect(q.answer.blanks).toHaveLength(3);
        const answers = q.answer.blanks.map((b, i) => {
          if (b.mode !== 'list') throw new Error('liste attendue');
          expect(b.options).toEqual(LABELS);
          expect(b.correct, lines(q)[i]).toBe(['pronom', 'gn', 'noms'].indexOf(typeDe(lines(q)[i] ?? '')));
          attendus.add(b.options[b.correct] ?? '');
          return b.options[b.correct] ?? '';
        });
        expect(check(q, { kind: 'cloze', answers }).correct).toBe(true);
        const faux = [LABELS.find((l) => l !== answers[0]) ?? '', ...answers.slice(1)];
        expect(check(q, { kind: 'cloze', answers: faux }).parts).toEqual([false, true, true]);
        expect(q.steps.at(-1)).toContain(`**${answers.join(' ; ')}**`);
      });
      expect(attendus.size).toBe(3);
    }
  });

  it('types de sujets, niveau 4 : seule nouveauté, un groupe qui dit quand devant chaque phrase', () => {
    for (const level of [3, 4] as const)
      each('fcm1-types-sujets', level, (q) => {
        const devant = lines(q).map((l) => AVANT_TYPES.find((a) => l.startsWith(`${a} `)));
        if (level === 3) expect(devant).toEqual([undefined, undefined, undefined]);
        else expect(new Set(devant.filter(Boolean)).size, lines(q).join(' ')).toBe(3);
        for (const l of lines(q)) expect(typeDe(l), l).not.toBe('');
      });
  });

  it('types de sujets : le niveau 1 demande le « type », mot du programme', () => {
    each('fcm1-types-sujets', 1, (q) => expect(q.prompt).toContain('Choisis son type.'));
  });

  it('types de sujets, niveau 5 : de un à trois sujets comptés et nommés, un « et » hors du sujet à écarter', () => {
    const totaux = new Set<number>();
    for (let seed = 0; seed < 500; seed++) {
      const q = generate('fcm1-types-sujets', 5, seed);
      const piege = SUJETS_ET_APRES_VERBE.find((x) => lines(q).includes(`${x.s} ${x.reste}.`));
      expect(piege, `graine ${seed}`).toBeDefined();
      expect(lines(q)).toHaveLength(5);
      expect(lines(q).filter((l) => l.startsWith(`${piege?.s} `))).toHaveLength(1);
      const comptes = SUJETS.filter((x) => x.type === 'noms' && lines(q).includes(`${x.s} ${x.reste}.`));
      expect(check(q, { kind: 'number', text: String(comptes.length) }).correct).toBe(true);
      for (const x of comptes) expect(q.steps.join(' ')).toContain(`« ${x.s} »`);
      const tropUn = JSON.stringify(check(q, { kind: 'number', text: String(comptes.length + 1) }));
      expect(tropUn).toContain('n’est pas dans le sujet');
      totaux.add(comptes.length);
    }
    expect([...totaux].sort()).toEqual([1, 2, 3]);
  });

  it('types de sujets, niveau 5 : compter le sujet piège a toujours son explication', () => {
    for (let seed = 0; seed < 500; seed++) {
      const q = generate('fcm1-types-sujets', 5, seed);
      if (q.answer.kind !== 'number') throw new Error('nombre attendu');
      const tropUn = String(q.answer.value.n / q.answer.value.d + 1);
      const result = check(q, { kind: 'number', text: tropUn });
      expect(result.correct).toBe(false);
      expect(JSON.stringify(result), `graine ${seed}`).toContain('Tu en as compté un de trop');
    }
  });

  it('types de sujets, niveau 5 : deux erreurs typiques à chaque tirage, dont un sujet oublié', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const q = generate('fcm1-types-sujets', 5, seed);
      if (q.answer.kind !== 'number') throw new Error('nombre attendu');
      expect(q.traps.length, `graine ${seed}`).toBeGreaterThanOrEqual(2);
      const unDeMoins = String(q.answer.value.n / q.answer.value.d - 1);
      const result = check(q, { kind: 'number', text: unDeMoins });
      expect(result.correct).toBe(false);
      expect(JSON.stringify(result), `graine ${seed}`).toContain('Tu en as oublié un');
    }
  });

  it('types de sujets : le mémo dit « nom noyau », comme le programme', () => {
    const memo = JSON.stringify(skills.find((s) => s.id === 'fcm1-types-sujets'));
    expect(memo).toContain('a un nom noyau');
    expect(memo).not.toContain('nom principal');
  });

  it('types de sujets : le mémo précise que le pronom est un pronom personnel sujet', () => {
    const memo = skills.find((s) => s.id === 'fcm1-types-sujets')?.lesson.memo.join(' ');
    expect(memo).toContain('Un **pronom personnel sujet** est un petit mot sujet');
    expect(memo).not.toContain('**pronom personnel**');
  });

  it('types de sujets : les pièges sur un pronom parlent des noms du sujet, pas de la phrase', () => {
    for (const level of [1, 2, 3, 4, 5] as const)
      each('fcm1-types-sujets', level, (q) => expect(JSON.stringify(q)).not.toContain('aucun nom ici'));
  });

  it('« Qui est-ce qui » : chaque question, relue en entier, est en bon français', () => {
    const questions = new Set<string>();
    for (const id of ['fcm1-groupe-sujet', 'fcm1-types-sujets'])
      for (const level of [1, 2, 3, 4, 5] as const)
        for (let seed = 0; seed < 300; seed++)
          for (const s of generate(id, level, seed).steps) {
            const question = /« Qui est-ce qui (.+?) \? »/u.exec(s)?.[1];
            if (question) questions.add(question);
          }
    expect([...questions].sort((a, b) => a.localeCompare(b, 'fr'))).toEqual([
      'aboie très fort',
      'arrive à la maison',
      'cache le soleil',
      'chante dans la cour',
      'chante très fort',
      'court très vite',
      'dort sur le canapé',
      'dort sur le tapis',
      'entre en classe',
      'joue au ballon',
      'joue aux cartes',
      'joue dans la cour',
      'joue du piano',
      'lit un livre',
      'lit une histoire',
      'lit une histoire à la classe',
      'mange à la cantine',
      'nage dans le bocal',
      'ouvre la porte',
      'part en sortie',
      'part en voyage',
      'prépare le repas',
      'range sa chambre',
    ]);
  });

  it('nom ou verbe, niveau 4 : un autre mot est écarté avec « hier », jamais avec une règle d’accord fausse', () => {
    const mots = new Set<string>();
    for (let seed = 0; seed < 1000; seed++) {
      const q = generate('fcm1-nom-ou-verbe', 4, seed);
      expect(JSON.stringify(q.traps)).not.toContain('change avec le sujet');
      for (const t of q.traps) {
        if (!('text' in t) || !t.why.includes('« hier »')) continue;
        expect(t.why).toBe(`« ${t.text} » ne change pas si tu ajoutes « hier » : ce n’est pas le verbe.`);
        mots.add(t.text);
      }
    }
    expect([...mots]).toEqual(expect.arrayContaining(['rouge', 'longue', 'ouverte', 'neuve', 'lapins']));
    expect(mots.size).toBe(NOMS_VERBES.length * 2);
  });
});
