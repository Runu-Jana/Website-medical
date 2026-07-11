import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FaShoppingCart,
  FaRegHeart,
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaPills,
  FaMapMarkerAlt,
} from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import SearchBar from './SearchBar'
import QuickServices from './QuickServices'
import { siteConfig, telLink, mailLink } from '../config/site'

const navLinks = [
  { to: '/', label: 'Home' },
  {
    to: '/shop',
    label: 'Shop',
    dropdown: [
      { to: '/shop', label: 'All Products' },
      { to: '/shop?view=categories', label: 'Shop by Category', submenu: 'categories' },
      { to: '/brands', label: 'Shop by Brand' },
      { to: '/shop?deal=true', label: "Today's Deals" },
    ],
  },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const location = useLocation()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()

  // Active state that respects the query string, so /shop, /shop?view=categories
  // and /shop?deal=true don't all highlight at once.
  const isLinkActive = (to) => {
    if (to === '/') return location.pathname === '/'
    if (to === '/shop')
      return (
        location.pathname === '/shop' &&
        !location.search.includes('view=categories') &&
        !location.search.includes('deal=true')
      )
    if (to.includes('?')) {
      const [path, query] = to.split('?')
      return location.pathname === path && location.search.includes(query)
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const [catOpen, setCatOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const catRef = useRef(null)

  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // The search bar is meaningless on the auth pages — hide it there for a cleaner UI.
  const hideSearch = ['/login', '/register', '/forgot-password'].includes(location.pathname)

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Announcement bar — moving marquee */}
      <div className="bg-dark text-white">
        <div className="container-x flex h-9 items-center gap-4 text-xs">
          <div className="marquee flex-1 overflow-hidden">
            <div className="marquee-track marquee-ltr">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-10 pr-10">
                  <span>🚚 Free shipping on all orders over <strong>₹1000</strong></span>
                  <span>💊 100% genuine, licensed pharmacy</span>
                  <span>⚡ Fast delivery across India</span>
                  <span>🔒 Secure payments · Easy returns</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <a href={telLink()} className="flex items-center gap-1.5 hover:text-accent">
              <FaPhoneAlt size={11} /> {siteConfig.phone}
            </a>
            <a href={mailLink()} className="flex items-center gap-1.5 hover:text-accent">
              <FaEnvelope size={11} /> {siteConfig.email}
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-bordergray">
        <div className="container-x flex h-20 items-center gap-4">
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src={siteConfig.logo}
              alt={siteConfig.brandName}
              className="h-11 w-auto sm:h-14"
            />
          </Link>

          {!hideSearch && (
            <div className="hidden flex-1 md:block">
              <SearchBar variant="desktop" />
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            {user && user.address?.city ? (
              <Link
                to="/account"
                className="mr-1 hidden items-center gap-2 border-r border-bordergray pr-4 lg:flex"
                title="Change delivery address"
              >
                <FaMapMarkerAlt className="text-primary" size={20} />
                <span className="leading-tight">
                  <span className="block text-[11px] text-slate-500">Express delivery to</span>
                  <span className="block max-w-[10rem] truncate text-sm font-bold text-dark">
                    {user.address.city}
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                to={user ? '/account' : '/login'}
                className="mr-1 hidden items-center gap-2 border-r border-bordergray pr-4 lg:flex"
                title={user ? 'Add a delivery address' : 'Sign in to set your address'}
              >
                <FaMapMarkerAlt className="text-primary" size={20} />
                <span className="leading-tight">
                  <span className="block text-[11px] text-slate-500">Express delivery to</span>
                  <span className="block text-sm font-bold text-dark">Select Address</span>
                </span>
              </Link>
            )}
            <Link
              to="/wishlist"
              className="hidden flex-col items-center px-2 text-slate-600 hover:text-primary sm:flex"
            >
              <span className="relative">
                <FaRegHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </span>
              <span className="mt-0.5 text-[11px]">Wishlist</span>
            </Link>
            <Link
              to={user ? '/account' : '/login'}
              className="flex flex-col items-center px-2 text-slate-600 hover:text-primary"
            >
              <FaUser size={20} />
              <span className="mt-0.5 text-[11px]">
                {user ? user.name?.split(' ')[0] || 'Account' : 'Account'}
              </span>
            </Link>
            <Link
              to="/cart"
              className="relative flex flex-col items-center px-2 text-slate-600 hover:text-primary"
            >
              <span className="relative">
                <FaShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className="mt-0.5 text-[11px]">Cart</span>
            </Link>
            <button
              className="ml-1 p-2 text-slate-700 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>

        {/* mobile search */}
        {!hideSearch && (
          <div className="container-x pb-3 md:hidden">
            <SearchBar variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
      </div>

      {/* Quick services strip */}
      <QuickServices onNavigate={() => setMobileOpen(false)} />

      {/* Main nav */}
      <nav className="hidden border-b border-bordergray bg-white lg:block">
        <div className="container-x flex items-center gap-2 py-2.5">
          <div ref={catRef} className="relative">
            <button
              onClick={() => setCatOpen((v) => !v)}
              className="flex h-12 items-center gap-2 rounded-full border border-primary bg-primary px-6 text-sm font-semibold text-white transition duration-200 hover:scale-105 hover:bg-transparent hover:text-primary"
            >
              <FaBars size={14} /> All Categories <FaChevronDown size={12} />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-bordergray bg-white py-2 shadow-lift">
                {categories.length === 0 && (
                  <span className="block px-4 py-2 text-sm text-slate-400">No categories</span>
                )}
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    to={`/shop?category=${c._id}`}
                    onClick={() => setCatOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-dark hover:bg-lightbg hover:text-primary"
                  >
                    <FaPills size={13} className="text-primary" /> {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <ul className="flex items-center">
            {navLinks.map((l) => (
              <li key={l.label} className="group relative">
                {l.to ? (
                  <Link
                    to={l.to}
                    className={`flex h-12 items-center gap-1 px-4 text-sm font-semibold transition ${
                      isLinkActive(l.to) ? 'text-primary' : 'text-dark hover:text-primary'
                    }`}
                  >
                    {l.label}
                    {l.dropdown && <FaChevronDown size={10} />}
                  </Link>
                ) : (
                  <span className="flex h-12 cursor-default items-center gap-1 px-4 text-sm font-semibold text-dark group-hover:text-primary">
                    {l.label}
                    {l.dropdown && <FaChevronDown size={10} />}
                  </span>
                )}
                {l.dropdown && (
                  <div className="invisible absolute left-0 top-full z-50 w-52 rounded-b-xl border border-bordergray bg-white py-2 opacity-0 shadow-lift transition group-hover:visible group-hover:opacity-100">
                    {l.dropdown.map((d) =>
                      d.submenu === 'categories' ? (
                        <div key={d.label} className="group/sub relative">
                          <Link
                            to={d.to}
                            className="flex items-center justify-between px-4 py-2 text-sm text-dark hover:bg-lightbg hover:text-primary"
                          >
                            {d.label} <FaChevronRight size={10} />
                          </Link>
                          <div className="invisible absolute left-full top-0 z-50 max-h-[22rem] w-56 overflow-y-auto rounded-xl border border-bordergray bg-white py-2 opacity-0 shadow-lift transition group-hover/sub:visible group-hover/sub:opacity-100">
                            {categories.length === 0 ? (
                              <span className="block px-4 py-2 text-sm text-slate-400">
                                No categories
                              </span>
                            ) : (
                              categories.map((c) => (
                                <Link
                                  key={c._id}
                                  to={`/shop?category=${c._id}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-dark hover:bg-lightbg hover:text-primary"
                                >
                                  <FaPills size={12} className="text-primary" /> {c.name}
                                </Link>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <Link
                          key={d.label}
                          to={d.to}
                          className="block px-4 py-2 text-sm text-dark hover:bg-lightbg hover:text-primary"
                        >
                          {d.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Support phone */}
          <a
            href={telLink()}
            className="group ml-auto hidden h-12 items-center gap-2 rounded-full border border-primary bg-primary py-1.5 pl-1.5 pr-6 text-white transition duration-200 hover:scale-105 hover:bg-transparent hover:text-primary xl:flex"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-primary/10">
              <FaPhoneAlt size={13} />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold">{siteConfig.phone}</span>
              <span className="block text-[11px] text-white/80 transition group-hover:text-primary/70">
                Support 24/7
              </span>
            </span>
          </a>
        </div>
      </nav>

      {/* mobile menu */}
      {mobileOpen && (
        <nav className="border-b border-bordergray bg-white lg:hidden">
          <ul className="container-x flex flex-col py-2">
            {navLinks.map((l) => {
              const expanded = mobileExpanded === l.label
              return (
                <li key={l.label} className="border-b border-bordergray/60 last:border-0">
                  {l.dropdown ? (
                    // Items with a submenu toggle it open on tap (no navigation).
                    <button
                      type="button"
                      onClick={() => setMobileExpanded(expanded ? null : l.label)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between py-3 text-sm font-semibold text-dark"
                    >
                      {l.label}
                      <FaChevronDown
                        size={11}
                        className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : (
                    <Link
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-sm font-semibold text-dark hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  )}
                  {l.dropdown && expanded && (
                    <ul className="ml-3 border-l border-bordergray pb-2">
                      {l.dropdown.map((d) => (
                        <li key={d.label}>
                          <Link
                            to={d.to}
                            onClick={() => {
                              setMobileOpen(false)
                              setMobileExpanded(null)
                            }}
                            className="block py-2 pl-3 text-sm text-slate-600 hover:text-primary"
                          >
                            {d.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </header>
  )
}
