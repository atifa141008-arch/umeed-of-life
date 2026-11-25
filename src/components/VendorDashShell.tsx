import { Link, NavLink, Outlet } from 'react-router-dom'
import { Row } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useRows, StatusBadge } from './ui'
import Icon from './Icon'

const B = '/marketplace/vendor/dashboard'
const NAV = [
  { to: B, label: 'Overview', icon: 'chart', end: true },
  { to: `${B}/products`, label: 'Products', icon: 'package' },
  { to: `${B}/orders`, label: 'Orders', icon: 'bag', badge: true },
  { to: `${B}/finance`, label: 'Finance', icon: 'wallet' },
  { to: `${B}/store`, label: 'Store profile', icon: 'store' },
]

/** Vendor-only dashboard frame: sidebar on desktop, scrollable tab bar on mobile. */
export default function VendorDashShell({ vendor }: { vendor: Row }) {
  const { profile, session, signOut } = useAuth()
  const orders = useRows(() => supabase.from('vendor_orders').select('id,status'))
  const fresh = orders.data.filter((o: Row) => o.status === 'new').length
  const name = profile?.full_name || session?.user.email || ''

  const item = (n: (typeof NAV)[number], mobile?: boolean) => (
    <NavLink key={n.to} to={n.to} end={n.end}
      className={({ isActive }) => mobile
        ? `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-mred-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'}`
        : `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-peach-100 text-mred-700' : 'text-gray-600 hover:bg-gray-50 hover:text-ink'}`}>
      <Icon name={n.icon} className="h-[18px] w-[18px]" />
      <span>{n.label}</span>
      {n.badge && fresh > 0 && <span className="ml-auto rounded-full bg-mred-600 px-2 py-0.5 text-[11px] font-bold leading-none text-white">{fresh}</span>}
    </NavLink>
  )

  return (
    <div className="bg-gray-50/70">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:px-6 lg:py-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {vendor.logo_url
                ? <img src={vendor.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-gray-200" />
                : <span className="grid h-12 w-12 place-items-center rounded-xl bg-mred-600 font-sans text-lg font-bold text-white">{(vendor.store_name ?? 'S')[0].toUpperCase()}</span>}
              <div className="min-w-0">
                <p className="truncate font-sans text-[15px] font-bold text-ink">{vendor.store_name}</p>
                <div className="mt-1 flex items-center gap-2"><StatusBadge s={vendor.status} /><span className="truncate text-xs text-gray-400">{vendor.commission_rate}% fee</span></div>
              </div>
            </div>
            <nav className="mt-4 hidden space-y-1 border-t border-gray-100 pt-4 lg:block" aria-label="Vendor dashboard">{NAV.map((n) => item(n))}</nav>
            <div className="mt-4 hidden border-t border-gray-100 pt-4 lg:block">
              <p className="truncate text-xs font-semibold text-gray-700">{name}</p>
              <p className="mb-3 truncate text-xs text-gray-400">{session?.user.email}</p>
              <Link to="/marketplace" className="mb-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-gray-50"><Icon name="external" className="h-4 w-4" />View marketplace</Link>
              <button onClick={() => signOut()} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-mred-700"><Icon name="logout" className="h-4 w-4" />Sign out</button>
            </div>
          </div>
          <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Vendor dashboard">
            {NAV.map((n) => item(n, true))}
            <button onClick={() => signOut()} className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200"><Icon name="logout" className="h-[18px] w-[18px]" />Sign out</button>
          </nav>
        </aside>
        <div className="min-w-0 animate-fade-in"><Outlet /></div>
      </div>
    </div>
  )
}
