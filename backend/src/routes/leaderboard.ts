import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  getLeaderboardQuerySchema,
  getTraderStatsQuerySchema,
  getTraderStatsParamsSchema,
  getTopPairsQuerySchema,
  leaderboardResponseSchema,
  traderStatsSchema,
  topPairSchema,
} from '../schemas/leaderboard.js';
import {
  getLeaderboard,
  getTraderStats,
  getTopPairs,
} from '../services/leaderboard.service.js';

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get leaderboard
  app.get(
    '/',
    {
      schema: {
        tags: ['Leaderboard'],
        summary: 'Get leaderboard',
        description: 'Get leaderboard of top performing grid strategies',
        querystring: getLeaderboardQuerySchema,
        response: {
          200: leaderboardResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, period, pair, limit, sort_by, order } = request.query;

      return await getLeaderboard({
        chainId: chain_id,
        period,
        pair,
        limit,
        sortBy: sort_by,
        order,
      });
    }
  );

  // Get trader stats
  app.get(
    '/trader/:address',
    {
      schema: {
        tags: ['Leaderboard'],
        summary: 'Get trader statistics',
        description: 'Get statistics for a specific trader',
        params: getTraderStatsParamsSchema,
        querystring: getTraderStatsQuerySchema,
        response: {
          200: traderStatsSchema,
        },
      },
    },
    async (request, _reply) => {
      const { address } = request.params;
      const { chain_id } = request.query;

      return await getTraderStats(chain_id, address);
    }
  );

  // Get top pairs
  app.get(
    '/pairs',
    {
      schema: {
        tags: ['Leaderboard'],
        summary: 'Get top pairs',
        description: 'Get top performing trading pairs',
        querystring: getTopPairsQuerySchema,
        response: {
          200: z.object({
            pairs: z.array(topPairSchema),
          }),
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, period, limit } = request.query;

      return await getTopPairs({
        chainId: chain_id,
        period,
        limit,
      });
    }
  );
};

export default leaderboardRoutes;
