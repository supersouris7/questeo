import { describe, expect, it } from 'vitest';
import { chaptersOf, getChapterOfSkill, isFreeChapter, maxLevelOf } from '@epicademie/content';
import { classPool, commonSubjects, drawFromPool, roomGrade } from './class-pool.ts';

const premium = () => Promise.resolve(true);
const free = (chapterId: string) => Promise.resolve(isFreeChapter(chapterId));
const chaptersIn = (pool: readonly string[]) => [...new Set(pool.map((id) => getChapterOfSkill(id)))];

describe('questions de sa classe', () => {
  it('un CM1 et un 4e reçoivent des notions de leur classe', async () => {
    for (const grade of ['cm1', '4e'] as const) {
      const pool = await classPool('maths', grade, premium);
      expect(pool.length).toBeGreaterThan(0);
      expect(chaptersIn(pool).every((c) => c?.grade === grade && c.subject === 'maths')).toBe(true);
      for (let seed = 1; seed <= 50; seed++) {
        const q = drawFromPool(pool, seed, 2);
        expect(getChapterOfSkill(q?.skillId ?? '')?.grade).toBe(grade);
      }
    }
  });

  it('famille non abonnée : chapitres gratuits seulement', async () => {
    const pool = await classPool('maths', '4e', free);
    expect(chaptersIn(pool).map((c) => c?.id)).toEqual([chaptersOf('maths', '4e')[0]?.id]);
    expect(pool.length).toBeLessThan((await classPool('maths', '4e', premium)).length);
  });

  it('« adulte » et classe inconnue jouent la classe de repli', async () => {
    expect(roomGrade('adulte')).toBe('5e');
    expect(roomGrade(null)).toBe('5e');
    expect(await classPool('maths', 'adulte', premium)).toEqual(await classPool('maths', '5e', premium));
  });

  it('tirage reproductible par graine, niveau borné à celui de la notion', async () => {
    const pool = await classPool('maths', 'cm2', premium);
    expect(drawFromPool(pool, 42, 1)).toEqual(drawFromPool(pool, 42, 1));
    expect(new Set(Array.from({ length: 40 }, (_, seed) => drawFromPool(pool, seed, 1)?.skillId)).size).toBeGreaterThan(
      1,
    );
    const q = drawFromPool(pool, 42, 3);
    expect(q?.level).toBe(Math.min(3, maxLevelOf(q?.skillId ?? '')));
    expect(drawFromPool([], 42, 1)).toBeNull();
  });

  it('matières communes : chacune a des notions pour toutes les classes ; le chapitre gratuit suffit', async () => {
    const grades = ['cm1', '4e', 'adulte'] as const;
    const subjects = commonSubjects(grades);
    expect(subjects).toContain('maths');
    expect(subjects).not.toContain('francais');
    for (const subject of subjects) {
      for (const g of grades) expect((await classPool(subject, g, free)).length).toBeGreaterThan(0);
    }
    expect(commonSubjects([])).toEqual([]);
  });
});
