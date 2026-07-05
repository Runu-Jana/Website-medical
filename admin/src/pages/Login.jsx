import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiActivity, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
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
          <h1 className="text-2xl font-bold">DCare Admin</h1>
          <p className="text-sm text-slate-300">Medical & Pharmacy eCommerce</p>
        </div>

        <form onSubmit={submit} className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800">Sign in to your account</h2>
          <p className="mb-6 text-sm text-slate-500">Enter your admin credentials to continue.</p>

          <div className="mb-4">
            <label className="label">Email address</label>
            <div className="relative">
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
          </div>

          <div className="mb-6">
            <label className="label">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={show ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
              >
                {show ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-3 text-center">
            <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <div className="mt-5 rounded-lg bg-blue-50 p-3 text-center text-xs text-primary-700">
            <span className="font-semibold">Demo credentials:</span> admin@dcare.com / admin123
          </div>
        </form>
      </div>
    </div>
  );
}
