import express from 'express';
import {
  createAppointment,
  getMyAppointments,
  getAppointments,
  updateAppointment,
} from '../controllers/appointmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/mine', protect, getMyAppointments);
router.get('/', protect, admin, getAppointments);
router.put('/:id', protect, admin, updateAppointment);

export default router;
