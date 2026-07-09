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
