import prisma from '../prisma/client.js';
import { serializeOrder } from '../prisma/serialize.js';
import {
  createNotification,
  notifyOrderPlaced,
  notifyOrderStatus,
  LOW_STOCK_THRESHOLD,
} from '../lib/notify.js';
import { scheduleRefillsForOrder } from '../lib/refill.js';
import {
  findRedeemableCoupon,
  computeCouponDiscount,
  userRedemptionCount,
} from '../lib/coupons.js';
import { resolveVendor } from '../lib/vendor.js';
import { audit } from '../lib/audit.js';

// DBL Life Care Health Club member discount (percent off items).
export const MEMBER_DISCOUNT_PERCENT = 5;

// @route POST /api/orders  (customer or guest checkout)
export const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  const itemsPrice = items.reduce((a, i) => a + i.price * i.qty, 0);
  // Health Club perks: free delivery + 5% off (computed server-side, never trusted from client).
  const isMember = !!req.user?.isMember;
  const discountPrice = isMember ? Math.round(itemsPrice * (MEMBER_DISCOUNT_PERCENT / 100)) : 0;

  // Coupon — validated & priced server-side so the client can't fake a discount.
  // Coupons stack with member/deal discounts (store policy).
  let couponDiscount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const { coupon } = await findRedeemableCoupon(couponCode);
    if (coupon) {
      let allowed = true;
      if (coupon.perUserLimit > 0 && req.user?.id) {
        const used = await userRedemptionCount(coupon.id, req.user.id);
        if (used >= coupon.perUserLimit) allowed = false;
      }
      if (allowed) {
        const cartItems = items.map((i) => ({ productId: i.product, price: i.price, qty: i.qty }));
        const { discount } = await computeCouponDiscount(coupon, cartItems, itemsPrice);
        if (discount > 0) {
          couponDiscount = discount;
          appliedCoupon = coupon;
        }
      }
    }
  }

  const shippingPrice = isMember ? 0 : itemsPrice > 1000 ? 0 : 60;
  const taxPrice = 0;
  const totalPrice = Math.max(
    0,
    itemsPrice - discountPrice - couponDiscount + shippingPrice + taxPrice
  );

  // Look up the cart's products once — for vendor routing, prescription rules
  // and authoritative stock levels (all decided server-side).
  const prodIds = items.map((i) => i.product).filter(Boolean);
  const prods = prodIds.length
    ? await prisma.product.findMany({
        where: { id: { in: prodIds } },
        select: { id: true, name: true, vendorId: true, vendorName: true, requiresPrescription: true, countInStock: true },
      })
    : [];
  const vmap = new Map(prods.map((p) => [p.id, p]));
  const itemsWithVendor = items.map((i) => ({
    ...i,
    vendorId: vmap.get(i.product)?.vendorId || '',
    vendorName: vmap.get(i.product)?.vendorName || '',
  }));

  // ── Prescription compliance ────────────────────────────────────────────
  // Any prescription-only medicine must be backed by a prescription the customer
  // uploaded; it cannot be dispensed until a pharmacist approves it.
  const rxItems = items.filter((i) => vmap.get(i.product)?.requiresPrescription);
  let prescription = null;
  if (rxItems.length) {
    const pid = req.body.prescriptionId;
    if (pid) {
      prescription = await prisma.prescription.findUnique({ where: { id: pid } }).catch(() => null);
      // Must exist, belong to this customer (when logged in), and not be rejected.
      if (
        !prescription ||
        (req.user?.id && prescription.userId && prescription.userId !== req.user.id) ||
        prescription.status === 'rejected'
      ) {
        prescription = null;
      }
    }
    if (!prescription) {
      return res.status(400).json({
        message:
          'A valid prescription is required for the prescription-only medicine(s) in your cart. Please upload one to continue.',
        prescriptionRequired: true,
        rxItems: rxItems.map((i) => i.name),
      });
    }
  }

  // ── Atomic stock reservation + order creation (one transaction) ─────────
  // Decrement stock conditionally so two shoppers can't oversell the last unit.
  const tracked = itemsWithVendor.filter((i) => i.product && vmap.has(i.product));
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const it of tracked) {
        const r = await tx.product.updateMany({
          where: { id: it.product, countInStock: { gte: it.qty } },
          data: { countInStock: { decrement: it.qty }, sold: { increment: it.qty } },
        });
        if (r.count !== 1) {
          const err = new Error(`${vmap.get(it.product)?.name || 'An item'} is out of stock`);
          err.outOfStock = true;
          throw err;
        }
      }
      return tx.order.create({
        data: {
          userId: req.user?.id || null,
          items: itemsWithVendor,
          shippingAddress: shippingAddress || {},
          paymentMethod: paymentMethod || 'Cash on Delivery',
          itemsPrice,
          shippingPrice,
          discountPrice,
          couponCode: appliedCoupon?.code || '',
          couponDiscount,
          taxPrice,
          totalPrice,
          requiresPrescription: rxItems.length > 0,
          prescriptionId: prescription?.id || null,
          rxStatus: rxItems.length ? (prescription?.status === 'approved' ? 'approved' : 'pending') : 'none',
        },
      });
    });
  } catch (e) {
    if (e.outOfStock) return res.status(409).json({ message: e.message, outOfStock: true });
    console.error('createOrder failed:', e);
    return res.status(500).json({ message: 'Could not place order. Please try again.' });
  }

  // Link the prescription to this order for the pharmacist's review queue.
  if (prescription) {
    prisma.prescription.update({ where: { id: prescription.id }, data: { orderId: order.id } }).catch(() => {});
  }

  // Record the redemption and bump usage (after the order exists).
  if (appliedCoupon) {
    Promise.all([
      prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.couponRedemption.create({
        data: {
          couponId: appliedCoupon.id,
          code: appliedCoupon.code,
          userId: req.user?.id || null,
          orderId: order.id,
          amount: couponDiscount,
        },
      }),
    ]).catch(() => {});
  }

  res.status(201).json(serializeOrder(order));

  audit(req.user || { name: 'Guest' }, 'order.created', 'order', order.id, {
    total: totalPrice,
    requiresPrescription: rxItems.length > 0,
  });

  // Activity notifications (after responding, so checkout isn't slowed).
  createNotification({
    type: 'order',
    title: `New order #${order.orderNumber || order.id.slice(-6)}`,
    message: `₹${totalPrice.toFixed(0)} · ${order.paymentMethod}`,
    link: '/orders',
    meta: { orderId: order.id },
  }).catch(() => {});

  // Order confirmation email to the customer (if logged in) + admin heads-up.
  notifyOrderPlaced({ order, items, customerEmail: req.user?.email }).catch(() => {});

  // Alert once when a product's stock crosses below the low-stock threshold
  // (using the pre-decrement levels we already fetched).
  for (const it of tracked) {
    const p = vmap.get(it.product);
    const oldStock = p.countInStock;
    const newStock = oldStock - it.qty;
    if (oldStock > LOW_STOCK_THRESHOLD && newStock <= LOW_STOCK_THRESHOLD) {
      createNotification({
        type: 'stock',
        title: `Low stock: ${p.name}`,
        message: `${newStock} left in inventory`,
        link: `/products/${p.id}/edit`,
        meta: { productId: p.id },
      }).catch(() => {});
    }
  }
};

