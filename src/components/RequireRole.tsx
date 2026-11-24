import { Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

/** Only lets the listed roles in. Everyone else is sent to the right login page. */
export default function RequireRole({ roles, loginPath, children }: { roles: string[]; loginPath: string; children: ReactNode }) {
  const { session, role, loading, signOut } = useAuth()
  const loc = useLocation()
  if (loading) return <Spinner />
  if (!session) return <Navigate to={loginPath} replace state={{ from: loc.pathname }} />
  if (!role || !roles.includes(role))
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Access not granted</h1>
        <p className="mt-3 text-sm text-gray-600">
          This account cannot open this area. Sign out and use the correct login page.
        </p>
        <button onClick={async () => { await signOut() }} className="btn-primary mt-6">Sign out</button>
      </div>
    )
  return <>{children}</>
}
