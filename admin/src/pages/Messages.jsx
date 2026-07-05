import { useEffect, useState, useCallback } from 'react';
import { FiMail, FiTrash2, FiSend } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatDateTime } from '../lib/format.js';

export default function Messages() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ messages: [], page: 1, pages: 1, total: 0, unread: 0 });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/contact', { params: { page, limit: 15 } });
      setData({
        messages: data.messages || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
        unread: data.unread || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openMsg = async (m) => {
    setOpen(m);
    if (!m.read) {
      try {
        await api.patch(`/contact/${m._id}`, { read: true });
        setData((d) => ({
          ...d,
          unread: Math.max(0, d.unread - 1),
          messages: d.messages.map((x) => (x._id === m._id ? { ...x, read: true } : x)),
        }));
      } catch {
        /* ignore */
      }
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/contact/${delTarget._id}`);
      toast.success('Message deleted');
      setDelTarget(null);
      setOpen(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Messages</h2>
        <p className="text-sm text-slate-500">
          {data.total} messages · {data.unread} unread
        </p>
      </div>

      <div className="card">
        {loading ? (
          <Loader label="Loading messages..." />
        ) : data.messages.length === 0 ? (
          <EmptyState icon={FiMail} title="No messages yet" message="Customer messages appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.messages.map((m) => (
              <li
                key={m._id}
                onClick={() => openMsg(m)}
                className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-slate-50 ${
                  m.read ? '' : 'bg-primary-50/40'
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <FiMail size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">{m.name || 'Anonymous'}</p>
                    {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="truncate text-sm text-slate-600">{m.subject || m.message}</p>
                  <p className="text-xs text-slate-400">
                    {m.email} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDelTarget(m);
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-danger"
                  aria-label="Delete message"
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {!loading && data.messages.length > 0 && (
          <div className="border-t border-slate-100">
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Message detail */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
          onClick={() => setOpen(null)}
        >
          <div className="card my-auto w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-800">{open.subject || 'Message'}</h3>
              <button onClick={() => setOpen(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm">
              <p className="text-slate-500">
                From <b className="text-slate-700">{open.name || 'Anonymous'}</b> · {formatDateTime(open.createdAt)}
              </p>
              <p className="text-slate-600">
                {open.email && (
                  <a href={`mailto:${open.email}`} className="text-primary">{open.email}</a>
                )}
                {open.phone ? ` · ${open.phone}` : ''}
              </p>
              <p className="whitespace-pre-line rounded-lg bg-slate-50 p-4 text-slate-700">{open.message}</p>
              <div className="flex justify-end gap-2 pt-2">
                {open.email && (
                  <a href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject || 'Your enquiry')}`} className="btn-primary">
                    <FiSend size={16} /> Reply by email
                  </a>
                )}
                <button onClick={() => setDelTarget(open)} className="btn-ghost text-danger">
                  <FiTrash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete message"
        message="Delete this message permanently?"
      />
    </div>
  );
}
