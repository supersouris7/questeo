import path from 'node:path';
import { z } from 'zod';

/**
 * Configuration du serveur, lue UNE fois depuis l'environnement et validée au démarrage :
 * une variable invalide arrête le serveur avec un message clair plutôt qu'un bug plus tard.
 * Toutes les variables sont documentées dans docs/operations/configuration.md.
 */

const here = import.meta.dirname;
/** Racine du paquet serveur (src/ en dev, dist/ une fois buildé : même niveau). */
const serverRoot = path.resolve(here, '..');

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1')
  .optional();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  /**
   * Base de données : `postgres://…` (production), `pglite://memory` (éphémère, tests et e2e)
   * ou `pglite://<dossier>` (PostgreSQL embarqué sur disque, développement).
   */
  DATABASE_URL: z.string().min(1).optional(),
  /** Taille du pool de connexions PostgreSQL (par instance). */
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  WEB_DIR: z.string().min(1).optional(),
  /** URL publique forcée (sinon détection de l'IP du réseau local). */
  PUBLIC_URL: z.string().trim().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  /** Nombre de proxys de confiance devant le serveur (nginx, répartiteur) : IP client réelle. */
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  /** Origines autorisées pour le temps réel, séparées par des virgules (vide : même origine). */
  CORS_ORIGINS: z.string().optional(),
  /** Requêtes HTTP par minute et par IP. */
  RATE_LIMIT_MAX: z.coerce.number().int().min(10).default(600),
  /** Tentatives par minute et par IP sur les routes sensibles (connexion, inscription, mot de passe). */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  /** Si défini, /api/metrics exige l'en-tête `Authorization: Bearer <jeton>`. */
  METRICS_TOKEN: z.string().min(16).optional(),
  /**
   * Secret de l'« opérateur » : le frontal de la page de pilotage l'ajoute (en-tête
   * X-Epicademie-Operateur) aux requêtes d'administration. Absent : aucune administration.
   * Moins de 32 caractères : démarrage refusé.
   */
  ADMIN_OPERATOR_SECRET: z.string().min(32).optional(),
  /**
   * Connexion de l'équipe par OpenID Connect (docs/adr/0036-…) : les trois variables et
   * ADMIN_ORIGIN vont ensemble. Configurée, elle remplace ADMIN_OPERATOR_SECRET (ignoré).
   */
  OIDC_ISSUER: z.url().optional(),
  OIDC_CLIENT_ID: z.string().min(1).optional(),
  OIDC_CLIENT_SECRET: z.string().min(16).optional(),
  /** Origine du site d'administration (`https://admin.exemple.fr`, sans chemin). */
  ADMIN_ORIGIN: z.url().optional(),
  /** Accès de secours (en-tête X-Epicademie-Secours, rôle propriétaire) ; absent : désactivé. */
  ADMIN_SECOURS_SECRET: z.string().min(32).optional(),
  /** Documentation interactive de l'API (/api/docs) ; par défaut hors production. */
  API_DOCS: bool,
  /** Fuseau horaire des jours de révision (répétition espacée). */
  TZ_FAMILY: z.string().min(1).default('Europe/Paris'),
  EPICADEMIE_VERSION: z.string().default('dev'),
  /** Cookie de session réservé à HTTPS ; par défaut en production. */
  COOKIE_SECURE: bool,
  /** Durée d'une session d'appareil sans activité, en jours. */
  SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  /** Prix de l'année scolaire, en centimes (24,99 € par défaut). */
  PREMIUM_PRICE_CENTS: z.coerce.number().int().min(50).default(2499),
  PREMIUM_CURRENCY: z
    .string()
    .regex(/^[a-z]{3}$/)
    .default('eur'),
  /** Fin d'année scolaire (MM-JJ) : l'accès payé s'arrête à cette date. */
  SCHOOL_YEAR_END: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .default('08-31'),
  /** Durée minimale d'un accès payé : payer trop près de la fin donne l'année suivante. */
  PREMIUM_MIN_DAYS: z.coerce.number().int().min(0).max(365).default(60),
  /** Prestataire : stripe, simulateur (hors production), aucun (paiement fermé). */
  BILLING_PROVIDER: z.enum(['stripe', 'simulateur', 'aucun']).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  /**
   * Environnement applicatif : `production` (par défaut si NODE_ENV=production) impose un
   * fournisseur d'e-mails et ne renvoie jamais de lien secret dans une réponse. Toute autre
   * valeur (ex. `recette`) autorise la simulation d'envoi.
   */
  APP_ENV: z.string().trim().toLowerCase().min(1).max(30).optional(),
  /** Clé de l'API transactionnelle Brevo ; absente : simulation (interdite en production). */
  /** Longueur minimale d'un nouveau mot de passe (défaut : 12 ; 8 en recette). */
  PASSWORD_MIN_LENGTH: z.coerce.number().int().min(6).max(64).optional(),
  /** Page de déconnexion du portail placé devant la plateforme (HTTPS) ; vide : aucun portail. */
  PORTAL_LOGOUT_URL: z.url({ protocol: /^https$/ }).optional(),
  BREVO_API_KEY: z.string().min(10).optional(),
  /**
   * Connexion directe par le portail placé devant la plateforme (en-tête Remote-Email) : recette
   * uniquement (APP_ENV=recette), derrière un proxy de confiance (TRUST_PROXY ≥ 1).
   */
  PORTAL_LOGIN: bool,
  /** Secret que le proxy du portail ajoute à chaque requête (X-Portal-Secret) ; exigé avec PORTAL_LOGIN. */
  PORTAL_PROXY_SECRET: z.string().min(32).optional(),
  /** Expéditeur des e-mails : `adresse@domaine` ou `Nom <adresse@domaine>`. */
  MAIL_FROM: z.string().min(3).max(200).optional(),
  /** « Continuer avec Google » (OpenID Connect) ; bouton masqué si l'une des deux manque. */
  GOOGLE_CLIENT_ID: z.string().min(5).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(5).optional(),
  /** URL de retour déclarée chez Google (défaut : PUBLIC_URL + /api/v1/auth/google/callback). */
  GOOGLE_REDIRECT_URI: z.url().optional(),
});

