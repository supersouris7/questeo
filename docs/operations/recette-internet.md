# Recette sur Internet (serveur « atelier »)

Une instance de recette, réservée à quelques testeurs, joignable en HTTPS à l'adresse
`https://<IP de l'atelier>`. **Données fictives uniquement** (prénoms inventés). Ce n'est pas la production.

**Mode plateforme de test** (`APP_ENV=recette`, `PASSWORD_MIN_LENGTH=8` dans le `.env`) : on arrive sur
« Se connecter » avec un bouton « Créer un compte » ; l'inscription (e-mail + mot de passe d'au moins 8 caractères)
ouvre un compte actif, connecté aussitôt. **Aucun e-mail** n'est envoyé ni simulé : pas de lien, pas de boîte mail
de test. « Mot de passe oublié » affiche la consigne de demander un nouveau mot de passe à l'administrateur (qui
le réinitialise en base). Le parcours élève autonome est masqué. Adresse déjà utilisée : message clair.

## Architecture

```
Internet ──443/80──▶ Caddy (service système)  ──127.0.0.1:3000──▶ epicademie (conteneur)
                     · TLS Let's Encrypt (adresse IP,           └─▶ postgres (réseau interne, jamais publié)
                       profil « shortlived », renouvelé seul)
                     · porte d'accès SSO, `forward_auth` (tout le site, /api, temps réel)
                             └─127.0.0.1──▶ portail d'authentification unique (Authelia)
                     · en-têtes de sécurité, journal JSON
```

- **Isolement** : la pile tourne sous l'utilisateur système `recette` (sans sudo, sans mot de passe),
  avec **Docker sans privilèges** (rootless, service utilisateur, `linger`). Aucun accès au Docker
  root ni au répertoire de l'utilisateur d'exploitation de la machine ; le conteneur serveur est en
  lecture seule, sans capacité Linux, `no-new-privileges`.
- **Fichiers** : `~recette/stack/` — `compose.yml` (copie de celui du dépôt, rafraîchie à chaque
  déploiement), `compose.override.yml` (écoute `127.0.0.1:3000` seulement, durcissement),
  `.env` (mode 600 : secrets aléatoires, `APP_ENV=recette`, `TRUST_PROXY=1`, `COOKIE_SECURE=true`,
  `PUBLIC_URL`), `~recette/backups/` (14 dernières sauvegardes de la base).
- **Pare-feu** (ufw) : entrée refusée par défaut ; 22/tcp, 80/tcp, 443/tcp et 443/udp (HTTP/3).
- **fail2ban** : jail `sshd` et jail `authelia` (10 échecs de mot de passe ou de second facteur en 10 min →
  bannissement 1 h, doublé à chaque récidive, plafond 1 semaine). La jail `caddy-auth` (journal
  `/var/log/caddy/access.log`) ne concerne que les portes à identifiant HTTP, dont l'accès de secours.
- **Mises à jour de sécurité** : `unattended-upgrades`, sans redémarrage automatique.
- **Limites applicatives** : `RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_MAX` ; avec `TRUST_PROXY=1`,
  l'application lit l'adresse réelle du visiteur dans l'en-tête posé par Caddy.
- **Alertes** (Gotify) : bannissement (au plus une alerte par heure) et application muette
  (contrôle toutes les 5 min, alerte à la 2ᵉ vérification en échec, puis message « rétablie »).

## Porte d'accès SSO

Tout le site passe par le portail d'authentification unique : Caddy interroge Authelia (`forward_auth`) avant
de transmettre une requête à l'application. La porte est un extrait importé par le site de la recette
(`import /etc/caddy/acces-recette.conf`) ; seuls les groupes autorisés par la politique du portail la
franchissent (testeurs : un facteur ; équipe : deux). Installation, politique et comptes : documentation du
portail, tenue hors de ce dépôt.

## Connexion directe par le portail (facultatif)

