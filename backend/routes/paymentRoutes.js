import express from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment,
  webhook,
} from '../controllers/paymentController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';
import { paymentLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public / customer. optionalAuth links a logged-in user so the controller can
// enforce that a customer only pays for their OWN order/appointment; guests
// (no account) still pass through for guest checkout. Rate-limited to stop
// abuse of Razorpay order creation.
router.get('/config', getPaymentConfig);
router.post('/order', paymentLimiter, optionalAuth, createPaymentOrder);
router.post('/verify', paymentLimiter, optionalAuth, verifyPayment);
router.post('/webhook', webhook); // signature-verified inside the handler

// Admin
router.post('/refund', protect, admin, refundPayment);
router.get('/:paymentId', protect, admin, getPaymentDetails);

export default router;
