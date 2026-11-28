import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { getChapter, getChapterOfSkill, getSkill } from '@epicademie/content';
import { recommendedReviews, regularCount } from '@epicademie/engine';
import { localToday } from '../../shared/lib/dates.ts';
import type { Profile } from '@epicademie/shared';
import { useDisabledSkills, useSkills } from './api.ts';
import { GameButton } from '../../shared/ui/game/GameButton.tsx';
import { ProgressBar } from '../../shared/ui/game/ProgressBar.tsx';
import { ResourceCounter } from '../../shared/ui/game/ResourceCounter.tsx';
import { useToast } from '../../shared/ui/Toast.tsx';
import { ScreenSkeleton } from '../../shared/ui/Skeleton.tsx';
import { Questy } from '../../shared/ui/mascot/Questy.tsx';
import { Memo } from '../../shared/question/Memo.tsx';
import { useBackGuard, useGameExit } from '../../shared/lib/gameExit.ts';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog.tsx';
import { HeroBubble } from '../../shared/battle/HeroBubble.tsx';
import { GameControls } from '../../shared/ui/game/GameControls.tsx';
import { Results } from './TrainingResults.tsx';
import { TrainingQuestion } from './TrainingQuestion.tsx';
import { EPREUVE_SKILL } from './epreuve.ts';
import { useTraining, type TrainingSetup } from './useTraining.ts';

/** Identifiant de « chapitre » des séries de révision (plusieurs chapitres d'une matière). */
export const REVIEW_CHAPTER = 'revisions';

/**
 * Partie d’Entraînement : 4 questions (5 en calcul de tête) + variantes, correction après chaque
 * réponse. `/partie/entrainement/<chapitre>/<notion | epreuve>`, ou
 * `/partie/entrainement/revisions/<matière>` pour les révisions du jour (moteur adaptatif).
 */
export function TrainingPlay({ profile }: { readonly profile: Profile }) {
  const { chapterId = '', skillId = '' } = useParams();
  const reviews = chapterId === REVIEW_CHAPTER;
  const chapter = getChapter(chapterId);
  const { data: disabled, isPending: disabledPending } = useDisabledSkills();
  const { data: progress, isPending } = useSkills(profile.id);
  const location = useLocation();
  const exitTo = reviews
    ? `/jouer/entrainement/${skillId}`
    : `/jouer/entrainement/${chapter?.subject ?? 'maths'}/${chapterId}`;
  const { left } = useGameExit(exitTo);
  const skills = useMemo(() => {
    if (reviews) {
      // Révisions du jour de la matière (notions déjà étudiées, dues ou fragiles).
      const states = (progress ?? []).filter((p) => getChapterOfSkill(p.skillId)?.subject === skillId);
      const lastPracticed = new Map(states.map((p) => [p.skillId, p.lastPracticed]));
      return recommendedReviews(states, localToday(), { lastPracticed })
        .map((r) => r.skillId)
        .filter((id) => !disabled?.has(id));
    }
    if (!chapter) return [];
    // Épreuve du chapitre : toutes ses notions, sans celles en maintenance.
    return skillId === EPREUVE_SKILL ? chapter.skills.map((s) => s.id).filter((id) => !disabled?.has(id)) : [skillId];
  }, [reviews, progress, chapter, skillId, disabled]);
  // Partie déjà quittée, revenue par « précédent » : on ne la relance pas (redirection en cours).
  if (left) return null;
  // La série se compose une fois la progression et les notions en maintenance connues.
  if (isPending || !progress || disabledPending) return <ScreenSkeleton />;
  const valid = reviews
    ? skills.length > 0
    : chapter !== undefined && skills.length > 0 && skills.every((id) => chapter.skills.some((s) => s.id === id));
  if (!valid) return <Navigate to={reviews ? exitTo : '/jouer/entrainement'} replace />;
  const states = new Map(progress.map((p) => [p.skillId, p]));
  return (
    <Game
      key={location.key}
      profile={profile}
      chapterId={chapterId}
      skills={skills}
      states={states}
      exitTo={exitTo}
      epreuve={!reviews && skillId === EPREUVE_SKILL}
    />
  );
}

