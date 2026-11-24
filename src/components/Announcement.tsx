import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import Icon from './Icon'

/** Site-wide announcement bar controlled from Dashboard → Site settings. */
export default function Announcement({ tone = 'green' }: { tone?: 'green' | 'red' }) {
  const { setting } = useSite()
  const text = setting('announcement_text')
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem('umeed_ann') === text } catch { return false } })
  if (setting('announcement_enabled') !== 'true' || !text || hidden) return null
  const link = setting('announcement_link')
  const body = <span>{text}{link && <Icon name="arrow" className="ml-1 inline h-3.5 w-3.5" />}</span>
  return (
    <div className={`relative animate-fade-in px-10 py-2 text-center text-sm font-medium text-white ${tone === 'red' ? 'bg-mred-600' : 'bg-brand-700'}`}>
      {link ? (link.startsWith('/') ? <Link to={link} className="hover:underline">{body}</Link> : <a href={link} className="hover:underline">{body}</a>) : body}
      <button aria-label="Dismiss" onClick={() => { setHidden(true); try { sessionStorage.setItem('umeed_ann', text) } catch { /* ignore */ } }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/20"><Icon name="close" className="h-4 w-4" /></button>
    </div>
  )
}
