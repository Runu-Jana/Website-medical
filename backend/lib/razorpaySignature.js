import crypto from 'crypto';

// Pure Razorpay signature helpers — no SDK, no I/O — so the money-critical
// verification path is unit-testable and uses a timing-safe comparison.

const hmac = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');

// Constant-time string compare (avoids leaking equality via timing).
const safeEqual = (a, b) => {
  if (!a || !b) return false;
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

// Signature Razorpay sends on a successful checkout: HMAC(order_id|payment_id).
export const paymentSignature = (orderId, paymentId, secret) => hmac(secret, `${orderId}|${paymentId}`);

export const verifyPaymentSignature = ({ orderId, paymentId, signature, secret }) => {
  if (!secret || !signature) return false;
  return safeEqual(paymentSignature(orderId, paymentId, secret), signature);
};

// Signature on a server-to-server webhook: HMAC(rawBody).
export const webhookSignature = (rawBody, secret) => hmac(secret, rawBody);

export const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!secret || !signature) return false;
  return safeEqual(webhookSignature(rawBody, secret), signature);
};
