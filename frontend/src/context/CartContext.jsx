import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  calcShipping,
  MEMBER_DISCOUNT_PERCENT,
  FREE_SHIPPING_THRESHOLD,
  FREE_GIFT_THRESHOLD,
} from '../lib/helpers'

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
  const [coupon, setCoupon] = useState(null) // { code, discount, description }
  const [pendingCoupon, setPendingCoupon] = useState(() => {
    try {
      return localStorage.getItem('pendingCoupon') || null
    } catch {
      return null
    }
  })
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
  const clearCoupon = () => {
    try {
      localStorage.removeItem('pendingCoupon')
    } catch {
      /* ignore */
    }
    setPendingCoupon(null)
  }
  const clearCart = () => {
    setItems([])
    setCoupon(null)
    clearCoupon()
  }

  // "Claim" a coupon from the popup/offer: remember it and auto-apply it as soon
  // as the cart qualifies (so the customer never has to type it).
  const claimCoupon = (code) => {
    const clean = (code || '').trim().toUpperCase()
    if (!clean) return
    try {
      localStorage.setItem('pendingCoupon', clean)
    } catch {
      /* ignore */
    }
    setPendingCoupon(clean)
    showToast({
      title: `Coupon ${clean} saved 🎟️`,
      subtitle: 'It applies automatically at checkout once your cart qualifies.',
      tone: 'success',
      duration: 3200,
    })
  }

  // Validate a coupon code against the current cart. Returns { ok, message }.
  const applyCoupon = async (code) => {
    const clean = (code || '').trim()
    if (!clean) return { ok: false, message: 'Enter a coupon code.' }
    try {
      const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
      const { data } = await api.post('/coupons/validate', {
        code: clean,
        subtotal,
        items: items.map((i) => ({ productId: i._id, price: i.price, qty: i.qty })),
      })
      if (data.valid) {
        setCoupon({ code: data.code, discount: data.discount, description: data.description })
        return { ok: true, message: `Coupon ${data.code} applied.` }
      }
      return { ok: false, message: data.message || 'Coupon could not be applied.' }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Coupon could not be applied.' }
    }
  }
  const removeCoupon = () => {
    setCoupon(null)
    clearCoupon() // don't let a claimed code re-apply after the user removes it
  }

  // Auto-apply a claimed (pending) coupon once the cart has items and qualifies.
  useEffect(() => {
    if (!pendingCoupon || coupon || !items.length) return
    let active = true
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    api
      .post('/coupons/validate', {
        code: pendingCoupon,
        subtotal,
        items: items.map((i) => ({ productId: i._id, price: i.price, qty: i.qty })),
      })
      .then(({ data }) => {
        if (!active) return
        if (data.valid) {
          setCoupon({ code: data.code, discount: data.discount, description: data.description })
          clearCoupon()
          showToast({
            title: `Coupon ${data.code} applied 🎉`,
            subtitle: `You saved ₹${(data.discount || 0).toLocaleString('en-IN')}.`,
            tone: 'success',
            duration: 3200,
          })
        } else if (/invalid|expired|limit|already/i.test(data.message || '')) {
          // Code itself is unusable — stop trying. (Min-order/scope: keep waiting.)
          clearCoupon()
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, pendingCoupon, coupon])

  // Re-check an applied coupon whenever the cart changes (discount may shift, or
  // it may no longer qualify). Silently drops the coupon if it becomes invalid.
  const couponCodeRef = useRef(null)
  couponCodeRef.current = coupon?.code || null
  useEffect(() => {
    const code = couponCodeRef.current
    if (!code) return
    if (!items.length) {
      setCoupon(null)
      return
    }
    let active = true
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    api
      .post('/coupons/validate', {
        code,
        subtotal,
        items: items.map((i) => ({ productId: i._id, price: i.price, qty: i.qty })),
      })
      .then(({ data }) => {
        if (!active) return
        if (data.valid) setCoupon({ code: data.code, discount: data.discount, description: data.description })
        else setCoupon(null)
      })
      .catch(() => {})
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const isMember = !!user?.isMember
    // Members: free delivery + % off items (mirrors the server-side calc).
    const memberDiscount = isMember ? Math.round(subtotal * (MEMBER_DISCOUNT_PERCENT / 100)) : 0
    const shipping = !items.length ? 0 : isMember ? 0 : calcShipping(subtotal)
    // Coupons stack on top of member/deal discounts (store policy).
    const couponDiscount = coupon ? Math.min(coupon.discount || 0, subtotal - memberDiscount) : 0
    return {
      subtotal,
      shipping,
      memberDiscount,
      couponDiscount,
      couponCode: coupon?.code || '',
      isMember,
      total: Math.max(0, subtotal - memberDiscount - couponDiscount + shipping),
    }
  }, [items, user, coupon])

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  // Celebrate when the cart crosses a reward milestone (upward only).
  const prevSubtotal = useRef(totals.subtotal)
  useEffect(() => {
    const prev = prevSubtotal.current
    const now = totals.subtotal
    const isMember = !!user?.isMember
    if (now > prev) {
      if (prev < FREE_GIFT_THRESHOLD && now >= FREE_GIFT_THRESHOLD) {
        showToast({
          title: 'Free gift unlocked! 🎁',
          subtitle: 'A free product is on us at checkout.',
          tone: 'success',
          duration: 3400,
        })
      } else if (!isMember && prev < FREE_SHIPPING_THRESHOLD && now >= FREE_SHIPPING_THRESHOLD) {
        showToast({
          title: 'Free delivery unlocked! 🎉',
          subtitle: `Add ₹${(FREE_GIFT_THRESHOLD - now).toLocaleString('en-IN')} more to get a free gift.`,
          tone: 'success',
          duration: 3400,
        })
      }
    }
    prevSubtotal.current = now
  }, [totals.subtotal, user])

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        totals,
        itemCount,
        coupon,
        applyCoupon,
        removeCoupon,
        claimCoupon,
        pendingCoupon,
      }}
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
