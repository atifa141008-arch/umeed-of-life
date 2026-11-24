import { NavLink, Outlet } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../lib/format'

export type NavItem = { to: string; label: string; end?: boolean }

export default function DashShell({ title, nav, red, side }: { title: string; nav: NavItem[]; red?: boolean; side?: ReactNode }) {
  const { profile, session, signOut } = useAuth()
  const on = red ? 'bg-mred-600 text-white' : 'bg-brand-700 text-white'
  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="text-sm text-gray-500">
            {profile?.full_name || session?.user.email} • {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}
          </p>
        </div>
        <div className="flex gap-2">
          {side}
          <button onClick={() => signOut()} className={red ? 'btn-red-outline btn-sm' : 'btn-outline btn-sm'}>Sign out</button>
        </div>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-3">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${isActive ? on : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {n.label}
          </NavLink>
        ))}
      </div>
      <div className="mt-8"><Outlet /></div>
    </div>
  )
}
