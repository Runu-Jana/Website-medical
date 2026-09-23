import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import generateToken from '../utils/generateToken.js';
import { serializeUser } from '../prisma/serialize.js';
import { verifyFirebaseToken, firebaseEnabled } from '../lib/firebaseAdmin.js';
import { notifyNewMember } from '../lib/notify.js';
import { sendMail } from '../lib/mailer.js';
import { issueResetCode, PANEL_ROLES } from '../lib/resetCode.js';

const DEVICE_TTL_DAYS = 180;
const normalizePhone = (p) => (p || '').replace(/[^\d+]/g, '');
const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const pruneDevices = (devices) =>
  (Array.isArray(devices) ? devices : []).filter(
    (d) => !d.expiresAt || new Date(d.expiresAt).getTime() > Date.now()
  );

// @route POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const lower = email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: lower } });
  if (exists) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: lower, password: hashed, phone: phone || '' },
  });
  notifyNewMember(user).catch(() => {}); // in-app + admin email
  res.status(201).json({ user: serializeUser(user), token: generateToken(user.id) });
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase() } });
  if (!user || !user.password || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ user: serializeUser(user), token: generateToken(user.id) });
};

// @route POST /api/auth/admin/login
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase() } });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  // The panel is shared by admins and approved/pending vendors (sellers).
  if (user.role !== 'admin' && user.role !== 'vendor') {
    return res.status(403).json({ message: 'This account cannot access the panel' });
  }
  res.json({ user: serializeUser(user), token: generateToken(user.id) });
};

// @route POST /api/auth/change-password  (logged in) — change own password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.password && !(await bcrypt.compare(currentPassword || '', user.password))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, mustChangePassword: false },
  });
  res.json({ success: true });
};

// @route POST /api/auth/admin/forgot  — email a 6-digit reset code to a panel
// user (admin or vendor); both share the same panel login.
export const adminForgotPassword = async (req, res) => {
  const email = (req.body.email || '').toLowerCase();
  // Always respond success (don't reveal whether the email exists).
  const generic = { message: 'If that email is registered, a reset code has been sent.' };

  const user = await prisma.user.findFirst({ where: { email, role: { in: PANEL_ROLES } } });
  if (!user) return res.json(generic);

  await issueResetCode(user);
  res.json(generic);
};

// @route POST /api/auth/admin/reset  — verify code + set a new password
export const adminResetPassword = async (req, res) => {
  const email = (req.body.email || '').toLowerCase();
  const { code, password } = req.body;
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const user = await prisma.user.findFirst({ where: { email, role: { in: PANEL_ROLES } } });
  if (
    !user ||
    !user.resetCodeHash ||
    !user.resetCodeExpires ||
    user.resetCodeExpires.getTime() < Date.now() ||
    user.resetCodeHash !== hashToken(String(code || ''))
  ) {
    return res.status(400).json({ message: 'Invalid or expired reset code' });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetCodeHash: null, resetCodeExpires: null },
  });
  res.json({ success: true, message: 'Password updated. You can now log in.' });
};

// @route POST /api/auth/forgot  — email a 6-digit reset code to a customer who
// forgot their storefront password. Mirrors the admin flow (same 15-min code),
// but for any account (not just panel roles).
export const forgotPassword = async (req, res) => {
  const email = (req.body.email || '').toLowerCase();
  // Always respond the same way — never reveal whether an email is registered.
  const generic = { message: 'If that email is registered, a reset code has been sent.' };
  if (!email) return res.json(generic);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json(generic);

  await issueResetCode(user);
  res.json(generic);
};

// @route POST /api/auth/reset  — verify the code + set a new password.
export const resetPassword = async (req, res) => {
  const email = (req.body.email || '').toLowerCase();
  const { code, password } = req.body;
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !user.resetCodeHash ||
    !user.resetCodeExpires ||
    user.resetCodeExpires.getTime() < Date.now() ||
    user.resetCodeHash !== hashToken(String(code || ''))
  ) {
    return res.status(400).json({ message: 'Invalid or expired reset code' });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetCodeHash: null, resetCodeExpires: null },
  });
  res.json({ success: true, message: 'Password updated. You can now log in.' });
};

