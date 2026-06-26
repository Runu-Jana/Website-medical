import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import HeroSlider from '../components/HeroSlider'
import FeatureStrip from '../components/FeatureStrip'
import SectionHeading from '../components/SectionHeading'
import CategoryCard from '../components/CategoryCard'
import ProductGrid from '../components/ProductGrid'
import ProductCard from '../components/ProductCard'
import NewLaunches from '../components/NewLaunches'
import BlogTeaser from '../components/BlogTeaser'
import CountdownTimer from '../components/CountdownTimer'
import Spinner from '../components/Spinner'
import { imgFallback } from '../lib/helpers'
import { FaArrowRight } from 'react-icons/fa'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [deals, setDeals] = useState([])
  const [featured, setFeatured] = useState([])
  const [bestsellers, setBestsellers] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchAll = async () => {
      try {
        const [cats, deal, feat, best, news, brnds] = await Promise.all([
          api.get('/categories'),
          api.get('/products', { params: { deal: true, limit: 4 } }),
          api.get('/products', { params: { featured: true, limit: 8 } }),
          api.get('/products', { params: { bestseller: true, limit: 8 } }),
          api.get('/products', { params: { isNew: true, limit: 8 } }),
          api.get('/brands'),
        ])
        if (!active) return
        setCategories(Array.isArray(cats.data) ? cats.data : [])
        setDeals(deal.data.products || [])
        setFeatured(feat.data.products || [])
        setBestsellers(best.data.products || [])
        setNewArrivals(news.data.products || [])
        setBrands(Array.isArray(brnds.data) ? brnds.data : [])
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
        <Spinner className="py-24" />
      </>
    )
  }

  const dealProduct = deals[0]

  return (
    <div className="pb-4">
      <HeroSlider />
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
        <ProductGrid products={featured} />
      </section>

      {/* Promo banners */}
      <section className="container-x mt-14 grid gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-8 text-white">
          <h3 className="text-2xl font-bold">Vitamins & Supplements</h3>
          <p className="mt-2 max-w-xs text-sm text-white/90">
            Boost your immunity with up to 30% off select supplements.
          </p>
          <Link
            to="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary"
          >
            Shop Now <FaArrowRight />
          </Link>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-emerald-700 p-8 text-white">
          <h3 className="text-2xl font-bold">Medical Devices</h3>
          <p className="mt-2 max-w-xs text-sm text-white/90">
            Reliable monitors and equipment for home health care.
          </p>
          <Link
            to="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-accent"
          >
            Explore <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* New launches */}
      <section className="container-x mt-14">
        <h2 className="mb-6 text-3xl font-extrabold text-dark">New Launches</h2>
        <NewLaunches
          products={newArrivals}
          offer={{
            discount: '15%',
            subtitle: 'For new member sign up\nat the first time',
            coupon: 'COUPON15',
            bg: 'bg-[#dcf3e4]',
          }}
        />
      </section>

      {/* Best sellers (promo row) */}
      <section className="container-x mt-14">
        <h2 className="mb-6 text-3xl font-extrabold text-dark">Best Sellers</h2>
        <NewLaunches
          products={bestsellers}
          offer={{
            discount: '20%',
            subtitle: 'On your favourite\nbest-selling products',
            coupon: 'BESTSELLER20',
            bg: 'bg-[#e6eefc]',
          }}
        />
      </section>

      {/* Blog teaser */}
      <BlogTeaser />

      {/* Brands */}
      {brands.length > 0 && (
        <section className="container-x mt-14">
          <SectionHeading subtitle="Trusted" title="Our Brands" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {brands.map((b) => (
              <Link
                key={b._id}
                to={`/shop?brand=${b._id}`}
                className="card flex h-24 items-center justify-center p-4 hover:border-primary"
              >
                {b.logo ? (
                  <img
                    src={b.logo}
                    onError={imgFallback}
                    alt={b.name}
                    className="max-h-12 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-bold text-slate-500">{b.name}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

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
    </div>
  )
}
