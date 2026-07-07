import { Link } from 'react-router-dom'
import {
  FaUserMd,
  FaFlask,
  FaSyringe,
  FaShieldAlt,
  FaHeart,
  FaFileMedical,
  FaTruck,
  FaUserCircle,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const services = [
  { icon: FaUserMd, label: 'Doctor Appointment', to: '/contact' },
  { icon: FaFlask, label: 'Lab Tests', to: '/shop?keyword=lab' },
  { icon: FaSyringe, label: 'Vaccination', to: '/shop?keyword=vaccine' },
  { icon: FaShieldAlt, label: 'Health Insurance', to: '/contact' },
  { icon: FaHeart, label: 'Join Health Club', to: '/register' },
  { icon: FaFileMedical, label: 'Upload Prescription', to: '/prescription' },
  { icon: FaTruck, label: 'Track Order', to: '/account' },
  { icon: FaUserCircle, label: 'Login / Register', to: '/login', authTo: '/account' },
]

export default function QuickServices({ onNavigate }) {
  const { user } = useAuth()

  return (
    <div className="border-b border-bordergray bg-white">
      <div className="container-x">
        <ul className="flex gap-1 overflow-x-auto py-2 sm:justify-between sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {services.map((s) => (
            <li key={s.label} className="shrink-0">
              <Link
                to={user && s.authTo ? s.authTo : s.to}
                onClick={onNavigate}
                className="group flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-center transition hover:bg-primary/5 sm:flex-row sm:gap-2 sm:px-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
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
