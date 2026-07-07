import { useRef } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import ProductCard from './ProductCard'
import { SkeletonCard } from './ProductSkeleton'

// Horizontal, swipeable product row with desktop arrow controls.
export default function ProductCarousel({ products, loading }) {
  const scroller = useRef(null)

  const scrollBy = (dir) => {
    const el = scroller.current
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <div className="group relative">
      {/* Desktop arrows */}
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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {(loading ? Array.from({ length: 6 }) : products).map((p, i) => (
          <div
            key={loading ? i : p._id}
            className="w-40 shrink-0 snap-start sm:w-52 lg:w-56"
          >
            {loading ? <SkeletonCard /> : <ProductCard product={p} />}
          </div>
        ))}
      </div>
    </div>
  )
}
