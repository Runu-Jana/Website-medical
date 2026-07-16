// Pure order-pricing helpers — no I/O, so they're trivially unit-testable and
// are the single source of truth for how an order total is computed.

export const FREE_SHIPPING_THRESHOLD = 1000; // ₹ subtotal for free delivery
export const FLAT_SHIPPING = 60; // ₹ otherwise

// Health Club member discount on items (percent passed in by the caller).
export const memberDiscount = (itemsPrice, isMember, percent) =>
  isMember ? Math.round(Number(itemsPrice) * (Number(percent) / 100)) : 0;

// Delivery fee: free for members or above the threshold, flat otherwise.
export const shippingFor = (itemsPrice, isMember) =>
  isMember ? 0 : Number(itemsPrice) > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

// Final payable, never negative.
export const orderTotal = ({ itemsPrice, discountPrice = 0, couponDiscount = 0, shippingPrice = 0, taxPrice = 0 }) =>
  Math.max(0, Number(itemsPrice) - Number(discountPrice) - Number(couponDiscount) + Number(shippingPrice) + Number(taxPrice));
