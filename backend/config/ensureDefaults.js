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
