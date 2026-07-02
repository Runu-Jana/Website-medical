import express from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment,
  webhook,
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / customer
router.get('/config', getPaymentConfig);
router.post('/order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', webhook); // signature-verified inside the handler

// Admin
router.post('/refund', protect, admin, refundPayment);
router.get('/:paymentId', protect, admin, getPaymentDetails);

export default router;
