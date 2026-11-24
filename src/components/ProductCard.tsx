import { Link } from 'react-router-dom'
import { Row, pkr } from '../lib/format'
import { useCart } from '../context/CartContext'
import Icon from './Icon'

export const productImage = (p: Row) => (p.image_urls && p.image_urls[0]) || ''

export default function ProductCard({ p }: { p: Row }) {
  const { add } = useCart()
  const img = productImage(p)
  const out = p.stock < 1
  const onSale = p.sale_price != null && p.sale_price < p.price
  const pct = onSale ? Math.round((1 - p.sale_price / p.price) * 100) : 0
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-lg">
      <Link to={`/marketplace/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-peach-50">
        {img ? <img src={img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          : <span className="flex h-full items-center justify-center text-4xl text-peach-300">🛍️</span>}
        {onSale && <span className="absolute left-0 top-2 rounded-r-full bg-mred-600 px-2 py-0.5 text-[11px] font-bold text-white">-{pct}%</span>}
        {out && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-medium text-white">Out of stock</span>}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link to={`/marketplace/product/${p.slug}`} className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug text-gray-800 hover:text-mred-600">{p.name}</Link>
        <p className="mt-2 text-base font-bold text-mred-600">{pkr(onSale ? p.sale_price : p.price)}</p>
        {onSale && <p className="text-xs text-gray-400 line-through">{pkr(p.price)}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0 text-[11px] text-gray-500">
            <p className="truncate">{p.vendors?.store_name}</p>
            {p.sold_count > 0 && <p>{p.sold_count} sold</p>}
          </div>
          <button disabled={out} onClick={() => add(p.id)} aria-label={`Add ${p.name} to cart`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mred-600 text-white transition hover:bg-mred-700 disabled:bg-gray-300">
            <Icon name="cart" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4'