// @route GET /api/orders/mine
export const getMyOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders.map(serializeOrder));
};

// @route GET /api/orders/:id
export const getOrder = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(serializeOrder(order));
};

// ---- Admin ----

// Convert a single Airtable-style filter condition into a Prisma clause.
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

const buildCondition = ({ field, operator, value }) => {
  switch (field) {
    case 'status':
    case 'fulfillmentStatus':
      if (operator === 'is') return { [field]: value };
      if (operator === 'isNot') return { [field]: { not: value } };
      if (operator === 'isEmpty') return { [field]: '' };
      if (operator === 'isNotEmpty') return { [field]: { not: '' } };
      return null;
    case 'isPaid':
      return { isPaid: value === 'paid' || value === true || value === 'true' };
    case 'paymentMethod':
      if (operator === 'is') return { paymentMethod: value };
      if (operator === 'contains') return { paymentMethod: { contains: value, mode: 'insensitive' } };
      return null;
    case 'totalPrice': {
      const n = Number(value);
      if (Number.isNaN(n)) return null;
      const map = { eq: 'equals', ne: 'not', gt: 'gt', lt: 'lt', gte: 'gte', lte: 'lte' };
      return map[operator] ? { totalPrice: { [map[operator]]: n } } : null;
    }
    case 'orderNumber':
      if (operator === 'contains') return { orderNumber: { contains: value, mode: 'insensitive' } };
      if (operator === 'is') return { orderNumber: value };
      return null;
    case 'customer': {
      if (operator === 'isEmpty') return { userId: null };
      if (operator === 'isNotEmpty') return { userId: { not: null } };
      const v = String(value || '');
      const inner =
        operator === 'is'
          ? { OR: [{ name: v }, { email: v }] }
          : { OR: [{ name: { contains: v, mode: 'insensitive' } }, { email: { contains: v, mode: 'insensitive' } }] };
      return { user: inner };
    }
    case 'createdAt': {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      if (operator === 'onOrAfter') return { createdAt: { gte: startOfDay(d) } };
      if (operator === 'onOrBefore') return { createdAt: { lte: endOfDay(d) } };
      if (operator === 'is') return { createdAt: { gte: startOfDay(d), lte: endOfDay(d) } };
      return null;
    }
    default:
      return null;
  }
};