La personne authentifiée par la porte SSO entre directement dans son compte famille, sans second écran de
connexion. Réglages du `.env` de la pile (mode 600, jamais versionné) :

```
PORTAL_LOGIN=true
PORTAL_PROXY_SECRET=<secret aléatoire d'au moins 32 caractères : openssl rand -hex 32>
PORTAL_LOGOUT_URL=https://<portail>/logout
```

avec `APP_ENV=recette` et `TRUST_PROXY=1` ; sans eux ou sans le secret, le serveur refuse de démarrer.

Caddy ajoute le même secret à chaque requête transmise (la valeur envoyée par un client est remplacée) :

```
reverse_proxy 127.0.0.1:3000 {
	header_up X-Portal-Secret {env.PORTAL_PROXY_SECRET}
	# … en-têtes retirés existants
}
```

La variable est fournie au service Caddy par un fichier non versionné, lisible par `root` seul (complément
systemd `EnvironmentFile=/etc/caddy/portail.env`, contenant la ligne `PORTAL_PROXY_SECRET=…`), puis
`systemctl restart caddy` (un rechargement ne relit pas l'environnement). La valeur ne figure ni dans le
`Caddyfile`, ni dans sa copie de référence, ni dans un ticket.

L'application croit l'en-tête `Remote-Email` ; avant d'activer le réglage, vérifier :

- le proxy contrôle l'accès à **toutes** les routes et recopie `Remote-Email` depuis la réponse du portail
  (`copy_headers Remote-User Remote-Groups Remote-Email Remote-Name`), ce qui écrase la valeur envoyée par
  le client (un en-tête listé mais absent de la réponse du portail est retiré de la requête). Ne pas ajouter
  `request_header -Remote-*` : Caddy l'exécute **après** `forward_auth`, quel que soit l'ordre d'écriture, ce qui
  effacerait l'identité et casserait la connexion par le portail ;
- le port de l'application n'écoute que sur la machine (`compose.override.yml`) : le fichier `compose.yml`
  du dépôt, seul, le publie sur toutes les interfaces ;
- aucun autre site du proxy ne transmet `/api/v1/auth/portail` à l'application avec le secret.

Le serveur répond 404 si le secret manque ou diffère (comparaison à temps constant) ou si la connexion vient
d'une adresse publique : un autre processus de la machine ne peut pas forger l'identité. En accès de secours
(porte à identifiant unique), aucun `Remote-Email` n'est posé : on se connecte avec e-mail et mot de passe.

Comptes :

- **sans compte à cette adresse** : il est créé sans mot de passe ; le parent choisit son code à 4 chiffres,
  puis crée le profil. Ce code ouvre l'Espace parent et est exigé pour se déconnecter ; repasser par le
  portail ne le remplace pas ;
- **compte existant à l'adresse vérifiée** : il est relié (mot de passe et code conservés), Espace parent
  fermé. L'inscription de recette marque les adresses vérifiées sans les contrôler : la personne qui a créé ce
  compte garde son accès ;
- **compte existant à l'adresse non vérifiée** : rien n'est relié, l'écran de connexion demande le mot de passe ;
- **code oublié** (compte sans mot de passe) : l'administrateur l'efface
  (`UPDATE accounts SET parent_pin_hash = NULL, pin_failures = 0, pin_locked_until = NULL WHERE email = '…';`),
  puis la personne se déconnecte du portail, s'y reconnecte et en choisit un autre.

## Déployer

Depuis l'atelier, après chaque fusion sur `main` (une fois l'image `unstable` publiée) :

```bash
~/.claude/fabrique/scripts/deployer-atelier.sh            # sauvegarde, migration, redémarrage, contrôle
~/.claude/fabrique/scripts/deployer-atelier.sh --version  # image et révision en service
```

Le script mémorise l'empreinte de l'image précédente, sauvegarde la base, rejoue la migration puis
vérifie `/api/ready`.

