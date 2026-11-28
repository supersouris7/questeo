import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createHash, timingSafeEqual } from 'node:crypto';
import { API_PREFIX, can, type AccountRole, type AnyEndpoint } from '@epicademie/shared';
import { AppError } from '../errors.ts';
import { readCookie, SESSION_COOKIE } from '../auth/cookies.ts';
import { sanitizeAdminName, type AdminIdentity } from './admin-identity.ts';

/**
 * Qui fait la requête : résolu une fois par requête à partir du cookie de session, puis vérifié
 * par `route()` selon le niveau d'accès du contrat (`public`, `family`, `parent`, `admin`).
 * L'administration n'est pas un compte de jeu : session ouverte par le fournisseur d'identité de
 * l'équipe, avec un rôle (docs/adr/0036-…). Tant qu'il n'est pas configuré, « opérateur » reconnu à
 * l'en-tête secret du frontal de pilotage (docs/adr/0033-…).
 * Les services reçoivent la famille de l'acteur ; l'appartenance de chaque profil, partie ou
 * combat désigné est vérifiée par le module « comptes » (`ownership`).
 */
export interface Actor {
  readonly accountId: string;
  readonly familyId: string;
  /** Nul pour un élève autonome (moins de 15 ans). */
  readonly email: string | null;
  /** Famille d'un élève autonome : ni paiement, ni Espace parent tant qu'aucun parent n'est rattaché. */
  readonly autonomous: boolean;
  readonly role: AccountRole;
  /** Fin du déverrouillage parent (mot de passe confirmé récemment), ou null. */
  readonly parentUntil: Date | null;
  /** Déverrouillage parent en cours, évalué à la lecture de la session (horloge du serveur). */
  readonly parent: boolean;
  /** Empreinte du jeton de la session (déconnexion, déverrouillage parent). */
  readonly sessionHash: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    actor: Actor | null;
    /** Membre de l'équipe reconnu pour cette requête, sinon `null`. */
    admin: AdminIdentity | null;
  }
}

export interface AuthOptions {
  /** Session valide pour ce jeton, ou `null` (absente, expirée, révoquée). */
  readonly resolve: (token: string) => Promise<Actor | null>;
  /** Origines autorisées en plus de la page elle-même (CORS_ORIGINS). */
  readonly allowedOrigins: readonly string[] | null;
  readonly admin: AdminAuthOptions;
}

export interface AdminAuthOptions {
  /** Origine du site d'administration ; si définie, SSO et secours n'y sont acceptés que là. */
  readonly origin: string | null;
  /** Session d'administration (fournisseur d'identité) ; `null` : SSO non configuré. */
  readonly resolveSession: ((token: string) => Promise<AdminIdentity | null>) | null;
  /** Secret historique de l'opérateur, tant que le SSO n'est pas configuré ; sinon `null`. */
  readonly operatorSecret: string | null;
  /** Secret de l'accès de secours ; `null` (défaut) : désactivé. */
  readonly rescueSecret: string | null;
  /** Trace chaque requête d'administration faite par l'accès de secours. */
  readonly traceRescue: (admin: AdminIdentity, request: string) => Promise<void>;
}

export const OPERATOR_HEADER = 'x-epicademie-operateur';
export const OPERATOR_NAME_HEADER = 'x-epicademie-operateur-nom';
export const RESCUE_HEADER = 'x-epicademie-secours';
export const RESCUE_NAME_HEADER = 'x-epicademie-secours-nom';
/** Cookie de la session d'administration : lié à l'hôte du site d'administration (préfixe __Host-). */
export const ADMIN_COOKIE = '__Host-epicademie_admin';
const ADMIN_ROUTES = `${API_PREFIX}/admin/`;

