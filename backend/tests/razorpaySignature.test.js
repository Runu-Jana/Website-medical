import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  paymentSignature,
  verifyPaymentSignature,
  webhookSignature,
  verifyWebhookSignature,
} from '../lib/razorpaySignature.js';

const SECRET = 'test_secret_key';

describe('payment signature verification', () => {
  const orderId = 'order_ABC123';
  const paymentId = 'pay_XYZ789';

  it('accepts a correctly-signed payment', () => {
    const signature = paymentSignature(orderId, paymentId, SECRET);
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(true);
  });

  it('matches the documented Razorpay HMAC formula', () => {
    const expected = crypto.createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    expect(paymentSignature(orderId, paymentId, SECRET)).toBe(expected);
  });

  it('rejects a tampered payment id', () => {
    const signature = paymentSignature(orderId, paymentId, SECRET);
    expect(verifyPaymentSignature({ orderId, paymentId: 'pay_HACKED', signature, secret: SECRET })).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const signature = paymentSignature(orderId, paymentId, SECRET);
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: 'other' })).toBe(false);
  });

  it('rejects a missing signature or secret', () => {
    expect(verifyPaymentSignature({ orderId, paymentId, signature: '', secret: SECRET })).toBe(false);
    expect(verifyPaymentSignature({ orderId, paymentId, signature: 'x', secret: '' })).toBe(false);
  });
});

describe('webhook signature verification', () => {
  const body = JSON.stringify({ event: 'payment.captured', payload: {} });

  it('accepts a correctly-signed webhook body', () => {
    const sig = webhookSignature(body, SECRET);
    expect(verifyWebhookSignature(body, sig, SECRET)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const sig = webhookSignature(body, SECRET);
    expect(verifyWebhookSignature(body + ' ', sig, SECRET)).toBe(false);
  });
});