## Retour arrière

```bash
~/.claude/fabrique/scripts/deployer-atelier.sh --retour   # revient à l'image précédente
```

Ne restaure **pas** la base. Si une migration doit être défaite : arrêter la pile, restaurer la
sauvegarde la plus récente de `~recette/backups/` (`pg_restore --clean`), puis `--retour`.

## Ajouter / retirer un testeur

Un testeur est un compte du portail, dans le groupe réservé à la recette. Script de la fabrique (sur
l'atelier) : `sso-compte.sh ajouter <identifiant> recette-testeurs [nom]` (mot de passe affiché une seule fois),
`sso-compte.sh desactiver <identifiant>` ou `retirer <identifiant>` (plus d'accès par la porte),
`sso-compte.sh lister`. Retirer un compte du portail ne supprime pas le compte famille de l'application ni sa
session d'appareil, inutilisable tant que la porte reste fermée.

Portail en panne : `secours-sso.sh activer recette` remplace temporairement la porte par un identifiant unique
(24 h au plus), `secours-sso.sh desactiver` la rétablit.

Les accès sont transmis par un canal privé, jamais par ticket ou PR.

## En cas d'alerte

- **« ne répond plus »** : `systemctl status caddy` ; `sudo -u recette docker compose -f ~recette/stack/compose.yml ps`
  (avec `DOCKER_HOST=unix:///run/user/<uid de recette>/docker.sock`) ; journaux : `docker compose logs --tail 50 epicademie`.
  Application bloquée : `deployer-atelier.sh` (redéploie) ou `--retour`. Certificat : `journalctl -u caddy | grep -i acme`
  (le certificat d'adresse IP dure une semaine et se renouvelle seul ; les ports 80/443 doivent rester ouverts).
- **« bannissement »** : `sudo fail2ban-client status authelia` ; lever un bannissement :
  `sudo fail2ban-client set authelia unbanip <ip>`. Un testeur banni a probablement un mauvais mot de passe.
  Plusieurs bannissements en continu = tentative de force brute : rien à faire, les mots de passe sont forts.
- **Compromission supposée** : `sudo systemctl stop caddy` (coupe l'accès), changer tous les mots de passe,
  recréer la pile (`docker compose down -v` sous `recette` détruit les données fictives).

## Repli si le certificat d'adresse IP n'est plus délivré

Utiliser un nom basé sur l'adresse (`<IP-avec-tirets>.sslip.io`) : remplacer l'adresse en tête du
`Caddyfile` par ce nom (certificat ordinaire), rediriger l'adresse nue vers ce nom, et mettre
`PUBLIC_URL` à jour dans `.env`.

## Contrôles de sécurité (audit du 23/11/2026)

Audit antérieur à la porte SSO : la « porte d'accès » vérifiée alors était l'identifiant HTTP.

Vérifié : ports exposés (22, 80, 443/tcp, 443/udp seulement ; 2019 et 3000 en local), TLS 1.2/1.3,
certificat d'adresse IP valide (renouvellement seul), porte d'accès sur toutes les routes (chemins
encodés, `//`, `..`, méthodes inhabituelles), limites de débit avec adresse réelle (en-tête
`X-Forwarded-For` du client ignoré), conteneur applicatif sans privilège, Docker sans privilèges
sans accès à l'hôte, `/home/ubuntu` illisible pour `caddy` et `recette`.

Points connus, acceptés (risque faible) :

- une requête dont l'en-tête `Host` n'est pas l'adresse du site reçoit un `200` vide de Caddy
  (aucune transmission à l'application) ;
- la redirection automatique 80→443 renvoie `Server: Caddy` (sans version) ;
- le fail2ban ignore l'adresse de l'atelier lui-même : un test de bannissement doit venir d'ailleurs
  (le filtre se vérifie avec `fail2ban-regex /var/log/caddy/access.log caddy-auth`).
