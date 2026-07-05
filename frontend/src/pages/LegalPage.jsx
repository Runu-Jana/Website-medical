import { useParams, Link, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { siteConfig } from '../config/site'

// ── Business details used across the policies. Edit these to your real,
//    registered details before going live. ──────────────────────────────
const BIZ = {
  brand: 'DCare',
  legalName: '[Your Registered Business Name]',
  address: '[Your Registered Business Address, City, State, PIN]',
  gstin: '[Your GSTIN]',
  jurisdiction: '[City, State]',
  effective: '5 July 2026',
}

const P = (...paras) => paras // small helper for readability

const DOCS = {
  'privacy-policy': {
    title: 'Privacy Policy',
    intro: `At ${BIZ.brand}, we respect your privacy and are committed to protecting the personal and health-related information you share with us. This policy explains what we collect, why, and your rights.`,
    sections: [
      {
        h: 'Information We Collect',
        b: P(
          'Account details: name, email, phone number and password (stored encrypted).',
          'Order details: shipping address, items purchased, and payment status. We do not store your full card or UPI credentials — payments are processed securely by our payment gateway.',
          'Prescriptions and health information you voluntarily upload to order prescription medicines.',
          'Usage data such as pages viewed and device/browser information, used to improve the site.'
        ),
      },
      {
        h: 'How We Use Your Information',
        b: P(
          'To process and deliver your orders and provide customer support.',
          'To verify prescriptions where required by law before dispensing prescription-only medicines.',
          'To send order updates and, where you have opted in, offers and health information.',
          'To detect fraud and keep the platform secure.'
        ),
      },
      {
        h: 'Sharing of Information',
        b: P(
          'We share information only as needed to fulfil your order — for example with delivery partners and our payment gateway — and where required by law or regulation.',
          'We never sell your personal or health data to third parties.'
        ),
      },
      {
        h: 'Data Security & Retention',
        b: P(
          'We use industry-standard safeguards (encryption in transit, hashed passwords, access controls) to protect your data.',
          'We retain order and prescription records for the period required by applicable law, then delete or anonymise them.'
        ),
      },
      {
        h: 'Your Rights',
        b: P(
          'You may access, correct or request deletion of your personal data, and withdraw consent for marketing communications at any time.',
          `To exercise these rights, contact us at ${siteConfig.email}.`
        ),
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    intro: `These Terms govern your use of the ${BIZ.brand} website and services. By using our site or placing an order, you agree to these Terms.`,
    sections: [
      {
        h: 'Use of the Platform',
        b: P(
          'You must be at least 18 years old, or use the platform under the supervision of a parent or guardian.',
          'You agree to provide accurate account, prescription and delivery information.'
        ),
      },
      {
        h: 'Products & Prescriptions',
        b: P(
          'Prescription-only medicines are dispensed only against a valid prescription from a registered medical practitioner, as required by law.',
          'Product images and descriptions are for information only; always read the label and consult a professional before use.',
          'We may cancel or limit orders where a valid prescription is not provided or where a product is unavailable.'
        ),
      },
      {
        h: 'Pricing & Payment',
        b: P(
          'All prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise.',
          'We reserve the right to correct pricing errors and to refuse or cancel orders arising from such errors.'
        ),
      },
      {
        h: 'Limitation of Liability',
        b: P(
          `${BIZ.brand} provides the platform on an "as-is" basis and is not liable for indirect or consequential losses arising from use of the site, to the extent permitted by law.`
        ),
      },
      {
        h: 'Governing Law',
        b: P(
          `These Terms are governed by the laws of India, and disputes are subject to the exclusive jurisdiction of the courts at ${BIZ.jurisdiction}.`
        ),
      },
    ],
  },

  'refund-policy': {
    title: 'Refund & Return Policy',
    intro: `We want you to be satisfied with every order. This policy explains when returns and refunds apply. Note that, for safety reasons, medicines have specific restrictions.`,
    sections: [
      {
        h: 'Returns — What Is Eligible',
        b: P(
          'Wrong, damaged, expired or defective items: eligible for return/replacement when reported within 7 days of delivery with the original packaging and invoice.',
          'For safety and regulatory reasons, prescription medicines and temperature-sensitive products cannot be returned once delivered, unless they were damaged, expired or incorrectly supplied.'
        ),
      },
      {
        h: 'How to Request a Return',
        b: P(
          `Contact us at ${siteConfig.email} or ${siteConfig.phone} with your order number and photos of the item. Our team will verify and arrange a pickup or replacement.`
        ),
      },
      {
        h: 'Refunds',
        b: P(
          'Approved refunds are issued to your original payment method (or as store credit if you prefer).',
          'Online payments are typically refunded within 5–7 business days after the returned item is received and verified. Cash-on-Delivery orders are refunded to your bank/UPI account.'
        ),
      },
      {
        h: 'Order Cancellation',
        b: P(
          'You may cancel an order any time before it is dispatched for a full refund. Once dispatched, the return policy above applies.'
        ),
      },
    ],
  },

  'shipping-policy': {
    title: 'Shipping Policy',
    intro: `This policy explains how and when we deliver your orders.`,
    sections: [
      {
        h: 'Delivery Areas & Charges',
        b: P(
          'We currently deliver across serviceable PIN codes in India.',
          'Shipping is free on orders above ₹1000. A flat delivery fee applies to orders below this value, shown at checkout.'
        ),
      },
      {
        h: 'Delivery Timelines',
        b: P(
          'Orders are usually processed within 24 hours. Standard delivery takes 2–5 business days depending on your location and product availability.',
          'Prescription orders are dispatched only after your prescription is verified, which may add a short delay.'
        ),
      },
      {
        h: 'Tracking',
        b: P(
          'You will receive order status updates, and can view your orders anytime under My Account.'
        ),
      },
    ],
  },

  disclaimer: {
    title: 'Medical Disclaimer',
    intro: `The information on ${BIZ.brand} is provided for general informational purposes only and is not a substitute for professional medical advice.`,
    sections: [
      {
        h: 'Not Medical Advice',
        b: P(
          'Content on this site — including product descriptions, uses, benefits and directions — is for general information and must not be treated as medical advice, diagnosis or treatment.',
          'Always consult a qualified doctor or pharmacist before starting, stopping or changing any medication or treatment.'
        ),
      },
      {
        h: 'Prescription Medicines',
        b: P(
          'Prescription-only medicines are dispensed strictly against a valid prescription from a registered medical practitioner, in accordance with applicable law.'
        ),
      },
      {
        h: 'Emergencies',
        b: P(
          'In a medical emergency, contact your doctor or the nearest hospital immediately. Do not rely on this website for urgent care.'
        ),
      },
    ],
  },
}

export default function LegalPage({ docKey }) {
  const params = useParams()
  const doc = docKey || params.doc
  const data = DOCS[doc]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [doc])

  if (!data) return <Navigate to="/" replace />

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Legal</p>
        <h1 className="mt-1 text-3xl font-extrabold text-dark">{data.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {BIZ.effective}</p>

        <p className="mt-6 text-base leading-relaxed text-slate-600">{data.intro}</p>

        <div className="mt-8 space-y-8">
          {data.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold text-dark">{s.h}</h2>
              <div className="mt-2 space-y-2">
                {s.b.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact / business block */}
        <div className="mt-10 rounded-2xl bg-lightbg p-6">
          <h3 className="text-lg font-bold text-dark">Contact Us</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {BIZ.legalName}
            <br />
            {BIZ.address}
            <br />
            GSTIN: {BIZ.gstin}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Email: <a href={`mailto:${siteConfig.email}`} className="text-primary">{siteConfig.email}</a>
            {'  '}· Phone:{' '}
            <a href={`tel:${siteConfig.phone.replace(/[^\d+]/g, '')}`} className="text-primary">
              {siteConfig.phone}
            </a>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
          <Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary">Terms &amp; Conditions</Link>
          <Link to="/refund-policy" className="hover:text-primary">Refund &amp; Return</Link>
          <Link to="/shipping-policy" className="hover:text-primary">Shipping Policy</Link>
          <Link to="/disclaimer" className="hover:text-primary">Medical Disclaimer</Link>
        </div>
      </div>
    </div>
  )
}
