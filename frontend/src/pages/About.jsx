import { Link } from 'react-router-dom'
import { FaShieldAlt, FaTruck, FaUserMd, FaAward } from 'react-icons/fa'

const values = [
  { icon: FaShieldAlt, title: 'Genuine Products', text: 'Every item is sourced from authorized distributors.' },
  { icon: FaTruck, title: 'Fast Delivery', text: 'Quick and reliable shipping across the country.' },
  { icon: FaUserMd, title: 'Expert Care', text: 'Guidance from qualified pharmacists, 24/7.' },
  { icon: FaAward, title: 'Quality Assured', text: 'Strict quality checks on every product.' },
]

export default function About() {
  return (
    <div className="container-x py-10">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-10 text-center text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">About DCare</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90">
          DCare is your trusted online pharmacy and medical store, committed to making quality
          healthcare accessible, affordable and convenient for everyone.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <div key={v.title} className="card p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <v.icon size={24} />
            </span>
            <h3 className="mt-4 text-base font-bold">{v.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link to="/shop" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    </div>
  )
}
