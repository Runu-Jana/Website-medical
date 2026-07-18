import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import RatingStars from '../components/RatingStars'
import QuantitySelector from '../components/QuantitySelector'
import ProductCard from '../components/ProductCard'
import ProductCarousel from '../components/ProductCarousel'
import SectionHeading from '../components/SectionHeading'
import Seo from '../components/Seo'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import DeliveryPromise from '../components/DeliveryPromise'
import { formatPrice, imgFallback, PLACEHOLDER_IMG, savingsAmount } from '../lib/helpers'
import { shareProduct } from '../lib/share'
import {
  FaCartPlus,
  FaBolt,
  FaPrescriptionBottleAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearchPlus,
  FaChevronDown,
  FaStar,
  FaShareAlt,
} from 'react-icons/fa'

// Collapsible FAQ row for the product page.
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-dark">{q}</span>
        <FaChevronDown
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          size={14}
        />
      </button>
      {open && (
        <p className="whitespace-pre-line border-t border-bordergray px-4 py-3 text-sm leading-relaxed text-slate-600">
          {a}
        </p>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [substitutes, setSubstitutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [variantIdx, setVariantIdx] = useState(0)
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 })
  const [tab, setTab] = useState('description')
  const [overviewOpen, setOverviewOpen] = useState(false)

  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
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
        // Substitutes: other products with the same salt composition.
        const salt = data.product?.saltComposition?.trim()
        if (salt) {
          api
            .get('/products', { params: { salt, exclude: data.product._id, limit: 8 } })
            .then(({ data: sub }) => active && setSubstitutes(sub.products || []))
            .catch(() => active && setSubstitutes([]))
        } else {
          setSubstitutes([])
        }
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

  // Structured medicine info shown in its own tab when any field is present.
  const medFacts = [
    ['Uses', product.uses],
    ['Benefits', product.benefits],
    ['Side Effects', product.sideEffects],
    ['Directions for Use', product.directions],
    ["Do's & Don'ts", product.dosAndDonts],
    ['Storage', product.storage],
  ].filter(([, v]) => v)
  const hasMedInfo =
    medFacts.length > 0 ||
    product.saltComposition ||
    product.strength ||
    product.dosageForm
  const faqs = Array.isArray(product.faqs)
    ? product.faqs.filter((f) => f && f.question && f.answer)
    : []

  // Benefits as a checklist (split on newlines / bullets / semicolons).
  const benefitList = (product.benefits || '')
    .split(/\r?\n|•|;/)
    .map((s) => s.trim())
    .filter(Boolean)

  // Product overview text (full description, falling back to the short one).
  const overviewText = product.description || product.shortDescription || ''
  const overviewLong = overviewText.length > 180

  // Detail tabs (Description is now shown inline as "Product Overview").
  const tabItems = [
    ...(hasMedInfo ? [{ id: 'medicine', label: 'Medicine Details' }] : []),
    { id: 'info', label: 'Additional Info' },
    ...(faqs.length ? [{ id: 'faqs', label: `FAQs (${faqs.length})` }] : []),
    { id: 'reviews', label: `Reviews (${product.numReviews || 0})` },
  ]
  const activeTab = tabItems.some((t) => t.id === tab) ? tab : tabItems[0]?.id

  const handleBuyNow = () => {
    if (addToCart(product, qty)) navigate('/cart')
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

  const seoImage = product.thumbnail || product.images?.[0] || ''
  const productJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.length ? product.images : seoImage ? [seoImage] : undefined,
    description: (product.metaDescription || overviewText || product.name).slice(0, 300),
    sku: product.sku || product._id,
    brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
    ...(product.rating > 0 && product.numReviews > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.numReviews } }
      : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: product.countInStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <div className="container-x py-8">
      <Seo
        title={product.seoTitle || product.name}
        description={product.metaDescription || product.shortDescription || overviewText || product.name}
        image={seoImage}
        type="product"
        jsonLd={productJsonLd}
      />
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
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-dark sm:text-3xl">{product.name}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const result = await shareProduct(product)
                  if (result === 'copied') showToast({ title: 'Link copied', subtitle: 'Share it with anyone.', tone: 'success' })
                  else if (result === 'failed') showToast({ title: 'Could not share this product', tone: 'info' })
                }}
                aria-label="Share this product"
                title="Share"
                className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-bordergray text-slate-600 transition hover:border-primary hover:bg-primary hover:text-white"
              >
                <FaShareAlt size={14} />
              </button>
              <span
                className={`mt-1 rounded-md border px-2 py-1 text-xs font-bold ${
                  product.requiresPrescription
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                }`}
                title={product.requiresPrescription ? 'Prescription required' : 'Over the counter'}
              >
                {product.requiresPrescription ? 'Rx' : 'OTC'}
              </span>
            </div>
          </div>
          {(product.packSize || product.unit) && (
            <p className="mt-1 text-sm text-slate-500">
              {product.packSize || `Pack: ${product.unit}`}
            </p>
          )}
          {product.vendorName && (
            <p className="mt-1 text-xs text-slate-500">
              Sold by <span className="font-semibold text-dark">{product.vendorName}</span>
            </p>
          )}
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
          <p className="mt-1 text-xs text-slate-400">Inclusive of all taxes</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {savingsAmount(product) > 0 && (
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                You save {formatPrice(savingsAmount(product))}
              </span>
            )}
            {!outOfStock && <DeliveryPromise />}
          </div>

          {/* Product Overview */}
          {overviewText && (
            <div className="mt-5">
              <h3 className="text-base font-bold text-dark">Product Overview</h3>
              <p
                className={`mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600 ${
                  !overviewOpen && overviewLong ? 'line-clamp-3' : ''
                }`}
              >
                {overviewText}
              </p>
              {overviewLong && (
                <button
                  onClick={() => setOverviewOpen((o) => !o)}
                  className="mt-1 text-sm font-semibold text-primary hover:underline"
                >
                  {overviewOpen ? 'View Less ▲' : 'View More ▼'}
                </button>
              )}
            </div>
          )}

          {/* Benefits */}
          {benefitList.length > 0 && (
            <div className="mt-5">
              <h3 className="text-base font-bold text-dark">Benefits</h3>
              <ul className="mt-2 space-y-2">
                {benefitList.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key pharma highlights */}
          {(product.saltComposition || product.manufacturer || product.strength) && (
            <div className="mt-4 space-y-1 rounded-xl bg-lightbg p-3 text-sm">
              {product.saltComposition && (
                <p className="text-slate-600">
                  <span className="font-semibold text-dark">Composition:</span>{' '}
                  {product.saltComposition}
                </p>
              )}
              {product.strength && (
                <p className="text-slate-600">
                  <span className="font-semibold text-dark">Strength:</span> {product.strength}
                  {product.dosageForm ? ` · ${product.dosageForm}` : ''}
                </p>
              )}
              {product.manufacturer && (
                <p className="text-slate-600">
                  <span className="font-semibold text-dark">Manufacturer:</span>{' '}
                  {product.manufacturer}
                </p>
              )}
            </div>
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
          {tabItems.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'medicine' && (
            <div className="max-w-2xl space-y-6">
              {(product.saltComposition || product.strength || product.dosageForm) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {product.saltComposition && (
                    <div className="rounded-xl bg-lightbg p-3">
                      <p className="text-xs text-slate-500">Salt Composition</p>
                      <p className="text-sm font-semibold text-dark">{product.saltComposition}</p>
                    </div>
                  )}
                  {product.strength && (
                    <div className="rounded-xl bg-lightbg p-3">
                      <p className="text-xs text-slate-500">Strength</p>
                      <p className="text-sm font-semibold text-dark">{product.strength}</p>
                    </div>
                  )}
                  {product.dosageForm && (
                    <div className="rounded-xl bg-lightbg p-3">
                      <p className="text-xs text-slate-500">Dosage Form</p>
                      <p className="text-sm font-semibold text-dark">{product.dosageForm}</p>
                    </div>
                  )}
                </div>
              )}
              {medFacts.map(([k, v]) => (
                <div key={k}>
                  <h3 className="text-base font-bold text-dark">{k}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">{v}</p>
                </div>
              ))}
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                This information is for reference only and is not a substitute for professional
                medical advice. Always consult a doctor or pharmacist before use.{' '}
                <Link to="/disclaimer" className="font-semibold underline">
                  Read our medical disclaimer
                </Link>
                .
              </p>
            </div>
          )}

          {activeTab === 'info' && (
            <table className="w-full max-w-lg text-sm">
              <tbody className="divide-y divide-bordergray">
                {[
                  ['Brand', product.brand?.name],
                  ['Generic Name', product.genericName],
                  ['Manufacturer', product.manufacturer],
                  ['Category', product.category?.name],
                  ['Sub Category', product.subCategory],
                  ['Pack Size', product.packSize],
                  ['Unit', product.unit],
                  ['HSN Code', product.hsnCode],
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

          {activeTab === 'faqs' && (
            <div className="max-w-2xl space-y-3">
              {faqs.map((f, i) => (
                <FaqItem key={i} q={f.question} a={f.answer} />
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
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
                      <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHoverRating(n)}
                            aria-label={`${n} star${n > 1 ? 's' : ''}`}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <FaStar
                              size={26}
                              className={
                                (hoverRating || rating) >= n ? 'text-yellow-400' : 'text-slate-300'
                              }
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm font-medium text-slate-500">
                          {hoverRating || rating} of 5
                        </span>
                      </div>
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

      {/* Substitutes — same salt composition */}
      {substitutes.length > 0 && (
        <section className="mt-12">
          <SectionHeading
            subtitle="Same composition"
            title="Substitutes & Alternatives"
          />
          <p className="-mt-2 mb-4 text-sm text-slate-500">
            Products with the same salt{product.saltComposition ? ` (${product.saltComposition})` : ''}.
            Please consult your doctor before switching.
          </p>
          <ProductCarousel products={substitutes} />
        </section>
      )}

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

      {/* Sticky mobile add-to-cart bar (sits above the bottom nav) */}
      {!outOfStock && (
        <>
          <div className="fixed inset-x-0 bottom-16 z-40 flex items-center gap-3 border-t border-bordergray bg-white px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
            <div className="leading-tight">
              <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
              {savingsAmount(product) > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600">
                  Save {formatPrice(savingsAmount(product))}
                </p>
              )}
            </div>
            <button onClick={() => addToCart(product, qty)} className="btn-primary flex-1">
              <FaCartPlus /> Add
            </button>
            <button onClick={handleBuyNow} className="btn-accent flex-1">
              <FaBolt /> Buy Now
            </button>
          </div>
          {/* Spacer so the sticky bar doesn't cover page content */}
          <div className="h-16 md:hidden" />
        </>
      )}
    </div>
  )
}
