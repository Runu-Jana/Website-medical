import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiShoppingCart,
  FiAlertTriangle,
  FiFileText,
  FiUserPlus,
  FiMail,
  FiCheckCircle,
} from 'react-icons/fi';
import api from '../lib/api.js';

const TYPE_ICON = {
  order: FiShoppingCart,
  stock: FiAlertTriangle,
  prescription: FiFileText,
  user: FiUserPlus,
  message: FiMail,
};
const TYPE_COLOR = {
  order: 'text-primary bg-primary-50',
  stock: 'text-warning bg-amber-50',
  prescription: 'text-accent bg-emerald-50',
  user: 'text-violet-600 bg-violet-50',
  message: 'text-sky-600 bg-sky-50',
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ count: 0, items: [] });
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/notifications');
      setData(data || { count: 0, items: [] });
    } catch {
      /* ignore — bell just stays empty */
    }
  }, []);

  // Initial load + light polling so the badge stays current.
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Refresh when opening; close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    fetchNotifs();
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, fetchNotifs]);

  const markAllRead = async () => {
    setData((d) => ({ ...d, count: 0, items: d.items.map((i) => ({ ...i, read: true })) }));
    try {
      await api.post('/dashboard/notifications/read', {});
    } catch {
      fetchNotifs();
    }
  };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      setData((d) => ({
        ...d,
        count: Math.max(0, d.count - 1),
        items: d.items.map((i) => (i.id === n.id ? { ...i, read: true } : i)),
      }));
      api.post('/dashboard/notifications/read', { id: n.id }).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const count = data.count || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${count ? `, ${count} unread` : ''}`}
        title="Notifications"
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <FiBell size={19} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <FiCheckCircle className="text-accent" size={28} />
                <p className="text-sm font-medium text-slate-600">You're all caught up</p>
                <p className="text-xs text-slate-500">New activity will show up here.</p>
              </div>
            ) : (
              data.items.map((n) => {
                const Icon = TYPE_ICON[n.type] || FiBell;
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${
                      n.read ? '' : 'bg-primary-50/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        TYPE_COLOR[n.type] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {n.title}
                        </span>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </span>
                      {n.subtitle && (
                        <span className="block truncate text-xs text-slate-500">{n.subtitle}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(n.time)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
