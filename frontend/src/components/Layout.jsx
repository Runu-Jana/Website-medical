import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
import PopupBanner from './PopupBanner'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Spacer so the fixed mobile bar never covers the footer */}
      <div className="h-16 md:hidden" />
      <MobileBottomNav />
      {/* Welcome / offer popup (managed in Admin → Popups) */}
      <PopupBanner />
    </div>
  )
}
