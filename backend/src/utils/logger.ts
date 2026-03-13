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
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Resolve log level & transport from environment
// ---------------------------------------------------------------------------

const LOG_LEVEL = env.LOG_LEVEL;
const NODE_ENV = env.NODE_ENV;
const LOG_FORMAT = env.LOG_FORMAT ?? (NODE_ENV === 'production' ? 'json' : 'text');
const SERVICE_NAME = 'gridex-backend';

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
// Build pino output streams / transport
// ---------------------------------------------------------------------------

function buildTransport(): pino.TransportSingleOptions | undefined {
  if (LOG_FORMAT === 'text') {
    return {
      target: 'pino-pretty',
      options: {
        colorize: false,
        errorLikeObjectKeys: [],
        singleLine: true,
        translateTime: 'SYS:standard',
        messageKey: 'message',
        ignore: 'pid,host',
      },
    };
  }

  if (NODE_ENV !== 'production') {
    return undefined;
  }

  return undefined;
}

function buildDestination(): pino.DestinationStream | pino.MultiStreamRes<never> | undefined {
  if (LOG_FORMAT === 'text') {
    return undefined;
  }

  if (NODE_ENV !== 'production') {
    return undefined;
  }

  // Production JSON: write structured JSON to both stdout and a log file.
  // We use multistream instead of transport.targets so custom level formatting
  // remains available for log consumers like Dokploy.
  ensureLogDir();

  const logFile = path.join(LOG_DIR, 'app.log');

  return pino.multistream([
    { stream: pino.destination(1), level: LOG_LEVEL },
    { stream: pino.destination(logFile), level: LOG_LEVEL },
  ]);
}

function normalizeWhitespace(value: string | undefined): string | undefined {
  return value?.replace(/\s*\n\s*/g, ' | ').trim();
}

function pickErrorMetadata(err: Error & Record<string, unknown>): Record<string, unknown> {
  const extraFields = ['code', 'errno', 'syscall', 'address', 'port', 'statusCode'];
  const metadata: Record<string, unknown> = {};

  for (const field of extraFields) {
    if (err[field] !== undefined) {
      metadata[field] = err[field];
    }
  }

  return metadata;
}

function serializeErrorLike(value: unknown): unknown {
  if (!(value instanceof Error)) {
    return value;
  }

  const err = value as Error & Record<string, unknown>;
  const serialized: Record<string, unknown> = {
    type: err.name,
    message: err.message,
    ...pickErrorMetadata(err),
  };

  const stack = normalizeWhitespace(err.stack);
  if (stack) {
    serialized.stack = stack;
  }

  if (Array.isArray(err.aggregateErrors) && err.aggregateErrors.length > 0) {
    serialized.aggregateErrors = err.aggregateErrors.map((item) => serializeErrorLike(item));
  }

  if (err.cause instanceof Error) {
    serialized.cause = serializeErrorLike(err.cause);
  }

  return serialized;
}

function serializeRequest(req: Record<string, unknown>): Record<string, unknown> {
  const raw = (req.raw as Record<string, unknown> | undefined) ?? req;
  const headers = raw.headers as Record<string, string | string[] | undefined> | undefined;

  return {
    method: raw.method,
    url: raw.url,
    host: raw.host ?? headers?.host,
    remoteAddress: raw.remoteAddress,
    remotePort: raw.remotePort,
  };
}

function serializeResponse(res: Record<string, unknown>): Record<string, unknown> {
  const raw = (res.raw as Record<string, unknown> | undefined) ?? res;

  return {
    statusCode: raw.statusCode,
  };
}

/**
 * Root application logger.
 *
 * Text mode uses single-line output for local debugging. JSON mode emits
 * one JSON object per line for structured log aggregation. Production keeps
 * writing JSON to both stdout and `./logs/app.log`.
 *
 */
const transport = buildTransport();
const destination = buildDestination();

export const logger = pino({
  level: LOG_LEVEL,
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({
      level: label.toUpperCase(),
      severity: label.toUpperCase(),
    }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      service: SERVICE_NAME,
    }),
  },
  serializers: {
    err: serializeErrorLike,
    error: serializeErrorLike,
    req: serializeRequest,
    res: serializeResponse,
  },
  transport,
}, destination);

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
