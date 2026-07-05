import express from 'express';
import { getCustomers, getCustomer } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getCustomers);
router.get('/:id', protect, admin, getCustomer);

export default router;
