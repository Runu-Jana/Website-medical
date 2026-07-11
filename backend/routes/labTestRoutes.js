import express from 'express';
import {
  getLabTests,
  getLabTestsAdmin,
  createLabTest,
  updateLabTest,
  deleteLabTest,
} from '../controllers/labTestController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getLabTests);
router.get('/admin/list', protect, admin, getLabTestsAdmin);
router.post('/', protect, admin, createLabTest);
router.put('/:id', protect, admin, updateLabTest);
router.delete('/:id', protect, admin, deleteLabTest);

export default router;
