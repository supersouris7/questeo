# Décisions d'architecture (ADR)

> **Renommage (novembre 2026)** : le produit, appelé « Academy Fighters » (nom de code « questeo ») au moment de ces
> décisions, s'appelle désormais **Épicadémie** (identifiant technique `epicademie`). Les ADR ont été mises à jour pour
> les noms de paquets et d'identifiants ; le sens des décisions n'a pas changé. Conservés volontairement : base,
> utilisateur et volume PostgreSQL `questeo`, cookie de session `af_session`.

Chaque décision structurante est consignée ici, avec son contexte, la décision, ses conséquences
et les options écartées. Une ADR acceptée ne se modifie pas : une nouvelle ADR la remplace
(statut « Remplacée par NNNN »).

| N°                                               | Décision                                                                                      | Statut              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------- |
| [0001](0001-monorepo-modulaire.md)               | Monorepo pnpm, paquets purs et applications par modules                                       | Acceptée            |
| [0002](0002-postgresql.md)                       | PostgreSQL, PGlite embarqué en développement et en tests                                      | Acceptée            |
| [0003](0003-migrations.md)                       | Migrations par une commande dédiée avant le démarrage                                         | Acceptée            |
| [0004](0004-api-versionnee.md)                   | Contrat d'API unique, versionné, validé et documenté                                          | Acceptée            |
| [0005](0005-observabilite.md)                    | Journaux structurés, sondes, métriques, suivi d'erreurs                                       | Acceptée            |
| [0006](0006-temps-reel.md)                       | Temps réel socket.io en mémoire d'une instance                                                | Acceptée            |
| [0007](0007-qualite.md)                          | Qualité vérifiée en CI : couverture, règles de modules                                        | Remplacée par 0010  |
| [0008](0008-front-par-fonctionnalites.md)        | Front organisé par fonctionnalités                                                            | Acceptée            |
| [0009](0009-etat-des-combats.md)                 | État des combats stocké versionné et validé                                                   | Acceptée            |
| [0010](0010-qualite-renforcee.md)                | Qualité en CI : couverture complète, complexité, code mort                                    | Acceptée            |
| [0011](0011-chaine-d-approvisionnement.md)       | Chaîne d'approvisionnement : épinglage, mises à jour, analyse                                 | Acceptée            |
| [0012](0012-comptes-familiaux.md)                | Comptes familiaux, sessions par cookie, verrou parent                                         | Acceptée            |
| [0013](0013-suivi-des-apprentissages.md)         | Suivi des apprentissages : réponses détaillées, maîtrise sans aide, données minimales         | Acceptée            |
| [0014](0014-fiabilite-pedagogique.md)            | Fiabilité pédagogique : validation automatique, signalements, désactivation                   | Acceptée            |
| [0015](0015-economie-sure.md)                    | Économie sûre : gains calculés par le serveur, opérations atomiques et idempotentes           | Acceptée            |
| [0016](0016-multijoueur-fiable.md)               | Multijoueur fiable : reconnexion, changement d'appareil, expiration                           | Acceptée            |
| [0017](0017-moteur-adaptatif.md)                 | Moteur adaptatif et révisions espacées, déterministes et sans IA                              | Acceptée            |
| [0018](0018-badges.md)                           | Badges calculés à partir des événements, conditions centralisées                              | Acceptée            |
| [0019](0019-economie.md)                         | Équilibrage de l'économie : paramètres réunis, simulation, Acad-Héros en coffres              | Acceptée            |
| [0020](0020-abonnement.md)                       | Version gratuite, abonnement familial annuel, Stripe et simulateur                            | Acceptée            |
| [0021](0021-qg-et-cosmetiques.md)                | QG, salle des trophées et cosmétiques                                                         | Abandonnée          |
| [0022](0022-pilotage.md)                         | Pilotage : statistiques agrégées, anomalies de récompenses, erreurs récentes                  | Acceptée            |
| [0023](0023-raid-et-tv.md)                       | Raid (retiré) et mode TV                                                                      | Acceptée            |
| [0024](0024-contenus-hors-maths.md)              | Contenus hors maths et parcours Adulte                                                        | Acceptée (en cours) |
| [0025](0025-vocabulaire-et-schemas.md)           | Vocabulaire expliqué et schémas dans les explications                                         | Acceptée            |
| [0026](0026-eleve-autonome.md)                   | Élève de moins de 15 ans : compte autonome sans donnée personnelle                            | Acceptée            |
| [0027](0027-signalements-et-export.md)           | Signalements généraux, erreurs agrégées, anonymisation et export                              | Acceptée            |
| [0028](0028-recommandation-parent.md)            | Recommandation de travail d'un parent à son enfant (une notion + un mot)                      | Remplacée (#94)     |
| [0029](0029-epreuve-du-chapitre.md)              | Épreuve du chapitre : validation à 80 %, coffre « chapitre » et trophée (récompense unique)   | Acceptée            |
| [0030](0030-arene-evaluation.md)                 | Arène d'évaluation : compétence = chapitre, moteur déterministe, bilans figés                 | Proposée            |
| [0031](0031-matiere-sciences.md)                 | Matière unique « Sciences » : trois domaines, libellé selon la classe                         | Acceptée            |
| [0032](0032-ouverture-de-compte-email-google.md) | Ouverture de compte : e-mail validé par lien ou Google                                        | Proposée            |
| [0034](0034-contenus-toutes-matieres.md)         | Contenus de toutes les matières : 5 niveaux, nouveaux types de questions, sources, relectures | Acceptée            |
| [0035](0035-chargement-a-la-demande.md)          | Écrans et contenus chargés à la demande                                                       | Acceptée            |
| [0036](0036-roles-d-administration-oidc.md)      | Rôles d'administration et connexion de l'équipe (OpenID Connect)                              | Acceptée            |
| [0037](0037-aide-sans-penalite.md)               | Aide sans pénalité, médaille de diamant, aucune comparaison entre enfants                     | Acceptée            |
| [0038](0038-progres-personnel-et-sens.md)        | Progrès personnel, sens des matières, ressenti de fin de séance                               | Acceptée            |
| [0039](0039-espace-parent-effort.md)             | Espace parent : la semaine d’abord, ressenti agrégé, conseil par règles                       | Acceptée            |
| [0040](0040-duel-et-quiz-tv.md)                  | Duel à distance et Quiz TV : salles temps réel, invités sans compte                           | Proposée            |

## Modèle

```markdown
# NNNN — Titre

- Statut : Proposée | Acceptée | Remplacée par NNNN
- Date : AAAA-MM-JJ

## Contexte

## Décision

## Conséquences

## Options écartées
```
