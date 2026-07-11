import prisma from '../prisma/client.js';

// Seed a single demo popup banner the first time the table is empty, so the
// storefront popup is visible for testing right after deploy. The admin can
// edit or delete it and add their own via the Popups panel. It is only ever
// recreated if ALL popups are deleted (i.e. the table is empty again).
export const ensureDefaultPopup = async () => {
  try {
    const count = await prisma.popupBanner.count();
    if (count > 0) return;
    await prisma.popupBanner.create({
      data: {
        title: 'Welcome to DBL Life Care 🎉',
        subtitle: 'Get flat 15% OFF your first order — use code WELCOME15 at checkout.',
        badge: 'LIMITED TIME OFFER',
        image: '',
        bgColor: '#0e9f8e',
        buttonText: 'Shop Now',
        link: '/shop',
        couponCode: 'WELCOME15',
        order: 0,
        active: true,
        frequency: 'session',
      },
    });
    console.log('🪧 Seeded a default popup banner (edit it in Admin → Popups).');
  } catch (err) {
    console.error('ensureDefaultPopup skipped:', err.message);
  }
};

// Seed a demo coupon the first time the table is empty, so a coupon banner is
// visible on the storefront right away. Editable/removable in Admin → Offers.
export const ensureDefaultCoupon = async () => {
  try {
    const count = await prisma.coupon.count();
    if (count > 0) return;
    await prisma.coupon.create({
      data: {
        code: 'WELCOME15',
        description: 'Flat 15% OFF your first order',
        type: 'percent',
        value: 15,
        maxDiscount: 300,
        minOrder: 499,
        scope: 'all',
        active: true,
        showOnHome: true,
        stackable: true,
        perUserLimit: 1,
      },
    });
    console.log('🏷️  Seeded a demo coupon WELCOME15 (edit it in Admin → Offers).');
  } catch (err) {
    console.error('ensureDefaultCoupon skipped:', err.message);
  }
};

// Seed a few demo doctors the first time the table is empty, so the Doctor
// Consultation pages are populated for testing. Manage them in Admin → Doctors.
export const ensureDefaultDoctors = async () => {
  try {
    const count = await prisma.doctor.count();
    if (count > 0) return;
    const demo = [
      {
        name: 'Dr. Ramesh Gupta', specialty: 'General Physician',
        qualifications: 'MBBS, MD - General Physician', experience: 10,
        languages: ['Hindi', 'English'], fee: 399, videoFee: 399, audioFee: 299, chatFee: 199,
        rating: 4.8, numReviews: 1200, order: 1,
        about: 'Dr. Ramesh Gupta is a trusted General Physician with 10+ years of experience treating acute and chronic medical conditions.',
      },
      {
        name: 'Dr. Neha Sharma', specialty: 'Gynecologist',
        qualifications: 'MBBS, DGO - Gynecologist', experience: 8,
        languages: ['Hindi', 'English'], fee: 499, videoFee: 499, audioFee: 349, chatFee: 249,
        rating: 4.7, numReviews: 950, order: 2,
        about: 'Dr. Neha Sharma specialises in women\'s health, pregnancy care and reproductive medicine.',
      },
      {
        name: 'Dr. Arjun Verma', specialty: 'Dermatologist',
        qualifications: 'MBBS, MD - Dermatology', experience: 7,
        languages: ['English'], fee: 449, videoFee: 449, audioFee: 349, chatFee: 249,
        rating: 4.6, numReviews: 640, order: 3,
        about: 'Dr. Arjun Verma treats skin, hair and nail conditions for patients of all ages.',
      },
    ];
    for (const d of demo) {
      await prisma.doctor.create({
        data: { ...d, slug: `${d.name.toLowerCase().replace(/[^a-z]+/g, '-')}-${Math.round(d.rating * 100)}` },
      });
    }
    console.log('🩺 Seeded demo doctors (edit them in Admin → Doctors).');
  } catch (err) {
    console.error('ensureDefaultDoctors skipped:', err.message);
  }
};

// Seed demo lab tests & packages the first time the table is empty.
export const ensureDefaultLabTests = async () => {
  try {
    const count = await prisma.labTest.count();
    if (count > 0) return;
    const demo = [
      { name: 'Full Body Checkup', category: 'package', price: 999, oldPrice: 1600, parameters: 72, sampleType: 'Blood', reportTime: '24 hours', fasting: true, popular: true, order: 1, description: 'Comprehensive whole-body health screening.' },
      { name: 'Diabetes Profile', category: 'package', price: 599, oldPrice: 999, parameters: 12, sampleType: 'Blood', reportTime: '24 hours', fasting: true, popular: true, order: 2, description: 'Screen and monitor blood sugar levels.' },
      { name: 'Thyroid Profile', category: 'package', price: 599, oldPrice: 999, parameters: 3, sampleType: 'Blood', reportTime: '24 hours', fasting: false, popular: true, order: 3, description: 'T3, T4 and TSH thyroid function tests.' },
      { name: 'Complete Blood Count (CBC)', category: 'test', price: 199, oldPrice: 300, parameters: 24, sampleType: 'Blood', reportTime: '12 hours', fasting: false, popular: true, order: 4, description: 'Measures red & white cells, haemoglobin and platelets.' },
      { name: 'Lipid Profile', category: 'test', price: 399, oldPrice: 600, parameters: 8, sampleType: 'Blood', reportTime: '24 hours', fasting: true, popular: true, order: 5, description: 'Cholesterol and triglyceride levels.' },
      { name: 'Vitamin D (25-OH)', category: 'test', price: 799, oldPrice: 1200, parameters: 1, sampleType: 'Blood', reportTime: '48 hours', fasting: false, popular: false, order: 6, description: 'Vitamin D deficiency test.' },
    ];
    for (const t of demo) {
      await prisma.labTest.create({
        data: { ...t, slug: `${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${t.order}`.replace(/-+$/, '') },
      });
    }
    console.log('🧪 Seeded demo lab tests (edit them in Admin → Lab Tests).');
  } catch (err) {
    console.error('ensureDefaultLabTests skipped:', err.message);
  }
};
