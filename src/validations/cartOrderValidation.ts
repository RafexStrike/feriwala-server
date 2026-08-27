import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive()
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().positive()
});

export const orderSourceSchema = z.enum([
  'website',
  'facebook',
  'phone',
  'physical_store',
  'in_person',
  'whatsapp',
  'telegram',
  'other'
]);

export const orderItemSchema = z.object({
  productId: z.string().min(1),
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

export const manualOrderSchema = z.object({
  source: orderSourceSchema.default('website'),
  status: z.enum(['pending', 'completed', 'canceled']).default('pending'),
  shippingAddress: z.string().trim().max(500).optional().default(''),
  customerEmail: z.string().trim().email().optional().or(z.literal('')).default(''),
  whatsappNumber: z.string().trim().max(50).optional().default(''),
  facebookProfileLink: z.string().trim().optional().default(''),
  externalCustomerName: z.string().trim().max(200).optional().default(''),
  externalCustomerPhone: z.string().trim().max(50).optional().default(''),
  externalCustomerFacebookProfileLink: z.string().trim().optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
  items: z.array(orderItemSchema).min(1)
});

export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'completed', 'canceled']),
  note: z.string().max(500).optional().default('')
});
