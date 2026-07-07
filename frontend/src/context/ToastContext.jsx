import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { FaCheckCircle, FaHeart, FaShoppingCart, FaInfoCircle } from 'react-icons/fa'

const ToastContext = createContext(null)

// tone → icon + accent colour for the centered popup
const TONES = {
  cart: { Icon: FaShoppingCart, ring: 'bg-primary/10 text-primary' },
  success: { Icon: FaCheckCircle, ring: 'bg-primary/10 text-primary' },
  wishlist: { Icon: FaHeart, ring: 'bg-rose-100 text-rose-500' },
  info: { Icon: FaInfoCircle, ring: 'bg-amber-100 text-amber-500' },
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { title, subtitle, thumbnail, tone }
  const timer = useRef(null)

  const showToast = ({ title, subtitle = '', thumbnail = '', tone = 'success', duration = 2200 }) => {
    setToast({ title, subtitle, thumbnail, tone })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), duration)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const { Icon, ring } = TONES[toast?.tone] || TONES.success

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Centered popup */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center px-4"
        aria-live="polite"
      >
        <div
          role="status"
          className={`flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-bordergray bg-white px-6 py-6 text-center shadow-lift transition-all duration-300 ${
            toast ? 'scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
          }`}
        >
          {toast && (
            <>
              {toast.thumbnail ? (
                <img
                  src={toast.thumbnail}
                  alt=""
                  className="h-16 w-16 rounded-xl border border-bordergray object-cover"
                />
              ) : (
                <span className={`flex h-14 w-14 items-center justify-center rounded-full ${ring}`}>
                  <Icon size={26} />
                </span>
              )}
              <div>
                <p className="text-base font-bold text-dark">{toast.title}</p>
                {toast.subtitle && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{toast.subtitle}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // Safe no-op if used outside the provider, so contexts never crash.
  return ctx || { showToast: () => {} }
}
