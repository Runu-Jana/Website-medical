// Local inline SVG placeholder — never depends on a third-party host, so the
// "No Image" state always renders (even offline or if an external CDN is down).
export const PLACEHOLDER_IMG =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
       <rect width="600" height="600" fill="#e2e8f0"/>
       <g fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
         <rect x="180" y="200" width="240" height="180" rx="14"/>
         <circle cx="245" cy="255" r="22"/>
         <path d="M195 360l70-70 45 45 55-55 40 40"/>
       </g>
       <text x="300" y="430" font-family="Arial, sans-serif" font-size="34" fill="#94a3b8" text-anchor="middle">No Image</text>
     </svg>`
  )

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

// Tiny localStorage-backed lists for wishlist / compare (no backend needed).
export function getList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}
export function isInList(key, id) {
  return getList(key).includes(id)
}
export function toggleInList(key, id) {
  const list = getList(key)
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  localStorage.setItem(key, JSON.stringify(next))
  return next.includes(id)
}

// Deterministic pseudo-number from a string (stable "X viewing" / "sold" counts).
export function stableNumber(seed = '', min = 0, max = 100) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return min + (h % (max - min + 1))
}

export const FREE_SHIPPING_THRESHOLD = 1000
export const SHIPPING_FEE = 60

export function calcShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}
