import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  aiStrategyRequestSchema,
  aiStrategyResponseSchema,
} from '../schemas/ai.js';
import { generateStrategy } from '../services/ai.service.js';
import { aiLogger as log } from '../utils/logger.js';
import { errorResponseSchema } from '../schemas/common.js';

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /strategy – AI-powered grid strategy generation
  app.post(
    '/strategy',
    {
      schema: {
        tags: ['AI'],
        summary: 'Generate grid strategy with AI',
        description:
          'Accepts a natural-language prompt describing the desired grid strategy. ' +
          'Returns either a complete strategy (status "success") or clarifying ' +
          'questions if user input is incomplete (status "clarify").',
        body: aiStrategyRequestSchema,
        response: {
          200: aiStrategyResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await generateStrategy(request.body);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        log.error({ err }, 'AI strategy generation failed');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'AI_ERROR',
            message,
          },
        } as never);
      }
    },
  );
};

export default aiRoutes;
