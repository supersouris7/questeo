import type { FastifyInstance, FastifyReply } from 'fastify';
import { api } from '@epicademie/shared';
import { route } from '../../core/http/route.ts';
import { readCookie, serializeCookie, SESSION_COOKIE } from '../../core/auth/cookies.ts';
import type { Google } from '../../core/auth/google.ts';
import { googleRoutes } from './google.routes.ts';
import { portalRoutes } from './portal.routes.ts';
import type { AccountsService, OpenedSession } from './accounts.service.ts';

/**
 * Routes des comptes : la session vit dans un cookie HttpOnly, jamais dans un corps de réponse.
 * Les routes sensibles ont leur propre limite de débit par IP (mots de passe devinés).
 */
export function accountsRoutes(
  service: AccountsService,
  cookie: { secure: boolean; maxAgeDays: number; rateLimitMax: number },
  google: Google | null = null,
  options: {
    recette: boolean;
    passwordMinLength: number;
    portalLogoutUrl?: string | null;
    /** Secret du proxy du portail : présent, la connexion par le portail est active. */
    portalSecret?: string | null;
  } = { recette: false, passwordMinLength: 12 },
) {
  const STRICT = { rateLimit: { max: cookie.rateLimitMax, timeWindow: '1 minute' } };
  const setSession = (reply: FastifyReply, opened: OpenedSession) => {
    reply.header(
      'set-cookie',
      serializeCookie(SESSION_COOKIE, opened.token, { secure: cookie.secure, maxAge: cookie.maxAgeDays * 86_400 }),
    );
    return opened.me;
  };
  /** Réponse qui porte un secret (code montré une fois) : jamais mise en cache. */
  const noStore = (reply: FastifyReply): void => {
    reply.header('cache-control', 'no-store');
  };
  return async (app: FastifyInstance) => {
    route(
      app,
      api.signup,
      async ({ body, reply }) => {
        const { session, ...result } = await service.signup(body);
        if (session) setSession(reply, session);
        return result;
      },
      { config: STRICT },
    );
    route(app, api.verifyEmail, async ({ body, reply }) => setSession(reply, await service.verifyEmail(body)), {
      config: STRICT,
    });
    route(app, api.resendVerification, ({ body }) => service.resendVerification(body.email), { config: STRICT });
    route(app, api.authOptions, async () => ({
      google: google !== null,
      passwordMinLength: options.passwordMinLength,
      recette: options.recette,
      ...(options.portalLogoutUrl ? { portalLogoutUrl: options.portalLogoutUrl } : {}),
      ...(options.portalSecret ? { portalLogin: true } : {}),
    }));
    // Désactivé : la route n'existe pas (404).
    const secret = options.portalSecret;
    if (secret) portalRoutes(app, { service, secret, strict: STRICT, setSession });
    if (google) googleRoutes(app, { service, google, secure: cookie.secure, strict: STRICT, setSession });
    route(
      app,
      api.signupStudent,
      async ({ body, reply }) => {
        const { me, recoveryCode, ...opened } = await service.signupStudent(body);
        noStore(reply);
        return { me: setSession(reply, { ...opened, me }), recoveryCode };
      },
      { config: STRICT },
    );
    route(
      app,
      api.recoverStudent,
      async ({ body, reply }) => setSession(reply, await service.recoverStudent(body.code)),
      {
        config: STRICT,
      },
    );
    route(
      app,
      api.renewStudentRecovery,
      async ({ actor, reply }) => {
        noStore(reply);
        return { recoveryCode: await service.renewRecovery(actor()) };
      },
      {
        config: STRICT,
      },
    );
    route(
      app,
      api.createInvite,
      async ({ actor, reply }) => {
        noStore(reply);
        return service.createInvite(actor());
      },
      { config: STRICT },
    );
    route(app, api.exportFamily, async ({ actor, reply }) => {
      noStore(reply);
      return service.exportFamily(actor());
    });
    route(
      app,
      api.deleteFamily,
      async ({ actor, body, request, reply }) => {
        await service.deleteFamily(actor(), body);
        // Aucun identifiant ni e-mail dans le journal : l'événement seul.
        request.log.info({ event: 'family_deleted' }, 'compte famille supprimé');
        reply.header('set-cookie', serializeCookie(SESSION_COOKIE, '', { secure: cookie.secure, maxAge: 0 }));
      },
      { config: STRICT },
    );
    route(app, api.joinFamily, ({ actor, body }) => service.joinFamily(actor(), body.code), { config: STRICT });
    route(app, api.login, async ({ body, reply }) => setSession(reply, await service.login(body)), {
      config: STRICT,
    });
    route(app, api.logout, async ({ request, reply }) => {
      await service.logout(readCookie(request.headers.cookie, SESSION_COOKIE));
      reply.header('set-cookie', serializeCookie(SESSION_COOKIE, '', { secure: cookie.secure, maxAge: 0 }));
    });
    route(app, api.me, async ({ actor }) => service.me(actor()));
    route(app, api.setParentPin, ({ actor, body }) => service.setParentPin(actor(), body.password, body.pin), {
      config: STRICT,
    });
    route(app, api.unlockParentPin, ({ actor, body }) => service.unlockParentPin(actor(), body.pin), {
      config: STRICT,
    });
    route(app, api.lockParent, ({ actor }) => service.lockParent(actor()));
    route(app, api.confirmParent, ({ actor, body }) => service.confirmParent(actor(), body.password), {
      config: STRICT,
    });
    route(app, api.forgotPassword, ({ body }) => service.forgotPassword(body.email), { config: STRICT });
    route(app, api.resetPassword, ({ body }) => service.resetPassword(body.token, body.password), { config: STRICT });
  };
}
