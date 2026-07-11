import 'dotenv/config'; // MUST be first: load .env before any module reads process.env
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { autoSeedIfEmpty } from './config/autoSeed.js';
import { mailerEnabled } from './lib/mailer.js';
import { aiEnabled } from './lib/ai.js';
import { authLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import postRoutes from './routes/postRoutes.js';
import meRoutes from './routes/meRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import refillRoutes from './routes/refillRoutes.js';
import viewRoutes from './routes/viewRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import popupRoutes from './routes/popupRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import labTestRoutes from './routes/labTestRoutes.js';
import labBookingRoutes from './routes/labBookingRoutes.js';
import healthRecordRoutes from './routes/healthRecordRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import {
  ensureDefaultPopup,
  ensureDefaultCoupon,
  ensureDefaultDoctors,
  ensureDefaultLabTests,
} from './config/ensureDefaults.js';
import { startRefillScheduler } from './lib/refill.js';

connectDB()
  .then(() => autoSeedIfEmpty())
  .then(() => ensureDefaultPopup())
  .then(() => ensureDefaultCoupon())
  .then(() => ensureDefaultDoctors())
  .then(() => ensureDefaultLabTests());
console.log(`✉️  Email notifications: ${mailerEnabled ? 'enabled' : 'disabled (set SMTP_* in .env)'}`);
console.log(`🤖 AI product details: ${aiEnabled ? 'enabled' : 'disabled (set ANTHROPIC_API_KEY in .env)'}`);
startRefillScheduler();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind a hosting proxy (Render/Railway) so req.ip is the real client IP.
app.set('trust proxy', 1);

// Security headers. CSP is off (this is a JSON API + image host, not HTML);
// allow images to be embedded cross-origin by the storefront/admin.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Reasonable body limits. Actual files are uploaded as multipart (see the
// upload route), so JSON stays small — this shrinks the DoS surface.
// `verify` keeps the raw body so we can validate the Razorpay webhook signature.
app.use(
  express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const allowedOrigins = (process.env.CLIENT_URLS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, true); // permissive in dev; tighten in production
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static serving of uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'dcare-api', time: new Date() })
);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/me', meRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/views', viewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/lab-tests', labTestRoutes);
app.use('/api/lab-bookings', labBookingRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/vendors', vendorRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 DCare API running on http://localhost:${PORT}`)
);
