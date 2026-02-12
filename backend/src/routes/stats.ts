import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  getStatsQuerySchema,
  getVolumeQuerySchema,
  statsResponseSchema,
  pairStatsResponseSchema,
  volumeStatsResponseSchema,
  tvlStatsResponseSchema,
} from '../schemas/stats.js';
import {
  getProtocolStats,
  getPairStats,
  getVolumeStats,
  getTvlStats,
} from '../services/stats.service.js';

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get protocol stats
  app.get(
    '/',
    {
      schema: {
        tags: ['Statistics'],
        summary: 'Get protocol statistics',
        description: 'Get overall protocol statistics',
        querystring: getStatsQuerySchema,
        response: {
          200: statsResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id } = request.query;
      return await getProtocolStats(chain_id);
    }
  );

  // Get pair stats
  app.get(
    '/pairs',
    {
      schema: {
        tags: ['Statistics'],
        summary: 'Get pair statistics',
        description: 'Get statistics for all trading pairs',
        querystring: getStatsQuerySchema,
        response: {
          200: pairStatsResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id } = request.query;
      return await getPairStats(chain_id);
    }
  );

  // Get volume stats
  app.get(
    '/volume',
    {
      schema: {
        tags: ['Statistics'],
        summary: 'Get volume statistics',
        description: 'Get volume statistics for a specific time period',
        querystring: getVolumeQuerySchema,
        response: {
          200: volumeStatsResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, period } = request.query;
      return await getVolumeStats(chain_id, period);
    }
  );

  // Get TVL stats
  app.get(
    '/tvl',
    {
      schema: {
        tags: ['Statistics'],
        summary: 'Get TVL statistics',
        description: 'Get current TVL breakdown',
        querystring: getStatsQuerySchema,
        response: {
          200: tvlStatsResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id } = request.query;
      return await getTvlStats(chain_id);
    }
  );
};

export default statsRoutes;
