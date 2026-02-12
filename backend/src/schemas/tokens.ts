import { z } from 'zod';
import { getSupportedChainIds } from '../config/chains.js';

// ---------------------------------------------------------------------------
// Query schemas
// ---------------------------------------------------------------------------

const chainIdQuerySchema = z.coerce
  .number()
  .refine((val) => getSupportedChainIds().includes(val), {
    message: 'Invalid chain ID',
  });

export const getTokenListQuerySchema = z.object({
  /** Chain ID to fetch tokens for */
  chain_id: chainIdQuerySchema,
});

export type GetTokenListQuery = z.infer<typeof getTokenListQuerySchema>;

// ---------------------------------------------------------------------------
// Token info response schema
// ---------------------------------------------------------------------------

export const tokenItemSchema = z.object({
  /** Contract address */
  address: z.string(),
  /** Token symbol */
  symbol: z.string(),
  /** Human-readable name */
  name: z.string(),
  /** Token decimals */
  decimals: z.number(),
  /** Logo URL */
  logo: z.string(),
  /** Total / max supply (string for precision) */
  totalSupply: z.string().optional(),
  /** Display priority – lower = higher in list */
  priority: z.number(),
  /** Whether this token can be used as a quote token */
  isQuote: z.boolean(),
  /** Optional tags */
  tags: z.array(z.string()).optional(),
});

export type TokenItem = z.infer<typeof tokenItemSchema>;

// ---------------------------------------------------------------------------
// List response schemas
// ---------------------------------------------------------------------------

export const tokenListResponseSchema = z.object({
  /** Chain ID */
  chain_id: z.number(),
  /** Token list */
  tokens: z.array(tokenItemSchema),
});

export type TokenListResponse = z.infer<typeof tokenListResponseSchema>;
