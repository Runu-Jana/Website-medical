import express from 'express';
import {
  registerVendor,
  getMyVendor,
  updateMyVendor,
  getVendorStats,
  getMyEarnings,
  getSettlements,
  getVendorAnalytics,
  recordPayout,
  getVendorPayouts,
  getVendors,
  updateVendor,
} from '../controllers/vendorController.js';
import { protect, admin, vendor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerVendor);
router.get('/me', protect, vendor, getMyVendor);
router.put('/me', protect, vendor, updateMyVendor);
router.get('/stats', protect, vendor, getVendorStats);
router.get('/earnings', protect, vendor, getMyEarnings);
router.get('/settlements', protect, admin, getSettlements);
router.get('/analytics', protect, admin, getVendorAnalytics);
router.get('/', protect, admin, getVendors);
router.post('/:id/payouts', protect, admin, recordPayout);
router.get('/:id/payouts', protect, admin, getVendorPayouts);
router.put('/:id', protect, admin, updateVendor);

export default router;
