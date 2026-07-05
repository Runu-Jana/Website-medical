import { Link } from 'react-router-dom'
import {
  FaHeartbeat,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaCcAmex,
} from 'react-icons/fa'
import { siteConfig, telLink, mailLink } from '../config/site'

export default function Footer() {
  return (
    <footer className="mt-16 bg-dark text-slate-300">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <FaHeartbeat size={22} />
            </span>
            <span className="text-2xl font-extrabold text-white">
              D<span className="text-primary">Care</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Your trusted online pharmacy and medical store. Genuine products, fast delivery
            and expert care — every day.
          </p>
          <div className="mt-5 flex gap-2">
            {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-primary"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Categories</h4>
          <ul className="space-y-2 text-sm">
            {['Medicines', 'Vitamins', 'Personal Care', 'Medical Devices', 'Baby Care'].map(
              (t) => (
                <li key={t}>
                  <Link to="/shop" className="hover:text-primary">
                    {t}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">
            Customer Service
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/account" className="hover:text-primary">My Account</Link></li>
            <li><Link to="/cart" className="hover:text-primary">My Cart</Link></li>
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms &amp; Conditions</Link></li>
            <li><Link to="/refund-policy" className="hover:text-primary">Refund &amp; Return</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-primary">Shipping Policy</Link></li>
            <li><Link to="/disclaimer" className="hover:text-primary">Medical Disclaimer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <FaMapMarkerAlt className="mt-0.5 text-primary" /> 123 Health Street, Medical City
            </li>
            <li className="flex items-center gap-2">
              <FaPhoneAlt className="text-primary" />
              <a href={telLink()} className="hover:text-primary">{siteConfig.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-primary" />
              <a href={mailLink()} className="hover:text-primary">{siteConfig.email}</a>
            </li>
          </ul>
          <div className="mt-5 flex gap-2 text-3xl text-slate-400">
            <FaCcVisa /> <FaCcMastercard /> <FaCcPaypal /> <FaCcAmex />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} DCare. All rights reserved.</span>
          <span>Designed for a healthier tomorrow.</span>
        </div>
      </div>
    </footer>
  )
}
