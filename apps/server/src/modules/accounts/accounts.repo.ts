import { and, eq, gt, isNull, ne } from 'drizzle-orm';
import type { Executor } from '../../db/client.ts';
import {
  accounts,
  authSessions,
  familyInvites,
  families,
  passwordResets,
  profiles,
  evaluations,
  sessions,
} from '../../db/schema.ts';

/** Accès aux comptes, familles, sessions d'appareil et liens de réinitialisation. */
export function accountsRepo(db: Executor) {
  return {
    /** Crée la famille et son compte parent (dans la transaction de l'appelant). */
    async createFamilyAccount(
      email: string,
      passwordHash: string | null,
      options: { verifiedAt?: Date | null; googleSub?: string; portalLinkedAt?: Date } = {},
    ) {
      const [family] = await db.insert(families).values({}).returning({ id: families.id });
      if (!family) throw new Error('création de famille sans retour');
      const [account] = await db
        .insert(accounts)
        .values({
          familyId: family.id,
          email,
          passwordHash,
          emailVerifiedAt: options.verifiedAt ?? null,
          googleSub: options.googleSub ?? null,
          portalLinkedAt: options.portalLinkedAt ?? null,
        })
        .returning();
      if (!account) throw new Error('création de compte sans retour');
      return account;
    },

    /** Famille autonome (élève de moins de 15 ans) et son compte sans e-mail, ni mot de passe. */
    async createAutonomousAccount(recoveryHash: string) {
      const [family] = await db.insert(families).values({ autonomous: true }).returning({ id: families.id });
      if (!family) throw new Error('création de famille sans retour');
      const [account] = await db.insert(accounts).values({ familyId: family.id, recoveryHash }).returning();
      if (!account) throw new Error('création de compte sans retour');
      return account;
    },

    async findByRecovery(recoveryHash: string) {
      const [row] = await db.select().from(accounts).where(eq(accounts.recoveryHash, recoveryHash));
      return row;
    },

    async setRecovery(accountId: string, recoveryHash: string): Promise<void> {
      await db.update(accounts).set({ recoveryHash }).where(eq(accounts.id, accountId));
    },

    async isAutonomous(familyId: string): Promise<boolean> {
      const [row] = await db.select({ a: families.autonomous }).from(families).where(eq(families.id, familyId));
      return row?.a ?? false;
    },

    async deleteFamily(familyId: string): Promise<void> {
      await db.delete(families).where(eq(families.id, familyId));
    },

    // ——— Invitations de rattachement ———

    /** Une seule invitation à la fois par famille : la nouvelle remplace les précédentes. */
    async replaceInvite(i: { codeHash: string; familyId: string; expiresAt: Date }): Promise<void> {
      await db.delete(familyInvites).where(eq(familyInvites.familyId, i.familyId));
      await db.insert(familyInvites).values(i);
    },

    /** Invitation valide (non utilisée, non expirée) d'une famille encore autonome, verrouillée. */
    async findInviteForUpdate(codeHash: string, now: Date) {
      const [row] = await db
        .select({ codeHash: familyInvites.codeHash, familyId: familyInvites.familyId })
        .from(familyInvites)
        .innerJoin(families, eq(families.id, familyInvites.familyId))
        .where(
          and(
            eq(familyInvites.codeHash, codeHash),
            isNull(familyInvites.usedAt),
            gt(familyInvites.expiresAt, now),
            eq(families.autonomous, true),
          ),
        )
        .for('update', { of: familyInvites });
      return row;
    },

    /** Déplace les profils vers la famille du parent ; renvoie leurs pseudos. */
    async moveProfiles(fromFamilyId: string, toFamilyId: string): Promise<string[]> {
      const rows = await db
        .update(profiles)
        .set({ familyId: toFamilyId })
        .where(eq(profiles.familyId, fromFamilyId))
        .returning({ name: profiles.name });
      return rows.map((r) => r.name);
    },

    async findByEmail(email: string) {
      const [row] = await db.select().from(accounts).where(eq(accounts.email, email));
      return row;
    },

    async findById(id: string) {
      const [row] = await db.select().from(accounts).where(eq(accounts.id, id));
      return row;
    },

    async setPassword(accountId: string, passwordHash: string): Promise<void> {
      await db.update(accounts).set({ passwordHash }).where(eq(accounts.id, accountId));
    },

    // ——— Sessions d'appareil ———

    async createSession(s: { tokenHash: string; accountId: string; expiresAt: Date; parentUntil: Date | null }) {
      await db.insert(authSessions).values(s);
    },

    /** Session encore valide, avec son compte. */
    async findSession(tokenHash: string, now: Date) {
      const [row] = await db
        .select({
          tokenHash: authSessions.tokenHash,
          expiresAt: authSessions.expiresAt,
          parentUntil: authSessions.parentUntil,
          accountId: accounts.id,
          familyId: accounts.familyId,
          email: accounts.email,
          role: accounts.role,
          autonomous: families.autonomous,
        })
        .from(authSessions)
        .innerJoin(accounts, eq(accounts.id, authSessions.accountId))
        .innerJoin(families, eq(families.id, accounts.familyId))
        .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, now)));
      return row;
    },

    async extendSession(tokenHash: string, expiresAt: Date): Promise<void> {
      await db.update(authSessions).set({ expiresAt }).where(eq(authSessions.tokenHash, tokenHash));
    },

    async setParentPin(accountId: string, pinHash: string): Promise<void> {
      await db
        .update(accounts)
        .set({ parentPinHash: pinHash, pinFailures: 0, pinLockedUntil: null })
        .where(eq(accounts.id, accountId));
    },

    async setPinFailures(accountId: string, failures: number, lockedUntil: Date | null): Promise<void> {
      await db
        .update(accounts)
        .set({ pinFailures: failures, pinLockedUntil: lockedUntil })
        .where(eq(accounts.id, accountId));
    },

    async setJoinFailures(accountId: string, failures: number, lockedUntil: Date | null): Promise<void> {
      await db
        .update(accounts)
        .set({ joinFailures: failures, joinLockedUntil: lockedUntil })
        .where(eq(accounts.id, accountId));
    },

    async setParentUntil(tokenHash: string, parentUntil: Date | null): Promise<void> {
      await db.update(authSessions).set({ parentUntil }).where(eq(authSessions.tokenHash, tokenHash));
    },

    async deleteSession(tokenHash: string): Promise<void> {
      await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
    },

    /** Ferme toutes les sessions du compte (sauf, éventuellement, celle en cours). */
    async deleteSessionsOf(accountId: string, keep?: string): Promise<void> {
      await db
        .delete(authSessions)
        .where(and(eq(authSessions.accountId, accountId), keep ? ne(authSessions.tokenHash, keep) : undefined));
    },

    // ——— Réinitialisation du mot de passe ———

    async createReset(r: { tokenHash: string; accountId: string; expiresAt: Date }) {
      await db.insert(passwordResets).values(r);
    },

    /** Lien encore valide et jamais utilisé, verrouillé jusqu'à la fin de la transaction. */
    async findResetForUpdate(tokenHash: string, now: Date) {
      const [row] = await db
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.tokenHash, tokenHash),
            isNull(passwordResets.usedAt),
            gt(passwordResets.expiresAt, now),
          ),
        )
        .for('update');
      return row;
    },

    async markResetUsed(tokenHash: string, at: Date): Promise<void> {
      await db.update(passwordResets).set({ usedAt: at }).where(eq(passwordResets.tokenHash, tokenHash));
    },

    // ——— Appartenance (isolation des familles) ———

    async familyOfProfile(profileId: string): Promise<string | null | undefined> {
      const [row] = await db.select({ familyId: profiles.familyId }).from(profiles).where(eq(profiles.id, profileId));
      return row?.familyId;
    },

    /** Famille du joueur d'une partie ou d'un combat (même table `sessions`). */
    async familyOfGame(gameId: string): Promise<string | null | undefined> {
      const [row] = await db
        .select({ familyId: profiles.familyId })
        .from(sessions)
        .innerJoin(profiles, eq(profiles.id, sessions.profileId))
        .where(eq(sessions.id, gameId));
      return row?.familyId;
    },

    /** Famille du joueur d'une épreuve d'évaluation. */
    async familyOfEvaluation(evaluationId: string): Promise<string | null | undefined> {
      const [row] = await db
        .select({ familyId: profiles.familyId })
        .from(evaluations)
        .innerJoin(profiles, eq(profiles.id, evaluations.profileId))
        .where(eq(evaluations.id, evaluationId));
      return row?.familyId;
    },
  };
}

/**
 * Rattache les profils de la bêta (créés avant les comptes, sans famille) à la famille d'un
 * compte (commande d'exploitation `admin rattacher`). Seuls les profils sans famille sont
 * touchés ; renvoie leurs prénoms, ou null si le compte n'existe pas.
 */
export async function attachOrphanProfiles(db: Executor, email: string): Promise<string[] | null> {
  const account = await accountsRepo(db).findByEmail(email.trim().toLowerCase());
  if (!account) return null;
  const rows = await db
    .update(profiles)
    .set({ familyId: account.familyId })
    .where(isNull(profiles.familyId))
    .returning({ name: profiles.name });
  return rows.map((r) => r.name);
}
