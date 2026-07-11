import express from 'express';
import { getMyRecords, createRecord, deleteRecord } from '../controllers/healthRecordController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Personal medical records — always the authenticated customer's own only.
router.get('/', protect, getMyRecords);
router.post('/', protect, createRecord);
router.delete('/:id', protect, deleteRecord);

export default router;
