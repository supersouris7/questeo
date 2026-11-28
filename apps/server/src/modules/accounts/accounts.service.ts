import type { Login, Me, StudentSignup } from '@epicademie/shared';
import type { Db } from '../../db/client.ts';
import type { Clock } from '../../core/clock.ts';
import { AppError } from '../../core/errors.ts';
import { AUTONOMOUS_MESSAGE, type Actor } from '../../core/http/auth.ts';
import { dummyHash, hashPassword, verifyPassword } from '../../core/auth/password.ts';
import { newToken, tokenHash } from '../../core/auth/tokens.ts';
import type { Mailer } from '../../core/mail/mailer.ts';
import { accountsRepo } from './accounts.repo.ts';
import { pinChecker } from './pin.ts';
import { createErasureService } from './erasure.service.ts';
import { createStudentService, type OpenedSession } from './student.service.ts';
import { checkPasswordLength, createVerificationService } from './verification.service.ts';
import { verificationRepo } from './verification.repo.ts';

/**
 * Comptes familiaux : inscription, connexion, sessions d'appareil, déverrouillage parent,
 * réinitialisation du mot de passe. Voir docs/adr/0012-comptes-familiaux.md.
 */

/** Durée du déverrouillage parent après confirmation du mot de passe. */
export const PARENT_UNLOCK_MINUTES = 10;
/** Code PIN parent : erreurs d'affilée permises avant blocage, et durée du blocage. */
/** Validité d'un lien de réinitialisation. */
export const RESET_LINK_MINUTES = 60;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export const RECETTE_FORGOT =
  'Plateforme de test : demandez votre nouveau mot de passe à l’administrateur qui vous a fourni les accès.';
export const BAD_CREDENTIALS = 'E-mail ou mot de passe incorrect.';
export const NOT_VERIFIED =
  'Ton adresse e-mail n’est pas encore validée : ouvre le lien reçu par e-mail, ou demande-en un nouveau.';

export interface AccountsDeps {
  readonly db: Db;
  readonly clock: Clock;
  readonly mailer: Mailer;
  /** Adresse publique du site (liens envoyés par e-mail). */
  readonly appUrl: () => string;
  readonly sessionDays: number;
  /** Plateforme de test (APP_ENV=recette) : compte actif dès l'inscription, aucun e-mail. */
  readonly recette: boolean;
  /** Longueur minimale d'un nouveau mot de passe. */
  readonly passwordMinLength: number;
  /** Connexion directe par le portail (recette uniquement). */
  readonly portalLogin: boolean;
  /** Crée le profil de l'élève (module « profils ») dans la famille autonome. */
  readonly createStudentProfile: (
    input: Pick<StudentSignup, 'name' | 'avatar' | 'grade'>,
    familyId: string,
  ) => Promise<unknown>;
  /** Annule chez le prestataire les paiements en cours de la famille (avant son effacement). */
  readonly cancelPayments?: (familyId: string) => Promise<void>;
}

export type { OpenedSession };

