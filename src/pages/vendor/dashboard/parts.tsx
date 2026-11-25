import { ReactNode } from 'react'
import Icon from '../../../components/Icon'

/** Small presentational pieces shared by the vendor dashboard pages only. */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink md:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className = '', pad = true }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
          <h2 className="font-sans text-[15px] font-bold text-ink">{title}</h2>{action}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

const TONES: Record<string, string> = {
  red: 'bg-mred-600/10 text-mred-600', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700', gray: 'bg-gray-100 text-gray-600',
}
export function Kpi({ label, value, icon, tone = 'red', hint }: { label: string; value: ReactNode; icon: string; tone?: keyof typeof TONES; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${TONES[tone]}`}><Icon name={icon} className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-ink sm:text-[1.65rem]">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-peach-100 text-mred-600"><Icon name={icon} className="h-6 w-6" /></span>
      <h3 className="mt-4 font-sans text-base font-bold text-ink">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'red', children }: { tone?: 'red' | 'amber' | 'blue' | 'green'; children: ReactNode }) {
  const c = { red: 'border-red-200 bg-red-50 text-red-800', amber: 'border-amber-200 bg-amber-50 text-amber-900', blue: 'border-blue-200 bg-blue-50 text-blue-900', green: 'border-green-200 bg-green-50 text-green-800' }[tone]
  return <div role={tone === 'red' ? 'alert' : undefined} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${c}`}><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0">{children}</div></div>
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-semibold text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export function PageLoading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}</div>
      <div className="skeleton h-64" />
    </div>
  )
}

export const num = (v: string | number | null | undefined) => (v === '' || v == null ? NaN : Number(v))
export const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'S'
export const shortDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
