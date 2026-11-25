import { supabase } from '../../../lib/supabase'
import { Row, dt, pkr } from '../../../lib/format'
import { useRows } from '../../../components/ui'
import Icon from '../../../components/Icon'
import { EmptyState, Kpi, Notice, PageHeader, PageLoading, Panel } from './parts'

const TYPE_STYLE: Record<string, string> = {
  sale: 'bg-green-100 text-green-800', commission: 'bg-amber-100 text-amber-800', settlement: 'bg-blue-100 text-blue-800',
}

export default function VFinance() {
  const { data, loading, error } = useRows(() => supabase.from('vendor_ledger_entries').select('*').order('created_at', { ascending: false }))
  const sum = (t: string[]) => data.filter((l: Row) => t.includes(l.type)).reduce((s: number, l: Row) => s + Number(l.amount), 0)
  const balance = data.reduce((s: number, l: Row) => s + Number(l.amount), 0)

  const csv = () => {
    const rows = [['Date', 'Type', 'Amount', 'Note'], ...data.map((l: Row) => [l.created_at, l.type, l.amount, `"${(l.note ?? '').replace(/"/g, '""')}"`])]
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'umeed-vendor-statement.csv'; a.click(); URL.revokeObjectURL(url)
  }
  if (loading) return <PageLoading />
  if (error) return <Notice tone="red">{error}</Notice>
  return (
    <div className="space-y-6">
      <PageHeader title="Finance" subtitle="Your earnings, marketplace commission and payouts."
        actions={data.length > 0 ? <button onClick={csv} className="btn-red-outline btn-sm !py-2.5"><Icon name="file" className="mr-1.5 h-4 w-4" />Download CSV</button> : undefined} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="Sales (delivered)" value={pkr(sum(['sale']))} icon="trend" tone="green" />
        <Kpi label="Commission" value={pkr(sum(['commission']))} icon="tag" tone="amber" />
        <Kpi label="Paid out" value={pkr(-sum(['settlement']))} icon="check" tone="blue" />
        <Kpi label="Payable balance" value={pkr(balance)} icon="wallet" tone="red" hint="Owed to you" />
      </div>
      <Panel title="Statement" pad={false}>
        {!data.length ? <div className="p-5"><EmptyState icon="wallet" title="No entries yet" text="Sales and commission are posted when an order is delivered." /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr><th className="th pl-5">Date</th><th className="th">Type</th><th className="th">Note</th><th className="th pr-5 text-right">Amount</th></tr></thead>
            <tbody>{data.map((l: Row) => (
              <tr key={l.id}><td className="td whitespace-nowrap pl-5 text-gray-500">{dt(l.created_at)}</td>
                <td className="td"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TYPE_STYLE[l.type] ?? 'bg-gray-100 text-gray-700'}`}>{l.type}</span></td>
                <td className="td text-gray-600">{l.note}</td>
                <td className={`td whitespace-nowrap pr-5 text-right font-semibold ${l.amount < 0 ? 'text-red-700' : 'text-green-700'}`}>{pkr(l.amount)}</td></tr>))}</tbody></table></div>
        )}
      </Panel>
    </div>
  )
}
