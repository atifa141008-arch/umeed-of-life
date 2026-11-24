import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Row, dt, pkr } from '../../../lib/format'
import { Empty, ErrorNote, Spinner, StatusBadge, useRows } from '../../../components/ui'

export default function VOrders() {
  const { data, loading, error, reload } = useRows(() => supabase.from('vendor_orders').select('*, order_items(*)').order('created_at', { ascending: false }))
  const [msg, setMsg] = useState('')
  const [ship, setShip] = useState<Record<string, { courier: string; tracking: string }>>({})

  const update = async (id: string, patch: Row) => {
    const { error } = await supabase.from('vendor_orders').update(patch).eq('id', id)
    setMsg(error ? error.message : ''); reload()
  }
  if (loading) return <Spinner />
  if (error) return <ErrorNote>{error}</ErrorNote>
  if (!data.length) return <Empty>No orders yet.</Empty>
  return (
    <div className="space-y-4">
      {msg && <ErrorNote>{msg}</ErrorNote>}
      {data.map((o: Row) => {
        const s = ship[o.id] ?? { courier: '', tracking: '' }
        return (
          <article key={o.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{o.order_number}</p><StatusBadge s={o.status} /></div>
            <p className="text-xs text-gray-500">{dt(o.created_at)} • Deliver to {o.ship_name}, {o.ship_phone}, {o.ship_address}, {o.ship_city}</p>
            <ul className="mt-3 space-y-1 text-sm">{o.order_items.map((i: Row) => <li key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{pkr(i.line_total)}</span></li>)}</ul>
            <p className="mt-2 text-xs text-gray-500">Subtotal {pkr(o.subtotal)} • Commission {o.commission_rate}% ({pkr(o.commission_amount)}) • You receive {pkr(o.vendor_payable)} after delivery</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {o.status === 'new' && <button onClick={() => update(o.id, { status: 'accepted' })} className="btn-red btn-sm">Accept</button>}
              {o.status === 'accepted' && <button onClick={() => update(o.id, { status: 'processing' })} className="btn-red btn-sm">Start processing</button>}
              {o.status === 'processing' && (
                <>
                  <input placeholder="Courier" value={s.courier} onChange={(e) => setShip({ ...ship, [o.id]: { ...s, courier: e.target.value } })} className="input !w-32 !py-1.5" />
                  <input placeholder="Tracking no." value={s.tracking} onChange={(e) => setShip({ ...ship, [o.id]: { ...s, tracking: e.target.value } })} className="input !w-40 !py-1.5" />
                  <button disabled={!s.courier || !s.tracking} onClick={() => update(o.id, { status: 'shipped', courier: s.courier, tracking_number: s.tracking })} className="btn-red btn-sm">Mark shipped</button>
                </>
              )}
              {['new', 'accepted'].includes(o.status) && <button onClick={() => confirm('Cancel this order?') && update(o.id, { status: 'cancelled' })} className="btn-red-outline btn-sm">Cancel</button>}
              {o.status === 'shipped' && <span className="text-xs text-gray-500">{o.courier} • {o.tracking_number} — delivery is confirmed by the marketplace team.</span>}
            </div>
          </article>
        )
      })}
    </div>
  )
}
