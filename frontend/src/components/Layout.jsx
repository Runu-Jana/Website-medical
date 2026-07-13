import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
import PopupBanner from './PopupBanner'
import SupportChat from './SupportChat'
import BackToTop from './BackToTop'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Immersive full-screen pages hide the storefront chrome on mobile (kept on desktop).
  const immersive = pathname === '/health-assistant'

  return (
    <div className="flex min-h-screen flex-col">
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
      {/* AI customer-support widget (shown only when the AI key is configured) */}
      <SupportChat />
      {/* Scroll-to-top button */}
      <BackToTop />
    </div>
  )
}
