import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaHeartbeat, FaArrowLeft } from 'react-icons/fa'
import api from '../lib/api'

// Customer self-serve password reset. Two steps, mirroring the admin flow:
//   1. Enter email  → backend emails a 6-digit code (POST /auth/forgot)
//   2. Enter code + new password → backend verifies + updates (POST /auth/reset)
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // 'request' | 'reset'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot', { email })
      setInfo(data.message || 'If that email is registered, a reset code has been sent.')
      setStep('reset')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await api.post('/auth/reset', { email, code, password })
      navigate('/login', { state: { resetDone: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.')
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
          <h1 className="mt-3 text-2xl font-bold">Reset password</h1>
          <p className="text-sm text-slate-500">
            {step === 'request'
              ? "Enter your email and we'll send a 6-digit reset code"
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {info && (
          <div className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">{info}</div>
        )}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {step === 'request' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Reset code</label>
              <input
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="input-base tracking-[0.4em]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-base"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Updating…' : 'Set new password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('request')
                setCode('')
                setError('')
              }}
              className="w-full text-center text-sm text-slate-500 hover:text-primary"
            >
              Didn't get a code? Try again
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
            <FaArrowLeft size={12} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
