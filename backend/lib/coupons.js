import prisma from '../prisma/client.js';

export const normalizeCode = (c) => String(c || '').trim().toUpperCase();

const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Look up a coupon by code and check it is currently redeemable (active, in its
// date window, under its global usage limit). Returns { coupon } or { error }.
export const findRedeemableCoupon = async (code) => {
  const clean = normalizeCode(code);
  if (!clean) return { error: 'Enter a coupon code.' };
  const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
  if (!coupon) return { error: 'Invalid coupon code.' };
  if (!coupon.active) return { error: 'This coupon is no longer available.' };
  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { error: 'This coupon is not active yet.' };
  if (coupon.endsAt && now > coupon.endsAt) return { error: 'This coupon has expired.' };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { error: 'This coupon has reached its usage limit.' };
  }
  return { coupon };
};

// Work out the ₹ discount a coupon gives against a set of cart items.
// items: [{ productId, price, qty }].  Returns { discount } or { discount:0, error }.
export const computeCouponDiscount = async (coupon, items, subtotal) => {
  const safeItems = Array.isArray(items) ? items : [];
  const cartTotal =
    typeof subtotal === 'number'
      ? subtotal
      : safeItems.reduce((a, i) => a + Number(i.price) * Number(i.qty), 0);

  if (coupon.minOrder > 0 && cartTotal < coupon.minOrder) {
    return {
      discount: 0,
      error: `Add ${fmt(coupon.minOrder - cartTotal)} more — this coupon needs a minimum order of ${fmt(
        coupon.minOrder
      )}.`,
    };
  }

  // Determine the eligible base amount by scope.
  let base = cartTotal;
  if (coupon.scope === 'products') {
    const ids = new Set(coupon.productIds || []);
    base = safeItems
      .filter((i) => ids.has(i.productId))
      .reduce((a, i) => a + Number(i.price) * Number(i.qty), 0);
  } else if (coupon.scope === 'categories') {
    const catIds = new Set(coupon.categoryIds || []);
    const productIds = safeItems.map((i) => i.productId).filter(Boolean);
    const prods = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, categories: { select: { id: true } } },
        })
      : [];
    const eligible = new Set(
      prods.filter((p) => p.categories.some((c) => catIds.has(c.id))).map((p) => p.id)
    );
    base = safeItems
      .filter((i) => eligible.has(i.productId))
      .reduce((a, i) => a + Number(i.price) * Number(i.qty), 0);
  }

  if (base <= 0) {
    return { discount: 0, error: 'This coupon does not apply to the items in your cart.' };
  }

  let discount =
    coupon.type === 'percent' ? (base * coupon.value) / 100 : Math.min(coupon.value, base);
  if (coupon.type === 'percent' && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.max(0, Math.round(discount));
  return { discount };
};

// How many times this user has already redeemed this coupon.
export const userRedemptionCount = async (couponId, userId) => {
  if (!userId) return 0;
  return prisma.couponRedemption.count({ where: { couponId, userId } });
};
