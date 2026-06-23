import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadImages } from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Up to 10 high-resolution images per request (1GB each by default)
router.post('/', protect, admin, upload.array('images', 10), uploadImages);

export default router;
