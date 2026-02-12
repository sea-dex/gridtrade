/**
 * Centralized logger for the GridEx backend.
 *
 * Uses pino (the same library Fastify uses internally) so that log output
 * is consistent whether it comes from a Fastify request handler or from a
 * standalone service / utility / seed script.
 *
 * Usage:
 *   import { logger } from '../utils/logger.js';
 *
 *   logger.info('Server started');
 *   logger.info({ port: 3001 }, 'Listening');
 *   logger.warn({ url }, 'Request failed');
 *   logger.error({ err }, 'Unexpected error');
 *
 * Child loggers for specific modules:
 *   const log = logger.child({ module: 'binance' });
 *   log.warn('Timeout from endpoint');
 */

import pino from 'pino';

// ---------------------------------------------------------------------------
// Resolve log level & transport from environment
// ---------------------------------------------------------------------------

const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

/**
 * Root application logger.
 *
 * In development mode, output is piped through `pino-pretty` for
 * human-readable formatting.  In production, raw JSON is emitted for
 * structured log aggregation.
 */
export const logger = pino({
  level: LOG_LEVEL,
  ...(NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

// ---------------------------------------------------------------------------
// Pre-built child loggers for common modules
// ---------------------------------------------------------------------------

/** HTTP / Axios proxy layer */
export const httpLogger = logger.child({ module: 'http' });

/** Binance API client */
export const binanceLogger = logger.child({ module: 'binance' });

/** Moralis API client */
export const moralisLogger = logger.child({ module: 'moralis' });

/** The Graph subgraph client */
export const subgraphLogger = logger.child({ module: 'subgraph' });

/** Database seed script */
export const seedLogger = logger.child({ module: 'seed' });

/** Application bootstrap / lifecycle */
export const appLogger = logger.child({ module: 'app' });
