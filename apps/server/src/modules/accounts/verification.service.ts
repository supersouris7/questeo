import type { EmailVerify, Signup, SignupResult } from '@epicademie/shared';
import type { Db } from '../../db/client.ts';
import type { Clock } from '../../core/clock.ts';
import { AppError, conflict } from '../../core/errors.ts';
import { dummyHash, hashPassword, verifyPassword } from '../../core/auth/password.ts';
import { newToken, tokenHash } from '../../core/auth/tokens.ts';
import type { Mailer } from '../../core/mail/mailer.ts';
import { accountsRepo } from './accounts.repo.ts';
import { verificationRepo } from './verification.repo.ts';
import type { OpenedSession } from './student.service.ts';

/** Validité d'un lien de validation d'adresse. */
export const VERIFICATION_LINK_HOURS = 24;
/** Délai minimal entre deux envois du lien de validation pour un même compte. */
export const RESEND_COOLDOWN_SECONDS = 60;
const MINUTE = 60_000;

export const WRONG_PASSWORD_AT_VERIFICATION =
  'Ce n’est pas le mot de passe choisi à l’inscription. Si tu ne le connais pas, utilise « Mot de passe oublié ».';

export const ADDRESS_TAKEN = 'Cette adresse a déjà un compte : connectez-vous.';

export const PORTAL_UNVERIFIED_ACCOUNT =
  'Un compte existe déjà avec cette adresse : connecte-toi avec ton mot de passe.';

/** Longueur minimale d'un nouveau mot de passe (réglable : PASSWORD_MIN_LENGTH). */
export function checkPasswordLength(password: string, min: number): void {
  if (password.length < min)
    throw new AppError('BAD_REQUEST', `Le mot de passe doit faire au moins ${min} caractères.`);
}

export interface VerificationDeps {
  readonly db: Db;
  readonly clock: Clock;
  readonly mailer: Mailer;
  readonly appUrl: () => string;
  /** Plateforme de test : compte actif dès l'inscription, aucun e-mail. */
  readonly recette: boolean;
  /** Longueur minimale d'un nouveau mot de passe. */
  readonly passwordMinLength: number;
  /** Ouvre la session d'appareil d'un compte ; `locked` : Espace parent fermé. */
  readonly open: (
    a: { id: string; email: string | null; role: 'parent'; familyId: string; autonomous: boolean },
    options?: { locked?: boolean },
  ) => Promise<OpenedSession>;
}

/**
 * Ouverture d'un compte avec e-mail : adresse validée par un lien (jeton à usage unique, haché en
 * base), Google ou, en recette, le portail de connexion. Voir docs/operations/configuration.md.
 */
