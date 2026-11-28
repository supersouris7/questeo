# Web (`apps/web`)

React 19, Vite, Tailwind 4, motion (animations), React Query (données serveur), zustand
(état global minimal), socket.io-client (temps réel). Organisation par fonctionnalités :
[ADR 0008](../adr/0008-front-par-fonctionnalites.md).

## Fonctionnalités (`src/features/`)

| Dossier    | Écrans et rôle                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `account`  | compte familial : connexion, inscription, mot de passe oublié, verrou parent                                                                                   |
| `parent`   | espace parent : progrès de chaque enfant (efforts de la semaine et conseil, ressenti agrégé, synthèse, cartes matière, « Notions à renforcer »), lecture seule |
| `admin`    | console d'administration pédagogique (signalements, notions)                                                                                                   |
| `profiles` | choix et création de profil, héros ; profil choisi (`session.ts`)                                                                                              |
| `hub`      | menu principal, choix du mode et de la matière, modes multijoueur                                                                                              |
| `training` | chapitres, notions, partie d'entraînement et bilan                                                                                                             |
| `boss`     | chapitres de boss, combat, Empereur du Savoir, boutique                                                                                                        |
| `arena`    | arène multijoueur (salon, tour par tour)                                                                                                                       |
| `realtime` | connexion temps réel, joueurs connectés, notifications, messages                                                                                               |
| `progress` | progression par notion, médailles, reliques                                                                                                                    |
| `settings` | paramètres, à propos, crédits                                                                                                                                  |

## Chargement à la demande

[ADR 0035](../adr/0035-chargement-a-la-demande.md). Deux pages (entrées Vite) : le jeu (`index.html`,
`main.tsx`, `index.css`) et la console `/admin` (`admin.html`, `admin-main.tsx`, `admin.css`), sans
code ni style commun hors socle `shared/`. Dans le jeu (`app/GameApp.tsx`), chaque écran est déclaré par `lazyScreen` (`app/lazyScreen.tsx`) avec sa
silhouette d'attente. Pour ajouter un écran : le déclarer ainsi, l'inscrire dans `PRELOAD`, et ne pas importer les contenus pédagogiques
depuis ce qui est chargé à l'entrée (`catalog.ts` pèse plusieurs mégaoctets). Les tailles sont
contrôlées par `e2e/chargement.spec.ts`.

## Fluidité

- **Code** : une fois la session vérifiée, `app/Warmup.tsx` télécharge en arrière-plan le code des écrans
  de `PRELOAD` (voisins de l'accueil d'abord). Un écran préchargé s'affiche sans attente.
- **Données** : le cache React Query est gardé tant que la page est ouverte (`gcTime` infini). Une donnée
  connue s'affiche tout de suite et se rafraîchit en arrière-plan. Fraîcheur : 30 s par défaut,
  `LONG_FRESH_MS` pour les profils et les notions en maintenance — toute action qui les change doit
  invalider la clé. Les menus du joueur sont demandés d'avance (`Warmup`), et au survol ou à l'appui
  (`shared/lib/intent.ts`).
- **Purge** (`features/account/sessionCache.ts`) : déconnexion, réponse 401 et changement de famille
  retirent les données et le profil choisi ; les autres onglets sont avertis par un événement
  `storage`. Les données du parent (`meta.parentOnly`) partent au verrouillage ; l'abonnement et les
  amis de la famille ne restent qu'une minute après leur dernier affichage (`PARENT_GC_MS`).
- **Attente** : jamais de message « Chargement » ; `shared/ui/Skeleton.tsx` pour une donnée jamais reçue.
- **Mesure** : `e2e/fluidite.spec.ts` (tablette, 50 ms de latence, moins de 300 ms par parcours).

## Socle (`src/shared/`, `src/design/`)

- `shared/api/client.ts` : `request(api.xxx, { params, body })`, typé par le contrat ;
  `ApiError` (statut, `code` stable, message affichable, `requestId`).
- `shared/ui/` : composants d'interface (GameButton, Bubble, PageShell, ProgressBar, Questy…).
- `shared/question/` : tout ce qui sert à afficher une question et saisir une réponse
  (figures, pavé numérique, clavier, calculatrice, brouillon, tableau de conversion).
- `shared/battle/` : mise en scène des combats (arène, barre de vie, répliques), partagée par le
  combat de boss, l'arène et l'entraînement.
- `shared/lib/` : stockage sûr, sons, dates, sortie de partie (`gameExit`), dialogues,
  minuteurs.
- `design/` : jetons CSS, palette, catalogue des images (`assets.ts`) — voir
  [DESIGN-SYSTEM](../DESIGN-SYSTEM.md).

## Écrans de jeu : état, déroulé, affichage

Un écran à mise en scène (combat de boss, entraînement) se découpe en trois couches
([ADR 0010](../adr/0010-qualite-renforcee.md)) :

| Fichier                                                | Rôle                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `state.ts`                                             | état de l'écran + **réducteur pur** : qui réagit, quelle pose, quelle scène |
| `useBattle.ts`, `useTraining.ts`                       | le **déroulé** : appels au serveur, sons, minuteurs ; envoie des événements |
| `BossPlay.tsx`, `TrainingPlay.tsx` (+ sous-composants) | l'**affichage** seulement                                                   |

Les répliques tirées au hasard sont injectées dans le réducteur (`createBattleReducer(voices)`) :
les tests fixent le texte. Les événements sont nommés au passé (`shot`, `shotLanded`,
`advanced`…) : ils décrivent ce qui s'est passé, le réducteur décide de l'effet.

## Tests

- **Logique** (`*.test.ts`) : réducteurs, fonctions pures, magasins.
- **Écrans** (`*.test.tsx`) : l'application complète (`testing/renderApp.tsx`) sur un
  **faux serveur** (`testing/fakeApi.ts`) construit sur le contrat d'API — chaque réponse est
  validée par son schéma, la correction et les combats suivent les vraies règles. Le temps réel
  passe par une fausse connexion (`testing/fakeSocket.ts`), les mises en scène longues par des
  minuteurs simulés (`renderApp(path, { fakeTimers: true })`).
- **Bout en bout** (`e2e/`, Playwright) : vrai serveur, vrai navigateur, tablette et smartphone.

## Règles

- Les écrans orchestrent ; la logique réutilisable va dans des hooks ou des fonctions pures
  testées (`*.test.ts`).
- Toute donnée serveur passe par React Query (clé de cache exportée par l'`api.ts` de la
  fonctionnalité, invalidée après une mutation).
- Erreurs : une barrière d'erreur (`app/ErrorBoundary.tsx`) affiche un écran de secours au lieu
  d'une page blanche et remonte l'erreur au serveur (`shared/lib/telemetry.ts`).
- Accessibilité : rôles et libellés ARIA (les tests de bout en bout s'en servent), animations
  réduites si le système le demande (`MotionConfig reducedMotion="user"`).
