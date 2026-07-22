import express from 'express';
import {
  subscribe,
  getSubscribers,
  exportSubscribers,
  deleteSubscriber,
} from '../controllers/newsletterController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { contactLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/', contactLimiter, subscribe); // public signup
router.get('/', protect, admin, getSubscribers);
router.get('/export', protect, admin, exportSubscribers);
router.delete('/:id', protect, admin, deleteSubscriber);

export default router;
