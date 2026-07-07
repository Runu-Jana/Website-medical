import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaHeartbeat,
  FaStethoscope,
  FaUserMd,
  FaTruck,
  FaTags,
  FaCoins,
  FaDumbbell,
  FaSyringe,
  FaPrescriptionBottleAlt,
  FaCheckCircle,
  FaCrown,
  FaShieldAlt,
  FaArrowRight,
} from 'react-icons/fa'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const benefits = [
  {
    icon: FaStethoscope,
    title: 'Annual Health Check-up',
    desc: 'A complimentary full-body health check-up every year to stay ahead of any concern.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: FaUserMd,
    title: 'Doctor Consultation Discounts',
    desc: 'Flat discounts on online and in-clinic doctor consultations, whenever you need them.',
    color: 'bg-sky-100 text-sky-600',
  },
  {
    icon: FaTruck,
    title: 'Free Delivery',
    desc: 'Unlimited free delivery on every order — no minimum cart value for members.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: FaTags,
    title: 'Exclusive Medicine Discounts',
    desc: 'Member-only pricing and extra savings on medicines, wellness and healthcare products.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: FaCoins,
    title: 'Health Reward Points',
    desc: 'Earn reward points on every purchase and redeem them for future orders.',
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    icon: FaDumbbell,
    title: 'Fitness & Diet Programs',
    desc: 'Access curated fitness routines and personalised diet plans from certified experts.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: FaSyringe,
    title: 'Vaccination Reminders',
    desc: 'Timely reminders for you and your family so no important vaccination is ever missed.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: FaPrescriptionBottleAlt,
    title: 'Medicine Refill Reminders',
    desc: 'Automatic reminders to reorder your regular medicines before they run out.',
    color: 'bg-teal-100 text-teal-600',
  },
]

const faqs = [
  {
    q: 'How much does the DCare Health Club cost?',
    a: 'Joining is free right now during our launch — activate your membership and start enjoying member benefits instantly.',
  },
  {
    q: 'When do my benefits start?',
    a: 'The moment your membership is active. Free delivery, member discounts and reminders apply to your very next order.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can manage or cancel your membership anytime from your account — no lock-in, no questions asked.',
  },
]

export default function HealthClub() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isMember = !!user?.isMember

  const join = async () => {
    if (!user) {
      // Send guests to register, then bring them back here to activate.
      navigate('/register', { state: { from: '/health-club' } })
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/me/membership')
      updateUser(data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not activate membership. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primaryDark text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="container-x relative grid gap-8 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
              <FaCrown className="text-amber-300" /> DCare Health Club
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
              One membership.
              <br />
              A healthier family.
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/90 sm:text-base">
              Unlock free delivery, exclusive discounts, doctor savings, reward points and
              personalised health care — all in one membership built to keep your family well.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              {isMember ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary">
                  <FaCheckCircle className="text-emerald-500" /> You're a member 🎉
                </span>
              ) : (
                <button
                  onClick={join}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-primary shadow-lift transition hover:scale-105 disabled:opacity-60"
                >
                  {busy ? 'Activating…' : user ? 'Activate membership — Free' : 'Join now — Free'}
                  <FaArrowRight size={13} />
                </button>
              )}
              <span className="text-xs text-white/80">
                <FaShieldAlt className="mr-1 inline" /> No lock-in · Cancel anytime
              </span>
            </div>
            {error && <p className="mt-3 text-sm font-medium text-amber-200">{error}</p>}
          </div>

          {/* Membership card */}
          <div className="mx-auto w-full max-w-sm">
            <div className="relative rounded-3xl bg-white/10 p-1 shadow-lift backdrop-blur">
              <div className="rounded-[22px] bg-white p-6 text-dark">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-extrabold text-primary">
                    <FaHeartbeat /> DCare Club
                  </span>
                  <FaCrown className="text-amber-400" size={22} />
                </div>
                <p className="mt-6 text-xs uppercase tracking-wider text-slate-400">Membership</p>
                <p className="text-2xl font-extrabold">
                  Free
                  <span className="ml-2 align-middle text-sm font-medium text-slate-400 line-through">
                    ₹499/yr
                  </span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {['Free delivery on every order', 'Exclusive member discounts', 'Reward points on purchases', 'Care reminders & health perks'].map(
                    (t) => (
                      <li key={t} className="flex items-center gap-2 text-slate-600">
                        <FaCheckCircle className="shrink-0 text-emerald-500" /> {t}
                      </li>
                    )
                  )}
                </ul>
                {!isMember && (
                  <button
                    onClick={join}
                    disabled={busy}
                    className="btn-primary mt-6 w-full"
                  >
                    {busy ? 'Activating…' : user ? 'Activate now' : 'Join the club'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-x mt-14">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Membership benefits</p>
          <h2 className="mt-1 text-2xl font-extrabold text-dark sm:text-3xl">
            Everything your family needs to stay well
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Eight powerful benefits, one simple membership — designed around real, everyday care.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-lift"
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${b.color}`}>
                <b.icon size={24} />
              </span>
              <h3 className="mt-4 text-base font-bold text-dark">{b.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container-x mt-16">
        <div className="rounded-3xl bg-lightbg p-8 sm:p-12">
          <h2 className="text-center text-2xl font-extrabold text-dark">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { n: '1', t: 'Join the club', d: 'Activate your free membership in one tap.' },
              { n: '2', t: 'Shop & save', d: 'Get free delivery, member prices and reward points instantly.' },
              { n: '3', t: 'Stay cared for', d: 'Enjoy check-ups, consult discounts and timely health reminders.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 font-bold text-dark">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x mt-16">
        <h2 className="text-center text-2xl font-extrabold text-dark">Frequently asked questions</h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-dark">
                {f.q}
                <span className="text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-500">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-x mt-16">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-primary to-primaryDark px-6 py-12 text-center text-white">
          <FaCrown className="text-amber-300" size={32} />
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            {isMember ? "You're all set!" : 'Start caring for your family today'}
          </h2>
          <p className="max-w-md text-sm text-white/90">
            {isMember
              ? 'Your DCare Health Club benefits are active. Manage your membership anytime from your account.'
              : 'Join the DCare Health Club for free and unlock every benefit instantly.'}
          </p>
          {isMember ? (
            <Link
              to="/account"
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-primary shadow-lift transition hover:scale-105"
            >
              Go to My Account
            </Link>
          ) : (
            <button
              onClick={join}
              disabled={busy}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-primary shadow-lift transition hover:scale-105 disabled:opacity-60"
            >
              {busy ? 'Activating…' : user ? 'Activate membership — Free' : 'Join now — Free'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