/** Comparaison en temps constant (empreintes de même longueur). */
export function sameSecret(given: string, expected: string): boolean {
  const digest = (v: string) => createHash('sha256').update(v).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/** Personne reconnue à un secret d'en-tête (aucun cookie ni compte de jeu n'entre en jeu). */
function readSecretHeader(
  request: FastifyRequest,
  secret: string | null,
  headers: readonly [string, string],
): string | null {
  const given = request.headers[headers[0]];
  if (secret === null || typeof given !== 'string' || !sameSecret(given, secret)) return null;
  return sanitizeAdminName(request.headers[headers[1]]);
}

/** La requête vise bien le site d'administration (hôte, et origine si elle est annoncée). */
export function onAdminOrigin(request: FastifyRequest, adminOrigin: string): boolean {
  const { host, origin } = request.headers;
  return host?.toLowerCase() === new URL(adminOrigin).host && (origin === undefined || origin === adminOrigin);
}

/** Identité portée par un en-tête secret : accès de secours, sinon opérateur historique. */
function headerAdmin(request: FastifyRequest, options: AdminAuthOptions): AdminIdentity | null {
  const rescue = readSecretHeader(request, options.rescueSecret, [RESCUE_HEADER, RESCUE_NAME_HEADER]);
  if (rescue !== null) {
    if (options.origin && !onAdminOrigin(request, options.origin)) return null;
    return { name: `${rescue} (secours)`, role: 'proprietaire', sub: 'secours', via: 'secours' };
  }
  const operator = readSecretHeader(request, options.operatorSecret, [OPERATOR_HEADER, OPERATOR_NAME_HEADER]);
  return operator === null ? null : { name: operator, role: 'proprietaire', sub: null, via: 'operateur' };
}

/** Identité portée par le cookie de session d'administration (routes d'administration seulement). */
async function sessionAdmin(request: FastifyRequest, options: AdminAuthOptions): Promise<AdminIdentity | null> {
  if (!options.resolveSession || !options.origin || !onAdminOrigin(request, options.origin)) return null;
  const token = readCookie(request.headers.cookie, ADMIN_COOKIE);
  return token ? options.resolveSession(token) : null;
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Une requête qui modifie quelque chose doit venir de nos pages (protection CSRF). */
function sameOrigin(request: FastifyRequest, allowed: readonly string[] | null): boolean {
  const origin = request.headers.origin;
  if (!origin) return true; // clients hors navigateur : pas de cookie tiers à détourner
  if (allowed?.includes(origin)) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

export function registerAuth(app: FastifyInstance, options: AuthOptions): void {
  app.decorateRequest('actor', null);
  app.decorateRequest('admin', null);
  app.addHook('onRequest', async (request) => {
    const unsafe = UNSAFE.has(request.method);
    if (unsafe && !sameOrigin(request, options.allowedOrigins)) {
      throw new AppError('FORBIDDEN', 'Origine de la requête refusée.');
    }
    const route = request.routeOptions.url;
    const adminRoute = route?.startsWith(ADMIN_ROUTES) ?? false;
    // Un membre de l'équipe n'a ni famille, ni profil : le cookie de jeu est alors ignoré.
    request.admin = headerAdmin(request, options.admin);
    if (!request.admin && adminRoute) request.admin = await sessionAdmin(request, options.admin);
    // Écriture d'administration : l'en-tête Origin est obligatoire (comparé ci-dessus).
    if (request.admin && unsafe && !request.headers.origin) {
      throw new AppError('FORBIDDEN', 'Origine de la requête manquante.');
    }
    if (request.admin) {
      if (request.admin.via === 'secours' && adminRoute) {
        await options.admin.traceRescue(request.admin, `${request.method} ${route ?? ''}`);
      }
      return;
    }
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    request.actor = token ? await options.resolve(token) : null;
  });
}

export const ADMIN_ONLY_MESSAGE = 'Administration accessible uniquement depuis la page de pilotage.';
export const ADMIN_ROLE_MESSAGE = 'Ton rôle ne permet pas cette action.';
export const AUTONOMOUS_MESSAGE = 'Demande à un parent : il doit d’abord rattacher ton compte au sien.';

/** Lève l'erreur adaptée si l'acteur n'a pas le niveau d'accès (ou la permission) demandé. */
export function checkAccess(
  { access, permission }: Pick<AnyEndpoint, 'access' | 'permission'>,
  actor: Actor | null,
  admin: AdminIdentity | null,
): void {
  if (access === 'public') return;
  if (access === 'admin') {
    if (!admin) throw new AppError('FORBIDDEN', ADMIN_ONLY_MESSAGE);
    // Route sans permission déclarée : refusée à tous (échec fermé).
    if (!permission || !can(admin.role, permission)) throw new AppError('FORBIDDEN', ADMIN_ROLE_MESSAGE);
    return;
  }
  if (!actor) throw new AppError('UNAUTHORIZED', 'Connecte-toi pour continuer.');
  if (access === 'parent' && actor.autonomous) throw new AppError('FORBIDDEN', AUTONOMOUS_MESSAGE);
  if (access === 'parent' && !actor.parent) {
    throw new AppError('FORBIDDEN', 'Action réservée au parent : confirme le mot de passe du compte.');
  }
}

/** Membre de l'équipe d'une route `admin` (garanti par `route()`). */
export function adminOf(request: FastifyRequest): AdminIdentity {
  if (!request.admin) throw new AppError('FORBIDDEN', ADMIN_ONLY_MESSAGE);
  return request.admin;
}

/** Acteur d'une route `family` ou plus (garanti par `route()`). */
export function actorOf(request: FastifyRequest): Actor {
  if (!request.actor) throw new AppError('UNAUTHORIZED', 'Connecte-toi pour continuer.');
  return request.actor;
}
