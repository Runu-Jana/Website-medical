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

// @route GET /api/vendors/stats  (vendor) — seller dashboard summary
export const getVendorStats = async (req, res) => {
  const v = await resolveVendor(req.user.id);
  if (!v) return res.status(404).json({ message: 'Vendor profile not found' });

  const products = await prisma.product.findMany({
    where: { vendorId: v.id },
    select: { status: true, countInStock: true },
  });
  const productCount = products.length;
  const activeCount = products.filter((p) => p.status === 'active').length;
  const outOfStock = products.filter((p) => (p.countInStock || 0) <= 0).length;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { user: { select: { name: true } } },
  });
  let revenue = 0;
  let itemsSold = 0;
  let orderCount = 0;
  let pending = 0;
  const recent = [];
  for (const o of orders) {
    const mine = Array.isArray(o.items) ? o.items.filter((i) => i.vendorId === v.id) : [];
    if (!mine.length) continue;
    orderCount += 1;
    const subtotal = mine.reduce((s, i) => s + i.price * i.qty, 0);
    revenue += subtotal;
    itemsSold += mine.reduce((s, i) => s + i.qty, 0);
    if (['pending', 'processing'].includes(o.status)) pending += 1;
    if (recent.length < 6) {
      recent.push({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        customer: o.user?.name || 'Guest',
        items: mine,
        subtotal,
      });
    }
  }

  res.json({
    status: v.status,
    shopName: v.shopName,
    commissionPercent: v.commissionPercent,
    productCount,
    activeCount,
    outOfStock,
    orderCount,
    itemsSold,
    revenue,
    pending,
    recent,
  });
};

// Gross sales (paid, non-refunded) per vendorId from the order stream.
const grossByVendor = async () => {
  const orders = await prisma.order.findMany({
    where: { isPaid: true, isRefunded: false },
    select: { items: true },
    take: 5000,
  });
  const map = new Map();
  for (const o of orders) {
    if (!Array.isArray(o.items)) continue;
    for (const it of o.items) {
      if (!it.vendorId) continue;
      map.set(it.vendorId, (map.get(it.vendorId) || 0) + it.price * it.qty);
    }
  }
  return map;
};

// @route GET /api/vendors/earnings  (vendor) — own earnings + payout history
export const getMyEarnings = async (req, res) => {
  const v = await resolveVendor(req.user.id);
  if (!v) return res.status(404).json({ message: 'Vendor profile not found' });
  const gross = (await grossByVendor()).get(v.id) || 0;
  const commission = gross * (v.commissionPercent / 100);
  const net = gross - commission;
  const payouts = await prisma.vendorPayout.findMany({ where: { vendorId: v.id }, orderBy: { createdAt: 'desc' } });
  const totalPaid = payouts.reduce((s, p) => s + p.amount, 0);
  res.json({
    grossSales: Math.round(gross),
    commissionPercent: v.commissionPercent,
    commission: Math.round(commission),
    netEarned: Math.round(net),
    totalPaid: Math.round(totalPaid),
    outstanding: Math.round(net - totalPaid),
    payouts: payouts.map(withId),
  });
};

// ---- Admin ----

// @route GET /api/vendors/settlements  (admin) — earnings & outstanding per vendor
export const getSettlements = async (req, res) => {
  const [vendors, gross, payoutSums] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } }),
    grossByVendor(),
    prisma.vendorPayout.groupBy({ by: ['vendorId'], _sum: { amount: true } }),
  ]);
  const paidMap = new Map(payoutSums.map((p) => [p.vendorId, p._sum.amount || 0]));
  const rows = vendors.map((v) => {
    const g = gross.get(v.id) || 0;
    const commission = g * (v.commissionPercent / 100);
    const net = g - commission;
    const paid = paidMap.get(v.id) || 0;
    return {
      _id: v.id,
      shopName: v.shopName,
      status: v.status,
      commissionPercent: v.commissionPercent,
      grossSales: Math.round(g),
      commission: Math.round(commission),
      netEarned: Math.round(net),
      totalPaid: Math.round(paid),
      outstanding: Math.round(net - paid),
    };
  });
  res.json({ vendors: rows });
};