/**
 * Écran d'une partie : en-tête (héros, progression, XP), question en cours avec sa
 * correction, puis bilan. Le déroulé est dans `useTraining`, les règles dans `state.ts`.
 */
function Game(setup: TrainingSetup) {
  const { profile, exitTo, chapterId } = setup;
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, showToast] = useToast(2500);
  const [memo, setMemo] = useState(false);
  /** Fenêtre ouverte : menu Pause, ou confirmation du bouton « Quitter ». */
  const [dialog, setDialog] = useState<'pause' | 'quit' | null>(null);
  const { state: s, ...act } = useTraining(setup, showToast);

  const pause = () => setDialog('pause');
  // Sorties : la partie est remplacée dans l'historique (« précédent » ne la relance pas).
  const { exit, restart } = useGameExit(exitTo);
  // Quitter la partie ramène au menu principal.
  const leave = () => exit('/hub');
  // « Précédent » pendant la série : même confirmation que la Pause.
  const { rearm } = useBackGuard(!s.summary && !s.error, pause);

  if (s.error) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 p-8 text-center">
        <Questy mood="sad" size={120} />
        <p className="text-xl font-bold">{s.error}</p>
        <GameButton onClick={leave}>Retour à l’accueil</GameButton>
      </div>
    );
  }

  if (s.summary)
    return (
      <Results
        profileId={profile.id}
        summary={s.summary}
        sessionId={s.sessionId}
        missed={s.missed}
        gender={profile.gender}
        adult={profile.grade === 'adulte'}
        chapterId={chapterId}
        epreuve={setup.epreuve === true}
        exitTo={exitTo}
        onExit={exit}
        onReplay={() => void navigate(location.pathname, { replace: true, state: { replay: Date.now() } })}
      />
    );

  const skill = s.current ? getSkill(s.current.plan.skillId) : undefined;
  return (
    <div className="mx-auto flex h-dvh max-w-6xl flex-col gap-3 px-3 pt-16 pb-3 sm:px-4 sm:pt-3">
      <GameControls onPause={pause} onQuit={() => setDialog('quit')} />
      {/* Tablette et ordinateur : une ligne avec les boutons ; téléphone : boutons au-dessus (trop étroit). */}
      <header className="flex shrink-0 items-center gap-3 sm:min-h-14 sm:pr-28">
        <HeroBubble hero={profile.hero} face={s.hero.face} text={s.hero.text} nonce={s.hero.nonce} />
        <ProgressBar
          className="flex-1"
          value={regularCount(s.training)}
          max={s.training.length}
          label="Progression de la série"
          segments={s.training.length}
        />
        <ResourceCounter icon="icons-resources-xp" value={`+${s.xpTotal} XP`} label={`${s.xpTotal} XP gagnés`} />
      </header>

      {!s.current && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Questy mood="wow" size={120} />
          <p className="font-display text-2xl">{s.sessionId ? 'Calcul des résultats…' : 'C’est parti…'}</p>
        </div>
      )}

      <TrainingQuestion
        screen={s}
        skill={skill}
        gender={profile.gender}
        epreuve={setup.epreuve === true}
        onPick={act.pick}
        onSubmit={act.submit}
        onNext={act.next}
        onHelp={act.askHelp}
        onCloseExplanation={act.closeExplanation}
        onMemo={() => {
          setMemo(true);
          act.reportConfused();
        }}
      />
      {memo && skill && <Memo skill={skill} onClose={() => setMemo(false)} />}
      {dialog && (
        <ConfirmDialog
          title={dialog === 'pause' ? 'Pause' : 'Quitter la série ?'}
          message="Si tu quittes, cette série ne sera pas comptée."
          confirm="Quitter la série"
          mood="ok"
          cancel="Reprendre"
          extra={{ label: 'Recommencer', onClick: restart }}
          onConfirm={leave}
          onCancel={() => {
            setDialog(null);
            rearm();
          }}
        />
      )}
      {toast}
    </div>
  );
}
