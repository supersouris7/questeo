import { and, desc, eq, gt, gte, isNotNull, ne, notInArray, sql } from 'drizzle-orm';
import type { AnswerFact, FeelingFact } from '@epicademie/engine';
import type { Executor } from '../../db/client.ts';
import type { ModeId } from '@epicademie/shared';
import { attempts, bossRecords, sessions, skillStates } from '../../db/schema.ts';

/** Parties qui ne sont pas de l'entraînement : jamais comptées dans les badges de série parfaite. */
const NOT_PRACTICE_MODES: ModeId[] = ['boss', 'evaluation'];

/** Réponses lues par le suivi : au plus un an, et au plus ce nombre (les plus récentes). */
const MAX_FACTS = 5_000;

/** Lecture des réponses d'un joueur pour le suivi des apprentissages. */
export function learningRepo(db: Executor) {
  return {
    async facts(profileId: string, since: Date, timeZone: string): Promise<AnswerFact[]> {
      const rows = await db
        .select({
          skillId: attempts.skillId,
          attempt: attempts.attempt,
          correct: attempts.correct,
          hinted: attempts.hinted,
          collective: attempts.collective,
          at: attempts.createdAt,
          // Jour dans le fuseau de la famille (semaine du lundi au dimanche, en France).
          day: sql<string>`to_char(${attempts.createdAt} at time zone ${timeZone}, 'YYYY-MM-DD')`,
          mode: sessions.mode,
          diagnosis: attempts.diagnosis,
        })
        .from(attempts)
        .innerJoin(sessions, eq(sessions.id, attempts.sessionId))
        .where(and(eq(attempts.profileId, profileId), gte(attempts.createdAt, since)))
        .orderBy(desc(attempts.id))
        .limit(MAX_FACTS);
      return rows.map((r) => ({ ...r, attempt: r.attempt === 2 ? 2 : 1, at: r.at.toISOString() }));
    },

    /** Jour de fin (fuseau de la famille) de chaque série ou combat terminé depuis `since`. */
    async finishedDays(profileId: string, since: Date, timeZone: string): Promise<string[]> {
      const rows = await db
        .select({ day: sql<string>`to_char(${sessions.finishedAt} at time zone ${timeZone}, 'YYYY-MM-DD')` })
        .from(sessions)
        .where(
          and(
            eq(sessions.profileId, profileId),
            ne(sessions.mode, 'evaluation'),
            gte(sessions.finishedAt, since),
            gt(sessions.answered, 0),
          ),
        );
      return rows.map((r) => r.day);
    },

    /** Réponses « Je me sens capable ? » depuis `since` : jour de fin de série et note, rien d'autre. */
    async feelings(profileId: string, since: Date, timeZone: string): Promise<FeelingFact[]> {
      const rows = await db
        .select({
          day: sql<string>`to_char(${sessions.finishedAt} at time zone ${timeZone}, 'YYYY-MM-DD')`,
          feeling: sessions.feeling,
        })
        .from(sessions)
        .where(and(eq(sessions.profileId, profileId), gte(sessions.finishedAt, since), isNotNull(sessions.feeling)));
      return rows.flatMap(({ day, feeling }) => (feeling === null ? [] : [{ day, feeling }]));
    },

    /** Compteurs des badges (voir @epicademie/engine/badges.ts), tirés des événements enregistrés. */
    async badgeCounters(profileId: string, timeZone: string) {
      const [boss] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(bossRecords)
        .where(and(eq(bossRecords.profileId, profileId), gt(bossRecords.wins, 0)));
      // Série parfaite : terminée, au moins 4 réponses, toutes justes ; une par notion (ou
      // chapitre) et par jour, pour ne pas récompenser la répétition d'une série trop facile.
      const [perfect] = await db
        .select({
          n: sql<number>`count(distinct (coalesce(${sessions.skillId}, ${sessions.chapterId}), (${sessions.finishedAt} at time zone ${timeZone})::date))::int`,
        })
        .from(sessions)
        .where(
          and(
            eq(sessions.profileId, profileId),
            // Ni boss, ni Arène d'évaluation : une épreuve mesure, elle ne compte pas comme série parfaite.
            notInArray(sessions.mode, NOT_PRACTICE_MODES),
            isNotNull(sessions.finishedAt),
            gte(sessions.answered, 4),
            eq(sessions.correct, sessions.answered),
          ),
        );
      const [retries] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(attempts)
        .where(and(eq(attempts.profileId, profileId), eq(attempts.attempt, 2), eq(attempts.correct, true)));
      const medals = await db
        .select({ skillId: skillStates.skillId, best: skillStates.bestSeries, stage: skillStates.stage })
        .from(skillStates)
        .where(eq(skillStates.profileId, profileId));
      // Coffres reçus (entraînement et boss).
      const [chests] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(sessions)
        .where(and(eq(sessions.profileId, profileId), isNotNull(sessions.chest)));
      return { boss: boss?.n ?? 0, perfect: perfect?.n ?? 0, retries: retries?.n ?? 0, chests: chests?.n ?? 0, medals };
    },
  };
}
