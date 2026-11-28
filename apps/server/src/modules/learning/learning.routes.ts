import type { FastifyInstance } from 'fastify';
import { api } from '@epicademie/shared';
import { route } from '../../core/http/route.ts';
import type { Ownership } from '../accounts/index.ts';
import type { LearningService } from './learning.service.ts';

/** Routes du suivi des apprentissages (profil de la famille connectée seulement). */
export function learningRoutes(service: LearningService, owns: Ownership) {
  return async (app: FastifyInstance) => {
    route(app, api.learningReport, async ({ params, actor }) => {
      await owns.profile(actor(), params.id);
      return service.report(params.id);
    });
    route(app, api.journey, async ({ params, actor }) => {
      await owns.profile(actor(), params.id);
      return service.journey(params.id);
    });
    route(app, api.parentWeek, async ({ params, actor }) => {
      await owns.profile(actor(), params.id);
      return service.parentWeek(params.id);
    });
    route(app, api.badges, async ({ params, actor }) => {
      await owns.profile(actor(), params.id);
      return service.badges(params.id);
    });
  };
}
