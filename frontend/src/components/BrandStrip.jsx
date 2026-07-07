import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { imgFallback } from '../lib/helpers'

// 1mg-style "Featured brands" — swipeable round white tiles with logos.
export default function BrandStrip({ brands }) {
  const scroller = useRef(null)
  if (!brands?.length) return null

  const scrollBy = (dir) => {
    const el = scroller.current
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' })
  }

  // Deterministic soft tint for logo-less brands (no Math.random needed).
  const tints = [
    'text-sky-600',
    'text-emerald-600',
    'text-rose-600',
    'text-violet-600',
    'text-amber-600',
    'text-indigo-600',
  ]

  return (
    <section className="container-x mt-14">
      <div className="mb-5 flex items-center justify-between border-b border-bordergray pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Trusted</p>
          <h2 className="text-2xl font-extrabold text-dark">Featured Brands</h2>
        </div>
        <Link
          to="/brands"
          className="flex items-center gap-1 rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
        >
          See all <FaChevronRight size={11} />
        </Link>
      </div>

      <div className="group relative">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-bordergray bg-white text-slate-600 shadow-card transition hover:text-primary lg:flex"
        >
          <FaChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-bordergray bg-white text-slate-600 shadow-card transition hover:text-primary lg:flex"
        >
          <FaChevronRight />
        </button>

        <div
          ref={scroller}
          className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {brands.map((b, i) => (
            <Link
              key={b._id}
              to={`/shop?brand=${b._id}`}
              className="group/brand flex w-28 shrink-0 snap-start flex-col items-center gap-2 sm:w-32"
              title={b.name}
            >
              <span className="flex h-24 w-24 items-center justify-center rounded-full border border-bordergray bg-white p-4 shadow-card transition duration-300 group-hover/brand:-translate-y-1 group-hover/brand:border-primary group-hover/brand:shadow-lift sm:h-28 sm:w-28">
                {b.logo ? (
                  <img
                    src={b.logo}
                    onError={imgFallback}
                    alt={b.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className={`text-lg font-extrabold ${tints[i % tints.length]}`}>
                    {b.name}
                  </span>
                )}
              </span>
              <span className="line-clamp-1 text-xs font-medium text-slate-600 group-hover/brand:text-primary">
                {b.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
