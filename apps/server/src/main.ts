import { buildApp } from './app.ts';
import { ConfigError, loadConfig } from './config.ts';
import { openDatabase } from './db/client.ts';
import { assertSchemaUpToDate, runMigrations } from './db/migrations.ts';
import { startRealtime } from './realtime.ts';
import { purgeUnverifiedAccounts } from './modules/accounts/index.ts';

/**
 * Point d'entrée du serveur : configuration → base (vérifiée) → application → temps réel →
 * écoute. Arrêt propre sur SIGTERM/SIGINT (requêtes en cours terminées, connexions fermées).
 */

/** Délai maximal d'arrêt propre avant arrêt forcé. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

/** Intervalle de la purge des inscriptions non validées. */
const PURGE_INTERVAL_MS = 24 * 3600 * 1000;

async function main(): Promise<void> {
  const config = loadConfig();
  const database = await openDatabase(config.databaseUrl, { poolMax: config.databasePoolMax });
  // Une base en mémoire naît vide avec ce processus : lui seul peut la migrer. Sinon, les
  // migrations sont une étape de déploiement distincte (commande `migrate`).
  if (database.ephemeral) await runMigrations(database, config.migrationsDir);
  else await assertSchemaUpToDate(database, config.migrationsDir);

  const app = await buildApp({ config, database });
  const realtime = startRealtime(app, config.corsOrigins, config.trustProxy);
  const log = app.http.log;

  // Production seulement (en recette, les comptes sont validés à la création) : purge au démarrage
  // puis toutes les 24 h des inscriptions jamais validées après 7 jours. Journal sans donnée personnelle.
  if (!config.recette) {
    const purge = (): void => {
      purgeUnverifiedAccounts(database.db, app.clock.now())
        .then((removed) => log.info({ removed }, 'purge des inscriptions non validées'))
        .catch((err: unknown) => app.reporter.capture(err, { source: 'process' }));
    };
    purge();
    setInterval(purge, PURGE_INTERVAL_MS).unref();
  }

  process.on('unhandledRejection', (reason) => app.reporter.capture(reason, { source: 'process' }));
  process.on('uncaughtException', (err) => {
    app.reporter.capture(err, { source: 'process' });
    log.fatal({ err }, 'exception non rattrapée : arrêt');
    void shutdown(1);
  });

  let stopping = false;
  async function shutdown(code = 0): Promise<void> {
    if (stopping) return;
    stopping = true;
    log.info('arrêt en cours');
    setTimeout(() => process.exit(code || 1), SHUTDOWN_TIMEOUT_MS).unref();
    try {
      await realtime.close();
      await app.http.close();
      await database.close();
    } finally {
      process.exit(code);
    }
  }
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  await app.http.listen({ port: config.port, host: config.host });
  log.info({ database: database.kind, version: config.version }, 'Épicadémie prêt');
}

main().catch((err: unknown) => {
  // Erreur de démarrage (configuration, base non migrée…) : message lisible, code d'erreur.
  console.error(err instanceof ConfigError ? err.message : err);
  process.exit(1);
});
