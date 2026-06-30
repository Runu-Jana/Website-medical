import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import generateToken from '../utils/generateToken.js';
import { serializeUser } from '../prisma/serialize.js';
import { verifyFirebaseToken, firebaseEnabled } from '../lib/firebaseAdmin.js';

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
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Not an admin account' });
  }
  res.json({ user: serializeUser(user), token: generateToken(user.id) });
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
  } else if (process.env.OTP_DEV_MODE === 'true') {
    // Dev/test mode: no Firebase needed — accept a fixed code (default 123456).
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
