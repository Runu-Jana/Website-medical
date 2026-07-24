import { useRef, useState } from 'react'
import { FaUserMd, FaFlask, FaTruck, FaArrowRight } from 'react-icons/fa'

// First-launch onboarding: a 3D-style pharmacy illustration (top 60%) over a
// white background, with three pharmacy-themed slides (bottom 40%). Shown once;
// the caller gates it on a localStorage flag and only on phones/the installed
// app. If the illustration is missing it degrades to a clean icon badge.
//
// Drop your artwork at: frontend/public/onboarding-pharmacist.png
// (a watermark-free, transparent or white-background PNG).
const HERO_IMG = '/onboarding-pharmacist.png'

const SLIDES = [
  {
    icon: FaUserMd,
    title: 'Your health, our priority',
    text: 'One app for medicines, doctor consultations and lab tests — care that comes to you.',
  },
  {
    icon: FaFlask,
    title: 'Genuine medicines, expert care',
    text: '100% authentic products, licensed pharmacy, and guidance whenever you need it.',
  },
  {
    icon: FaTruck,
    title: 'Fast doorstep delivery',
    text: 'Order in seconds and get it delivered to your door — quick, safe and reliable.',
  },
]

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0)
  const [imgOk, setImgOk] = useState(true)
  const touchX = useRef(null)

  const finish = () => {
    try {
      localStorage.setItem('dbl_onboarded', '1')
    } catch {
      /* private mode — still dismiss for this session */
    }
    onDone?.()
  }

  const next = () => (slide < SLIDES.length - 1 ? setSlide((s) => s + 1) : finish())

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx < -40 && slide < SLIDES.length - 1) setSlide((s) => s + 1)
    else if (dx > 40 && slide > 0) setSlide((s) => s - 1)
    touchX.current = null
  }

  const S = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top 60%: 3D pharmacy illustration on white ── */}
      <div className="relative flex h-[60%] w-full items-center justify-center px-6">
        {imgOk ? (
          <img
            src={HERO_IMG}
            alt="DBL Life Care pharmacy"
            onError={() => setImgOk(false)}
            className="max-h-full max-w-full animate-floaty object-contain"
          />
        ) : (
          // Fallback until the artwork is added.
          <span className="flex h-40 w-40 items-center justify-center rounded-full bg-primary/10 text-primary">
            <S.icon size={72} />
          </span>
        )}

        {/* Brand mark */}
        <div className="absolute left-6 top-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <span className="text-lg font-black leading-none">+</span>
          </span>
          <span className="text-sm font-extrabold tracking-tight text-[#1e293b]">DBL Life Care</span>
        </div>
      </div>

      {/* ── Bottom 40%: content ── */}
      <div className="flex h-[40%] flex-col justify-between px-6 pb-7 pt-4">
        <div>
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <S.icon size={20} />
          </span>
          <h2 className="text-2xl font-extrabold leading-tight text-[#1e293b]">{S.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">{S.text}</p>
        </div>

        <div>
          {/* Dots — centred across the page width */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-primary' : 'w-2 bg-primary/25'}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-primaryDark"
          >
            {isLast ? 'Get Started' : 'Continue'} <FaArrowRight size={14} />
          </button>

          {/* Skip — below Continue */}
          {!isLast && (
            <button
              type="button"
              onClick={finish}
              className="mt-2 w-full py-2 text-center text-sm font-semibold text-[#64748b] transition hover:text-primary"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
