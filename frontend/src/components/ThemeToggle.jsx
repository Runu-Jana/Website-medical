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

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300 ${className}`}
    >
      {dark ? <FaSun size={16} /> : <FaMoon size={15} />}
    </button>
  )
}
