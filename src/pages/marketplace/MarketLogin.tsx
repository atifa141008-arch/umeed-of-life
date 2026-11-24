import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginForm from '../../components/LoginForm'
import MarketLogo from '../../components/MarketLogo'
import { useAuth } from '../../context/AuthContext'
import { MARKET_STAFF_ROLES } from '../../lib/format'

const ALLOWED = ['customer', ...MARKET_STAFF_ROLES]

// Buyers and marketplace management use this login. Vendors and central staff have their own.
export default function MarketLogin() {
  const navigate = useNavigate()
  const { session, role, loading, signOut } = useAuth()
  const state = (useLocation().state as any)?.from as string | undefined
  const dest = (r: string) => {
    if (MARKET_STAFF_ROLES.includes(r)) return '/marketplace/admin'
    let saved = ''
    try { saved = sessionStorage.getItem('umeed_after_login') ?? ''; sessionStorage.removeItem('umeed_after_login') } catch { /* ignore */ }
    const from = state ?? saved
    return from.startsWith('/marketplace') && !from.startsWith('/marketplace/login') ? from : '/marketplace'
  }

  // already signed in (or just came back from Google) → go straight in
  useEffect(() => {
    if (session && role && ALLOWED.includes(role)) navigate(dest(role), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, role])

  if (loading) return <p className="p-10 text-center text-sm text-gray-500">Loading…</p>
  if (session && role && !ALLOWED.includes(role))
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">You are signed in with another account type</h1>
        <p className="mt-3 text-sm text-gray-600">To shop, sign out and use a buyer account.</p>
        <button onClick={() => signOut()} className="btn-red mt-6">Sign out</button>
      </div>
    )

  return (
    <LoginForm
      red signup google afterGoogle={state}
      allowed={ALLOWED}
      onSuccess={(r) => navigate(dest(r), { replace: true })}
      title="Welcome to Umeed Marketplace"
      subtitle="Sign in or create an account to shop and track your orders."
      logo={<MarketLogo className="h-20" />}
    />
  )
}
