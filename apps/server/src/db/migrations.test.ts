import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Database } from './client.ts';
import { assertSchemaUpToDate, runMigrations, schemaStatus } from './migrations.ts';
import { MIGRATIONS_DIR } from '../testing/harness.ts';
import { profiles, sessions, skillStates } from './schema.ts';

let database: Database | null = null;
afterEach(async () => {
  await database?.close();
  database = null;
});

describe('migrations', () => {
  it('une base neuve n’est pas à jour : le serveur refuse de démarrer', async () => {
    database = await openDatabase('pglite://memory');
    const status = await schemaStatus(database, MIGRATIONS_DIR);
    expect(status).toMatchObject({ upToDate: false, applied: 0 });
    expect(status.expected).toBeGreaterThan(0);
    await expect(assertSchemaUpToDate(database, MIGRATIONS_DIR)).rejects.toThrow(/db:migrate/);
  });

  it('migre, puis la base est à jour ; relancer ne fait rien (idempotent)', async () => {
    database = await openDatabase('pglite://memory');
    await runMigrations(database, MIGRATIONS_DIR);
    const first = await schemaStatus(database, MIGRATIONS_DIR);
    expect(first.upToDate).toBe(true);
    expect(first.applied).toBe(first.expected);
    await runMigrations(database, MIGRATIONS_DIR);
    expect((await schemaStatus(database, MIGRATIONS_DIR)).applied).toBe(first.applied);
    await expect(assertSchemaUpToDate(database, MIGRATIONS_DIR)).resolves.toBeUndefined();
  });

  it('journal : dates strictement croissantes (sinon le migrateur saute une migration sans rien dire)', () => {
    const journal = JSON.parse(readFileSync(path.join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8')) as {
      entries: { tag: string; when: number }[];
    };
    for (let i = 1; i < journal.entries.length; i++) {
      const [prev, cur] = [journal.entries[i - 1], journal.entries[i]];
      expect(cur?.when, `${cur?.tag} après ${prev?.tag}`).toBeGreaterThan(prev?.when ?? 0);
    }
  });

  it('une migration sautée rend la base « pas à jour »', async () => {
    database = await openDatabase('pglite://memory');
    await runMigrations(database, MIGRATIONS_DIR);
    await database.db.execute(
      sql`delete from drizzle.__drizzle_migrations where id = (select min(id) from drizzle.__drizzle_migrations)`,
    );
    expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(false);
  });

  it('coffres : depuis une base en 0010, la colonne arrive et les séries terminées comptent un coffre', async () => {
    const dir = migrationsUpTo(11); // jusqu'à 0010
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        ('77777777-7777-4777-8777-777777777777', 'Léo', '{"style":"pixelbot","seed":"l"}', 'alex')`);
      await db.execute(sql`insert into sessions (profile_id, mode, subject, chapter_id, finished_at, answered) values
        ('77777777-7777-4777-8777-777777777777', 'entrainement', 'maths', 'm5-calcul', now(), 4),
        ('77777777-7777-4777-8777-777777777777', 'entrainement', 'maths', 'm5-calcul', null, 2),
        ('77777777-7777-4777-8777-777777777777', 'boss', 'maths', 'm5-relatifs', now(), 7)`);
      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      const chests: unknown = await db.execute(sql`select mode, chest from sessions order by mode, chest`);
      expect(JSON.stringify(chests)).toContain('{"mode":"entrainement","chest":"commun"}');
      expect(JSON.stringify(chests).match(/"chest":"commun"/g)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('sciences : la matière physique devient sciences, notions et parties conservées', async () => {
    const dir = migrationsUpTo(23); // jusqu'à 0022
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        ('66666666-6666-4666-8666-666666666666', 'Zoé', '{"style":"portrait","seed":"03"}', 'alex')`);
      await db.execute(sql`insert into sessions (profile_id, mode, subject, chapter_id, answered, correct) values
        ('66666666-6666-4666-8666-666666666666', 'boss', 'physique', 'p4-mouvement', 9, 7),
        ('66666666-6666-4666-8666-666666666666', 'entrainement', 'maths', 'm5-calcul', 4, 4)`);
      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      const result = await db.execute(
        sql`select subject, chapter_id, answered, correct from sessions order by chapter_id`,
      );
      expect(rows<{ subject: string; chapter_id: string; answered: number; correct: number }>(result)).toEqual([
        { subject: 'maths', chapter_id: 'm5-calcul', answered: 4, correct: 4 },
        { subject: 'sciences', chapter_id: 'p4-mouvement', answered: 9, correct: 7 },
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('avatars : les anciens avatars générés deviennent un des 25 portraits, toujours le même', async () => {
    const dir = migrationsUpTo(13); // jusqu'à 0012
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar) values
        ('88888888-8888-4888-8888-888888888888', 'Ana', '{"style":"fun-emoji","seed":"abc123"}'),
        ('99999999-9999-4999-8999-999999999999', 'Eli', '{"style":"portrait","seed":"12"}')`);
      await runMigrations(database, MIGRATIONS_DIR);
      const rows = await db
        .select({ name: profiles.name, avatar: profiles.avatar })
        .from(profiles)
        .orderBy(profiles.name);
      expect(rows[0]?.avatar.style).toBe('portrait');
      expect(rows[0]?.avatar.seed).toMatch(/^(0[1-9]|1\d|2[0-5])$/);
      expect(rows[1]?.avatar).toEqual({ style: 'portrait', seed: '12' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('élève autonome : depuis une base en 0015, comptes existants intacts (famille non autonome)', async () => {
    const dir = migrationsUpTo(16); // jusqu'à 0015
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into families (id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`);
      await db.execute(sql`insert into accounts (family_id, email, password_hash) values
        ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'parent@exemple.fr', 'hash')`);
      await runMigrations(database, MIGRATIONS_DIR);
      const rows = JSON.stringify(
        await db.execute(
          sql`select f.autonomous, a.email, a.recovery_hash from accounts a join families f on f.id = a.family_id`,
        ),
      );
      expect(rows).toContain('"autonomous":false');
      expect(rows).toContain('"email":"parent@exemple.fr"');
      // Un compte sans e-mail ni mot de passe est désormais possible (élève autonome).
      await db.execute(
        sql`insert into families (id, autonomous) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true)`,
      );
      await db.execute(
        sql`insert into accounts (family_id, recovery_hash) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'h')`,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('suppression des recommandations : depuis une base en 0020, profils intacts ; le retour arrière recrée la table vide', async () => {
    const dir = migrationsUpTo(21); // jusqu'à 0020 : la table existe encore
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'Léa', '{"style":"pixelbot","seed":"l"}', 'alex')`);
      await db.execute(sql`insert into recommendations (profile_id, skill_id, note)
        values ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'm5-tables', 'Courage !')`);
      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      await expect(db.execute(sql`select 1 from recommendations`)).rejects.toThrow();
      expect(await db.select().from(profiles)).toHaveLength(1);
      // Retour arrière documenté dans la migration (lignes commentées « --   ») : table recréée, vide.
      const file = readFileSync(path.join(MIGRATIONS_DIR, '0021_suppression_recommandations.sql'), 'utf8');
      const rollback = file
        .split('\n')
        .filter((l) => l.startsWith('--   '))
        .map((l) => l.slice(5))
        .join('\n');
      for (const statement of rollback.split(';').filter((q) => q.trim())) await db.execute(sql.raw(statement));
      expect(await db.execute(sql`select count(*)::int as n from recommendations`)).toMatchObject({
        rows: [{ n: 0 }],
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('sentiment de fin de séance : depuis une base en 0028, parties intactes ; bornes et retour arrière', async () => {
    const dir = migrationsUpTo(29); // jusqu'à 0028
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'Léa', '{"style":"pixelbot","seed":"l"}', 'alex')`);
      await db.execute(sql`insert into sessions (profile_id, mode, subject, chapter_id)
        values ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'entrainement', 'maths', 'm5-calcul')`);
      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      expect(await db.select({ feeling: sessions.feeling }).from(sessions)).toEqual([{ feeling: null }]);
      await db.execute(sql`update sessions set feeling = 3`);
      await expect(db.execute(sql`update sessions set feeling = 4`)).rejects.toThrow();
      const file = readFileSync(path.join(MIGRATIONS_DIR, '0029_sentiment_de_capacite.sql'), 'utf8');
      const rollback = file
        .split('\n')
        .filter((l) => l.startsWith('--   '))
        .map((l) => l.slice(5))
        .join('\n');
      for (const statement of rollback.split(';').filter((q) => q.trim())) await db.execute(sql.raw(statement));
      expect(rows<{ n: number }>(await db.execute(sql`select count(*)::int as n from sessions`))).toEqual([{ n: 1 }]);
      await expect(db.execute(sql`select feeling from sessions`)).rejects.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('connexion par le portail : depuis une base en 0029, comptes intacts ; retour arrière', async () => {
    const dir = migrationsUpTo(30); // jusqu'à 0029
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into families (id) values ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb')`);
      await db.execute(sql`insert into accounts (family_id, email)
        values ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb', 'parent@famille.test')`);
      await runMigrations(database, MIGRATIONS_DIR);
      const linked = sql`select email, portal_linked_at from accounts`;
      expect(rows(await db.execute(linked))).toEqual([{ email: 'parent@famille.test', portal_linked_at: null }]);
      const rollback = readFileSync(path.join(MIGRATIONS_DIR, '0030_connexion_portail.sql'), 'utf8')
        .split('\n')
        .filter((l) => l.startsWith('--   '))
        .map((l) => l.slice(5));
      for (const statement of rollback) await db.execute(sql.raw(statement));
      await expect(db.execute(linked)).rejects.toThrow();
      expect(rows(await db.execute(sql`select email from accounts`))).toEqual([{ email: 'parent@famille.test' }]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('épreuve du chapitre : depuis une base en 0019, parties intactes ; une seule récompense ; retour arrière', async () => {
    const dir = migrationsUpTo(20); // jusqu'à 0019
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'Léa', '{"style":"pixelbot","seed":"l"}', 'alex')`);
      await db.execute(sql`insert into sessions (profile_id, mode, subject, chapter_id)
        values ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'entrainement', 'maths', 'm5-calcul')`);
      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      // Les parties existantes ne sont pas des épreuves.
      const rows = await db.select({ epreuve: sessions.epreuve }).from(sessions);
      expect(rows).toEqual([{ epreuve: false }]);
      await db.execute(sql`insert into chapter_rewards (profile_id, chapter_id)
        values ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'm5-calcul')`);
      // Un chapitre ne se récompense qu'une fois par profil.
      await expect(
        db.execute(sql`insert into chapter_rewards (profile_id, chapter_id)
          values ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'm5-calcul')`),
      ).rejects.toThrow();
      // Retour arrière documenté dans la migration : le reste des données est intact.
      await db.execute(sql`drop table "chapter_rewards"`);
      await db.execute(sql`alter table "sessions" drop column "epreuve"`);
      expect(await db.select().from(profiles)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('arène d’évaluation : depuis une base en 0021, rien n’est perdu ; contraintes, cascade et retour arrière', async () => {
    const dir = migrationsUpTo(22); // jusqu'à 0021
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      const leo = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
      const ana = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        (${leo}, 'Léo', '{"style":"pixelbot","seed":"l"}', 'alex'),
        (${ana}, 'Ana', '{"style":"pixelbot","seed":"a"}', 'lina')`);
      await db.execute(sql`insert into sessions (profile_id, mode, subject, chapter_id)
        values (${leo}, 'entrainement', 'maths', 'm5-calcul')`);
      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      expect(await db.select().from(sessions)).toHaveLength(1);

      const session = async (profile: string) =>
        rows<{ id: string }>(
          await db.execute(sql`insert into sessions (profile_id, mode, subject, chapter_id)
            values (${profile}, 'evaluation', 'maths', 'ref-maths-5e') returning id`),
        )[0]?.id;
      const evaluation = async (profile: string, status = 'en-cours') => {
        const sessionId = await session(profile);
        return rows<{ id: string }>(
          await db.execute(sql`insert into evaluations
            (profile_id, session_id, subject, kind, profile_grade, referential_grade, referential_version, school_year, status)
            values (${profile}, ${sessionId}, 'maths', 'origines', '5e', '6e', 1, 2026, ${status}) returning id`),
        )[0]?.id;
      };
      const first = await evaluation(leo);
      // Une seule épreuve ouverte par profil et par matière ; une terminée ne bloque pas ; un autre profil non plus.
      await expect(evaluation(leo)).rejects.toThrow();
      await expect(evaluation(leo, 'terminee')).resolves.toBeTruthy();
      await expect(evaluation(ana)).resolves.toBeTruthy();
      // Bornes et vocabulaire refusés par la base.
      await expect(db.execute(sql`update evaluations set mastery = 101 where id = ${first}`)).rejects.toThrow();
      await expect(db.execute(sql`update evaluations set kind = 'autre' where id = ${first}`)).rejects.toThrow();
      await db.execute(sql`insert into evaluation_competences (evaluation_id, competence_id, role, domain, essential, state)
        values (${first}, 'm6-fractions', 'score', 'nombres', true, 'maitrisee')`);
      await expect(
        db.execute(sql`insert into evaluation_competences (evaluation_id, competence_id, role, domain, essential, state)
          values (${first}, 'm6-fractions', 'score', 'nombres', true, 'maitrisee')`),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`insert into evaluation_competences (evaluation_id, competence_id, role, domain, essential, state)
          values (${first}, 'm6-calcul', 'score', 'nombres', true, 'inconnu')`),
      ).rejects.toThrow();
      await db.execute(sql`insert into studied_chapters (profile_id, school_year, chapter_id, status)
        values (${leo}, 2026, 'm5-calcul', 'vu')`);
      await expect(
        db.execute(sql`insert into studied_chapters (profile_id, school_year, chapter_id, status)
          values (${leo}, 2026, 'm5-calcul', 'pas-vu')`),
      ).rejects.toThrow();

      // L'effacement d'un profil emporte ses épreuves, résultats et déclarations.
      await db.execute(sql`delete from profiles where id = ${leo}`);
      const left = await db.execute(
        sql`select (select count(*)::int from evaluations) as e, (select count(*)::int from evaluation_competences) as c,
          (select count(*)::int from studied_chapters) as s`,
      );
      expect(left).toMatchObject({ rows: [{ e: 1, c: 0, s: 0 }] });

      // Retour arrière documenté dans l'en-tête de la migration : le reste des données est intact.
      const file = readFileSync(path.join(MIGRATIONS_DIR, '0022_arene_evaluation.sql'), 'utf8');
      const rollback = file
        .split('\n')
        .filter((l) => l.startsWith('--   '))
        .map((l) => l.slice(5))
        .join('\n');
      for (const statement of rollback.split(';').filter((q) => q.trim())) await db.execute(sql.raw(statement));
      await expect(db.execute(sql`select 1 from evaluations`)).rejects.toThrow();
      expect(await db.select().from(profiles)).toHaveLength(1);
      expect(await db.select({ mode: sessions.mode }).from(sessions)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuse une URL de base inconnue', async () => {
    await expect(openDatabase('mysql://x')).rejects.toThrow(/DATABASE_URL/);
  });

  it('mise à jour d’une base de la bêta : profils et progression conservés, sans famille', async () => {
    // Base telle qu'en production avant les comptes : seulement la 1re migration.
    const dir = migrationsUpTo(1);
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, coins, xp)
        values ('11111111-1111-4111-8111-111111111111', 'Léa', '{"style":"pixelbot","seed":"l"}', 120, 340)`);
      await db.execute(sql`insert into skill_states (profile_id, skill_id, stage, recent)
        values ('11111111-1111-4111-8111-111111111111', 'm5-tables', 2, '[true,true]')`);

      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      const rows = await db
        .select({ name: profiles.name, coins: profiles.coins, xp: profiles.xp, familyId: profiles.familyId })
        .from(profiles);
      expect(rows).toEqual([{ name: 'Léa', coins: 120, xp: 340, familyId: null }]);
      expect(await db.select().from(skillStates)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('suppression du QG : cosmétiques achetés remboursés (pièces et rubis), tables supprimées', async () => {
    const dir = migrationsUpTo(8); // jusqu'à 0007_qg
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, coins, rubies)
        values ('22222222-2222-4222-8222-222222222222', 'Tom', '{"style":"pixelbot","seed":"t"}', 100, 1)`);
      await db.execute(sql`insert into owned_cosmetics (profile_id, cosmetic) values
        ('22222222-2222-4222-8222-222222222222', 'fond-nuit'),
        ('22222222-2222-4222-8222-222222222222', 'cadre-feu')`);
      await db.execute(sql`insert into hq_layouts (profile_id, layout)
        values ('22222222-2222-4222-8222-222222222222', '{}')`);

      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      const [tom] = await db.select({ coins: profiles.coins, rubies: profiles.rubies }).from(profiles);
      // fond-nuit : 2 rubis ; cadre-feu : 300 pièces.
      expect(tom).toEqual({ coins: 400, rubies: 3 });
      const tables: unknown = await db.execute(
        sql`select table_name from information_schema.tables where table_name in ('hq_layouts', 'owned_cosmetics')`,
      );
      expect(JSON.stringify(tables)).not.toMatch(/hq_layouts|owned_cosmetics/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refonte des héros : Pixel, Tao, Ayla deviennent Alex ; collection nettoyée', async () => {
    const dir = migrationsUpTo(9); // jusqu'à 0008
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        ('33333333-3333-4333-8333-333333333333', 'Noé', '{"style":"pixelbot","seed":"n"}', 'pixel'),
        ('44444444-4444-4444-8444-444444444444', 'Ana', '{"style":"pixelbot","seed":"a"}', 'lina')`);
      await db.execute(sql`insert into owned_heroes (profile_id, hero, source) values
        ('33333333-3333-4333-8333-333333333333', 'pixel', 'depart'),
        ('33333333-3333-4333-8333-333333333333', 'lina', 'coffre'),
        ('44444444-4444-4444-8444-444444444444', 'lina', 'depart')`);

      const upTo0009 = migrationsUpTo(10);
      await runMigrations(database, upTo0009);
      rmSync(upTo0009, { recursive: true, force: true });
      const heroes = await db
        .select({ name: profiles.name, hero: profiles.hero })
        .from(profiles)
        .orderBy(profiles.name);
      expect(heroes).toEqual([
        { name: 'Ana', hero: 'lina' },
        { name: 'Noé', hero: 'alex' },
      ]);
      const owned: unknown = await db.execute(sql`select profile_id, hero from owned_heroes order by profile_id, hero`);
      expect(JSON.stringify(owned)).not.toContain('pixel');
      expect(JSON.stringify(owned).match(/"hero":"alex"/g)).toHaveLength(1);
      expect(JSON.stringify(owned).match(/"hero":"lina"/g)).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('héros débloqués : chaque profil possède Alex et Lina, le héros porté ne change pas', async () => {
    const dir = migrationsUpTo(10); // jusqu'à 0009
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        ('55555555-5555-4555-8555-555555555555', 'Zoé', '{"style":"pixelbot","seed":"z"}', 'lina'),
        ('66666666-6666-4666-8666-666666666666', 'Tom', '{"style":"pixelbot","seed":"t"}', 'alex')`);
      await db.execute(sql`insert into owned_heroes (profile_id, hero, source) values
        ('55555555-5555-4555-8555-555555555555', 'lina', 'depart'),
        ('66666666-6666-4666-8666-666666666666', 'alex', 'depart'),
        ('66666666-6666-4666-8666-666666666666', 'lina', 'coffre')`);

      await runMigrations(database, MIGRATIONS_DIR);
      const owned: unknown = await db.execute(
        sql`select p.name, o.hero, o.source from owned_heroes o join profiles p on p.id = o.profile_id order by p.name, o.hero`,
      );
      const rows = JSON.stringify(owned);
      for (const expected of [
        '{"name":"Tom","hero":"alex","source":"depart"}',
        '{"name":"Tom","hero":"lina","source":"coffre"}',
        '{"name":"Zoé","hero":"alex","source":"depart"}',
        '{"name":"Zoé","hero":"lina","source":"depart"}',
      ])
        expect(rows).toContain(expected);
      const worn = await db.select({ name: profiles.name, hero: profiles.hero }).from(profiles).orderBy(profiles.name);
      expect(worn).toEqual([
        { name: 'Tom', hero: 'alex' },
        { name: 'Zoé', hero: 'lina' },
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('niveaux 1 à 5 : depuis une base en 0025, réponses conservées ; 4 et 5 acceptés, 6 refusé ; retour arrière', async () => {
    const dir = migrationsUpTo(26); // jusqu'à 0025
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      const leo = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        (${leo}, 'Léo', '{"style":"pixelbot","seed":"l"}', 'alex')`);
      const session = rows<{ id: string }>(
        await db.execute(sql`insert into sessions (profile_id, mode, subject, chapter_id)
          values (${leo}, 'entrainement', 'maths', 'm5-calcul') returning id`),
      )[0]?.id;
      const attempt = (level: number) =>
        db.execute(sql`insert into attempts (session_id, profile_id, skill_id, level, seed, variant, response, correct, duration_ms, xp)
          values (${session}, ${leo}, 'm5-tables', ${level}, 1, false, '{}', true, 1000, 5)`);
      await attempt(3);
      await expect(attempt(4)).rejects.toThrow();
      await runMigrations(database, MIGRATIONS_DIR);
      expect((await schemaStatus(database, MIGRATIONS_DIR)).upToDate).toBe(true);
      await attempt(4);
      await attempt(5);
      await expect(attempt(6)).rejects.toThrow();
      await db.execute(
        sql`insert into question_reports (kind, skill_id, level, reason) values ('question', 'm5-tables', 5, 'bug')`,
      );
      // Retour arrière documenté dans la migration, après avoir retiré les niveaux 4 et 5.
      const file = readFileSync(path.join(MIGRATIONS_DIR, '0026_niveaux_1_a_5.sql'), 'utf8');
      const rollback = file
        .split('\n')
        .filter((l) => l.startsWith('--   '))
        .map((l) => l.slice(5))
        .join('\n');
      await db.execute(sql`delete from attempts where level > 3`);
      await db.execute(sql`delete from question_reports where level > 3`);
      for (const statement of rollback.split(';').filter((q) => q.trim())) await db.execute(sql.raw(statement));
      await expect(attempt(4)).rejects.toThrow();
      expect(await db.execute(sql`select count(*)::int as n from attempts`)).toMatchObject({ rows: [{ n: 1 }] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('médaille de diamant (0028)', () => {
  it('les séries parfaites passent en diamant, 7 est refusé, le retour arrière les remet en or', async () => {
    const dir = migrationsUpTo(28); // jusqu'à 0027
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      const leo = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb';
      await db.execute(sql`insert into profiles (id, name, avatar, hero) values
        (${leo}, 'Léo', '{"style":"pixelbot","seed":"l"}', 'alex')`);
      await db.execute(sql`insert into skill_states (profile_id, skill_id, recent, best_series) values
        (${leo}, 'a', '[]', 5), (${leo}, 'b', '[]', 4)`);
      const best = async () =>
        rows<{ best_series: number }>(
          await db.execute(sql`select best_series from skill_states order by skill_id`),
        ).map((r) => r.best_series);
      await runMigrations(database, MIGRATIONS_DIR);
      expect(await best()).toEqual([6, 4]);
      await expect(db.execute(sql`update skill_states set best_series = 7`)).rejects.toThrow();
      const file = readFileSync(path.join(MIGRATIONS_DIR, '0028_medaille_diamant.sql'), 'utf8');
      const rollback = file
        .split('\n')
        .filter((l) => l.startsWith('--   '))
        .map((l) => l.slice(5))
        .join('\n');
      for (const statement of rollback.split(';').filter((q) => q.trim())) await db.execute(sql.raw(statement));
      expect(await best()).toEqual([5, 4]);
      await expect(db.execute(sql`update skill_states set best_series = 6`)).rejects.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/** Copie des `count` premières migrations (base d'une version antérieure). */
function migrationsUpTo(count: number): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'epicademie-migrations-'));
  cpSync(MIGRATIONS_DIR, dir, { recursive: true });
  const journalPath = path.join(dir, 'meta', '_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as { entries: unknown[] };
  writeFileSync(journalPath, JSON.stringify({ ...journal, entries: journal.entries.slice(0, count) }));
  return dir;
}

const rows = <T>(result: unknown): T[] => (result as { rows: T[] }).rows;

describe('rôles d’administration (0027)', () => {
  const tables = async (db: Database['db']) =>
    JSON.stringify(
      await db.execute(sql`select table_name, column_name from information_schema.columns
        where table_schema = 'public' and (table_name in ('admin_sessions', 'admin_access_events') or column_name = 'admin_sub')
        order by 1, 2`),
    );

  it('montée puis descente (retour arrière écrit dans le fichier) puis remontée, données conservées', async () => {
    const dir = migrationsUpTo(27); // jusqu'à 0026
    const after = migrationsUpTo(28); // jusqu'à 0027
    try {
      database = await openDatabase('pglite://memory');
      await runMigrations(database, dir);
      const { db } = database;
      await db.execute(sql`insert into admin_audit (operator, action, account_id)
        values ('Marie', 'consultation', '77777777-7777-4777-8777-777777777777')`);
      const before = await tables(db);
      await runMigrations(database, after);
      expect(await tables(db)).toContain('admin_sessions');
      const down = readFileSync(path.join(MIGRATIONS_DIR, '0027_administration_roles.sql'), 'utf8')
        .split('\n')
        .filter((line) => line.startsWith('--   '))
        .map((line) => line.slice(2));
      expect(down).toHaveLength(5);
      for (const statement of down) await db.execute(sql.raw(statement));
      expect(await tables(db)).toBe(before);
      expect((await schemaStatus(database, dir)).upToDate).toBe(true);
      await runMigrations(database, after);
      expect((await schemaStatus(database, after)).upToDate).toBe(true);
      expect(JSON.stringify(await db.execute(sql`select operator, admin_sub from admin_audit`))).toContain('Marie');
    } finally {
      rmSync(after, { recursive: true, force: true });
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
