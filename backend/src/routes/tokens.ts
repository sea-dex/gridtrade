import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  getTokenListQuerySchema,
  tokenListResponseSchema,
} from '../schemas/tokens.js';
import { getBaseTokens, getQuoteTokens } from '../config/tokens.js';

const tokensRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /tokens/base – list base tokens for a chain
  app.get(
    '/base',
    {
      schema: {
        tags: ['Tokens'],
        summary: 'List base tokens',
        description:
          'Returns the list of supported base tokens for the given chain, ' +
          'sorted by priority. Includes metadata such as symbol, name, ' +
          'decimals, logo, and tags.',
        querystring: getTokenListQuerySchema,
        response: {
          200: tokenListResponseSchema,
        },
      },
    },
    async (request) => {
      const { chain_id } = request.query;
      const tokens = getBaseTokens(chain_id);

      return {
        chain_id,
        tokens,
      };
    },
  );

  // GET /tokens/quote – list quote tokens for a chain
  app.get(
    '/quote',
    {
      schema: {
        tags: ['Tokens'],
        summary: 'List quote tokens',
        description:
          'Returns the list of supported quote tokens for the given chain, ' +
          'sorted by priority. Includes metadata such as symbol, name, ' +
          'decimals, logo, and tags.',
        querystring: getTokenListQuerySchema,
        response: {
          200: tokenListResponseSchema,
        },
      },
    },
    async (request) => {
      const { chain_id } = request.query;
      const tokens = getQuoteTokens(chain_id);

      return {
        chain_id,
        tokens,
      };
    },
  );
};

export default tokensRoutes;
