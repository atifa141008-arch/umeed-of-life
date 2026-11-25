import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import { Row, ROLE_LABELS, dt } from '../../lib/format'
import { useToast } from '../../components/Toast'
import Icon from '../../components/Icon'
import { useRows } from '../../components/ui'

const ASSIGNABLE = ['customer', 'marketplace_staff', 'marketplace_head', 'central_admin', 'finance_manager', 'hr_manager', 'it_manager', 'co_ceo', 'ceo']
const TABS: [string, string][] = [['new', 'New'], ['reviewed', 'Reviewed'], ['assigned', 'Assigned'], ['declined', 'Declined'], ['all', 'All']]
const BADGE: Record<string, string> = { new: 'bg-amber-100 text-amber-800', reviewed: 'bg-blue-100 text-blue-800', assigned: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800' }
const Badge = ({ s }: { s: string }) => <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${BADGE[s] ?? 'bg-gray-100 text-gray-700'}`}>{s}</span>

const GROUPS: [string, [string, string][]][] = [
  ['Personal', [['father_name', 'Father / guardian'], ['cnic', 'CNIC'], ['dob', 'Date of birth'], ['gender', 'Gender'], ['marital_status', 'Marital status'], ['nationality', 'Nationality'], ['blood_group', 'Blood group']]],
  ['Contact', [['phone', 'Mobile'], ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['city', 'City'], ['province', 'Province'], ['address', 'Current address'], ['permanent_address', 'Permanent address']]],
  ['Emergency contact', [['emergency_name', 'Name'], ['emergency_relation', 'Relation'], ['emergency_phone', 'Phone']]],
  ['Work preference', [['department', 'Department'], ['position', 'Position applied for'], ['employment_type', 'Employment type'], ['joining_date', 'Available from'], ['expected_salary', 'Expected salary']]],
  ['Education & experience', [['qualification', 'Qualification'], ['institute', 'Institute'], ['field_of_study', 'Field of study'], ['experience_years', 'Experience'], ['prev_employer', 'Last employer'], ['prev_role', 'Last position'], ['skills', 'Skills'], ['languages', 'Languages']]],
]

/** People who filled the hidden /management/registration form. Management reviews them and assigns a role. */
export default function Registrations({ onCount }: { onCount?: (n: number) => void }) {
  const { session } = useAuth()
  const { can } = usePermissions()
  const toast = useToast()
  const { data, loading, error, reload } = useRows(() => supabase.from('staff_registrations').select('*').order('created_at', { ascending: false }).limit(500))
  const [tab, setTab] = useState('new')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Row | null>(null)
  const [curRole, setCurRole] = useState<string | null>(null)
  const [role, setRole] = useState('customer')
  const [addEmp, setAddEmp] = useState(false)
  const [dept, setDept] = useState('')
  const [pos, setPos] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { onCount?.(data.filter((r: Row) => r.status === 'new').length) }, [data, onCount])

  const open = async (r: Row) => {
    setSel(r); setNote(r.review_note ?? ''); setDept(r.department ?? ''); setPos(r.position ?? ''); setAddEmp(false); setRole(r.assigned_role ?? 'customer'); setCurRole(null)
    const p = await supabase.from('profiles').select('role').eq('id', r.user_id).maybeSingle()
    if (p.data?.role) { setCurRole(p.data.role); if (!r.assigned_role) setRole(p.data.role) }
  }
  const markOnly = async (status: 'reviewed' | 'declined') => {
    setBusy(true)
    const { error } = await supabase.from('staff_registrations').update({ status, review_note: note || null, reviewed_by: session?.user.id, reviewed_at: new Date().toISOString() }).eq('id', sel!.id)
    setBusy(false)
    if (error) return toast(error.message, 'err')
    toast(status === 'declined' ? 'Registration declined' : 'Marked as reviewed'); setSel(null); reload()
  }
  const assign = async () => {
    if (!confirm(`Assign ${sel!.full_name} as ${ROLE_LABELS[role]}${addEmp ? ' and add to Employees' : ''}?`)) return
    setBusy(true)
    try {
      if (can('users') && role !== curRole) {
        const r = await supabase.rpc('set_user_role', { p_user: sel!.user_id, p_role: role })
        if (r.error) throw new Error(r.error.message)
      }
      if (addEmp && can('hr')) {
        const r = await supabase.from('employee_profiles').insert({ full_name: sel!.full_name, email: sel!.email, phone: sel!.phone, department: dept || null, position: pos || null, joined_on: sel!.joining_date || null })
        if (r.error) throw new Error(r.error.message)
      }
      const u = await supabase.from('staff_registrations').update({ status: 'assigned', assigned_role: role, review_note: note || null, reviewed_by: session?.user.id, reviewed_at: new Date().toISOString() }).eq('id', sel!.id)
      if (u.error) throw new Error(u.error.message)
      toast(`${sel!.full_name} is now ${ROLE_LABELS[role]}`); setSel(null); reload()
    } catch (e: any) { toast(e.message, 'err') }
    setBusy(false)
  }

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}. Run <b>supabase/staff_registration.sql</b> in Supabase first.</p>

  const count = (s: string) => (s === 'all' ? data.length : data.filter((r: Row) => r.status === s).length)
  const rows = data.filter((r: Row) => (tab === 'all' || r.status === tab) && `${r.full_name} ${r.email} ${r.phone} ${r.department} ${r.position} ${r.cnic}`.toLowerCase().includes(q.toLowerCase()))

  if (sel) {
    const self = sel.user_id === session?.user.id
    return (
      <div className="animate-fade-in space-y-5">
        <button onClick={() => setSel(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-brand-700"><Icon name="left" className="h-4 w-4" />Back to registrations</button>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 font-sans text-xl font-bold text-brand-800">{(sel.full_name || '?')[0].toUpperCase()}</span>
          <div className="min-w-0 flex-1"><h2 className="truncate font-sans text-xl font-bold text-ink">{sel.full_name}</h2><p className="text-sm text-gray-500">{sel.email} • {sel.phone}</p><p className="text-xs text-gray-400">Registered {dt(sel.created_at)}</p></div>
          <Badge s={sel.status} />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {GROUPS.map(([title, fields]) => (
              <section key={title} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <h3 className="border-b border-gray-100 px-5 py-3.5 font-sans text-[15px] font-bold text-ink">{title}</h3>
                <dl className="grid gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-2">{fields.map(([k, l]) => <div key={k}><dt className="text-xs text-gray-400">{l}</dt><dd className="mt-0.5 break-words text-ink">{sel[k] || '—'}</dd></div>)}</dl>
              </section>))}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm"><h3 className="border-b border-gray-100 px-5 py-3.5 font-sans text-[15px] font-bold text-ink">About</h3><p className="whitespace-pre-wrap p-5 text-sm text-gray-700">{sel.about || '—'}</p></section>
          </div>

          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h3 className="font-sans text-[15px] font-bold text-ink">Assign &amp; decide</h3>
            <p className="text-xs text-gray-500">Current account role: <b>{curRole ? ROLE_LABELS[curRole] ?? curRole : 'Customer'}</b></p>
            {can('users') ? (
              <label className="block text-[13px] font-semibold text-gray-700">Role
                <select value={role} onChange={(e) => setRole(e.target.value)} disabled={self || ['vendor', 'applicant'].includes(curRole ?? '')} className="input mt-1.5 disabled:bg-gray-50">
                  {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
                <span className="mt-1 block text-xs font-normal text-gray-400">Gives them access to the matching dashboard areas (see Access control).</span></label>
            ) : <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Only people with access to <b>Users &amp; roles</b> can change a role. You can still add this person to Employees.</p>}
            {can('hr') && (
              <div className="rounded-xl bg-gray-50 p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={addEmp} onChange={(e) => setAddEmp(e.target.checked)} className="h-4 w-4 accent-brand-700" />Also add to Employees</label>
                {addEmp && <div className="mt-3 space-y-2"><input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Department" className="input !py-2" /><input value={pos} onChange={(e) => setPos(e.target.value)} placeholder="Position" className="input !py-2" /></div>}
              </div>)}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Internal note (optional)" className="input" />
            <div className="flex flex-col gap-2">
              <button disabled={busy || self} onClick={assign} className="btn-primary">Assign &amp; save</button>
              <button disabled={busy} onClick={() => markOnly('reviewed')} className="btn-outline">Mark as reviewed</button>
              <button disabled={busy} onClick={() => confirm('Decline this registration? The account stays a customer account.') && markOnly('declined')} className="rounded-full px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">Decline</button>
            </div>
            {self && <p className="text-xs text-gray-400">You cannot change your own role.</p>}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">Team members register themselves at <b>/management/registration</b> (this link is not shown anywhere on the site — share it only with the people you want to join). They start as customers; open a registration here to assign their role.</p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === k ? 'bg-brand-700 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
              {l}<span className={`rounded-full px-1.5 text-[11px] ${tab === k ? 'bg-white/25' : k === 'new' && count(k) > 0 ? 'bg-gold-400 text-brand-900' : 'bg-gray-100 text-gray-500'}`}>{count(k)}</span></button>))}
        </div>
        <div className="relative w-full lg:w-72"><Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, CNIC, phone, position" className="input !rounded-full !py-2.5 !pl-10" /></div>
      </div>
      {loading ? <div className="skeleton h-40" /> : !rows.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon name="users" className="h-6 w-6" /></span>
          <h3 className="mt-4 font-sans text-base font-bold text-ink">No registrations here</h3><p className="mt-1 text-sm text-gray-500">{tab === 'new' ? 'New registrations will appear as people submit the form.' : 'Try another tab or search.'}</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm"><table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="th pl-5">Person</th><th className="th">Applying for</th><th className="th">Phone</th><th className="th">Registered</th><th className="th">Status</th><th className="th pr-5" /></tr></thead>
          <tbody>{rows.map((r: Row) => (
            <tr key={r.id} className="transition hover:bg-brand-50/40">
              <td className="td pl-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">{(r.full_name || '?')[0].toUpperCase()}</span><div className="min-w-0"><p className="font-semibold text-ink">{r.full_name}</p><p className="truncate text-xs text-gray-500">{r.email}</p></div></div></td>
              <td className="td"><p className="font-medium">{r.position || '—'}</p><p className="text-xs text-gray-500">{r.department}{r.employment_type ? ` • ${r.employment_type}` : ''}</p></td>
              <td className="td whitespace-nowrap">{r.phone}</td><td className="td whitespace-nowrap text-gray-500">{dt(r.created_at)}</td>
              <td className="td"><Badge s={r.status} />{r.assigned_role && <p className="mt-1 text-xs text-gray-500">{ROLE_LABELS[r.assigned_role]}</p>}</td>
              <td className="td whitespace-nowrap pr-5 text-right"><button onClick={() => open(r)} className={r.status === 'new' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}>{r.status === 'new' ? 'Review' : 'View'}</button></td>
            </tr>))}</tbody></table></div>
      )}
    </div>
  )
}
