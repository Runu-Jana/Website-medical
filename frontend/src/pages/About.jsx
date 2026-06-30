import { Link } from 'react-router-dom'
import { FaShieldAlt, FaTruck, FaUserMd, FaAward } from 'react-icons/fa'

const values = [
  { icon: FaShieldAlt, title: 'Genuine Products', text: 'Every item is sourced from authorized distributors.' },
  { icon: FaTruck, title: 'Fast Delivery', text: 'Quick and reliable shipping across the country.' },
  { icon: FaUserMd, title: 'Expert Care', text: 'Guidance from qualified pharmacists, 24/7.' },
  { icon: FaAward, title: 'Quality Assured', text: 'Strict quality checks on every product.' },
]

const sections = [
  {
    heading: "We've Got You Covered!",
    body: "DCare delivers to homes across the country — from major metros to smaller towns, covering thousands of pin codes. Wherever you are, genuine medicines and everyday health essentials are just a few taps away, brought right to your doorstep.",
  },
  {
    heading: 'Say Goodbye to Your Healthcare Worries with DCare!',
    body: "DCare is here to make healthcare easy. As a trusted online pharmacy and medical store, we let you order pharmaceutical and wellness products online by connecting you to verified pharmacies — making every purchase simple, transparent and affordable.",
  },
  {
    heading: 'How Are We Making Lives Simpler?',
    body: 'Our doorstep delivery service spans cities big and small, with a catalogue of thousands of products including over-the-counter medicines, supplements, personal care and medical equipment. DCare is a one-stop platform where you can also explore lab tests and preventive health check-ups from the comfort of your home, with samples collected by trusted, certified labs and reports delivered on time.',
  },
  {
    heading: 'Why Choose DCare?',
    body: 'Regular offers let you pay online — by card, UPI, net banking or wallet — at discounted prices, or simply choose cash on delivery at your doorstep. We connect you only with registered pharmacies and certified labs, so you can order with confidence. Our goal is to keep healthcare affordable for everyone and make ordering online genuinely hassle-free.',
  },
  {
    heading: 'Never Miss a Refill — Essentials Delivered Every Month',
    body: "Remembering to refill chronic medication every month is hard. DCare's reminders and easy re-ordering make sure you're never caught without your essentials — get a gentle nudge each month and have your order delivered right when you need it.",
  },
  {
    heading: 'Reliable Medical & Health Information',
    body: 'Beyond products, DCare shares health information you can trust. Our blog and guides are written and reviewed with care, covering medicines, wellness, lab tests and everyday health — so you can make informed decisions about your wellbeing.',
  },
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

      {/* Long-form content */}
      <div className="mt-12 rounded-2xl bg-white p-6 shadow-card sm:p-10">
        <h2 className="text-2xl font-extrabold text-dark">Your One-Stop Online Pharmacy — DCare</h2>
        <div className="mt-6 space-y-7">
          {sections.map((s) => (
            <div key={s.heading}>
              <h3 className="text-lg font-bold text-dark">{s.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
          <p className="border-t border-bordergray pt-6 text-base font-bold text-primary">
            We believe in “Simplifying Healthcare, Impacting Lives.”
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link to="/shop" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    </div>
  )
}
