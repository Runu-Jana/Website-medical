import crypto from 'crypto';
import prisma from '../prisma/client.js';
import { serializeOrder } from '../prisma/serialize.js';
import {
  razorpay,
  razorpayEnabled,
  webhookEnabled,
  RAZORPAY_KEY_ID,
} from '../lib/razorpay.js';

// @route GET /api/payments/config  — lets the storefront know if online pay is on
export const getPaymentConfig = (req, res) => {
  res.json({
    razorpay: razorpayEnabled,
    keyId: razorpayEnabled ? RAZORPAY_KEY_ID : '',
    webhook: webhookEnabled,
  });
};

// @route POST /api/payments/order  — create a Razorpay order (amount in rupees)
export const createPaymentOrder = async (req, res) => {
  if (!razorpayEnabled) return res.status(400).json({ message: 'Online payment is not configured' });
  const amount = Math.round(Number(req.body.amount) * 100); // rupees → paise
  if (!amount || amount < 100) return res.status(400).json({ message: 'Invalid amount' });
  const orderId = req.body.orderId || '';
  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: orderId || `rcpt_${Date.now()}`,
      notes: orderId ? { orderId } : undefined,
    });
    // Link the Razorpay order to ours so the webhook can reconcile it later.
    if (orderId) {
      await prisma.order
        .update({ where: { id: orderId }, data: { razorpayOrderId: order.id } })
        .catch(() => {});
    }
    res.json({ id: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(502).json({ message: err.error?.description || 'Could not start payment' });
  }
};

// @route POST /api/payments/verify  — verify signature & mark our order paid
export const verifyPayment = async (req, res) => {
  if (!razorpayEnabled) return res.status(400).json({ message: 'Online payment is not configured' });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed' });
  }

  if (orderId) {
    await prisma.order
      .update({
        where: { id: orderId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          status: 'processing',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      })
      .catch(() => {});
  }
  res.json({ success: true });
};

// @route GET /api/payments/:paymentId  (admin) — fetch a payment for reconciliation
export const getPaymentDetails = async (req, res) => {
  if (!razorpayEnabled) return res.status(400).json({ message: 'Online payment is not configured' });
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);
    res.json(payment);
  } catch (err) {
    res.status(404).json({ message: err.error?.description || 'Payment not found' });
  }
};

// @route POST /api/payments/refund  (admin) — full or partial refund for an order
// Body: { orderId, amount? }  — amount in rupees; omit for a full refund.
export const refundPayment = async (req, res) => {
  if (!razorpayEnabled) return res.status(400).json({ message: 'Online payment is not configured' });
  const { orderId, amount } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!order.isPaid || !order.razorpayPaymentId) {
    return res.status(400).json({ message: 'Order has no captured online payment to refund' });
  }
  if (order.isRefunded) return res.status(400).json({ message: 'Order is already refunded' });

  // Partial amount (rupees → paise) if given; otherwise Razorpay refunds the full payment.
  const refundArgs = { speed: 'normal', notes: { orderId } };
  if (amount != null) {
    const paise = Math.round(Number(amount) * 100);
    if (!paise || paise < 100) return res.status(400).json({ message: 'Invalid refund amount' });
    refundArgs.amount = paise;
  }

  try {
    const refund = await razorpay.payments.refund(order.razorpayPaymentId, refundArgs);
    const refundedRupees = (refund.amount || 0) / 100;
    // Full refund flips the order to refunded/cancelled; partial keeps it active.
    const fullRefund = refundedRupees >= order.totalPrice;
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        isRefunded: fullRefund,
        refundedAt: new Date(),
        refundId: refund.id,
        refundAmount: (order.refundAmount || 0) + refundedRupees,
        ...(fullRefund ? { status: 'cancelled' } : {}),
      },
    });
    res.json({ success: true, refund, order: serializeOrder(updated) });
  } catch (err) {
    res.status(502).json({ message: err.error?.description || 'Refund could not be processed' });
  }
};

// @route POST /api/payments/webhook  — Razorpay server-to-server confirmation
export const webhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(400).json({ message: 'Webhook not configured' });

  const signature = req.headers['x-razorpay-signature'];
  const payload = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (expected !== signature) return res.status(400).json({ message: 'Invalid signature' });

  // Acknowledge fast; reconcile in the background so Razorpay doesn't retry.
  res.json({ received: true });

  const event = req.body || {};
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const entity = event.payload?.payment?.entity || event.payload?.order?.entity || {};
    const rzpOrderId = entity.order_id || entity.id;
    const ourOrderId = entity.notes?.orderId;
    const where = ourOrderId ? { id: ourOrderId } : { razorpayOrderId: rzpOrderId };
    await prisma.order
      .updateMany({
        where,
        data: {
          isPaid: true,
          paidAt: new Date(),
          status: 'processing',
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: event.payload?.payment?.entity?.id,
        },
      })
      .catch(() => {});
  }

  // Reconcile refunds initiated from the Razorpay dashboard.
  if (event.event === 'refund.processed' || event.event === 'refund.created') {
    const refund = event.payload?.refund?.entity || {};
    const ourOrderId = refund.notes?.orderId;
    const where = ourOrderId
      ? { id: ourOrderId }
      : { razorpayPaymentId: refund.payment_id };
    await prisma.order
      .updateMany({
        where,
        data: {
          isRefunded: true,
          refundedAt: new Date(),
          refundId: refund.id,
          refundAmount: (refund.amount || 0) / 100,
        },
      })
      .catch(() => {});
  }
};
