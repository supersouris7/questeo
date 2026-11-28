import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type {
  AccessAction,
  AdminRole,
  AccountRole,
  Offer,
  ReportReason,
  SubscriptionStatus,
  ReportStatus,
  AvatarConfig,
  BossMedal,
  ChestRarity,
  Feeling,
  CompetenceState,
  EvaluationKind,
  EvaluationRole,
  Gender,
  Grade,
  HeroId,
  ItemId,
  ModeId,
  StudiedStatus,
  SubjectId,
} from '@epicademie/shared';

/**
 * Schéma PostgreSQL (source des migrations : `pnpm --filter @epicademie/server db:generate`).
 *
 * Conventions :
 * - identifiants `uuid`, horodatages `timestamptz`, jours (révision, naissance) en `date` ;
 * - JSON en `jsonb` typé par `$type` ;
 * - invariants métier simples doublés d'une contrainte CHECK (ex. pièces ≥ 0) : la base refuse
 *   un état incohérent même en cas de bug applicatif ;
 * - suppression d'un profil en cascade sur toutes ses données (droit à l'effacement).
 */

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const at = (name: string) => timestamp(name, { withTimezone: true });

/** Famille : regroupe le compte parent et les profils enfants (unité d'isolation des données). */
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  /**
   * Famille « autonome » : élève de moins de 15 ans sans parent rattaché (RGPD art. 8). Son
   * compte n'a ni e-mail ni mot de passe ; elle disparaît quand un parent rattache le profil.
   */
  autonomous: boolean('autonomous').notNull().default(false),
  createdAt: createdAt(),
});

/**
 * Compte de connexion (parent). E-mail stocké en minuscules (unique) ; mot de
 * passe haché (scrypt, sel aléatoire, voir core/auth/password.ts), jamais en clair.
 */
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    /** Nuls pour le compte d'un élève autonome (aucune donnée personnelle). */
    email: text('email'),
    passwordHash: text('password_hash'),
    /** Empreinte SHA-256 du code de récupération d'un élève autonome (jamais le code). */
    recoveryHash: text('recovery_hash'),
    role: text('role').$type<AccountRole>().notNull().default('parent'),
    /** Code PIN de l'Espace parent (empreinte scrypt), null tant qu'il n'est pas choisi. */
    parentPinHash: text('parent_pin_hash'),
    /** Erreurs de PIN d'affilée, et blocage après 5 erreurs. */
    pinFailures: integer('pin_failures').notNull().default(0),
    pinLockedUntil: timestamp('pin_locked_until', { withTimezone: true }),
    /** Rattachement d'un élève : erreurs de code d'invitation d'affilée, puis blocage temporaire. */
    joinFailures: integer('join_failures').notNull().default(0),
    joinLockedUntil: timestamp('join_locked_until', { withTimezone: true }),
    /** Adresse validée (lien reçu, ou e-mail vérifié par Google) ; nul : connexion refusée. */
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    /** Identifiant stable (`sub`) du compte Google relié. */
    googleSub: text('google_sub'),
    /** Première connexion par le portail (recette) ; nul : jamais. L'identité du portail est l'e-mail. */
    portalLinkedAt: timestamp('portal_linked_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('accounts_email_unique').on(t.email),
    uniqueIndex('accounts_google_sub_unique').on(t.googleSub),
    uniqueIndex('accounts_recovery_unique').on(t.recoveryHash),
    index('accounts_family_idx').on(t.familyId),
    index('accounts_created_at_idx').on(t.createdAt),
    check('accounts_email_lowercase', sql`${t.email} = lower(${t.email})`),
    check('accounts_role_valid', sql`${t.role} = 'parent'`),
  ],
);

/**
 * Session d'un appareil. Le cookie porte un jeton aléatoire ; la base n'en garde que l'empreinte
 * SHA-256 (une fuite de la base ne permet pas de se connecter). `parentUntil` : fin du
 * déverrouillage des actions parent (mot de passe confirmé récemment).
 */
export const authSessions = pgTable(
  'auth_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    expiresAt: at('expires_at').notNull(),
    parentUntil: at('parent_until'),
    createdAt: createdAt(),
  },
  (t) => [index('auth_sessions_account_idx').on(t.accountId), index('auth_sessions_expires_idx').on(t.expiresAt)],
);

