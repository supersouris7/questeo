import { z } from 'zod';
import {
  BattleAnswerResultSchema,
  BattleAnswerSchema,
  BattleCreateSchema,
  BattleItemSchema,
  BattleSummarySchema,
  BattleViewSchema,
  BossOverviewSchema,
} from '../battle.ts';
import { BuySchema, EquipmentSchema, PurchaseSchema } from '../items.ts';
import {
  AnswerResultSchema,
  AnswerSubmitSchema,
  ConfusedSchema,
  FeelingSchema,
  SessionCreatedSchema,
  SessionCreateSchema,
  SessionSummarySchema,
  ChapterTrophySchema,
  SkillProgressSchema,
} from '../play.ts';
import { HEROES, ProfileCreateSchema, ProfileSchema, ProfileUpdateSchema } from '../profile.ts';
import {
  AuthOptionsSchema,
  EmailResendResultSchema,
  EmailResendSchema,
  EmailVerifySchema,
  FamilyDeleteSchema,
  FamilyExportSchema,
  FamilyJoinResultSchema,
  FamilyJoinSchema,
  InviteResultSchema,
  LoginSchema,
  MeSchema,
  ParentPinSetSchema,
  ParentPinUnlockSchema,
  PasswordConfirmSchema,
  PasswordForgotSchema,
  PasswordResetSchema,
  RecoveryCodeResultSchema,
  SignupResultSchema,
  SignupSchema,
  StudentRecoverSchema,
  StudentSignupResultSchema,
  StudentSignupSchema,
} from '../account.ts';
import {
  AdvancedChoiceSchema,
  EvaluationAnswerResultSchema,
  EvaluationAnswerSchema,
  EvaluationCreateSchema,
  EvaluationHomeSchema,
  EvaluationListItemSchema,
  EvaluationNextSchema,
  EvaluationResultSchema,
  EvaluationReviewSchema,
  EvaluationStartedSchema,
  EvaluationSubjectParamsSchema,
  EvaluationSummarySchema,
  StudiedChapterViewSchema,
  StudiedChaptersUpdateSchema,
} from '../evaluation.ts';
import { BadgeProgressSchema, JourneySchema, LearningReportSchema, ParentWeekSchema } from '../learning.ts';
import {
  AccountDetailSchema,
  AccountPageSchema,
  AccountSearchSchema,
  AdminAuthConfigSchema,
  AdminLogoutSchema,
  AdminSessionSchema,
  AuditPageSchema,
  AuditSearchSchema,
  TemporaryPasswordSchema,
} from '../admin.ts';
import type { AdminPermission } from '../admin-roles.ts';
import { BillingSchema, CheckoutSchema, SimulatePaymentSchema } from '../billing.ts';
import {
  AdminErrorSchema,
  AdminStatsSchema,
  AdminTrendsSchema,
  AnomalySchema,
  WeakSkillStatSchema,
} from '../insights.ts';
import { FamilyFriendSchema, FriendRequestSchema, FriendsViewSchema } from '../friends.ts';
import {
  ContentEventSchema,
  ContentSkillSchema,
  ContentUpdateSchema,
  DisabledContentSchema,
  GeneralReportCreateSchema,
  REPORT_STATUSES,
  ReportCreateSchema,
  ReportSchema,
  ReportUpdateSchema,
} from '../pedagogy.ts';

/**
 * Contrat de l'API HTTP v1 — source unique de vérité, partagée par le serveur et le client.
 *
 * Chaque point d'accès décrit sa méthode, son chemin (paramètres `:nom` à la Fastify), ses schémas
 * d'entrée (paramètres, corps) et de sortie. Le serveur s'en sert pour valider les entrées ET les
 * sorties et pour générer la documentation OpenAPI ; le client web en tire ses types.
 *
 * Règles d'évolution (voir docs/adr/0004-api-versionnee.md) :
 * - ajouter un champ optionnel ou un point d'accès : compatible, reste en v1 ;
 * - retirer ou renommer un champ, changer un type : nouvelle version (`/api/v2`).
 */

export const API_PREFIX = '/api/v1';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Qui peut appeler un point d'accès (vérifié par le serveur avant le gestionnaire) :
 * - `public` : tout le monde (connexion, inscription, télémétrie) ;
 * - `family` : un appareil connecté au compte de la famille (les enfants y jouent) ;
 * - `parent` : idem, mot de passe confirmé récemment (actions réservées au parent) ;
 * - `admin` : membre de l'équipe (aucun compte de jeu) dont le rôle a la `permission` de la route.
 * Les données d'une autre famille restent invisibles : le serveur vérifie aussi l'appartenance
 * de chaque profil, partie ou combat désigné (réponse 404 sinon).
 */
