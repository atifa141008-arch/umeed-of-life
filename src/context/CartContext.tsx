import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Line = { id: string; qty: number }
type CartState = {
  lines: Line[]; count: number
  add: (id: string, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}
const KEY = 'umeed_cart_v1'
const CartContext = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(lines)) } catch { /* ignore */ } }, [lines])

  const add = (id: string, qty = 1) =>
    setLines((l) => l.some((x) => x.id === id) ? l.map((x) => (x.id === id ? { ...x, qty: Math.min(x.qty + qty, 50) } : x)) : [...l, { id, qty }])
  const setQty = (id: string, qty: number) =>
    setLines((l) => l.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(qty, 50)) } : x)))
  const remove = (id: string) => setLines((l) => l.filter((x) => x.id !== id))
  const clear = () => setLines([])

  return (
    <CartContext.Provider value={{ lines, count: lines.reduce((n, l) => n + l.qty, 0), add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  )
}
export function useCart() {
  const c = useContext(CartContext)
  if (!c) throw new Error('useCart must be used inside CartProvider')
  return c
}
