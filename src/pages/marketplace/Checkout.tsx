import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { pkr } from '../../lib/format'
import { useCartDetails } from './Cart'
import { Empty, ErrorNote, Spinner } from '../../components/ui'

export default function Checkout() {
  const { profile } = useAuth()
  const { lines, clear } = useCart()
  const { items, loading, subtotal, delivery, total } = useCartDetails()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  if (!items.length) return <div className="mx-auto max-w-3xl px-5 py-16"><Empty>Your cart is empty. <Link to="/marketplace/shop" className="font-semibold text-mred-600">Go to shop</Link></Empty></div>

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setBusy(true); setError('')
    const { data, error } = await supabase.rpc('place_order', {
      p_items: lines.map((l) => ({ id: l.id, qty: l.qty })),
      p_ship: { name: f.name, phone: f.phone, address: f.address, city: f.city, notes: f.notes },
    })
    setBusy(false)
    if (error) return setError(error.message)
    clear()
    navigate('/marketplace/account', { state: { placed: data } })
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-3">
      <form onSubmit={submit} className="space-y-4 lg:col-span-2">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Full name<input name="name" required defaultValue={profile?.full_name ?? ''} className="input mt-1" /></label>
          <label className="block text-sm font-medium">Phone<input name="phone" required defaultValue={profile?.phone ?? ''} className="input mt-1" /></label>
          <label className="block text-sm font-medium sm:col-span-2">Delivery address<input name="address" required defaultValue={profile?.address ?? ''} className="input mt-1" /></label>
          <label className="block text-sm font-medium">City<input name="city" required defaultValue={profile?.city ?? ''} className="input mt-1" /></label>
          <label className="block text-sm font-medium">Order notes (optional)<input name="notes" className="input mt-1" /></label>
        </div>
        <div className="card text-sm"><b>Payment:</b> Cash on Delivery. Online payment options will be added here when available.</div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button className="btn-red" disabled={busy}>{busy ? 'Placing order…' : `Place order • ${pkr(total)}`}</button>
      </form>
      <aside className="card h-fit space-y-2 text-sm">
        <h2 className="text-lg font-bold">Order summary</h2>
        {items.map(({ id, qty, p }) => <p key={id} className="flex justify-between gap-3"><span>{p!.name} × {qty}</span><span>{pkr((p!.sale_price ?? p!.price) * qty)}</span></p>)}
        <p className="flex justify-between border-t pt-2"><span>Subtotal</span><span>{pkr(subtotal)}</span></p>
        <p className="flex justify-between"><span>Delivery</span><span>{pkr(delivery)}</span></p>
        <p className="flex justify-between text-base font-bold"><span>Total</span><span>{pkr(total)}</span></p>
      </aside>
    </div>
  )
}
