import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaCartPlus,
  FaPrescriptionBottleAlt,
  FaRegHeart,
  FaHeart,
  FaExchangeAlt,
  FaSearch,
} from 'react-icons/fa'
import RatingStars from './RatingStars'
import QuickViewModal from './QuickViewModal'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import DeliveryPromise from './DeliveryPromise'
import { formatPrice, productImage, imgFallback, isInList, toggleInList, savingsAmount } from '../lib/helpers'

function HoverIcon({ label, active, onClick, children }) {
  return (
    <div className="group/btn relative">
      <button
        type="button"
        onClick={onClick}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
          active
            ? 'border-primary bg-primary text-white'
            : 'border-bordergray bg-white text-slate-600 hover:bg-primary hover:text-white'
        }`}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-dark px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover/btn:opacity-100">
        {label}
      </span>
    </div>
  )
}

export default function ProductCard({ product, list = false }) {
  const { addToCart } = useCart()
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()
  const outOfStock = product.countInStock <= 0
  const link = `/product/${product.slug || product._id}`
  const fav = isWishlisted(product._id)

  const [quickOpen, setQuickOpen] = useState(false)
  const [compared, setCompared] = useState(() => isInList('compare', product._id))

  const stop = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const toggleFav = (e) => {
    stop(e)
    toggleWishlist(product)
  }
  const toggleCompare = (e) => {
    stop(e)
    setCompared(toggleInList('compare', product._id))
  }
  const openQuick = (e) => {
    stop(e)
    setQuickOpen(true)
  }

  return (
    <>
      <div
        className={`card group overflow-hidden hover:shadow-lift ${
          list ? 'flex flex-row' : 'flex flex-col hover:-translate-y-1'
        }`}
      >
        <div className={`relative ${list ? 'w-32 shrink-0 sm:w-52' : ''}`}>
          <Link to={link} className="block aspect-square overflow-hidden bg-white">
            <img
              src={productImage(product)}
              onError={imgFallback}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
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

          {/* Hover action icons */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex translate-y-2 justify-center gap-2 opacity-0 transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <HoverIcon label="Wishlist" active={fav} onClick={toggleFav}>
              {fav ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
            </HoverIcon>
            <HoverIcon label="Compare" active={compared} onClick={toggleCompare}>
              <FaExchangeAlt size={13} />
            </HoverIcon>
            <HoverIcon label="Quick View" onClick={openQuick}>
              <FaSearch size={13} />
            </HoverIcon>
          </div>
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
          {list && product.shortDescription && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{product.shortDescription}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            {product.oldPrice > product.price && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          {savingsAmount(product) > 0 && (
            <p className="mt-1 text-xs font-semibold text-emerald-600">
              You save {formatPrice(savingsAmount(product))}
            </p>
          )}
          {!outOfStock && <DeliveryPromise className="mt-1.5" />}

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product)}
            className={`btn-primary mt-3 w-full ${list ? 'sm:w-48' : ''}`}
          >
            <FaCartPlus />
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {quickOpen && <QuickViewModal product={product} onClose={() => setQuickOpen(false)} />}
    </>
  )
}
