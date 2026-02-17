/**
 * Centralized logger for the GridEx backend.
 *
 * Uses pino (the same library Fastify uses internally) so that log output
 * is consistent whether it comes from a Fastify request handler or from a
 * standalone service / utility / seed script.
 *
 * In production the logger writes JSON lines to both stdout and a rotating
 * log file under `./logs/` (the directory is expected to exist – the
 * Dockerfile creates it and it can be bind-mounted from the host for
 * persistence).
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
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Resolve log level & transport from environment
// ---------------------------------------------------------------------------

const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Log directory – relative to the project root (two levels up from this file
// in the compiled output: dist/utils/logger.js → ../../logs).
const LOG_DIR = process.env.LOG_DIR ?? path.resolve(process.cwd(), 'logs');

/**
 * Ensure the log directory exists (sync – runs once at startup before any
 * request is served).
 */
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Build pino transport targets
// ---------------------------------------------------------------------------

function buildTransport(): pino.TransportMultiOptions | pino.TransportSingleOptions | undefined {
  if (NODE_ENV === 'development') {
    // Pretty-print to stdout in development
    return {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    };
  }

  // Production: write structured JSON to both stdout and a log file
  ensureLogDir();

  const logFile = path.join(LOG_DIR, 'app.log');

  return {
    targets: [
      // stdout – for docker logs / container runtime
      {
        target: 'pino/file',
        options: { destination: 1 }, // fd 1 = stdout
        level: LOG_LEVEL as pino.Level,
      },
      // file – persisted on the host via bind-mount
      {
        target: 'pino/file',
        options: { destination: logFile, mkdir: true },
        level: LOG_LEVEL as pino.Level,
      },
    ],
  };
}

/**
 * Root application logger.
 *
 * In development mode, output is piped through `pino-pretty` for
 * human-readable formatting.  In production, raw JSON is emitted to both
 * stdout and `./logs/app.log` for structured log aggregation and local
 * persistence.
 */
export const logger = pino({
  level: LOG_LEVEL,
  transport: buildTransport(),
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

/** OKX DEX Market API client */
export const okxLogger = logger.child({ module: 'okx' });

/** The Graph subgraph client */
export const subgraphLogger = logger.child({ module: 'subgraph' });

/** Database seed script */
export const seedLogger = logger.child({ module: 'seed' });

/** Application bootstrap / lifecycle */
export const appLogger = logger.child({ module: 'app' });

/** AI strategy service */
export const aiLogger = logger.child({ module: 'ai' });
