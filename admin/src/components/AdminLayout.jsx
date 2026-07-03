import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import Sidebar from './Sidebar.jsx';
import NotificationsBell from './NotificationsBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SECTIONS = {
  '': 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  brands: 'Brands',
  banners: 'Banners',
  posts: 'Blog',
  prescriptions: 'Prescriptions',
  orders: 'Orders',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const section = SECTIONS[pathname.split('/')[1] || ''] || 'Admin';

  const initials = (user?.name || 'Admin')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-content">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <FiMenu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-800 sm:text-base">{section}</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationsBell />
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 py-1 pl-1 pr-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
                {initials}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold leading-none text-slate-800">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger hover:bg-red-100"
            >
              <FiLogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