export interface ServerConfig {
  readonly env: 'development' | 'production' | 'test';
  readonly port: number;
  readonly host: string;
  readonly databaseUrl: string;
  readonly databasePoolMax: number;
  readonly migrationsDir: string;
  /** Dossier du front buildé ; `null` en dev (Vite sert le front). */
  readonly webDir: string | null;
  readonly publicUrl: string | null;
  readonly logLevel: string;
  readonly trustProxy: number;
  /** `null` : même origine uniquement. */
  readonly corsOrigins: readonly string[] | null;
  readonly rateLimitMax: number;
  readonly authRateLimitMax: number;
  readonly metricsToken: string | null;
  /** Secret historique de l'opérateur ; sans effet quand `adminSso` est configuré. */
  readonly adminOperatorSecret: string | null;
  /** Origine du site d'administration, ou `null`. */
  readonly adminOrigin: string | null;
  /** `null` (défaut) : accès de secours désactivé. */
  readonly adminRescueSecret: string | null;
  /** `null` : pas de connexion par fournisseur d'identité. */
  readonly adminSso: AdminSsoConfig | null;
  readonly apiDocs: boolean;
  readonly timeZone: string;
  readonly version: string;
  readonly cookieSecure: boolean;
  readonly sessionDays: number;
  readonly billing: BillingConfig;
  readonly mail: MailConfig;
  /**
   * Plateforme de test (APP_ENV=recette) : compte actif dès l'inscription, aucun e-mail envoyé,
   * « mot de passe oublié » remplacé par une consigne. Jamais en production.
   */
  readonly recette: boolean;
  readonly portalLogoutUrl: string | null;
  /** Connexion directe par le portail (recette uniquement ; faux par défaut). */
  readonly portalLogin: boolean;
  readonly portalProxySecret: string | null;
  readonly passwordMinLength: number;
  readonly google: GoogleConfig | null;
}

export interface MailConfig {
  /** Vrai en production : les liens secrets ne sortent jamais du serveur. */
  readonly production: boolean;
  /** `null` : mode simulation (lien journalisé ; renvoyé dans la réponse hors production). */
  readonly brevoApiKey: string | null;
  readonly from: string;
}

