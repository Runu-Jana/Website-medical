import { Link } from 'react-router-dom'
import { FaPills } from 'react-icons/fa'
import { imgFallback } from '../lib/helpers'

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/shop?category=${category._id}`}
      className="card group flex flex-col items-center p-5 text-center hover:-translate-y-1 hover:border-primary hover:shadow-lift"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        {category.image ? (
          <img
            src={category.image}
            onError={imgFallback}
            alt={category.name}
            className="h-10 w-10 object-contain"
          />
        ) : (
          <FaPills size={26} />
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-dark group-hover:text-primary">
        {category.name}
      </h3>
      {category.productCount !== undefined && (
        <span className="mt-0.5 text-xs text-slate-400">
          {category.productCount} items
        </span>
      )}
    </Link>
  )
}
