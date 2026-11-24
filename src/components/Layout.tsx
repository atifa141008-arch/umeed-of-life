import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Announcement from './Announcement'
import { scrollToHash } from '../lib/scrollToHash'

export default function Layout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!(hash && scrollToHash(hash))) window.scrollTo(0, 0)
  }, [pathname, hash])
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-full bg-brand-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      <Announcement />
      <Header />
      <main id="main" key={pathname} className="animate-fade-in"><Outlet /></main>
      <Footer />
    </>
  )
}