export interface AdminSsoConfig {
  readonly issuer: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface GoogleConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
}

export interface BillingConfig {
  readonly provider: 'stripe' | 'simulateur' | 'aucun';
  readonly priceCents: number;
  readonly currency: string;
  readonly schoolYearEnd: string;
  readonly minDays: number;
  readonly stripeSecretKey: string | null;
  readonly stripeWebhookSecret: string | null;
}

export class ConfigError extends Error {}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  // Une variable vide (`METRICS_TOKEN=` dans un .env) vaut « non définie ».
  const defined = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v.trim() !== ''));
  const parsed = EnvSchema.safeParse(defined);
  if (!parsed.success) throw new ConfigError(`Configuration invalide :\n${z.prettifyError(parsed.error)}`);
  const e = parsed.data;
  const production = e.NODE_ENV === 'production';
  // En production, la base doit être désignée explicitement (pas de base embarquée par surprise).
  if (production && !e.DATABASE_URL) throw new ConfigError('DATABASE_URL est obligatoire en production');
  const origins = e.CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    host: e.HOST,
    databaseUrl: e.DATABASE_URL ?? `pglite://${path.join(serverRoot, 'data/pglite')}`,
    databasePoolMax: e.DATABASE_POOL_MAX,
    migrationsDir: path.join(serverRoot, 'drizzle'),
    // Hors production, le site n'est servi que si WEB_DIR est donné (tests de bout en bout).
    webDir: e.WEB_DIR ? path.resolve(e.WEB_DIR) : production ? path.resolve(serverRoot, '../web/dist') : null,
    publicUrl: e.PUBLIC_URL ?? null,
    logLevel: e.LOG_LEVEL ?? (e.NODE_ENV === 'test' ? 'silent' : 'info'),
    trustProxy: e.TRUST_PROXY,
    corsOrigins: origins?.length ? origins : null,
    rateLimitMax: e.RATE_LIMIT_MAX,
    authRateLimitMax: e.AUTH_RATE_LIMIT_MAX,
    metricsToken: e.METRICS_TOKEN ?? null,
    adminOperatorSecret: e.ADMIN_OPERATOR_SECRET ?? null,
    ...adminConfig(e),
    apiDocs: e.API_DOCS ?? !production,
    timeZone: e.TZ_FAMILY,
    version: e.EPICADEMIE_VERSION,
    cookieSecure: e.COOKIE_SECURE ?? production,
    sessionDays: e.SESSION_DAYS,
    billing: billingConfig(e, production),
    mail: mailConfig(e),
    ...accessConfig(e),
    google: googleConfig(e),
  };
}

/** Accès à la plateforme : mode de test, longueur des mots de passe, portail de connexion devant. */
function accessConfig(
  e: z.infer<typeof EnvSchema>,
): Pick<ServerConfig, 'recette' | 'passwordMinLength' | 'portalLogoutUrl' | 'portalLogin' | 'portalProxySecret'> {
  const recette = e.APP_ENV === 'recette';
  const portalLogin = e.PORTAL_LOGIN ?? false;
  // L'identité vient d'en-têtes HTTP : jamais en production, jamais sans proxy devant.
  if (portalLogin && (!recette || e.TRUST_PROXY < 1)) {
    throw new ConfigError('PORTAL_LOGIN est réservé à la recette : APP_ENV=recette et TRUST_PROXY ≥ 1');
  }
  const portalProxySecret = e.PORTAL_PROXY_SECRET ?? null;
  if (portalLogin && !portalProxySecret) {
    throw new ConfigError('PORTAL_LOGIN exige PORTAL_PROXY_SECRET (32 caractères minimum, posé aussi par le proxy)');
  }
  return {
    portalLogin,
    portalProxySecret,
    recette,
    passwordMinLength: e.PASSWORD_MIN_LENGTH ?? (recette ? 8 : 12),
    portalLogoutUrl: e.PORTAL_LOGOUT_URL ?? null,
  };
}

const isProduction = (e: z.infer<typeof EnvSchema>) => (e.APP_ENV ?? e.NODE_ENV) === 'production';

