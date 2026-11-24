import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { CENTRAL_ROLES } from '../lib/format'

export type Profile = {
  id: string; full_name: string | null; email: string | null; role: string
  phone: string | null; address: string | null; city: string | null
}

type AuthState = {
  session: Session | null
  profile: Profile | null
  role: string | null
  loading: boolean
  isManagement: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: string | null }>
  signUp: (email: string, password: string, fullName: string, extra?: Record<string, string>, redirectPath?: string) => Promise<{ error: string | null; hasSession: boolean }>
  signInWithGoogle: (redirectPath: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [tick, setTick] = useState(0)

  // Supabase keeps the session in localStorage and refreshes it automatically,
  // so a signed-in person stays signed in until they sign out.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) { setProfile(null); return }
    setLoading(true)
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(({ data }) => {
      setProfile((data as Profile) ?? null)
      setLoading(false)
    })
  }, [userId, tick])

  const signIn: AuthState['signIn'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message, role: null }
    // my_role() is a trusted database function, so it still works if a profiles policy is misconfigured
    let role: string | null = null
    const viaRpc = await supabase.rpc('my_role')
    if (!viaRpc.error && viaRpc.data) role = viaRpc.data as string
    else {
      const { data: p, error: pe } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
      if (p?.role) role = p.role as string
      else {
        await supabase.auth.signOut()
        return { error: `Signed in, but no profile/role was found for this account${pe ? ` (${pe.message})` : ''}. Ask the IT Manager to check the profiles table in Supabase.`, role: null }
      }
    }
    return { error: null, role }
  }
  const signUp: AuthState['signUp'] = async (email, password, fullName, extra = {}, redirectPath) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, ...extra }, emailRedirectTo: redirectPath ? window.location.origin + redirectPath : undefined } })
    return { error: error ? error.message : null, hasSession: !!data.session }
  }
  const signInWithGoogle: AuthState['signInWithGoogle'] = async (redirectPath) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + redirectPath } })
    return error ? error.message : null
  }
  const signOut = async () => { await supabase.auth.signOut() }

  const role = profile?.role ?? null
  return (
    <AuthContext.Provider
      value={{ session, profile, role, loading, isManagement: !!role && CENTRAL_ROLES.includes(role),
        signIn, signUp, signInWithGoogle, signOut, refreshProfile: () => setTick((t) => t + 1) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
