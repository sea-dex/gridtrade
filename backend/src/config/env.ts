import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env files in priority order (later files override earlier ones).
// When launched via `dotenv -e .env.local` the variables are already in
// process.env, so this acts as a fallback for direct `tsx src/index.ts` usage.
const root = path.resolve(import.meta.dirname, '../../');
const nodeEnv = process.env.NODE_ENV || 'development';

const envFiles = [
  '.env',                        // base defaults (tracked)
  `.env.${nodeEnv}`,             // environment-specific non-secrets (tracked)
  '.env.local',                  // local overrides & secrets (gitignored)
  `.env.${nodeEnv}.local`,       // environment-specific secrets (gitignored)
];

for (const file of envFiles) {
  const filePath = path.resolve(root, file);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
}

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().default('postgres://postgres:password@localhost:5432/gridex'),
  DB_HOST: z.string().optional(),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val: string) => val.split(',').map((item) => item.trim()).filter(Boolean)),

  RATE_LIMIT_MAX: z.string().default('600').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),

  ETH_RPC_URL: z.string().default('https://eth.llamarpc.com'),
  BSC_RPC_URL: z.string().default('https://bsc-dataseed.binance.org'),
  BASE_RPC_URL: z.string().default('https://mainnet.base.org'),
  BSC_TESTNET_RPC_URL: z.string().default('https://data-seed-prebsc-1-s1.binance.org:8545'),

  GRIDEX_ADDRESS: z.string().default('0x4F805a66448F53Fb6bFa5A7E29dBaE36c158aacF'),

  // Moralis API key (optional – used for token metadata of long-tail tokens)
  MORALIS_API_KEY: z.string().optional(),

  // Binance API base URL (optional – override for regions where api.binance.com is blocked)
  // Examples: https://api1.binance.com, https://api2.binance.com, https://api3.binance.com
  BINANCE_API_BASE: z.string().optional(),

  // LLM Configuration (optional – for AI-powered grid strategy generation)
  LLM_API_KEY: z.string().optional(),
  LLM_API_BASE: z.string().default('https://api.openai.com/v1'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['text', 'json']).optional(),
});

export type Env = z.infer<typeof envSchema>;

function isRunningInDocker(): boolean {
  return fs.existsSync('/.dockerenv');
}

function resolveDatabaseUrl(databaseUrl: string, dbHost?: string): string {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  if (dbHost) {
    parsed.hostname = dbHost;
    return parsed.toString();
  }

  if (parsed.hostname === 'host.docker.internal' && !isRunningInDocker()) {
    parsed.hostname = 'localhost';
    console.warn(
      '[env] DATABASE_URL host "host.docker.internal" is not suitable outside Docker; falling back to "localhost". ' +
        'Set DB_HOST to override this behavior.',
    );
  }

  return parsed.toString();
}

const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Logger is not available yet (it depends on env), so use stderr directly.
    // pino is not initialised at this point – keep console.error here on purpose.
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return {
    ...result.data,
    DATABASE_URL: resolveDatabaseUrl(result.data.DATABASE_URL, result.data.DB_HOST),
  };
};

export const env = parseEnv();
