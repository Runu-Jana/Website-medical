import { useEffect, useState, useCallback } from 'react';
import { FiUserPlus, FiTrash2, FiKey, FiShield, FiLock } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatDate } from '../lib/format.js';

export default function Admins() {
  const toast = useToast();
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admins');
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const createAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admins', form);
      toast.success('Admin created');
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create admin');
    } finally {
      setCreating(false);
    }
  };

  const resetPassword = async (a) => {
    const np = window.prompt(`Set a new password for ${a.name} (${a.email}):`);
    if (!np) return;
    if (np.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await api.put(`/admins/${a._id}`, { password: np });
      toast.success(`Password updated for ${a.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admins/${delTarget._id}`);
      toast.success('Admin removed');
      setDelTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete admin');
    } finally {
      setDeleting(false);
    }
  };

  const changeMyPassword = async (e) => {
    e.preventDefault();
    setChanging(true);
    try {
      await api.post('/auth/change-password', pw);
      toast.success('Your password has been changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Admins</h2>
        <p className="text-sm text-slate-500">Manage who can access the admin panel.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Admin list */}
        <div className="card lg:col-span-2">
          {loading ? (
            <Loader label="Loading admins..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Added</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {a.name}
                        {a._id === user?._id && (
                          <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{a.email}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => resetPassword(a)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-primary"
                            title="Reset password"
                            aria-label={`Reset password for ${a.name}`}
                          >
                            <FiKey size={16} />
                          </button>
                          {a._id !== user?._id && (
                            <button
                              onClick={() => setDelTarget(a)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-danger"
                              title="Delete admin"
                              aria-label={`Delete ${a.name}`}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create + change password */}
        <div className="space-y-6">
          <form onSubmit={createAdmin} className="card p-5">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <FiUserPlus className="text-primary" /> Add a new admin
            </div>
            <div className="space-y-3">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
              <input
                required
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
              />
              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? 'Creating…' : 'Create Admin'}
              </button>
            </div>
          </form>

          <form onSubmit={changeMyPassword} className="card p-5">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <FiLock className="text-primary" /> Change my password
            </div>
            <div className="space-y-3">
              <input
                required
                type="password"
                placeholder="Current password"
                value={pw.currentPassword}
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                className="input"
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="New password (min 6 chars)"
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                className="input"
              />
              <button type="submit" disabled={changing} className="btn-ghost w-full">
                {changing ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>

          <div className="flex items-start gap-2 rounded-xl bg-primary-50 p-4 text-xs text-primary-700">
            <FiShield className="mt-0.5 shrink-0" />
            <p>
              Locked out with no email access? Any other admin can reset your password from this
              page using the <b>key</b> icon.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove admin"
        message={`Remove ${delTarget?.name} (${delTarget?.email}) as an admin? They will lose access.`}
      />
    </div>
  );
}
