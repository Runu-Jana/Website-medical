import { useEffect, useState } from 'react'
import { FaAngleDoubleUp } from 'react-icons/fa'

// Floating "scroll to top" button — appears once the user scrolls down.
// Sits bottom-right, stacked above the support chat launcher so they never
// overlap. Has a pulsing halo to draw the eye.
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      onClick={toTop}
      aria-label="Back to top"
      className={`fixed bottom-36 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-primaryDark md:bottom-24 md:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {/* Pulsing halo (blinking effect) */}
      <span className="absolute inset-0 rounded-full bg-primary opacity-60 animate-ping motion-reduce:hidden" aria-hidden />
      <FaAngleDoubleUp size={20} className="relative" />
    </button>
  )
}
