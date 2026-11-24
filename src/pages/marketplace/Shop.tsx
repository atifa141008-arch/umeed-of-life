import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { defaultCategories } from '../../data/market'
import ProductGrid from '../../components/ProductGrid'
import { useRows } from '../../components/ui'

export default function Shop() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const category = sp.get('category') ?? ''
  const vendor = sp.get('vendor') ?? ''
  const sort = sp.get('sort') ?? 'new'

  const cats = useRows(() => supabase.from('categories').select('id,slug,name').eq('active', true).order('sort_order'))
  const catId = cats.data.find((c: Row) => c.slug === category)?.id
  const catList: Row[] = cats.data.length ? cats.data : defaultCategories
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  // wait for category ids before querying a category, so we never flash the wrong list
  const waiting = !!category && cats.loading

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <h1 className="text-xl font-bold md:text-3xl">{q ? `Results for “${q}”` : category ? catList.find((c) => c.slug === category)?.name ?? 'Shop' : 'Shop'}</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search products" className="input" />
          <select value={category} onChange={(e) => set('category', e.target.value)} className="input">
            <option value="">All categories</option>
            {catList.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => set('sort', e.target.value)} className="input">
            <option value="new">Newest</option><option value="best">Best selling</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
          </select>
        </div>
        {vendor && <button onClick={() => set('vendor', '')} className="mt-3 text-sm text-mred-600">✕ Showing one store — clear</button>}
        <div className="mt-6"><ProductGrid q={q} catId={catId} vendor={vendor || undefined} sort={sort} hold={waiting} /></div>
      </div>
    </div>
  )
}
