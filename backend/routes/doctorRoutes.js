import express from 'express';
import {
  getDoctors,
  getDoctor,
  getDoctorsAdmin,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getDoctors);
router.get('/admin/list', protect, admin, getDoctorsAdmin);
router.post('/', protect, admin, createDoctor);
router.put('/:id', protect, admin, updateDoctor);
router.delete('/:id', protect, admin, deleteDoctor);
router.get('/:idOrSlug', getDoctor);

export default router;
