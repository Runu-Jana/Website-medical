import {
  FaHandHoldingHeart,
  FaFlask,
  FaUserMd,
  FaClinicMedical,
  FaPrescriptionBottleAlt,
} from 'react-icons/fa'

const features = [
  { icon: FaHandHoldingHeart, label: 'Healthcare', value: 'Up to 60% Off', bg: 'bg-[#fce7ee]' },
  { icon: FaFlask, label: 'Lab Tests', value: 'Up to 70% Off', bg: 'bg-[#fdf1d6]' },
  { icon: FaUserMd, label: 'Consult', value: 'In 15 Min', bg: 'bg-[#ece9fb]' },
  { icon: FaClinicMedical, label: 'Local Pharmacy', value: 'Find Store', bg: 'bg-[#e3f5ea]' },
  { icon: FaPrescriptionBottleAlt, label: 'Medicine', value: 'Flat 24% Off', bg: 'bg-[#dcf2ef]' },
]

export default function FeatureStrip() {
  return (
    <div className="container-x mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {features.map((f) => (
          <div
            key={f.label}
            className={`flex items-center gap-3 rounded-2xl px-4 py-5 ${f.bg}`}
          >
            <span className="shrink-0 text-3xl text-slate-700">
              <f.icon />
            </span>
            <div>
              <p className="text-sm text-slate-600">{f.label}</p>
              <p className="text-sm font-extrabold uppercase tracking-wide text-dark">{f.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
