import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Persisted delivery location for every visitor (no login required), 1mg/Netmeds
// style. Shape: { city, pincode, state?, source: 'gps' | 'manual' }.
const KEY = 'dbl_delivery_location'
const LocationCtx = createContext(null)

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

export function DeliveryLocationProvider({ children }) {
  const [location, setLocation] = useState(readStored)
  const [promptOpen, setPromptOpen] = useState(false)

  // Ask a brand-new visitor once, a moment after the page settles.
  useEffect(() => {
    if (location) return
    const t = setTimeout(() => setPromptOpen(true), 1200)
    return () => clearTimeout(t)
  }, []) // run once on mount

  const saveLocation = useCallback((loc) => {
    setLocation(loc)
    try {
      localStorage.setItem(KEY, JSON.stringify(loc))
    } catch {
      /* storage may be unavailable (private mode) — keep it in memory */
    }
    setPromptOpen(false)
  }, [])

  const openPrompt = useCallback(() => setPromptOpen(true), [])
  const closePrompt = useCallback(() => setPromptOpen(false), [])

  return (
    <LocationCtx.Provider value={{ location, saveLocation, promptOpen, openPrompt, closePrompt }}>
      {children}
    </LocationCtx.Provider>
  )
}

export function useDeliveryLocation() {
  return useContext(LocationCtx) || {}
}
