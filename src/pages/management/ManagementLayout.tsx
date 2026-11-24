import { Suspense, useCallback, useEffect, useRef, useState, ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import { supabase } from '../../lib/supabase'
import { GROUPS, MODULES, ModuleDef } from '../../lib/permissions'
import { ROLE_LABELS } from '../../lib/format'
import Icon from '../../components/Icon'
import Logo from '../../components/Logo'
import MenuButton from '../../components/MenuButton'
import Drawer, { DrawerItem } from '../../components/Drawer'
import { PageSkeleton } from '../../components/ui'

const href = (m: ModuleDef) => (m.path ? `/management/${m.path}` : '/management')

function usePending() {
  const [c, setC] = useState<Record<string, number | null>>({})
  const load = useCallback(() => { supabase.rpc('pending_counts').then(({ data, error }) => { if (!error && data) setC(data as any) }) }, [])
  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    const v = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', v)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v) }
  }, [load])
  return c
}
const BADGE: Record<string, string> = { messages: 'messages', mp_applications: 'applications', mp_products: 'products', mp_orders: 'orders' }

function useOutside(ref: React.RefObject<HTMLElement>, on: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) on() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref, on])
}

function Palette({ mods, onClose }: { mods: ModuleDef[]; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const list = mods.filter((m) => `${m.label} ${m.group} ${m.desc}`.toLowerCase().includes(q.toLowerCase()))
  const go = (m?: ModuleDef) => { if (m) { nav(href(m)); onClose() } }
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="animate-pop w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          <Icon name="search" className="h-5 w-5 text-gray-400" />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setI(0) }} placeholder="Jump to…"
            className="h-14 flex-1 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)) }
              if (e.key === 'Enter') go(list[i])
            }} />
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {list.map((m, n) => (
            <li key={m.key}>
              <button onMouseEnter={() => setI(n)} onClick={() => go(m)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${n === i ? 'bg-brand-50 text-brand-800' : 'text-gray-700'}`}>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100"><Icon name={m.icon} className="h-4 w-4" /></span>
                <span className="flex-1"><b className="font-semibold">{m.label}</b><span className="block text-xs text-gray-500">{m.group || 'Dashboard'}</span></span>
                {n === i && <Icon name="arrow" className="h-4 w-4" />}
              </button>
            </li>
          ))}
          {!list.length && <li className="p-6 text-center text-sm text-gray-500">Nothing found.</li>}
        </ul>
      </div>
    </div>
  )
}

function NavItems({ mods, counts, collapsed, dark, onClick }: { mods: ModuleDef[]; counts: Record<string, number | null>; collapsed?: boolean; dark: boolean; onClick?: () => void }) {
  let i = 0
  const item = (m: ModuleDef) => {
    const n = counts[BADGE[m.key]] ?? 0
    const el = (
      <NavLink key={m.key} to={href(m)} end={m.path === ''} onClick={onClick} title={collapsed ? m.label : undefined}
        className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${dark
          ? isActive ? 'bg-white/10 text-white' : 'text-brand-100/80 hover:bg-white/5 hover:text-white'
          : isActive ? 'bg-brand-50 text-brand-800' : 'text-gray-700 hover:bg-gray-50'} ${collapsed ? 'justify-center' : ''}`}>
        {({ isActive }) => (
          <>
            <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold-400 transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'}`} />
            <Icon name={m.icon} className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="flex-1 truncate">{m.label}</span>}
            {n > 0 && (collapsed ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-400" /> : <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-gold-400 px-1.5 text-[11px] font-bold text-brand-900">{n}</span>)}
          </>
        )}
      </NavLink>
    )
    return dark ? el : <DrawerItem key={m.key} i={i++}>{el}</DrawerItem>
  }
  const top = mods.filter((m) => !m.group)
  return (
    <nav className="space-y-1" aria-label="Dashboard">
      {top.map(item)}
      {GROUPS.map((g) => {
        const list = mods.filter((m) => m.group === g)
        if (!list.length) return null
        return (
          <div key={g} className="pt-4">
            {!collapsed && <p className={`mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-brand-200/50' : 'text-gray-400'}`}>{g}</p>}
            {collapsed && <div className="mx-3 mb-2 border-t border-white/10" />}
            <div className="space-y-1">{list.map(item)}</div>
          </div>
        )
      })}
    </nav>
  )
}

