import { Link } from 'react-router-dom'
import {
  FaTint,
  FaHeartbeat,
  FaBaby,
  FaShieldVirus,
  FaBrain,
  FaBone,
  FaEye,
  FaTeeth,
} from 'react-icons/fa'
import SectionHeading from './SectionHeading'

// Curated health-concern shortcuts (1mg "Health Corner" style).
const topics = [
  { icon: FaTint, label: 'Diabetes Care', to: '/shop?keyword=diabetes', color: 'text-rose-500 bg-rose-50' },
  { icon: FaHeartbeat, label: 'Heart Care', to: '/shop?keyword=heart', color: 'text-red-500 bg-red-50' },
  { icon: FaShieldVirus, label: 'Immunity', to: '/shop?keyword=immunity', color: 'text-emerald-500 bg-emerald-50' },
  { icon: FaBaby, label: 'Baby Care', to: '/shop?keyword=baby', color: 'text-amber-500 bg-amber-50' },
  { icon: FaBrain, label: 'Stress & Sleep', to: '/shop?keyword=stress', color: 'text-indigo-500 bg-indigo-50' },
  { icon: FaBone, label: 'Bone & Joint', to: '/shop?keyword=bone', color: 'text-sky-500 bg-sky-50' },
  { icon: FaEye, label: 'Eye Care', to: '/shop?keyword=eye', color: 'text-cyan-500 bg-cyan-50' },
  { icon: FaTeeth, label: 'Oral Care', to: '/shop?keyword=oral', color: 'text-violet-500 bg-violet-50' },
]

export default function HealthCorner() {
  return (
    <section className="container-x mt-14">
      <SectionHeading subtitle="Shop by concern" title="Health Corner" />
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {topics.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className="card group flex flex-col items-center gap-2 p-3 text-center transition hover:-translate-y-1 hover:border-primary hover:shadow-lift"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-full ${t.color}`}>
              <t.icon size={20} />
            </span>
            <span className="text-[11px] font-semibold leading-tight text-slate-700 group-hover:text-primary sm:text-xs">
              {t.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
