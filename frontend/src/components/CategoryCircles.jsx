import { Link } from 'react-router-dom'
import { FaPills } from 'react-icons/fa'
import { imgFallback } from '../lib/helpers'

// Swipeable round category icons (1mg-style top strip).
export default function CategoryCircles({ categories }) {
  if (!categories?.length) return null
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => (
        <Link
          key={c._id}
          to={`/shop?category=${c._id}`}
          className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center sm:w-20"
        >
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-primary/10 transition group-hover:bg-primary group-hover:text-white sm:h-[72px] sm:w-[72px]">
            {c.image ? (
              <img
                src={c.image}
                onError={imgFallback}
                alt={c.name}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <FaPills size={26} />
            )}
          </span>
          <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-700 group-hover:text-primary sm:text-xs">
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
