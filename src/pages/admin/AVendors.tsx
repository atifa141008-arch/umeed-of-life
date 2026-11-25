import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, dt } from '../../lib/format'
import { StatusBadge, useRows } from '../../components/ui'
import { EmptyState, Notice, PageLoading } from '../vendor/dashboard/parts'
import { Avatar, Card, Chips, SearchInput, Stat } from './bits'

export default function AVendors() {
  const { data, loading, error, reload } = useRows(() => supabase.from('vendors').select('*').order('created_at', { ascending: false }))
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const toggle = async (v: Row) => {
    const next = v.status === 'active' ? 'suspended' : 'active'
    const note = prompt(`Reason for ${next === 'suspended' ? 'suspending' : 'reactivating'} ${v.store_name}:`)
    if (!note) return
    const { error } = await supabase.rpc('set_vendor_status', { p_vendor: v.id, p_status: next, p_note: note })
    setMsg(error ? error.message : ''); reload()
  }
  if (loading) return <PageLoading />
  if (error) return <Notice tone="red">{error}</Notice>
  if (!data.length) return <EmptyState icon="store" title="No approved vendors yet" text="Stores appear here once a vendor application is approved." />

  const n = (s: string) => data.filter((v: Row) => v.status === s).length
  const rows = data.filter((v: Row) => (filter === 'all' || v.status === filter) && `${v.store_name} ${v.support_contact ?? ''}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5">
      {msg && <Notice tone="red">{msg}</Notice>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total stores" value={data.length} icon="store" />
        <Stat label="Active" value={n('active')} icon="check" tone="green" />
        <Stat label="Suspended" value={n('suspended')} icon="lock" tone="red" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Chips value={filter} onChange={setFilter} items={[['all', 'All', data.length], ['active', 'Active', n('active')], ['suspended', 'Suspended', n('suspended')]]} />
        <SearchInput value={q} onChange={setQ} placeholder="Search stores" />
      </div>
      {!rows.length ? <EmptyState icon="search" title="No stores found" text="Try a different filter or search term." /> : (
        <Card>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="th pl-5">Store</th><th className="th">Support</th><th className="th">Commission</th><th className="th">Joined</th><th className="th">Status</th><th className="th pr-5" /></tr></thead>
            <tbody>{rows.map((v: Row) => (
              <tr key={v.id} className="hover:bg-gray-50/60">
                <td className="td pl-5"><div className="flex items-center gap-3"><Avatar name={v.store_name} src={v.logo_url} /><p className="font-semibold text-ink">{v.store_name}</p></div></td>
                <td className="td text-gray-600">{v.support_contact || '—'}</td>
                <td className="td">{v.commission_rate}%</td>
                <td className="td whitespace-nowrap text-gray-500">{dt(v.created_at)}</td>
                <td className="td"><StatusBadge s={v.status} /></td>
                <td className="td whitespace-nowrap pr-5 text-right"><button onClick={() => toggle(v)} className="btn-red-outline btn-sm">{v.status === 'active' ? 'Suspend' : 'Reactivate'}</button></td>
              </tr>))}</tbody></table></div>
        </Card>
      )}
    </div>
  )
}
