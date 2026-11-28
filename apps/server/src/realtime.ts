import { Server } from 'socket.io';
import type { App } from './app.ts';
import { readCookie, SESSION_COOKIE } from './core/auth/cookies.ts';
import { attachRealtime, originAllowed, type RealtimeServer } from './modules/realtime/index.ts';

/** Messages temps réel : quelques centaines d'octets suffisent. */
const MAX_MESSAGE_BYTES = 16 * 1024;

/** Branche socket.io sur le serveur HTTP de l'application. */
export function startRealtime(app: App, corsOrigins: readonly string[] | null, trustProxy: number) {
  const io: RealtimeServer = new Server(app.http.server, {
    serveClient: false,
    maxHttpBufferSize: MAX_MESSAGE_BYTES,
    allowRequest: (req, callback) => callback(null, originAllowed(req, corsOrigins)),
    ...(corsOrigins ? { cors: { origin: [...corsOrigins] } } : {}),
  });
  return attachRealtime(io, {
    trustProxy,
    presence: app.presence,
    authorize: async (cookieHeader, profileId) => {
      const token = readCookie(cookieHeader, SESSION_COOKIE);
      const actor = token ? await app.accounts.resolve(token) : null;
      const profile = actor ? await app.profiles.findInFamily(profileId, actor.familyId) : undefined;
      return actor && profile ? { profile, familyId: actor.familyId } : null;
    },
    authorizeFamily: async (cookieHeader) => {
      const token = readCookie(cookieHeader, SESSION_COOKIE);
      return token ? ((await app.accounts.resolve(token))?.familyId ?? null) : null;
    },
    friendsOf: (profileId) => app.friends.activeIds(profileId),
    clock: app.clock,
    random: app.random,
    canPlayChapter: (familyId, chapterId) =>
      app.billing.requireChapter(familyId, chapterId).then(
        () => true,
        () => false,
      ),
    logger: app.http.log,
    reporter: app.reporter,
    metrics: app.metrics,
  });
}
