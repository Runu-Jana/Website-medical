import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  FaUserMd,
  FaFlask,
  FaSyringe,
  FaShieldAlt,
  FaHeart,
  FaFileMedical,
  FaTruck,
  FaNotesMedical,
  FaRobot,
  FaChevronRight,
} from 'react-icons/fa'

const services = [
  { icon: FaUserMd, label: 'Doctor Consultation', to: '/doctors', color: 'bg-sky-100 text-sky-600' },
  { icon: FaFlask, label: 'Lab Tests', to: '/lab-tests', color: 'bg-violet-100 text-violet-600' },
  { icon: FaSyringe, label: 'Vaccination', to: '/shop?keyword=vaccine', color: 'bg-emerald-100 text-emerald-600' },
  { icon: FaShieldAlt, label: 'Health Insurance', to: '/contact', color: 'bg-indigo-100 text-indigo-600' },
  { icon: FaHeart, label: 'Join Health Club', to: '/health-club', color: 'bg-rose-100 text-rose-600' },
  { icon: FaFileMedical, label: 'Upload Prescription', to: '/prescription', color: 'bg-amber-100 text-amber-600' },
  { icon: FaNotesMedical, label: 'Health Records', to: '/health-records', color: 'bg-cyan-100 text-cyan-600' },
  { icon: FaRobot, label: 'AI Assistant', to: '/health-assistant', color: 'bg-fuchsia-100 text-fuchsia-600' },
  { icon: FaTruck, label: 'Track Order', to: '/account', color: 'bg-teal-100 text-teal-600' },
]

export default function QuickServices({ onNavigate }) {
  const scrollerRef = useRef(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Show the "scroll for more" hint only while there is content hidden off the
  // right edge; it fades away once the customer reaches the end.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8)
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const nudgeRight = () => {
    scrollerRef.current?.scrollBy({ left: 160, behavior: 'smooth' })
  }

  return (
    <div className="border-b border-bordergray bg-white">
      <div className="container-x">
        <div className="relative">
          <ul
            ref={scrollerRef}
            className="flex gap-1 overflow-x-auto py-2 sm:justify-between sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {services.map((s) => (
              <li key={s.label} className="shrink-0">
                <Link
                  to={s.to}
                  onClick={onNavigate}
                  className="group flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-center transition hover:bg-primary/5 sm:flex-row sm:gap-2 sm:px-2"
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${s.color} transition group-hover:scale-110`}>
                    <s.icon size={14} />
                  </span>
                  <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700 group-hover:text-primary sm:text-xs">
                    {s.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Scroll-for-more hint — mobile only, hidden once scrolled to the end */}
          <div
            className={`absolute inset-y-0 right-0 flex items-center transition-opacity duration-300 sm:hidden ${
              canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {/* Soft fade so the last tile looks "cut", signalling more content */}
            <span className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white to-transparent dark:from-slate-900" />
            <button
              type="button"
              onClick={nudgeRight}
              aria-label="More services"
              className="relative mr-0.5 flex h-7 w-7 animate-nudge items-center justify-center rounded-full bg-primary text-white shadow-md"
            >
              <FaChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
