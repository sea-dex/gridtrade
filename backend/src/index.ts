import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { queryClient } from './db/index.js';
import { logger, appLogger } from './utils/logger.js';

// Create Fastify instance – reuse the root pino logger so that Fastify
// request logs and application logs share the same format & destination.
const fastify = Fastify({
  loggerInstance: logger,
}).withTypeProvider<ZodTypeProvider>();

// Set Zod validators
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register plugins
async function registerPlugins(): Promise<void> {
  // CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'GridEx API',
        description: 'Backend API for GridEx Decentralized Grid Trading Protocol',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Grids', description: 'Grid order operations' },
        { name: 'Orders', description: 'Order operations' },
        { name: 'Statistics', description: 'Protocol statistics' },
        { name: 'Leaderboard', description: 'Leaderboard operations' },
        { name: 'Kline', description: 'K-line (candlestick) data for tokens' },
        { name: 'Tokens', description: 'Base and quote token lists' },
        { name: 'Fees', description: 'Available fee tiers for grid orders' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}

// Register routes
async function registerRoutes(): Promise<void> {
  // Health check
  fastify.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  // Root endpoint
  fastify.get('/', async () => {
    return {
      name: 'GridEx API',
      version: '1.0.0',
      status: 'running',
      docs: '/docs',
    };
  });

  // API routes
  await fastify.register(routes, { prefix: '/api/v1' });
}

// Graceful shutdown
async function gracefulShutdown(): Promise<void> {
  appLogger.info('Shutting down gracefully…');

  try {
    await fastify.close();
    await queryClient.end();
    appLogger.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    appLogger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

// Start server
async function start(): Promise<void> {
  try {
    await registerPlugins();
    await registerRoutes();

    // Handle shutdown signals
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    await fastify.listen({ port: env.PORT, host: env.HOST });

    appLogger.info({ host: env.HOST, port: env.PORT }, 'GridEx API server running');
    appLogger.info({ url: `http://${env.HOST}:${env.PORT}/docs` }, 'API documentation available');
  } catch (err) {
    appLogger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
