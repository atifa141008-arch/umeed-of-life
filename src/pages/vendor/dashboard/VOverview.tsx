import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { Row, pkr } from '../../../lib/format'
import { StatusBadge, useRows } from '../../../components/ui'
import Icon from '../../../components/Icon'
import { useMyVendor } from '../../../lib/useMyVendor'
import { EmptyState, Kpi, Notice, PageHeader, PageLoading, Panel, shortDate } from './parts'

const DAYS = 7

export default function VOverview() {
  const { vendor } = useMyVendor()
  const prods = useRows(() => supabase.from('products').select('id,name,status,stock,image_urls'))
  const orders = useRows(() => supabase.from('vendor_orders').select('id,order_number,status,created_at,vendor_payable').order('created_at', { ascending: false }))
  const ledger = useRows(() => supabase.from('vendor_ledger_entries').select('amount,type,created_at'))
  const balance = ledger.data.reduce((s: number, l: Row) => s + Number(l.amount), 0)
  const low = prods.data.filter((p: Row) => p.status === 'approved' && p.stock <= 5)
  const count = (st: string) => prods.data.filter((p: Row) => p.status === st).length
  const newOrders = orders.data.filter((o: Row) => o.status === 'new').length

  // sales per day, last 7 days (delivered sales only)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const bars = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (DAYS - 1 - i))
    const key = d.toDateString()
    const total = ledger.data.filter((l: Row) => l.type === 'sale' && new Date(l.created_at).toDateString() === key).reduce((s: number, l: Row) => s + Number(l.amount), 0)
    return { label: d.toLocaleDateString('en-GB', { weekday: 'short' }), total }
  })
  const max = Math.max(...bars.map((b) => b.total), 1)
  const weekTotal = bars.reduce((s, b) => s + b.total, 0)

  if (prods.loading && orders.loading && ledger.loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back${vendor?.store_name ? `, ${vendor.store_name}` : ''}`} subtitle="Here is how your store is doing today."
        actions={<Link to="/marketplace/vendor/dashboard/products?new=1" className="btn-red btn-sm !py-2.5"><Icon name="plus" className="mr-1.5 h-4 w-4" />Add product</Link>} />

      {count('rejected') > 0 && <Notice tone="red"><b>{count('rejected')} product(s) were rejected.</b> Open <Link className="font-semibold underline" to="/marketplace/vendor/dashboard/products">Products</Link> to read the reason and resubmit.</Notice>}
      {newOrders > 0 && <Notice tone="amber"><b>{newOrders} new order{newOrders > 1 ? 's' : ''}</b> waiting to be accepted. <Link className="font-semibold underline" to="/marketplace/vendor/dashboard/orders">Review orders</Link></Notice>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="New orders" value={newOrders} icon="bag" tone="amber" hint="Awaiting your action" />
        <Kpi label="Live products" value={count('approved')} icon="package" tone="green" hint="Visible to customers" />
        <Kpi label="Pending review" value={count('pending_review')} icon="clock" tone="blue" hint="With marketplace team" />
        <Kpi label="Payable balance" value={pkr(balance)} icon="wallet" tone="red" hint="After commission" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Sales — last 7 days" className="xl:col-span-3" action={<span className="text-sm font-bold text-ink">{pkr(weekTotal)}</span>}>
          <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label="Sales per day for the last 7 days">
            {bars.map((b, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${b.label}: ${pkr(b.total)}`}>
                <div className={`w-full rounded-t-lg ${b.total ? 'bg-mred-600' : 'bg-gray-100'}`} style={{ height: `${Math.max((b.total / max) * 100, b.total ? 6 : 3)}%` }} />
                <span className="text-[11px] font-medium text-gray-400">{b.label}</span>
              </div>
            ))}
          </div>
          {weekTotal === 0 && <p className="mt-3 text-center text-xs text-gray-400">Sales appear here once orders are delivered.</p>}
        </Panel>

        <Panel title="Low stock" className="xl:col-span-2" pad={false}
          action={low.length > 0 ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">{low.length}</span> : undefined}>
          {!low.length ? <p className="px-5 py-8 text-center text-sm text-gray-500">All live products are well stocked.</p> : (
            <ul className="divide-y divide-gray-100">{low.slice(0, 6).map((p: Row) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-peach-50">{p.image_urls?.[0] && <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" />}</div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
              </li>))}</ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent orders" pad={false} action={<Link to="/marketplace/vendor/dashboard/orders" className="text-sm font-semibold text-mred-600 hover:underline">View all</Link>}>
        {!orders.data.length ? (
          <div className="p-5"><EmptyState icon="bag" title="No orders yet" text="Once customers order your products, they will show up here." /></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr><th className="th pl-5">Order</th><th className="th">Date</th><th className="th">Status</th><th className="th pr-5 text-right">You receive</th></tr></thead>
            <tbody>{orders.data.slice(0, 5).map((o: Row) => (
              <tr key={o.id}><td className="td pl-5 font-semibold">{o.order_number}</td><td className="td text-gray-500">{shortDate(o.created_at)}</td>
                <td className="td"><StatusBadge s={o.status} /></td><td className="td pr-5 text-right font-semibold">{pkr(o.vendor_payable)}</td></tr>))}</tbody></table></div>
        )}
      </Panel>
    </div>
  )
}
