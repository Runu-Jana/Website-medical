import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, admin, panel, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createOrder); // guest checkout; links user if logged in
router.get('/', protect, panel, getOrders); // vendors see only their own items
router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
