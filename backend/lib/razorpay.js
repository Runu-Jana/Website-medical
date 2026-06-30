import Razorpay from 'razorpay';

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';

// Enabled only when both keys are present.
export const razorpayEnabled = !!(RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const razorpay = razorpayEnabled
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;
