import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { Empty, ErrorNote, StatusBadge, useRows } from '../../components/ui'
import Registrations from './Registrations'

function EmployeesTab() {
  const { data, error, reload } = useRows(() => supabase.from('employee_profiles').select('*').order('created_at', { ascending: false }))
  const [err, setErr] = useState('')

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = Object.fromEntries(new FormData(form)) as Record<string, any>
    f.joined_on = f.joined_on || null
    const { error } = await supabase.from('employee_profiles').insert(f)
    if (error) return setErr(error.message)
    setErr(''); form.reset(); reload()
  }
  const setStatus = async (id: string, status: string) => { await supabase.from('employee_profiles').update({ status }).eq('id', id); reload() }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={add} className="card space-y-3 lg:col-span-1">
        <h2 className="text-lg font-bold">Add employee</h2>
        <input name="full_name" required placeholder="Full name" className="input" />
        <input name="email" type="email" placeholder="Email" className="input" />
        <input name="phone" placeholder="Phone" className="input" />
        <select name="department" className="input">
          <option>Central</option><option>Marketplace</option><option>Essentials</option><option>Care</option><option>WorkHub</option><option>Global</option>
        </select>
        <input name="position" placeholder="Position" className="input" />
        <label className="block text-xs text-gray-500">Joined on<input name="joined_on" type="date" className="input mt-1" /></label>
        {err && <ErrorNote>{err}</ErrorNote>}
        <button className="btn-primary">Add employee</button>
      </form>
      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold">Employees</h2>
        {error ? <ErrorNote>{error}</ErrorNote> : !data.length ? <div className="mt-3"><Empty>No employee records yet.</Empty></div> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr><th className="th">Name</th><th className="th">Department</th><th className="th">Position</th><th className="th">Status</th></tr></thead>
            <tbody>{data.map((p: Row) => (
              <tr key={p.id}>
                <td className="td"><b>{p.full_name}</b><br /><span className="text-xs text-gray-500">{p.email}</span></td>
                <td className="td">{p.department}</td><td className="td">{p.position}</td>
                <td className="td"><StatusBadge s={p.status} />
                  <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} className="ml-2 rounded border border-gray-300 text-xs">
                    <option value="active">active</option><option value="on_leave">on leave</option><option value="left">left</option>
                  </select></td>
              </tr>
            ))}</tbody></table></div>
        )}
      </div>
    </div>
  )
}

export default function HR() {
  const [tab, setTab] = useState<'emp' | 'reg'>('emp')
  const [fresh, setFresh] = useState(0)
  return (
    <div className="space-y-6">
      <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1 text-sm font-semibold">
        <button onClick={() => setTab('emp')} className={`rounded-full px-5 py-2 transition ${tab === 'emp' ? 'bg-white shadow' : 'text-gray-500'}`}>Employees</button>
        <button onClick={() => setTab('reg')} className={`flex items-center gap-2 rounded-full px-5 py-2 transition ${tab === 'reg' ? 'bg-white shadow' : 'text-gray-500'}`}>Team registrations{fresh > 0 && <span className="rounded-full bg-gold-400 px-2 text-[11px] font-bold text-brand-900">{fresh}</span>}</button>
      </div>
      {tab === 'emp' && <EmployeesTab />}
      <div className={tab === 'reg' ? '' : 'hidden'}><Registrations onCount={setFresh} /></div>
    </div>
  )
}
