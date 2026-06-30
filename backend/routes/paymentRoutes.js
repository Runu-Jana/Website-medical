import express from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
} from '../controllers/paymentController.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/order', createPaymentOrder);
router.post('/verify', verifyPayment);

export default router;
