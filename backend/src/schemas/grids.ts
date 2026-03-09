import { z } from 'zod';
import { chainIdSchema, paginationSchema, addressSchema } from './common.js';

// Grid status enum
export const gridStatusSchema = z.enum(['active', 'cancelled', 'completed']).or(z.coerce.number());

// Token info schema for grid response (simplified version for grid config)
export const gridTokenInfoSchema = z.object({
  address: addressSchema,
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  logo: z.string(),
});

// Export the inferred type
export type GridTokenInfo = z.infer<typeof gridTokenInfoSchema>;

// Grid configuration schema
export const gridConfigSchema = z.object({
  grid_id: z.number(),
  owner: addressSchema,
  pair_id: z.number(),
  base_token: z.string(),
  quote_token: z.string(),
  base_token_info: gridTokenInfoSchema,
  quote_token_info: gridTokenInfoSchema,
  ask_order_count: z.number(),
  bid_order_count: z.number(),
  initial_base_amount: z.string(),
  initial_quote_amount: z.string(),
  profits: z.string(),
  fee: z.number(),
  compound: z.boolean(),
  oneshot: z.boolean(),
  status: z.number(),
  created_at: z.string().datetime(),
});

// Grid order schema
export const gridOrderSchema = z.object({
  order_id: z.string(),
  hex_order_id: z.string().nullable().optional(),
  grid_id: z.number(),
  is_ask: z.boolean(),
  price: z.string(),
  amount: z.string(),
  rev_amount: z.string(),
  rev_price: z.string(),
  status: z.number(),
});

export const gridFillSchema = z.object({
  tx_hash: z.string(),
  taker: addressSchema,
  order_id: z.string(),
  hex_order_id: z.string().nullable().optional(),
  grid_id: z.number(),
  is_ask: z.boolean(),
  filled_amount: z.string(),
  filled_volume: z.string(),
  price_gap: z.string().nullable().optional(),
  grid_profit: z.string().nullable().optional(),
  order_fee: z.string().nullable().optional(),
  is_reverse: z.boolean().nullable().optional(),
  timestamp: z.string().datetime(),
});

// Query schemas
export const getGridsQuerySchema = z.object({
  chain_id: chainIdSchema,
  owner: addressSchema.optional(),
  pair_id: z.coerce.number().optional(),
  base_token: addressSchema.optional(),
  quote_token: addressSchema.optional(),
  oneshot: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  status: z.coerce.number().optional(),
  ...paginationSchema.shape,
});

export const getPairIdQuerySchema = z.object({
  chain_id: chainIdSchema,
  base_token: addressSchema,
  quote_token: addressSchema,
});

export const getGridDetailQuerySchema = z.object({
  chain_id: chainIdSchema,
});

export const getGridDetailParamsSchema = z.object({
  grid_id: z.coerce.number(),
});

// Response schemas
export const gridListResponseSchema = z.object({
  grids: z.array(gridConfigSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
});

// Grid with its orders grouped together
export const gridWithOrdersSchema = z.object({
  config: gridConfigSchema,
  orders: z.array(gridOrderSchema),
});

export const gridWithOrdersListResponseSchema = z.object({
  grids: z.array(gridWithOrdersSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
});

export const gridDetailResponseSchema = z.object({
  config: gridConfigSchema,
  orders: z.array(gridOrderSchema),
});

export const gridProfitsResponseSchema = z.object({
  grid_id: z.number(),
  profits: z.string(),
  quote_token: z.string(),
});

export const gridFillsResponseSchema = z.object({
  grid_id: z.number(),
  fills: z.array(gridFillSchema),
  total: z.number(),
});

// Pair ID response schema
export const pairIdResponseSchema = z.object({
  pair_id: z.number().nullable(),
  base_token: addressSchema,
  quote_token: addressSchema,
});

// Type exports
export type GridConfig = z.infer<typeof gridConfigSchema>;
export type GridOrder = z.infer<typeof gridOrderSchema>;
export type GridFill = z.infer<typeof gridFillSchema>;
export type GridWithOrders = z.infer<typeof gridWithOrdersSchema>;
export type GetGridsQuery = z.infer<typeof getGridsQuerySchema>;
export type GetGridDetailQuery = z.infer<typeof getGridDetailQuerySchema>;
export type GetGridDetailParams = z.infer<typeof getGridDetailParamsSchema>;
export type GridListResponse = z.infer<typeof gridListResponseSchema>;
export type GridWithOrdersListResponse = z.infer<typeof gridWithOrdersListResponseSchema>;
export type GridDetailResponse = z.infer<typeof gridDetailResponseSchema>;
export type GridProfitsResponse = z.infer<typeof gridProfitsResponseSchema>;
export type GridFillsResponse = z.infer<typeof gridFillsResponseSchema>;
