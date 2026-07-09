import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import HeroSlider from '../components/HeroSlider'
import TrustBar from '../components/TrustBar'
import FeatureStrip from '../components/FeatureStrip'
import SectionHeading from '../components/SectionHeading'
import CategoryCard from '../components/CategoryCard'
import CategoryCircles from '../components/CategoryCircles'
import BrandStrip from '../components/BrandStrip'
import CouponStrip from '../components/CouponStrip'
import HealthCorner from '../components/HealthCorner'
import ProductCarousel from '../components/ProductCarousel'
import ProductSkeleton from '../components/ProductSkeleton'
import ProductCard from '../components/ProductCard'
import NewLaunches from '../components/NewLaunches'
import BlogTeaser from '../components/BlogTeaser'
import Testimonials from '../components/Testimonials'
import CountdownTimer from '../components/CountdownTimer'
import { FaArrowRight } from 'react-icons/fa'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [deals, setDeals] = useState([])
  const [featured, setFeatured] = useState([])
  const [bestsellers, setBestsellers] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [brands, setBrands] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchAll = async () => {
      try {
        const [cats, deal, feat, best, news, latest, brnds, cpns] = await Promise.all([
          api.get('/categories'),
          api.get('/products', { params: { deal: true, limit: 4 } }),
          api.get('/products', { params: { featured: true, limit: 8 } }),
          api.get('/products', { params: { bestseller: true, limit: 8 } }),
          api.get('/products', { params: { isNew: true, limit: 8 } }),
          api.get('/products', { params: { sort: 'newest', limit: 8 } }),
          api.get('/brands'),
          api.get('/coupons/active').catch(() => ({ data: [] })),
        ])
        if (!active) return
        // Fall back to the latest products when a flagged list is empty,
        // so these sections always show products.
        const fallback = latest.data.products || []
        const orFallback = (list) => (list && list.length ? list : fallback)
        setCategories(Array.isArray(cats.data) ? cats.data : [])
        setDeals(deal.data.products || [])
        setFeatured(orFallback(feat.data.products))
        setBestsellers(orFallback(best.data.products))
        setNewArrivals(orFallback(news.data.products))
        setBrands(Array.isArray(brnds.data) ? brnds.data : [])
        setCoupons(Array.isArray(cpns.data) ? cpns.data : [])
      } catch {
        /* keep empty states */
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchAll()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <>
        <HeroSlider />
        <TrustBar />
        <section className="container-x mt-10">
          <ProductSkeleton count={8} />
        </section>
      </>
    )
  }

  const dealProduct = deals[0]

  // Turn an admin coupon into a promo-panel offer, falling back to a default.
  const offerFrom = (coupon, fallback) => {
    if (!coupon) return fallback
    return {
      discount: coupon.type === 'percent' ? `${Math.round(coupon.value)}%` : `₹${Math.round(coupon.value)}`,
      subtitle: coupon.description || fallback.subtitle,
      coupon: coupon.code,
      bg: fallback.bg,
    }
  }
  const newLaunchOffer = offerFrom(coupons[0], {
    discount: '15%',
    subtitle: 'For new member sign up\nat the first time',
    coupon: 'COUPON15',
    bg: 'bg-[#dcf3e4]',
  })
  const bestsellerOffer = offerFrom(coupons[1] || coupons[0], {
    discount: '20%',
    subtitle: 'On your favourite\nbest-selling products',
    coupon: 'BESTSELLER20',
    bg: 'bg-[#e6eefc]',
  })

  return (
    <div className="pb-4">
      <HeroSlider />
      <TrustBar />
      <CouponStrip coupons={coupons} />
      <FeatureStrip />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-x mt-14">
          <SectionHeading
            subtitle="Browse"
            title="Shop by Category"
            link="/shop"
            linkText="All Categories"
          />
          {/* Mobile: compact swipeable circles. Desktop: larger card grid. */}
          <div className="lg:hidden">
            <CategoryCircles categories={categories.slice(0, 14)} />
          </div>
          <div className="hidden gap-4 lg:grid lg:grid-cols-6">
            {categories.slice(0, 12).map((c) => (
              <CategoryCard key={c._id} category={c} />
            ))}
          </div>
        </section>
      )}

      {/* Deal of the day */}
      {deals.length > 0 && (
        <section className="container-x mt-14">
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-bordergray bg-gradient-to-r from-primary/5 to-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                  Limited Time
                </p>
                <h2 className="text-xl font-bold text-dark sm:text-2xl">Deal of the Day</h2>
              </div>
              {dealProduct?.dealEndsAt && <CountdownTimer endsAt={dealProduct.dealEndsAt} />}
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              {deals.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container-x mt-14">
        <SectionHeading
          subtitle="Handpicked"
          title="Featured Products"
          link="/shop?featured=true"
        />
        <ProductCarousel products={featured} />
      </section>

      {/* Health Corner — shop by concern */}
      <HealthCorner />

      {/* Promo banners */}
      <section className="container-x mt-14 grid gap-4 sm:grid-cols-2">
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-8 text-white">
          <h3 className="text-2xl font-bold">Vitamins & Supplements</h3>
          <p className="mt-2 max-w-xs text-sm text-white/90">
            Boost your immunity with up to 30% off select supplements.
          </p>
          <div className="mt-auto pt-5">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary"
            >
              Shop Now <FaArrowRight />
            </Link>
          </div>
        </div>
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-emerald-700 p-8 text-white">
          <h3 className="text-2xl font-bold">Medical Devices</h3>
          <p className="mt-2 max-w-xs text-sm text-white/90">
            Reliable monitors and equipment for home health care.
          </p>
          <div className="mt-auto pt-5">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-accent"
            >
              Explore <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* New launches */}
      <section className="container-x mt-14">
        <h2 className="mb-6 text-3xl font-extrabold text-dark">New Launches</h2>
        <NewLaunches products={newArrivals} offer={newLaunchOffer} />
      </section>

      {/* Best sellers (promo row) */}
      <section className="container-x mt-14">
        <h2 className="mb-6 text-3xl font-extrabold text-dark">Best Sellers</h2>
        <NewLaunches products={bestsellers} offer={bestsellerOffer} />
      </section>

      {/* Blog teaser */}
      <BlogTeaser />

      {/* Brands */}
      <BrandStrip brands={brands} />

      {/* Newsletter */}
      <section className="container-x mt-14">
        <div className="rounded-2xl bg-dark px-6 py-10 text-center text-white sm:px-12">
          <h3 className="text-2xl font-bold">Subscribe to our Newsletter</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Get the latest offers, health tips and product updates delivered to your inbox.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="input-base flex-1 text-dark"
            />
            <button type="submit" className="btn-accent shrink-0">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />
    </div>
  )
}
