// ─────────────────────────────────────────────────────────────────────────
//  Your business contact details — EDIT THESE IN ONE PLACE.
//  They power the WhatsApp button, the "Call Us" buttons, the navbar phone,
//  the top bar, the footer and the Contact page.
// ─────────────────────────────────────────────────────────────────────────
export const siteConfig = {
  // WhatsApp number in FULL international format, DIGITS ONLY — country code
  // + number, with NO "+", spaces or dashes.
  //   India  +91 98765 43210   ->  '919876543210'
  //   US/CA  +1 (800) 123-4567 ->  '18001234567'
  whatsapp: '917973944144',

  // Phone number to call. Any readable format is fine (spaces/dashes ok) —
  // it's shown as-is and auto-cleaned for the tel: link.
  phone: '+91 79739 44144',

  // Support email.
  email: 'support@dcare.com',

  // Optional greeting pre-filled in the customer's WhatsApp chat box.
  whatsappMessage: 'Hi DCare, I need help with ',
}

// wa.me deep link — opens a chat with you (optionally pre-filled).
export const waLink = (msg = siteConfig.whatsappMessage) =>
  `https://wa.me/${siteConfig.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`

// tel: link (strips spaces/dashes, keeps a leading +).
export const telLink = () => `tel:${siteConfig.phone.replace(/[^\d+]/g, '')}`

// mailto: link.
export const mailLink = () => `mailto:${siteConfig.email}`
