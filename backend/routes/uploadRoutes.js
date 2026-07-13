import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadImages } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Any logged-in user may upload (admins/vendors for products, customers for
// health records & prescriptions). Up to 10 files per request.
router.post('/', protect, upload.array('images', 10), uploadImages);

export default router;
