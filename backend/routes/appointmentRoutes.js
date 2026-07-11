import express from 'express';
import {
  createAppointment,
  getMyAppointments,
  getAppointments,
  updateAppointment,
} from '../controllers/appointmentController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createAppointment);
router.get('/mine', protect, getMyAppointments);
router.get('/', protect, admin, getAppointments);
router.put('/:id', protect, admin, updateAppointment);

export default router;