export const ACCESS_LEVELS = ['public', 'family', 'parent', 'admin'] as const;
export type Access = (typeof ACCESS_LEVELS)[number];

/** Point d'accès : `response` vaut `null` pour une réponse sans corps (204). */
export interface Endpoint<
  TParams extends z.ZodObject | undefined = z.ZodObject | undefined,
  TBody extends z.ZodType | undefined = z.ZodType | undefined,
  TResponse extends z.ZodType | null = z.ZodType | null,
> {
  readonly method: HttpMethod;
  readonly path: `/${string}`;
  /** Groupe de la documentation OpenAPI (= module serveur). */
  readonly tag: ApiTag;
  readonly summary: string;
  readonly access: Access;
  /** Obligatoire pour une route `admin` (sans elle, le serveur refuse tout le monde). */
  readonly permission?: AdminPermission;
  readonly status: 200 | 201 | 204;
  readonly params?: TParams;
  readonly body?: TBody;
  readonly response: TResponse;
}

export const API_TAGS = [
  'systeme',
  'comptes',
  'profils',
  'suivi',
  'contenus',
  'abonnement',
  'admin',
  'entrainement',
  'combats',
  'inventaire',
  'amis',
  'recommandations',
  'evaluation',
  'telemetrie',
] as const;
export type ApiTag = (typeof API_TAGS)[number];

const endpoint = <
  TParams extends z.ZodObject | undefined = undefined,
  TBody extends z.ZodType | undefined = undefined,
  TResponse extends z.ZodType | null = null,
>(
  e: Endpoint<TParams, TBody, TResponse>,
) => e;

export const IdParamsSchema = z.object({ id: z.uuid() });
export const FriendParamsSchema = z.object({ id: z.uuid(), friendId: z.uuid() });

