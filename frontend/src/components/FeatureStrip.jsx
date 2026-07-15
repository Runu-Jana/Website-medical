import { Link } from 'react-router-dom'
import {
  FaHandHoldingHeart,
  FaFlask,
  FaUserMd,
  FaClinicMedical,
  FaPrescriptionBottleAlt,
  FaHeartbeat,
} from 'react-icons/fa'

const features = [
  { icon: FaHandHoldingHeart, label: 'Healthcare', value: 'Up to 60% Off', bg: 'bg-[#fce7ee]', to: '/shop' },
  { icon: FaFlask, label: 'Lab Tests', value: 'Up to 70% Off', bg: 'bg-[#fdf1d6]', to: '/shop?keyword=lab' },
  { icon: FaUserMd, label: 'Consult', value: 'In 15 Min', bg: 'bg-[#ece9fb]', to: '/contact' },
  { icon: FaClinicMedical, label: 'Local Pharmacy', value: 'Find Store', bg: 'bg-[#e3f5ea]', to: '/contact' },
  { icon: FaPrescriptionBottleAlt, label: 'Medicine', value: 'Flat 24% Off', bg: 'bg-[#dcf2ef]', to: '/shop?keyword=medicine' },
  { icon: FaHeartbeat, label: 'Wellness', value: 'Up to 50% Off', bg: 'bg-[#eef2ff]', to: '/shop?deal=true' },
]

export default function FeatureStrip() {
  return (
    <div className="container-x mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {features.map((f) => (
          <Link
            key={f.label}
            to={f.to}
            className={`flex items-center gap-3 rounded-2xl px-4 py-5 transition hover:shadow-card dark:bg-slate-800 dark:ring-1 dark:ring-white/10 ${f.bg}`}
          >
            <span className="shrink-0 text-3xl text-slate-700 dark:text-primary">
              <f.icon />
            </span>
            <div>
              <p className="text-sm text-slate-600">{f.label}</p>
              <p className="text-sm font-extrabold uppercase tracking-wide text-dark">{f.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
