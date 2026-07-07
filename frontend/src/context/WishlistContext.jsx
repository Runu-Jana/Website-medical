import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const WishlistContext = createContext(null)

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem('wishlist_items') || '[]')
  } catch {
    return []
  }
}

// Keep just the fields the wishlist UI / cards need.
const slim = (p) => ({
  _id: p._id,
  name: p.name,
  slug: p.slug,
  price: p.price,
  oldPrice: p.oldPrice,
  discountPercent: p.discountPercent,
  thumbnail: p.thumbnail || (p.images && p.images[0]) || '',
  images: p.images || [],
  rating: p.rating,
  numReviews: p.numReviews,
  countInStock: p.countInStock,
  brand: p.brand ? { name: p.brand.name } : null,
  unit: p.unit,
})

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState(loadLocal)
  const prevUser = useRef(null)
  const saveTimer = useRef(null)

  useEffect(() => {
    if (!user) localStorage.setItem('wishlist_items', JSON.stringify(items))
  }, [items, user])

  // Login → merge guest wishlist with server; logout → clear.
  useEffect(() => {
    const uid = user?._id || null
    if (uid && uid !== prevUser.current) {
      ;(async () => {
        try {
          const { data } = await api.get('/me/wishlist')
          const map = new Map()
          ;[...(data.items || []), ...loadLocal()].forEach((p) => map.set(p._id, slim(p)))
          setItems([...map.values()])
          localStorage.removeItem('wishlist_items')
        } catch {
          /* keep local on failure */
        }
      })()
    } else if (!uid && prevUser.current) {
      setItems([])
      localStorage.removeItem('wishlist_items')
    }
    prevUser.current = uid
  }, [user])

  useEffect(() => {
    if (!user) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.put('/me/wishlist', { ids: items.map((p) => p._id) }).catch(() => {})
    }, 500)
    return () => clearTimeout(saveTimer.current)
  }, [items, user])

  const isWishlisted = (id) => items.some((p) => p._id === id)
  const toggle = (product) => {
    // Sign-in required before saving to the wishlist.
    if (!user) {
      showToast({
        title: 'Please sign in',
        subtitle: 'Sign in or create an account to save favourites.',
        tone: 'info',
      })
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    const already = items.some((p) => p._id === product._id)
    if (already) {
      setItems((prev) => prev.filter((p) => p._id !== product._id))
      showToast({ title: 'Removed from wishlist', subtitle: product.name, tone: 'info' })
    } else {
      setItems((prev) => [...prev, slim(product)])
      showToast({
        title: 'Added to wishlist',
        subtitle: product.name,
        thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
        tone: 'wishlist',
      })
    }
  }
  const remove = (id) => setItems((prev) => prev.filter((p) => p._id !== id))

  return (
    <WishlistContext.Provider value={{ items, count: items.length, isWishlisted, toggle, remove }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
