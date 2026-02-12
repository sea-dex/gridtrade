import { z } from 'zod';
import { chainIdSchema } from './common.js';

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

// Type exports
export type OrderInfo = z.infer<typeof orderInfoSchema>;
export type OrderFill = z.infer<typeof orderFillSchema>;
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
export type GetOrderDetailQuery = z.infer<typeof getOrderDetailQuerySchema>;
export type GetOrderDetailParams = z.infer<typeof getOrderDetailParamsSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
export type OrderFillsResponse = z.infer<typeof orderFillsResponseSchema>;
