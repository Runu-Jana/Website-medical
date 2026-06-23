import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'

const slides = [
  {
    badge: 'Trusted Pharmacy',
    title: 'Your Health, Delivered to Your Door',
    text: 'Genuine medicines, wellness products and medical supplies — fast and reliable.',
    cta: 'Shop Now',
    gradient: 'from-primary to-primaryDark',
  },
  {
    badge: 'Up to 40% Off',
    title: 'Deals on Daily Essentials & Vitamins',
    text: 'Stock up on health essentials at unbeatable prices, every single day.',
    cta: 'Grab the Deals',
    gradient: 'from-primaryDark to-accent',
  },
  {
    badge: '24/7 Care',
    title: 'Certified & Genuine Products Only',
    text: 'Every product is verified and sourced from authorized distributors.',
    cta: 'Explore Store',
    gradient: 'from-accent to-primary',
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
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${slide.gradient} px-6 py-12 text-white transition-all duration-500 sm:px-12 sm:py-16 lg:py-24`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative max-w-xl">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {slide.badge}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/90 sm:text-base">{slide.text}</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-lightbg"
          >
            {slide.cta} <FaArrowRight />
          </Link>
        </div>

        <div className="absolute bottom-6 left-6 flex gap-2 sm:left-12">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
