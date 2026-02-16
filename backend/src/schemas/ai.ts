import { z } from 'zod';

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

const tokenInfoSchema = z.object({
  symbol: z.string(),
  address: z.string(),
  decimals: z.number(),
});

export const aiStrategyRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  base_token: tokenInfoSchema,
  quote_token: tokenInfoSchema,
  current_price: z.number().positive(),
  chain_id: z.number(),
  locale: z.string().optional(),
});

export type AiStrategyRequest = z.infer<typeof aiStrategyRequestSchema>;

// ---------------------------------------------------------------------------
// Response — discriminated union on `status`
// ---------------------------------------------------------------------------

const strategySchema = z.object({
  askPrice0: z.string(),
  bidPrice0: z.string(),
  askGap: z.string(),
  bidGap: z.string(),
  askOrderCount: z.string(),
  bidOrderCount: z.string(),
  amountPerGrid: z.string(),
  compound: z.boolean(),
});

export const aiStrategySuccessSchema = z.object({
  status: z.literal('success'),
  strategy: strategySchema,
  analysis: z.string(),
});

export const aiStrategyClarifySchema = z.object({
  status: z.literal('clarify'),
  questions: z.array(z.string()),
  analysis: z.string(),
});

export const aiStrategyResponseSchema = z.discriminatedUnion('status', [
  aiStrategySuccessSchema,
  aiStrategyClarifySchema,
]);

export type AiStrategyResponse = z.infer<typeof aiStrategyResponseSchema>;
