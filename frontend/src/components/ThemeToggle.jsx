import { useEffect, useState } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'

// Reads the current theme from the <html> class (set pre-paint in index.html),
// toggles it, and persists the choice.
export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  const label = dark ? 'Light mode' : 'Dark mode'
  return (
    <div className={`group relative ${className}`}>
      <button
        type="button"
        onClick={() => setDark((d) => !d)}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300"
      >
        {dark ? <FaSun size={16} className="text-amber-500" /> : <FaMoon size={15} />}
      </button>
      {/* Custom tooltip below the button */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800" />
        {label}
      </span>
    </div>
  )
}
