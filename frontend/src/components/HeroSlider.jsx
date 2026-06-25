import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides])

  const slide = slides[index] || slides[0]
  const bg = slide.bgColor || '#fbe3ec'

  return (
    <section className="relative mt-[5px] w-full overflow-hidden" style={{ backgroundColor: bg }}>
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
        <div className="max-w-md py-16 sm:max-w-lg sm:py-24 lg:py-32">
          {slide.badge && (
            <span className="inline-block rounded-md bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {slide.badge}
            </span>
          )}
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-dark sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="mt-4 text-lg font-medium text-slate-700">{slide.subtitle}</p>
          )}
          <Link
            to={slide.link || '/shop'}
            className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-white py-3 pl-3 pr-7 text-sm font-bold uppercase tracking-wide text-dark shadow-card transition hover:shadow-lift"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
              <FaArrowRight size={12} />
            </span>
            {slide.buttonText || 'Shop Now'}
          </Link>
        </div>
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
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
