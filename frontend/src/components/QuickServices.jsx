import { Link } from 'react-router-dom'
import {
  FaUserMd,
  FaFlask,
  FaSyringe,
  FaShieldAlt,
  FaHeart,
  FaFileMedical,
  FaTruck,
  FaNotesMedical,
  FaRobot,
} from 'react-icons/fa'

const services = [
  { icon: FaUserMd, label: 'Doctor', to: '/doctors', color: 'bg-sky-100 text-sky-600' },
  { icon: FaFlask, label: 'Lab Tests', to: '/lab-tests', color: 'bg-violet-100 text-violet-600' },
  { icon: FaSyringe, label: 'Vaccination', to: '/shop?keyword=vaccine', color: 'bg-emerald-100 text-emerald-600' },
  { icon: FaShieldAlt, label: 'Insurance', to: '/contact', color: 'bg-indigo-100 text-indigo-600' },
  { icon: FaHeart, label: 'Health Club', to: '/health-club', color: 'bg-rose-100 text-rose-600' },
  { icon: FaFileMedical, label: 'Upload Rx', to: '/prescription', color: 'bg-amber-100 text-amber-600' },
  { icon: FaNotesMedical, label: 'Records', to: '/health-records', color: 'bg-cyan-100 text-cyan-600' },
  { icon: FaRobot, label: 'Ask AI', to: '/health-assistant', color: 'bg-fuchsia-100 text-fuchsia-600' },
  { icon: FaTruck, label: 'Track Order', to: '/account', color: 'bg-teal-100 text-teal-600' },
]

export default function QuickServices({ onNavigate }) {
  return (
    <div className="border-b border-bordergray bg-white">
      <div className="container-x">
        {/* Mobile: tidy 3-column grid (no long scroll). Desktop: single row. */}
        <ul className="grid grid-cols-3 gap-x-1 gap-y-3 py-3 sm:flex sm:justify-between sm:gap-2 sm:py-2 sm:overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {services.map((s) => (
            <li key={s.label} className="sm:shrink-0">
              <Link
                to={s.to}
                onClick={onNavigate}
                className="group flex flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-center transition hover:bg-primary/5 sm:flex-row sm:gap-2 sm:px-2"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${s.color} transition group-hover:scale-110 sm:h-8 sm:w-8`}>
                  <s.icon size={15} />
                </span>
                <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700 group-hover:text-primary sm:text-xs">
                  {s.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
