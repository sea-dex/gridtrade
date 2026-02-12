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

export const getFeeListQuerySchema = z.object({
  /** Chain ID to fetch fee tiers for */
  chain_id: chainIdQuerySchema,
});

export type GetFeeListQuery = z.infer<typeof getFeeListQuerySchema>;

// ---------------------------------------------------------------------------
// Fee item response schema
// ---------------------------------------------------------------------------

export const feeItemSchema = z.object({
  /** Fee value on-chain (uint32, denominator = 1,000,000) */
  value: z.number(),
  /** Human-readable label, e.g. "0.30%" */
  label: z.string(),
  /** Short description of the fee tier */
  description: z.string(),
  /** Whether this tier is the default selection */
  isDefault: z.boolean(),
  /** Display priority – lower = higher in list */
  priority: z.number(),
});

export type FeeItem = z.infer<typeof feeItemSchema>;

// ---------------------------------------------------------------------------
// List response schema
// ---------------------------------------------------------------------------

export const feeListResponseSchema = z.object({
  /** Chain ID */
  chain_id: z.number(),
  /** Available fee tiers */
  fees: z.array(feeItemSchema),
});

export type FeeListResponse = z.infer<typeof feeListResponseSchema>;
