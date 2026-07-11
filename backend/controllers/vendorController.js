import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import generateToken from '../utils/generateToken.js';
import { serializeUser, withId } from '../prisma/serialize.js';
import { resolveVendor } from '../lib/vendor.js';
import { createNotification } from '../lib/notify.js';
import { sendMail } from '../lib/mailer.js';

// @route POST /api/vendors/register  (public) — a pharmacy applies to sell
export const registerVendor = async (req, res) => {
  const b = req.body || {};
  const { shopName, ownerName, email, phone, password } = b;
  if (!shopName || !ownerName || !email || !password) {
    return res.status(400).json({ message: 'Shop name, owner, email and password are required' });
  }
  const lower = String(email).toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: lower } });
  if (exists) return res.status(400).json({ message: 'This email is already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: ownerName, email: lower, password: hashed, phone: phone || '', role: 'vendor' },
  });
  const vendorProfile = await prisma.vendor.create({
    data: {
      userId: user.id,
      shopName: String(shopName).trim(),
      ownerName: String(ownerName).trim(),
      email: lower,
      phone: String(phone || '').trim(),
      licenseNumber: String(b.licenseNumber || '').trim(),
      gstin: String(b.gstin || '').trim(),
      address: String(b.address || '').trim(),
      status: 'pending',
    },
  });

  res.status(201).json({ success: true, token: generateToken(user.id), user: serializeUser(user), vendor: withId(vendorProfile) });

  createNotification({
    type: 'user',
    title: `New seller application — ${vendorProfile.shopName}`,
    message: `${vendorProfile.ownerName} · ${vendorProfile.email}`,
    link: '/vendors',
    meta: { vendorId: vendorProfile.id },
  }).catch(() => {});
  const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `New seller application: ${vendorProfile.shopName}`,
      text: `${vendorProfile.ownerName} (${vendorProfile.email}, ${vendorProfile.phone})\nLicence: ${vendorProfile.licenseNumber}\nGSTIN: ${vendorProfile.gstin}\nAddress: ${vendorProfile.address}`,
    }).catch(() => {});
  }
};

// @route GET /api/vendors/me  (vendor) — own profile
export const getMyVendor = async (req, res) => {
  const v = await resolveVendor(req.user.id);
  if (!v) return res.status(404).json({ message: 'Vendor profile not found' });
  res.json(withId(v));
};

// @route PUT /api/vendors/me  (vendor) — update own profile (not status/commission)
export const updateMyVendor = async (req, res) => {
  const v = await resolveVendor(req.user.id);
  if (!v) return res.status(404).json({ message: 'Vendor profile not found' });
  const b = req.body || {};
  const data = {};
  ['shopName', 'ownerName', 'phone', 'licenseNumber', 'gstin', 'address', 'logo'].forEach((f) => {
    if (b[f] !== undefined) data[f] = String(b[f]);
  });
  const updated = await prisma.vendor.update({ where: { id: v.id }, data });
  res.json(withId(updated));
};

// ---- Admin ----

// @route GET /api/vendors  (admin)
export const getVendors = async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;
  const [vendors, pending] = await Promise.all([
    prisma.vendor.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.vendor.count({ where: { status: 'pending' } }),
  ]);
  // Attach product counts per vendor.
  const withCounts = await Promise.all(
    vendors.map(async (v) => ({
      ...withId(v),
      productCount: await prisma.product.count({ where: { vendorId: v.id } }),
    }))
  );
  res.json({ vendors: withCounts, pending });
};

// @route PUT /api/vendors/:id  (admin) — approve/reject/suspend + commission
export const updateVendor = async (req, res) => {
  const v = await prisma.vendor.findUnique({ where: { id: req.params.id } });
  if (!v) return res.status(404).json({ message: 'Vendor not found' });
  const b = req.body || {};
  const data = {};
  if (b.status && ['pending', 'approved', 'rejected', 'suspended'].includes(b.status)) data.status = b.status;
  if (b.commissionPercent !== undefined) data.commissionPercent = Math.max(0, Number(b.commissionPercent) || 0);
  const updated = await prisma.vendor.update({ where: { id: v.id }, data });

  // If a vendor is suspended/rejected, hide their products from the store.
  if (data.status && data.status !== 'approved') {
    await prisma.product.updateMany({ where: { vendorId: v.id }, data: { status: 'inactive' } }).catch(() => {});
  } else if (data.status === 'approved') {
    await prisma.product.updateMany({ where: { vendorId: v.id }, data: { status: 'active' } }).catch(() => {});
  }
  res.json(withId(updated));
};
