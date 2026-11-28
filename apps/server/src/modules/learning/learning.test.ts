import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { fmt, generate } from '@epicademie/content';
import type { Journey, LearningReport, ParentWeek, Profile, SessionSummary } from '@epicademie/shared';
import { attempts, sessions } from '../../db/schema.ts';
import { dayIn } from '../../core/clock.ts';
import { createTestApp, profileInput } from '../../testing/harness.ts';

let t: Awaited<ReturnType<typeof createTestApp>>;
let profileId: string;

beforeAll(async () => {
  t = await createTestApp({ today: '2026-11-20' });
});
afterAll(() => t.close());
beforeEach(async () => {
  t.clock.set('2026-11-20');
  await t.reset();
  profileId = (
    await t.http.inject({ method: 'POST', url: '/api/v1/profiles', payload: profileInput() })
  ).json<Profile>().id;
});

const start = async () =>
  (
    await t.http.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { profileId, mode: 'entrainement', subject: 'maths', chapterId: 'm5-calcul', skillId: 'm5-tables' },
    })
  ).json<{ id: string }>().id;

/** Réponse à la question m5-tables niveau 1 de graine `seed` (juste ou « −1 »). */
const answer = (sessionId: string, seed: number, right: boolean, attempt: 1 | 2 = 1) => {
  const q = generate('m5-tables', 1, seed);
  if (q.answer.kind !== 'number') throw new Error('attendu : nombre');
  return t.http.inject({
    method: 'POST',
    url: `/api/v1/sessions/${sessionId}/answers`,
    payload: {
      skillId: 'm5-tables',
      level: 1,
      seed,
      variant: false,
      response: { kind: 'number', text: right ? fmt(q.answer.value) : '-1' },
      durationMs: 1500,
      attempt,
    },
  });
};
const report = async () => (await t.http.inject(`/api/v1/profiles/${profileId}/learning`)).json<LearningReport>();

describe('enregistrement des réponses', () => {
  it('second essai après l’indice : enregistré « avec aide », sans XP ni effet sur le score', async () => {
    const id = await start();
    expect((await answer(id, 1, false)).statusCode).toBe(200);
    const retry = await answer(id, 1, true, 2);
    expect(retry.json()).toMatchObject({ correct: true, xp: 0 });
    const rows = await t.database.db.select().from(attempts).where(eq(attempts.sessionId, id));
    expect(rows.map((r) => [r.attempt, r.correct, r.hinted, r.xp])).toEqual([
      [1, false, false, 0],
      [2, true, true, 0],
    ]);
    expect(rows[0]?.skillVersion).toBe(1);
    // Score de la partie : la 1re réponse seulement (fausse).
    for (const seed of [2, 3, 4]) await answer(id, seed, true);
    const sum = (await t.http.inject({ method: 'POST', url: `/api/v1/sessions/${id}/finish` })).json<SessionSummary>();
    expect(sum.regular).toEqual({ answered: 4, correct: 3 });
  });

  it('second essai refusé sans 1re réponse fausse ; rejoué, il n’est compté qu’une fois', async () => {
    const id = await start();
    expect((await answer(id, 1, true, 2)).statusCode).toBe(409);
    await answer(id, 2, true);
    expect((await answer(id, 2, true, 2)).statusCode).toBe(409);
    await answer(id, 3, false);
    expect((await answer(id, 3, true, 2)).json()).toMatchObject({ correct: true });
    expect((await answer(id, 3, true, 2)).json()).toMatchObject({ correct: true, xp: 0 });
    const rows = await t.database.db.select().from(attempts).where(eq(attempts.sessionId, id));
    expect(rows.filter((r) => r.attempt === 2)).toHaveLength(1);
  });

  it('erreur typique reconnue : enregistrée pour repérer les erreurs récurrentes', async () => {
    // Une question de tables qui prévoit un piège (ex. addition au lieu de multiplication).
    const seed = [...Array(50).keys()].find((k) => generate('m5-tables', 1, k).traps.some((tr) => 'value' in tr)) ?? -1;
    const trap = generate('m5-tables', 1, seed).traps.find((tr) => 'value' in tr);
    if (!trap || !('value' in trap)) throw new Error('aucun piège de valeur');
    const id = await start();
    await t.http.inject({
      method: 'POST',
      url: `/api/v1/sessions/${id}/answers`,
      payload: {
        skillId: 'm5-tables',
        level: 1,
        seed,
        variant: false,
        response: { kind: 'number', text: fmt(trap.value) },
        durationMs: 1000,
      },
    });
    const [row] = await t.database.db.select().from(attempts).where(eq(attempts.sessionId, id));
    expect(row?.diagnosis).toBe(trap.why);
  });
});

