import { describe, it, expect } from 'vitest';
import { normalizeCode, computeCouponDiscount } from '../lib/coupons.js';

// These exercise the store-wide ("all" scope) paths, which are pure and never
// touch the database — the money math a customer sees at checkout.

describe('normalizeCode', () => {
  it('trims and upper-cases', () => {
    expect(normalizeCode('  welcome15 ')).toBe('WELCOME15');
    expect(normalizeCode(null)).toBe('');
  });
});

const items = [{ productId: 'a', price: 200, qty: 2 }]; // subtotal 400

describe('computeCouponDiscount (all scope)', () => {
  it('applies a percent discount', async () => {
    const { discount } = await computeCouponDiscount(
      { type: 'percent', value: 10, scope: 'all', minOrder: 0, maxDiscount: 0 },
      items,
      400
    );
    expect(discount).toBe(40);
  });

  it('caps a percent discount at maxDiscount', async () => {
    const { discount } = await computeCouponDiscount(
      { type: 'percent', value: 50, scope: 'all', minOrder: 0, maxDiscount: 100 },
      items,
      400
    );
    expect(discount).toBe(100); // 200 capped to 100
  });

  it('applies a fixed discount', async () => {
    const { discount } = await computeCouponDiscount(
      { type: 'fixed', value: 75, scope: 'all', minOrder: 0, maxDiscount: 0 },
      items,
      400
    );
    expect(discount).toBe(75);
  });

  it('rejects when below minOrder', async () => {
    const res = await computeCouponDiscount(
      { type: 'percent', value: 10, scope: 'all', minOrder: 500, maxDiscount: 0 },
      items,
      400
    );
    expect(res.discount).toBe(0);
    expect(res.error).toBeTruthy();
  });

  it('never discounts more than the cart', async () => {
    const { discount } = await computeCouponDiscount(
      { type: 'fixed', value: 9999, scope: 'all', minOrder: 0, maxDiscount: 0 },
      items,
      400
    );
    expect(discount).toBeLessThanOrEqual(400);
  });
});
