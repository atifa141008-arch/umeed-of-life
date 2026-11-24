import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Row, ROLE_LABELS } from '../../lib/format'
import { useToast } from '../../components/Toast'
import CountUp from '../../components/CountUp'
import Icon from '../../components/Icon'
import { ErrorNote, useRows } from '../../components/ui'

const ASSIGNABLE = ['customer', 'marketplace_staff', 'marketplace_head', 'central_admin', 'finance_manager', 'hr_manager', 'it_manager', 'co_ceo', 'ceo']
const STAFF = ['ceo', 'co_ceo', 'central_admin', 'finance_manager', 'hr_manager', 'it_manager', 'marketplace_head', 'marketplace_staff']

export default function Staff() {
  const { session } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const { data, loading, error, reload } = useRows(() => supabase.from('profiles').select('id,full_name,email,role,created_at').order('created_at', { ascending: false }).limit(500))

  const count = (f: (p: Row) => boolean) => data.filter(f).length
  const rows = data.filter((p: Row) => (filter === 'all' || (filter === 'staff' ? STAFF.includes(p.role) : p.role === filter)) && `${p.full_name} ${p.email}`.toLowerCase().includes(q.toLowerCase()))

  const change = async (p: Row, role: string) => {
    const { error } = await supabase.rpc('set_user_role', { p_user: p.id, p_role: role })
    if (error) return toast(error.message, 'err')
    toast(`${p.full_name || p.email} is now ${ROLE_LABELS[role]}`); reload()
  }
  if (error) return <ErrorNote>{error}</ErrorNote>

  const stats = [['All accounts', data.length, 'users'], ['Staff', count((p) => STAFF.includes(p.role)), 'shield'], ['Customers', count((p) => p.role === 'customer'), 'user'], ['Vendors', count((p) => p.role === 'vendor'), 'store']] as const
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, v, i]) => (
          <div key={l} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={i} className="h-5 w-5" /></span>
            <p className="mt-3 font-display text-3xl font-bold"><CountUp value={v} /></p><p className="text-sm text-gray-500">{l}</p></div>
        ))}
      </div>
      <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">To add a team member, ask them to create an account (buyer sign-up at <b>/marketplace/login</b>), then give them a role here. Vendors and applicants are managed from Marketplace.</p>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1"><Icon name="search" className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" className="input !pl-10" /></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input !w-auto"><option value="all">All roles</option><option value="staff">Staff only</option>{['customer', 'vendor', 'applicant'].map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white">
        <table className="w-full text-sm"><thead><tr><th className="th">User</th><th className="th">Role</th></tr></thead>
          <tbody>
            {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={2} className="p-3"><div className="skeleton h-10" /></td></tr>) : rows.map((p: Row) => (
              <tr key={p.id} className="transition hover:bg-brand-50/40">
                <td className="td"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">{(p.full_name || p.email || '?')[0].toUpperCase()}</span><div><p className="font-semibold">{p.full_name || '—'}</p><p className="text-xs text-gray-500">{p.email}</p></div></div></td>
                <td className="td">{['vendor', 'applicant'].includes(p.role) ? <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{ROLE_LABELS[p.role]}</span> : (
                  <select value={p.role} disabled={p.id === session?.user.id} onChange={(e) => change(p, e.target.value)} className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-50">
                    {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>)}</td>
              </tr>))}
          </tbody></table>
      </div>
    </div>
  )
}
