import crypto from 'crypto';
import prisma from '../prisma/client.js';
import { razorpay, razorpayEnabled, RAZORPAY_KEY_ID } from '../lib/razorpay.js';

// @route GET /api/payments/config  — lets the storefront know if online pay is on
export const getPaymentConfig = (req, res) => {
  res.json({ razorpay: razorpayEnabled, keyId: razorpayEnabled ? RAZORPAY_KEY_ID : '' });
};

// @route POST /api/payments/order  — create a Razorpay order (amount in rupees)
export const createPaymentOrder = async (req, res) => {
  if (!razorpayEnabled) return res.status(400).json({ message: 'Online payment is not configured' });
  const amount = Math.round(Number(req.body.amount) * 100); // rupees → paise
  if (!amount || amount < 100) return res.status(400).json({ message: 'Invalid amount' });
  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: req.body.orderId || `rcpt_${Date.now()}`,
    });
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
