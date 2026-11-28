import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import type { Profile } from '@epicademie/shared';
import { ApiError } from '../shared/api/client.ts';
import { useSession } from '../shared/lib/session.ts';
import { GameButton } from '../shared/ui/game/GameButton.tsx';
import { Questy } from '../shared/ui/mascot/Questy.tsx';
import {
  ForgotPasswordScreen,
  HiddenInRecette,
  LoginScreen,
  ParentGateProvider,
  PortalSignIn,
  RequireAccount,
  ResetPasswordScreen,
  SignupScreen,
  VerifyEmailScreen,
  StudentAgeScreen,
  StudentRecoverScreen,
  StudentSignupScreen,
  WelcomeScreen,
  useSessionSync,
} from '../features/account/index.ts';
import { useProfile } from '../features/profiles/index.ts';
import { Notifications, RealtimeLink } from '../features/realtime/index.ts';
import { Term } from '../shared/question/Term.tsx';
import { NoDefinitions } from '../shared/question/TermLocked.tsx';
import { TermContext } from '../shared/question/termContext.ts';
import { DebugFlag } from '../shared/question/DebugFlag.tsx';
import { ScreenSkeleton } from '../shared/ui/Skeleton.tsx';
import { lazyScreen } from './lazyScreen.tsx';
import { Warmup } from './Warmup.tsx';

/**
 * Le jeu : routes et garde de profil. Les écrans d'entrée (compte familial) sont chargés avec lui ;
 * les autres viennent à la demande, fichier par fichier, depuis leur fonctionnalité
 * (`features/<domaine>`). Un import statique de l'un d'eux le ramènerait dans le chargement initial.
 */

const Hub = lazyScreen(async () => (await import('../features/hub/Hub.tsx')).Hub);
const ModeSetup = lazyScreen(async () => (await import('../features/hub/ModeSetup.tsx')).ModeSetup);
const MultiModes = lazyScreen(async () => (await import('../features/hub/MultiModes.tsx')).MultiModes);
const ProfilePicker = lazyScreen(async () => (await import('../features/profiles/ProfilePicker.tsx')).ProfilePicker);
const ProfileEditor = lazyScreen(async () => (await import('../features/profiles/ProfileEditor.tsx')).ProfileEditor);
const Heroes = lazyScreen(async () => (await import('../features/profiles/Heroes.tsx')).Heroes);
const ParentHome = lazyScreen(async () => (await import('../features/parent/ParentArea.tsx')).ParentHome);
const ChildReport = lazyScreen(async () => (await import('../features/parent/ParentArea.tsx')).ChildReport);
const ParentProfiles = lazyScreen(async () => (await import('../features/parent/ParentAccount.tsx')).ParentProfiles);
const ParentProfileEditor = lazyScreen(
  async () => (await import('../features/parent/ParentAccount.tsx')).ParentProfileEditor,
);
const ParentSettings = lazyScreen(async () => (await import('../features/parent/ParentAccount.tsx')).ParentSettings);
const DeleteFamily = lazyScreen(async () => (await import('../features/parent/DeleteFamily.tsx')).DeleteFamily);
const Subscription = lazyScreen(async () => (await import('../features/parent/Subscription.tsx')).Subscription);
const PaymentSimulator = lazyScreen(async () => (await import('../features/parent/Subscription.tsx')).PaymentSimulator);
const Chapters = lazyScreen(async () => (await import('../features/training/Chapters.tsx')).Chapters);
const Notions = lazyScreen(async () => (await import('../features/training/Notions.tsx')).Notions);
const TrainingPlay = lazyScreen(async () => (await import('../features/training/TrainingPlay.tsx')).TrainingPlay);
const BossChapters = lazyScreen(async () => (await import('../features/boss/BossChapters.tsx')).BossChapters);
const BossPlay = lazyScreen(async () => (await import('../features/boss/BossPlay.tsx')).BossPlay);
const Shop = lazyScreen(async () => (await import('../features/boss/Shop.tsx')).Shop);
const DefiPlay = lazyScreen(async () => (await import('../features/defis/DefiPlay.tsx')).DefiPlay);
const EvaluationHome = lazyScreen(
  async () => (await import('../features/evaluation/EvaluationHome.tsx')).EvaluationHome,
);
const EvaluationPlay = lazyScreen(
  async () => (await import('../features/evaluation/EvaluationPlay.tsx')).EvaluationPlay,
);
const EvaluationResults = lazyScreen(
  async () => (await import('../features/evaluation/EvaluationResults.tsx')).EvaluationResults,
);
const Arena = lazyScreen(async () => (await import('../features/arena/Arena.tsx')).Arena);
const Online = lazyScreen(async () => (await import('../features/realtime/Online.tsx')).Online);
const Friends = lazyScreen(async () => (await import('../features/realtime/Friends.tsx')).Friends);
const TvScreen = lazyScreen(async () => (await import('../features/tv/TvScreen.tsx')).TvScreen);
const Progress = lazyScreen(async () => (await import('../features/progress/Progress.tsx')).Progress);
const SubjectProgress = lazyScreen(async () => (await import('../features/progress/Progress.tsx')).SubjectProgress);
const TrophiesPage = lazyScreen(async () => (await import('../features/progress/Progress.tsx')).TrophiesPage);
const Dictionary = lazyScreen(async () => (await import('../features/dictionary/Dictionary.tsx')).Dictionary);
const About = lazyScreen(async () => (await import('../features/settings/About.tsx')).About);
const Settings = lazyScreen(async () => (await import('../features/settings/Settings.tsx')).Settings);