/**
 * Invitation d'un élève autonome : code court (empreinte seule), durée limitée, usage unique.
 * Un parent la saisit dans son Espace parent pour rattacher le profil à sa famille.
 */
export const familyInvites = pgTable(
  'family_invites',
  {
    codeHash: text('code_hash').primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    expiresAt: at('expires_at').notNull(),
    usedAt: at('used_at'),
    createdAt: createdAt(),
  },
  (t) => [index('family_invites_family_idx').on(t.familyId)],
);

/** Lien de réinitialisation du mot de passe : empreinte du jeton, usage unique, courte durée. */
export const passwordResets = pgTable(
  'password_resets',
  {
    tokenHash: text('token_hash').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    expiresAt: at('expires_at').notNull(),
    usedAt: at('used_at'),
    createdAt: createdAt(),
  },
  (t) => [index('password_resets_account_idx').on(t.accountId)],
);

/** Liens de validation d'adresse e-mail : seule l'empreinte du jeton est gardée. */
export const emailVerifications = pgTable(
  'email_verifications',
  {
    tokenHash: text('token_hash').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    expiresAt: at('expires_at').notNull(),
    usedAt: at('used_at'),
    createdAt: createdAt(),
  },
  (t) => [index('email_verifications_account_idx').on(t.accountId)],
);

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * Famille du profil. Nul pour les profils créés avant les comptes (bêta) : invisibles de
     * toutes les familles jusqu'à leur rattachement (aucune donnée supprimée).
     */
    familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    avatar: jsonb('avatar').$type<AvatarConfig>().notNull(),
    gender: text('gender').$type<Gender>(),
    birthDate: date('birth_date', { mode: 'string' }),
    hero: text('hero').$type<HeroId>().notNull().default('alex'),
    grade: text('grade').$type<Grade>(),
    xp: integer('xp').notNull().default(0),
    coins: integer('coins').notNull().default(0),
    rubies: integer('rubies').notNull().default(2),
    soundOn: boolean('sound_on').notNull().default(true),
    musicOn: boolean('music_on').notNull().default(true),
    /** Objets équipés pour les combats de boss (3 au plus, pris dans l'inventaire). */
    equipped: jsonb('equipped').$type<ItemId[]>().notNull().default([]),
    /** Code ami (6 caractères), à donner en vrai à un copain d'une autre famille. */
    friendCode: text('friend_code'),
    createdAt: createdAt(),
  },
  (t) => [
    check('profiles_xp_nonnegative', sql`${t.xp} >= 0`),
    check('profiles_coins_nonnegative', sql`${t.coins} >= 0`),
    check('profiles_rubies_nonnegative', sql`${t.rubies} >= 0`),
    index('profiles_created_at_idx').on(t.createdAt),
    index('profiles_family_idx').on(t.familyId),
    uniqueIndex('profiles_friend_code_idx').on(t.friendCode),
  ],
);

export type ProfileRow = typeof profiles.$inferSelect;

/** Une partie : entraînement (mode ≠ boss) ou combat de boss (état dans `battle`). */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mode: text('mode').$type<ModeId>().notNull(),
    subject: text('subject').$type<SubjectId>().notNull(),
    chapterId: text('chapter_id').notNull(),
    skillId: text('skill_id'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    answered: integer('answered').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    xp: integer('xp').notNull().default(0),
    coins: integer('coins').notNull().default(0),
    /** Notions signalées « Je n'ai pas compris » pendant la partie. */
    confused: jsonb('confused').$type<string[]>().notNull().default([]),
    /** État du combat de boss (mode « boss »), tenu par le serveur. Voir modules/battles. */
    battle: jsonb('battle').$type<unknown>(),
    /** Rareté du coffre reçu à la fin de la partie (null : pas de coffre). */
    chest: text('chest').$type<ChestRarity>(),
    /** Épreuve du chapitre (série mélangée de toutes ses notions, validée à 80 %). */
    epreuve: boolean('epreuve').notNull().default(false),
    /** « Je me sens capable ? » en fin de séance : 1 pas encore, 2 un peu, 3 oui (null : sans réponse). */
    feeling: smallint('feeling').$type<Feeling>(),
  },
  (t) => [
    index('sessions_profile_mode_chapter_idx').on(t.profileId, t.mode, t.chapterId),
    check('sessions_feeling_range', sql`${t.feeling} between 1 and 3`),
  ],
);

