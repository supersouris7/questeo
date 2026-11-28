import { z } from 'zod';
import { MODE_IDS } from './modes.ts';
import { SUBJECT_IDS } from './subjects.ts';

/**
 * Suivi des apprentissages d'un enfant (lu par l'enfant et le tableau de bord parent).
 *
 * Principes (docs/adr/0013-suivi-des-apprentissages.md) :
 * - pas de « pourcentage de maîtrise » : un état pédagogique par notion, en mots ;
 * - la maîtrise personnelle ne se fonde que sur les **premières réponses individuelles sans
 *   aide** ; les réussites avec aide (indice, second essai) et les réponses collectives (TV,
 *   raid, parent à côté) sont comptées à part ;
 * - données minimales : aucune donnée d'identité, seulement les réponses du jeu.
 */

/** État pédagogique d'une notion. */
export const SKILL_STATUSES = ['non-commencee', 'a-travailler', 'en-progression', 'a-consolider', 'acquise'] as const;
export type SkillStatus = (typeof SKILL_STATUSES)[number];

export const SKILL_STATUS_LABELS: Record<SkillStatus, string> = {
  'non-commencee': 'Pas encore commencée',
  'a-travailler': 'À renforcer',
  'en-progression': 'En progression',
  'a-consolider': 'À consolider',
  acquise: 'Acquise',
};

export const TRENDS = ['hausse', 'stable', 'baisse'] as const;
export type Trend = (typeof TRENDS)[number];

const count = z.number().int().nonnegative();
/** Part de réussite entre 0 et 1, ou null si trop peu de réponses pour en parler. */
const rate = z.number().min(0).max(1).nullable();

/** Comptes de réponses, séparés selon l'aide et le contexte. */
export const TallySchema = z.object({
  /** Premières réponses individuelles (base de la maîtrise personnelle). */
  answered: count,
  /** … dont justes sans aide (« réussite autonome »). */
  autonomous: count,
  /** Réussites avec aide : indice affiché ou second essai. */
  helped: count,
  /** Aides utilisées (indices, seconds essais). */
  hints: count,
  /** Réponses collectives (TV, raid) : jamais dans la maîtrise personnelle. */
  collective: count,
});
export type Tally = z.infer<typeof TallySchema>;

export const SkillLearningSchema = z.object({
  skillId: z.string(),
  chapterId: z.string(),
  subject: z.enum(SUBJECT_IDS),
  status: z.enum(SKILL_STATUSES),
  tally: TallySchema,
  /** Réussite autonome sur les dernières réponses (au plus 10), null s'il y en a moins de 4. */
  recentRate: rate,
  /** Évolution : 5 dernières réponses comparées aux 5 précédentes (null si trop peu). */
  trend: z.enum(TRENDS).nullable(),
  lastPracticed: z.string().nullable(),
  /** Prochaine révision prévue (répétition espacée), jour AAAA-MM-JJ. */
  nextReview: z.string().nullable(),
  /** Erreurs typiques qui reviennent (au moins 2 fois), de la plus fréquente à la moins fréquente. */
  recurringErrors: z.array(z.object({ text: z.string(), count })),
});
export type SkillLearning = z.infer<typeof SkillLearningSchema>;

export const ChapterLearningSchema = z.object({
  chapterId: z.string(),
  subject: z.enum(SUBJECT_IDS),
  tally: TallySchema,
  /** Nombre de notions par état. */
  statuses: z.record(z.enum(SKILL_STATUSES), count),
});

export const SubjectLearningSchema = z.object({
  subject: z.enum(SUBJECT_IDS),
  tally: TallySchema,
  statuses: z.record(z.enum(SKILL_STATUSES), count),
});

export const WeekLearningSchema = z.object({
  /** Lundi de la semaine (AAAA-MM-JJ). */
  week: z.string(),
  tally: TallySchema,
  modes: z.array(z.enum(MODE_IDS)),
});

