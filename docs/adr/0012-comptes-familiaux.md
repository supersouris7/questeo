# 0012 — Comptes familiaux, sessions par cookie, verrou parent

- Statut : Acceptée
- Date : 2026-11-20

## Contexte

Avant la vente aux familles, tout appareil qui atteignait le serveur listait, ouvrait, modifiait
et supprimait tous les profils. Il faut un compte par famille, l'isolation des données entre
familles, et empêcher qu'un enfant fasse seul les actions du parent sur l'appareil partagé.

## Décision

- **Famille** (`families`) : unité d'isolation. Un **compte parent** (`accounts`, e-mail +
  mot de passe), des **profils enfants** rattachés (`profiles.family_id`).
- **Mot de passe** : scrypt salé (Node, sans dépendance), 12 caractères minimum (ANSSI).
- **Session d'appareil** : jeton aléatoire de 256 bits dans un cookie `HttpOnly`, `SameSite=Lax`,
  `Secure` en production ; la base n'en garde que l'empreinte SHA-256. Session glissante de
  30 jours (`SESSION_DAYS`), prolongée au plus une fois par jour.
- **Niveaux d'accès dans le contrat** (`access` obligatoire sur chaque point d'accès) :
  `public`, `family`, `parent`, `admin`, vérifiés par `route()` avant le gestionnaire.
- **Isolation** : les routes qui désignent un profil, une partie ou un combat vérifient son
  appartenance (`modules/accounts/ownership.ts`) et répondent 404 sinon. Le temps réel
  n'accepte que les profils de la famille de la session et ne relie que des joueurs d'une même
  famille (présence, messages, arène).
- **Verrou parent** : saisir le mot de passe (connexion, inscription ou confirmation) déverrouille
  les actions parent 10 minutes sur cet appareil. Réservées au parent : créer ou supprimer un
  profil, changer le prénom, la date de naissance, la classe ou le genre. L'enfant garde ses
  réglages (son, héros).
- **Déconnexion de l'appareil** (complément du 27/11/2026) : réservée au parent. L'interface
  reverrouille puis redemande le code PIN (ou le mot de passe) à chaque fois ; le serveur répond 403
  à `POST /auth/logout` tant que l'Espace parent est fermé. Exceptions : élève autonome (aucun
  parent) et session absente ou expirée. Durcissement assumé de la v1 ([ADR 0004](0004-api-versionnee.md)) :
  une page restée sur l'ancienne version ne peut plus déconnecter sans ce verrou. Un portail placé
  devant la plateforme (`PORTAL_LOGOUT_URL`) est quitté à la suite.
- **Connexion par le portail** (recette seulement, `PORTAL_LOGIN`) : l'e-mail transmis par le proxy
  authentifiant ouvre le compte de même adresse, ou le crée sans mot de passe. Un tel compte, sans code PIN,
  se déconnecte sans verrou parent (aucun secret ne l'ouvrirait). Conditions :
  [recette](../operations/recette-internet.md).
- **Mot de passe oublié** : lien à usage unique (1 h) envoyé par l'interface `Mailer`. Aucun
  fournisseur d'e-mails n'est branché (décision humaine) : en production, l'envoi est journalisé
  sans contenu.
- **Administrateur** : _remplacé_ par l'« opérateur » de la page de pilotage, sans compte de jeu
  ([ADR 0033](0033-administration-par-operateur.md)).
- **Protection CSRF** : en plus de `SameSite`, toute modification dont l'en-tête `Origin` n'est
  pas le site (ou `CORS_ORIGINS`) est refusée.
- **Profils de la bêta** (sans famille) : conservés, invisibles de toutes les familles.

## Conséquences

- Une famille ne peut ni voir ni modifier les données d'une autre (testé route par route).
- Le jeu multijoueur se joue entre appareils d'une même famille (frères et sœurs, TV).
- Tant qu'aucun fournisseur d'e-mails n'est choisi, « mot de passe oublié » ne délivre pas
  réellement de lien en production : blocage noté dans `docs/implementation/SUIVI.md`.

## Options écartées

- **Code PIN parent séparé** : un secret de plus à retenir ; le mot de passe du compte suffit.
- **Jetons JWT** : révocation difficile (déconnexion, changement de mot de passe) ; les
  sessions en base se révoquent immédiatement.
- **Bibliothèque d'authentification** (Lucia, Auth.js…) : dépendance pour peu de code, et
  `@fastify/cookie` inutile pour un seul cookie.
- **Jeu entre familles** : exposerait les prénoms d'enfants à des inconnus ; à reconsidérer
  avec des codes d'ami explicites.
