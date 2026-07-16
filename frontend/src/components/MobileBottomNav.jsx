import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaThLarge, FaShoppingCart, FaUser, FaFileMedical } from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

// App-style bottom tab bar (mobile only). The center action is elevated.
export default function MobileBottomNav() {
  const { pathname } = useLocation()
  const { itemCount } = useCart()
  const { user } = useAuth()

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  const Tab = ({ to, icon: Icon, label, badge }) => (
    <Link
      to={to}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${
        isActive(to) ? 'text-primary' : 'text-slate-500'
      }`}
    >
      <span className="relative">
        <Icon size={19} />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  )

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-bordergray bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="mx-auto flex max-w-md items-end justify-between px-2">
        <Tab to="/" icon={FaHome} label="Home" />
        <Tab to="/shop" icon={FaThLarge} label="Shop" />

        {/* Elevated center action — Upload Prescription */}
        <Link
          to="/prescription"
          className="relative -top-4 flex flex-col items-center"
          aria-label="Upload Prescription"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lift ring-4 ring-white">
            <FaFileMedical size={22} />
          </span>
          <span className="mt-0.5 text-[10px] font-semibold text-primary">Upload Rx</span>
        </Link>

        <Tab to="/cart" icon={FaShoppingCart} label="Cart" badge={itemCount} />
        {user ? (
          <Tab to="/account" icon={FaUser} label="Account" />
        ) : (
          <Tab to="/login" icon={FaUser} label="Login" />
        )}
      </div>
    </nav>
  )
}
