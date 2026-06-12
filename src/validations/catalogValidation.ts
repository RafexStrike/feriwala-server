import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().default('')
});

export const tagSchema = z.object({
  name: z.string().min(2).max(120)
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  briefDescription: z.string().min(5).max(300),
  detailedDescription: z.string().min(20).max(5000),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  stock: z.number().int().nonnegative(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  images: z.array(z.string()).default([])
});

export const productUpdateSchema = productSchema.partial();

export const inventoryUpdateSchema = z.object({
  stock: z.number().int().nonnegative()
});

