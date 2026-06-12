import { z } from 'zod';

export const userUpdateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional()
});

export const notificationEmailSchema = z.object({
  email: z.string().email(),
  isActive: z.boolean().optional().default(true),
  notificationTypes: z.array(z.string().min(1)).optional().default(['order-status'])
});

