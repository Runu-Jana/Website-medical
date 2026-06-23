import { Link } from 'react-router-dom'
import { FaCartPlus, FaPrescriptionBottleAlt } from 'react-icons/fa'
import RatingStars from './RatingStars'
import { useCart } from '../context/CartContext'
import { formatPrice, productImage, imgFallback } from '../lib/helpers'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const outOfStock = product.countInStock <= 0
  const link = `/product/${product.slug || product._id}`

  return (
    <div className="card group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
        <Link to={link} className="block aspect-square overflow-hidden bg-lightbg">
          <img
            src={productImage(product)}
            onError={imgFallback}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.oldPrice > product.price && product.discountPercent > 0 && (
            <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{product.discountPercent}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-white">
              New
            </span>
          )}
        </div>
        {product.requiresPrescription && (
          <span
            title="Prescription required"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600"
          >
            <FaPrescriptionBottleAlt size={13} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand?.name && (
          <span className="text-xs font-medium text-slate-400">{product.brand.name}</span>
        )}
        <Link
          to={link}
          className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-dark hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-1.5">
          <RatingStars rating={product.rating} count={product.numReviews} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          {product.oldPrice > product.price && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={outOfStock}
          onClick={() => addToCart(product)}
          className="btn-primary mt-3 w-full"
        >
          <FaCartPlus />
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
