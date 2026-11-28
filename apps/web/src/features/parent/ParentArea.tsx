import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { gradeInfo, type LearningReport, type Profile } from '@epicademie/shared';
import { ParentPage } from './ParentShell.tsx';
import { CharacterAvatar } from '../../shared/ui/game/CharacterAvatar.tsx';
import { useProfiles } from '../profiles/index.ts';
import { learningQuery } from './queries.ts';
import { BlockSkeleton } from '../../shared/ui/Skeleton.tsx';
import { ToReview } from './ToReview.tsx';
import { EvaluationLine, EvaluationNotes } from './Evaluations.tsx';
import { SubjectCards, SubjectDetail } from './SubjectCards.tsx';
import { useSubjectBars } from './useSubjectBars.ts';
import { synthesis, toReview } from './summary.ts';
import { WeekCard, WeekReport } from './WeekSummary.tsx';

/**
 * Espace parent, rubrique Progrès : vue de chaque enfant (efforts de la semaine, conseil, cartes
 * matière), puis page d'un enfant : la semaine, synthèse, avancement, notions à renforcer. Lecture seule. Réservé au parent (code PIN ou mot de passe, verrou de 10 minutes). Écrit pour un parent non technicien : des mots, peu de chiffres.
 */

const useLearning = (profileId: string) => useQuery(learningQuery(profileId));

export function ParentHome() {
  const { data: profiles, isPending } = useProfiles();
  return (
    <ParentPage title="Progrès de vos enfants">
      {isPending && <BlockSkeleton />}
      {profiles?.length === 0 && (
        <p>
          Aucun profil enfant pour l’instant.{' '}
          <Link to="/parent/profils/nouveau" className="text-accent font-bold underline">
            Ajouter un enfant
          </Link>
        </p>
      )}
      <ul className="grid gap-4 md:grid-cols-2">
        {profiles?.map((p) => (
          <ChildCard key={p.id} profile={p} />
        ))}
      </ul>
    </ParentPage>
  );
}

function ChildCard({ profile: p }: { readonly profile: Profile }) {
  const { data: r } = useLearning(p.id);
  const bars = useSubjectBars(p, r);
  const navigate = useNavigate();
  const review = r ? toReview(r) : [];
  return (
    <li className="bg-surface flex flex-col gap-3 rounded-2xl p-4 shadow-sm" aria-label={`Progrès de ${p.name}`}>
      <div className="flex items-center gap-3">
        <CharacterAvatar avatar={p.avatar} size={52} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold">{p.name}</h3>
          <p className="text-muted text-sm">{p.grade ? gradeInfo(p.grade).name : 'Classe non renseignée'}</p>
        </div>
      </div>
      <WeekCard child={p} />
      {bars && bars.length > 0 && (
        <SubjectCards bars={bars} onPick={(id) => void navigate(`/parent/enfant/${p.id}?matiere=${id}`)} />
      )}
      <EvaluationLine profileId={p.id} grade={p.grade} />
      {review.length > 0 && (
        <p className="text-sm">
          <span className="text-muted font-bold">Notions à renforcer : </span>
          {review.map((i) => i.title).join(', ')}
        </p>
      )}
      <Link
        to={`/parent/enfant/${p.id}`}
        className="bg-accent mt-auto rounded-xl px-4 py-2.5 text-center font-bold text-white"
      >
        Voir les progrès de {p.name}
      </Link>
    </li>
  );
}

export function ChildReport() {
  const { profileId = '' } = useParams();
  const { data: profiles } = useProfiles();
  const child = profiles?.find((p) => p.id === profileId);
  const { data: r, isPending } = useLearning(profileId);
  return (
    <ParentPage
      title={child ? `Progrès de ${child.name}` : 'Progrès'}
      back={{ to: '/parent', label: 'Tous les enfants' }}
    >
      {isPending && <BlockSkeleton />}
      {r && child && <ReportView report={r} child={child} />}
    </ParentPage>
  );
}

function ReportView({ report: r, child }: { readonly report: LearningReport; readonly child: Profile }) {
  const bars = useSubjectBars(child, r);
  const [params, setParams] = useSearchParams();
  const picked = bars?.find((b) => b.id === params.get('matiere'));
  // Ordre de la page : la semaine (efforts d'abord), synthèse, évaluations, avancement, à renforcer.
  return (
    <div className="flex flex-col gap-6">
      <WeekReport child={child} />
      {bars && <p className="text-lg font-bold">{synthesis(child.name, bars)}</p>}
      <EvaluationNotes profileId={child.id} grade={child.grade} />
      {bars && bars.length > 0 && (
        <section aria-labelledby="avancement" className="flex flex-col gap-2">
          <h2 id="avancement" className="text-lg font-bold">
            Avancement
          </h2>
          <SubjectCards
            bars={bars}
            selected={picked?.id}
            onPick={(id) => setParams(id === picked?.id ? {} : { matiere: id }, { replace: true })}
          />
          {picked && <SubjectDetail bar={picked} />}
        </section>
      )}
      <ToReview items={toReview(r)} />
    </div>
  );
}
