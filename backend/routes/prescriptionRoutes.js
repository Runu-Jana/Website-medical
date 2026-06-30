import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createPrescription);
router.get('/', protect, admin, getPrescriptions);
router.put('/:id', protect, admin, updatePrescription);
router.delete('/:id', protect, admin, deletePrescription);

export default router;
