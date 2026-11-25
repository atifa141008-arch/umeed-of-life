import { ReactNode } from 'react'
import Icon from '../../components/Icon'

/** Small building blocks shared by the marketplace admin pages (they render in the red marketplace
 *  shell and inside the green central dashboard, so accents use the acc-* helper classes). */

export function Chips({ value, onChange, items }: { value: string; onChange: (k: string) => void; items: [string, string, number?][] }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map(([k, l, n]) => (
        <button key={k} onClick={() => onChange(k)}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${value === k ? 'acc-solid' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
          {l}{n != null && <span className={`rounded-full px-1.5 text-[11px] ${value === k ? 'bg-white/25' : 'bg-gray-100 text-gray-500'}`}>{n}</span>}
        </button>))}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="input !rounded-full !py-2.5 !pl-10" />
    </div>
  )
}

const TONE: Record<string, string> = { amber: 'bg-amber-100 text-amber-700', green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', gray: 'bg-gray-100 text-gray-600', red: 'bg-red-100 text-red-700' }
export function Stat({ label, value, icon, tone = 'gray' }: { label: string; value: ReactNode; icon: string; tone?: keyof typeof TONE }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE[tone]}`}><Icon name={icon} className="h-5 w-5" /></span>
      <div className="min-w-0"><p className="truncate text-xs text-gray-500">{label}</p><p className="font-sans text-xl font-bold leading-tight text-ink">{value}</p></div>
    </div>
  )
}

export function Avatar({ name, src, size = 'h-10 w-10' }: { name: string; src?: string | null; size?: string }) {
  if (src) return <img src={src} alt="" className={`${size} shrink-0 rounded-xl object-cover ring-1 ring-gray-200`} />
  const t = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  return <span className={`${size} grid shrink-0 place-items-center rounded-xl acc-soft font-sans text-sm font-bold`}>{t}</span>
}

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>
)
