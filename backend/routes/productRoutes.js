import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getPriceRange,
  getProductsAdmin,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
} from '../controllers/productController.js';
import { importProducts, downloadTemplate } from '../controllers/productImportController.js';
import { protect, admin, panel } from '../middleware/authMiddleware.js';
import { reviewLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// In-memory upload limited to spreadsheet files for bulk product import.
const sheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ok =
      /\.(xlsx|xls|csv)$/i.test(file.originalname) ||
      /sheet|excel|csv|officedocument|ms-excel|octet-stream/i.test(file.mimetype);
    return ok ? cb(null, true) : cb(new Error('Only .xlsx, .xls or .csv files are allowed'));
  },
});

router.get('/', getProducts);
router.get('/meta/price-range', getPriceRange);
router.get('/admin', protect, panel, getProductsAdmin);
router.post('/', protect, panel, createProduct);

// Bulk import (defined before the /:idOrSlug catch-all so the paths resolve)
router.get('/import/template', protect, admin, downloadTemplate);
router.post('/import', protect, admin, sheetUpload.single('file'), importProducts);

router.get('/:idOrSlug', getProduct);
router.put('/:id', protect, panel, updateProduct);
router.delete('/:id', protect, panel, deleteProduct);
router.post('/:id/reviews', reviewLimiter, protect, createReview);

export default router;
