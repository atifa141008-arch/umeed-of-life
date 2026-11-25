import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import MarketLogo from './MarketLogo'
import MenuButton from './MenuButton'
import Drawer, { DrawerItem } from './Drawer'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../lib/usePageTitle'
import { scrollToHash } from '../lib/scrollToHash'

const ANCHORS = [['Benefits', 'benefits'], ['How it works', 'how-it-works'], ['Requirements', 'requirements'], ['Fees', 'fees'], ['FAQs', 'faqs']]
const B = '/marketplace/vendor'

// Wrapper for everything under /marketplace/vendor — same peach + red theme as the marketplace,
// but a separate area (the shopping pages never link here).
export default function VendorShell() {
  const { role } = useAuth()
  const { pathname, hash } = useLocation()
  const [open, setOpen] = useState(false)
  usePageTitle('Vendors', 'Umeed Marketplace')
  const landing = pathname === B

  useEffect(() => {
    setOpen(false)
    if (hash && /^#[A-Za-z][\w-]*$/.test(hash)) { const t = setTimeout(() => scrollToHash(hash), 60); return () => clearTimeout(t) }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  const action = role === 'vendor' ? { to: `${B}/dashboard`, label: 'Dashboard' }
    : role === 'applicant' ? { to: `${B}/application-status`, label: 'My application' } : null

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-peach-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 lg:px-4">
          <div className="lg:hidden"><MenuButton open={open} onClick={() => setOpen(!open)} /></div>
          <MarketLogo to={B} className="h-12 lg:h-14" />
          <span className="hidden rounded-full bg-peach-100 px-3 py-1 text-xs font-semibold text-mred-700 sm:inline">Vendors</span>

          {landing && (
            <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Vendor page sections">
              {ANCHORS.map(([l, id]) => <Link key={id} to={`${B}#${id}`} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-peach-100">{l}</Link>)}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Link to="/marketplace" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-peach-100 xl:flex"><Icon name="store" className="h-4 w-4" />Marketplace</Link>
            <Link to="/" className="hidden rounded-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-peach-100 xl:block">Umeed of Life</Link>
            {action ? <Link to={action.to} className="btn-red btn-sm !py-2.5">{action.label}</Link> : (
              <>
                <Link to={`${B}/login`} className="btn-red-outline btn-sm hidden !py-2.5 sm:inline-flex">Vendor login</Link>
                <Link to={`${B}/apply`} className="btn-red btn-sm !py-2.5">Become a Vendor</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} header={<MarketLogo to={B} className="h-11" />}>
        {ANCHORS.map(([l, id], i) => (
          <DrawerItem key={id} i={i}><Link to={`${B}#${id}`} className="block rounded-xl px-3 py-3 text-[15px] font-medium text-gray-700 hover:bg-gray-50">{l}</Link></DrawerItem>
        ))}
        <DrawerItem i={ANCHORS.length}>
          <div className="mt-5 space-y-2 border-t border-gray-100 pt-5">
            {action ? <Link to={action.to} className="btn-red w-full">{action.label}</Link> : (
              <>
                <Link to={`${B}/apply`} className="btn-red w-full">Become a Vendor</Link>
                <Link to={`${B}/login`} className="btn-red-outline w-full">Vendor login</Link>
              </>
            )}
            <Link to="/marketplace" className="flex items-center justify-center gap-2 pt-3 text-sm text-gray-500"><Icon name="store" className="h-4 w-4" />Visit Marketplace</Link>
            <Link to="/" className="flex items-center justify-center gap-2 text-sm text-gray-500"><Icon name="globe" className="h-4 w-4" />Umeed of Life website</Link>
          </div>
        </DrawerItem>
      </Drawer>

      <main className="flex-1"><Outlet /></main>

      {!pathname.startsWith(`${B}/dashboard`) && <footer className="bg-peach-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-gray-600 sm:flex-row">
          <MarketLogo to={B} className="h-14" />
          <div className="flex gap-5"><Link to="/marketplace" className="hover:text-mred-600">Visit Marketplace</Link><Link to="/" className="hover:text-mred-600">Umeed of Life</Link></div>
          <span className="text-xs">© {new Date().getFullYear()} Umeed of Life</span>
        </div>
      </footer>}
    </div>
  )
}
