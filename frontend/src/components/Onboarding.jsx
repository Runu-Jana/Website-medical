import { useEffect, useRef, useState } from 'react'
import { FaUserMd, FaFlask, FaTruck, FaArrowRight } from 'react-icons/fa'

// First-launch onboarding: three pharmacy-themed slides over a live Three.js
// backdrop (floating capsules + molecule + particles). Shown once; the caller
// gates it on a localStorage flag. Degrades to a clean static illustration when
// WebGL is unavailable or the user prefers reduced motion.

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
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [slide, setSlide] = useState(0)
  const [use3d, setUse3d] = useState(true)
  const touchX = useRef(null)

  // Spin up the 3D backdrop (or fall back gracefully).
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced || !canvasRef.current) {
      setUse3d(false)
      return undefined
    }
    let disposed = false
    import('../lib/onboardingScene')
      .then(({ createOnboardingScene }) => {
        if (disposed || !canvasRef.current) return
        try {
          sceneRef.current = createOnboardingScene(canvasRef.current)
        } catch {
          setUse3d(false) // no WebGL — show the static fallback
        }
      })
      .catch(() => setUse3d(false))
    return () => {
      disposed = true
      sceneRef.current?.dispose?.()
      sceneRef.current = null
    }
  }, [])

  // Nudge the scene's parallax when the slide changes.
  useEffect(() => {
    sceneRef.current?.setSlide?.(slide)
  }, [slide])

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
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-gradient-to-b from-[#f0fdfa] via-[#e6fbf6] to-[#cbf5ec]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 3D backdrop (or static fallback) */}
      {use3d ? (
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      ) : (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Simple floating-capsule fallback */}
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute block h-6 w-2.5 rounded-full opacity-70"
              style={{
                left: `${(i * 37) % 90 + 4}%`,
                top: `${(i * 53) % 60 + 6}%`,
                background: i % 2 ? '#0e9f8e' : '#2dd4bf',
                transform: `rotate(${i * 40}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Skip */}
      {!isLast && (
        <button
          type="button"
          onClick={finish}
          className="absolute right-5 top-6 z-10 text-sm font-semibold text-slate-500 hover:text-primary"
        >
          Skip
        </button>
      )}

      {/* Brand mark */}
      <div className="relative z-10 flex items-center gap-2 px-6 pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <span className="text-lg font-black leading-none">+</span>
        </span>
        <span className="text-sm font-extrabold tracking-tight text-dark">DBL Life Care</span>
      </div>

      <div className="flex-1" />

      {/* Content panel */}
      <div className="relative z-10 rounded-t-[2rem] bg-white/85 px-6 pb-8 pt-7 shadow-[0_-8px_30px_rgba(14,159,142,0.12)] backdrop-blur-sm">
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <S.icon size={22} />
        </span>
        <h2 className="text-2xl font-extrabold leading-tight text-dark">{S.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{S.text}</p>

        {/* Dots */}
        <div className="mt-5 flex items-center gap-2">
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
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-primaryDark"
        >
          {isLast ? 'Get Started' : 'Next'} <FaArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
