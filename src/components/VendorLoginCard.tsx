import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { ErrorNote } from './ui'

const B = '/marketplace/vendor'

/** Compact vendor sign-in shown on the vendor landing page. Only vendors / applicants can sign in here. */
export default function VendorLoginCard() {
  const { session, role, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const r = await signIn(String(f.get('email')).trim(), String(f.get('password')))
    if (r.error) { setBusy(false); return setError(r.error) }
    if (r.role !== 'vendor' && r.role !== 'applicant') {
      await signOut(); setBusy(false)
      return setError('This is the vendor login. Use the correct login page for your account type.')
    }
    setBusy(false)
    navigate(r.role === 'vendor' ? `${B}/dashboard` : `${B}/application-status`)
  }

  return (
    <div id="vendor-login" className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-peach-200 sm:p-8">
      {session && (role === 'vendor' || role === 'applicant') ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">{role === 'vendor' ? 'Your store dashboard is ready.' : 'Check the progress of your application.'}</p>
          <Link to={role === 'vendor' ? `${B}/dashboard` : `${B}/application-status`} className="btn-red mt-5 w-full">{role === 'vendor' ? 'Go to dashboard' : 'View application status'}</Link>
        </div>
      ) : session ? (
        <div className="text-center">
          <h2 className="text-xl font-bold">Signed in with another account</h2>
          <p className="mt-2 text-sm text-gray-600">Sign out to use your vendor login.</p>
          <button onClick={() => signOut()} className="btn-red mt-5 w-full">Sign out</button>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold">Vendor login</h2>
          <p className="mt-1 text-sm text-gray-500">For approved vendors and applicants.</p>
          {!isSupabaseConfigured && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Supabase is not connected yet.</p>}
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="username" className="input mt-1" /></label>
            <label className="block text-sm font-medium">Password<input name="password" type="password" required autoComplete="current-password" className="input mt-1" /></label>
            {error && <ErrorNote>{error}</ErrorNote>}
            <button className="btn-red w-full" disabled={busy || !isSupabaseConfigured}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">New here? <Link to={`${B}/apply`} className="font-semibold text-mred-600">Become a Vendor</Link></p>
        </>
      )}
    </div>
  )
}
