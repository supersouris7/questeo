import { and, eq, isNull } from 'drizzle-orm';
import type { Executor } from '../../db/client.ts';
import { accounts, emailVerifications } from '../../db/schema.ts';

/** Accès à la validation d'adresse e-mail et au rattachements Google et portail (module « comptes »). */
export function verificationRepo(db: Executor) {
  return {
    async findByGoogleSub(sub: string) {
      const [row] = await db.select().from(accounts).where(eq(accounts.googleSub, sub));
      return row;
    },

    /** Relie un compte Google ; `resetPassword` efface un mot de passe posé avant toute preuve de l'adresse. */
    async linkGoogle(accountId: string, sub: string, verifiedAt: Date, resetPassword: boolean): Promise<void> {
      await db
        .update(accounts)
        .set({ googleSub: sub, emailVerifiedAt: verifiedAt, ...(resetPassword ? { passwordHash: null } : {}) })
        .where(eq(accounts.id, accountId));
    },

    /** Relie le compte au portail de connexion ; `resetPassword` : comme pour Google. */
    async linkPortal(accountId: string, at: Date, verifiedAt: Date, resetPassword: boolean): Promise<void> {
      await db
        .update(accounts)
        .set({ portalLinkedAt: at, emailVerifiedAt: verifiedAt, ...(resetPassword ? { passwordHash: null } : {}) })
        .where(eq(accounts.id, accountId));
    },

    async markEmailVerified(accountId: string, at: Date): Promise<void> {
      await db
        .update(accounts)
        .set({ emailVerifiedAt: at })
        .where(and(eq(accounts.id, accountId), isNull(accounts.emailVerifiedAt)));
    },

    /** Un seul lien valable à la fois : le nouveau remplace les précédents. */
    async replaceVerification(v: { tokenHash: string; accountId: string; expiresAt: Date; createdAt: Date }) {
      await db.delete(emailVerifications).where(eq(emailVerifications.accountId, v.accountId));
      await db.insert(emailVerifications).values(v);
    },

    async deleteVerificationsOf(accountId: string): Promise<void> {
      await db.delete(emailVerifications).where(eq(emailVerifications.accountId, accountId));
    },

    /** Lien (valable ou non), verrouillé jusqu'à la fin de la transaction : l'appelant juge de l'état. */
    async findVerificationForUpdate(tokenHash: string) {
      const [row] = await db
        .select()
        .from(emailVerifications)
        .where(eq(emailVerifications.tokenHash, tokenHash))
        .for('update');
      return row;
    },

    async markVerificationUsed(tokenHash: string, at: Date): Promise<void> {
      await db.update(emailVerifications).set({ usedAt: at }).where(eq(emailVerifications.tokenHash, tokenHash));
    },

    /** Date d'envoi du dernier lien d'un compte (limite de renvoi). */
    async lastVerificationAt(accountId: string): Promise<Date | null> {
      const [row] = await db
        .select({ at: emailVerifications.createdAt })
        .from(emailVerifications)
        .where(eq(emailVerifications.accountId, accountId));
      return row?.at ?? null;
    },
  };
}
