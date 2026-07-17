import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { imgFallback } from '../lib/helpers'
import {
  FaUserMd, FaStar, FaSearch, FaArrowLeft, FaBaby, FaVenus, FaHeartbeat, FaBrain,
  FaTooth, FaEye, FaBone, FaHandHoldingMedical, FaAssistiveListeningSystems, FaStethoscope, FaThLarge,
} from 'react-icons/fa'

// Map a specialty name to an icon + colour (fallback rotates through a palette).
const PALETTE = [
  'bg-sky-100 text-sky-600', 'bg-rose-100 text-rose-600', 'bg-violet-100 text-violet-600',
  'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600', 'bg-indigo-100 text-indigo-600',
  'bg-cyan-100 text-cyan-600', 'bg-fuchsia-100 text-fuchsia-600',
]
const ICONS = [
  [/paediatric|pediatric|child/i, FaBaby],
  [/gyn|obstetric|women/i, FaVenus],
  [/derma|skin/i, FaHandHoldingMedical],
  [/cardio|heart/i, FaHeartbeat],
  [/ent|ear|nose|throat/i, FaAssistiveListeningSystems],
  [/psych|mental|neuro|brain/i, FaBrain],
  [/dent|tooth|oral/i, FaTooth],
  [/eye|ophthal|optom/i, FaEye],
  [/ortho|bone|joint/i, FaBone],
  [/general|physician|medicine/i, FaStethoscope],
]
const specialtyMeta = (name, i) => {
  const found = ICONS.find(([re]) => re.test(name || ''))
  return { Icon: found ? found[1] : FaUserMd, color: PALETTE[i % PALETTE.length] }
}

// Common specialties shown even before doctors are added for them; any custom
// specialty from a real doctor is merged in after these.
const CURATED_SPECIALTIES = [
  'General Physician', 'Pediatrics', 'Gynecologist', 'Dermatologist', 'Cardiologist',
  'ENT Specialist', 'Psychiatrist', 'Neurologist', 'Orthopedic', 'Dentist',
  'Ophthalmologist', 'Diabetologist', 'Gastroenterologist', 'Urologist', 'Physiotherapist',
]

function DoctorCard({ doc }) {
  return (
    <div className="card flex min-w-0 items-center gap-3 p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-lightbg sm:h-16 sm:w-16">
        {doc.photo ? (
          <img src={doc.photo} onError={imgFallback} alt={doc.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary"><FaUserMd size={26} /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-dark">{doc.name}</h3>
        <p className="truncate text-xs text-slate-500">{doc.qualifications || doc.specialty}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
          {doc.experience > 0 && <span>{doc.experience}+ Years Experience</span>}
          {doc.rating > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <FaStar size={11} /> {doc.rating} <span className="font-normal text-slate-400">({doc.numReviews})</span>
            </span>
          )}
        </div>
      </div>
      <Link
        to={`/doctors/${doc.slug || doc._id}`}
        className="shrink-0 whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white hover:bg-primaryDark sm:px-3.5 sm:text-xs"
      >
        Consult Now
      </Link>
    </div>
  )
}

export default function DoctorConsultation() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [active, setActive] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAllSpec, setShowAllSpec] = useState(false)
  const doctorsRef = useRef(null)

  useEffect(() => {
    let on = true
    api.get('/doctors')
      .then(({ data }) => {
        if (!on) return
        setDoctors(data.doctors || [])
        setSpecialties(data.specialties || [])
      })
      .catch(() => on && setDoctors([]))
      .finally(() => on && setLoading(false))
    return () => { on = false }
  }, [])

  const filtered = useMemo(() => doctors.filter((d) => {
    if (active && (d.specialty || '').toLowerCase() !== active.toLowerCase()) return false
    if (keyword) {
      const k = keyword.toLowerCase()
      return d.name.toLowerCase().includes(k) || (d.specialty || '').toLowerCase().includes(k) || (d.qualifications || '').toLowerCase().includes(k)
    }
    return true
  }), [doctors, active, keyword])

  // Curated specialties first, then any real doctor specialty not already present (case-insensitive).
  const allSpecialties = useMemo(() => {
    const seen = new Set(CURATED_SPECIALTIES.map((s) => s.toLowerCase()))
    const extras = specialties.filter((s) => s && !seen.has(s.toLowerCase()))
    return [...CURATED_SPECIALTIES, ...extras]
  }, [specialties])

  const scrollToDoctors = () => doctorsRef.current?.scrollIntoView({ behavior: 'smooth' })
  const shownSpecialties = showAllSpec ? allSpecialties : allSpecialties.slice(0, 7)

  return (
    <div className="container-x py-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} aria-label="Back" className="rounded-full p-2 text-slate-600 hover:bg-lightbg">
          <FaArrowLeft size={16} />
        </button>
        <h1 className="text-lg font-bold text-dark">Doctor Consultation</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search doctors, specialty…" className="input-base w-full pl-10" />
      </div>

      {/* Consult a Doctor banner */}
      <div className="mt-4 flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-100 p-5 dark:from-cyan-950 dark:to-sky-950">
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-dark">Consult a Doctor</h2>
          <p className="mt-1 text-sm text-slate-600">From the comfort of your home.</p>
          <button onClick={scrollToDoctors} className="mt-3 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primaryDark">
            Book Now
          </button>
        </div>
        {/* Decorative doctor illustration */}
        <div className="relative hidden h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/70 sm:flex">
          <FaUserMd className="text-primary" size={46} />
          <span className="absolute -right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-500 shadow"><FaHeartbeat size={15} /></span>
          <span className="absolute -left-1 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-500 shadow"><FaStethoscope size={13} /></span>
        </div>
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/70 sm:hidden">
          <FaUserMd className="text-primary" size={38} />
        </div>
      </div>

      {loading ? (
        <Spinner className="py-16" />
      ) : (
        <>
          {/* Specialities */}
          {allSpecialties.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-dark">Specialities</h2>
                {active && (
                  <button onClick={() => setActive('')} className="text-sm font-semibold text-primary">View All</button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {shownSpecialties.map((s, i) => {
                  const { Icon, color } = specialtyMeta(s, i)
                  const on = active.toLowerCase() === s.toLowerCase()
                  return (
                    <button key={s} onClick={() => setActive(on ? '' : s)} className="flex flex-col items-center gap-1.5 text-center">
                      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl transition ${on ? 'bg-primary text-white' : color} ${on ? '' : 'hover:scale-105'}`}>
                        <Icon size={22} />
                      </span>
                      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-600">{s}</span>
                    </button>
                  )
                })}
                {/* "More" / "Less" toggle tile — reveals every specialty in the project */}
                {allSpecialties.length > 7 && (
                  <button onClick={() => setShowAllSpec((v) => !v)} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:scale-105"><FaThLarge size={20} /></span>
                    <span className="text-[11px] font-medium text-slate-600">{showAllSpec ? 'Less' : 'More'}</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Top Doctors */}
          <section ref={doctorsRef} className="mt-7">
            <h2 className="mb-3 text-base font-bold text-dark">
              {active || 'Top Doctors'} <span className="text-sm font-normal text-slate-400">({filtered.length})</span>
            </h2>
            {filtered.length === 0 ? (
              <div className="card p-10 text-center text-sm text-slate-500">No doctors found.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((d) => <DoctorCard key={d._id} doc={d} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
