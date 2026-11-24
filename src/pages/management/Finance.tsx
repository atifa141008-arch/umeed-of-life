import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Row, dt, pkr } from '../../lib/format'
import { Empty, ErrorNote, Spinner, StatCard, useRows } from '../../components/ui'

export default function Finance() {
  const { session } = useAuth()
  const [sum, setSum] = useState<Row | null>(null)
  const bal = useRows(() => supabase.rpc('vendor_balances'))
  const ledger = useRows(() => supabase.from('vendor_ledger_entries').select('*, vendors(store_name)').order('created_at', { ascending: false }).limit(50))
  const settings = useRows(() => supabase.from('platform_settings').select('*'))
  const [set, setSet] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  useEffect(() => { supabase.rpc('marketplace_summary').then(({ data }) => setSum(data as Row)) }, [ledger.data])
  useEffect(() => setSet(Object.fromEntries(settings.data.map((s: Row) => [s.key, s.value]))), [settings.data])

  const saveSettings = async () => {
    for (const k of ['default_commission_rate', 'delivery_fee_per_vendor'])
      await supabase.from('platform_settings').upsert({ key: k, value: String(set[k] ?? '0'), updated_at: new Date().toISOString() })
    await supabase.from('audit_logs').insert({ action: 'update_settings', entity: 'platform_settings', details: set })
    setMsg('Settings saved. New rates apply to new vendors / new orders.')
  }

  const record = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const type = String(f.get('type'))
    const amount = Math.abs(Number(f.get('amount')))
    const signed = type === 'settlement' || type === 'refund' ? -amount : Number(f.get('amount'))
    const { error } = await supabase.from('vendor_ledger_entries').insert({
      vendor_id: f.get('vendor'), type, amount: signed, note: String(f.get('note')), created_by: session?.user.id })
    if (error) return setMsg(error.message)
    await supabase.from('audit_logs').insert({ action: 'ledger_' + type, entity: 'vendor_ledger_entries', details: { vendor: f.get('vendor'), amount: signed } })
    form.reset(); setMsg('Entry recorded'); bal.reload(); ledger.reload()
  }

  if (bal.loading) return <Spinner />
  return (
    <div className="space-y-10">
      {sum && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Delivered sales" value={pkr(sum.gross_sales)} />
          <StatCard label="Commission earned" value={pkr(sum.commission)} />
          <StatCard label="Owed to vendors" value={pkr(sum.vendor_payable)} />
          <StatCard label="Orders" value={sum.orders} />
        </div>
      )}
      {msg && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-800">{msg}</p>}

      <section>
        <h2 className="text-xl font-bold">Vendor balances</h2>
        {bal.error ? <ErrorNote>{bal.error}</ErrorNote> : !bal.data.length ? <div className="mt-3"><Empty>No vendors yet.</Empty></div> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr><th className="th">Vendor</th><th className="th">Commission</th><th className="th">Payable balance</th></tr></thead>
            <tbody>{bal.data.map((b: Row) => (
              <tr key={b.vendor_id}><td className="td">{b.store_name}</td><td className="td">{b.commission_rate}%</td><td className="td font-semibold">{pkr(b.balance)}</td></tr>
            ))}</tbody></table></div>
        )}
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <form onSubmit={record} className="card space-y-3">
          <h2 className="text-lg font-bold">Record ledger entry</h2>
          <select name="vendor" required className="input">
            <option value="">Select vendor</option>
            {bal.data.map((b: Row) => <option key={b.vendor_id} value={b.vendor_id}>{b.store_name}</option>)}
          </select>
          <select name="type" className="input">
            <option value="settlement">Settlement paid to vendor</option>
            <option value="refund">Refund deduction</option>
            <option value="adjustment">Adjustment (+ or −)</option>
          </select>
          <input name="amount" type="number" step="0.01" required placeholder="Amount (PKR)" className="input" />
          <input name="note" required placeholder="Reason / bank reference" className="input" />
          <button className="btn-primary">Record entry</button>
        </form>

        <div className="card space-y-3">
          <h2 className="text-lg font-bold">Marketplace settings</h2>
          <label className="block text-sm font-medium">Default commission for new vendors (%)
            <input type="number" min={0} max={100} step="0.1" className="input mt-1" value={set.default_commission_rate ?? ''}
              onChange={(e) => setSet({ ...set, default_commission_rate: e.target.value })} />
          </label>
          <label className="block text-sm font-medium">Delivery fee per vendor shipment (PKR)
            <input type="number" min={0} className="input mt-1" value={set.delivery_fee_per_vendor ?? ''}
              onChange={(e) => setSet({ ...set, delivery_fee_per_vendor: e.target.value })} />
          </label>
          <button onClick={saveSettings} className="btn-primary">Save settings</button>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold">Recent ledger entries</h2>
        {!ledger.data.length ? <div className="mt-3"><Empty>No ledger entries yet. Entries are posted automatically when an order is delivered.</Empty></div> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr><th className="th">Date</th><th className="th">Vendor</th><th className="th">Type</th><th className="th">Amount</th><th className="th">Note</th></tr></thead>
            <tbody>{ledger.data.map((l: Row) => (
              <tr key={l.id}><td className="td">{dt(l.created_at)}</td><td className="td">{l.vendors?.store_name}</td><td className="td">{l.type}</td>
                <td className={`td font-semibold ${l.amount < 0 ? 'text-red-700' : 'text-green-700'}`}>{pkr(l.amount)}</td><td className="td">{l.note}</td></tr>
            ))}</tbody></table></div>
        )}
      </section>
    </div>
  )
}
