import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Banner from '../models/Banner.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { categories, brands, productSeeds } from './data.js';
import { slugify } from '../utils/slugify.js';

dotenv.config();

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const run = async () => {
  await connectDB();

  if (process.argv.includes('--destroy')) {
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Banner.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('🗑️  All data destroyed');
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log('🌱 Seeding database...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);

  // Admin + a few customers
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@dcare.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  });

  const customers = await User.create(
    ['Rahim Uddin', 'Karima Begum', 'John Doe', 'Sadia Islam', 'Tanvir Ahmed'].map(
      (name, i) => ({
        name,
        email: `customer${i + 1}@dcare.com`,
        password: 'customer123',
        role: 'customer',
        phone: `01${rand(300000000, 999999999)}`,
      })
    )
  );

  const catDocs = await Category.insertMany(categories);
  const brandDocs = await Brand.insertMany(brands);
  const catMap = Object.fromEntries(catDocs.map((c) => [c.slug, c._id]));
  const brandMap = Object.fromEntries(brandDocs.map((b) => [b.slug, b._id]));

  // Default home-page banners (fully editable from the admin panel afterwards)
  await Banner.insertMany([
    {
      title: 'New Collagen Naturally',
      subtitle: 'Orange Flavor Gummies',
      badge: 'HOT',
      bgColor: '#fbe3ec',
      buttonText: 'Shop Now',
      link: '/shop',
      order: 1,
      active: true,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1600&q=80',
    },
    {
      title: 'Daily Vitamins & Immunity',
      subtitle: 'Up to 40% off this week',
      badge: 'Sale',
      bgColor: '#e3f1ec',
      buttonText: 'Grab the Deals',
      link: '/shop?deal=true',
      order: 2,
      active: true,
      image: 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=1600&q=80',
    },
    {
      title: 'Trusted Health Essentials',
      subtitle: 'Genuine products, delivered fast',
      badge: 'New',
      bgColor: '#eae6f7',
      buttonText: 'Explore Store',
      link: '/shop',
      order: 3,
      active: true,
      image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=1600&q=80',
    },
  ]);
  console.log('✅ 3 home banners created');

  // Generic pharmacy shots used to give every demo product a 2–3 image gallery.
  const extraImages = [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&q=80',
    'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=900&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80',
  ];
  const padImages = (imgs = []) => {
    const out = [...imgs];
    for (const ex of extraImages) {
      if (out.length >= 3) break;
      if (!out.includes(ex)) out.push(ex);
    }
    return out;
  };

  // Sample colour/flavour variants so the variant picker is visible in the demo.
  const demoVariants = [
    { label: 'Original', color: '#16a34a', available: true },
    { label: 'Sensitive', color: '#7c3aed', available: true },
    { label: 'Rose', color: '#ec4899', available: true },
    { label: 'Citrus', color: '#f59e0b', available: false },
  ];

  const products = await Product.insertMany(
    productSeeds.map((p) => {
      const oldP = p.oldPrice || 0;
      const discountPercent =
        oldP && p.price && oldP > p.price
          ? Math.round(((oldP - p.price) / oldP) * 100)
          : 0;
      return {
        ...p,
        slug: `${slugify(p.name)}-${rand(1000, 9999)}`,
        category: catMap[p.categorySlug],
        categories: [catMap[p.categorySlug]],
        brand: brandMap[p.brandSlug],
        images: padImages(p.images),
        thumbnail: p.images?.[0] || '',
        variants: p.variants || (p.categorySlug === 'personal-care' ? demoVariants : []),
        discountPercent,
        status: 'active',
      };
    })
  );
  console.log(`✅ ${products.length} products, ${catDocs.length} categories, ${brandDocs.length} brands`);

  // Generate historical orders across the last 14 months for rich analytics
  const orders = [];
  const now = new Date();
  for (let monthsAgo = 13; monthsAgo >= 0; monthsAgo--) {
    const ordersThisMonth = rand(8, 22);
    for (let k = 0; k < ordersThisMonth; k++) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - monthsAgo,
        rand(1, 27),
        rand(8, 20),
        rand(0, 59)
      );
      if (date > now) continue;

      const itemCount = rand(1, 4);
      const items = [];
      for (let n = 0; n < itemCount; n++) {
        const prod = pick(products);
        const qty = rand(1, 3);
        items.push({
          product: prod._id,
          name: prod.name,
          image: prod.thumbnail,
          price: prod.price,
          qty,
        });
      }
      const itemsPrice = items.reduce((a, i) => a + i.price * i.qty, 0);
      const shippingPrice = itemsPrice > 1000 ? 0 : 60;
      const totalPrice = itemsPrice + shippingPrice;
      const customer = pick(customers);
      const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'pending', 'cancelled'];
      const status = monthsAgo === 0 ? pick(statuses) : 'delivered';

      orders.push({
        user: customer._id,
        orderNumber: 'DC' + date.getTime().toString().slice(-8) + rand(100, 999),
        items,
        shippingAddress: {
          fullName: customer.name,
          phone: customer.phone,
          address: `House ${rand(1, 99)}, Road ${rand(1, 30)}`,
          city: pick(['Dhaka', 'Chittagong', 'Sylhet', 'Khulna']),
          postalCode: `${rand(1000, 9999)}`,
          country: 'Bangladesh',
        },
        paymentMethod: pick(['Cash on Delivery', 'Card', 'bKash']),
        itemsPrice,
        shippingPrice,
        taxPrice: 0,
        totalPrice,
        isPaid: status !== 'pending',
        paidAt: status !== 'pending' ? date : undefined,
        isDelivered: status === 'delivered',
        deliveredAt: status === 'delivered' ? date : undefined,
        status,
        createdAt: date,
        updatedAt: date,
      });
    }
  }
  // Guarantee orders across each of the last 7 days for the weekly insight chart
  for (let d = 6; d >= 0; d--) {
    const perDay = rand(2, 6);
    for (let k = 0; k < perDay; k++) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      date.setHours(rand(8, 20), rand(0, 59), 0, 0);
      if (date > now) continue;
      const itemCount = rand(1, 3);
      const items = [];
      for (let n = 0; n < itemCount; n++) {
        const prod = pick(products);
        const qty = rand(1, 3);
        items.push({ product: prod._id, name: prod.name, image: prod.thumbnail, price: prod.price, qty });
      }
      const itemsPrice = items.reduce((a, i) => a + i.price * i.qty, 0);
      const shippingPrice = itemsPrice > 1000 ? 0 : 60;
      const customer = pick(customers);
      const status = pick(['delivered', 'delivered', 'shipped', 'processing', 'pending']);
      orders.push({
        user: customer._id,
        orderNumber: 'DC' + date.getTime().toString().slice(-8) + rand(100, 999),
        items,
        shippingAddress: {
          fullName: customer.name, phone: customer.phone,
          address: `House ${rand(1, 99)}, Road ${rand(1, 30)}`,
          city: pick(['Dhaka', 'Chittagong', 'Sylhet', 'Khulna']),
          postalCode: `${rand(1000, 9999)}`, country: 'Bangladesh',
        },
        paymentMethod: pick(['Cash on Delivery', 'Card', 'bKash']),
        itemsPrice, shippingPrice, taxPrice: 0, totalPrice: itemsPrice + shippingPrice,
        isPaid: status !== 'pending', paidAt: status !== 'pending' ? date : undefined,
        isDelivered: status === 'delivered', deliveredAt: status === 'delivered' ? date : undefined,
        status, createdAt: date, updatedAt: date,
      });
    }
  }

  await Order.insertMany(orders);
  console.log(`✅ ${orders.length} historical orders created (14 months)`);

  console.log('\n──────────────────────────────');
  console.log('  Admin login for the panel:');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log('──────────────────────────────\n');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
