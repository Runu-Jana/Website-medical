import express from 'express';
import {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createContact); // public
router.get('/', protect, admin, getContacts);
router.patch('/:id', protect, admin, updateContact);
router.delete('/:id', protect, admin, deleteContact);

export default router;