// @route GET /api/orders  (admin)
export const getOrders = async (req, res) => {
  // Vendor view: only orders containing this seller's items, showing just theirs.
  if (req.user?.role === 'vendor') {
    const v = await resolveVendor(req.user.id);
    const vid = v?.id || '__none__';
    const all = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    const mine = all
      .filter((o) => Array.isArray(o.items) && o.items.some((i) => i.vendorId === vid))
      .map((o) => ({ ...o, items: o.items.filter((i) => i.vendorId === vid) }));
    return res.json({ orders: mine.map(serializeOrder), page: 1, pages: 1, total: mine.length });
  }

  const { status, filters, page = 1, limit = 15 } = req.query;
  let where = {};
  if (status) where.status = status;

  // Advanced Airtable-style filters (JSON): { conjunction, conditions:[{field,operator,value}] }
  if (filters) {
    try {
      const parsed = typeof filters === 'string' ? JSON.parse(filters) : filters;
      const clauses = (parsed.conditions || []).map(buildCondition).filter(Boolean);
      if (clauses.length) {
        const key = parsed.conjunction === 'or' ? 'OR' : 'AND';
        where = { AND: [where, { [key]: clauses }] };
      }
    } catch {
      /* ignore malformed filters */
    }
  }

  // Export mode: return every matching order (capped) for CSV download.
  if (req.query.all === 'true') {
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
    return res.json({ orders: orders.map(serializeOrder), total: orders.length });
  }

  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders: orders.map(serializeOrder), page: pageNum, pages: Math.ceil(total / perPage), total });
};

// @route PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { email: true } } },
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const { status } = req.body;

  // Prescription gate: an order with Rx-only medicines cannot be dispensed
  // (moved into fulfilment) until a pharmacist has approved the prescription.
  const DISPENSING = ['processing', 'shipped', 'dispatched', 'out-for-delivery', 'delivered'];
  const DISPENSING_FULFILMENT = ['verified', 'ready', 'dispatched'];
  const wantsDispense =
    (status && DISPENSING.includes(status)) ||
    (req.body.fulfillmentStatus && DISPENSING_FULFILMENT.includes(req.body.fulfillmentStatus));
  if (order.requiresPrescription && order.rxStatus !== 'approved' && wantsDispense) {
    return res.status(400).json({
      message: 'This order contains prescription-only medicine. A pharmacist must verify the prescription before it can be processed.',
      rxStatus: order.rxStatus,
    });
  }

  const data = {};
  if (status) data.status = status;
  // Fulfillment stage (packed | verified | ready | dispatched) — independent of lifecycle status.
  if (req.body.fulfillmentStatus !== undefined) data.fulfillmentStatus = req.body.fulfillmentStatus;
  if (status === 'delivered') {
    data.isDelivered = true;
    data.deliveredAt = new Date();
    data.isPaid = true;
    if (!order.paidAt) data.paidAt = new Date();
  }
  const updated = await prisma.order.update({ where: { id: order.id }, data });
  res.json(serializeOrder(updated));

  if (status && status !== order.status) {
    audit(req.user, 'order.status', 'order', order.id, { from: order.status, to: status });
  }

  // Email the customer about the status change (if it actually changed).
  if (status && status !== order.status && order.user?.email) {
    notifyOrderStatus({ order: updated, customerEmail: order.user.email }).catch(() => {});
  }

  // On first delivery, schedule refill reminders for refillable items.
  if (status === 'delivered' && order.status !== 'delivered') {
    scheduleRefillsForOrder(updated).catch(() => {});
  }
};
