import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { calcShipping, MEMBER_DISCOUNT_PERCENT } from '../lib/helpers'

const CartContext = createContext(null)

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  } catch {
    return []
  }
}

// Combine two carts, summing qty for the same product (capped at stock).
const mergeCarts = (a, b) => {
  const map = new Map()
  ;[...a, ...b].forEach((i) => {
    const stock = i.countInStock ?? 99
    const ex = map.get(i._id)
    if (ex) ex.qty = Math.min(stock, ex.qty + i.qty)
    else map.set(i._id, { ...i, qty: Math.min(stock, i.qty) })
  })
  return [...map.values()]
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState(loadLocal)
  const prevUser = useRef(null)
  const saveTimer = useRef(null)

  // Guest cart persists to localStorage.
  useEffect(() => {
    if (!user) localStorage.setItem('cart', JSON.stringify(items))
  }, [items, user])

  // Login → merge guest cart with server cart; logout → clear the account cart.
  useEffect(() => {
    const uid = user?._id || null
    if (uid && uid !== prevUser.current) {
      ;(async () => {
        try {
          const { data } = await api.get('/me/cart')
          setItems(mergeCarts(data.items || [], loadLocal()))
          localStorage.removeItem('cart')
        } catch {
          /* keep local cart on failure */
        }
      })()
    } else if (!uid && prevUser.current) {
      setItems([])
      localStorage.removeItem('cart')
    }
    prevUser.current = uid
  }, [user])

  // While logged in, persist every change to the server (debounced).
  useEffect(() => {
    if (!user) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api
        .put('/me/cart', { items: items.map((i) => ({ productId: i._id, qty: i.qty })) })
        .catch(() => {})
    }, 600)
    return () => clearTimeout(saveTimer.current)
  }, [items, user])

  // Sign-in required before adding anything. Returns true if allowed.
  const requireAuth = () => {
    if (user) return true
    showToast({
      title: 'Please sign in',
      subtitle: 'Sign in or create an account to continue.',
      tone: 'info',
    })
    navigate('/login', { state: { from: location.pathname + location.search } })
    return false
  }

  const addToCart = (product, qty = 1) => {
    if (!requireAuth()) return false
    const id = product._id || product.product
    showToast({
      title: 'Added to cart',
      subtitle: product.name,
      thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
      tone: 'cart',
    })
    setItems((prev) => {
      const existing = prev.find((i) => i._id === id)
      const stock = product.countInStock ?? 99
      if (existing) {
        return prev.map((i) => (i._id === id ? { ...i, qty: Math.min(stock, i.qty + qty) } : i))
      }
      return [
        ...prev,
        {
          _id: id,
          name: product.name,
          thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
          price: product.price,
          oldPrice: product.oldPrice || 0,
          qty: Math.min(stock, qty),
          unit: product.unit || '',
          countInStock: stock,
          gstPercent: product.gstPercent || 0,
          hsnCode: product.hsnCode || '',
        },
      ]
    })
    return true
  }

  const updateQty = (id, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, qty: Math.max(1, Math.min(i.countInStock ?? 99, qty)) } : i
      )
    )
  }

  const removeFromCart = (id) => setItems((prev) => prev.filter((i) => i._id !== id))
  const clearCart = () => setItems([])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const isMember = !!user?.isMember
    // Members: free delivery + % off items (mirrors the server-side calc).
    const memberDiscount = isMember ? Math.round(subtotal * (MEMBER_DISCOUNT_PERCENT / 100)) : 0
    const shipping = !items.length ? 0 : isMember ? 0 : calcShipping(subtotal)
    return {
      subtotal,
      shipping,
      memberDiscount,
      isMember,
      total: subtotal - memberDiscount + shipping,
    }
  }, [items, user])

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQty, removeFromCart, clearCart, totals, itemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
