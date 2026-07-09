import express from 'express';
import { getAiStatus, productDetails } from '../controllers/aiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', protect, admin, getAiStatus);
router.post('/product-details', protect, admin, productDetails);

export default router;
