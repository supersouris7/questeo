import { BlockList, isIPv6 } from 'node:net';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { EmailSchema } from '@epicademie/shared';
import { AppError } from '../../core/errors.ts';
import { sameSecret } from '../../core/http/auth.ts';
import type { AccountsService, OpenedSession } from './accounts.service.ts';

/** Adresses d'où peut venir le proxy : la machine elle-même ou un réseau privé (conteneurs). */
const PROXY_NETWORKS = new BlockList();
PROXY_NETWORKS.addSubnet('127.0.0.0', 8);
PROXY_NETWORKS.addSubnet('10.0.0.0', 8);
PROXY_NETWORKS.addSubnet('172.16.0.0', 12);
PROXY_NETWORKS.addSubnet('192.168.0.0', 16);
PROXY_NETWORKS.addAddress('::1', 'ipv6');
PROXY_NETWORKS.addSubnet('fc00::', 7, 'ipv6');

/** Vrai si la connexion TCP elle-même (jamais X-Forwarded-For) vient d'une adresse locale ou privée. */
const fromProxy = (address: string | undefined): boolean =>
  address !== undefined && PROXY_NETWORKS.check(address, isIPv6(address) ? 'ipv6' : 'ipv4');

/** En-tête que le proxy ajoute à chaque requête, avec le secret `PORTAL_PROXY_SECRET`. */
export const PORTAL_SECRET_HEADER = 'x-portal-secret';

export interface PortalRoutesDeps {
  readonly service: AccountsService;
  readonly secret: string;
  readonly strict: { rateLimit: { max: number; timeWindow: string } };
  readonly setSession: (reply: FastifyReply, opened: OpenedSession) => unknown;
}

/**
 * Connexion par le portail placé devant la plateforme : redirection du navigateur (hors contrat JSON),
 * enregistrée seulement si PORTAL_LOGIN (recette).
 *
 * L'en-tête Remote-Email n'est digne de confiance que parce que le proxy le pose : le `copy_headers`
 * de son contrôle d'accès (Caddy `forward_auth`) écrase la valeur envoyée par le client, et
 * l'application ne doit être joignable que par ce proxy (docs/operations/recette-internet.md).
 * Deux autres remparts : une connexion venue d'une adresse publique est refusée, et le proxy doit
 * présenter son secret (un autre processus de la machine ne peut donc pas forger l'identité).
 * Remote-Name n'est pas lu : un compte famille n'a pas de nom (minimisation).
 */
export function portalRoutes(app: FastifyInstance, { service, secret, strict, setSession }: PortalRoutesDeps) {
  const fromTrustedProxy = (request: FastifyRequest): boolean => {
    const given = request.headers[PORTAL_SECRET_HEADER];
    return fromProxy(request.socket.remoteAddress) && typeof given === 'string' && sameSecret(given, secret);
  };
  app.get('/auth/portail', { schema: { hide: true }, config: strict }, async (request, reply) => {
    reply.header('cache-control', 'no-store');
    const email = EmailSchema.safeParse(request.headers['remote-email']);
    if (!fromTrustedProxy(request) || !email.success) {
      throw new AppError('NOT_FOUND', 'Route inconnue');
    }
    try {
      const { created, ...opened } = await service.loginWithPortal(email.data);
      setSession(reply, opened);
      return await reply.redirect(created ? '/profils/nouveau' : '/');
    } catch (err) {
      // Raison technique seulement : ni e-mail, ni jeton (le message d'une erreur SQL peut les citer).
      request.log.warn({ event: 'portal_login_refused', reason: err instanceof Error ? err.name : 'inconnue' });
      const unverified = err instanceof AppError && err.code === 'EMAIL_NOT_VERIFIED';
      return reply.redirect(`/connexion?erreur=${unverified ? 'portail-compte' : 'portail'}`);
    }
  });
}
