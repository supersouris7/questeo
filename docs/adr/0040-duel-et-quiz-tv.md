# 0040 — Duel à distance et Quiz TV : salles temps réel, invités sans compte

- Statut : Proposée
- Date : 2026-11-27
- Complète [0006](0006-temps-reel.md), [0016](0016-multijoueur-fiable.md), [0023](0023-raid-et-tv.md) ; respecte [0013](0013-suivi-des-apprentissages.md)

## Contexte

Deux modes s'ajoutent à l'arène tour par tour :

- **Duel à distance** : deux joueurs inscrits et liés (famille ou amis validés par les parents),
  chacun sur son appareil, répondent en même temps ; une bonne réponse tire sur l'adversaire.
- **Quiz TV** : un écran partagé ouvert par une famille inscrite affiche un QR code et un code de
  salle ; des téléphones servent de manettes, y compris pour des **invités sans compte**.

Contraintes : chacun reçoit des questions **de sa classe** ; reconnexion de 30 s ; aucune
discussion libre ; aucune donnée d'invité conservée ; une seule instance serveur (ADR 0006).

## Décision

### Socle commun

- **Temps réel** : le socket.io existant (`modules/realtime`). Deux orchestrateurs en mémoire,
  sur le modèle de `arena.ts` : `duel.ts` et `quiz.ts`, et un registre de salles `rooms.ts`
  (codes, invités, expiration). Règles pures et déterministes dans `@epicademie/engine`
  (`shootout.ts` pour le Duel, `quiz.ts` pour le Quiz), testées sans minuteur ni réseau.
- **État côté serveur uniquement** : questions tirées (graine), corrections (`check`), vies,
  boucliers, points et minuteurs sont calculés par le serveur ; le client n'envoie que sa réponse.
  Le temps de réponse est mesuré par le serveur (émission de la question → réception), jamais
  fourni par le client.
- **Contrat** : types et schémas Zod dans `@epicademie/shared` (`duel.ts`, `party.ts`) ; chaque
  message entrant est validé et limité en débit (`tokenBucket`), comme aujourd'hui. Aucun
  événement de discussion n'est ouvert dans ces modes ; les invités n'ont accès à aucun
  gestionnaire existant (`chat`, `arena:*`).
- **Équité « questions de sa classe »** : l'hôte choisit une **matière** (parmi celles proposées à
  toutes les classes présentes). Chaque joueur tire dans les chapitres de cette matière à
  `playedGrade(sa classe)`, limités aux chapitres que la **famille qui paie** peut jouer
  (`canPlayChapter`) : sa propre famille pour un joueur inscrit, la famille hôte pour un invité.
  Le chapitre gratuit garantit une réserve non vide. Fonction pure partagée par les deux modes
  (`classPool(subject, grade, allowed)` puis tirage par graine). Pas de handicap d'âge (`duelHandicaps`)
  dans ces modes : la classe suffit.
- **Reconnexion (ADR 0016)** : `MATCH_GRACE_MS = 30 000`. Le joueur garde sa place, marqué
  « Déconnecté… » ; le temps continue de s'écouler (aucun avantage à couper le réseau). Au-delà :
  Duel = fin propre ; Quiz = la place est libérée, le score reste affiché jusqu'à la fin.
  (Constat : `ARENA_GRACE_MS` de l'arène vaut 60 s, écart à l'ADR 0016 hors de ce périmètre.)
- **Aucune récompense ni maîtrise enregistrée** : ni pièces, ni XP, ni réponse comptée dans le
  suivi (ADR 0013, ADR 0016). Bilans et scores n'existent qu'en mémoire, pour la session.
- **Plusieurs instances** : non gérées, comme l'arène (ADR 0006) ; un redémarrage ferme les parties.

### Duel à distance

- Défi uniquement vers un joueur **lié** (`presence.linked` : famille, ou ami accepté avec accord
  parental), en ligne et libre ; invitation, acceptation, refus, comme l'arène. Pas de code de salle.
- Questions **simultanées et indépendantes** : chaque joueur a sa file, une question chassant
  l'autre. Bonne réponse : tir immédiat (plus rapide = plus de tirs). Mauvaise réponse ou temps
  écoulé : tir dévié, sans perte de vie. 3 bonnes réponses d'affilée : un **bouclier** (un seul à
  la fois) qui bloque le tir suivant reçu.
- 5 vies par manche, manche de 150 s, 2 manches gagnantes. Fin de manche : plus de vies, puis plus
  de tirs réussis ; égalité parfaite : la manche compte pour les deux. Paramètres dans le moteur.
- Fin : bilan personnel (tirs réussis, boucliers, bonnes réponses), libellés « pas encore » ;
  « Revanche ? » valable 60 s, nouvelle partie si les deux acceptent. Départ volontaire ou
  reconnexion manquée : fin propre, sans vainqueur, bilan affiché au joueur restant.

### Quiz TV

- **Hôte** : l'écran `/tv` (session de la famille, sans profil, ADR 0023) ouvre la salle, choisit
  matière et variante (chacun pour soi, ou deux équipes), retire un joueur, lance, relance, ferme.
  L'écran TV accepte désormais les seuls messages `quiz:*` d'hôte ; il ne joue jamais.
