import express from 'express';
import { getCart, putCart, getWishlist, putWishlist } from '../controllers/meController.js';
import { getMyRefills, updateMyRefill } from '../controllers/refillController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/cart', protect, getCart);
router.put('/cart', protect, putCart);
router.get('/wishlist', protect, getWishlist);
router.put('/wishlist', protect, putWishlist);
router.get('/refills', protect, getMyRefills);
router.patch('/refills/:id', protect, updateMyRefill);

export default router;
