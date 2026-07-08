import express from 'express';
import { getViews, createView, deleteView } from '../controllers/viewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getViews);
router.post('/', protect, admin, createView);
router.delete('/:id', protect, admin, deleteView);

export default router;
