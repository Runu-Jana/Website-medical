import express from 'express';
import { getAiStatus, productDetails, getBulkStatus, bulkGenerate } from '../controllers/aiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', protect, admin, getAiStatus);
router.post('/product-details', protect, admin, productDetails);
router.get('/bulk/status', protect, admin, getBulkStatus);
router.post('/bulk/generate', protect, admin, bulkGenerate);

export default router;
