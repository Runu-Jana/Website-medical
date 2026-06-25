import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  FaSearch,
  FaShoppingCart,
  FaRegHeart,
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaHeartbeat,
  FaPills,
} from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?view=categories', label: 'Categories' },
  { to: '/shop?deal=true', label: 'Deal' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { itemCount } = useCart()
  const { user } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
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

  const onSearch = (e) => {
    e.preventDefault()
    navigate(`/shop?keyword=${encodeURIComponent(keyword.trim())}`)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Announcement bar */}
      <div className="bg-dark text-white">
        <div className="container-x flex h-9 items-center justify-between text-xs">
          <span className="hidden sm:block">
            Free shipping on all orders over <strong>$1000</strong>
          </span>
          <div className="flex items-center gap-4">
            <a href="tel:+18001234567" className="flex items-center gap-1.5 hover:text-accent">
              <FaPhoneAlt size={11} /> +1 800 123 4567
            </a>
            <a
              href="mailto:support@dcare.com"
              className="hidden items-center gap-1.5 hover:text-accent sm:flex"
            >
              <FaEnvelope size={11} /> support@dcare.com
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-bordergray">
        <div className="container-x flex h-20 items-center gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <FaHeartbeat size={22} />
            </span>
            <span className="text-2xl font-extrabold text-dark">
              D<span className="text-primary">Care</span>
            </span>
          </Link>

          <form onSubmit={onSearch} className="hidden flex-1 md:block">
            <div className="flex items-center rounded-xl border border-bordergray focus-within:border-primary">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by product or category..."
                className="w-full rounded-l-xl bg-transparent px-4 py-2.5 text-sm outline-none"
              />
              <button
                type="submit"
                className="flex h-11 items-center gap-2 rounded-r-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primaryDark"
              >
                <FaSearch /> <span className="hidden lg:inline">Search</span>
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <Link
              to="/shop"
              className="hidden flex-col items-center px-2 text-slate-600 hover:text-primary sm:flex"
            >
              <FaRegHeart size={20} />
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
        <form onSubmit={onSearch} className="container-x pb-3 md:hidden">
          <div className="flex items-center rounded-xl border border-bordergray">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-l-xl bg-transparent px-4 py-2.5 text-sm outline-none"
            />
            <button type="submit" className="px-4 text-primary">
              <FaSearch />
            </button>
          </div>
        </form>
      </div>

      {/* Main nav */}
      <nav className="hidden border-b border-bordergray bg-white lg:block">
        <div className="container-x flex items-center gap-2">
          <div ref={catRef} className="relative">
            <button
              onClick={() => setCatOpen((v) => !v)}
              className="flex h-12 items-center gap-2 rounded-t-lg bg-primary px-5 text-sm font-semibold text-white"
            >
              <FaBars size={14} /> All Categories <FaChevronDown size={12} />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-50 w-64 rounded-b-xl border border-bordergray bg-white py-2 shadow-lift">
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
              <li key={l.label}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `flex h-12 items-center px-4 text-sm font-semibold transition ${
                      isActive ? 'text-primary' : 'text-dark hover:text-primary'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* mobile menu */}
      {mobileOpen && (
        <nav className="border-b border-bordergray bg-white lg:hidden">
          <ul className="container-x flex flex-col py-2">
            {navLinks.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm font-semibold text-dark hover:text-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
