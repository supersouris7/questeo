import { useQuery } from '@tanstack/react-query';
import type { ParentWeek, Profile } from '@epicademie/shared';
import { ago } from '../../shared/lib/dates.ts';
import { BlockSkeleton } from '../../shared/ui/Skeleton.tsx';
import { ParentCard } from './ParentShell.tsx';
import { parentWeekQuery } from './queries.ts';
import { skillTitle } from './summary.ts';
import { adviceText, answersIn, effortLines, FEELINGS, feelingTrend } from './week.ts';

/**
 * Espace parent : la semaine d'un enfant (efforts, conseil), puis sur sa page ses progrès et ses
 * réponses « Je me sens capable ? ». Un enfant à la fois, jamais de comparaison.
 */

function Effort({ week }: { readonly week: ParentWeek }) {
  const lines = effortLines(week.effort);
  if (lines.length === 0) return <p>Pas encore de séance ces 7 derniers jours.</p>;
  return (
    <ul className="flex flex-col gap-1 font-bold">
      {lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

function Advice({ week, child }: { readonly week: ParentWeek; readonly child: Profile }) {
  return (
    <p className="bg-surface-2 rounded-xl p-3 text-sm">
      <span className="font-bold">Conseil de la semaine : </span>
      {adviceText(week.advice, child.name, child.gender)}
    </p>
  );
}

/** Résumé sur la carte d'un enfant (liste des enfants). */
export function WeekCard({ child }: { readonly child: Profile }) {
  const { data: week } = useQuery(parentWeekQuery(child.id));
  if (!week) return null;
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-muted text-sm font-bold">Efforts de la semaine</h4>
      <Effort week={week} />
      <Advice week={week} child={child} />
    </div>
  );
}

function Gains({ week }: { readonly week: ParentWeek }) {
  if (week.gains.length === 0) return null;
  return (
    <ParentCard id="progres-semaine" title="Progrès de la semaine">
      <ul className="flex flex-col gap-2">
        {week.gains.map(({ skillId, before, now }) => (
          <li key={skillId}>
            <p className="font-bold">{skillTitle(skillId)}</p>
            <p className="text-sm">
              {ago(before.day, week.today)} : {before.correct}/{before.answered} → {ago(now.day, week.today)} :{' '}
              {now.correct}/{now.answered}
            </p>
          </li>
        ))}
      </ul>
    </ParentCard>
  );
}

function Feelings({ week, child }: { readonly week: ParentWeek; readonly child: Profile }) {
  const { feelings } = week;
  return (
    <ParentCard id="ressenti" title="« Je me sens capable ? »">
      <p>{feelingTrend(feelings, child.name)}</p>
      {answersIn(feelings.week) + answersIn(feelings.before) > 0 && (
        <table className="w-full text-sm">
          <caption className="text-muted text-left">Nombre de réponses en fin de série</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left">
                Réponse
              </th>
              <th scope="col" className="text-right">
                7 derniers jours
              </th>
              <th scope="col" className="text-right">
                4 semaines d’avant
              </th>
            </tr>
          </thead>
          <tbody>
            {FEELINGS.map((f) => (
              <tr key={f.value}>
                <th scope="row" className="py-1 text-left">
                  <span aria-hidden>{f.face} </span>
                  {f.label}
                </th>
                <td className="text-right font-bold">{feelings.week[f.key]}</td>
                <td className="text-right">{feelings.before[f.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ParentCard>
  );
}

/** En tête de la page d'un enfant : efforts et conseil, progrès, puis ressenti. */
export function WeekReport({ child }: { readonly child: Profile }) {
  const { data: week, isPending } = useQuery(parentWeekQuery(child.id));
  if (isPending) return <BlockSkeleton />;
  if (!week) return null;
  return (
    <>
      <ParentCard id="efforts-semaine" title="Efforts de la semaine">
        <Effort week={week} />
        <Advice week={week} child={child} />
      </ParentCard>
      <Gains week={week} />
      <Feelings week={week} child={child} />
    </>
  );
}
