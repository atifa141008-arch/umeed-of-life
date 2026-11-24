import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../context/CartContext'
import { Row, pkr } from '../../lib/format'
import { Empty, Spinner, useRows } from '../../components/ui'
import { productImage } from '../../components/ProductCard'

export function useCartDetails() {
  const { lines } = useCart()
  const ids = lines.map((l) => l.id)
  const { data, loading } = useRows(() => ids.length ? supabase.from('products').select('*, vendors(id,store_name)').in('id', ids) : Promise.resolve({ data: [], error: null }), [ids.join(',')])
  const settings = useRows(() => supabase.from('platform_settings').select('*').eq('key', 'delivery_fee_per_vendor'))
  const fee = Number(settings.data[0]?.value ?? 0)
  const items = lines.map((l) => ({ ...l, p: data.find((p: Row) => p.id === l.id) as Row | undefined })).filter((x) => x.p && x.p.status === 'approved')
  const subtotal = items.reduce((s, x) => s + (x.p!.sale_price ?? x.p!.price) * x.qty, 0)
  const vendorCount = new Set(items.map((x) => x.p!.vendors?.id)).size
  const delivery = vendorCount * fee
  return { items, loading, subtotal, delivery, total: subtotal + delivery, vendorCount }
}

export default function Cart() {
  const { setQty, remove, lines } = useCart()
  const { items, loading, subtotal, delivery, total } = useCartDetails()
  if (!lines.length) return <div className="mx-auto max-w-3xl px-5 py-16"><Empty>Your cart is empty. <Link to="/marketplace/shop" className="font-semibold text-mred-600">Start shopping</Link></Empty></div>
  if (loading) return <Spinner />
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <h1 className="text-3xl font-bold">Your cart</h1>
        {items.map(({ id, qty, p }) => (
          <div key={id} className="card flex gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-peach-50">{productImage(p!) && <img src={productImage(p!)} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex-1">
              <Link to={`/marketplace/product/${p!.slug}`} className="font-semibold hover:text-mred-600">{p!.name}</Link>
              <p className="text-xs text-gray-500">{p!.vendors?.store_name}</p>
              <p className="mt-1 text-sm font-bold text-mred-700">{pkr(p!.sale_price ?? p!.price)}</p>
              {p!.stock < qty && <p className="text-xs text-red-700">Only {p!.stock} in stock</p>}
              <div className="mt-2 flex items-center gap-3">
                <input type="number" min={1} max={p!.stock} value={qty} onChange={(e) => setQty(id, Number(e.target.value))} className="input !w-20 !py-1" aria-label="Quantity" />
                <button onClick={() => remove(id)} className="text-xs text-gray-500 hover:text-mred-600">Remove</button>
              </div>
            </div>
          </div>
        ))}
        {items.length < lines.length && <p className="text-sm text-amber-700">Some items are no longer available and were left out.</p>}
      </div>
      <aside className="card h-fit space-y-2 text-sm">
        <h2 className="text-lg font-bold">Summary</h2>
        <p className="flex justify-between"><span>Subtotal</span><span>{pkr(subtotal)}</span></p>
        <p className="flex justify-between"><span>Delivery</span><span>{pkr(delivery)}</span></p>
        <p className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{pkr(total)}</span></p>
        <p className="text-xs text-gray-500">Delivery is charged per store shipment. Final totals are confirmed by the server when you place the order.</p>
        <Link to="/marketplace/checkout" className="btn-red w-full">Checkout</Link>
      </aside>
    </div>
  )
}
