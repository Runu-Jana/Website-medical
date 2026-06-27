import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import { categories, brands, productSeeds } from './data.js';
import { slugify } from '../utils/slugify.js';

dotenv.config();

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const wipe = async () => {
  // Order matters: drop orders & products (and their join rows) before parents.
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
};

const run = async () => {
  if (process.argv.includes('--destroy')) {
    await wipe();
    console.log('🗑️  All data destroyed');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log('🌱 Seeding database...');
  await wipe();

  // Admin + a few customers
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const admin = await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || 'Admin',
      email: (process.env.ADMIN_EMAIL || 'admin@dcare.com').toLowerCase(),
      password: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
    },
  });

  const customerPass = await bcrypt.hash('customer123', 10);
  const customers = [];
  const names = ['Rahim Uddin', 'Karima Begum', 'John Doe', 'Sadia Islam', 'Tanvir Ahmed'];
  for (let i = 0; i < names.length; i++) {
    customers.push(
      await prisma.user.create({
        data: {
          name: names[i],
          email: `customer${i + 1}@dcare.com`,
          password: customerPass,
          role: 'customer',
          phone: `01${rand(300000000, 999999999)}`,
        },
      })
    );
  }

  await prisma.category.createMany({ data: categories });
  await prisma.brand.createMany({ data: brands });
  const catDocs = await prisma.category.findMany();
  const brandDocs = await prisma.brand.findMany();
  const catMap = Object.fromEntries(catDocs.map((c) => [c.slug, c.id]));
  const brandMap = Object.fromEntries(brandDocs.map((b) => [b.slug, b.id]));

  // Default home-page banners (editable from the admin panel afterwards)
  await prisma.banner.createMany({
    data: [
      { title: 'New Collagen Naturally', subtitle: 'Orange Flavor Gummies', badge: 'HOT',
        bgColor: '#fbe3ec', buttonText: 'Shop Now', link: '/shop', order: 1, active: true,
        image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1600&q=80' },
      { title: 'Daily Vitamins & Immunity', subtitle: 'Up to 40% off this week', badge: 'Sale',
        bgColor: '#e3f1ec', buttonText: 'Grab the Deals', link: '/shop?deal=true', order: 2, active: true,
        image: 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=1600&q=80' },
      { title: 'Trusted Health Essentials', subtitle: 'Genuine products, delivered fast', badge: 'New',
        bgColor: '#eae6f7', buttonText: 'Explore Store', link: '/shop', order: 3, active: true,
        image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=1600&q=80' },
    ],
  });
  console.log('✅ 3 home banners created');

  // Sample blog posts
  const blogSeed = [
    { title: '5 Daily Habits for a Stronger Immune System', category: 'Wellness', author: 'Dr. Sarah Lin',
      excerpt: 'Simple, science-backed habits — from sleep to hydration — that help your body fight off illness all year round.',
      image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&q=80',
      content: 'A strong immune system starts with everyday choices. Prioritise 7–8 hours of sleep, stay hydrated, eat a colourful diet rich in vitamins C and D, move your body daily, and manage stress.\n\nConsistency matters more than intensity — small habits compound into lasting health.' },
    { title: 'Understanding Your Blood Pressure Readings', category: 'Health Tips', author: 'DCare Team',
      excerpt: 'What the top and bottom numbers really mean, and when you should talk to your doctor about your readings.',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
      content: 'Blood pressure is measured with two numbers: systolic over diastolic.\n\nA normal reading is around 120/80 mmHg. Track it regularly at home with a validated monitor and share trends with your physician.' },
    { title: 'Vitamins 101: Which Supplements Do You Actually Need?', category: 'Nutrition', author: 'Dr. Sarah Lin',
      excerpt: 'A practical guide to the most common supplements and how to choose ones that fit your lifestyle.',
      image: 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=1200&q=80',
      content: 'Whole foods should always come first, but supplements can fill the gaps. Vitamin D, omega-3, and a daily multivitamin are popular for good reason.\n\nAlways check with a healthcare professional before starting a new supplement.' },
    { title: 'How to Store Medicines Safely at Home', category: 'Safety', author: 'DCare Team',
      excerpt: 'Keep your medicines effective and your family safe with these simple storage best-practices.',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80',
      content: 'Heat and humidity degrade most medications. Store them in a cool, dry place — not the bathroom cabinet.\n\nKeep medicines in their original packaging, away from children, and check expiry dates every few months.' },
  ].map((p, i) => ({ ...p, slug: `${slugify(p.title)}-${1000 + i}`, published: true }));
  await prisma.post.createMany({ data: blogSeed });
  console.log(`✅ ${blogSeed.length} blog posts created`);

  // Pad each demo product to a 2–3 image gallery.
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
  const demoVariants = [
    { label: 'Original', color: '#16a34a', available: true },
    { label: 'Sensitive', color: '#7c3aed', available: true },
    { label: 'Rose', color: '#ec4899', available: true },
    { label: 'Citrus', color: '#f59e0b', available: false },
  ];

  const products = [];
  for (const p of productSeeds) {
    const oldPrice = p.oldPrice || 0;
    const discountPercent =
      oldPrice && p.price && oldPrice > p.price
        ? Math.round(((oldPrice - p.price) / oldPrice) * 100)
        : 0;
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: `${slugify(p.name)}-${rand(1000, 9999)}`,
        sku: p.sku || '',
        description: p.description || '',
        shortDescription: p.shortDescription || '',
        price: p.price || 0,
        oldPrice,
        discountPercent,
        images: padImages(p.images),
        thumbnail: p.images?.[0] || '',
        countInStock: p.countInStock || 0,
        unit: p.unit || 'pcs',
        variants: p.variants || (p.categorySlug === 'personal-care' ? demoVariants : []),
        isFeatured: !!p.isFeatured,
        isBestSeller: !!p.isBestSeller,
        isNewArrival: !!p.isNewArrival,
        isDeal: !!p.isDeal,
        dealEndsAt: p.dealEndsAt || null,
        requiresPrescription: !!p.requiresPrescription,
        tags: p.tags || [],
        rating: p.rating || 0,
        numReviews: p.numReviews || 0,
        reviews: [],
        sold: p.sold || 0,
        status: 'active',
        ...(brandMap[p.brandSlug] ? { brand: { connect: { id: brandMap[p.brandSlug] } } } : {}),
        ...(catMap[p.categorySlug] ? { categories: { connect: { id: catMap[p.categorySlug] } } } : {}),
      },
    });
    products.push(created);
  }
  console.log(`✅ ${products.length} products, ${catDocs.length} categories, ${brandDocs.length} brands`);

  // Historical orders across the last 14 months for analytics
  const now = new Date();
  const orders = [];
  const buildOrder = (date, status) => {
    const itemCount = rand(1, 4);
    const items = [];
    for (let n = 0; n < itemCount; n++) {
      const prod = pick(products);
      const qty = rand(1, 3);
      items.push({ product: prod.id, name: prod.name, image: prod.thumbnail, price: prod.price, qty });
    }
    const itemsPrice = items.reduce((a, i) => a + i.price * i.qty, 0);
    const shippingPrice = itemsPrice > 1000 ? 0 : 60;
    const customer = pick(customers);
    return {
      userId: customer.id,
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
      totalPrice: itemsPrice + shippingPrice,
      isPaid: status !== 'pending',
      paidAt: status !== 'pending' ? date : null,
      isDelivered: status === 'delivered',
      deliveredAt: status === 'delivered' ? date : null,
      status,
      createdAt: date,
      updatedAt: date,
    };
  };

  for (let monthsAgo = 13; monthsAgo >= 0; monthsAgo--) {
    const count = rand(8, 22);
    for (let k = 0; k < count; k++) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, rand(1, 27), rand(8, 20), rand(0, 59));
      if (date > now) continue;
      const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'pending', 'cancelled'];
      orders.push(buildOrder(date, monthsAgo === 0 ? pick(statuses) : 'delivered'));
    }
  }
  // Guarantee orders for each of the last 7 days (weekly chart)
  for (let d = 6; d >= 0; d--) {
    const perDay = rand(2, 6);
    for (let k = 0; k < perDay; k++) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      date.setHours(rand(8, 20), rand(0, 59), 0, 0);
      if (date > now) continue;
      orders.push(buildOrder(date, pick(['delivered', 'delivered', 'shipped', 'processing', 'pending'])));
    }
  }
  await prisma.order.createMany({ data: orders });
  console.log(`✅ ${orders.length} historical orders created (14 months)`);

  console.log('\n──────────────────────────────');
  console.log('  Admin login for the panel:');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('──────────────────────────────\n');

  await prisma.$disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
