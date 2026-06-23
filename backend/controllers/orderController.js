import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @route POST /api/orders  (customer or guest checkout)
export const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  const itemsPrice = items.reduce((a, i) => a + i.price * i.qty, 0);
  const shippingPrice = itemsPrice > 1000 ? 0 : 60;
  const taxPrice = 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const order = await Order.create({
    user: req.user?._id,
    items,
    shippingAddress,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  // update sold counts + stock
  await Promise.all(
    items.map((i) =>
      Product.findByIdAndUpdate(i.product, {
        $inc: { sold: i.qty, countInStock: -i.qty },
      })
    )
  );

  res.status(201).json(order);
};

// @route GET /api/orders/mine
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @route GET /api/orders/:id
export const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
};

// ---- Admin ----

// @route GET /api/orders  (admin)
export const getOrders = async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, page: pageNum, pages: Math.ceil(total / perPage), total });
};

// @route PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const { status } = req.body;
  if (status) order.status = status;
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.isPaid = true;
    if (!order.paidAt) order.paidAt = new Date();
  }
  res.json(await order.save());
};
