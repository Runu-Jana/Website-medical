import express from 'express';
import {
  getPopups,
  createPopup,
  updatePopup,
  deletePopup,
} from '../controllers/popupController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPopups);
router.post('/', protect, admin, createPopup);
router.put('/:id', protect, admin, updatePopup);
router.delete('/:id', protect, admin, deletePopup);

export default router;
