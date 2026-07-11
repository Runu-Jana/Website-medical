import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaCcVisa,
  FaCcMastercard,
  FaShieldAlt,
} from 'react-icons/fa'
import { siteConfig, telLink, mailLink } from '../config/site'
import { business } from '../config/business'

const SOCIALS = [
  { key: 'facebook', Icon: FaFacebookF, label: 'Facebook' },
  { key: 'instagram', Icon: FaInstagram, label: 'Instagram' },
  { key: 'twitter', Icon: FaTwitter, label: 'Twitter / X' },
  { key: 'linkedin', Icon: FaLinkedinIn, label: 'LinkedIn' },
]

export default function Footer() {
  const socials = SOCIALS.filter((s) => siteConfig.socials?.[s.key])

  // Reveal the footer once it scrolls into view (Dawn-style scroll trigger).
  const footerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        })
      },
      { rootMargin: '0px 0px -50px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Helper: props for a staggered slide-up item.
  const reveal = (order) => ({
    className: `footer-reveal${visible ? ' is-visible' : ''}`,
    style: { '--order': order },
  })

  return (
    <footer ref={footerRef} className="mt-16 bg-dark text-slate-300">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            to="/"
            className={`inline-flex items-center rounded-xl bg-white p-3 ${reveal(0).className}`}
            style={{ '--order': 0 }}
          >
            <img src={siteConfig.logo} alt={siteConfig.brandName} className="h-12 w-auto" />
          </Link>
          <p
            className={`mt-4 text-sm leading-relaxed text-slate-400 ${reveal(1).className}`}
            style={{ '--order': 1 }}
          >
            Your trusted online pharmacy and medical store. Genuine products, fast delivery
            and expert care — every day.
          </p>
          {socials.length > 0 && (
            <div className={`mt-5 flex gap-2 ${reveal(2).className}`} style={{ '--order': 2 }}>
              {socials.map(({ key, Icon, label }) => (
                <a
                  key={key}
                  href={siteConfig.socials[key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-primary"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className={`mb-4 text-sm font-bold uppercase tracking-wide text-white ${reveal(0).className}`} style={{ '--order': 0 }}>
            Categories
          </h4>
          <ul className="space-y-2 text-sm">
            {['Medicines', 'Vitamins', 'Personal Care', 'Medical Devices', 'Baby Care', 'Shop by Brand'].map(
              (t, i) => (
                <li key={t} className={reveal(i + 1).className} style={{ '--order': i + 1 }}>
                  <Link to={t === 'Shop by Brand' ? '/brands' : '/shop'} className="hover:text-primary">
                    {t}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h4 className={`mb-4 text-sm font-bold uppercase tracking-wide text-white ${reveal(0).className}`} style={{ '--order': 0 }}>
            Customer Service
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              ['/account', 'My Account'],
              ['/cart', 'My Cart'],
              ['/about', 'About Us'],
              ['/contact', 'Contact Us'],
              ['/privacy-policy', 'Privacy Policy'],
              ['/terms', 'Terms & Conditions'],
              ['/refund-policy', 'Refund & Return'],
              ['/shipping-policy', 'Shipping Policy'],
              ['/disclaimer', 'Medical Disclaimer'],
              ['/sell', 'Sell with Us'],
            ].map(([to, label], i) => (
              <li key={to} className={reveal(i + 1).className} style={{ '--order': i + 1 }}>
                <Link to={to} className="hover:text-primary">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`mb-4 text-sm font-bold uppercase tracking-wide text-white ${reveal(0).className}`} style={{ '--order': 0 }}>
            Contact
          </h4>
          <ul className="space-y-3 text-sm">
            <li className={`flex items-start gap-2 ${reveal(1).className}`} style={{ '--order': 1 }}>
              <FaMapMarkerAlt className="mt-0.5 shrink-0 text-primary" /> {business.address}
            </li>
            <li className={`flex items-center gap-2 ${reveal(2).className}`} style={{ '--order': 2 }}>
              <FaPhoneAlt className="text-primary" />
              <a href={telLink()} className="hover:text-primary">{siteConfig.phone}</a>
            </li>
            <li className={`flex items-center gap-2 ${reveal(3).className}`} style={{ '--order': 3 }}>
              <FaEnvelope className="text-primary" />
              <a href={mailLink()} className="hover:text-primary">{siteConfig.email}</a>
            </li>
          </ul>
          <div className={`mt-5 ${reveal(4).className}`} style={{ '--order': 4 }}>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FaShieldAlt className="text-primary" /> Secured payments via Razorpay
            </p>
            <div className="mt-2 flex items-center gap-2 text-3xl text-slate-400">
              <FaCcVisa />
              <FaCcMastercard />
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold text-white">
                UPI
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold text-white">
                RuPay
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div
          className={`container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row footer-reveal${
            visible ? ' is-visible' : ''
          }`}
          style={{ '--order': 4 }}
        >
          <span>© {new Date().getFullYear()} DBL Life Care. All rights reserved.</span>
          <span>Designed for a healthier tomorrow.</span>
        </div>
      </div>
    </footer>
  )
}
