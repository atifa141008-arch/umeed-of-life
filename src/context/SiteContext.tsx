import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { departments as baseDepartments, Department } from '../data/site'

export type SiteDepartment = Department & { visible: boolean }
type SiteState = {
  settings: Record<string, string>
  setting: (key: string, fallback?: string) => string
  departments: SiteDepartment[]      // visible ones (public site)
  allDepartments: SiteDepartment[]   // including hidden (dashboard)
  refresh: () => void
}
const Ctx = createContext<SiteState | null>(null)

const statusBadge = (status: string, base: Department) =>
  status === base.status ? base.badge : status === 'Now open' ? 'bg-green-100 text-green-800' : status === 'Paused' ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-800'

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [over, setOver] = useState<any[]>([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.from('site_settings').select('key,value').then(({ data, error }) => {
      if (!error && data) setSettings(Object.fromEntries(data.map((r: any) => [r.key, r.value])))
    })
    supabase.from('department_settings').select('*').then(({ data, error }) => { if (!error && data) setOver(data) })
  }, [tick])

  const allDepartments = useMemo<SiteDepartment[]>(() => baseDepartments.map((b) => {
    const o = over.find((x) => x.slug === b.slug)
    if (!o) return { ...b, visible: true }
    return { ...b, name: o.name || b.name, short: o.short || b.short, status: o.status, badge: statusBadge(o.status, b), visible: o.visible !== false }
  }), [over])

  const value: SiteState = {
    settings, setting: (k, f = '') => (settings[k] ?? f),
    departments: allDepartments.filter((d) => d.visible), allDepartments,
    refresh: useCallback(() => setTick((t) => t + 1), []),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useSite() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSite must be used inside SiteProvider')
  return c
}
