import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GROUPS, MATRIX_ROLES, MODULES, DEFAULT_PERMS } from '../../lib/permissions'
import { ROLE_LABELS } from '../../lib/format'
import { useToast } from '../../components/Toast'
import { usePermissions } from '../../context/PermissionsContext'
import { ErrorNote, Switch, Spinner } from '../../components/ui'
import Icon from '../../components/Icon'

const ROLE_NOTE: Record<string, string> = {
  central_admin: 'Coordinates departments and website content.', finance_manager: 'Commission, settlements and reports.',
  hr_manager: 'Employee records.', it_manager: 'Accounts, roles and audit.',
  marketplace_head: 'Runs the marketplace day to day (signs in at /marketplace/login).', marketplace_staff: 'Reviews applications, products and orders.',
}

export default function AccessControl() {
  const toast = useToast()
  const { reload } = usePermissions()
  const [m, setM] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.from('role_permissions').select('*').then(({ data, error }) => {
      if (error) setErr(error.message)
      else setM(Object.fromEntries((data ?? []).map((r: any) => [`${r.role}:${r.module}`, r.allowed])))
      setLoading(false)
    })
  }, [])

  const toggle = async (role: string, module: string, v: boolean) => {
    setM((x) => ({ ...x, [`${role}:${module}`]: v }))
    const { error } = await supabase.from('role_permissions').upsert({ role, module, allowed: v })
    if (error) { setM((x) => ({ ...x, [`${role}:${module}`]: !v })); return toast(error.message, 'err') }
    await supabase.from('audit_logs').insert({ action: 'change_permission', entity: 'role_permissions', details: { role, module, allowed: v } })
    reload(); toast(`${ROLE_LABELS[role]}: ${v ? 'granted' : 'removed'} — ${MODULES.find((x) => x.key === module)?.label}`)
  }
  const reset = async () => {
    if (!confirm('Reset every role to the default access?')) return
    const rows = MATRIX_ROLES.flatMap((r) => MODULES.map((mod) => ({ role: r, module: mod.key, allowed: (DEFAULT_PERMS[r] ?? []).includes(mod.key) })))
    const { error } = await supabase.from('role_permissions').upsert(rows)
    if (error) return toast(error.message, 'err')
    setM(Object.fromEntries(rows.map((r) => [`${r.role}:${r.module}`, r.allowed]))); reload(); toast('Defaults restored')
  }

  if (loading) return <Spinner />
  if (err) return <ErrorNote>{err}. Run <b>supabase/dashboard.sql</b> in the Supabase SQL Editor first.</ErrorNote>
  const rows = [{ g: '', list: MODULES.filter((x) => !x.group) }, ...GROUPS.map((g) => ({ g, list: MODULES.filter((x) => x.group === g) }))]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
        <p className="flex items-center gap-2"><Icon name="shield" className="h-5 w-5" />CEO and Co-CEO always have full access. These switches are enforced by the database, not just hidden in the menu.</p>
        <button onClick={reset} className="btn-outline btn-sm">Reset to defaults</button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="sticky left-0 bg-gray-50 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Area</th>
              {MATRIX_ROLES.map((r) => <th key={r} className="px-3 py-4 text-center"><p className="text-xs font-bold text-gray-800">{ROLE_LABELS[r]}</p><p className="mx-auto mt-1 max-w-[9rem] text-[10px] font-normal text-gray-400">{ROLE_NOTE[r]}</p></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ g, list }) => list.length === 0 ? null : (
              <Fragment key={g || 'top'}>
                {g && <tr key={g}><td colSpan={MATRIX_ROLES.length + 1} className="bg-gray-50/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g}</td></tr>}
                {list.map((mod) => (
                  <tr key={mod.key} className="border-t border-gray-50 transition hover:bg-brand-50/40">
                    <td className="sticky left-0 bg-white px-5 py-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name={mod.icon} className="h-4 w-4" /></span><span className="font-medium">{mod.label}</span></div></td>
                    {MATRIX_ROLES.map((r) => (
                      <td key={r} className="px-3 py-3 text-center">
                        {mod.key === 'access' ? <Icon name="lock" className="mx-auto h-4 w-4 text-gray-300" /> :
                          <div className="flex justify-center"><Switch checked={!!m[`${r}:${mod.key}`]} onChange={(v) => toggle(r, mod.key, v)} label={`${ROLE_LABELS[r]} – ${mod.label}`} /></div>}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
