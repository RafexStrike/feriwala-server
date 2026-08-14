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
  notes: z.string().max(1000).optional().default(''),
  whatsappNumber: z.string()
    .transform(val => val.replace(/[\s-]/g, ''))
    .refine(val => /^(?:\+8801|01)[3-9]\d{8}$/.test(val), "Invalid Bangladeshi mobile number")
    .transform(val => val.startsWith('01') ? '+88' + val : val),
  facebookProfileLink: z.string().trim().optional().refine(val => {
    if (!val) return true;
    try {
      const url = new URL(val);
      return url.hostname.includes('facebook.com') || url.hostname.includes('fb.com');
    } catch {
      return false;
    }
  }, { message: "Must be a valid Facebook profile URL" })
});

export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'completed', 'canceled']),
  note: z.string().max(500).optional().default('')
});
