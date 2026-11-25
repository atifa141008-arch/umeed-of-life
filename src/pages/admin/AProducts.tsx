import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, pkr } from '../../lib/format'
import { StatusBadge, useRows } from '../../components/ui'
import Icon from '../../components/Icon'
import { EmptyState, Notice, PageLoading } from '../vendor/dashboard/parts'
import { Chips, SearchInput } from './bits'

const FILTERS: [string, string][] = [['pending_review', 'Pending review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['disabled', 'Disabled'], ['', 'All']]

export default function AProducts() {
  const [status, setStatus] = useState('pending_review')
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useRows(() => {
    let query = supabase.from('products').select('*, vendors(store_name), categories(name)').order('created_at', { ascending: false }).limit(100)
    if (status) query = query.eq('status', status)
    return query
  }, [status])
  const [msg, setMsg] = useState('')
  // variants are optional (supabase/variants.sql) — failures are ignored
  const vars = useRows(() => supabase.from('product_variants').select('product_id,name,price,sale_price,stock').order('position'))
  const variantsOf = (id: string) => (vars.error ? [] : vars.data.filter((v: Row) => v.product_id === id))

  const moderate = async (p: Row, to: string) => {
    let note = ''
    if (to !== 'approved') { note = prompt(to === 'rejected' ? 'Reason for rejection (shown to vendor):' : 'Reason for disabling:') ?? ''; if (!note) return }
    const { error } = await supabase.rpc('moderate_product', { p_id: p.id, p_status: to, p_note: note })
    setMsg(error ? error.message : ''); reload()
  }
  const feature = async (p: Row) => { await supabase.from('products').update({ is_featured: !p.is_featured }).eq('id', p.id); reload() }
  const shown = data.filter((p: Row) => `${p.name} ${p.vendors?.store_name ?? ''}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips value={status} onChange={setStatus} items={FILTERS.map(([k, l]) => [k, l])} />
        <SearchInput value={q} onChange={setQ} placeholder="Search product or store" />
      </div>
      {msg && <Notice tone="red">{msg}</Notice>}
      {loading ? <PageLoading /> : error ? <Notice tone="red">{error}</Notice> : !shown.length ? <EmptyState icon="package" title="No products in this view" text={status === 'pending_review' ? 'Nothing is waiting for review right now.' : 'Try another filter or search.'} /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {shown.map((p: Row) => {
            const vs = variantsOf(p.id)
            const eff = vs.map((v: Row) => Number(v.sale_price ?? v.price))
            return (
              <article key={p.id} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-peach-50 ring-1 ring-gray-100">
                  {p.image_urls?.[0] ? <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-gray-300"><Icon name="image" className="h-8 w-8" /></span>}
                  {p.is_featured && <span className="absolute left-1.5 top-1.5 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-brand-900">Featured</span>}
                </div>
                <div className="flex min-w-0 flex-1 flex-col text-sm">
                  <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 font-sans text-[15px] font-bold text-ink">{p.name}</p><StatusBadge s={p.status} /></div>
                  <p className="mt-0.5 text-xs text-gray-500">{p.vendors?.store_name} • {p.categories?.name ?? 'No category'}</p>
                  <p className="mt-1.5 font-semibold text-ink">
                    {vs.length ? (Math.min(...eff) === Math.max(...eff) ? pkr(eff[0]) : `${pkr(Math.min(...eff))} – ${pkr(Math.max(...eff))}`) : pkr(p.sale_price ?? p.price)}
                    <span className="ml-2 text-xs font-normal text-gray-500">{vs.length ? `${vs.length} variants • ` : ''}stock {p.stock}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-600">{p.description}</p>
                  {p.rejection_note && <p className="mt-1 text-xs text-red-700">Note: {p.rejection_note}</p>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    {p.status !== 'approved' && <button onClick={() => moderate(p, 'approved')} className="btn-red btn-sm">Approve</button>}
                    {p.status === 'pending_review' && <button onClick={() => moderate(p, 'rejected')} className="btn-red-outline btn-sm">Reject</button>}
                    {p.status === 'approved' && <><button onClick={() => feature(p)} className="btn-peach btn-sm">{p.is_featured ? 'Unfeature' : 'Feature'}</button><button onClick={() => moderate(p, 'disabled')} className="btn-red-outline btn-sm">Disable</button></>}
                  </div>
                </div>
              </article>)
          })}
        </div>
      )}
    </div>
  )
}
