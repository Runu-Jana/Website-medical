import express from 'express';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  suggestCoupon,
  getActiveCoupons,
  validateCoupon,
} from '../controllers/couponController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Storefront
router.get('/active', getActiveCoupons);
router.post('/validate', optionalAuth, validateCoupon);

// Admin
router.get('/admin', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.post('/ai-suggest', protect, admin, suggestCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;
