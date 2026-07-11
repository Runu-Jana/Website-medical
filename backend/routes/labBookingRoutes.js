import express from 'express';
import {
  createLabBooking,
  getMyLabBookings,
  getLabBookings,
  updateLabBooking,
} from '../controllers/labBookingController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createLabBooking);
router.get('/mine', protect, getMyLabBookings);
router.get('/', protect, admin, getLabBookings);
router.put('/:id', protect, admin, updateLabBooking);

export default router;
