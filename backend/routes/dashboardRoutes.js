import express from 'express';
import {
  getSummary,
  getWeekly,
  getYearly,
  getTopProducts,
  getCategoryDistribution,
  getRecentOrders,
  getOrderStatusBreakdown,
} from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/summary', getSummary);
router.get('/weekly', getWeekly);
router.get('/yearly', getYearly);
router.get('/top-products', getTopProducts);
router.get('/category-distribution', getCategoryDistribution);
router.get('/recent-orders', getRecentOrders);
router.get('/order-status', getOrderStatusBreakdown);

export default router;
