import { Link } from 'react-router-dom'
import { navLinks } from '../data/site'
import { useSite } from '../context/SiteContext'
import Logo from './Logo'
import Icon from './Icon'

export default function Footer() {
  const { departments, setting } = useSite()
  const col = 'text-sm text-brand-100 hover:text-white'
  const socials = ['facebook', 'instagram', 'youtube', 'linkedin'].filter((k) => setting(k))
  return (
    <footer className="relative mt-24 bg-brand-900 text-brand-100">
      <div className="absolute inset-x-0 -top-px h-1 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="inline-block rounded-2xl bg-white px-3 py-2"><Logo className="h-16" /></div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200">{setting('footer_text', 'Building hope, empowering lives and creating opportunities through commerce, innovation, community support and global connections.')}</p>
        </div>
        <div>
          <h3 className="font-display text-lg text-white">Explore</h3>
          <ul className="mt-4 space-y-2.5">{navLinks.slice(1).map((l) => <li key={l.to}><Link to={l.to} className={col}>{l.label}</Link></li>)}</ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-white">Departments</h3>
          <ul className="mt-4 space-y-2.5">
            {departments.map((d) => (
              <li key={d.slug} className="flex items-center gap-2">
                <Link to={`/${d.slug}`} className={col}>{d.name}</Link>
                {d.status === 'Now open' && <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-300">Open</span>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-white">Get in touch</h3>
          <p className="mt-4 text-sm text-brand-200">Partnerships, business opportunities or general questions — send us a message.</p>
          {(setting('contact_email') || setting('contact_phone')) && <ul className="mt-3 space-y-1 text-sm text-brand-100"><li>{setting('contact_email')}</li><li>{setting('contact_phone')}</li></ul>}
          {socials.length > 0 && <div className="mt-3 flex flex-wrap gap-3 text-xs">{socials.map((k) => <a key={k} href={setting(k)} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 px-3 py-1 capitalize hover:bg-white/20">{k}</a>)}</div>}
          <Link to="/contact" className="btn mt-4 bg-gold-500 !py-2.5 text-brand-900 hover:bg-gold-400"><Icon name="mail" className="mr-2 h-4 w-4" />Contact Us</Link>
          <Link to="/management/login" className="mt-4 flex items-center gap-2 text-xs text-brand-200 hover:text-white"><Icon name="lock" className="h-3.5 w-3.5" />Central management login</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-brand-200 sm:flex-row">
          <span>© {new Date().getFullYear()} Umeed of Life. All rights reserved. &nbsp; Hope • Opportunity • Progress</span>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1 hover:text-white"><Icon name="up" className="h-4 w-4" />Back to top</button>
        </div>
      </div>
    </footer>
  )
}
