import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiTag,
  FiAward,
  FiImage,
  FiMonitor,
  FiFileText,
  FiUpload,
  FiShoppingCart,
  FiPercent,
  FiUserPlus,
  FiCalendar,
  FiDroplet,
  FiClipboard,
  FiUsers,
  FiMail,
  FiMessageCircle,
  FiShield,
  FiActivity,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';

const links = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/products', label: 'Products', icon: FiBox },
  { to: '/categories', label: 'Categories', icon: FiTag },
  { to: '/brands', label: 'Brands', icon: FiAward },
  { to: '/banners', label: 'Banners', icon: FiImage },
  { to: '/popups', label: 'Popups', icon: FiMonitor },
  { to: '/posts', label: 'Blog', icon: FiFileText },
  { to: '/prescriptions', label: 'Prescriptions', icon: FiUpload },
  { to: '/orders', label: 'Orders', icon: FiShoppingCart },
  { to: '/offers', label: 'Offers', icon: FiPercent },
  { to: '/doctors', label: 'Doctors', icon: FiUserPlus },
  { to: '/appointments', label: 'Appointments', icon: FiCalendar },
  { to: '/lab-tests', label: 'Lab Tests', icon: FiDroplet },
  { to: '/lab-bookings', label: 'Lab Bookings', icon: FiClipboard },
  { to: '/customers', label: 'Customers', icon: FiUsers },
  { to: '/refills', label: 'Refills', icon: FiRefreshCw },
  { to: '/messages', label: 'Messages', icon: FiMail },
  { to: '/support-chats', label: 'Support Chats', icon: FiMessageCircle },
  { to: '/admins', label: 'Admins', icon: FiShield },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-slate-300 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <FiActivity size={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">DCare</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <FiX size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Main
          </p>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-500">
          <p>DCare Medical & Pharmacy</p>
          <p className="text-slate-600">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
