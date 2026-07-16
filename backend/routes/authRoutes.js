import express from 'express';
import {
  register,
  login,
  adminLogin,
  getProfile,
  updateProfile,
  phoneCheck,
  phoneVerify,
  changePassword,
  adminForgotPassword,
  adminResetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, registerSchema, loginSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/admin/login', adminLogin);
router.post('/admin/forgot', adminForgotPassword);
router.post('/admin/reset', adminResetPassword);
router.post('/phone/check', phoneCheck);
router.post('/phone/verify', phoneVerify);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;
