import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ROLE_LABELS } from '../lib/format'
import Icon from './Icon'

export type AdminNavItem = { to: string; label: string; icon: string; desc: string; end?: boolean; badge?: string }

/** Marketplace staff dashboard frame: sidebar on desktop, scrollable tabs on mobile. */
export default function AdminDashShell({ nav }: { nav: AdminNavItem[] }) {
  const { profile, session, role, signOut } = useAuth()
  const { pathname } = useLocation()
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  useEffect(() => {
    const load = () => supabase.rpc('pending_counts').then(({ data, error }) => { if (!error && data) setCounts(data as any) })
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [pathname])

  const current = [...nav].reverse().find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to))) ?? nav[0]
  const name = profile?.full_name || session?.user.email || 'Team'

  const item = (n: AdminNavItem, mobile?: boolean) => {
    const c = n.badge ? counts[n.badge] ?? 0 : 0
    return (
      <NavLink key={n.to} to={n.to} end={n.end}
        className={({ isActive }) => mobile
          ? `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-mred-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'}`
          : `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-peach-100 text-mred-700' : 'text-gray-600 hover:bg-gray-50 hover:text-ink'}`}>
        <Icon name={n.icon} className="h-[18px] w-[18px]" /><span>{n.label}</span>
        {c > 0 && <span className="ml-auto rounded-full bg-mred-600 px-2 py-0.5 text-[11px] font-bold leading-none text-white">{c}</span>}
      </NavLink>
    )
  }

  return (
    <div className="bg-gray-50/70">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:px-6 lg:py-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mred-600 font-sans text-lg font-bold text-white">{name[0]?.toUpperCase()}</span>
              <div className="min-w-0"><p className="truncate font-sans text-[15px] font-bold text-ink">{name}</p><p className="text-xs text-gray-500">{ROLE_LABELS[role ?? ''] ?? role}</p></div>
            </div>
            <p className="mt-4 hidden px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:block">Marketplace management</p>
            <nav className="mt-2 hidden space-y-1 lg:block" aria-label="Marketplace management">{nav.map((n) => item(n))}</nav>
            <div className="mt-4 hidden border-t border-gray-100 pt-3 lg:block">
              <Link to="/marketplace" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-gray-50"><Icon name="external" className="h-4 w-4" />View marketplace</Link>
              <button onClick={() => signOut()} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-mred-700"><Icon name="logout" className="h-4 w-4" />Sign out</button>
            </div>
          </div>
          <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Marketplace management">
            {nav.map((n) => item(n, true))}
            <button onClick={() => signOut()} className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200"><Icon name="logout" className="h-[18px] w-[18px]" />Sign out</button>
          </nav>
        </aside>
        <div className="min-w-0">
          {current && <div className="mb-6"><h1 className="text-2xl font-bold text-ink md:text-[1.7rem]">{current.label}</h1><p className="mt-1 text-sm text-gray-500">{current.desc}</p></div>}
          <div key={pathname} className="animate-fade-in"><Outlet /></div>
        </div>
      </div>
    </div>
  )
}
