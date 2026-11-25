import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Row, dt, pkr } from '../../../lib/format'
import { StatusBadge, useRows } from '../../../components/ui'
import Icon from '../../../components/Icon'
import { EmptyState, Notice, PageHeader, PageLoading } from './parts'

const STEPS = ['new', 'accepted', 'processing', 'shipped', 'delivered']
const FILTERS = [['all', 'All'], ['new', 'New'], ['accepted', 'Accepted'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']]

function Stepper({ status }: { status: string }) {
  if (status === 'cancelled') return null
  const at = Math.max(STEPS.indexOf(status), 0)
  return (
    <ol className="mt-4 flex items-center" aria-label="Order progress">
      {STEPS.map((s, i) => (
        <li key={s} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
          <span className="flex flex-col items-center gap-1">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${i <= at ? 'bg-mred-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {i < at ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className={`hidden text-[10px] font-medium capitalize sm:block ${i <= at ? 'text-ink' : 'text-gray-400'}`}>{s}</span>
          </span>
          {i < STEPS.length - 1 && <span className={`mx-1 mb-0 h-0.5 flex-1 rounded sm:mb-4 ${i < at ? 'bg-mred-600' : 'bg-gray-100'}`} />}
        </li>
      ))}
    </ol>
  )
}

export default function VOrders() {
  const { data, loading, error, reload } = useRows(() => supabase.from('vendor_orders').select('*, order_items(*)').order('created_at', { ascending: false }))
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')
  const [ship, setShip] = useState<Record<string, { courier: string; tracking: string }>>({})

  const update = async (id: string, patch: Row) => {
    const { error } = await supabase.from('vendor_orders').update(patch).eq('id', id)
    setMsg(error ? error.message : ''); reload()
  }
  const countOf = (f: string) => (f === 'all' ? data.length : data.filter((o: Row) => o.status === f).length)

  if (loading) return <PageLoading />
  if (error) return <Notice tone="red">{error}</Notice>
  const shown = filter === 'all' ? data : data.filter((o: Row) => o.status === filter)

  return (
    <div>
      <PageHeader title="Orders" subtitle="Accept, process and ship the orders placed on your products." />
      {msg && <div className="mb-4"><Notice tone="red">{msg}</Notice></div>}
      {!data.length ? <EmptyState icon="bag" title="No orders yet" text="When a customer orders one of your products it will appear here." /> : (
        <>
          <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
            {FILTERS.map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${filter === k ? 'bg-mred-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
                {l}<span className={`rounded-full px-1.5 text-[11px] ${filter === k ? 'bg-white/25' : 'bg-gray-100 text-gray-500'}`}>{countOf(k)}</span>
              </button>))}
          </div>
          {!shown.length && <EmptyState icon="list" title="Nothing here" text="No orders match this filter." />}
          <div className="space-y-4">
            {shown.map((o: Row) => {
              const s = ship[o.id] ?? { courier: '', tracking: '' }
              return (
                <article key={o.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
                    <div><p className="font-sans text-[15px] font-bold text-ink">{o.order_number}</p><p className="text-xs text-gray-500">{dt(o.created_at)}</p></div>
                    <StatusBadge s={o.status} />
                  </header>
                  <div className="px-5 pb-5 pt-1">
                    <Stepper status={o.status} />
                    <div className="mt-5 grid gap-5 lg:grid-cols-5">
                      <ul className="space-y-3 lg:col-span-3">
                        {o.order_items.map((i: Row) => (
                          <li key={i.id} className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-peach-50">{i.image_url && <img src={i.image_url} alt="" className="h-full w-full object-cover" />}</div>
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{i.product_name}</p><p className="text-xs text-gray-500">Qty {i.quantity} × {pkr(i.unit_price)}</p></div>
                            <p className="text-sm font-semibold">{pkr(i.line_total)}</p>
                          </li>))}
                      </ul>
                      <div className="space-y-3 lg:col-span-2">
                        <div className="rounded-xl bg-gray-50 p-3.5 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Deliver to</p>
                          <p className="mt-1 font-semibold text-ink">{o.ship_name}</p>
                          <p className="text-gray-600">{o.ship_phone}</p><p className="text-gray-600">{o.ship_address}, {o.ship_city}</p>
                        </div>
                        <dl className="space-y-1 text-sm">
                          <div className="flex justify-between text-gray-600"><dt>Subtotal</dt><dd>{pkr(o.subtotal)}</dd></div>
                          <div className="flex justify-between text-gray-600"><dt>Commission ({o.commission_rate}%)</dt><dd>− {pkr(o.commission_amount)}</dd></div>
                          <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold text-ink"><dt>You receive</dt><dd>{pkr(o.vendor_payable)}</dd></div>
                        </dl>
                      </div>
                    </div>

                    {(['new', 'accepted', 'processing'].includes(o.status) || o.status === 'shipped') && (
                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                        {o.status === 'new' && <button onClick={() => update(o.id, { status: 'accepted' })} className="btn-red btn-sm !py-2">Accept order</button>}
                        {o.status === 'accepted' && <button onClick={() => update(o.id, { status: 'processing' })} className="btn-red btn-sm !py-2">Start processing</button>}
                        {o.status === 'processing' && (
                          <>
                            <input aria-label="Courier" placeholder="Courier" value={s.courier} onChange={(e) => setShip({ ...ship, [o.id]: { ...s, courier: e.target.value } })} className="input !w-36 !py-2" />
                            <input aria-label="Tracking number" placeholder="Tracking no." value={s.tracking} onChange={(e) => setShip({ ...ship, [o.id]: { ...s, tracking: e.target.value } })} className="input !w-44 !py-2" />
                            <button disabled={!s.courier || !s.tracking} onClick={() => update(o.id, { status: 'shipped', courier: s.courier, tracking_number: s.tracking })} className="btn-red btn-sm !py-2">Mark shipped</button>
                          </>
                        )}
                        {['new', 'accepted'].includes(o.status) && <button onClick={() => confirm('Cancel this order?') && update(o.id, { status: 'cancelled' })} className="btn-red-outline btn-sm !py-2">Cancel order</button>}
                        {o.status === 'shipped' && <p className="flex items-center gap-2 text-xs text-gray-500"><Icon name="truck" className="h-4 w-4" />{o.courier} • {o.tracking_number} — delivery is confirmed by the marketplace team.</p>}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
