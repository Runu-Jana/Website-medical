import rateLimit from 'express-rate-limit';

const opts = (windowMs, max, message) => ({
  windowMs,
  max,
  message: { message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth (login, phone check/verify): generous for real users, blocks brute force.
export const authLimiter = rateLimit(
  opts(15 * 60 * 1000, 40, 'Too many attempts. Please wait a few minutes and try again.')
);

// Contact form: stops spam without bothering genuine senders.
export const contactLimiter = rateLimit(
  opts(60 * 60 * 1000, 8, 'Too many messages. Please try again later.')
);

// Product reviews: prevents review flooding.
export const reviewLimiter = rateLimit(
  opts(60 * 60 * 1000, 20, 'Too many reviews. Please try again later.')
);

// Support chat: caps AI usage/cost per client without hurting a real chat.
export const supportLimiter = rateLimit(
  opts(10 * 60 * 1000, 30, 'You are sending messages too quickly. Please wait a moment.')
);

// Payments: caps how many payment orders / verifications a client can fire,
// blocking abuse of the Razorpay order-creation endpoints.
export const paymentLimiter = rateLimit(
  opts(10 * 60 * 1000, 30, 'Too many payment attempts. Please wait a moment and try again.')
);
