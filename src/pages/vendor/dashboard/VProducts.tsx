import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useMyVendor } from '../../../lib/useMyVendor'
import { Row, pkr } from '../../../lib/format'
import { StatusBadge, useRows } from '../../../components/ui'
import Icon from '../../../components/Icon'
import ProductEditor from './ProductEditor'
import { EmptyState, Notice, PageHeader, PageLoading } from './parts'

const FILTERS = [['all', 'All'], ['approved', 'Live'], ['pending_review', 'In review'], ['draft', 'Drafts'], ['rejected', 'Rejected'], ['disabled', 'Disabled']]

export default function VProducts() {
  const { vendor } = useMyVendor()
  const [params, setParams] = useSearchParams()
  const prods = useRows(() => supabase.from('products').select('*').order('created_at', { ascending: false }))
  const cats = useRows(() => supabase.from('categories').select('id,name').eq('active', true).order('sort_order'))
  // variants table may not exist until supabase/variants.sql is run — the list still works without it
  const vars = useRows(() => supabase.from('product_variants').select('product_id,price,sale_price,stock'))
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [flash, setFlash] = useState('')

  useEffect(() => { if (params.get('new')) { setEditing('new'); setParams({}, { replace: true }) } }, [params, setParams])

  const byProduct = useMemo(() => {
    const m: Record<string, Row[]> = {}
    if (!vars.error) vars.data.forEach((v: Row) => { (m[v.product_id] ??= []).push(v) })
    return m
  }, [vars.data, vars.error])

  const del = async (p: Row) => {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    setFlash(error ? error.message : 'Product deleted'); prods.reload(); vars.reload()
  }
  const close = (changed: boolean) => { setEditing(null); if (changed) { setFlash('Product saved'); prods.reload(); vars.reload() } window.scrollTo(0, 0) }

  if (editing) {
    if (!vendor) return <PageLoading />
    return <ProductEditor key={editing === 'new' ? 'new' : editing.id} product={editing === 'new' ? null : editing} vendorId={vendor.id} categories={cats.data} onClose={close} />
  }

  const shown = prods.data.filter((p: Row) => (filter === 'all' || p.status === filter) && p.name.toLowerCase().includes(q.trim().toLowerCase()))
  const countOf = (f: string) => (f === 'all' ? prods.data.length : prods.data.filter((p: Row) => p.status === f).length)
  const catName = (id: string) => cats.data.find((c: Row) => c.id === id)?.name

  const priceOf = (p: Row) => {
    const vs = byProduct[p.id]
    if (!vs?.length) return <span className="font-semibold">{pkr(p.sale_price ?? p.price)}</span>
    const e = vs.map((v) => Number(v.sale_price ?? v.price)); const lo = Math.min(...e), hi = Math.max(...e)
    return <span className="font-semibold">{lo === hi ? pkr(lo) : `${pkr(lo)} – ${pkr(hi)}`}</span>
  }

  if (prods.loading && !prods.data.length) return <PageLoading />
  return (
    <div>
      <PageHeader title="Products" subtitle="Create listings, manage variants, prices and stock."
        actions={<button onClick={() => setEditing('new')} className="btn-red btn-sm !py-2.5"><Icon name="plus" className="mr-1.5 h-4 w-4" />Add product</button>} />
      {flash && <div className="mb-4"><Notice tone="green">{flash}</Notice></div>}
      {prods.error && <div className="mb-4"><Notice tone="red">{prods.error}</Notice></div>}

      {!prods.data.length ? (
        <EmptyState icon="package" title="Add your first product" text="Create a listing with photos, pricing and variants, then submit it for review."
          action={<button onClick={() => setEditing('new')} className="btn-red"><Icon name="plus" className="mr-1.5 h-4 w-4" />Add product</button>} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {FILTERS.filter(([k]) => k === 'all' || countOf(k) > 0).map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${filter === k ? 'bg-mred-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
                  {l}<span className={`rounded-full px-1.5 text-[11px] ${filter === k ? 'bg-white/25' : 'bg-gray-100 text-gray-500'}`}>{countOf(k)}</span></button>))}
            </div>
            <div className="relative lg:w-64"><Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className="input !rounded-full !py-2.5 !pl-10" /></div>
          </div>

          {!shown.length ? <EmptyState icon="search" title="No products found" text="Try a different filter or search term." /> : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="th pl-5">Product</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Status</th><th className="th pr-5" /></tr></thead>
                <tbody>{shown.map((p: Row) => {
                  const n = byProduct[p.id]?.length ?? 0
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="td pl-5"><div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-peach-50 ring-1 ring-gray-100">{p.image_urls?.[0] && <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" />}</div>
                        <div className="min-w-0"><p className="max-w-[16rem] truncate font-semibold text-ink">{p.name}</p>
                          <p className="text-xs text-gray-400">{[catName(p.category_id), n ? `${n} variants` : p.sku].filter(Boolean).join(' • ') || 'Simple product'}</p></div></div></td>
                      <td className="td whitespace-nowrap">{priceOf(p)}{!n && p.sale_price != null && <p className="text-xs text-gray-400 line-through">{pkr(p.price)}</p>}</td>
                      <td className="td"><span className={p.stock === 0 ? 'font-semibold text-red-700' : p.stock <= 5 ? 'font-semibold text-amber-700' : ''}>{p.stock === 0 ? 'Out of stock' : p.stock}</span></td>
                      <td className="td"><StatusBadge s={p.status} />{p.rejection_note && <p className="mt-1 max-w-[14rem] text-xs text-red-700">{p.rejection_note}</p>}</td>
                      <td className="td whitespace-nowrap pr-5 text-right">
                        <button onClick={() => setEditing(p)} className="btn-red-outline btn-sm"><Icon name="edit" className="mr-1 h-3.5 w-3.5" />Edit</button>
                        {['draft', 'rejected'].includes(p.status) && <button onClick={() => del(p)} aria-label={`Delete ${p.name}`} className="ml-1 inline-grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-red-50 hover:text-mred-600"><Icon name="trash" className="h-4 w-4" /></button>}
                      </td>
                    </tr>)
                })}</tbody></table></div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
