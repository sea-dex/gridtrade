import { z } from 'zod';
import { getSupportedChainIds } from '../config/chains.js';

// Common query parameters
export const chainIdSchema = z.coerce
  .number()
  .refine((val) => getSupportedChainIds().includes(val), {
    message: 'Invalid chain ID',
  })
  .default(97);

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(100).default(20),
});

export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

export const periodSchema = z.enum(['24h', '7d', '30d', 'all']).default('7d');

// Common response types
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T): z.ZodObject<{
  items: z.ZodArray<T>;
  total: z.ZodNumber;
  page: z.ZodNumber;
  page_size: z.ZodNumber;
}> =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
  });

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodObject<{
  success: z.ZodBoolean;
  data: T;
  message: z.ZodOptional<z.ZodString>;
}> =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

// Type exports
export type ChainId = z.infer<typeof chainIdSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Period = z.infer<typeof periodSchema>;
