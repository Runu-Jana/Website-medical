import { useEffect, useState } from 'react'
import { FaArrowUp } from 'react-icons/fa'

// Floating "scroll to top" button — appears once the user scrolls down.
// Sits bottom-left so it never overlaps the support chat widget (bottom-right)
// or the mobile bottom nav.
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
      className={`fixed bottom-20 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-dark/80 text-white shadow-lg backdrop-blur transition-all duration-300 hover:bg-dark md:bottom-6 md:left-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <FaArrowUp size={16} />
    </button>
  )
}
