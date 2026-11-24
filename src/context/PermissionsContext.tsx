import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { DEFAULT_PERMS, MODULES } from '../lib/permissions'

type PermState = { can: (module: string) => boolean; loading: boolean; reload: () => void }
const Ctx = createContext<PermState | null>(null)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { role, session } = useAuth()
  const [allowed, setAllowed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!role) { setAllowed(new Set()); return }
    if (role === 'ceo' || role === 'co_ceo') { setAllowed(new Set(MODULES.map((m) => m.key))); return }
    if (!isSupabaseConfigured || !session) return
    let on = true
    setLoading(true)
    supabase.from('role_permissions').select('module, allowed').eq('role', role).then(({ data, error }) => {
      if (!on) return
      // table missing (SQL not run yet) → fall back to the built-in defaults
      setAllowed(error ? new Set(DEFAULT_PERMS[role] ?? []) : new Set((data ?? []).filter((r: any) => r.allowed).map((r: any) => r.module as string)))
      setLoading(false)
    })
    return () => { on = false }
  }, [role, session, tick])

  const can = useCallback((m: string) => allowed.has(m), [allowed])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  const value = useMemo(() => ({ can, loading, reload }), [can, loading, reload])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function usePermissions() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePermissions must be used inside PermissionsProvider')
  return c
}
