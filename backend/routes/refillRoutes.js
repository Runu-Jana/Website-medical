import express from 'express';
import { getRefills } from '../controllers/refillController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getRefills);

export default router;