/** E-mails : sans clé Brevo, simulation ; en production, démarrage refusé. */
function mailConfig(e: z.infer<typeof EnvSchema>): MailConfig {
  const production = isProduction(e);
  if (production && !e.BREVO_API_KEY) {
    throw new ConfigError(
      'BREVO_API_KEY est obligatoire en production (envoi des liens de validation d’e-mail) : ' +
        'définissez-la, ou APP_ENV=recette pour une plateforme de test sans e-mail.',
    );
  }
  if (e.BREVO_API_KEY && !e.MAIL_FROM) throw new ConfigError('BREVO_API_KEY exige MAIL_FROM (adresse expéditrice)');
  return {
    production,
    brevoApiKey: e.BREVO_API_KEY ?? null,
    from: e.MAIL_FROM ?? 'Épicadémie <noreply@localhost>',
  };
}

/** HTTPS obligatoire, sauf pour un essai sur la machine elle-même. */
const secureUrl = (url: URL) => url.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname);

/** Administration : SSO complet ou absent (une configuration partielle arrête le serveur). */
function adminConfig(
  e: z.infer<typeof EnvSchema>,
): Pick<ServerConfig, 'adminOrigin' | 'adminSso' | 'adminRescueSecret'> {
  const origin = e.ADMIN_ORIGIN ? new URL(e.ADMIN_ORIGIN) : null;
  if (origin && (origin.origin !== e.ADMIN_ORIGIN || !secureUrl(origin))) {
    throw new ConfigError('ADMIN_ORIGIN doit être une origine HTTPS, sans chemin ni barre finale');
  }
  const { OIDC_ISSUER: issuer, OIDC_CLIENT_ID: clientId, OIDC_CLIENT_SECRET: clientSecret } = e;
  const base = { adminOrigin: origin?.origin ?? null, adminRescueSecret: e.ADMIN_SECOURS_SECRET ?? null };
  if (!issuer && !clientId && !clientSecret) return { ...base, adminSso: null };
  if (!issuer || !clientId || !clientSecret || !origin) {
    throw new ConfigError('OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET et ADMIN_ORIGIN vont ensemble');
  }
  if (!secureUrl(new URL(issuer))) throw new ConfigError('OIDC_ISSUER doit être en HTTPS');
  return { ...base, adminSso: { issuer, clientId, clientSecret } };
}

/** Google : actif seulement si identifiant et secret sont tous deux fournis. */
function googleConfig(e: z.infer<typeof EnvSchema>): GoogleConfig | null {
  if (!e.GOOGLE_CLIENT_ID || !e.GOOGLE_CLIENT_SECRET) return null;
  const base = (e.PUBLIC_URL ?? `http://localhost:${e.PORT}`).replace(/\/+$/, '');
  return {
    clientId: e.GOOGLE_CLIENT_ID,
    clientSecret: e.GOOGLE_CLIENT_SECRET,
    redirectUri: e.GOOGLE_REDIRECT_URI ?? `${base}/api/v1/auth/google/callback`,
  };
}

/** Paiement : jamais de simulateur en production ; Stripe exige ses deux clés. */
function billingConfig(e: z.infer<typeof EnvSchema>, production: boolean): BillingConfig {
  const provider = e.BILLING_PROVIDER ?? (production ? 'aucun' : 'simulateur');
  if (provider === 'simulateur' && production)
    throw new ConfigError('Le simulateur de paiement est interdit en production');
  if (provider === 'stripe' && (!e.STRIPE_SECRET_KEY || !e.STRIPE_WEBHOOK_SECRET)) {
    throw new ConfigError('BILLING_PROVIDER=stripe exige STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET');
  }
  return {
    provider,
    priceCents: e.PREMIUM_PRICE_CENTS,
    currency: e.PREMIUM_CURRENCY,
    schoolYearEnd: e.SCHOOL_YEAR_END,
    minDays: e.PREMIUM_MIN_DAYS,
    stripeSecretKey: e.STRIPE_SECRET_KEY ?? null,
    stripeWebhookSecret: e.STRIPE_WEBHOOK_SECRET ?? null,
  };
}
