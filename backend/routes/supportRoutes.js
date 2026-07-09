import express from 'express';
import { supportStatus, chat, getChats } from '../controllers/supportController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';
import { supportLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/status', supportStatus);
router.post('/chat', supportLimiter, optionalAuth, chat);
router.get('/chats', protect, admin, getChats);

export default router;
