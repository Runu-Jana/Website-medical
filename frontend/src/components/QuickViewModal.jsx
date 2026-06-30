import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaTimes,
  FaRegHeart,
  FaExchangeAlt,
  FaQuestionCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaFire,
  FaRegEye,
  FaShippingFast,
  FaBoxOpen,
  FaShieldAlt,
} from 'react-icons/fa'
import RatingStars from './RatingStars'
import QuantitySelector from './QuantitySelector'
import { useCart } from '../context/CartContext'
import { formatPrice, imgFallback, productImage, stableNumber } from '../lib/helpers'

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  if (!product) return null

  const images = product.images?.length ? product.images : [productImage(product)]
  const outOfStock = product.countInStock <= 0
  const link = `/product/${product.slug || product._id}`
  const sold = stableNumber(product._id + 's', 5, 25)
  const viewing = stableNumber(product._id + 'v', 12, 60)

  const buyNow = () => {
    addToCart(product, qty)
    navigate('/cart')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-lift sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-lightbg hover:text-dark"
        >
          <FaTimes size={18} />
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="card flex aspect-square items-center justify-center overflow-hidden bg-white p-6">
              <img
                src={images[activeImg]}
                onError={imgFallback}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white p-1 ${
                      activeImg === i ? 'border-primary' : 'border-bordergray'
                    }`}
                  >
                    <img src={img} onError={imgFallback} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3">
              <RatingStars rating={product.rating} count={product.numReviews} />
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                  outOfStock ? 'border border-red-200 text-red-500' : 'border border-green-200 text-green-600'
                }`}
              >
                {outOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-dark">{product.name}</h2>
            {product.shortDescription && (
              <p className="mt-1 text-sm text-slate-400">{product.shortDescription}</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-dark">{formatPrice(product.price)}</span>
              {product.oldPrice > product.price && (
                <span className="text-lg text-slate-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-red-500">
                <FaFire /> {sold} products sold in last 24 hours
              </p>
              <p className="flex items-center gap-2 text-slate-500">
                <FaRegEye /> {viewing} people are viewing this right now
              </p>
            </div>

            {!outOfStock && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <QuantitySelector qty={qty} setQty={setQty} max={product.countInStock} />
                <button onClick={() => addToCart(product, qty)} className="btn-primary flex-1">
                  Add to Cart
                </button>
              </div>
            )}
            <button
              onClick={buyNow}
              disabled={outOfStock}
              className="btn-outline mt-3 w-full"
            >
              {outOfStock ? 'Out of Stock' : 'Buy Now'}
            </button>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><FaRegHeart /> Add to wishlist</span>
              <span className="flex items-center gap-1.5"><FaExchangeAlt /> Compare</span>
              <span className="flex items-center gap-1.5"><FaQuestionCircle /> Ask Us</span>
            </div>

            <hr className="my-5 border-bordergray" />

            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><FaShippingFast className="text-slate-400" /> Free Shipping &amp; Returns on this item</li>
              <li className="flex items-center gap-2"><FaBoxOpen className="text-slate-400" /> Delivery within 3-5 working days</li>
              <li className="flex items-center gap-2"><FaShieldAlt className="text-slate-400" /> Money Back Guarantee</li>
            </ul>

            <Link to={link} onClick={onClose} className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
