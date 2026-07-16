import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, orderSchema } from '../middleware/validate.js';

describe('registerSchema', () => {
  it('accepts a valid signup and keeps extra-safe fields', () => {
    const r = registerSchema.safeParse({ name: 'Asha', email: 'a@b.com', password: 'secret1' });
    expect(r.success).toBe(true);
  });
  it('rejects a bad email', () => {
    expect(registerSchema.safeParse({ email: 'nope', password: 'secret1' }).success).toBe(false);
  });
  it('rejects a short password', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '123' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires email + password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });
});

describe('orderSchema', () => {
  const item = { product: 'p1', name: 'Crocin', price: 30, qty: 2, image: 'x', gstPercent: 5 };
  it('accepts a normal cart (passing through extra item fields)', () => {
    const r = orderSchema.safeParse({ items: [item], paymentMethod: 'Cash on Delivery' });
    expect(r.success).toBe(true);
    expect(r.data.items[0].gstPercent).toBe(5);
  });
  it('rejects an empty cart', () => {
    expect(orderSchema.safeParse({ items: [] }).success).toBe(false);
  });
  it('rejects a non-positive quantity', () => {
    expect(orderSchema.safeParse({ items: [{ ...item, qty: 0 }] }).success).toBe(false);
  });
  it('rejects a negative price', () => {
    expect(orderSchema.safeParse({ items: [{ ...item, price: -5 }] }).success).toBe(false);
  });
});
