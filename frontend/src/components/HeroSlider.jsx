import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import { imgFallback } from '../lib/helpers'

const slides = [
  {
    badge: 'HOT',
    title: 'New Collagen Naturally',
    subtitle: 'Orange Flavor Gummies',
    cta: 'Shop Now',
    to: '/shop',
    bg: 'bg-[#fbe3ec]',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80',
  },
  {
    badge: 'Sale',
    title: 'Daily Vitamins & Immunity',
    subtitle: 'Up to 40% off this week',
    cta: 'Grab the Deals',
    to: '/shop?deal=true',
    bg: 'bg-[#e3f1ec]',
    image: 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=800&q=80',
  },
  {
    badge: 'New',
    title: 'Trusted Health Essentials',
    subtitle: 'Genuine products, delivered fast',
    cta: 'Explore Store',
    to: '/shop',
    bg: 'bg-[#eae6f7]',
    image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80',
  },
]

export default function HeroSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  const slide = slides[index]

  return (
    <div className="container-x mt-4">
      <div
        className={`relative overflow-hidden rounded-2xl ${slide.bg} transition-colors duration-500`}
      >
        <div className="grid items-center gap-6 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-2 lg:py-20">
          {/* Text */}
          <div className="relative z-10 max-w-xl">
            <span className="inline-block rounded-md bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {slide.badge}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-dark sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-4 text-lg font-medium text-slate-700">{slide.subtitle}</p>
            <Link
              to={slide.to}
              className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-white py-3 pl-3 pr-7 text-sm font-bold uppercase tracking-wide text-dark shadow-card transition hover:shadow-lift"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                <FaArrowRight size={12} />
              </span>
              {slide.cta}
            </Link>
          </div>

          {/* Image */}
          <div className="relative flex h-48 items-center justify-center sm:h-64 lg:h-80">
            <img
              src={slide.image}
              onError={imgFallback}
              alt={slide.title}
              className="max-h-full max-w-full object-contain drop-shadow-xl"
            />
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-7 bg-primary' : 'w-2.5 bg-slate-400/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
