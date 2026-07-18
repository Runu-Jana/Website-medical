// Share a product using the device's native share sheet (mobile browsers and
// the mobile app), falling back to copying the link to the clipboard on
// browsers without the Web Share API. Returns the outcome so the caller can
// show the right feedback: 'shared' | 'cancelled' | 'copied' | 'failed'.
export async function shareProduct(product) {
  const slug = product.slug || product._id || product.id
  const url = `${window.location.origin}/product/${slug}`
  const data = {
    title: product.name,
    text: `${product.name} — DBL Life Care`,
    url,
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (e) {
      // The user dismissed the share sheet — not an error, don't fall back.
      if (e && e.name === 'AbortError') return 'cancelled'
      // Any other failure → try the clipboard fallback below.
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
