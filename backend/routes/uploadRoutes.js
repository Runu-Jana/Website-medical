import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadImages } from '../controllers/uploadController.js';
import { protect, panel } from '../middleware/authMiddleware.js';

const router = express.Router();

// Up to 10 high-resolution images per request (1GB each by default).
// Panel = admins and vendors (sellers upload their own product images).
router.post('/', protect, panel, upload.array('images', 10), uploadImages);

export default router;
