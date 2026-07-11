import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { imgFallback } from '../lib/helpers'
import { FaUserMd, FaStar, FaSearch, FaVideo } from 'react-icons/fa'

function DoctorCard({ doc }) {
  return (
    <div className="card flex gap-4 p-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-lightbg">
        {doc.photo ? (
          <img src={doc.photo} onError={imgFallback} alt={doc.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary">
            <FaUserMd size={30} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-dark">{doc.name}</h3>
        <p className="truncate text-xs text-slate-500">{doc.qualifications || doc.specialty}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {doc.experience > 0 && <span>{doc.experience}+ yrs exp</span>}
          {doc.rating > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <FaStar size={11} /> {doc.rating} ({doc.numReviews})
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-dark">₹{Math.round(doc.fee)} <span className="text-xs font-normal text-slate-400">consult</span></span>
          <Link
            to={`/doctors/${doc.slug || doc._id}`}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primaryDark"
          >
            Consult Now
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DoctorConsultation() {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [active, setActive] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    api
      .get('/doctors')
      .then(({ data }) => {
        if (!on) return
        setDoctors(data.doctors || [])
        setSpecialties(data.specialties || [])
      })
      .catch(() => on && setDoctors([]))
      .finally(() => on && setLoading(false))
    return () => {
      on = false
    }
  }, [])

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      if (active && d.specialty !== active) return false
      if (keyword) {
        const k = keyword.toLowerCase()
        return (
          d.name.toLowerCase().includes(k) ||
          (d.specialty || '').toLowerCase().includes(k) ||
          (d.qualifications || '').toLowerCase().includes(k)
        )
      }
      return true
    })
  }, [doctors, active, keyword])

  return (
    <div className="container-x py-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <FaVideo size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Consult a Doctor</h1>
            <p className="text-sm text-white/85">From the comfort of your home — video, audio or chat.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-5">
        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search doctors or specialities…"
          className="input-base w-full pl-10"
        />
      </div>

      {/* Specialities */}
      {specialties.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Specialities</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActive('')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                !active ? 'bg-primary text-white' : 'bg-lightbg text-slate-600 hover:bg-primary/10'
              }`}
            >
              All
            </button>
            {specialties.map((s) => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  active === s ? 'bg-primary text-white' : 'bg-lightbg text-slate-600 hover:bg-primary/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Doctors */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-dark">
          {active || 'Top Doctors'} <span className="text-sm font-normal text-slate-400">({filtered.length})</span>
        </h2>
        {loading ? (
          <Spinner className="py-16" />
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center text-sm text-slate-500">No doctors found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((d) => (
              <DoctorCard key={d._id} doc={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