export type SessionRow = typeof sessions.$inferSelect;

/** Chaque réponse donnée (historique, séries, anti-répétition des énoncés). */
export const attempts = pgTable(
  'attempts',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    skillId: text('skill_id').notNull(),
    level: smallint('level').notNull(),
    seed: integer('seed').notNull(),
    variant: boolean('variant').notNull(),
    response: jsonb('response').notNull(),
    correct: boolean('correct').notNull(),
    durationMs: integer('duration_ms').notNull(),
    xp: integer('xp').notNull(),
    /** 1 : première réponse ; 2 : second essai après l'indice (réussite « avec aide »). */
    attempt: smallint('attempt').notNull().default(1),
    /** Une aide était affichée (indice de l'entraînement, objet « indice » en combat). */
    hinted: boolean('hinted').notNull().default(false),
    /**
     * Réponse donnée à plusieurs (mode TV, raid, parent à côté) : ne compte jamais comme
     * maîtrise personnelle de l'enfant.
     */
    collective: boolean('collective').notNull().default(false),
    /** Version de la notion au moment de la réponse (historique conservé si l'exercice change). */
    skillVersion: smallint('skill_version').notNull().default(1),
    /** Erreur typique reconnue (texte de la correction), pour repérer les erreurs récurrentes. */
    diagnosis: text('diagnosis'),
    createdAt: createdAt(),
  },
  (t) => [
    index('attempts_session_idx').on(t.sessionId),
    index('attempts_profile_skill_idx').on(t.profileId, t.skillId),
    index('attempts_profile_created_idx').on(t.profileId, t.createdAt),
    check('attempts_level_range', sql`${t.level} between 1 and 5`),
    check('attempts_attempt_range', sql`${t.attempt} between 1 and 2`),
  ],
);

/** Répétition espacée : état de chaque notion pour chaque profil. */
export const skillStates = pgTable(
  'skill_states',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    skillId: text('skill_id').notNull(),
    stage: smallint('stage').notNull().default(0),
    due: date('due', { mode: 'string' }),
    attempts: integer('attempts').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    recent: jsonb('recent').$type<boolean[]>().notNull(),
    maintained: integer('maintained').notNull().default(0),
    /** Meilleure série (voir `seriesScore` : 6 = sans aide) : fixe la médaille. */
    bestSeries: smallint('best_series').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.skillId] }),
    check('skill_states_stage_range', sql`${t.stage} between 0 and 3`),
    check('skill_states_best_range', sql`${t.bestSeries} between 0 and 6`),
  ],
);

export type SkillStateRow = typeof skillStates.$inferSelect;

/** Objets de combat (bouclier, soin, indice) possédés par un profil. */
export const inventory = pgTable(
  'inventory',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    item: text('item').$type<ItemId>().notNull(),
    count: smallint('count').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.item] }),
    // Stock maximal : MAX_ITEM_STOCK (@epicademie/shared).
    check('inventory_count_range', sql`${t.count} between 0 and 9`),
  ],
);

/** Boss vaincus : la 1re victoire donne une médaille et un coffre. */
export const bossRecords = pgTable(
  'boss_records',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    wins: integer('wins').notNull().default(0),
    bestHearts: smallint('best_hearts').notNull().default(0),
    bestMedal: text('best_medal').$type<BossMedal>().notNull().default('bronze'),
    firstWonAt: timestamp('first_won_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.chapterId] })],
);

/**
 * Signalement d'une question par une famille. Le profil peut être supprimé (droit à
 * l'effacement) : le signalement reste, anonyme.
 */
export const questionReports = pgTable(
  'question_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    /** Nature : question précise ou signalement général (alors notion, niveau, graine nuls). */
    kind: text('kind').$type<'question' | 'general'>().notNull().default('question'),
    skillId: text('skill_id'),
    level: smallint('level'),
    seed: integer('seed'),
    skillVersion: smallint('skill_version'),
    /** Écran (route sans identifiant) et version de l'appli, pour un signalement général. */
    screen: text('screen'),
    appVersion: text('app_version'),
    reason: text('reason').$type<ReportReason>().notNull(),
    /** Commentaire déjà anonymisé (e-mails, téléphones, liens, prénoms de la famille masqués). */
    comment: text('comment'),
    status: text('status').$type<ReportStatus>().notNull().default('nouveau'),
    adminNote: text('admin_note'),
    createdAt: createdAt(),
    resolvedAt: at('resolved_at'),
    /** Date de l'export vers le suivi (commande `reports:export`) ; nulle : pas encore exporté. */
    exportedAt: at('exported_at'),
  },
  (t) => [
    index('question_reports_status_idx').on(t.status, t.createdAt),
    index('question_reports_skill_idx').on(t.skillId),
    check('question_reports_level_range', sql`${t.level} is null or ${t.level} between 1 and 5`),
    check('question_reports_question_fields', sql`${t.kind} = 'general' or ${t.skillId} is not null`),
  ],
);

