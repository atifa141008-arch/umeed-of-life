import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { Row, pkr } from '../../../lib/format'
import { StatCard, useRows } from '../../../components/ui'

export default function VOverview() {
  const prods = useRows(() => supabase.from('products').select('id,name,status,stock'))
  const orders = useRows(() => supabase.from('vendor_orders').select('id,status'))
  const ledger = useRows(() => supabase.from('vendor_ledger_entries').select('amount'))
  const balance = ledger.data.reduce((s: number, l: Row) => s + Number(l.amount), 0)
  const low = prods.data.filter((p: Row) => p.status === 'approved' && p.stock <= 5)
  const count = (st: string) => prods.data.filter((p: Row) => p.status === st).length

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New orders" value={orders.data.filter((o: Row) => o.status === 'new').length} />
        <StatCard label="Live products" value={count('approved')} />
        <StatCard label="Pending review" value={count('pending_review')} />
        <StatCard label="Payable balance" value={pkr(balance)} />
      </div>
      {count('rejected') > 0 && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{count('rejected')} product(s) were rejected. Open Products to see the reason.</p>}
      <div>
        <h2 className="text-lg font-bold">Low stock</h2>
        {!low.length ? <p className="mt-2 text-sm text-gray-500">No live products are running low.</p> : (
          <ul className="mt-2 text-sm">{low.map((p: Row) => <li key={p.id}>{p.name} — <b>{p.stock}</b> left</li>)}</ul>
        )}
      </div>
      <Link to="/marketplace/vendor/dashboard/products" className="btn-red">Manage products</Link>
    </div>
  )
}
