export const PLACEHOLDER_IMG =
  'https://dummyimage.com/600x600/e2e8f0/64748b&text=No+Image'

export function formatPrice(value) {
  const num = Number(value || 0)
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function productImage(product) {
  if (!product) return PLACEHOLDER_IMG
  if (product.thumbnail) return product.thumbnail
  if (Array.isArray(product.images) && product.images.length) return product.images[0]
  return PLACEHOLDER_IMG
}

export function imgFallback(e) {
  e.currentTarget.src = PLACEHOLDER_IMG
}

export const FREE_SHIPPING_THRESHOLD = 1000
export const SHIPPING_FEE = 60

export function calcShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}