/**
 * Erreurs techniques du navigateur, agrégées par empreinte (message normalisé + première ligne de
 * pile + version) avec un compteur. Aucune donnée personnelle ni lien avec une famille.
 */
export const clientErrors = pgTable(
  'client_errors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fingerprint: text('fingerprint').notNull(),
    message: text('message').notNull(),
    stackTop: text('stack_top'),
    release: text('release'),
    path: text('path'),
    count: integer('count').notNull().default(1),
    firstSeen: at('first_seen').notNull().defaultNow(),
    lastSeen: at('last_seen').notNull().defaultNow(),
    exportedAt: at('exported_at'),
  },
  (t) => [uniqueIndex('client_errors_fingerprint_uq').on(t.fingerprint)],
);

/** État d'une notion décidé par l'administration (désactivation, relecture). */
export const contentStates = pgTable('content_states', {
  skillId: text('skill_id').primaryKey(),
  disabled: boolean('disabled').notNull().default(false),
  /** Version de la notion relue par l'équipe (nulle : jamais relue). */
  reviewedVersion: smallint('reviewed_version'),
  updatedAt: at('updated_at').notNull().defaultNow(),
});

/** Historique pédagogique d'une notion : chaque décision est conservée. */
export const contentEvents = pgTable(
  'content_events',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    skillId: text('skill_id').notNull(),
    action: text('action').$type<'desactivation' | 'reactivation' | 'relecture'>().notNull(),
    version: smallint('version').notNull(),
    note: text('note'),
    /** Nom assaini de la personne qui a pris la décision. */
    operator: text('operator'),
    /** Identifiant chez le fournisseur d'identité (`secours` : accès de secours) ; nul : opérateur. */
    adminSub: text('admin_sub'),
    at: at('at').notNull().defaultNow(),
  },
  (t) => [index('content_events_skill_idx').on(t.skillId, t.at)],
);

/**
 * Journal d'audit de l'administration (RGPD : traçabilité des accès aux données d'enfants) :
 * qui (opérateur), quoi, quel compte, quand. Aucun lien de clé étrangère : la trace survit à la
 * suppression du compte consulté.
 */
export const adminAudit = pgTable(
  'admin_audit',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    at: at('at').notNull().defaultNow(),
    operator: text('operator').notNull(),
    action: text('action').$type<'consultation' | 'reinitialisation-mot-de-passe'>().notNull(),
    accountId: uuid('account_id').notNull(),
    adminSub: text('admin_sub'),
  },
  (t) => [index('admin_audit_at_idx').on(t.at), index('admin_audit_account_idx').on(t.accountId, t.at)],
);

/**
 * Sessions d'administration ouvertes par le fournisseur d'identité (docs/adr/0036-…) : empreinte
 * du jeton seulement, rôle figé à la connexion, expiration absolue et par inactivité.
 */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    sub: text('sub').notNull(),
    name: text('name').notNull(),
    role: text('role').$type<AdminRole>().notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
    lastSeenAt: at('last_seen_at').notNull(),
  },
  (t) => [index('admin_sessions_sub_idx').on(t.sub)],
);

/** Accès à l'administration (connexions, refus de rôle, requêtes de secours) : aucun compte visé. */
export const adminAccessEvents = pgTable(
  'admin_access_events',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    at: at('at').notNull().defaultNow(),
    operator: text('operator').notNull(),
    adminSub: text('admin_sub'),
    action: text('action').$type<AccessAction>().notNull(),
    /** Requête de secours (méthode et chemin déclaré, sans paramètre). */
    detail: text('detail'),
  },
  (t) => [index('admin_access_events_at_idx').on(t.at)],
);

