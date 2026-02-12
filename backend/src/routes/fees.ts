import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  getFeeListQuerySchema,
  feeListResponseSchema,
} from '../schemas/fees.js';
import { getFees } from '../config/fees.js';

const feesRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /fees – list available fee tiers for a chain
  app.get(
    '/',
    {
      schema: {
        tags: ['Fees'],
        summary: 'List fee tiers',
        description:
          'Returns the list of available fee tiers for the given chain, ' +
          'sorted by priority. Each tier includes the on-chain value ' +
          '(denominator = 1,000,000), a human-readable label, and whether it is the ' +
          'default selection.',
        querystring: getFeeListQuerySchema,
        response: {
          200: feeListResponseSchema,
        },
      },
    },
    async (request) => {
      const { chain_id } = request.query;
      const fees = getFees(chain_id);

      return {
        chain_id,
        fees,
      };
    },
  );
};

export default feesRoutes;
