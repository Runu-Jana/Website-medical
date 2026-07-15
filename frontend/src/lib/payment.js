import api from './api'

// Lazily inject the Razorpay checkout script; resolves false if it can't load.
export const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

// Sentinel thrown when the customer closes the payment window without paying,
// so callers can silently reset instead of showing an error.
export const PAYMENT_DISMISSED = '__payment_dismissed__'

// Open Razorpay for a doctor appointment or lab booking and resolve once the
// payment is verified server-side (which is what actually confirms the booking).
// `type` is 'appointment' | 'labBooking'; `id` is the created booking's id.
export async function payForBooking({ type, id, name, contact, description }) {
  const { data: pay } = await api.post('/payments/order', { type, id })
  const ok = await loadRazorpay()
  if (!ok) throw new Error('Could not load the payment window. Check your connection.')

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: pay.keyId,
      order_id: pay.id,
      amount: pay.amount,
      currency: pay.currency,
      name: 'DBL Life Care',
      description: description || 'Booking payment',
      prefill: { name: name || '', contact: contact || '' },
      theme: { color: '#0e9f8e' },
      handler: async (resp) => {
        try {
          await api.post('/payments/verify', { ...resp, type, id })
          resolve(true)
        } catch {
          reject(new Error('Payment could not be verified. If money was deducted, please contact support.'))
        }
      },
      modal: { ondismiss: () => reject(new Error(PAYMENT_DISMISSED)) },
    })
    rzp.open()
  })
}