export function createVerificationService({
  db,
  clock,
  mailer,
  appUrl,
  recette,
  passwordMinLength,
  open,
}: VerificationDeps) {
  const repo = accountsRepo(db);
  const vRepo = verificationRepo(db);
  const later = (ms: number) => new Date(clock.now().getTime() + ms);

  /** Émet un lien de validation (remplace le précédent) et l'envoie par e-mail. */
  const sendVerification = async (accountId: string, email: string): Promise<void> => {
    const token = newToken();
    await vRepo.replaceVerification({
      tokenHash: tokenHash(token),
      accountId,
      expiresAt: later(VERIFICATION_LINK_HOURS * 60 * MINUTE),
      createdAt: clock.now(),
    });
    const link = `${appUrl()}/email/verification?jeton=${token}`;
    await mailer.send({
      to: email,
      subject: 'Épicadémie : valide ton adresse e-mail',
      text:
        `Bonjour,\n\nPour valider ton adresse et ouvrir ton compte, ouvre ce lien (valable ${VERIFICATION_LINK_HOURS} heures, une seule fois) :\n` +
        `${link}\n\nSi tu n’as rien demandé, ignore ce message : aucun compte ne sera utilisable.`,
      link,
    });
  };

  return {
    /**
     * Crée un compte NON vérifié : aucune session tant que le lien envoyé par e-mail n'est pas ouvert.
     * Réponse identique que l'adresse soit libre, en attente ou déjà prise (pas d'énumération) : si le
     * compte existe, c'est un e-mail d'information qui part, sans toucher au compte existant.
     */
    async signup({ email, password }: Signup): Promise<SignupResult & { session?: OpenedSession }> {
      checkPasswordLength(password, passwordMinLength);
      if (recette) {
        // Plateforme de test : pas d'anti-énumération (ADR 0032), l'adresse prise est dite clairement.
        if (await repo.findByEmail(email)) throw conflict(ADDRESS_TAKEN);
        const hash = await hashPassword(password);
        const created = await db.transaction((tx) =>
          accountsRepo(tx).createFamilyAccount(email, hash, { verifiedAt: clock.now() }),
        );
        const session = await open({ ...created, autonomous: false });
        return { status: 'active', email, me: session.me, session };
      }
      // Même travail dans tous les cas (hachage compris) : le temps de réponse ne trahit rien.
      const hash = await hashPassword(password);
      const existing = await repo.findByEmail(email);
      if (existing) {
        await mailer.send({
          to: email,
          subject: 'Épicadémie : une inscription avec ton adresse',
          text:
            'Bonjour,\n\nQuelqu’un vient d’essayer de créer un compte Épicadémie avec cette adresse.\n' +
            `${existing.emailVerifiedAt ? 'Un compte existe déjà : connecte-toi, ou choisis « Mot de passe oublié » si tu ne t’en souviens plus.' : 'Ce compte attend encore sa validation : ouvre le lien reçu à l’inscription, ou choisis « Mot de passe oublié » pour le valider et choisir ton mot de passe.'}\n\n` +
            'Si ce n’était pas toi, ignore ce message : rien n’a été modifié.',
        });
        return { status: 'verification_required', email };
      }
      const account = await db.transaction((tx) => accountsRepo(tx).createFamilyAccount(email, hash));
      await sendVerification(account.id, email);
      return { status: 'verification_required', email };
    },

    /**
     * Ouvre le lien reçu (usage unique, 24 h) ET exige le mot de passe du compte : une personne qui a posé
     * une adresse qui n'est pas la sienne ne peut pas la faire valider, et le titulaire réel, qui ne
     * connaît pas ce mot de passe, passe par « Mot de passe oublié ». Un mot de passe faux ne consomme pas le lien.
     */
    async verifyEmail({ token, password }: EmailVerify): Promise<OpenedSession> {
      const account = await db.transaction(async (tx) => {
        const v = await verificationRepo(tx).findVerificationForUpdate(tokenHash(token));
        if (!v) throw new AppError('BAD_REQUEST', 'Ce lien n’est pas valide : demande-en un nouveau.');
        if (v.usedAt) throw new AppError('GONE', 'Ce lien a déjà été utilisé : connecte-toi avec ton mot de passe.');
        if (v.expiresAt <= clock.now()) throw new AppError('GONE', 'Ce lien a expiré : demande-en un nouveau.');
        const target = await accountsRepo(tx).findById(v.accountId);
        const ok = await verifyPassword(password, target?.passwordHash ?? (await dummyHash()));
        if (!target?.passwordHash || !ok) throw new AppError('UNAUTHORIZED', WRONG_PASSWORD_AT_VERIFICATION);
        await verificationRepo(tx).markVerificationUsed(v.tokenHash, clock.now());
        await verificationRepo(tx).markEmailVerified(v.accountId, clock.now());
        return target;
      });
      return open({ ...account, autonomous: false });
    },

    /** Renvoie le lien ; réponse identique que l'adresse existe, soit déjà validée ou non (pas de fuite). */
    async resendVerification(email: string): Promise<Record<string, never>> {
      if (recette) return {};
      const account = await repo.findByEmail(email);
      if (!account?.email || account.emailVerifiedAt) return {};
      const last = await vRepo.lastVerificationAt(account.id);
      if (last && clock.now().getTime() - last.getTime() < RESEND_COOLDOWN_SECONDS * 1000) return {};
      await sendVerification(account.id, account.email);
      return {};
    },

    /**
     * Connexion Google (e-mail déjà vérifié par Google, contrôlé par l'appelant). Même e-mail = même
     * compte. Un compte créé par mot de passe mais jamais validé perd ce mot de passe : sa
     * propriétaire réelle est celle que Google vient d'authentifier.
     */
    async loginWithGoogle(identity: { sub: string; email: string }): Promise<OpenedSession & { created: boolean }> {
      const now = clock.now();
      const known = await vRepo.findByGoogleSub(identity.sub);
      if (known) return { ...(await open({ ...known, autonomous: false })), created: false };
      const sameEmail = await repo.findByEmail(identity.email);
      if (sameEmail) {
        if (sameEmail.googleSub) throw conflict('Cette adresse est déjà reliée à un autre compte Google.');
        await db.transaction(async (tx) => {
          await verificationRepo(tx).linkGoogle(
            sameEmail.id,
            identity.sub,
            sameEmail.emailVerifiedAt ?? now,
            !sameEmail.emailVerifiedAt,
          );
          await verificationRepo(tx).deleteVerificationsOf(sameEmail.id);
        });
        const linked = await repo.findById(sameEmail.id);
        return { ...(await open({ ...(linked ?? sameEmail), autonomous: false })), created: false };
      }
      const account = await db.transaction((tx) =>
        accountsRepo(tx).createFamilyAccount(identity.email, null, { verifiedAt: now, googleSub: identity.sub }),
      );
      return { ...(await open({ ...account, autonomous: false })), created: true };
    },

    /**
     * Connexion par le portail (e-mail déjà authentifié par lui). Un compte existant de même adresse n'est
     * relié que si celle-ci est déjà vérifiée ; sinon refus, sans rien modifier. La session portail se
     * rouvre sans rien saisir : l'Espace parent n'est ouvert que tant qu'aucun secret parent n'existe.
     */
    async loginWithPortal(email: string): Promise<OpenedSession & { created: boolean }> {
      const now = clock.now();
      const existing = await repo.findByEmail(email);
      if (!existing) {
        const account = await db.transaction((tx) =>
          accountsRepo(tx).createFamilyAccount(email, null, { verifiedAt: now, portalLinkedAt: now }),
        );
        return { ...(await open({ ...account, autonomous: false })), created: true };
      }
      if (!existing.emailVerifiedAt) throw new AppError('EMAIL_NOT_VERIFIED', PORTAL_UNVERIFIED_ACCOUNT);
      if (!existing.portalLinkedAt) await vRepo.linkPortal(existing.id, now);
      const account = { ...existing, portalLinkedAt: existing.portalLinkedAt ?? now, autonomous: false };
      const locked = Boolean(existing.passwordHash ?? existing.parentPinHash);
      return { ...(await open(account, { locked })), created: false };
    },
  };
}