- **Code de salle** : 4 lettres tirées par `crypto.randomInt` dans un alphabet de 19 consonnes
  (sans voyelles : aucun mot formé ; sans I, L, O ni Y : pas de confusion), soit 130 321
  combinaisons, unique parmi les salles ouvertes. Le QR code encode `/rejoindre#CODE` (le
  fragment n'arrive ni au serveur ni dans les journaux d'accès) ; il est généré dans le
  navigateur de l'hôte, sans service extérieur, avec une bibliothèque sans dépendance (ADR 0011).
- **Limitation des tentatives** : par adresse IP (en-têtes du proxy lus avec le même nombre de
  sauts de confiance que `TRUST_PROXY`), 10 codes faux par 10 minutes, puis refus pendant 10
  minutes ; compteur global des échecs exposé en métrique (alerte). Salle **verrouillée** au
  lancement (plus personne n'entre) ; 8 manettes au plus ; l'hôte voit chaque arrivée et peut
  retirer un joueur. **Configuration** : `TRUST_PROXY` = nombre exact de proxys devant le serveur
  (nginx seul : `1`). À `0` derrière un proxy, tous les clients partagent l'adresse du proxy :
  10 faux codes bloquent toutes les entrées en salle 10 min. Trop haut, l'adresse vient d'un
  en-tête fourni par le client et la limite se contourne.
- **Expiration** : salle jamais lancée fermée à 10 min (`LOBBY_TTL_MS`) ; salle inactive fermée à
  15 min ; durée totale bornée à 2 h ; hôte déconnecté plus de 30 s : salle fermée pour tous.
- **Invités** : connexion socket.io sans cookie, `auth: { guest: { code, token? } }`. Le serveur
  crée une place et renvoie un **jeton de place** aléatoire (32 octets), gardé par le téléphone en
  `sessionStorage` pour la reconnexion ; ni cookie, ni `localStorage`, ni compte. Pseudo **proposé
  par le serveur** dans des listes fixes (« Renard bleu »), unique dans la salle, changeable par
  tirage, jamais saisi ; avatar dans une liste fixe ; classe parmi `GRADES` ; équipe le cas échéant.
- **Minimisation** : rien n'est écrit en base. En mémoire : place, pseudo, avatar, classe, équipe,
  score, jeton. Adresse IP : seulement dans le compteur de tentatives, effacée à l'expiration de
  la fenêtre, jamais journalisée ; les journaux n'emploient ni pseudo, ni code, ni IP. Fin de
  session (fermeture, expiration, hôte parti) : salle, places et jetons effacés, manettes
  déconnectées, `sessionStorage` vidé par le client. Les métriques ne sont que des compteurs.
- **Ce que voit chacun** : l'écran TV reçoit la vue complète (question en cours, temps, avatars,
  scores de la partie). Une manette ne reçoit que **sa** place, **sa** question et **son** résultat :
  un intrus ne verrait ni noms ni scores des autres. Un enfant inscrit rejoint avec son profil
  (même code, même limitation) ; son nom n'apparaît que sur la TV.
- **Partie** : 10 questions, même minuteur pour tous, chacun la sienne (sa classe). Points : bonne
  réponse + bonus de rapidité mesuré par le serveur ; en équipes, score d'équipe = moyenne des
  membres (équipes de tailles différentes). Fin : scores de la partie et mises en valeur pour tous
  (plus rapide, meilleure série, plus de diamants — points de la partie, rien n'est crédité).
  Aucun classement conservé.
- **Sollicitation** : le lien « Créer un compte » n'existe que sur l'écran de l'hôte ; le code des
  manettes n'en contient aucun (test).

## Conséquences

- Nouveaux fichiers : `packages/shared/src/{duel,party}.ts`, `packages/engine/src/{shootout,quiz}.ts`,
  `apps/server/src/modules/realtime/{rooms,duel,quiz,class-pool}.ts`, `apps/web/src/features/{duel,quiz}`,
  page `/rejoindre` chargée à la demande (ADR 0035), accessible sans session.
- `RealtimeAuthSchema` gagne la variante invité ; l'intergiciel d'authentification ne l'accepte
  qu'avec un code de salle ouverte et non verrouillée (ou un jeton de place valide).
- Métriques : salles ouvertes, duels ouverts, échecs de code.
- Les manettes régénèrent la question à partir de la graine (comme l'arène) : elles chargent les
  contenus et un joueur outillé pourrait calculer la réponse. Accepté : aucun enjeu (ni récompense
  ni classement). À revoir si un enjeu apparaît (envoi d'une question rendue, sans corrigé).
- Coût estimé : environ 3,5 jours (5 lots), plus sécurité et recette.

## Options écartées

- **Comptes temporaires ou invités en base** : donnée d'enfant persistée pour une partie de salon.
- **Code plus long ou alphanumérique** : moins lisible sur une TV et à saisir par un enfant ; la
  limitation, le verrouillage et le contrôle de l'hôte suffisent pour un enjeu faible.
- **Pseudo libre** : risque de vrai prénom ou de texte inapproprié, sans modération possible.
- **Service tiers de QR code ou de salles temps réel** : envoi de données à l'extérieur.
- **Adaptateur Redis dès maintenant** : une seule instance ; coût sans bénéfice actuel.
- **Réutiliser l'arène tour par tour** : ni réponses simultanées ni questions par joueur ; la
  greffe compliquerait `arena.ts` plus qu'un orchestrateur dédié de même forme.