/** Codes d'erreur stables (le message, lui, est destiné à l'affichage et peut changer). */
export const ERROR_CODES = [
  'BAD_REQUEST',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'GONE',
  'PREMIUM_REQUIRED',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'UNAUTHORIZED',
  'EMAIL_NOT_VERIFIED',
  'INTERNAL',
  'UNAVAILABLE',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/** Corps de toute réponse d'erreur. */
export const ErrorBodySchema = z.object({
  code: z.enum(ERROR_CODES),
  /** Message en français, affichable tel quel à l'enfant ou au parent. */
  error: z.string(),
  /** Identifiant de la requête (à citer au support ; retrouvable dans les journaux). */
  requestId: z.string().optional(),
});
export type ErrorBody = z.infer<typeof ErrorBodySchema>;

/** Erreur côté navigateur remontée au serveur (aucune donnée personnelle). */
export const ClientErrorSchema = z.object({
  message: z.string().max(500),
  stack: z.string().max(4000).optional(),
  /** Chemin de la page (sans domaine ni paramètres). */
  path: z.string().max(200),
  release: z.string().max(40).optional(),
});
export type ClientError = z.infer<typeof ClientErrorSchema>;

export const api = {
  // ——— Comptes ———
  signup: endpoint({
    method: 'POST',
    path: '/auth/signup',
    tag: 'comptes',
    summary:
      'Crée un compte parent. Production : non vérifié, lien envoyé par e-mail, réponse identique si l’adresse est prise. Plateforme de test : compte actif et connecté, refus clair si l’adresse est prise',
    access: 'public',
    status: 201,
    body: SignupSchema,
    response: SignupResultSchema,
  }),
  verifyEmail: endpoint({
    method: 'POST',
    path: '/auth/email/verify',
    tag: 'comptes',
    summary:
      'Valide l’adresse e-mail avec le lien reçu (usage unique) et le mot de passe du compte, puis ouvre la session',
    access: 'public',
    status: 200,
    body: EmailVerifySchema,
    response: MeSchema,
  }),
  resendVerification: endpoint({
    method: 'POST',
    path: '/auth/email/resend',
    tag: 'comptes',
    summary: 'Renvoie le lien de validation (réponse identique que l’adresse existe ou non ; débit limité)',
    access: 'public',
    status: 200,
    body: EmailResendSchema,
    response: EmailResendResultSchema,
  }),
  authOptions: endpoint({
    method: 'GET',
    path: '/auth/options',
    tag: 'comptes',
    summary: 'Réglages d’ouverture de compte : Google, longueur du mot de passe, plateforme de test',
    access: 'public',
    status: 200,
    response: AuthOptionsSchema,
  }),
  login: endpoint({
    method: 'POST',
    path: '/auth/login',
    tag: 'comptes',
    summary: 'Ouvre une session (cookie HttpOnly)',
    access: 'public',
    status: 200,
    body: LoginSchema,
    response: MeSchema,
  }),
  signupStudent: endpoint({
    method: 'POST',
    path: '/auth/student/signup',
    tag: 'comptes',
    summary: 'Élève de moins de 15 ans : compte sans donnée personnelle ; renvoie le code de récupération (une fois)',
    access: 'public',
    status: 201,
    body: StudentSignupSchema,
    response: StudentSignupResultSchema,
  }),
  recoverStudent: endpoint({
    method: 'POST',
    path: '/auth/student/recover',
    tag: 'comptes',
    summary: 'Reconnecte un élève autonome sur un autre appareil avec son code de récupération',
    access: 'public',
    status: 200,
    body: StudentRecoverSchema,
    response: MeSchema,
  }),
  renewStudentRecovery: endpoint({
    method: 'POST',
    path: '/auth/student/recovery-code',
    tag: 'comptes',
    summary: 'Élève autonome : nouveau code de récupération (l’ancien ne marche plus)',
    access: 'family',
    status: 200,
    response: RecoveryCodeResultSchema,
  }),
  createInvite: endpoint({
    method: 'POST',
    path: '/auth/student/invite',
    tag: 'comptes',
    summary: 'Élève autonome : code d’invitation pour un parent (24 h, usage unique)',
    access: 'family',
    status: 201,
    response: InviteResultSchema,
  }),
  exportFamily: endpoint({
    method: 'GET',
    path: '/family/export',
    tag: 'comptes',
    summary: 'Espace parent : export JSON des données de la famille (comptes, profils, progression)',
    access: 'parent',
    status: 200,
    response: FamilyExportSchema,
  }),
  deleteFamily: endpoint({
    method: 'POST',
    path: '/family/delete',
    tag: 'comptes',
    summary: 'Espace parent : supprime définitivement le compte famille et toutes ses données (RGPD, effacement)',
    access: 'parent',
    status: 204,
    body: FamilyDeleteSchema,
    response: null,
  }),
  joinFamily: endpoint({
    method: 'POST',
    path: '/family/join',
    tag: 'comptes',
    summary: 'Espace parent : rattache le profil d’un élève autonome à la famille avec son code d’invitation',
    access: 'parent',
    status: 200,
    body: FamilyJoinSchema,
    response: FamilyJoinResultSchema,
  }),
  logout: endpoint({
    method: 'POST',
    path: '/auth/logout',
    tag: 'comptes',
    summary: 'Ferme la session de cet appareil (compte parent : Espace parent ouvert exigé, sinon 403)',
    access: 'public',
    status: 204,
    response: null,
  }),
  me: endpoint({
    method: 'GET',
    path: '/auth/me',
    tag: 'comptes',
    summary: 'Session courante (401 si aucune)',
    access: 'family',
    status: 200,
    response: MeSchema,
  }),
  confirmParent: endpoint({
    method: 'POST',
    path: '/auth/parent',
    tag: 'comptes',
    summary: 'Confirme le mot de passe : déverrouille les actions parent pour quelques minutes',
    access: 'family',
    status: 200,
    body: PasswordConfirmSchema,
    response: MeSchema,
  }),
  setParentPin: endpoint({
    method: 'POST',
    path: '/auth/parent/pin',
    tag: 'comptes',
    summary: 'Choisit ou change le code PIN parent (mot de passe du compte demandé)',
    access: 'family',
    status: 200,
    body: ParentPinSetSchema,
    response: MeSchema,
  }),
  unlockParentPin: endpoint({
    method: 'POST',
    path: '/auth/parent/pin/unlock',
    tag: 'comptes',
    summary: 'Ouvre l’Espace parent avec le code PIN (5 erreurs : blocage 15 minutes)',
    access: 'family',
    status: 200,
    body: ParentPinUnlockSchema,
    response: MeSchema,
  }),
  lockParent: endpoint({
    method: 'POST',
    path: '/auth/parent/lock',
    tag: 'comptes',
    summary: 'Quitte l’Espace parent (les actions parent sont de nouveau verrouillées)',
    access: 'family',
    status: 200,
    response: MeSchema,
  }),
  forgotPassword: endpoint({
    method: 'POST',
    path: '/auth/password/forgot',
    tag: 'comptes',
    summary:
      'Envoie un lien de réinitialisation (réponse identique que l’adresse existe ou non) ; refusé sur la plateforme de test',
    access: 'public',
    status: 204,
    body: PasswordForgotSchema,
    response: null,
  }),
  resetPassword: endpoint({
    method: 'POST',
    path: '/auth/password/reset',
    tag: 'comptes',
    summary: 'Change le mot de passe avec le lien reçu ; ferme les autres sessions',
    access: 'public',
    status: 204,
    body: PasswordResetSchema,
    response: null,
  }),

  // ——— Système ———
  network: endpoint({
    method: 'GET',
    path: '/network',
    tag: 'systeme',
    summary: 'Adresse publique du serveur (QR code de connexion des appareils)',
    access: 'family',
    status: 200,
    response: z.object({ publicUrl: z.string().nullable() }),
  }),
  presence: endpoint({
    method: 'GET',
    path: '/presence',
    tag: 'systeme',
    summary: 'Profils ouverts sur un appareil (non sélectionnables ailleurs)',
    access: 'family',
    status: 200,
    response: z.object({ online: z.array(z.uuid()) }),
  }),

  // ——— Profils ———
  listProfiles: endpoint({
    method: 'GET',
    path: '/profiles',
    tag: 'profils',
    summary: 'Liste des profils, du plus ancien au plus récent',
    access: 'family',
    status: 200,
    response: z.array(ProfileSchema),
  }),
  getProfile: endpoint({
    method: 'GET',
    path: '/profiles/:id',
    tag: 'profils',
    summary: 'Un profil',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: ProfileSchema,
  }),
  createProfile: endpoint({
    method: 'POST',
    path: '/profiles',
    tag: 'profils',
    summary: 'Crée un profil',
    access: 'parent',
    status: 201,
    body: ProfileCreateSchema,
    response: ProfileSchema,
  }),
  updateProfile: endpoint({
    method: 'PATCH',
    path: '/profiles/:id',
    tag: 'profils',
    summary: 'Modifie un profil (champs fournis seulement)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    body: ProfileUpdateSchema,
    response: ProfileSchema,
  }),
  deleteProfile: endpoint({
    method: 'DELETE',
    path: '/profiles/:id',
    tag: 'profils',
    summary: 'Supprime un profil et toute sa progression',
    access: 'parent',
    status: 204,
    params: IdParamsSchema,
    response: null,
  }),

  friends: endpoint({
    method: 'GET',
    path: '/profiles/:id/friends',
    tag: 'amis',
    summary: 'Code ami du joueur et ses amitiés (demandes, attente des parents, amis)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: FriendsViewSchema,
  }),
  requestFriend: endpoint({
    method: 'POST',
    path: '/profiles/:id/friends',
    tag: 'amis',
    summary: 'Demande d’ami avec le code d’un joueur d’une autre famille',
    access: 'family',
    status: 201,
    params: IdParamsSchema,
    body: FriendRequestSchema,
    response: FriendsViewSchema,
  }),
  acceptFriend: endpoint({
    method: 'POST',
    path: '/profiles/:id/friends/:friendId/accept',
    tag: 'amis',
    summary: 'Accepte une demande d’ami reçue',
    access: 'family',
    status: 200,
    params: FriendParamsSchema,
    response: FriendsViewSchema,
  }),
  removeFriend: endpoint({
    method: 'DELETE',
    path: '/profiles/:id/friends/:friendId',
    tag: 'amis',
    summary: 'Refuse une demande ou retire un ami',
    access: 'family',
    status: 200,
    params: FriendParamsSchema,
    response: FriendsViewSchema,
  }),
  familyFriends: endpoint({
    method: 'GET',
    path: '/family/friends',
    tag: 'amis',
    summary: 'Espace parent : amitiés des enfants de la famille',
    access: 'parent',
    status: 200,
    response: z.array(FamilyFriendSchema),
  }),
  approveFriend: endpoint({
    method: 'POST',
    path: '/profiles/:id/friends/:friendId/approve',
    tag: 'amis',
    summary: 'Espace parent : valide une amitié de son enfant',
    access: 'parent',
    status: 200,
    params: FriendParamsSchema,
    response: z.array(FamilyFriendSchema),
  }),

  ownedHeroes: endpoint({
    method: 'GET',
    path: '/profiles/:id/heroes',
    tag: 'profils',
    summary: 'Acad-Héros de la collection du joueur (départ, puis trouvés dans les coffres)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: z.object({ heroes: z.array(z.enum(HEROES)) }),
  }),

  // ——— Suivi des apprentissages ———
  learningReport: endpoint({
    method: 'GET',
    path: '/profiles/:id/learning',
    tag: 'suivi',
    summary: 'Suivi des apprentissages : états des notions, chapitres, matières, semaines',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: LearningReportSchema,
  }),

  journey: endpoint({
    method: 'GET',
    path: '/profiles/:id/journey',
    tag: 'suivi',
    summary: 'Progrès personnel : notions en hausse et efforts de la semaine',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: JourneySchema,
  }),

  parentWeek: endpoint({
    method: 'GET',
    path: '/profiles/:id/parent-week',
    tag: 'suivi',
    summary: 'Espace parent : efforts de la semaine, ressenti agrégé et conseil pour un enfant',
    access: 'parent',
    status: 200,
    params: IdParamsSchema,
    response: ParentWeekSchema,
  }),

  badges: endpoint({
    method: 'GET',
    path: '/profiles/:id/badges',
    tag: 'suivi',
    summary: 'Badges du joueur : grade atteint et prochain objectif',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: z.array(BadgeProgressSchema),
  }),

  // ——— Entraînement ———
  listSkills: endpoint({
    method: 'GET',
    path: '/profiles/:id/skills',
    tag: 'entrainement',
    summary: 'Progression du profil par notion (répétition espacée, médailles)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: z.array(SkillProgressSchema),
  }),
  startSession: endpoint({
    method: 'POST',
    path: '/sessions',
    tag: 'entrainement',
    summary: 'Commence une partie (hors combat de boss)',
    access: 'family',
    status: 201,
    body: SessionCreateSchema,
    response: SessionCreatedSchema,
  }),
  answerSession: endpoint({
    method: 'POST',
    path: '/sessions/:id/answers',
    tag: 'entrainement',
    summary: 'Corrige une réponse (le serveur régénère la question et fait foi)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    body: AnswerSubmitSchema,
    response: AnswerResultSchema,
  }),
  markConfused: endpoint({
    method: 'POST',
    path: '/sessions/:id/confused',
    tag: 'entrainement',
    summary: '« Je n’ai pas compris » : la notion repassera « à revoir »',
    access: 'family',
    status: 204,
    params: IdParamsSchema,
    body: ConfusedSchema,
    response: null,
  }),
  rateSession: endpoint({
    method: 'POST',
    path: '/sessions/:id/feeling',
    tag: 'entrainement',
    summary: '« Je me sens capable ? » : réponse de fin de séance (modifiable)',
    access: 'family',
    status: 204,
    params: IdParamsSchema,
    body: FeelingSchema,
    response: null,
  }),
  finishSession: endpoint({
    method: 'POST',
    path: '/sessions/:id/finish',
    tag: 'entrainement',
    summary: 'Termine la partie : répétition espacée, XP, pièces, coffre',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: SessionSummarySchema,
  }),

  chapterTrophies: endpoint({
    method: 'GET',
    path: '/profiles/:id/chapter-trophies',
    tag: 'entrainement',
    summary: 'Trophées de chapitre (Épreuves du chapitre réussies) du profil',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: z.array(ChapterTrophySchema),
  }),

  // ——— Combats de boss ———
  bossOverview: endpoint({
    method: 'GET',
    path: '/profiles/:id/bosses',
    tag: 'combats',
    summary: 'Boss vaincus, inventaire et équipement du profil',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: BossOverviewSchema,
  }),
  startBattle: endpoint({
    method: 'POST',
    path: '/battles',
    tag: 'combats',
    summary: 'Lance un combat de boss',
    access: 'family',
    status: 201,
    body: BattleCreateSchema,
    response: BattleViewSchema,
  }),
  answerBattle: endpoint({
    method: 'POST',
    path: '/battles/:id/answers',
    tag: 'combats',
    summary: 'Répond à la question en cours du combat',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    body: BattleAnswerSchema,
    response: BattleAnswerResultSchema,
  }),
  useBattleItem: endpoint({
    method: 'POST',
    path: '/battles/:id/items',
    tag: 'combats',
    summary: 'Utilise un objet équipé pendant le combat',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    body: BattleItemSchema,
    response: BattleViewSchema,
  }),
  battleHint: endpoint({
    method: 'POST',
    path: '/battles/:id/hint',
    tag: 'combats',
    summary: 'Demande un indice sans objet (attaque de la question un peu moins forte)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: BattleViewSchema,
  }),
  finishBattle: endpoint({
    method: 'POST',
    path: '/battles/:id/finish',
    tag: 'combats',
    summary: 'Termine le combat : XP, pièces, médaille, coffre de 1re victoire',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: BattleSummarySchema,
  }),

  // ——— Inventaire ———
  setEquipment: endpoint({
    method: 'PUT',
    path: '/profiles/:id/equipment',
    tag: 'combats',
    summary: 'Équipe jusqu’à 3 objets de la réserve pour les prochains combats',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    body: EquipmentSchema,
    response: BossOverviewSchema,
  }),
  buy: endpoint({
    method: 'POST',
    path: '/shop',
    tag: 'inventaire',
    summary: 'Achète un objet ou un rubis avec des pièces',
    access: 'family',
    status: 200,
    body: BuySchema,
    response: PurchaseSchema,
  }),

  // ——— Contenus : signalements, désactivations ———
  reportQuestion: endpoint({
    method: 'POST',
    path: '/reports',
    tag: 'contenus',
    summary: 'Signale un problème sur une question (lu par l’administration)',
    access: 'family',
    status: 201,
    body: ReportCreateSchema,
    response: z.object({ id: z.uuid() }),
  }),
  reportGeneral: endpoint({
    method: 'POST',
    path: '/reports/general',
    tag: 'contenus',
    summary: 'Signale un problème général (bug, affichage, son…), depuis n’importe quel écran',
    access: 'family',
    status: 201,
    body: GeneralReportCreateSchema,
    response: z.object({ id: z.uuid() }),
  }),
  disabledContent: endpoint({
    method: 'GET',
    path: '/content/disabled',
    tag: 'contenus',
    summary: 'Notions désactivées (le jeu ne les propose plus)',
    access: 'family',
    status: 200,
    response: DisabledContentSchema,
  }),

  // ——— Abonnement ———
  billing: endpoint({
    method: 'GET',
    path: '/billing',
    tag: 'abonnement',
    summary: 'Abonnement de la famille : accès, prix, historique des paiements',
    access: 'family',
    status: 200,
    response: BillingSchema,
  }),
  checkout: endpoint({
    method: 'POST',
    path: '/billing/checkout',
    tag: 'abonnement',
    summary: 'Commence le paiement de l’année scolaire (page du prestataire ou simulateur)',
    access: 'parent',
    status: 201,
    response: CheckoutSchema,
  }),
  simulatePayment: endpoint({
    method: 'POST',
    path: '/billing/simulate/:id',
    tag: 'abonnement',
    summary: 'Simulateur de paiement (hors production) : paiement accepté ou refusé',
    access: 'parent',
    status: 200,
    params: IdParamsSchema,
    body: SimulatePaymentSchema,
    response: BillingSchema,
  }),

  // ——— Arène d'évaluation (ADR 0030) ———
  evaluationHome: endpoint({
    method: 'GET',
    path: '/profiles/:id/evaluations/:subject/home',
    tag: 'evaluation',
    summary: 'Accueil de l’Arène pour une matière : épreuves, recommandée, épreuve ouverte, historique court',
    access: 'family',
    status: 200,
    params: EvaluationSubjectParamsSchema,
    response: EvaluationHomeSchema,
  }),
  evaluationHistory: endpoint({
    method: 'GET',
    path: '/profiles/:id/evaluations/:subject',
    tag: 'evaluation',
    summary: 'Historique des bilans d’une matière',
    access: 'family',
    status: 200,
    params: EvaluationSubjectParamsSchema,
    response: z.array(EvaluationListItemSchema),
  }),
  studiedChapters: endpoint({
    method: 'GET',
    path: '/profiles/:id/evaluations/:subject/studied-chapters',
    tag: 'evaluation',
    summary: 'Chapitres vus en classe cette année scolaire (avec pré-cochage d’après l’entraînement)',
    access: 'family',
    status: 200,
    params: EvaluationSubjectParamsSchema,
    response: z.array(StudiedChapterViewSchema),
  }),
  saveStudiedChapters: endpoint({
    method: 'PUT',
    path: '/profiles/:id/evaluations/:subject/studied-chapters',
    tag: 'evaluation',
    summary: 'Enregistre la déclaration « Qu’as-tu déjà vu en classe ? »',
    access: 'family',
    status: 204,
    params: EvaluationSubjectParamsSchema,
    body: StudiedChaptersUpdateSchema,
    response: null,
  }),
  evaluationSummary: endpoint({
    method: 'GET',
    path: '/profiles/:id/evaluation-summary',
    tag: 'evaluation',
    summary: 'Bilans de toutes les matières (Espace parent)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: EvaluationSummarySchema,
  }),
  startEvaluation: endpoint({
    method: 'POST',
    path: '/evaluations',
    tag: 'evaluation',
    summary: 'Lance une épreuve, ou reprend l’épreuve ouverte du même type (409 si un autre type est ouvert)',
    access: 'family',
    status: 201,
    body: EvaluationCreateSchema,
    response: EvaluationStartedSchema,
  }),
  evaluationNext: endpoint({
    method: 'GET',
    path: '/evaluations/:id/next',
    tag: 'evaluation',
    summary: 'Question en attente (la même tant qu’elle n’a pas reçu de réponse) ou fin',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: EvaluationNextSchema,
  }),
  answerEvaluation: endpoint({
    method: 'POST',
    path: '/evaluations/:id/answers',
    tag: 'evaluation',
    summary: 'Réponse à la question attendue (jamais juste/faux pendant l’épreuve) ; rejouée : même réponse',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    body: EvaluationAnswerSchema,
    response: EvaluationAnswerResultSchema,
  }),
  chooseAdvanced: endpoint({
    method: 'POST',
    path: '/evaluations/:id/advanced',
    tag: 'evaluation',
    summary: 'Accepte ou refuse le défi bonus (avancées hors score)',
    access: 'family',
    status: 204,
    params: IdParamsSchema,
    body: AdvancedChoiceSchema,
    response: null,
  }),
  finishEvaluation: endpoint({
    method: 'POST',
    path: '/evaluations/:id/finish',
    tag: 'evaluation',
    summary: 'Clôture (idempotente) : bilan figé et récompenses',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: EvaluationResultSchema,
  }),
  evaluationResult: endpoint({
    method: 'GET',
    path: '/evaluations/:id',
    tag: 'evaluation',
    summary: 'Bilan d’une épreuve terminée',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: EvaluationResultSchema,
  }),
  evaluationReview: endpoint({
    method: 'GET',
    path: '/evaluations/:id/review',
    tag: 'evaluation',
    summary: 'Questions posées, pour « Revoir mes réponses » (épreuve terminée seulement)',
    access: 'family',
    status: 200,
    params: IdParamsSchema,
    response: EvaluationReviewSchema,
  }),

  // ——— Administration ———
  adminAuthConfig: endpoint({
    method: 'GET',
    path: '/admin-auth/config',
    tag: 'admin',
    summary: 'La connexion par le fournisseur d’identité est-elle proposée ?',
    access: 'public',
    status: 200,
    response: AdminAuthConfigSchema,
  }),
  adminLogout: endpoint({
    method: 'POST',
    path: '/admin-auth/logout',
    tag: 'admin',
    summary: 'Ferme la session d’administration, efface son cookie et donne l’adresse de déconnexion du fournisseur',
    access: 'public',
    status: 200,
    response: AdminLogoutSchema,
  }),
  adminSession: endpoint({
    method: 'GET',
    path: '/admin/session',
    tag: 'admin',
    summary: 'Personne reconnue et son rôle (403 sinon)',
    access: 'admin',
    permission: 'stats:lire',
    status: 200,
    response: AdminSessionSchema,
  }),
  adminAccounts: endpoint({
    method: 'POST',
    path: '/admin/accounts/search',
    tag: 'admin',
    summary: 'Recherche paginée de comptes (25 par page, jamais de liste complète)',
    access: 'admin',
    permission: 'comptes:lire',
    status: 200,
    body: AccountSearchSchema,
    response: AccountPageSchema,
  }),
  adminAccount: endpoint({
    method: 'GET',
    path: '/admin/accounts/:id',
    tag: 'admin',
    summary: 'Fiche d’un compte (consultation journalisée)',
    access: 'admin',
    permission: 'comptes:lire',
    status: 200,
    params: IdParamsSchema,
    response: AccountDetailSchema,
  }),
  adminResetPassword: endpoint({
    method: 'POST',
    path: '/admin/accounts/:id/password-reset',
    tag: 'admin',
    summary: 'Mot de passe temporaire (montré une fois), sessions du compte fermées',
    access: 'admin',
    permission: 'comptes:agir',
    status: 200,
    params: IdParamsSchema,
    response: TemporaryPasswordSchema,
  }),
  adminAudit: endpoint({
    method: 'POST',
    path: '/admin/audit',
    tag: 'admin',
    summary: 'Journal d’audit (fiches, réinitialisations, connexions, secours), 25 par page',
    access: 'admin',
    permission: 'audit:lire',
    status: 200,
    body: AuditSearchSchema,
    response: AuditPageSchema,
  }),
  adminStats: endpoint({
    method: 'GET',
    path: '/admin/stats',
    tag: 'admin',
    summary: 'Statistiques agrégées (aucune donnée personnelle)',
    access: 'admin',
    permission: 'stats:lire',
    status: 200,
    response: AdminStatsSchema,
  }),
  adminTrends: endpoint({
    method: 'GET',
    path: '/admin/trends',
    tag: 'admin',
    summary: 'Courbes sur 30 jours : comptes créés, abonnements actifs (agrégés, aucune donnée personnelle)',
    access: 'admin',
    permission: 'stats:lire',
    status: 200,
    response: AdminTrendsSchema,
  }),
  adminWeakSkills: endpoint({
    method: 'GET',
    path: '/admin/weak-skills',
    tag: 'admin',
    summary: 'Notions à renforcer (90 jours, anonyme : aucun nom d’enfant)',
    access: 'admin',
    permission: 'stats:lire',
    status: 200,
    response: z.array(WeakSkillStatSchema),
  }),
  adminErrors: endpoint({
    method: 'GET',
    path: '/admin/errors',
    tag: 'admin',
    summary: 'Erreurs récentes regroupées (serveur, navigateur, temps réel)',
    access: 'admin',
    permission: 'audit:lire',
    status: 200,
    response: z.array(AdminErrorSchema),
  }),
  adminAnomalies: endpoint({
    method: 'GET',
    path: '/admin/anomalies',
    tag: 'admin',
    summary: 'Anomalies de récompenses à vérifier (gains impossibles, rythme suspect)',
    access: 'admin',
    permission: 'comptes:lire',
    status: 200,
    response: z.array(AnomalySchema),
  }),
  adminReports: endpoint({
    method: 'GET',
    path: '/admin/reports/:status',
    tag: 'admin',
    summary: 'Signalements d’un état (du plus récent au plus ancien)',
    access: 'admin',
    permission: 'signalements:lire',
    status: 200,
    params: z.object({ status: z.enum(REPORT_STATUSES) }),
    response: z.array(ReportSchema),
  }),
  adminUpdateReport: endpoint({
    method: 'PATCH',
    path: '/admin/reports/:id',
    tag: 'admin',
    summary: 'Change l’état d’un signalement',
    access: 'admin',
    permission: 'signalements:traiter',
    status: 200,
    params: IdParamsSchema,
    body: ReportUpdateSchema,
    response: ReportSchema,
  }),
  adminContent: endpoint({
    method: 'GET',
    path: '/admin/content',
    tag: 'admin',
    summary: 'Toutes les notions avec leur état de validation',
    access: 'admin',
    permission: 'contenus:lire',
    status: 200,
    response: z.array(ContentSkillSchema),
  }),
  adminUpdateContent: endpoint({
    method: 'PUT',
    path: '/admin/content/:skillId',
    tag: 'admin',
    summary: 'Désactive, réactive ou marque comme relue une notion (historique conservé)',
    access: 'admin',
    permission: 'contenus:modifier',
    status: 200,
    params: z.object({ skillId: z.string().min(1).max(80) }),
    body: ContentUpdateSchema,
    response: ContentSkillSchema,
  }),
  adminContentHistory: endpoint({
    method: 'GET',
    path: '/admin/content/:skillId/history',
    tag: 'admin',
    summary: 'Historique pédagogique d’une notion (désactivations, relectures)',
    access: 'admin',
    permission: 'contenus:lire',
    status: 200,
    params: z.object({ skillId: z.string().min(1).max(80) }),
    response: z.array(ContentEventSchema),
  }),

  // ——— Télémétrie ———
  reportClientError: endpoint({
    method: 'POST',
    path: '/telemetry/errors',
    tag: 'telemetrie',
    summary: 'Remonte une erreur survenue dans le navigateur',
    access: 'public',
    status: 204,
    body: ClientErrorSchema,
    response: null,
  }),
} as const;

export type Api = typeof api;
export type EndpointName = keyof Api;
export type AnyEndpoint = Api[EndpointName];

type Present<S> = Exclude<S, undefined>;
type Input<S> = [Present<S>] extends [never]
  ? undefined
  : Present<S> extends z.ZodType
    ? z.input<Present<S>>
    : undefined;

/** Paramètres de chemin attendus par un point d'accès (`undefined` s'il n'en a pas). */
export type ParamsOf<E extends AnyEndpoint> = Input<E['params']>;
/** Corps attendu par un point d'accès (`undefined` s'il n'en a pas). */
export type BodyOf<E extends AnyEndpoint> = Input<E['body']>;
/** Réponse d'un point d'accès (`undefined` pour 204). */
export type ResponseOf<E extends AnyEndpoint> = E['response'] extends z.ZodType ? z.output<E['response']> : undefined;

/** Remplit les paramètres `:nom` d'un chemin. */
export function buildPath(path: string, params: Record<string, string> | undefined): string {
  return path.replace(/:([A-Za-z]+)/g, (_, key: string) => {
    const value = params?.[key];
    if (value === undefined) throw new Error(`Paramètre de chemin manquant : ${key}`);
    return encodeURIComponent(value);
  });
}
