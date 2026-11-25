import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, dt, pkr } from '../../lib/format'
import { StatusBadge, useRows } from '../../components/ui'
import Icon from '../../components/Icon'
import { EmptyState, Notice, PageLoading } from '../vendor/dashboard/parts'
import { Chips, SearchInput, Stat } from './bits'

const FILTERS: [string, string][] = [['all', 'All'], ['new', 'New'], ['accepted', 'Accepted'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']]

export default function AOrders() {
  const { data, loading, error, reload } = useRows(() => supabase.from('vendor_orders').select('*, vendors(store_name), order_items(*)').order('created_at', { ascending: false }).limit(100))
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const set = async (id: string, status: string) => {
    const { error } = await supabase.from('vendor_orders').update({ status }).eq('id', id)
    setMsg(error ? error.message : ''); reload()
  }
  if (loading) return <PageLoading />
  if (error) return <Notice tone="red">{error}</Notice>
  if (!data.length) return <EmptyState icon="truck" title="No orders yet" text="Vendor orders will appear here as customers check out." />

  const n = (s: string) => (s === 'all' ? data.length : data.filter((o: Row) => o.status === s).length)
  const shown = data.filter((o: Row) => (filter === 'all' || o.status === filter) && `${o.order_number} ${o.vendors?.store_name ?? ''} ${o.ship_name ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const gmv = data.filter((o: Row) => o.status === 'delivered').reduce((s: number, o: Row) => s + Number(o.subtotal), 0)

  return (
    <div className="space-y-5">
      <Notice tone="blue">Marking a shipment <b>delivered</b> posts the sale and commission to the vendor ledger. Do this only after courier confirmation.</Notice>
      {msg && <Notice tone="red">{msg}</Notice>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="New" value={n('new')} icon="bell" tone="amber" />
        <Stat label="In progress" value={n('accepted') + n('processing')} icon="clock" tone="blue" />
        <Stat label="Shipped" value={n('shipped')} icon="truck" tone="blue" />
        <Stat label="Delivered value" value={pkr(gmv)} icon="check" tone="green" />
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips value={filter} onChange={setFilter} items={FILTERS.map(([k, l]) => [k, l, n(k)])} />
        <SearchInput value={q} onChange={setQ} placeholder="Order, store or customer" />
      </div>
      {!shown.length ? <EmptyState icon="search" title="No orders found" text="Try a different filter or search term." /> : (
        <div className="space-y-4">
          {shown.map((o: Row) => (
            <article key={o.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
                <div><p className="font-sans text-[15px] font-bold text-ink">{o.order_number} <span className="font-normal text-gray-400">•</span> {o.vendors?.store_name}</p><p className="text-xs text-gray-500">{dt(o.created_at)}</p></div>
                <StatusBadge s={o.status} />
              </header>
              <div className="grid gap-5 p-5 lg:grid-cols-5">
                <ul className="space-y-3 lg:col-span-3">
                  {o.order_items.map((i: Row) => (
                    <li key={i.id} className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-peach-50">{i.image_url && <img src={i.image_url} alt="" className="h-full w-full object-cover" />}</div>
                      <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{i.product_name}</p><p className="text-xs text-gray-500">Qty {i.quantity}</p></div>
                      <span className="font-semibold">{pkr(i.line_total)}</span>
                    </li>))}
                </ul>
                <div className="space-y-3 lg:col-span-2">
                  <div className="rounded-xl bg-gray-50 p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Deliver to</p>
                    <p className="mt-1 font-semibold text-ink">{o.ship_name}</p><p className="text-gray-600">{o.ship_phone} • {o.ship_city}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500"><Icon name="truck" className="h-3.5 w-3.5" />{o.courier ? `${o.courier} • ${o.tracking_number}` : 'No tracking yet'}</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600"><span>Subtotal {pkr(o.subtotal)}</span><span>Commission {pkr(o.commission_amount)}</span></div>
                </div>
              </div>
              {(o.status === 'shipped' || !['delivered', 'cancelled'].includes(o.status)) && (
                <footer className="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-3">
                  {o.status === 'shipped' && <button onClick={() => set(o.id, 'delivered')} className="btn-red btn-sm !py-2">Mark delivered</button>}
                  {!['delivered', 'cancelled'].includes(o.status) && <button onClick={() => confirm('Cancel this shipment?') && set(o.id, 'cancelled')} className="btn-red-outline btn-sm !py-2">Cancel</button>}
                </footer>)}
            </article>))}
        </div>
      )}
    </div>
  )
}
