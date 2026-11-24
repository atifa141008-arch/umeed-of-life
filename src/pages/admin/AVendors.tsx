import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, dt } from '../../lib/format'
import { Empty, ErrorNote, Spinner, StatusBadge, useRows } from '../../components/ui'

export default function AVendors() {
  const { data, loading, error, reload } = useRows(() => supabase.from('vendors').select('*').order('created_at', { ascending: false }))
  const [msg, setMsg] = useState('')
  const toggle = async (v: Row) => {
    const next = v.status === 'active' ? 'suspended' : 'active'
    const note = prompt(`Reason for ${next === 'suspended' ? 'suspending' : 'reactivating'} ${v.store_name}:`)
    if (!note) return
    const { error } = await supabase.rpc('set_vendor_status', { p_vendor: v.id, p_status: next, p_note: note })
    setMsg(error ? error.message : ''); reload()
  }
  if (loading) return <Spinner />
  if (error) return <ErrorNote>{error}</ErrorNote>
  if (!data.length) return <Empty>No approved vendors yet.</Empty>
  return (
    <div className="space-y-3">
      {msg && <ErrorNote>{msg}</ErrorNote>}
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr><th className="th">Store</th><th className="th">Support</th><th className="th">Joined</th><th className="th">Status</th><th className="th"></th></tr></thead>
        <tbody>{data.map((v: Row) => (
          <tr key={v.id}><td className="td font-semibold">{v.store_name}</td><td className="td">{v.support_contact}</td><td className="td">{dt(v.created_at)}</td><td className="td"><StatusBadge s={v.status} /></td>
            <td className="td"><button onClick={() => toggle(v)} className="btn-red-outline btn-sm">{v.status === 'active' ? 'Suspend' : 'Reactivate'}</button></td></tr>
        ))}</tbody></table></div>
    </div>
  )
}
