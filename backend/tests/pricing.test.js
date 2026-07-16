import { describe, it, expect } from 'vitest';
import {
  memberDiscount,
  shippingFor,
  orderTotal,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING,
} from '../lib/pricing.js';

describe('memberDiscount', () => {
  it('is zero for non-members', () => {
    expect(memberDiscount(1000, false, 5)).toBe(0);
  });
  it('applies the percent for members (rounded)', () => {
    expect(memberDiscount(1000, true, 5)).toBe(50);
    expect(memberDiscount(999, true, 5)).toBe(50); // 49.95 → 50
  });
});

describe('shippingFor', () => {
  it('is free for members', () => {
    expect(shippingFor(200, true)).toBe(0);
  });
  it('is free above the threshold', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD + 1, false)).toBe(0);
  });
  it('is flat at/below the threshold', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD, false)).toBe(FLAT_SHIPPING);
    expect(shippingFor(100, false)).toBe(FLAT_SHIPPING);
  });
});

describe('orderTotal', () => {
  it('sums items + shipping minus discounts', () => {
    expect(orderTotal({ itemsPrice: 500, discountPrice: 25, couponDiscount: 50, shippingPrice: 60 })).toBe(485);
  });
  it('never goes negative', () => {
    expect(orderTotal({ itemsPrice: 100, couponDiscount: 500 })).toBe(0);
  });
  it('member free-shipping + discount example', () => {
    const itemsPrice = 1200;
    const discountPrice = memberDiscount(itemsPrice, true, 5); // 60
    const shippingPrice = shippingFor(itemsPrice, true); // 0
    expect(orderTotal({ itemsPrice, discountPrice, shippingPrice })).toBe(1140);
  });
});
