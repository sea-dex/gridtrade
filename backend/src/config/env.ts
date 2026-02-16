import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().default('postgres://postgres:password@localhost:5432/gridex'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val: string) => val.split(',')),

  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),

  ETH_RPC_URL: z.string().default('https://eth.llamarpc.com'),
  BSC_RPC_URL: z.string().default('https://bsc-dataseed.binance.org'),
  BASE_RPC_URL: z.string().default('https://mainnet.base.org'),
  BSC_TESTNET_RPC_URL: z.string().default('https://data-seed-prebsc-1-s1.binance.org:8545'),

  GRIDEX_ADDRESS: z.string().default('0x5F7943e9424eF9370392570D06fFA630a5124e9A'),

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
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Logger is not available yet (it depends on env), so use stderr directly.
    // pino is not initialised at this point – keep console.error here on purpose.
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
