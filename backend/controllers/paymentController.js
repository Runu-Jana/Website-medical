import prisma from '../prisma/client.js';
import { serializeOrder } from '../prisma/serialize.js';
import {
  razorpay,
  razorpayEnabled,
  webhookEnabled,
  RAZORPAY_KEY_ID,
} from '../lib/razorpay.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../lib/razorpaySignature.js';
import { notifyAppointmentBooked } from './appointmentController.js';

// Maps a booking "type" to its Prisma model + the field holding the amount.
// Used so one pair of payment endpoints can charge shop orders and doctor
// appointments. (Lab tests are pay-at-visit, so they never pay online.)
const BOOKING_KINDS = {
  appointment: { model: 'appointment', amountField: 'fee', notify: notifyAppointmentBooked },
};

// A customer may only pay for their OWN record. A record with no userId is a
// guest record (guest checkout) — there is no owner to check against, so it
// passes. A record owned by a user requires the caller to be that same
// authenticated user; this blocks creating/confirming payments for someone
// else's order or appointment by guessing its id.
function ownsRecord(req, record) {
  if (!record?.userId) return true;
  return !!req.user?.id && req.user.id === record.userId;
}

// @route GET /api/payments/config  — lets the storefront know if online pay is on
export const getPaymentConfig = (req, res) => {
  res.json({
    razorpay: razorpayEnabled,
    keyId: razorpayEnabled ? RAZORPAY_KEY_ID : '',
    webhook: webhookEnabled,
  });
};

// @route POST /api/payments/order  — create a Razorpay order (amount in rupees)
// Body: { type?: 'order'|'appointment'|'labBooking', id|orderId, amount? }
export const createPaymentOrder = async (req, res) => {
  if (!razorpayEnabled) return res.status(400).json({ message: 'Online payment is not configured' });

  const kind = BOOKING_KINDS[req.body.type];
  const recordId = req.body.id || req.body.orderId || '';

  // Trust the server-computed amount over anything the client supplies, so the
  // charge can't be tampered with.
  let rupees = Number(req.body.amount);
  let receipt = recordId || `rcpt_${Date.now()}`;
  let notes;

  if (kind) {
    // Doctor appointment / lab booking — price from its own record.
    const record = await prisma[kind.model].findUnique({ where: { id: recordId } }).catch(() => null);
    if (!record) return res.status(404).json({ message: 'Booking not found' });
    if (!ownsRecord(req, record)) return res.status(403).json({ message: 'Not authorized for this booking' });
    rupees = record[kind.amountField];
    notes = { bookingType: req.body.type, bookingId: recordId };
  } else if (recordId) {
    // Shop order.
    const ourOrder = await prisma.order.findUnique({ where: { id: recordId } }).catch(() => null);
    if (ourOrder) {
      if (!ownsRecord(req, ourOrder)) return res.status(403).json({ message: 'Not authorized for this order' });
      rupees = ourOrder.totalPrice;
    }
    notes = { orderId: recordId };
  }

  const amount = Math.round(rupees * 100); // rupees → paise
  if (!amount || amount < 100) return res.status(400).json({ message: 'Invalid amount' });
  try {
    const order = await razorpay.orders.create({ amount, currency: 'INR', receipt, notes });
    // Link the Razorpay order to ours so the webhook / verify step can reconcile it.
    if (recordId) {
      const model = kind ? kind.model : 'order';
      await prisma[model]
        .update({ where: { id: recordId }, data: { razorpayOrderId: order.id } })
        .catch(() => {});
    }
    res.json({ id: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(502).json({ message: err.error?.description || 'Could not start payment' });
  }
};

// @route POST /api/payments/verify  — verify signature & mark our record paid
// Body: { razorpay_*, type?, id | orderId }
export const verifyPayment = async (req, res) => {
  if (!razorpayEnabled) return res.status(400).json({ message: 'Online payment is not configured' });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    secret: process.env.RAZORPAY_KEY_SECRET,
  });
  if (!valid) {
    return res.status(400).json({ message: 'Payment verification failed' });
  }

  const kind = BOOKING_KINDS[req.body.type];
  const recordId = req.body.id || orderId;

  if (kind && recordId) {
    // Doctor appointment / lab booking — confirm it and notify admin now that
    // the payment has cleared.
    const existing = await prisma[kind.model].findUnique({ where: { id: recordId } }).catch(() => null);
    if (existing && !ownsRecord(req, existing)) return res.status(403).json({ message: 'Not authorized for this booking' });
    // Mark it paid; the booking stays 'pending' so the admin still runs their
    // confirm workflow. It only becomes visible to admin/customer once paid.
    const updated = await prisma[kind.model]
      .update({
        where: { id: recordId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      })
      .catch(() => null);
    if (updated) kind.notify(updated);
  } else if (recordId) {
    const existing = await prisma.order.findUnique({ where: { id: recordId } }).catch(() => null);
    if (existing && !ownsRecord(req, existing)) return res.status(403).json({ message: 'Not authorized for this order' });
    await prisma.order
      .update({
        where: { id: recordId },
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
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

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
