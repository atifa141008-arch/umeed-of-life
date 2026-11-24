import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../context/CartContext'
import { pkr } from '../../lib/format'
import { Empty, Spinner, useRows } from '../../components/ui'

export default function Product() {
  const { slug } = useParams()
  const { add } = useCart()
  const navigate = useNavigate()
  const { data, loading } = useRows(() => supabase.from('products').select('*, vendors(id,store_name,slug,support_contact), categories(name,slug)').eq('slug', slug ?? '').eq('status', 'approved').limit(1), [slug])
  const [img, setImg] = useState(0)
  const [qty, setQty] = useState(1)
  if (loading) return <Spinner />
  const p = data[0]
  if (!p) return <div className="mx-auto max-w-6xl px-5 py-16"><Empty>This product is not available.</Empty></div>
  const imgs: string[] = p.image_urls ?? []
  const onSale = p.sale_price != null && p.sale_price < p.price
  const out = p.stock < 1

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-peach-50">
          {imgs[img] ? <img src={imgs[img]} alt={p.name} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-6xl text-peach-300">🛍️</span>}
        </div>
        {imgs.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto">
          {imgs.map((u, i) => <button key={u} onClick={() => setImg(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === img ? 'border-mred-600' : 'border-transparent'}`}><img src={u} alt="" className="h-full w-full object-cover" /></button>)}
        </div>}
      </div>
      <div>
        {p.categories && <Link to={`/marketplace/shop?category=${p.categories.slug}`} className="text-sm text-mred-600">{p.categories.name}</Link>}
        <h1 className="mt-1 text-3xl font-bold">{p.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Sold by <Link to={`/marketplace/shop?vendor=${p.vendors?.id}`} className="font-semibold text-ink hover:text-mred-600">{p.vendors?.store_name}</Link></p>
        <p className="mt-4 text-3xl font-bold text-mred-700">{pkr(onSale ? p.sale_price : p.price)}
          {onSale && <span className="ml-3 text-base font-normal text-gray-400 line-through">{pkr(p.price)}</span>}</p>
        <p className={`mt-2 text-sm font-medium ${out ? 'text-red-700' : 'text-green-700'}`}>{out ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock'}</p>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{p.description}</p>
        <div className="mt-6 flex items-center gap-3">
          <input type="number" min={1} max={Math.max(1, p.stock)} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="input !w-20" aria-label="Quantity" />
          <button disabled={out} onClick={() => add(p.id, qty)} className="btn-red">Add to cart</button>
          <button disabled={out} onClick={() => { add(p.id, qty); navigate('/marketplace/cart') }} className="btn-red-outline">Buy now</button>
        </div>
        <div className="mt-8 space-y-2 rounded-2xl bg-peach-50 p-5 text-sm text-gray-700">
          <p><b>Delivery:</b> delivery charges are shown at checkout.</p>
          <p><b>Returns:</b> see our <Link to="/marketplace/returns" className="text-mred-600 underline">return policy</Link> before ordering.</p>
          {p.sku && <p><b>SKU:</b> {p.sku}</p>}
        </div>
      </div>
    </div>
  )
}
