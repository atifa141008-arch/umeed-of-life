import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSite, SiteDepartment } from '../../context/SiteContext'
import { useToast } from '../../components/Toast'
import { Switch } from '../../components/ui'
import Icon from '../../components/Icon'

const STATUSES = ['Now open', 'Coming Soon', 'Paused']

export default function DepartmentsAdmin() {
  const { allDepartments, refresh } = useSite()
  const toast = useToast()
  const [rows, setRows] = useState<SiteDepartment[]>([])
  const [busy, setBusy] = useState('')
  useEffect(() => setRows(allDepartments), [allDepartments])
  const upd = (slug: string, patch: Partial<SiteDepartment>) => setRows((r) => r.map((d) => (d.slug === slug ? { ...d, ...patch } : d)))

  const save = async (d: SiteDepartment) => {
    setBusy(d.slug)
    const { error } = await supabase.from('department_settings').upsert({ slug: d.slug, name: d.name, short: d.short, status: d.status, visible: d.visible, updated_at: new Date().toISOString() })
    if (error) { setBusy(''); return toast(error.message, 'err') }
    await supabase.from('audit_logs').insert({ action: 'update_department', entity: 'department_settings', details: { slug: d.slug, status: d.status, visible: d.visible } })
    refresh(); setBusy(''); toast(`${d.name} updated`)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {rows.map((d, i) => (
        <section key={d.slug} className="animate-fade-in rounded-3xl border border-gray-200 bg-white p-6" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${d.dot}`}><Icon name={d.icon} className="h-5 w-5" /></span>
              <div><p className="font-bold">{d.name}</p><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${d.badge}`}>{d.status}</span></div></div>
            <div className="flex items-center gap-2 text-xs text-gray-500"><span>Visible</span><Switch checked={d.visible} onChange={(v) => upd(d.slug, { visible: v })} label="Visible on website" /></div>
          </div>
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium">Name<input value={d.name} onChange={(e) => upd(d.slug, { name: e.target.value })} className="input mt-1" /></label>
            <label className="block text-sm font-medium">Short description<textarea value={d.short} onChange={(e) => upd(d.slug, { short: e.target.value })} rows={3} className="input mt-1" /></label>
            <label className="block text-sm font-medium">Status
              <select value={d.status} onChange={(e) => upd(d.slug, { status: e.target.value })} className="input mt-1">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
            {d.slug === 'marketplace' && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">This is only the label on the website. To actually stop shopping, use Site settings → Marketplace status.</p>}
          </div>
          <button onClick={() => save(d)} disabled={busy === d.slug} className="btn-primary btn-sm mt-5">{busy === d.slug ? 'Saving…' : 'Save'}</button>
        </section>
      ))}
    </div>
  )
}
