import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  getGridsQuerySchema,
  getGridDetailQuerySchema,
  getGridDetailParamsSchema,
  getPairIdQuerySchema,
  gridListResponseSchema,
  gridWithOrdersListResponseSchema,
  gridDetailResponseSchema,
  gridFillsResponseSchema,
  gridProfitsResponseSchema,
  pairIdResponseSchema,
} from '../schemas/grids.js';
import { getGrids, getGridsWithOrders, getGridDetail, getGridFills, getGridProfits, getPairIdByAddresses } from '../services/grids.service.js';

const gridsRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get list of grids
  app.get(
    '/',
    {
      schema: {
        tags: ['Grids'],
        summary: 'Get list of grid orders',
        description: 'Get list of grid orders with optional filters',
        querystring: getGridsQuerySchema,
        response: {
          200: gridListResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, owner, pair_id, base_token, quote_token, status, page, page_size } = request.query;

      const result = await getGrids({
        chainId: chain_id,
        owner,
        pairId: pair_id,
        baseToken: base_token,
        quoteToken: quote_token,
        status,
        page,
        pageSize: page_size,
      });

      return result;
    }
  );

  // Get list of grids with their orders grouped
  app.get(
    '/with-orders',
    {
      schema: {
        tags: ['Grids'],
        summary: 'Get list of grids with orders',
        description: 'Get list of grids with all orders grouped under each grid',
        querystring: getGridsQuerySchema,
        response: {
          200: gridWithOrdersListResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, owner, pair_id, base_token, quote_token, status, page, page_size } = request.query;

      const result = await getGridsWithOrders({
        chainId: chain_id,
        owner,
        pairId: pair_id,
        baseToken: base_token,
        quoteToken: quote_token,
        status,
        page,
        pageSize: page_size,
      });

      return result;
    }
  );

  // Get grid detail
  app.get(
    '/:grid_id',
    {
      schema: {
        tags: ['Grids'],
        summary: 'Get grid details',
        description: 'Get detailed information about a specific grid including all orders',
        params: getGridDetailParamsSchema,
        querystring: getGridDetailQuerySchema,
        response: {
          200: gridDetailResponseSchema,
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
            required: ['error'],
          },
        },
      },
    },
    async (request, reply) => {
      const { grid_id } = request.params;
      const { chain_id } = request.query;

      const result = await getGridDetail(chain_id, grid_id);

      if (!result) {
        return reply.status(404).send({ error: 'Grid not found' });
      }

      return result;
    }
  );

  // Get grid fills
  app.get(
    '/:grid_id/fills',
    {
      schema: {
        tags: ['Grids'],
        summary: 'Get grid fills',
        description: 'Get fill history for a specific grid',
        params: getGridDetailParamsSchema,
        querystring: getGridDetailQuerySchema,
        response: {
          200: gridFillsResponseSchema,
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
            required: ['error'],
          },
        },
      },
    },
    async (request, reply) => {
      const { grid_id } = request.params;
      const { chain_id } = request.query;

      const result = await getGridFills(chain_id, grid_id);

      if (!result) {
        return reply.status(404).send({ error: 'Grid not found' });
      }

      return result;
    }
  );

  // Get grid profits
  app.get(
    '/:grid_id/profits',
    {
      schema: {
        tags: ['Grids'],
        summary: 'Get grid profits',
        description: 'Get accumulated profits for a grid',
        params: getGridDetailParamsSchema,
        querystring: getGridDetailQuerySchema,
        response: {
          200: gridProfitsResponseSchema,
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
            required: ['error'],
          },
        },
      },
    },
    async (request, reply) => {
      const { grid_id } = request.params;
      const { chain_id } = request.query;

      const result = await getGridProfits(chain_id, grid_id);

      if (!result) {
        return reply.status(404).send({ error: 'Grid not found' });
      }

      return result;
    }
  );

  // Get pair ID by base and quote token addresses
  app.get(
    '/pair-id',
    {
      schema: {
        tags: ['Grids'],
        summary: 'Get pair ID by token addresses',
        description: 'Get pair ID for a given base and quote token address pair. Native token (0x0) addresses are automatically converted to WETH.',
        querystring: getPairIdQuerySchema,
        response: {
          200: pairIdResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, base_token, quote_token } = request.query;

      const result = await getPairIdByAddresses(chain_id, base_token, quote_token);

      return {
        pair_id: result.pairId,
        base_token: result.baseTokenAddress,
        quote_token: result.quoteTokenAddress,
      };
    }
  );
};

export default gridsRoutes;