describe('rapport de suivi', () => {
  it('distingue réussite autonome et réussite avec aide, par notion, chapitre et matière', async () => {
    // Les réponses sont horodatées par la base (heure réelle) : l'horloge du service doit être au même jour,
    // sinon le découpage par semaine dépend du jour d'exécution (ex. lundi).
    t.clock.set(dayIn('Europe/Paris', new Date()));
    const id = await start();
    await answer(id, 1, false);
    await answer(id, 1, true, 2);
    for (const seed of [2, 3, 4]) await answer(id, seed, true);
    const r = await report();
    expect(r.tally).toEqual({ answered: 4, autonomous: 3, helped: 1, hints: 1, collective: 0 });
    const skill = r.skills.find((s) => s.skillId === 'm5-tables');
    expect(skill).toMatchObject({ chapterId: 'm5-calcul', subject: 'maths', status: 'en-progression' });
    expect(r.chapters.map((c) => c.chapterId)).toEqual(['m5-calcul']);
    expect(r.subjects.map((s) => s.subject)).toEqual(['maths']);
    expect(r.weeks.at(-1)?.tally.answered).toBe(4);
    expect(r.lastActivity).not.toBeNull();
  });

  it('nouveau joueur : rapport vide ; une autre famille ne le lit pas', async () => {
    const r = await report();
    expect(r).toMatchObject({ skills: [], toRework: [], tally: { answered: 0 } });
    const other = await t.signup('autre@famille.test');
    expect((await t.as(other.cookie).inject(`/api/v1/profiles/${profileId}/learning`)).statusCode).toBe(404);
  });
});

describe('badges', () => {
  const badges = async () =>
    (await t.http.inject(`/api/v1/profiles/${profileId}/badges`)).json<
      { category: string; value: number; tier: string | null }[]
    >();
  const perfectSeries = async () => {
    const id = await start();
    for (const seed of [11, 12, 13, 14]) await answer(id, seed, true);
    await t.http.inject({ method: 'POST', url: `/api/v1/sessions/${id}/finish` });
  };

  it('nouveau joueur : aucun grade ; les objectifs sont annoncés', async () => {
    const list = await badges();
    expect(list.map((b) => b.category)).toEqual([
      'boss',
      'parfait',
      'perseverance',
      'chapitres',
      'consolidees',
      'coffres',
    ]);
    expect(list.every((b) => b.tier === null)).toBe(true);
  });

  it('série parfaite comptée une fois par notion et par jour ; erreur corrigée au 2e essai', async () => {
    await perfectSeries();
    await perfectSeries();
    const id = await start();
    await answer(id, 30, false);
    await answer(id, 30, true, 2);
    const list = await badges();
    expect(list.find((b) => b.category === 'parfait')?.value).toBe(1);
    expect(list.find((b) => b.category === 'perseverance')?.value).toBe(1);
    // Le lendemain, une nouvelle série parfaite compte.
    t.clock.set('2026-11-21');
    await perfectSeries();
    expect((await badges()).find((b) => b.category === 'parfait')?.value).toBe(2);
  });
});

