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
  { icon: FaUserMd, label: 'Doctor Consultation', to: '/doctors', color: 'bg-sky-100 text-sky-600' },
  { icon: FaFlask, label: 'Lab Tests', to: '/lab-tests', color: 'bg-violet-100 text-violet-600' },
  { icon: FaSyringe, label: 'Vaccination', to: '/shop?keyword=vaccine', color: 'bg-emerald-100 text-emerald-600' },
  { icon: FaShieldAlt, label: 'Health Insurance', to: '/contact', color: 'bg-indigo-100 text-indigo-600' },
  { icon: FaHeart, label: 'Join Health Club', to: '/health-club', color: 'bg-rose-100 text-rose-600' },
  { icon: FaFileMedical, label: 'Upload Prescription', to: '/prescription', color: 'bg-amber-100 text-amber-600' },
  { icon: FaNotesMedical, label: 'Health Records', to: '/health-records', color: 'bg-cyan-100 text-cyan-600' },
  { icon: FaRobot, label: 'AI Assistant', to: '/health-assistant', color: 'bg-fuchsia-100 text-fuchsia-600' },
  { icon: FaTruck, label: 'Track Order', to: '/account', color: 'bg-teal-100 text-teal-600' },
]

export default function QuickServices({ onNavigate }) {
  return (
    <div className="border-b border-bordergray bg-white">
      <div className="container-x">
        <ul className="flex gap-1 overflow-x-auto py-2 sm:justify-between sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {services.map((s) => (
            <li key={s.label} className="shrink-0">
              <Link
                to={s.to}
                onClick={onNavigate}
                className="group flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-center transition hover:bg-primary/5 sm:flex-row sm:gap-2 sm:px-2"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${s.color} transition group-hover:scale-110`}>
                  <s.icon size={14} />
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
