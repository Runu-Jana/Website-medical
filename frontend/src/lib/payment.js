import api from './api'

// Lazily inject the Razorpay checkout script (web only); resolves false if it can't load.
export const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

// Sentinel thrown when the customer closes the payment window without paying.
export const PAYMENT_DISMISSED = '__payment_dismissed__'

const isNative = () => {
  try {
    // eslint-disable-next-line global-require
    return !!window.Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

// Opens Razorpay and resolves with the { razorpay_order_id, razorpay_payment_id,
// razorpay_signature } payload. Uses the native sheet inside the mobile app and
// the web checkout in the browser — same call site for both.
export async function openRazorpayCheckout(options) {
  const opts = { theme: { color: '#0e9f8e' }, ...options }

  if (isNative()) {
    const { Checkout } = await import('capacitor-razorpay')
    try {
      const res = await Checkout.open(opts)
      const r = res?.response || res || {}
      return {
        razorpay_order_id: r.razorpay_order_id,
        razorpay_payment_id: r.razorpay_payment_id,
        razorpay_signature: r.razorpay_signature,
      }
    } catch {
      // The native plugin throws when the user cancels the sheet.
      throw new Error(PAYMENT_DISMISSED)
    }
  }

  // Web checkout
  const ok = await loadRazorpay()
  if (!ok) throw new Error('Could not load the payment window. Check your connection.')
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...opts,
      handler: (r) =>
        resolve({
          razorpay_order_id: r.razorpay_order_id,
          razorpay_payment_id: r.razorpay_payment_id,
          razorpay_signature: r.razorpay_signature,
        }),
      modal: { ondismiss: () => reject(new Error(PAYMENT_DISMISSED)) },
    })
    rzp.open()
  })
}

// Pay for a doctor appointment or lab booking; resolves once verified server-side.
export async function payForBooking({ type, id, name, contact, description }) {
  const { data: pay } = await api.post('/payments/order', { type, id })
  const resp = await openRazorpayCheckout({
    key: pay.keyId,
    order_id: pay.id,
    amount: pay.amount,
    currency: pay.currency,
    name: 'DBL Life Care',
    description: description || 'Booking payment',
    prefill: { name: name || '', contact: contact || '' },
  })
  await api.post('/payments/verify', { ...resp, type, id })
  return true
}
