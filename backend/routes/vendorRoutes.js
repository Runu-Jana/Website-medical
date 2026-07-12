import express from 'express';
import {
  registerVendor,
  getMyVendor,
  updateMyVendor,
  getVendorStats,
  getVendors,
  updateVendor,
} from '../controllers/vendorController.js';
import { protect, admin, vendor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerVendor);
router.get('/me', protect, vendor, getMyVendor);
router.put('/me', protect, vendor, updateMyVendor);
router.get('/stats', protect, vendor, getVendorStats);
router.get('/', protect, admin, getVendors);
router.put('/:id', protect, admin, updateVendor);

export default router;
