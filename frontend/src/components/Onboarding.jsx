import { useRef, useState } from 'react'
import { FaUserMd, FaFlask, FaTruck, FaArrowRight } from 'react-icons/fa'

// First-launch onboarding: a pharmacy illustration on a clean white background,
// with three pharmacy-themed slides. Shown once; the caller gates it on a
// localStorage flag and only on phones/the installed app. The white background
// is a literal #ffffff so the app's dark theme can't remap it. Falls back to a
// clean icon badge if the image is missing.
//
// Drop your artwork at: frontend/public/onboarding-pharmacist.(png|jpg|webp)
const HERO_CANDIDATES = [
  '/onboarding-pharmacist.png',
  '/onboarding-pharmacist.jpg',
  '/onboarding-pharmacist.webp',
]

const SLIDES = [
  {
    icon: FaUserMd,
    title: 'Your health, our priority',
    text: 'One app for medicines, doctor consultations and lab tests — care that comes to you.',
  },
  {
    icon: FaFlask,
    title: 'Genuine medicines, expert care',
    text: '100% authentic products, a licensed pharmacy, and guidance whenever you need it.',
  },
  {
    icon: FaTruck,
    title: 'Fast doorstep delivery',
    text: 'Order in seconds and get it delivered to your door — quick, safe and reliable.',
  },
]

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0)
  const [heroIdx, setHeroIdx] = useState(0)
  const touchX = useRef(null)
  const heroFailed = heroIdx >= HERO_CANDIDATES.length

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
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#ffffff]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar: brand + Skip (always visible) */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <span className="text-lg font-black leading-none">+</span>
          </span>
          <span className="text-sm font-extrabold tracking-tight text-[#0f2f2b]">DBL Life Care</span>
        </div>
        {!isLast && (
          <button
            type="button"
            onClick={finish}
            className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primaryDark transition hover:bg-primary/20"
          >
            Skip
          </button>
        )}
      </div>

      {/* Illustration — floats on the white, no box, soft shadow */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8">
        {!heroFailed ? (
          <img
            src={HERO_CANDIDATES[heroIdx]}
            alt="DBL Life Care pharmacy"
            onError={() => setHeroIdx((i) => i + 1)}
            className="max-h-[46vh] w-auto max-w-full animate-floaty object-contain"
          />
        ) : (
          <span className="flex h-44 w-44 items-center justify-center rounded-full bg-primary/10 text-primary">
            <S.icon size={76} />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 px-7 pb-9 text-center">
        <h2 className="text-2xl font-extrabold leading-tight text-[#0f2f2b]">{S.title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#2b4a46]">{S.text}</p>

        {/* Dots — centred */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === slide ? 'w-7 bg-primary' : 'w-2 bg-primaryDark/25'}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primaryDark active:scale-[0.99]"
        >
          {isLast ? 'Get Started' : 'Continue'} <FaArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
