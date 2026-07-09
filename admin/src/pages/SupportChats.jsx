import { useEffect, useState } from 'react';
import { FiMessageCircle, FiAlertCircle, FiUser } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';

const timeAgo = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SupportChats() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [onlyEscalated, setOnlyEscalated] = useState(false);
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/support/chats', {
        params: { limit: 50, ...(onlyEscalated ? { escalated: true } : {}) },
      });
      setChats(data.chats || []);
      setEscalatedCount(data.escalatedCount || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyEscalated]);

  const lastUserMsg = (msgs) => {
    if (!Array.isArray(msgs)) return '';
    const u = [...msgs].reverse().find((m) => m.role === 'user');
    return u?.content || '';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Support Chats</h2>
          <p className="text-sm text-slate-500">
            AI assistant conversations · {escalatedCount} flagged for a human
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyEscalated}
            onChange={(e) => setOnlyEscalated(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary"
          />
          Only escalated
        </label>
      </div>

      <div className="card">
        {loading ? (
          <Loader label="Loading chats..." />
        ) : chats.length === 0 ? (
          <EmptyState
            icon={FiMessageCircle}
            title="No chats yet"
            message="Customer conversations with the AI assistant will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {chats.map((c) => (
              <button
                key={c._id}
                onClick={() => setActive(c)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    c.escalated ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {c.escalated ? <FiAlertCircle size={16} /> : <FiUser size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {c.name || 'Website visitor'}
                    </span>
                    {c.contact && <span className="truncate text-xs text-slate-400">{c.contact}</span>}
                    {c.escalated && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                        Needs human
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{lastUserMsg(c.messages)}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(c.updatedAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={`Chat with ${active?.name || 'visitor'}`}
        footer={
          <button className="btn-primary" onClick={() => setActive(null)}>
            Close
          </button>
        }
      >
        <div className="space-y-3">
          {active?.contact && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Contact: <b>{active.contact}</b>
            </p>
          )}
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {(active?.messages || []).map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-primary text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
