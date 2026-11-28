import { noop, queryOptions, type QueryClient } from '@tanstack/react-query';
import { api } from '@epicademie/shared';
import { request } from '../../shared/api/client.ts';
import { journeyKey, prefetchPlayerData } from '../../shared/api/queries.ts';

/** Lectures de la rubrique Progrès de l'Espace parent. */
export const learningQuery = (profileId: string) =>
  queryOptions({
    queryKey: ['learning', profileId] as const,
    queryFn: () => request(api.learningReport, { params: { id: profileId } }),
    meta: { parentOnly: true },
  });

/** Semaine d'un enfant ; sous la clé du progrès, donc rafraîchie à chaque fin de série. */
export const parentWeekQuery = (profileId: string) =>
  queryOptions({
    queryKey: [...journeyKey(profileId), 'parent'] as const,
    queryFn: () => request(api.parentWeek, { params: { id: profileId } }),
    // Le ressenti arrive après la fin de série : relu à chaque ouverture de l'écran.
    staleTime: 0,
    meta: { parentOnly: true },
  });

export const evaluationSummaryQuery = (profileId: string) =>
  queryOptions({
    queryKey: ['evaluation-summary', profileId] as const,
    queryFn: () => request(api.evaluationSummary, { params: { id: profileId } }),
    meta: { parentOnly: true },
  });

/** Demande d'avance les progrès des enfants (Espace parent déjà ouvert). */
export function prefetchParentData(qc: QueryClient, profileIds: readonly string[]) {
  for (const id of profileIds) {
    void qc.query(learningQuery(id)).catch(noop);
    void qc.query(parentWeekQuery(id)).catch(noop);
    void qc.query(evaluationSummaryQuery(id)).catch(noop);
    prefetchPlayerData(qc, id);
  }
}
