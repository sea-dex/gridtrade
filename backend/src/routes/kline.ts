import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  getKlineQuerySchema,
  getTokenInfoQuerySchema,
  klineResponseSchema,
  tokenInfoResponseSchema,
} from '../schemas/kline.js';
import { getKlines, getTokenInfo } from '../services/kline.service.js';

const errorResponseSchema = z.object({
  error: z.string(),
});

const klineRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /kline – fetch K-line candles for a base/quote pair
  app.get(
    '/',
    {
      schema: {
        tags: ['Kline'],
        summary: 'Get K-line (candlestick) data for a trading pair',
        description:
          'Returns OHLCV candle data for the given base/quote token pair. ' +
          'The backend automatically selects the best data source.',
        querystring: getKlineQuerySchema,
        response: {
          200: klineResponseSchema,
          504: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { chain_id, base, quote, interval, limit, start, end } = request.query;

      try {
        return await getKlines({
          chainId: chain_id,
          base,
          quote,
          interval,
          limit,
          startTime: start,
          endTime: end,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const isTimeout =
          error.name === 'TimeoutError' ||
          error.name === 'AbortError' ||
          error.message.includes('timeout') ||
          error.message.includes('All') && error.message.includes('endpoints failed');

        if (isTimeout) {
          request.log.warn({ err: error }, 'Upstream data source timeout');
          return reply.status(504).send({
            error: 'Upstream data source timed out. Please try again shortly.',
          } as never);
        }

        throw err; // let Fastify's default error handler deal with other errors
      }
    },
  );

  // GET /kline/token – fetch token metadata
  app.get(
    '/token',
    {
      schema: {
        tags: ['Kline'],
        summary: 'Get token metadata',
        description:
          'Returns token metadata (symbol, name, decimals, logo).',
        querystring: getTokenInfoQuerySchema,
        response: {
          200: tokenInfoResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { chain_id, address } = request.query;
      const info = await getTokenInfo(chain_id, address);

      if (!info) {
        return reply.status(404).send({ error: 'Token not found' } as never);
      }

      return info;
    },
  );
};

export default klineRoutes;
