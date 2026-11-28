import type { FastifyInstance } from 'fastify';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from '@prometheus-io/client';

/**
 * Métriques Prometheus exposées sur /api/metrics : requêtes HTTP (nombre, durée, statut par
 * route), métriques du processus Node (mémoire, boucle d'événements) et jauges métier (joueurs
 * connectés, arènes et salles ouvertes). Un registre par application (pas de registre global : plusieurs
 * applications peuvent coexister dans les tests).
 */
export interface Metrics {
  readonly registry: Registry;
  readonly onlinePlayers: Gauge;
  readonly openArenas: Gauge;
  readonly openRooms: Gauge;
  /** Codes de salle refusés (alerte : recherche de codes). */
  readonly roomCodeFailures: Counter;
  readonly finishedGames: Counter<'kind'>;
  readonly realtimeDisconnects: Counter;
  /** Erreurs signalées, par source (serveur, navigateur, temps réel, processus). */
  readonly errors: Counter<'source'>;
  /** Pièces et rubis distribués (économie : détecter une dérive). */
  readonly rewards: Counter<'currency'>;
  /** Paiements clos, par issue. */
  readonly payments: Counter<'status'>;
}

export function createMetrics(): Metrics {
  const registry = new Registry();
  registry.setDefaultLabels({ app: 'epicademie' });
  collectDefaultMetrics({ register: registry });
  return {
    registry,
    onlinePlayers: new Gauge({
      name: 'epicademie_online_players',
      help: 'Joueurs connectés en temps réel',
      registers: [registry],
    }),
    openArenas: new Gauge({
      name: 'epicademie_open_arenas',
      help: 'Arènes ouvertes (salon ou partie)',
      registers: [registry],
    }),
    openRooms: new Gauge({
      name: 'epicademie_open_rooms',
      help: 'Salles à code ouvertes',
      registers: [registry],
    }),
    roomCodeFailures: new Counter({
      name: 'epicademie_room_code_failures_total',
      help: 'Entrées en salle refusées (code faux, salle fermée, jeton périmé)',
      registers: [registry],
    }),
    realtimeDisconnects: new Counter({
      name: 'epicademie_realtime_disconnects_total',
      help: 'Déconnexions temps réel (réseau, veille, départ)',
      registers: [registry],
    }),
    errors: new Counter({
      name: 'epicademie_errors_total',
      help: 'Erreurs signalées',
      labelNames: ['source'],
      registers: [registry],
    }),
    rewards: new Counter({
      name: 'epicademie_rewards_total',
      help: 'Monnaie distribuée en fin de partie',
      labelNames: ['currency'],
      registers: [registry],
    }),
    payments: new Counter({
      name: 'epicademie_payments_total',
      help: 'Paiements clos',
      labelNames: ['status'],
      registers: [registry],
    }),
    finishedGames: new Counter({
      name: 'epicademie_finished_games_total',
      help: 'Parties terminées',
      labelNames: ['kind'],
      registers: [registry],
    }),
  };
}

/** Mesure chaque requête HTTP (route paramétrée, jamais l'URL brute : pas d'identifiants). */
export function instrumentHttp(app: FastifyInstance, metrics: Metrics): void {
  const duration = new Histogram({
    name: 'epicademie_http_request_duration_seconds',
    help: 'Durée des requêtes HTTP',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [metrics.registry],
  });
  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url ?? 'inconnue';
    duration.observe({ method: request.method, route, status: String(reply.statusCode) }, reply.elapsedTime / 1000);
  });
}