export default function ManagementLayout() {
  const { profile, session, role, signOut } = useAuth()
  const { can } = usePermissions()
  const { pathname } = useLocation()
  const counts = usePending()
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('umeed_sb') === '1' } catch { return false } })
  const [mobile, setMobile] = useState(false)
  const [palette, setPalette] = useState(false)
  const [bell, setBell] = useState(false)
  const [menu, setMenu] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useOutside(bellRef, () => setBell(false)); useOutside(menuRef, () => setMenu(false))

  const mods = MODULES.filter((m) => can(m.key))
  const current = [...MODULES].reverse().find((m) => (m.path === '' ? pathname === '/management' : pathname.startsWith(href(m)))) ?? MODULES[0]
  const name = profile?.full_name || session?.user.email || 'Team'
  const hr = new Date().getHours()
  void hr

  useEffect(() => { setMobile(false); window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { try { localStorage.setItem('umeed_sb', collapsed ? '1' : '0') } catch { /* ignore */ } }, [collapsed])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  const alerts = [
    ['messages', 'New messages', 'messages'], ['applications', 'Vendor applications to review', 'applications'],
    ['products', 'Products waiting for review', 'products'], ['orders', 'New vendor orders', 'orders'],
  ] as const
  const total = alerts.reduce((s, [k]) => s + (counts[k] ?? 0), 0)

  const sidebarW = collapsed ? 'w-[76px]' : 'w-64'
  const Brand = ({ small }: { small?: boolean }) => small
    ? <span className="grid h-10 w-10 place-items-center rounded-xl bg-white font-display text-xl font-bold text-brand-800">U</span>
    : <div className="rounded-xl bg-white px-2 py-1"><Logo className="h-10" /></div>

  return (
    <div className="theme-central min-h-screen bg-gray-50 text-ink">
      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-gradient-to-b from-brand-900 to-brand-800 transition-[width] duration-300 lg:flex ${sidebarW}`}>
        <div className={`flex h-16 items-center border-b border-white/10 ${collapsed ? 'justify-center' : 'px-4'}`}><Brand small={collapsed} /></div>
        <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]"><NavItems mods={mods} counts={counts} collapsed={collapsed} dark /></div>
        <div className="space-y-1 border-t border-white/10 p-3">
          <a href="/" target="_blank" rel="noreferrer" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-100/80 hover:bg-white/5 hover:text-white ${collapsed ? 'justify-center' : ''}`} title="View website"><Icon name="external" className="h-[18px] w-[18px]" />{!collapsed && 'View website'}</a>
          <button onClick={() => setCollapsed(!collapsed)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-100/80 hover:bg-white/5 hover:text-white ${collapsed ? 'justify-center' : ''}`} aria-label="Collapse sidebar"><Icon name="panel" className="h-[18px] w-[18px]" />{!collapsed && 'Collapse'}</button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Drawer open={mobile} onClose={() => setMobile(false)} red={false} header={<Logo className="h-10" />}>
        <NavItems mods={mods} counts={counts} dark={false} onClick={() => setMobile(false)} />
      </Drawer>

      <div className={`transition-[padding] duration-300 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="lg:hidden"><MenuButton red={false} open={mobile} onClick={() => setMobile(!mobile)} /></div>
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">Central Management{current.group ? ` / ${current.group}` : ''}</p>
            <h1 className="truncate font-display text-lg font-bold leading-tight text-brand-900">{current.label}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setPalette(true)} className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 transition hover:border-brand-500 sm:flex">
              <Icon name="search" className="h-4 w-4" />Quick jump<kbd className="rounded bg-white px-1.5 text-[10px] ring-1 ring-gray-200">Ctrl K</kbd>
            </button>
            <button onClick={() => setPalette(true)} className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-gray-100 sm:hidden" aria-label="Search"><Icon name="search" /></button>

            <div ref={bellRef} className="relative">
              <button onClick={() => { setBell(!bell); setMenu(false) }} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full text-gray-600 transition hover:bg-gray-100">
                <Icon name="bell" />
                {total > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-[1rem] animate-pop place-items-center rounded-full bg-mred-600 px-1 text-[10px] font-bold text-white">{total}</span>}
              </button>
              {bell && (
                <div className="animate-pop absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
                  <p className="border-b border-gray-100 px-4 py-3 text-sm font-bold">Needs your attention</p>
                  {alerts.filter(([k]) => counts[k] != null).length === 0 && <p className="p-5 text-center text-sm text-gray-500">Nothing to show for your role.</p>}
                  {alerts.filter(([k]) => counts[k] != null).map(([k, label, to]) => (
                    <Link key={k} to={`/management/${to}`} onClick={() => setBell(false)} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
                      <span>{label}</span><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${(counts[k] ?? 0) > 0 ? 'bg-gold-100 text-gold-600' : 'bg-gray-100 text-gray-400'}`}>{counts[k]}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div ref={menuRef} className="relative">
              <button onClick={() => { setMenu(!menu); setBell(false) }} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-gray-100">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">{name[0]?.toUpperCase()}</span>
                <span className="hidden text-left leading-tight md:block"><span className="block max-w-[9rem] truncate text-sm font-semibold">{name}</span><span className="block text-[11px] text-gray-500">{ROLE_LABELS[role ?? ''] ?? role}</span></span>
              </button>
              {menu && (
                <div className="animate-pop absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-gray-200">
                  <div className="px-3 py-2"><p className="truncate text-sm font-semibold">{name}</p><p className="truncate text-xs text-gray-500">{profile?.email}</p></div>
                  <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50"><Icon name="globe" className="h-4 w-4" />View website</a>
                  <a href="/marketplace" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50"><Icon name="store" className="h-4 w-4" />View marketplace</a>
                  <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"><Icon name="logout" className="h-4 w-4" />Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <p className="mb-6 max-w-3xl text-sm text-gray-600">{current.desc}</p>
          <Suspense fallback={<PageSkeleton />}><div key={pathname} className="animate-fade-in"><Outlet /></div></Suspense>
        </main>
      </div>

      {palette && <Palette mods={mods} onClose={() => setPalette(false)} />}
    </div>
  )
}
export type { ReactNode }
