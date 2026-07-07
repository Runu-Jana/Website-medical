import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FaCheckCircle, FaShoppingCart } from 'react-icons/fa'
import api from '../lib/api'
import { useAuth } from './AuthContext'
import { calcShipping } from '../lib/helpers'

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
  const [items, setItems] = useState(loadLocal)
  const [toast, setToast] = useState(null) // { name, thumbnail } for the "added to cart" popup
  const prevUser = useRef(null)
  const saveTimer = useRef(null)
  const toastTimer = useRef(null)

  // Show the "added to cart" popup, auto-dismissing after a moment.
  const showAddedToast = (product) => {
    setToast({
      name: product.name,
      thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
    })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }
  useEffect(() => () => clearTimeout(toastTimer.current), [])

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

  const addToCart = (product, qty = 1) => {
    const id = product._id || product.product
    showAddedToast(product)
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
          qty: Math.min(stock, qty),
          unit: product.unit || '',
          countInStock: stock,
          gstPercent: product.gstPercent || 0,
          hsnCode: product.hsnCode || '',
        },
      ]
    })
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
    const shipping = items.length ? calcShipping(subtotal) : 0
    return { subtotal, shipping, total: subtotal + shipping }
  }, [items])

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQty, removeFromCart, clearCart, totals, itemCount }}
    >
      {children}
      <CartToast toast={toast} onClose={() => setToast(null)} />
    </CartContext.Provider>
  )
}

// Small "Added to cart" popup shown whenever addToCart runs.
function CartToast({ toast, onClose }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:inset-x-auto sm:right-5 sm:top-24 sm:justify-end"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3 pr-4 shadow-lift transition-all duration-300 ${
          toast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
        }`}
        role="status"
      >
        {toast && (
          <>
            {toast.thumbnail ? (
              <img
                src={toast.thumbnail}
                alt=""
                className="h-11 w-11 shrink-0 rounded-lg border border-bordergray object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FaShoppingCart size={18} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
                <FaCheckCircle size={14} /> Added to cart
              </p>
              <p className="truncate text-xs text-slate-500">{toast.name}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Dismiss"
              className="shrink-0 text-slate-300 transition hover:text-slate-500"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
