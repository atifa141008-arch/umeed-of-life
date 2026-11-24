import { FormEvent, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import MarketLogo from './MarketLogo'
import Icon from './Icon'
import MenuButton from './MenuButton'
import Drawer, { DrawerItem } from './Drawer'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import { MARKET_STAFF_ROLES, Row } from '../lib/format'
import { defaultCategories } from '../data/market'
import { usePageTitle } from '../lib/usePageTitle'
import Announcement from './Announcement'
import { useSite } from '../context/SiteContext'
import { useRows } from './ui'

const links = [
  { to: '/marketplace', label: 'Home', icon: 'home', end: true },
  { to: '/marketplace/categories', label: 'Categories', icon: 'apps' },
  { to: '/marketplace/shop', label: 'Shop', icon: 'bag' },
  { to: '/marketplace/vendors', label: 'Stores', icon: 'store' },
  { to: '/marketplace/about', label: 'About Us', icon: 'info' },
]

function SearchBox({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    navigate(`/marketplace/shop${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }
  return (
    <form onSubmit={submit} role="search" className={`flex overflow-hidden rounded-full border-2 border-mred-600 bg-white ${className}`}>
      <input name="q" placeholder="Search in Umeed Marketplace" aria-label="Search products" className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none" />
      <button aria-label="Search" className="grid w-12 place-items-center bg-mred-600 text-white hover:bg-mred-700"><Icon name="search" className="h-5 w-5" /></button>
    </form>
  )
}

export default function MarketplaceLayout() {
  const { session, profile, role, signOut, isManagement } = useAuth()
  const { setting } = useSite()
  const { count } = useCart()
  const { pathname } = useLocation()
  usePageTitle(undefined, 'Umeed Marketplace')
  const [open, setOpen] = useState(false)
  const cats = useRows(() => supabase.from('categories').select('slug,name').eq('active', true).order('sort_order'))
  const categories: Row[] = cats.data.length ? cats.data : defaultCategories

  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])

  const isStaff = !!role && MARKET_STAFF_ROLES.includes(role)
  const closed = setting('marketplace_enabled') === 'false' && !(isStaff || isManagement) && !pathname.startsWith('/marketplace/login')
  const firstName = profile?.full_name?.split(' ')[0] || 'Account'
  const navCls = ({ isActive }: { isActive: boolean }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-mred-600 text-white' : 'text-gray-700 hover:bg-peach-100'}`

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-16 lg:pb-0">
      <Announcement tone="red" />
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="hidden bg-mred-700 text-xs text-peach-100 lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
            <span>A marketplace by Umeed of Life</span>
            <Link to="/" className="hover:text-white">Visit Umeed of Life →</Link>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 lg:gap-8 lg:px-4">
          <div className="lg:hidden"><MenuButton open={open} onClick={() => setOpen(!open)} /></div>
          <MarketLogo className="h-12 lg:h-16" />
          <SearchBox className="hidden flex-1 lg:flex" />

          <div className="ml-auto flex items-center gap-1 lg:gap-5">
            <div className="hidden items-center gap-3 lg:flex">
              {session ? (
                <>
                  {isStaff
                    ? <Link to="/marketplace/admin" className="flex items-center gap-2 text-sm font-semibold text-mred-600"><Icon name="shield" /> Dashboard</Link>
                    : role === 'customer' && <Link to="/marketplace/account" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-mred-600"><span className="grid h-9 w-9 place-items-center rounded-full bg-peach-100 font-bold text-mred-700">{firstName[0]?.toUpperCase()}</span>Hi, {firstName}</Link>}
                  <button onClick={() => signOut()} className="text-sm text-gray-500 hover:text-mred-600">Sign out</button>
                </>
              ) : (
                <Link to="/marketplace/login" className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-mred-600"><Icon name="user" className="h-6 w-6" /><span className="leading-tight"><span className="block text-[11px] font-normal text-gray-500">Welcome</span>Sign in / Register</span></Link>
              )}
            </div>
            <Link to="/marketplace/cart" aria-label={`Cart, ${count} items`} className="relative grid h-11 w-11 place-items-center rounded-full text-gray-800 hover:bg-peach-100">
              <Icon name="cart" className="h-6 w-6" />
              {count > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-mred-600 px-1 text-[11px] font-bold text-white">{count}</span>}
            </Link>
          </div>
        </div>

        <div className="px-3 pb-2.5 lg:hidden"><SearchBox /></div>

        <nav className="hidden border-t border-peach-200 bg-peach-50 lg:block" aria-label="Marketplace">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1.5">
            <NavLink to="/marketplace" end className={navCls}>Home</NavLink>
            <div className="group relative">
              <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-peach-100 group-hover:bg-peach-100">Categories <Icon name="down" className="h-4 w-4 transition group-hover:rotate-180" /></button>
              <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-2 rounded-2xl bg-white p-2 opacity-0 shadow-xl ring-1 ring-peach-200 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {categories.map((c) => <Link key={c.slug} to={`/marketplace/shop?category=${c.slug}`} className="block rounded-xl px-4 py-2 text-sm text-gray-700 hover:bg-peach-100 hover:text-mred-700">{c.name}</Link>)}
              </div>
            </div>
            <NavLink to="/marketplace/shop" className={navCls}>Shop</NavLink>
            <NavLink to="/marketplace/vendors" className={navCls}>Stores</NavLink>
            <NavLink to="/marketplace/about" className={navCls}>About Us</NavLink>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <Drawer open={open} onClose={() => setOpen(false)} header={<MarketLogo className="h-11" />}>
        <DrawerItem i={0}>
          <div className="mb-4 rounded-2xl bg-peach-50 p-4">
            {session && role === 'customer' ? (
              <Link to="/marketplace/account" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-mred-600 font-bold text-white">{firstName[0]?.toUpperCase()}</span><span><b className="block">Hi, {firstName}</b><span className="text-xs text-gray-500">My orders & details</span></span></Link>
            ) : session && isStaff ? (
              <Link to="/marketplace/admin" className="flex items-center gap-3 font-semibold text-mred-700"><Icon name="shield" /> Marketplace dashboard</Link>
            ) : (
              <Link to="/marketplace/login" className="btn-red w-full">Sign in / Register</Link>
            )}
          </div>
        </DrawerItem>
        {links.map((l, i) => (
          <DrawerItem key={l.to} i={i + 1}>
            <NavLink to={l.to} end={l.end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium ${isActive ? 'bg-peach-100 text-mred-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Icon name={l.icon} className="h-5 w-5" />{l.label}
            </NavLink>
          </DrawerItem>
        ))}
        <DrawerItem i={links.length + 1}><p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Categories</p></DrawerItem>
        {categories.map((c, i) => (
          <DrawerItem key={c.slug} i={links.length + 2 + i}>
            <Link to={`/marketplace/shop?category=${c.slug}`} className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">{c.name}</Link>
          </DrawerItem>
        ))}
        <DrawerItem i={links.length + categories.length + 2}>
          <div className="mt-5 space-y-1 border-t border-gray-100 pt-4 text-sm text-gray-500">
            <Link to="/marketplace/returns" className="block px-3 py-2">Returns</Link>
            <Link to="/" className="block px-3 py-2">Umeed of Life</Link>
            {session && <button onClick={() => { signOut(); setOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-mred-600"><Icon name="logout" className="h-4 w-4" /> Sign out</button>}
          </div>
        </DrawerItem>
      </Drawer>

      <main className="flex-1">{closed ? (
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-peach-100 text-mred-600"><Icon name="clock" className="h-8 w-8" /></span>
          <h1 className="mt-5 text-3xl font-bold">Umeed Marketplace is temporarily closed</h1>
          <p className="mt-3 text-gray-600">We will be back soon. Thank you for your patience.</p>
          <Link to="/" className="btn-red mt-6">Visit Umeed of Life</Link>
        </div>
      ) : <Outlet />}</main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-peach-200 bg-white/95 backdrop-blur lg:hidden" aria-label="Quick navigation">
        {[['/marketplace', 'Home', 'home', true], ['/marketplace/categories', 'Categories', 'apps', false], ['/marketplace/cart', 'Cart', 'cart', false], [session ? (isStaff ? '/marketplace/admin' : '/marketplace/account') : '/marketplace/login', session ? 'Account' : 'Sign in', 'user', false]].map(([to, label, icon, end]) => (
          <NavLink key={String(to)} to={String(to)} end={!!end} className={({ isActive }) => `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-mred-600' : 'text-gray-500'}`}>
            <Icon name={String(icon)} className="h-5 w-5" />{label}
            {icon === 'cart' && count > 0 && <span className="absolute right-[28%] top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-mred-600 px-1 text-[10px] text-white">{count}</span>}
          </NavLink>
        ))}
      </nav>

      <footer className="mt-16 bg-peach-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3">
          <div><MarketLogo className="h-20" /><p className="mt-3 text-sm text-gray-600">Part of Umeed of Life</p></div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><Link to="/marketplace/categories" className="hover:text-mred-600">Categories</Link></li>
            <li><Link to="/marketplace/shop" className="hover:text-mred-600">Products</Link></li>
            <li><Link to="/marketplace/about" className="hover:text-mred-600">About Us</Link></li>
            <li><Link to="/" className="hover:text-mred-600">Umeed of Life</Link></li>
          </ul>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><Link to="/marketplace/returns" className="hover:text-mred-600">Returns</Link></li>
            <li><Link to="/marketplace/terms" className="hover:text-mred-600">Terms</Link></li>
            <li><Link to="/marketplace/privacy" className="hover:text-mred-600">Privacy</Link></li>
          </ul>
        </div>
        <p className="border-t border-peach-200 py-4 text-center text-xs text-gray-600">© {new Date().getFullYear()} Umeed of Life</p>
      </footer>
    </div>
  )
}
