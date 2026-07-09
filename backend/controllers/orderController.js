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

  const order = await prisma.order.create({
    data: {
      userId: req.user?.id || null,
      items,
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || 'Cash on Delivery',
      itemsPrice,
      shippingPrice,
      discountPrice,
      couponCode: appliedCoupon?.code || '',
      couponDiscount,
      taxPrice,
      totalPrice,
    },
  });

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

  // Update sold counts + stock for known products (ignore unknown ids).
  const updated = await Promise.all(
    items
      .filter((i) => i.product)
      .map((i) =>
        prisma.product
          .update({
            where: { id: i.product },
            data: { sold: { increment: i.qty }, countInStock: { decrement: i.qty } },
          })
          .then((p) => ({ p, qty: i.qty }))
          .catch(() => null)
      )
  );

  res.status(201).json(serializeOrder(order));

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

  // Alert once when a product's stock crosses below the low-stock threshold.
  for (const u of updated) {
    if (!u) continue;
    const newStock = u.p.countInStock;
    const oldStock = newStock + u.qty;
    if (oldStock > LOW_STOCK_THRESHOLD && newStock <= LOW_STOCK_THRESHOLD) {
      createNotification({
        type: 'stock',
        title: `Low stock: ${u.p.name}`,
        message: `${newStock} left in inventory`,
        link: `/products/${u.p.id}/edit`,
        meta: { productId: u.p.id },
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

  // Email the customer about the status change (if it actually changed).
  if (status && status !== order.status && order.user?.email) {
    notifyOrderStatus({ order: updated, customerEmail: order.user.email }).catch(() => {});
  }

  // On first delivery, schedule refill reminders for refillable items.
  if (status === 'delivered' && order.status !== 'delivered') {
    scheduleRefillsForOrder(updated).catch(() => {});
  }
};
