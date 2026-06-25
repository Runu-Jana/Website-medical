import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import RatingStars from '../components/RatingStars'
import QuantitySelector from '../components/QuantitySelector'
import ProductCard from '../components/ProductCard'
import SectionHeading from '../components/SectionHeading'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, imgFallback, PLACEHOLDER_IMG } from '../lib/helpers'
import {
  FaCartPlus,
  FaBolt,
  FaPrescriptionBottleAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearchPlus,
} from 'react-icons/fa'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [variantIdx, setVariantIdx] = useState(0)
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 })
  const [tab, setTab] = useState('description')

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewMsg, setReviewMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setQty(1)
    setActiveImg(0)
    setVariantIdx(0)
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        if (!active) return
        setProduct(data.product)
        setRelated(data.related || [])
      })
      .catch(() => active && setProduct(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <Spinner className="py-32" />

  if (!product) {
    return (
      <div className="container-x py-24 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link to="/shop" className="btn-primary mt-6">
          Back to Shop
        </Link>
      </div>
    )
  }

  const images = product.images && product.images.length ? product.images : [PLACEHOLDER_IMG]
  const outOfStock = product.countInStock <= 0

  const handleBuyNow = () => {
    addToCart(product, qty)
    navigate('/cart')
  }

  const submitReview = async (e) => {
    e.preventDefault()
    setReviewMsg('')
    setSubmitting(true)
    try {
      await api.post(`/products/${product._id}/reviews`, { rating, comment })
      setReviewMsg('Review submitted! It will appear after refresh.')
      setComment('')
      const { data } = await api.get(`/products/${slug}`)
      setProduct(data.product)
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Could not submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-x py-8">
      <nav className="mb-5 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">Home</Link> /{' '}
        <Link to="/shop" className="hover:text-primary">Shop</Link> /{' '}
        <span className="text-dark">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div
            className="card group relative flex aspect-square cursor-zoom-in items-center justify-center overflow-hidden bg-white p-6"
            onMouseEnter={() => setZoom((z) => ({ ...z, active: true }))}
            onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setZoom({
                active: true,
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
              })
            }}
          >
            <img
              src={images[activeImg]}
              onError={imgFallback}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
              style={{
                transform: zoom.active ? 'scale(2)' : 'scale(1)',
                transformOrigin: `${zoom.x}% ${zoom.y}%`,
              }}
            />
            <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 opacity-0 shadow-card transition group-hover:opacity-100">
              <FaSearchPlus size={15} />
            </span>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white p-1.5 ${
                    activeImg === i ? 'border-primary' : 'border-bordergray'
                  }`}
                >
                  <img
                    src={img}
                    onError={imgFallback}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand?.name && (
            <span className="text-sm font-medium text-slate-400">{product.brand.name}</span>
          )}
          <h1 className="mt-1 text-2xl font-bold text-dark sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <RatingStars rating={product.rating} count={product.numReviews} />
            {product.sku && <span className="text-xs text-slate-400">SKU: {product.sku}</span>}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            {product.oldPrice > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
                <span className="rounded-md bg-red-500 px-2 py-0.5 text-sm font-bold text-white">
                  -{product.discountPercent}%
                </span>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {product.shortDescription}
            </p>
          )}

          {product.variants?.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-dark">
                Color:{' '}
                <span className="font-normal text-slate-500">
                  {product.variants[variantIdx]?.label}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                {product.variants.map((v, i) => {
                  const soldOut = v.available === false
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setVariantIdx(i)}
                      title={`${v.label || 'Variant'}${soldOut ? ' — sold out' : ''}`}
                      className={`relative h-9 w-9 rounded-full border-2 transition ${
                        i === variantIdx && !soldOut
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-bordergray'
                      } ${
                        soldOut ? 'cursor-not-allowed opacity-40' : 'hover:border-primary'
                      }`}
                      style={{ backgroundColor: v.color || '#e2e8f0' }}
                    >
                      {soldOut && (
                        <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            {outOfStock ? (
              <span className="flex items-center gap-1.5 font-semibold text-red-500">
                <FaTimesCircle /> Out of Stock
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-accent">
                <FaCheckCircle /> In Stock ({product.countInStock} {product.unit || 'units'})
              </span>
            )}
            {product.requiresPrescription && (
              <span className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <FaPrescriptionBottleAlt /> Prescription Required
              </span>
            )}
          </div>

          {!outOfStock && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantitySelector qty={qty} setQty={setQty} max={product.countInStock} />
              <button onClick={() => addToCart(product, qty)} className="btn-primary">
                <FaCartPlus /> Add to Cart
              </button>
              <button onClick={handleBuyNow} className="btn-accent">
                <FaBolt /> Buy Now
              </button>
            </div>
          )}

          {product.category?.name && (
            <p className="mt-6 text-sm text-slate-500">
              Category:{' '}
              <Link
                to={`/shop?category=${product.category._id}`}
                className="font-medium text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            </p>
          )}
          {product.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="rounded-full bg-lightbg px-3 py-1 text-xs text-slate-500">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex flex-wrap gap-2 border-b border-bordergray">
          {[
            { id: 'description', label: 'Description' },
            { id: 'info', label: 'Additional Info' },
            { id: 'reviews', label: `Reviews (${product.numReviews || 0})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === 'description' && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description || product.shortDescription || 'No description available.'}
            </p>
          )}

          {tab === 'info' && (
            <table className="w-full max-w-lg text-sm">
              <tbody className="divide-y divide-bordergray">
                {[
                  ['Brand', product.brand?.name],
                  ['Category', product.category?.name],
                  ['Unit', product.unit],
                  ['SKU', product.sku],
                  ['Stock', product.countInStock],
                  ['Prescription', product.requiresPrescription ? 'Required' : 'Not required'],
                ]
                  .filter(([, v]) => v !== undefined && v !== null && v !== '')
                  .map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-2 pr-4 font-semibold text-dark">{k}</td>
                      <td className="py-2 text-slate-600">{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {tab === 'reviews' && (
            <div className="max-w-2xl">
              {product.reviews?.length > 0 ? (
                <ul className="space-y-4">
                  {product.reviews.map((r, i) => (
                    <li key={r._id || i} className="card p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-dark">
                          {r.name || 'Anonymous'}
                        </span>
                        <RatingStars rating={r.rating} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No reviews yet. Be the first to review!</p>
              )}

              <div className="mt-8">
                <h3 className="mb-3 text-base font-bold text-dark">Write a Review</h3>
                {user ? (
                  <form onSubmit={submitReview} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Rating:</span>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="input-base w-auto py-2"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} Star{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      rows={4}
                      placeholder="Share your experience..."
                      className="input-base"
                    />
                    {reviewMsg && <p className="text-sm text-accent">{reviewMsg}</p>}
                    <button type="submit" disabled={submitting} className="btn-primary">
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-slate-500">
                    Please{' '}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                      log in
                    </Link>{' '}
                    to write a review.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading subtitle="You may also like" title="Related Products" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
