import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { navLinks } from '../data/site'
import Logo from './Logo'
import Icon from './Icon'
import MenuButton from './MenuButton'
import Drawer, { DrawerItem } from './Drawer'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { isManagement } = useAuth()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const link = ({ isActive }: { isActive: boolean }) =>
    `relative py-2 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gold-500 after:transition-transform after:duration-300 hover:text-brand-700 hover:after:scale-x-100 ${isActive ? 'text-brand-700 after:scale-x-100' : 'text-gray-700 after:scale-x-0'}`

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
        <div className="container-x flex h-[4.5rem] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="lg:hidden"><MenuButton red={false} open={open} onClick={() => setOpen(!open)} /></div>
            <Logo className="h-12 lg:h-14" />
          </div>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {navLinks.map((l) => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={link}>{l.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-2">
            <Link to={isManagement ? '/management' : '/management/login'} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 xl:flex"><Icon name="lock" className="h-4 w-4" />{isManagement ? 'Dashboard' : 'Staff login'}</Link>
            <Link to="/marketplace" className="btn !px-4 !py-2.5 bg-mred-600 text-white hover:bg-mred-700 sm:!px-5"><Icon name="store" className="mr-2 hidden h-4 w-4 sm:block" />Marketplace</Link>
          </div>
        </div>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} red={false} header={<Logo className="h-11" />}>
        {navLinks.map((l, i) => (
          <DrawerItem key={l.to} i={i}>
            <NavLink to={l.to} end={l.to === '/'} className={({ isActive }) => `block rounded-xl px-3 py-3 text-[15px] font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>{l.label}</NavLink>
          </DrawerItem>
        ))}
        <DrawerItem i={navLinks.length}>
          <div className="mt-5 space-y-2 border-t border-gray-100 pt-5">
            <Link to="/marketplace" className="btn w-full bg-mred-600 text-white">Shop on Marketplace</Link>
            <Link to={isManagement ? '/management' : '/management/login'} className="btn-outline w-full"><Icon name="lock" className="mr-2 h-4 w-4" />{isManagement ? 'Management Dashboard' : 'Central Management Login'}</Link>
          </div>
        </DrawerItem>
      </Drawer>
    </>
  )
}
