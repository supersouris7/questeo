# Observabilité

## Journaux

JSON sur la sortie standard (pino). Champs utiles : `level`, `time`, `requestId`, `req.method`,
`req.url`, `res.statusCode`, `responseTime`, `err`. Retrouver une requête signalée :
`docker compose logs epicademie | grep <requestId>`.

## Sondes

- `GET /api/health` → `{ status: "ok", version }` : le processus répond.
- `GET /api/ready` → idem si la base répond, sinon 503 `UNAVAILABLE`.

## Métriques (`GET /api/metrics`, format Prometheus)

| Métrique                                   | Sens                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| `epicademie_http_request_duration_seconds` | durée par `method`, `route`, `status`                          |
| `epicademie_online_players`                | joueurs connectés en temps réel                                |
| `epicademie_open_arenas`                   | arènes ouvertes                                                |
| `epicademie_open_rooms`                    | salles à code ouvertes                                         |
| `epicademie_room_code_failures_total`      | entrées en salle refusées (hausse : recherche de codes)        |
| `epicademie_finished_games_total{kind}`    | parties terminées (entraînement, boss)                         |
| `epicademie_errors_total{source}`          | erreurs signalées (serveur, navigateur, temps réel, processus) |
| `epicademie_rewards_total{currency}`       | pièces et rubis distribués en fin de partie                    |
| `epicademie_payments_total{status}`        | paiements clos (payée, échouée)                                |
| `process_*`, `nodejs_*`                    | mémoire, CPU, boucle d'événements                              |

Alertes conseillées : taux de 5xx > 1 % sur 5 min ; p95 de latence > 1 s ; `/api/ready` en
échec ; mémoire en hausse continue.

## Suivi d'erreurs

Par défaut, chaque erreur inattendue (serveur, temps réel, navigateur) est écrite dans les
journaux avec `report: true`. Pour un service externe : implémenter `ErrorReporter`
(`apps/server/src/core/observability/error-reporter.ts`) et le passer à `buildApp` dans
`main.ts`. Côté navigateur, les erreurs remontent par `POST /api/v1/telemetry/errors`.

## Console d'administration

Six rubriques (« Gestion du jeu ») : Vue d'ensemble, Signalements, Familles, Notions, Points faibles
et Technique (mode debug, erreurs, journal d'audit, anomalies). Chiffres et erreurs : voir
docs/adr/0022-pilotage.md ; accès par l'opérateur de la page de pilotage et comptes :
docs/adr/0033-administration-par-operateur.md ; rôles : 0036-roles-d-administration-oidc.md. Le journal des erreurs est en mémoire (il repart de
zéro au redémarrage) ; les journaux restent la référence. L'écran affiche un libellé français et
garde le message d'origine dans le détail.