/**
 * Paiements de l'abonnement familial (historique complet, y compris les échecs). L'accès
 * premium se déduit des paiements réussis : pas de champ « premium » à tenir à jour.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    offer: text('offer').$type<Offer>().notNull(),
    status: text('status').$type<SubscriptionStatus>().notNull().default('en-attente'),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull(),
    periodEnd: date('period_end', { mode: 'string' }).notNull(),
    provider: text('provider').$type<'stripe' | 'simulateur'>().notNull(),
    /** Référence chez le prestataire (session de paiement Stripe), unique. */
    providerRef: text('provider_ref'),
    createdAt: createdAt(),
    paidAt: at('paid_at'),
  },
  (t) => [
    index('subscriptions_family_idx').on(t.familyId),
    uniqueIndex('subscriptions_provider_ref_unique').on(t.providerRef),
    check('subscriptions_amount_positive', sql`${t.amountCents} > 0`),
  ],
);

/**
 * Acad-Héros possédés : le héros de départ, puis ceux trouvés dans les coffres. Purement
 * cosmétiques (aucun avantage de jeu).
 */
export const ownedHeroes = pgTable(
  'owned_heroes',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    hero: text('hero').$type<HeroId>().notNull(),
    /** Héros de départ, ou trouvé dans un coffre. */
    source: text('source').$type<'depart' | 'coffre'>().notNull(),
    obtainedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.hero] })],
);

/**
 * Amitiés entre joueurs de familles différentes : une ligne par paire (profil A < profil B).
 * Active quand l'ami a accepté et que le parent de chaque famille a validé.
 */
export const friendships = pgTable(
  'friendships',
  {
    profileA: uuid('profile_a')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    profileB: uuid('profile_b')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    /** Celui qui a saisi le code de l'autre. */
    requestedBy: uuid('requested_by').notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    parentAAt: timestamp('parent_a_at', { withTimezone: true }),
    parentBAt: timestamp('parent_b_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.profileA, t.profileB] }),
    index('friendships_b_idx').on(t.profileB),
    check('friendships_ordered', sql`${t.profileA} < ${t.profileB}`),
  ],
);

/**
 * Chapitres validés par l'Épreuve du chapitre (80 % ou plus) : une seule récompense (coffre et
 * trophée) par chapitre et par profil, garantie par la clé primaire. Supprimée avec le profil.
 */
export const chapterRewards = pgTable(
  'chapter_rewards',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    /** Partie qui a validé le chapitre (conservée pour l'historique, sans clé étrangère). */
    sessionId: uuid('session_id'),
    obtainedAt: timestamp('obtained_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.chapterId] })],
);

/**
 * Requêtes idempotentes (achats) : la même clé, rejouée par un double clic ou un réseau qui
 * renvoie la requête, rend la réponse déjà donnée au lieu de recommencer l'opération.
 */
export const idempotentRequests = pgTable(
  'idempotent_requests',
  {
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    route: text('route').notNull(),
    response: jsonb('response').notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.familyId, t.key] }), index('idempotent_requests_created_idx').on(t.createdAt)],
);

/** Toutes les tables, de la plus dépendante à la moins dépendante (remise à zéro des tests). */
export const ALL_TABLES = [
  'subscriptions',
  'email_verifications',
  'evaluation_competences',
  'evaluations',
  'studied_chapters',
  'owned_heroes',
  'idempotent_requests',
  'question_reports',
  'client_errors',
  'content_events',
  'content_states',
  'admin_audit',
  'admin_sessions',
  'admin_access_events',
  'attempts',
  'skill_states',
  'inventory',
  'boss_records',
  'sessions',
  'profiles',
  'password_resets',
  'auth_sessions',
  'accounts',
  'families',
] as const;

/**
 * Arène d'évaluation (docs/adr/0030-arene-evaluation.md) : une épreuve, en cours ou bilan figé.
 * Les réponses sont dans `attempts` via la partie `sessions` de mode `evaluation` ; l'épreuve ne
 * touche jamais à `skill_states`.
 */