/** Atelier graphique : chargé à la demande, seulement en développement (absent du build de production). */
const AssetPreview = import.meta.env.DEV
  ? lazy(() => import('../dev/AssetPreview.tsx').then((m) => ({ default: m.AssetPreview })))
  : null;

/** Code téléchargé d'avance après la 1re ouverture : les voisins de l'accueil, puis tout le reste. */
const PRELOAD = [
  [Hub, ProfilePicker, ModeSetup, Chapters, Notions, BossChapters, Progress, ParentHome],
  [TrainingPlay, BossPlay, SubjectProgress, TrophiesPage, Shop, Heroes, MultiModes, Settings, Dictionary],
  [DefiPlay, EvaluationHome, EvaluationPlay, EvaluationResults, Arena, Online, Friends, TvScreen],
  [ChildReport, ParentProfiles, ParentProfileEditor, ParentSettings, Subscription, PaymentSimulator],
  [ProfileEditor, DeleteFamily, About],
];

/** Rend `children(profile)` si un profil est sélectionné et existe, sinon renvoie vers l'accueil. */
function WithProfile({ children }: { readonly children: (profile: Profile) => ReactNode }) {
  const profileId = useSession((s) => s.profileId);
  const { data, error, isPending, refetch } = useProfile(profileId);
  // Profil supprimé ou identifiant périmé : retour au choix du profil.
  const gone = error instanceof ApiError && (error.status === 404 || error.status === 400);
  if (!profileId || gone) return <Navigate to="/" replace />;
  if (isPending) return <ScreenSkeleton />;
  if (!data) {
    // Serveur injoignable : on propose de réessayer plutôt que de perdre l'écran en cours.
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 p-8 text-center">
        <Questy mood="sad" size={120} />
        <p className="text-xl font-bold">{error.message}</p>
        <GameButton onClick={() => void refetch()}>Réessayer</GameButton>
      </div>
    );
  }
  return children(data);
}

/** Pages connectées : temps réel et notifications seulement quand l'appareil a une session. */
function ConnectedShell({ profileId }: { readonly profileId: string | null }) {
  return (
    <RequireAccount>
      <Warmup profileId={profileId} screens={PRELOAD} />
      <RealtimeLink profileId={profileId} />
      <Notifications />
    </RequireAccount>
  );
}

function LegacyAbonnement() {
  const { pathname, search } = useLocation();
  return <Navigate to={`/parent${pathname}${search}`} replace />;
}

