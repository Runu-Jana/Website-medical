import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiMail, FiLock, FiKey, FiArrowLeft } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ForgotPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/admin/forgot', { email });
      toast.success('If that email is registered, a reset code has been sent.');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/admin/reset', { email, code, password });
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <FiActivity size={28} />
          </div>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-slate-300">We'll email you a 6-digit reset code</p>
        </div>

        {step === 'request' ? (
          <form onSubmit={requestCode} className="card p-6 sm:p-8">
            <label className="label">Admin email address</label>
            <div className="relative mb-5">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dcare.com"
                className="input pl-10"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="card p-6 sm:p-8">
            <p className="mb-4 text-sm text-slate-500">
              Enter the code sent to <b>{email}</b> and choose a new password.
            </p>
            <label className="label">Reset code</label>
            <div className="relative mb-4">
              <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="input pl-10 tracking-widest"
              />
            </div>
            <label className="label">New password</label>
            <div className="relative mb-5">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input pl-10"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Updating…' : 'Set new password'}
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="mt-3 w-full text-center text-sm text-slate-500 hover:text-primary"
            >
              Didn't get a code? Try again
            </button>
          </form>
        )}

        <div className="mt-5 rounded-xl bg-white/5 p-4 text-center text-xs text-slate-300">
          <b>No access to your email?</b> Ask another admin to reset your password from
          <span className="text-primary"> Admins</span> in the dashboard.
        </div>

        <Link
          to="/login"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm text-slate-300 hover:text-white"
        >
          <FiArrowLeft /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
