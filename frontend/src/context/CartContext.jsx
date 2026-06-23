import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { calcShipping } from '../lib/helpers'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product, qty = 1) => {
    const id = product._id || product.product
    setItems((prev) => {
      const existing = prev.find((i) => i._id === id)
      const stock = product.countInStock ?? 99
      if (existing) {
        return prev.map((i) =>
          i._id === id
            ? { ...i, qty: Math.min(stock, i.qty + qty) }
            : i
        )
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
        },
      ]
    })
  }

  const updateQty = (id, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i._id === id
          ? { ...i, qty: Math.max(1, Math.min(i.countInStock ?? 99, qty)) }
          : i
      )
    )
  }

  const removeFromCart = (id) => {
    setItems((prev) => prev.filter((i) => i._id !== id))
  }

  const clearCart = () => setItems([])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const shipping = items.length ? calcShipping(subtotal) : 0
    return { subtotal, shipping, total: subtotal + shipping }
  }, [items])

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  )

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
