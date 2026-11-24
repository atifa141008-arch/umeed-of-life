import { supabase } from '../../../lib/supabase'
import { Row, dt, pkr } from '../../../lib/format'
import { Empty, ErrorNote, StatCard, useRows } from '../../../components/ui'

export default function VFinance() {
  const { data, error } = useRows(() => supabase.from('vendor_ledger_entries').select('*').order('created_at', { ascending: false }))
  const sum = (t: string[]) => data.filter((l: Row) => t.includes(l.type)).reduce((s: number, l: Row) => s + Number(l.amount), 0)
  const balance = data.reduce((s: number, l: Row) => s + Number(l.amount), 0)

  const csv = () => {
    const rows = [['Date', 'Type', 'Amount', 'Note'], ...data.map((l: Row) => [l.created_at, l.type, l.amount, `"${(l.note ?? '').replace(/"/g, '""')}"`])]
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'umeed-vendor-statement.csv'; a.click(); URL.revokeObjectURL(url)
  }
  if (error) return <ErrorNote>{error}</ErrorNote>
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sales (delivered)" value={pkr(sum(['sale']))} />
        <StatCard label="Commission" value={pkr(sum(['commission']))} />
        <StatCard label="Paid out" value={pkr(-sum(['settlement']))} />
        <StatCard label="Payable balance" value={pkr(balance)} />
      </div>
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Statement</h2>{data.length > 0 && <button onClick={csv} className="btn-red-outline btn-sm">Download CSV</button>}</div>
      {!data.length ? <Empty>No entries yet. Sales and commission are posted when an order is delivered.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr><th className="th">Date</th><th className="th">Type</th><th className="th">Amount</th><th className="th">Note</th></tr></thead>
          <tbody>{data.map((l: Row) => <tr key={l.id}><td className="td">{dt(l.created_at)}</td><td className="td">{l.type}</td>
            <td className={`td font-semibold ${l.amount < 0 ? 'text-red-700' : 'text-green-700'}`}>{pkr(l.amount)}</td><td className="td">{l.note}</td></tr>)}</tbody></table></div>
      )}
    </div>
  )
}
