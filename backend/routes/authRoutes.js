import express from 'express';
import {
  register,
  login,
  adminLogin,
  getProfile,
  updateProfile,
  phoneCheck,
  phoneVerify,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/phone/check', phoneCheck);
router.post('/phone/verify', phoneVerify);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