export function GameApp() {
  const profileId = useSession((s) => s.profileId);
  useSessionSync();
  return (
    <TermContext.Provider value={Term}>
      <ParentGateProvider>
        <Routes>
          {/* Pages publiques : compte familial et informations. */}
          {/* Plateforme de test : ces parcours mènent directement à « Se connecter ». */}
          <Route
            path="/bienvenue"
            element={
              <HiddenInRecette>
                <WelcomeScreen />
              </HiddenInRecette>
            }
          />
          <Route
            path="/eleve"
            element={
              <HiddenInRecette>
                <StudentAgeScreen />
              </HiddenInRecette>
            }
          />
          <Route
            path="/eleve/inscription"
            element={
              <HiddenInRecette>
                <StudentSignupScreen />
              </HiddenInRecette>
            }
          />
          <Route
            path="/eleve/code"
            element={
              <HiddenInRecette>
                <StudentRecoverScreen />
              </HiddenInRecette>
            }
          />
          <Route
            path="/connexion"
            element={
              <PortalSignIn>
                <LoginScreen />
              </PortalSignIn>
            }
          />
          <Route path="/inscription" element={<SignupScreen />} />
          <Route path="/email/verification" element={<VerifyEmailScreen />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordScreen />} />
          <Route path="/mot-de-passe/nouveau" element={<ResetPasswordScreen />} />
          <Route path="/a-propos" element={<About />} />
          {/* Tout le reste demande un appareil connecté au compte de la famille. */}
          <Route element={<ConnectedShell profileId={profileId} />}>
            <Route path="/" element={<ProfilePicker />} />
            <Route path="/parent" element={<ParentHome />} />
            <Route path="/tv" element={<TvScreen />} />
            <Route path="/parent/enfant/:profileId" element={<ChildReport />} />
            <Route path="/parent/abonnement" element={<Subscription />} />
            <Route path="/parent/abonnement/simulateur" element={<PaymentSimulator />} />
            <Route path="/parent/profils" element={<ParentProfiles />} />
            <Route path="/parent/profils/nouveau" element={<ParentProfileEditor />} />
            <Route path="/parent/profils/:id/modifier" element={<ParentProfileEditor />} />
            <Route path="/parent/reglages" element={<ParentSettings />} />
            <Route path="/parent/reglages/supprimer" element={<DeleteFamily />} />
            {/* Anciennes adresses (favoris, retours de paiement déjà émis) : on reste dans l'Espace parent. */}
            <Route path="/abonnement/*" element={<LegacyAbonnement />} />
            <Route path="/profils/nouveau" element={<ProfileEditor />} />
            <Route path="/profils/:id/modifier" element={<ProfileEditor />} />
            <Route path="/hub" element={<WithProfile>{(p) => <Hub profile={p} />}</WithProfile>} />
            <Route path="/shop" element={<WithProfile>{(p) => <Shop profile={p} />}</WithProfile>} />
            <Route path="/heros" element={<WithProfile>{(p) => <Heroes profile={p} />}</WithProfile>} />
            <Route path="/dictionnaire" element={<WithProfile>{(p) => <Dictionary profile={p} />}</WithProfile>} />
            <Route path="/multi" element={<WithProfile>{(p) => <MultiModes profile={p} />}</WithProfile>} />
            <Route path="/arene" element={<WithProfile>{(p) => <Arena profile={p} />}</WithProfile>} />
            <Route path="/connectes" element={<WithProfile>{(p) => <Online profile={p} />}</WithProfile>} />
            <Route path="/amis" element={<WithProfile>{(p) => <Friends profile={p} />}</WithProfile>} />
            <Route
              path="/partie/defi/:defi/:subject"
              element={
                <NoDefinitions>
                  <WithProfile>{(p) => <DefiPlay profile={p} />}</WithProfile>
                </NoDefinitions>
              }
            />
            <Route
              path="/jouer/evaluation/:subject"
              element={<WithProfile>{(p) => <EvaluationHome profile={p} />}</WithProfile>}
            />
            <Route
              path="/partie/evaluation/:id"
              element={
                <NoDefinitions>
                  <WithProfile>{(p) => <EvaluationPlay profile={p} />}</WithProfile>
                </NoDefinitions>
              }
            />
            <Route
              path="/evaluation/:id/resultat"
              element={<WithProfile>{(p) => <EvaluationResults profile={p} />}</WithProfile>}
            />
            <Route path="/jouer/:modeId" element={<WithProfile>{(p) => <ModeSetup profile={p} />}</WithProfile>} />
            <Route
              path="/jouer/entrainement/:subject"
              element={<WithProfile>{(p) => <Chapters profile={p} />}</WithProfile>}
            />
            <Route
              path="/jouer/entrainement/:subject/:chapterId"
              element={<WithProfile>{(p) => <Notions profile={p} />}</WithProfile>}
            />
            <Route
              path="/partie/entrainement/:chapterId/:skillId"
              element={<WithProfile>{(p) => <TrainingPlay profile={p} />}</WithProfile>}
            />
            <Route
              path="/jouer/boss/:subject"
              element={<WithProfile>{(p) => <BossChapters profile={p} />}</WithProfile>}
            />
            <Route
              path="/partie/boss/:chapterId"
              element={
                <NoDefinitions>
                  <WithProfile>{(p) => <BossPlay profile={p} />}</WithProfile>
                </NoDefinitions>
              }
            />
            <Route path="/progres" element={<WithProfile>{(p) => <Progress profile={p} />}</WithProfile>} />
            <Route
              path="/progres/trophees"
              element={<WithProfile>{(p) => <TrophiesPage profile={p} />}</WithProfile>}
            />
            <Route
              path="/progres/:subject"
              element={<WithProfile>{(p) => <SubjectProgress profile={p} />}</WithProfile>}
            />
            <Route path="/parametres" element={<WithProfile>{(p) => <Settings profile={p} />}</WithProfile>} />
            {AssetPreview && (
              <Route
                path="/dev/assets"
                element={
                  <Suspense fallback={<ScreenSkeleton />}>
                    <AssetPreview />
                  </Suspense>
                }
              />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <DebugFlag />
      </ParentGateProvider>
    </TermContext.Provider>
  );
}
