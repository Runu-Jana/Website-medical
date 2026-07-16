import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  reviewPrescription,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import { protect, admin, pharmacist } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createPrescription);
router.get('/', protect, pharmacist, getPrescriptions);
router.put('/:id/review', protect, pharmacist, reviewPrescription); // approve / reject
router.put('/:id', protect, admin, updatePrescription);
router.delete('/:id', protect, admin, deletePrescription);

export default router;
