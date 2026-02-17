import { z } from 'zod';
import { chainIdSchema, paginationSchema } from './common.js';

// Order info schema
export const orderInfoSchema = z.object({
  order_id: z.string(),
  grid_id: z.number(),
  pair_id: z.number(),
  is_ask: z.boolean(),
  compound: z.boolean(),
  oneshot: z.boolean(),
  fee: z.number(),
  status: z.number(),
  amount: z.string(),
  rev_amount: z.string(),
  initial_base_amount: z.string(),
  initial_quote_amount: z.string(),
  price: z.string(),
  rev_price: z.string(),
});

// Order fill schema
export const orderFillSchema = z.object({
  tx_hash: z.string(),
  taker: z.string(),
  order_id: z.string(),
  filled_amount: z.string(),
  filled_volume: z.string(),
  is_ask: z.boolean(),
  timestamp: z.string().datetime(),
});

// Query schemas
export const getOrdersQuerySchema = z.object({
  chain_id: chainIdSchema,
  grid_id: z.coerce.number().optional(),
  pair_id: z.coerce.number().optional(),
  is_ask: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export const getOrderDetailQuerySchema = z.object({
  chain_id: chainIdSchema,
});

export const getOrderDetailParamsSchema = z.object({
  order_id: z.coerce.string(),
});

// Response schemas
export const orderListResponseSchema = z.object({
  orders: z.array(orderInfoSchema),
  total: z.number(),
});

export const orderFillsResponseSchema = z.object({
  fills: z.array(orderFillSchema),
  total: z.number(),
});

// Flat order with grid info schema (for "All Grids" flat order view)
export const orderWithGridInfoSchema = z.object({
  order_id: z.string(),
  grid_id: z.number(),
  pair_id: z.number(),
  is_ask: z.boolean(),
  compound: z.boolean(),
  fee: z.number(),
  status: z.number(),
  amount: z.string(),
  rev_amount: z.string(),
  price: z.string(),
  rev_price: z.string(),
  // Grid-level info
  owner: z.string(),
  base_token: z.string(),
  quote_token: z.string(),
  profits: z.string(),
  grid_status: z.number(),
});

export const getOrdersWithGridInfoQuerySchema = z.object({
  chain_id: chainIdSchema,
  owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address').optional(),
  grid_id: z.coerce.number().optional(),
  ...paginationSchema.shape,
});

export const orderWithGridInfoListResponseSchema = z.object({
  orders: z.array(orderWithGridInfoSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
});

// Type exports
export type OrderInfo = z.infer<typeof orderInfoSchema>;
export type OrderFill = z.infer<typeof orderFillSchema>;
export type OrderWithGridInfo = z.infer<typeof orderWithGridInfoSchema>;
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
export type GetOrdersWithGridInfoQuery = z.infer<typeof getOrdersWithGridInfoQuerySchema>;
export type GetOrderDetailQuery = z.infer<typeof getOrderDetailQuerySchema>;
export type GetOrderDetailParams = z.infer<typeof getOrderDetailParamsSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
export type OrderWithGridInfoListResponse = z.infer<typeof orderWithGridInfoListResponseSchema>;
export type OrderFillsResponse = z.infer<typeof orderFillsResponseSchema>;
