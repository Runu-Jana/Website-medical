import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaHeartbeat } from 'react-icons/fa'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate(location.state?.from || '/account')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-x flex items-center justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
            <FaHeartbeat size={24} />
          </span>
          <h1 className="mt-3 text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-slate-500">Join DCare today</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input name="name" required value={form.name} onChange={onChange} className="input-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={onChange}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} className="input-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={onChange}
              className="input-base"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
