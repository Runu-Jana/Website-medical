import { z } from 'zod';

// Returns Express middleware that validates & normalises req.body against a Zod
// schema, replacing it with the parsed result. On failure it responds 400 with
// the first helpful message — consistent input validation in one place.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first?.path?.join('.') ;
    return res.status(400).json({ message: field ? `${field}: ${first.message}` : first?.message || 'Invalid input' });
  }
  req.body = result.data;
  next();
};

// ── Shared schemas ────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email('a valid email is required').max(200),
  password: z.string().min(6, 'must be at least 6 characters').max(200),
  phone: z.string().trim().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('a valid email is required'),
  password: z.string().min(1, 'is required'),
});

const orderItemSchema = z.object({
  product: z.string().optional(),
  name: z.string().trim().min(1).max(300),
  price: z.number().nonnegative(),
  qty: z.number().int().positive().max(1000),
}).passthrough();

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'at least one item is required'),
  shippingAddress: z.record(z.any()).optional(),
  paymentMethod: z.string().max(60).optional(),
  couponCode: z.string().trim().max(60).optional(),
  prescriptionId: z.string().max(60).optional(),
}).passthrough();
