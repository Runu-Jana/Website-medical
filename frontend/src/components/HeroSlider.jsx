import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import api, { API } from '../lib/api'
import { imgFallback } from '../lib/helpers'

// Used only if the admin hasn't created any banners yet.
const fallbackSlides = [
  {
    badge: 'HOT',
    title: 'New Collagen Naturally',
    subtitle: 'Orange Flavor Gummies',
    buttonText: 'Shop Now',
    link: '/shop',
    bgColor: '#fbe3ec',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1600&q=80',
  },
  {
    badge: 'Sale',
    title: 'Daily Vitamins & Immunity',
    subtitle: 'Up to 40% off this week',
    buttonText: 'Grab the Deals',
    link: '/shop?deal=true',
    bgColor: '#e3f1ec',
    image: 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=1600&q=80',
  },
  {
    badge: 'New',
    title: 'Trusted Health Essentials',
    subtitle: 'Genuine products, delivered fast',
    buttonText: 'Explore Store',
    link: '/shop',
    bgColor: '#eae6f7',
    image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=1600&q=80',
  },
]

const resolveImg = (u) => {
  if (!u) return ''
  if (u.startsWith('http')) return u
  return `${API}${u.startsWith('/') ? '' : '/'}${u}`
}

export default function HeroSlider() {
  const [slides, setSlides] = useState(fallbackSlides)
  const [index, setIndex] = useState(0)
  const [nudge, setNudge] = useState(0) // bump to restart the auto-timer after manual nav
  const touchX = useRef(null)

  useEffect(() => {
    api
      .get('/banners?active=true')
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) {
          setSlides(data)
          setIndex(0)
        }
      })
      .catch(() => {
        /* keep fallback slides */
      })
  }, [])

  // Auto-rotate; restarts whenever the customer navigates manually (nudge).
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides, nudge])

  const goTo = (i) => {
    setIndex(((i % slides.length) + slides.length) % slides.length)
    setNudge((n) => n + 1)
  }
  const go = (dir) => goTo(index + dir)

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchX.current == null || slides.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1) // swipe left → next, right → prev
    touchX.current = null
  }

  const slide = slides[index] || slides[0]
  const bg = slide.bgColor || '#fbe3ec'

  return (
    <section
      className="relative mt-[5px] w-full touch-pan-y select-none overflow-hidden"
      style={{ backgroundColor: bg }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Full-bleed product image covering the whole banner */}
      {slide.image && (
        <img
          key={slide.image}
          src={resolveImg(slide.image)}
          onError={imgFallback}
          alt={slide.title}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
      {/* Subtle wash to unify the photo with the theme colour */}
      <div className="absolute inset-0" style={{ backgroundColor: bg, opacity: 0.12 }} />
      {/* Left-to-right colour fade so the headline stays readable on any photo */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${bg} 0%, ${bg} 30%, ${bg}e0 48%, ${bg}00 78%)`,
        }}
      />

      {/* Content aligned to the page container */}
      <div className="container-x relative">
        <div className="max-w-md pt-6 pb-12 sm:max-w-lg sm:py-14 lg:py-20">
          {slide.badge && (
            <span className="inline-block rounded-md bg-red-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:px-3 sm:py-1 sm:text-xs">
              {slide.badge}
            </span>
          )}
          {/* Fixed dark ink so the copy stays readable on the light banner in
              both light and dark themes (arbitrary colours aren't theme-remapped). */}
          <h1 className="mt-3 text-2xl font-extrabold leading-[1.1] text-[#1e293b] sm:mt-5 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="mt-2 text-sm font-medium text-[#334155] sm:mt-4 sm:text-lg">
              {slide.subtitle}
            </p>
          )}
          <Link
            to={slide.link || '/shop'}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-5 text-xs font-bold uppercase tracking-wide text-dark shadow-card transition hover:shadow-lift sm:mt-7 sm:gap-2.5 sm:py-3 sm:pl-3 sm:pr-7 sm:text-sm"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white sm:h-7 sm:w-7">
              <FaArrowRight size={12} />
            </span>
            {slide.buttonText || 'Shop Now'}
          </Link>
        </div>
      </div>

      {/* Prev / next arrows (desktop; mobile uses swipe) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-dark shadow-md backdrop-blur transition hover:bg-white sm:flex"
          >
            <FaArrowRight className="rotate-180" size={14} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-dark shadow-md backdrop-blur transition hover:bg-white sm:flex"
          >
            <FaArrowRight size={14} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-7 bg-primary' : 'w-2.5 bg-slate-400/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