export function createAccountsService({
  db,
  clock,
  mailer,
  appUrl,
  sessionDays,
  recette,
  passwordMinLength,
  portalLogin,
  createStudentProfile,
  cancelPayments,
}: AccountsDeps) {
  const repo = accountsRepo(db);
  const later = (ms: number) => new Date(clock.now().getTime() + ms);

  /** Compte du portail sans mot de passe : seul le code PIN peut ouvrir son Espace parent. */
  const portalOnly = (a: { passwordHash?: string | null; portalLinkedAt?: Date | null }): boolean =>
    Boolean(a.portalLinkedAt) && !a.passwordHash;

  /** Premier passage d'un tel compte : le code parent se choisit sans mot de passe. */
  const needsPin = (a: Parameters<typeof portalOnly>[0] & { parentPinHash?: string | null }): boolean =>
    portalLogin && portalOnly(a) && !a.parentPinHash;

  const meOf = (
    a: {
      id: string;
      email: string | null;
      role: Me['account']['role'];
      familyId: string;
      autonomous: boolean;
      passwordHash?: string | null;
      parentPinHash?: string | null;
      portalLinkedAt?: Date | null;
    },
    parentUntil: Date | null,
  ): Me => {
    const parent = parentUntil !== null && parentUntil > clock.now();
    return {
      account: { id: a.id, email: a.email, role: a.role },
      family: { id: a.familyId, autonomous: a.autonomous },
      parent,
      parentUntil: parent ? parentUntil.toISOString() : null,
      hasPin: Boolean(a.parentPinHash),
      ...(needsPin(a) ? { needsPin: true } : {}),
      ...(portalOnly(a) ? { noPassword: true } : {}),
    };
  };

  /** Ouvre une session d'appareil. Après saisie du mot de passe, le parent est déverrouillé (sauf `locked`). */
  const open = async (a: Parameters<typeof meOf>[0], { locked = false } = {}): Promise<OpenedSession> => {
    const token = newToken();
    // Élève autonome : jamais de déverrouillage parent (aucun parent n'est rattaché).
    const parentUntil = a.autonomous || locked ? null : later(PARENT_UNLOCK_MINUTES * MINUTE);
    await repo.createSession({
      tokenHash: tokenHash(token),
      accountId: a.id,
      expiresAt: later(sessionDays * DAY),
      parentUntil,
    });
    return { token, me: meOf(a, parentUntil) };
  };

  /** Vrai si le mot de passe correspond ; faux pour un compte sans mot de passe (élève autonome). */
  const passwordMatches = async (hash: string | null, password: string): Promise<boolean> =>
    hash !== null && (await verifyPassword(password, hash));

  /** Les actions parent n'existent pas tant qu'aucun parent n'a rattaché le compte. */
  const refuseAutonomous = (actor: Actor): void => {
    if (actor.autonomous) throw new AppError('FORBIDDEN', AUTONOMOUS_MESSAGE);
  };

  const checkPin = pinChecker(clock, repo);

  const erasure = createErasureService({
    db,
    clock,
    cancelPayments,
    refuseAutonomous,
    passwordMatches,
    checkPin,
  });
  const student = createStudentService({ db, clock, createStudentProfile, open });

  const verification = createVerificationService({ db, clock, mailer, appUrl, recette, passwordMinLength, open });

  return {
    ...student,
    ...verification,
    async login({ email, password }: Login): Promise<OpenedSession> {
      const account = await repo.findByEmail(email);
      // Même travail si le compte n'existe pas : le temps de réponse ne trahit rien.
      const ok = await verifyPassword(password, account?.passwordHash ?? (await dummyHash()));
      if (!account?.passwordHash || !ok) throw new AppError('UNAUTHORIZED', BAD_CREDENTIALS);
      // Après le contrôle du mot de passe seulement : l'état d'une adresse n'est dit qu'à son titulaire.
      // Plateforme de test : pas de validation d'adresse (un compte créé avant ce mode est simplement activé).
      if (!account.emailVerifiedAt && recette) {
        await verificationRepo(db).markEmailVerified(account.id, clock.now());
      } else if (!account.emailVerifiedAt) throw new AppError('EMAIL_NOT_VERIFIED', NOT_VERIFIED);
      return open({ ...account, autonomous: false });
    },

    /**
     * Ferme la session de l'appareil. Compte parent : Espace parent ouvert exigé (code PIN ou mot de
     * passe), pour qu'un enfant ne déconnecte pas la famille. Élève autonome : aucun parent à solliciter.
     */
    async logout(token: string | null): Promise<void> {
      if (!token) return;
      const hash = tokenHash(token);
      const now = clock.now();
      const s = await repo.findSession(hash, now);
      if (s && !s.autonomous && !(s.parentUntil && s.parentUntil > now)) {
        throw new AppError('FORBIDDEN', 'Action réservée au parent : saisis le code parent pour déconnecter.');
      }
      await repo.deleteSession(hash);
    },

    /**
     * Acteur d'un jeton de session, ou `null`. Session glissante : prolongée au plus une fois par
     * jour (pas une écriture par requête).
     */
    async resolve(token: string): Promise<Actor | null> {
      const now = clock.now();
      const s = await repo.findSession(tokenHash(token), now);
      if (!s) return null;
      const renewed = later(sessionDays * DAY);
      if (renewed.getTime() - s.expiresAt.getTime() > DAY) await repo.extendSession(s.tokenHash, renewed);
      return {
        accountId: s.accountId,
        familyId: s.familyId,
        email: s.email,
        autonomous: s.autonomous,
        role: s.role,
        parentUntil: s.parentUntil,
        parent: s.parentUntil !== null && s.parentUntil > now,
        sessionHash: s.tokenHash,
      };
    },

    async me(actor: Actor): Promise<Me> {
      const account = await repo.findById(actor.accountId);
      return meOf(
        {
          id: actor.accountId,
          email: actor.email,
          role: actor.role,
          familyId: actor.familyId,
          autonomous: actor.autonomous,
          ...account,
        },
        actor.parentUntil,
      );
    },

    /**
     * Choisit ou change le code PIN parent : le mot de passe du compte est demandé. Seul le premier code
     * d'un compte du portail s'en passe, dans la session que le portail vient d'ouvrir.
     */
    async setParentPin(actor: Actor, password: string | undefined, pin: string): Promise<Me> {
      refuseAutonomous(actor);
      const account = await repo.findById(actor.accountId);
      if (account && needsPin(account)) {
        if (!actor.parent) {
          throw new AppError('FORBIDDEN', 'Reconnecte-toi par le portail pour choisir le code parent.');
        }
      } else if (!account || !(await passwordMatches(account.passwordHash, password ?? ''))) {
        throw new AppError('UNAUTHORIZED', 'Mot de passe incorrect.');
      }
      await repo.setParentPin(account.id, await hashPassword(pin));
      return meOf({ ...account, autonomous: false, parentPinHash: 'défini' }, actor.parentUntil);
    },

    /** Ouvre l'Espace parent avec le PIN ; 5 erreurs d'affilée bloquent le PIN 15 minutes. */
    async unlockParentPin(actor: Actor, pin: string): Promise<Me> {
      refuseAutonomous(actor);
      const account = await repo.findById(actor.accountId);
      if (!account?.parentPinHash)
        throw new AppError('CONFLICT', 'Aucun code PIN : utilise le mot de passe du compte.');
      await checkPin(account, account.parentPinHash, pin);
      await repo.setPinFailures(account.id, 0, null);
      const until = later(PARENT_UNLOCK_MINUTES * MINUTE);
      await repo.setParentUntil(actor.sessionHash, until);
      return meOf({ ...account, autonomous: false }, until);
    },

    ...erasure,

    /** Quitte l'Espace parent : les actions parent sont de nouveau verrouillées sur cet appareil. */
    async lockParent(actor: Actor): Promise<Me> {
      await repo.setParentUntil(actor.sessionHash, null);
      return this.me({ ...actor, parentUntil: null, parent: false });
    },

    /** Le parent confirme son mot de passe : actions parent permises quelques minutes. */
    async confirmParent(actor: Actor, password: string): Promise<Me> {
      refuseAutonomous(actor);
      const account = await repo.findById(actor.accountId);
      if (!account || !(await passwordMatches(account.passwordHash, password))) {
        throw new AppError('UNAUTHORIZED', 'Mot de passe incorrect.');
      }
      const until = later(PARENT_UNLOCK_MINUTES * MINUTE);
      await repo.setParentUntil(actor.sessionHash, until);
      return meOf({ ...account, autonomous: false }, until);
    },

    /** Envoie un lien de réinitialisation ; ne dit jamais si l'adresse existe. */
    async forgotPassword(email: string): Promise<void> {
      if (recette) throw new AppError('FORBIDDEN', RECETTE_FORGOT);
      const account = await repo.findByEmail(email);
      if (!account?.email) return;
      const token = newToken();
      await repo.createReset({
        tokenHash: tokenHash(token),
        accountId: account.id,
        expiresAt: later(RESET_LINK_MINUTES * MINUTE),
      });
      await mailer.send({
        to: account.email,
        subject: 'Épicadémie : nouveau mot de passe',
        text:
          `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valable ${RESET_LINK_MINUTES} minutes) :\n` +
          `${appUrl()}/mot-de-passe/nouveau?jeton=${token}\n\n` +
          'Si tu n’as rien demandé, ignore ce message : ton mot de passe ne change pas.',
      });
    },

    /** Nouveau mot de passe par lien (usage unique) ; toutes les sessions du compte sont fermées. */
    async resetPassword(token: string, password: string): Promise<void> {
      if (recette) throw new AppError('FORBIDDEN', RECETTE_FORGOT);
      checkPasswordLength(password, passwordMinLength);
      const hash = await hashPassword(password);
      await db.transaction(async (tx) => {
        const r = accountsRepo(tx);
        const reset = await r.findResetForUpdate(tokenHash(token), clock.now());
        if (!reset) throw new AppError('BAD_REQUEST', 'Ce lien n’est plus valable : demande-en un nouveau.');
        await r.setPassword(reset.accountId, hash);
        // Le lien reçu par e-mail prouve aussi que l'adresse est bien celle du titulaire.
        await verificationRepo(tx).markEmailVerified(reset.accountId, clock.now());
        await verificationRepo(tx).deleteVerificationsOf(reset.accountId);
        await r.markResetUsed(reset.tokenHash, clock.now());
        await r.deleteSessionsOf(reset.accountId);
      });
    },
  };
}

export type AccountsService = ReturnType<typeof createAccountsService>;
