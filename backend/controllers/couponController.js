import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import {
  normalizeCode,
  findRedeemableCoupon,
  computeCouponDiscount,
  userRedemptionCount,
} from '../lib/coupons.js';
import { generateOfferSuggestion } from '../lib/ai.js';

// Shape the coupon for the client (adds _id).
const serialize = (c) => (c ? { ...c, _id: c.id } : c);

// Build a clean data object from admin input (create/update share this).
const buildData = (b) => {
  const data = {};
  if (b.code !== undefined) data.code = normalizeCode(b.code);
  if (b.description !== undefined) data.description = String(b.description || '');
  if (b.type !== undefined) data.type = b.type === 'fixed' ? 'fixed' : 'percent';
  if (b.value !== undefined) data.value = Math.max(0, Number(b.value) || 0);
  if (b.maxDiscount !== undefined) data.maxDiscount = Math.max(0, Number(b.maxDiscount) || 0);
  if (b.minOrder !== undefined) data.minOrder = Math.max(0, Number(b.minOrder) || 0);
  if (b.scope !== undefined) data.scope = ['products', 'categories'].includes(b.scope) ? b.scope : 'all';
  if (b.productIds !== undefined) data.productIds = Array.isArray(b.productIds) ? b.productIds : [];
  if (b.categoryIds !== undefined) data.categoryIds = Array.isArray(b.categoryIds) ? b.categoryIds : [];
  if (b.usageLimit !== undefined) data.usageLimit = Math.max(0, parseInt(b.usageLimit, 10) || 0);
  if (b.perUserLimit !== undefined) data.perUserLimit = Math.max(0, parseInt(b.perUserLimit, 10) || 0);
  if (b.startsAt !== undefined) data.startsAt = b.startsAt ? new Date(b.startsAt) : null;
  if (b.endsAt !== undefined) data.endsAt = b.endsAt ? new Date(b.endsAt) : null;
  if (b.active !== undefined) data.active = !!b.active;
  if (b.showOnHome !== undefined) data.showOnHome = !!b.showOnHome;
  if (b.stackable !== undefined) data.stackable = !!b.stackable;
  return data;
};

// ---- Admin CRUD ----

// @route GET /api/coupons/admin  (admin)
export const getCoupons = async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(coupons.map(serialize));
};

// @route POST /api/coupons  (admin)
export const createCoupon = async (req, res) => {
  const data = buildData(req.body);
  if (!data.code) return res.status(400).json({ message: 'Coupon code is required.' });
  if (!data.value) return res.status(400).json({ message: 'Discount value is required.' });
  const exists = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (exists) return res.status(409).json({ message: 'A coupon with this code already exists.' });
  const coupon = await prisma.coupon.create({ data });
  res.status(201).json(serialize(coupon));
};

// @route PUT /api/coupons/:id  (admin)
export const updateCoupon = async (req, res) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Coupon not found.' });
  const data = buildData(req.body);
  if (data.code && data.code !== existing.code) {
    const clash = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (clash) return res.status(409).json({ message: 'A coupon with this code already exists.' });
  }
  const coupon = await prisma.coupon.update({ where: { id: existing.id }, data });
  res.json(serialize(coupon));
};

// @route DELETE /api/coupons/:id  (admin)
export const deleteCoupon = async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ success: true });
};

// @route POST /api/coupons/ai-suggest  (admin)
export const suggestCoupon = async (req, res) => {
  try {
    const draft = await generateOfferSuggestion({ brief: req.body?.brief });
    // Ensure the suggested code isn't already taken; nudge it if so.
    let code = normalizeCode(draft.code).replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'SAVE10';
    const clash = await prisma.coupon.findUnique({ where: { code } });
    if (clash) code = `${code}${Math.min(99, (clash ? 1 : 0) + 1)}`.slice(0, 14);
    res.json({ ...draft, code });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'AI suggestion failed.' });
  }
};

// ---- Storefront ----

// @route GET /api/coupons/active  (public) — coupons flagged to show on the homepage.
export const getActiveCoupons = async (req, res) => {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      active: true,
      showOnHome: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
  // Only expose what the storefront needs (never internal limits/usage).
  res.json(
    coupons.map((c) => ({
      _id: c.id,
      code: c.code,
      description: c.description,
      type: c.type,
      value: c.value,
      maxDiscount: c.maxDiscount,
      minOrder: c.minOrder,
      endsAt: c.endsAt,
    }))
  );
};

// @route POST /api/coupons/validate  (optional auth) — check a code against a cart.
// Body: { code, items: [{ productId, price, qty }], subtotal }
export const validateCoupon = async (req, res) => {
  const { code, items, subtotal } = req.body || {};
  const { coupon, error } = await findRedeemableCoupon(code);
  if (error) return res.status(400).json({ valid: false, message: error });

  // Per-user limit (only enforceable when logged in).
  if (coupon.perUserLimit > 0 && req.user?.id) {
    const used = await userRedemptionCount(coupon.id, req.user.id);
    if (used >= coupon.perUserLimit) {
      return res.status(400).json({ valid: false, message: 'You have already used this coupon.' });
    }
  }

  const { discount, error: calcError } = await computeCouponDiscount(coupon, items, subtotal);
  if (calcError) return res.status(400).json({ valid: false, message: calcError });

  res.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discount,
    stackable: coupon.stackable,
  });
};
