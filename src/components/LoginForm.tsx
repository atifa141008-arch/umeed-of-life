import { FormEvent, ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { ErrorNote } from './ui'

type Props = {
  allowed: string[]            // roles allowed to sign in on this page
  onSuccess: (role: string) => void
  title: string
  subtitle?: string
  logo?: ReactNode
  signup?: boolean             // buyer "Create account" tab with extra fields
  google?: boolean             // "Continue with Google"
  afterGoogle?: string         // where to go after returning from Google
  red?: boolean                // marketplace colours
  footer?: ReactNode
}

const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
)

export default function LoginForm({ allowed, onSuccess, title, subtitle, logo, signup, google, afterGoogle, red, footer }: Props) {
  const { signIn, signUp, signInWithGoogle, signOut } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const btn = red ? 'btn-red' : 'btn-primary'

  const goGoogle = async () => {
    setError('')
    try { sessionStorage.setItem('umeed_after_login', afterGoogle ?? '/marketplace') } catch { /* ignore */ }
    const err = await signInWithGoogle('/marketplace/login')
    if (err) setError(err)
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email')).trim()
    const password = String(f.get('password'))
    setError(''); setInfo('')

    if (mode === 'up') {
      if (password !== String(f.get('confirm'))) return setError('The two passwords do not match.')
      setBusy(true)
      const r = await signUp(email, password, String(f.get('name')).trim(), {
        phone: String(f.get('phone') ?? '').trim(), city: String(f.get('city') ?? '').trim(), address: String(f.get('address') ?? '').trim(),
      }, '/marketplace/login')
      setBusy(false)
      if (r.error) return setError(r.error)
      if (r.hasSession) return onSuccess('customer')
      return setInfo('Account created. Check your email to confirm it, then sign in.')
    }

    setBusy(true)
    const r = await signIn(email, password)
    if (r.error) { setBusy(false); return setError(r.error) }
    if (!r.role || !allowed.includes(r.role)) {
      await signOut()
      setBusy(false)
      return setError('This account cannot sign in on this page. Use the login page meant for your account type.')
    }
    setBusy(false)
    onSuccess(r.role)
  }

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg items-center px-5 py-12">
      <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {logo && <div className="flex justify-center">{logo}</div>}
        <h1 className="mt-4 text-center text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-gray-500">{subtitle}</p>}

        {signup && (
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-gray-100 p-1 text-sm font-semibold">
            {(['in', 'up'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); setInfo('') }}
                className={`rounded-full py-2 transition ${mode === m ? 'bg-white shadow' : 'text-gray-500'}`}>
                {m === 'in' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
        )}

        {!isSupabaseConfigured && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Supabase is not connected yet. Add your keys to the .env file to enable sign in.</p>
        )}

        {google && (
          <>
            <button type="button" onClick={goGoogle} disabled={!isSupabaseConfigured}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50">
              <GoogleG />Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-gray-400"><span className="h-px flex-1 bg-gray-200" />or use your email<span className="h-px flex-1 bg-gray-200" /></div>
          </>
        )}

        <form onSubmit={submit} className={`space-y-4 ${google ? '' : 'mt-5'}`}>
          {mode === 'up' && (
            <>
              <label className="block text-sm font-medium">Full name
                <input name="name" required minLength={2} className="input mt-1" autoComplete="name" />
              </label>
            </>
          )}
          <label className="block text-sm font-medium">Email
            <input name="email" type="email" required autoComplete="username" className="input mt-1" />
          </label>
          {mode === 'up' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Mobile number
                  <input name="phone" type="tel" required pattern="[+0-9][0-9 \-]{8,15}" title="Enter a valid phone number, e.g. 0300 1234567" placeholder="03XX XXXXXXX" className="input mt-1" autoComplete="tel" />
                </label>
                <label className="block text-sm font-medium">City
                  <input name="city" required className="input mt-1" autoComplete="address-level2" />
                </label>
              </div>
              <label className="block text-sm font-medium">Delivery address <span className="font-normal text-gray-400">(optional)</span>
                <input name="address" className="input mt-1" autoComplete="street-address" />
              </label>
            </>
          )}
          <div className={mode === 'up' ? 'grid gap-4 sm:grid-cols-2' : ''}>
            <label className="block text-sm font-medium">Password{mode === 'up' && <span className="font-normal text-gray-400"> (8+ characters)</span>}
              <input name="password" type="password" required minLength={mode === 'up' ? 8 : 1}
                autoComplete={mode === 'up' ? 'new-password' : 'current-password'} className="input mt-1" />
            </label>
            {mode === 'up' && (
              <label className="block text-sm font-medium">Confirm password
                <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input mt-1" />
              </label>
            )}
          </div>
          {mode === 'up' && (
            <label className="flex items-start gap-3 text-xs text-gray-600">
              <input type="checkbox" required className="mt-0.5" />
              <span>I agree to the <Link to="/marketplace/terms" className="font-semibold text-mred-600 underline">Terms</Link> and <Link to="/marketplace/privacy" className="font-semibold text-mred-600 underline">Privacy notice</Link>.</span>
            </label>
          )}
          {error && <ErrorNote>{error}</ErrorNote>}
          {info && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{info}</p>}
          <button className={`${btn} w-full`} disabled={busy || !isSupabaseConfigured}>
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        {footer && <div className="mt-5 text-center text-sm text-gray-500">{footer}</div>}
      </div>
    </div>
  )
}
