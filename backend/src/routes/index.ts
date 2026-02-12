import { FastifyPluginAsync } from 'fastify';
import gridsRoutes from './grids.js';
import ordersRoutes from './orders.js';
import statsRoutes from './stats.js';
import leaderboardRoutes from './leaderboard.js';
import klineRoutes from './kline.js';
import tokensRoutes from './tokens.js';
import feesRoutes from './fees.js';

const routes: FastifyPluginAsync = async (fastify) => {
  // Register all API routes
  await fastify.register(gridsRoutes, { prefix: '/grids' });
  await fastify.register(ordersRoutes, { prefix: '/orders' });
  await fastify.register(statsRoutes, { prefix: '/stats' });
  await fastify.register(leaderboardRoutes, { prefix: '/leaderboard' });
  await fastify.register(klineRoutes, { prefix: '/kline' });
  await fastify.register(tokensRoutes, { prefix: '/tokens' });
  await fastify.register(feesRoutes, { prefix: '/fees' });
};

export default routes;