export const LearningReportSchema = z.object({
  /** Jour du calcul (AAAA-MM-JJ). */
  day: z.string(),
  tally: TallySchema,
  lastActivity: z.string().nullable(),
  subjects: z.array(SubjectLearningSchema),
  chapters: z.array(ChapterLearningSchema),
  skills: z.array(SkillLearningSchema),
  /** Notions à retravailler en priorité (au plus 5). */
  toRework: z.array(z.string()),
  /** Révisions à faire aujourd'hui ou en retard (au plus 5). */
  dueReviews: z.array(z.string()),
  /** 8 dernières semaines, de la plus ancienne à la plus récente. */
  weeks: z.array(WeekLearningSchema),
});
export type LearningReport = z.infer<typeof LearningReportSchema>;

// ——— Progrès personnel (« depuis quand », efforts) : l'enfant comparé à lui-même seulement ———

/** Réussite sur quelques premières réponses d'une période ; `day` : dernier jour de la période. */
const JourneyPointSchema = z.object({ day: z.string(), correct: count, answered: count });
export type JourneyPoint = z.infer<typeof JourneyPointSchema>;

export const JourneySchema = z.object({
  /** Jour du calcul (AAAA-MM-JJ). */
  today: z.string(),
  /** Notions où la réussite a monté (au plus 5, les plus fortes hausses d'abord) : jamais de recul. */
  gains: z.array(z.object({ skillId: z.string(), before: JourneyPointSchema, now: JourneyPointSchema })),
  /** Efforts des 7 derniers jours. */
  effort: z.object({
    /** Séries et combats terminés. */
    series: count,
    /** Jours d'entraînement. */
    days: count,
    /** Notions retravaillées après une réponse pas encore juste. */
    reworked: z.array(z.string()),
    /** Reprise cette semaine après une pause d'au moins 7 jours : sa durée, sinon null. */
    pauseDays: count.nullable(),
  }),
});
export type Journey = z.infer<typeof JourneySchema>;

// ——— Semaine vue par le parent : efforts d'abord, ressenti agrégé, un conseil ———

/** Réponses « Je me sens capable ? » comptées sur une période. */
const FeelingCountsSchema = z.object({ pasEncore: count, unPeu: count, oui: count });
export type FeelingCounts = z.infer<typeof FeelingCountsSchema>;

/** Conseil de la semaine (règles dans @epicademie/engine/parent-week, textes côté web). */
export const PARENT_ADVICE = [
  'proposer',
  'rassurer',
  'reprise',
  'perseverance',
  'progres',
  'regularite',
  'effort',
] as const;
export type ParentAdvice = (typeof PARENT_ADVICE)[number];

/** Un seul enfant par réponse : aucune donnée des autres, aucune comparaison. */
export const ParentWeekSchema = JourneySchema.extend({
  feelings: z.object({
    /** 7 derniers jours. */
    week: FeelingCountsSchema,
    /** Les 4 semaines d'avant. */
    before: FeelingCountsSchema,
    /** Évolution entre les deux périodes (null si trop peu de réponses). */
    trend: z.enum(TRENDS).nullable(),
  }),
  advice: z.enum(PARENT_ADVICE),
});
export type ParentWeek = z.infer<typeof ParentWeekSchema>;

// ——— Badges (conditions : @epicademie/engine/badges.ts) ———

export const BADGE_CATEGORIES = ['boss', 'parfait', 'perseverance', 'chapitres', 'consolidees', 'coffres'] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];
export const BADGE_TIERS = ['bronze', 'argent', 'or', 'diamant'] as const;
export type BadgeTier = (typeof BADGE_TIERS)[number];

export const BadgeProgressSchema = z.object({
  category: z.enum(BADGE_CATEGORIES),
  title: z.string(),
  how: z.string(),
  /** Compteur actuel. */
  value: z.number().int().nonnegative(),
  /** Grade atteint (null : pas encore de grade). */
  tier: z.enum(BADGE_TIERS).nullable(),
  /** Seuil du grade suivant (null : diamant atteint). */
  next: z.number().int().positive().nullable(),
});
export type BadgeProgress = z.infer<typeof BadgeProgressSchema>;
