import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  getOrdersQuerySchema,
  getOrderDetailQuerySchema,
  getOrderDetailParamsSchema,
  getOrdersWithGridInfoQuerySchema,
  orderListResponseSchema,
  orderInfoSchema,
  orderFillsResponseSchema,
  orderWithGridInfoListResponseSchema,
} from '../schemas/orders.js';
import { getOrders, getOrderDetail, getOrderFills, getOrdersWithGridInfo } from '../services/orders.service.js';

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get flat list of orders with grid info (for All Grids view)
  app.get(
    '/with-grid-info',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Get orders with grid info',
        description: 'Get a flat list of orders joined with grid-level fields (owner, profits, compound, tokens)',
        querystring: getOrdersWithGridInfoQuerySchema,
        response: {
          200: orderWithGridInfoListResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, owner, grid_id, page, page_size } = request.query;

      const result = await getOrdersWithGridInfo({
        chainId: chain_id,
        owner,
        gridId: grid_id,
        page,
        pageSize: page_size,
      });

      return result;
    }
  );

  // Get list of orders
  app.get(
    '/',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Get list of orders',
        description: 'Get list of orders with optional filters',
        querystring: getOrdersQuerySchema,
        response: {
          200: orderListResponseSchema,
        },
      },
    },
    async (request, _reply) => {
      const { chain_id, grid_id, pair_id, is_ask } = request.query;

      const result = await getOrders({
        chainId: chain_id,
        gridId: grid_id,
        pairId: pair_id,
        isAsk: is_ask,
      });

      return result;
    }
  );

  // Get order detail
  app.get(
    '/:order_id',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Get order details',
        description: 'Get detailed information about a specific order',
        params: getOrderDetailParamsSchema,
        querystring: getOrderDetailQuerySchema,
        response: {
          200: orderInfoSchema,
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
      const { order_id } = request.params;
      const { chain_id } = request.query;

      const result = await getOrderDetail(chain_id, order_id);

      if (!result) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      return result;
    }
  );

  // Get order fills
  app.get(
    '/:order_id/fills',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Get order fills',
        description: 'Get fill history for a specific order',
        params: getOrderDetailParamsSchema,
        querystring: getOrderDetailQuerySchema,
        response: {
          200: orderFillsResponseSchema,
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
    async (request, _reply) => {
      const { order_id } = request.params;
      const { chain_id } = request.query;

      const result = await getOrderFills(chain_id, order_id);

      return result;
    }
  );
};

export default ordersRoutes;
