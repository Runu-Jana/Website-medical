import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
import PopupBanner from './PopupBanner'
import SupportChat from './SupportChat'
import BackToTop from './BackToTop'
import Seo from './Seo'

// Per-route SEO defaults for pages that don't set their own <Seo>. Pages with
// dynamic metadata (Home, product pages) have no entry here and own their tags.
const ROUTE_SEO = {
  '/shop': { title: 'Shop Medicines & Health Products', description: 'Browse genuine medicines, wellness and personal-care products with fast delivery.' },
  '/about': { title: 'About Us' },
  '/contact': { title: 'Contact Us', description: 'Get in touch with our pharmacy and support team.' },
  '/sell': { title: 'Become a Seller', description: 'Partner with us and sell your healthcare products to more customers.' },
  '/health-club': { title: 'Health Club Membership', description: 'Join the Health Club for extra discounts and free delivery.' },
  '/brands': { title: 'Shop by Brand' },
  '/doctors': { title: 'Consult a Doctor Online', description: 'Book a video, audio or chat consultation with verified doctors.' },
  '/lab-tests': { title: 'Book Lab Tests', description: 'Book lab tests and health packages with free home sample collection.' },
  '/blog': { title: 'Health Blog & Tips', description: 'Health tips, medicine guides and wellness articles.' },
  '/privacy-policy': { title: 'Privacy Policy' },
  '/terms': { title: 'Terms & Conditions' },
  '/refund-policy': { title: 'Refund Policy' },
  '/shipping-policy': { title: 'Shipping Policy' },
  '/disclaimer': { title: 'Disclaimer' },
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Immersive full-screen pages hide the storefront chrome on mobile (kept on desktop).
  const immersive = pathname === '/health-assistant'
  const routeSeo = ROUTE_SEO[pathname]

  return (
    <div className="flex min-h-screen flex-col">
      {routeSeo && <Seo title={routeSeo.title} description={routeSeo.description} />}
      <div className={immersive ? 'hidden md:block' : ''}>
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <div className={immersive ? 'hidden md:block' : ''}>
        <Footer />
      </div>
      {/* Spacer + mobile bottom nav (hidden on immersive pages) */}
      {!immersive && <div className="h-16 md:hidden" />}
      {!immersive && <MobileBottomNav />}
      {/* Welcome / offer popup (managed in Admin → Popups) */}
      <PopupBanner />
      {/* AI customer-support widget — hidden on the dedicated AI Assistant page */}
      {!immersive && <SupportChat />}
      {/* Scroll-to-top button */}
      <BackToTop />
    </div>
  )
}
