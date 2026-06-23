import express from 'express';
import {
  getProducts,
  getProductsAdmin,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/admin', protect, admin, getProductsAdmin);
router.post('/', protect, admin, createProduct);
router.get('/:idOrSlug', getProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/:id/reviews', protect, createReview);

export default router;