export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    subject: text('subject').$type<SubjectId>().notNull(),
    kind: text('kind').$type<EvaluationKind>().notNull(),
    /** Classe de l'élève au lancement, et classe du référentiel évalué (`ce2`…`3e`). */
    profileGrade: text('profile_grade').notNull(),
    referentialGrade: text('referential_grade').notNull(),
    referentialVersion: smallint('referential_version').notNull(),
    /** Année de rentrée (2026 = année scolaire 2026-2027). */
    schoolYear: smallint('school_year').notNull(),
    status: text('status').$type<'en-cours' | 'terminee' | 'expiree'>().notNull().default('en-cours'),
    /** État du moteur `{ v, state }` (ADR 0009) ; nul une fois l'épreuve terminée. */
    state: jsonb('state').$type<unknown>(),
    partial: boolean('partial').notNull().default(false),
    /** Valeurs non arrondies (0–100) ; l'arrondi se fait à l'affichage. */
    mastery: smallint('mastery'),
    coverage: smallint('coverage'),
    studied: smallint('studied'),
    evaluatedCount: smallint('evaluated_count').notNull().default(0),
    masteredCount: smallint('mastered_count').notNull().default(0),
    xp: integer('xp').notNull().default(0),
    coins: integer('coins').notNull().default(0),
    chest: text('chest').$type<ChestRarity>(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('evaluations_session_idx').on(t.sessionId),
    index('evaluations_profile_subject_idx').on(t.profileId, t.subject, t.finishedAt.desc()),
    // Une seule épreuve ouverte par profil et par matière.
    uniqueIndex('evaluations_open_idx')
      .on(t.profileId, t.subject)
      .where(sql`${t.status} = 'en-cours'`),
    check('evaluations_kind', sql`${t.kind} in ('origines', 'progression', 'maitres')`),
    check('evaluations_status', sql`${t.status} in ('en-cours', 'terminee', 'expiree')`),
    check('evaluations_mastery_range', sql`${t.mastery} is null or ${t.mastery} between 0 and 100`),
    check('evaluations_coverage_range', sql`${t.coverage} is null or ${t.coverage} between 0 and 100`),
    check('evaluations_studied_range', sql`${t.studied} is null or ${t.studied} between 0 and 100`),
  ],
);

export type EvaluationRow = typeof evaluations.$inferSelect;

/** Résultat figé d'une compétence dans un bilan (jamais recalculé). */
export const evaluationCompetences = pgTable(
  'evaluation_competences',
  {
    evaluationId: uuid('evaluation_id')
      .notNull()
      .references(() => evaluations.id, { onDelete: 'cascade' }),
    competenceId: text('competence_id').notNull(),
    role: text('role').$type<EvaluationRole>().notNull(),
    domain: text('domain').notNull(),
    essential: boolean('essential').notNull(),
    state: text('state').$type<CompetenceState>().notNull(),
    /** Réussite pondérée × 100 ; nul sans observation. */
    rate: smallint('rate'),
    /** Poids des observations × 10. */
    weight: smallint('weight').notNull().default(0),
    arenaAnswers: smallint('arena_answers').notNull().default(0),
    /** Notion la plus fragile, pour les recommandations. */
    weakestSkillId: text('weakest_skill_id'),
  },
  (t) => [
    primaryKey({ columns: [t.evaluationId, t.competenceId] }),
    check('evaluation_competences_role', sql`${t.role} in ('score', 'prerequis', 'avance')`),
    check(
      'evaluation_competences_state',
      sql`${t.state} in ('non-etudiee', 'non-evaluee', 'evaluation-insuffisante', 'en-difficulte', 'maitrisee', 'a-consolider', 'en-cours')`,
    ),
    check('evaluation_competences_rate_range', sql`${t.rate} is null or ${t.rate} between 0 and 100`),
  ],
);

/** Chapitres déclarés « vus en classe » par l'élève, par année scolaire. */
export const studiedChapters = pgTable(
  'studied_chapters',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    schoolYear: smallint('school_year').notNull(),
    chapterId: text('chapter_id').notNull(),
    status: text('status').$type<StudiedStatus>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.schoolYear, t.chapterId] }),
    check('studied_chapters_status', sql`${t.status} in ('vu', 'pas-vu', 'ne-sait-pas')`),
  ],
);
