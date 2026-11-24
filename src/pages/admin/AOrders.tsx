import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, dt, pkr } from '../../lib/format'
import { Empty, ErrorNote, Spinner, StatusBadge, useRows } from '../../components/ui'

export default function AOrders() {
  const { data, loading, error, reload } = useRows(() => supabase.from('vendor_orders').select('*, vendors(store_name), order_items(*)').order('created_at', { ascending: false }).limit(100))
  const [msg, setMsg] = useState('')
  const set = async (id: string, status: string) => {
    const { error } = await supabase.from('vendor_orders').update({ status }).eq('id', id)
    setMsg(error ? error.message : ''); reload()
  }
  if (loading) return <Spinner />
  if (error) return <ErrorNote>{error}</ErrorNote>
  if (!data.length) return <Empty>No orders yet.</Empty>
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Marking a shipment <b>delivered</b> posts the sale and commission to the vendor ledger. Do this only after courier confirmation.</p>
      {msg && <ErrorNote>{msg}</ErrorNote>}
      {data.map((o: Row) => (
        <article key={o.id} className="card text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><b>{o.order_number} • {o.vendors?.store_name}</b><StatusBadge s={o.status} /></div>
          <p className="text-xs text-gray-500">{dt(o.created_at)} • {o.ship_name}, {o.ship_phone}, {o.ship_city} • {o.courier ? `${o.courier} ${o.tracking_number}` : 'no tracking yet'}</p>
          <ul className="mt-2">{o.order_items.map((i: Row) => <li key={i.id}>{i.product_name} × {i.quantity} — {pkr(i.line_total)}</li>)}</ul>
          <p className="mt-1 text-xs text-gray-500">Subtotal {pkr(o.subtotal)} • Commission {pkr(o.commission_amount)}</p>
          <div className="mt-3 flex gap-2">
            {o.status === 'shipped' && <button onClick={() => set(o.id, 'delivered')} className="btn-red btn-sm">Mark delivered</button>}
            {!['delivered', 'cancelled'].includes(o.status) && <button onClick={() => confirm('Cancel this shipment?') && set(o.id, 'cancelled')} className="btn-red-outline btn-sm">Cancel</button>}
          </div>
        </article>
      ))}
    </div>
  )
}
