import express from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  webhook,
} from '../controllers/paymentController.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', webhook);

export default router;
