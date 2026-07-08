import prisma from '../prisma/client.js';
import { serializeOrder } from '../prisma/serialize.js';
import {
  createNotification,
  notifyOrderPlaced,
  notifyOrderStatus,
  LOW_STOCK_THRESHOLD,
} from '../lib/notify.js';
import { scheduleRefillsForOrder } from '../lib/refill.js';

// DBL Life Care Health Club member discount (percent off items).
export const MEMBER_DISCOUNT_PERCENT = 5;

// @route POST /api/orders  (customer or guest checkout)
export const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  const itemsPrice = items.reduce((a, i) => a + i.price * i.qty, 0);
  // Health Club perks: free delivery + 5% off (computed server-side, never trusted from client).
  const isMember = !!req.user?.isMember;
  const discountPrice = isMember ? Math.round(itemsPrice * (MEMBER_DISCOUNT_PERCENT / 100)) : 0;
  const shippingPrice = isMember ? 0 : itemsPrice > 1000 ? 0 : 60;
  const taxPrice = 0;
  const totalPrice = itemsPrice - discountPrice + shippingPrice + taxPrice;

  const order = await prisma.order.create({
    data: {
      userId: req.user?.id || null,
      items,
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || 'Cash on Delivery',
      itemsPrice,
      shippingPrice,
      discountPrice,
      taxPrice,
      totalPrice,
    },
  });

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

// @route GET /api/orders  (admin)
export const getOrders = async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;
  const where = {};
  if (status) where.status = status;
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