describe('progrès personnel et ressenti de fin de séance', () => {
  const journeyOf = async (id: string) => (await t.http.inject(`/api/v1/profiles/${id}/journey`)).json<Journey>();
  const finish = (id: string) => t.http.inject({ method: 'POST', url: `/api/v1/sessions/${id}/finish` });
  const rate = (id: string, feeling: number) =>
    t.http.inject({ method: 'POST', url: `/api/v1/sessions/${id}/feeling`, payload: { feeling } });

  it('compare la notion à deux semaines d’écart et compte les efforts après une pause', async () => {
    t.clock.set('2026-11-06');
    const old = await start();
    for (const seed of [1, 2, 3, 4]) await answer(old, seed, seed === 1);
    await finish(old);
    await t.database.db.update(attempts).set({ createdAt: new Date('2026-11-06T10:00:00Z') });
    t.clock.set('2026-11-20');
    const recent = await start();
    for (const seed of [5, 6, 7, 8]) await answer(recent, seed, seed !== 5);
    await finish(recent);
    await t.database.db
      .update(attempts)
      .set({ createdAt: new Date('2026-11-20T10:00:00Z') })
      .where(eq(attempts.sessionId, recent));
    const j = await journeyOf(profileId);
    expect(j.gains).toEqual([
      {
        skillId: 'm5-tables',
        before: { day: '2026-11-06', correct: 1, answered: 4 },
        now: { day: '2026-11-20', correct: 3, answered: 4 },
      },
    ]);
    expect(j.effort).toEqual({ series: 1, days: 1, reworked: ['m5-tables'], pauseDays: 14 });
  });

  it('un joueur sans réponse : rien à comparer, aucun effort compté', async () => {
    expect(await journeyOf(profileId)).toEqual({
      today: '2026-11-20',
      gains: [],
      effort: { series: 0, days: 0, reworked: [], pauseDays: null },
    });
  });

  it('« Je me sens capable ? » : après la séance seulement, de 1 à 3, modifiable', async () => {
    const id = await start();
    expect((await rate(id, 3)).statusCode).toBe(409);
    await finish(id);
    expect((await rate(id, 4)).statusCode).toBe(400);
    expect((await rate(id, 1)).statusCode).toBe(204);
    expect((await rate(id, 3)).statusCode).toBe(204);
    const [row] = await t.database.db.select().from(sessions).where(eq(sessions.id, id));
    expect(row?.feeling).toBe(3);
    expect((await rate('00000000-0000-4000-8000-000000000000', 2)).statusCode).toBe(404);
  });

  const parentWeekUrl = (id: string) => `/api/v1/profiles/${id}/parent-week`;

  it('semaine du parent : efforts, ressenti agrégé de cet enfant seulement, conseil', async () => {
    const sibling = (
      await t.http.inject({ method: 'POST', url: '/api/v1/profiles', payload: profileInput('Tom') })
    ).json<Profile>().id;
    for (const feeling of [1, 1, 3]) {
      const id = await start();
      await answer(id, feeling, true);
      await finish(id);
      await rate(id, feeling);
    }
    expect((await t.http.inject(parentWeekUrl(profileId))).json<ParentWeek>()).toMatchObject({
      effort: { series: 3 },
      feelings: { week: { pasEncore: 2, unPeu: 0, oui: 1 }, before: { pasEncore: 0, unPeu: 0, oui: 0 }, trend: null },
      advice: 'rassurer',
    });
    expect((await t.http.inject(parentWeekUrl(sibling))).json<ParentWeek>()).toMatchObject({
      effort: { series: 0 },
      feelings: { week: { pasEncore: 0, unPeu: 0, oui: 0 } },
      advice: 'proposer',
    });
  });

  it('semaine du parent : refusée à une autre famille (404) et verrou parent fermé (403)', async () => {
    const other = t.as((await t.signup()).cookie);
    expect((await other.inject(parentWeekUrl(profileId))).statusCode).toBe(404);
    await t.http.inject({ method: 'POST', url: '/api/v1/auth/parent/lock' });
    expect((await t.http.inject(parentWeekUrl(profileId))).statusCode).toBe(403);
  });

  it('une autre famille ne lit ni n’écrit rien (404, aucune écriture)', async () => {
    const id = await start();
    await finish(id);
    const other = t.as((await t.signup()).cookie);
    expect((await other.inject(`/api/v1/profiles/${profileId}/journey`)).statusCode).toBe(404);
    const res = await other.inject({ method: 'POST', url: `/api/v1/sessions/${id}/feeling`, payload: { feeling: 1 } });
    expect(res.statusCode).toBe(404);
    const [row] = await t.database.db.select().from(sessions).where(eq(sessions.id, id));
    expect(row?.feeling).toBeNull();
  });
});
