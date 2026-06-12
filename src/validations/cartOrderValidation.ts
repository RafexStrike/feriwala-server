import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive()
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().positive()
});

export const checkoutSchema = z.object({
  shippingAddress: z.string().min(10).max(500),
  customerEmail: z.string().email().optional(),
  notes: z.string().max(1000).optional().default('')
});

export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'completed', 'canceled']),
  note: z.string().max(500).optional().default('')
});

