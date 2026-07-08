import { useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaHeartbeat, FaEnvelope, FaMobileAlt } from 'react-icons/fa'
import { auth, firebaseEnabled, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase'

// Normalise to E.164; default India (+91) for a bare 10-digit number.
const toE164 = (raw) => {
  const v = (raw || '').replace(/[^\d+]/g, '')
  if (v.startsWith('+')) return v
  if (v.length === 10) return `+91${v}`
  return `+${v}`
}

export default function Login() {
  const { login, phoneCheck, phoneVerify } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('email') // 'email' | 'phone'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [phoneStep, setPhoneStep] = useState('phone') // 'phone' | 'code'
  const confirmationRef = useRef(null)
  const recaptchaRef = useRef(null)

  const [error, setError] = useState('')
  const [welcome, setWelcome] = useState('')
  const [loading, setLoading] = useState(false)

  const goAfterLogin = (data) => {
    const who = data.user?.name && data.user.name !== 'Customer' ? `, ${data.user.name}` : ''
    setWelcome(data.returning ? `Welcome back${who}! 👋` : `Welcome to DBL Life Care${who}! 🎉`)
    setTimeout(() => navigate(location.state?.from || '/account'), 1200)
  }

  // ── Email / password ──
  const onEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      goAfterLogin({ ...data, returning: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
      setLoading(false)
    }
  }

  // ── Phone: step 1 (trusted device or start OTP) ──
  const onPhoneContinue = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const e164 = toE164(phone)
    try {
      const check = await phoneCheck(e164)
      if (check.trusted) {
        goAfterLogin(check) // trusted device → no OTP
        return
      }
      if (firebaseEnabled) {
        if (!recaptchaRef.current) {
          recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
          })
        }
        confirmationRef.current = await signInWithPhoneNumber(auth, e164, recaptchaRef.current)
      }
      setPhoneStep('code')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not send the code.')
    } finally {
      setLoading(false)
    }
  }

  // ── Phone: step 2 (verify code) ──
  const onCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let data
      if (firebaseEnabled && confirmationRef.current) {
        const result = await confirmationRef.current.confirm(code)
        const idToken = await result.user.getIdToken()
        data = await phoneVerify({ idToken, name })
      } else {
        // Dev/test mode — backend accepts the dev code (default 123456).
        data = await phoneVerify({ phone: toE164(phone), code, name })
      }
      goAfterLogin(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid code. Please try again.')
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
          <h1 className="mt-3 text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-slate-500">Sign in to your DBL Life Care account</p>
        </div>

        {/* Method toggle */}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-lightbg p-1">
          {[
            { id: 'email', label: 'Email', icon: FaEnvelope },
            { id: 'phone', label: 'Phone', icon: FaMobileAlt },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id)
                setError('')
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                mode === m.id ? 'bg-white text-primary shadow-card' : 'text-slate-500'
              }`}
            >
              <m.icon size={14} /> {m.label}
            </button>
          ))}
        </div>

        {welcome && (
          <div className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            {welcome}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {mode === 'email' && (
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'phone' && phoneStep === 'phone' && (
          <form onSubmit={onPhoneContinue} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Phone number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input-base"
              />
              <p className="mt-1 text-xs text-slate-400">
                We'll text a one-time code only on a new device.
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait…' : 'Continue'}
            </button>
            {!firebaseEnabled && (
              <p className="text-center text-xs text-amber-600">
                Dev mode: no SMS sent — use code <strong>123456</strong> on the next screen.
              </p>
            )}
          </form>
        )}

        {mode === 'phone' && phoneStep === 'code' && (
          <form onSubmit={onCodeSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Enter the 6-digit code sent to {toE164(phone)}
              </label>
              <input
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="······"
                className="input-base tracking-[0.5em]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Your name (new customers)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" className="input-base" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPhoneStep('phone')
                setCode('')
                setError('')
              }}
              className="w-full text-center text-sm text-slate-500 hover:text-primary"
            >
              ← Use a different number
            </button>
          </form>
        )}

        <div id="recaptcha-container" />

        <p className="mt-5 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link
            to="/register"
            state={location.state}
            className="font-semibold text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
