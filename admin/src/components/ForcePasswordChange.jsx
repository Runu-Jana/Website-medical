import { useState } from 'react';
import { FiLock, FiLogOut } from 'react-icons/fi';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Full-screen blocker shown when the logged-in user has `mustChangePassword`
// set (e.g. an admin gave a seller a temporary password). The panel stays
// locked behind this until they choose their own password.
export default function ForcePasswordChange() {
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error('New passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      updateUser({ mustChangePassword: false });
      toast.success('Password updated. Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
          <FiLock size={22} />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-500">
          For your security, {user?.name?.split(' ')[0] || 'you'} must replace the temporary
          password before continuing.
        </p>

        <label className="label mt-5">Temporary password</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="The password your admin gave you"
          className="input"
        />

        <label className="label mt-4">New password</label>
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="input"
        />

        <label className="label mt-4">Confirm new password</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter new password"
          className="input"
        />

        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-2.5">
          {loading ? 'Updating…' : 'Set new password'}
        </button>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-danger"
        >
          <FiLogOut size={14} /> Sign out instead
        </button>
      </form>
    </div>
  );
}