// @route GET /api/auth/profile
export const getProfile = async (req, res) => {
  res.json(serializeUser(req.user));
};

// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const data = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.phone !== undefined) data.phone = req.body.phone;
  if (req.body.address) {
    data.address = { ...(user.address || {}), ...req.body.address };
  }
  if (req.body.password) data.password = await bcrypt.hash(req.body.password, 10);

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: serializeUser(updated), token: generateToken(updated.id) });
};

// @route POST /api/auth/phone/check
// Step 1: if this device is already trusted for the phone, log in WITHOUT an OTP.
// @route GET /api/auth/phone/status  (public) — is backend OTP verification ready?
// Lets you confirm from a URL that the server sees the Firebase service-account
// credentials, without exposing any secret.
export const phoneStatus = (req, res) => {
  res.json({
    firebaseEnabled,
    devMode: process.env.OTP_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production',
  });
};

export const phoneCheck = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { deviceToken } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  const user = await prisma.user.findFirst({ where: { phone } });
  if (user && deviceToken) {
    const devices = pruneDevices(user.trustedDevices);
    const match = devices.find((d) => d.tokenHash === hashToken(deviceToken));
    if (match) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          loginCount: { increment: 1 },
          lastLoginAt: new Date(),
          trustedDevices: devices.map((d) =>
            d.tokenHash === match.tokenHash ? { ...d, lastUsedAt: new Date().toISOString() } : d
          ),
        },
      });
      return res.json({
        trusted: true,
        returning: true,
        user: serializeUser(updated),
        token: generateToken(updated.id),
      });
    }
  }
  // Not trusted → the client should run the OTP (Firebase) flow.
  return res.json({ trusted: false, exists: !!user });
};

// @route POST /api/auth/phone/verify
// Step 2: verify the SMS code (Firebase ID token), find-or-create the user,
// trust this device, and return a JWT + a "returning customer" flag.
export const phoneVerify = async (req, res) => {
  const { idToken, code, name } = req.body;
  let phone;

  if (idToken && firebaseEnabled) {
    try {
      const decoded = await verifyFirebaseToken(idToken);
      phone = normalizePhone(decoded.phone_number);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired verification token' });
    }
  } else if (process.env.OTP_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production') {
    // Dev/test mode: no Firebase needed — accept a fixed code (default 123456).
    // Hard-disabled in production so a stray OTP_DEV_MODE=true can never bypass
    // real SMS verification.
    phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    if ((code || '') !== (process.env.OTP_DEV_CODE || '123456')) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }
  } else {
    return res.status(400).json({ message: 'Phone verification is not configured' });
  }

  if (!phone) return res.status(400).json({ message: 'Could not determine phone number' });

  let user = await prisma.user.findFirst({ where: { phone } });
  const returning = !!user && user.loginCount > 0;

  if (!user) {
    user = await prisma.user.create({
      data: { name: (name && name.trim()) || 'Customer', phone, role: 'customer' },
    });
    notifyNewMember(user).catch(() => {}); // in-app + admin email (phone signups too)
  } else if (name && name.trim() && (!user.name || user.name === 'Customer')) {
    user = await prisma.user.update({ where: { id: user.id }, data: { name: name.trim() } });
  }

  // Trust this device for next time (so future logins skip the OTP).
  const deviceToken = crypto.randomBytes(24).toString('hex');
  const devices = pruneDevices(user.trustedDevices);
  devices.push({
    tokenHash: hashToken(deviceToken),
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + DEVICE_TTL_DAYS * 86400000).toISOString(),
  });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { trustedDevices: devices, loginCount: { increment: 1 }, lastLoginAt: new Date() },
  });

  res.json({
    user: serializeUser(updated),
    token: generateToken(updated.id),
    deviceToken,
    returning,
  });
};