// @route GET /api/vendors/analytics  (admin)
// One-glance comparison of every vendor: catalog size, discount spread, average
// price, sales volume, revenue and settlement — so the admin can rank sellers
// and compare their pricing/discounts side by side (Amazon/Flipkart style).
export const getVendorAnalytics = async (req, res) => {
  const [vendors, products, orders, payoutSums] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({
      select: { vendorId: true, status: true, countInStock: true, discountPercent: true, price: true },
    }),
    prisma.order.findMany({ where: { isPaid: true, isRefunded: false }, select: { items: true }, take: 5000 }),
    prisma.vendorPayout.groupBy({ by: ['vendorId'], _sum: { amount: true } }),
  ]);

  // Catalog metrics grouped by vendorId.
  const prodBy = new Map();
  for (const p of products) {
    const key = p.vendorId || '';
    if (!prodBy.has(key)) {
      prodBy.set(key, { count: 0, active: 0, oos: 0, discSum: 0, minDisc: null, maxDisc: null, priceSum: 0 });
    }
    const m = prodBy.get(key);
    m.count += 1;
    if (p.status === 'active') m.active += 1;
    if ((p.countInStock || 0) <= 0) m.oos += 1;
    const d = p.discountPercent || 0;
    m.discSum += d;
    m.minDisc = m.minDisc === null ? d : Math.min(m.minDisc, d);
    m.maxDisc = m.maxDisc === null ? d : Math.max(m.maxDisc, d);
    m.priceSum += p.price || 0;
  }

  // Sales metrics (paid, non-refunded) grouped by vendorId.
  const salesBy = new Map();
  for (const o of orders) {
    if (!Array.isArray(o.items)) continue;
    const vendorsInOrder = new Set();
    for (const it of o.items) {
      if (!it.vendorId) continue;
      if (!salesBy.has(it.vendorId)) salesBy.set(it.vendorId, { revenue: 0, units: 0, orders: 0 });
      const s = salesBy.get(it.vendorId);
      s.revenue += (it.price || 0) * (it.qty || 0);
      s.units += it.qty || 0;
      vendorsInOrder.add(it.vendorId);
    }
    for (const vid of vendorsInOrder) salesBy.get(vid).orders += 1;
  }

  const paidMap = new Map(payoutSums.map((p) => [p.vendorId, p._sum.amount || 0]));

  const rows = vendors.map((v) => {
    const pm = prodBy.get(v.id) || { count: 0, active: 0, oos: 0, discSum: 0, minDisc: 0, maxDisc: 0, priceSum: 0 };
    const sm = salesBy.get(v.id) || { revenue: 0, units: 0, orders: 0 };
    const gross = sm.revenue;
    const commission = gross * (v.commissionPercent / 100);
    const net = gross - commission;
    const paid = paidMap.get(v.id) || 0;
    return {
      _id: v.id,
      shopName: v.shopName || v.ownerName || 'Unnamed seller',
      ownerName: v.ownerName,
      email: v.email,
      phone: v.phone,
      licenseNumber: v.licenseNumber,
      gstin: v.gstin,
      status: v.status,
      commissionPercent: v.commissionPercent,
      joinedAt: v.createdAt,
      productCount: pm.count,
      activeCount: pm.active,
      outOfStock: pm.oos,
      avgDiscount: pm.count ? Math.round(pm.discSum / pm.count) : 0,
      minDiscount: Math.round(pm.minDisc || 0),
      maxDiscount: Math.round(pm.maxDisc || 0),
      avgPrice: pm.count ? Math.round(pm.priceSum / pm.count) : 0,
      unitsSold: sm.units,
      orderCount: sm.orders,
      revenue: Math.round(gross),
      commission: Math.round(commission),
      netEarned: Math.round(net),
      totalPaid: Math.round(paid),
      outstanding: Math.round(net - paid),
    };
  });

  const summary = {
    vendorCount: vendors.length,
    approvedVendors: vendors.filter((v) => v.status === 'approved').length,
    pendingVendors: vendors.filter((v) => v.status === 'pending').length,
    totalProducts: products.length,
    totalUnitsSold: rows.reduce((s, r) => s + r.unitsSold, 0),
    totalRevenue: rows.reduce((s, r) => s + r.revenue, 0),
    totalOutstanding: rows.reduce((s, r) => s + (r.outstanding > 0 ? r.outstanding : 0), 0),
  };

  res.json({ vendors: rows, summary });
};

// @route POST /api/vendors/:id/payouts  (admin) — record a settlement payment
export const recordPayout = async (req, res) => {
  const v = await prisma.vendor.findUnique({ where: { id: req.params.id } });
  if (!v) return res.status(404).json({ message: 'Vendor not found' });
  const amount = Math.max(0, Number(req.body.amount) || 0);
  if (!amount) return res.status(400).json({ message: 'Enter a payout amount' });
  const payout = await prisma.vendorPayout.create({
    data: { vendorId: v.id, amount, note: String(req.body.note || '').trim() },
  });
  res.status(201).json(withId(payout));
};

// @route GET /api/vendors/:id/payouts  (admin) — a vendor's payout history
export const getVendorPayouts = async (req, res) => {
  const payouts = await prisma.vendorPayout.findMany({
    where: { vendorId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(payouts.map(withId));
};

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
