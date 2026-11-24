import { ReactNode, useEffect, useState } from 'react'
import type { Row } from '../lib/format'

export const Spinner = () => <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">{children}</p>
)
export const ErrorNote = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{children}</p>
)

const COLORS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800', draft: 'bg-gray-100 text-gray-700', placed: 'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800', pending_review: 'bg-blue-100 text-blue-800',
  more_information: 'bg-orange-100 text-orange-800', approved: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800', accepted: 'bg-blue-100 text-blue-800', processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800', suspended: 'bg-red-100 text-red-800', disabled: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800', read: 'bg-gray-100 text-gray-700', replied: 'bg-green-100 text-green-800',
  on_leave: 'bg-amber-100 text-amber-800', left: 'bg-gray-100 text-gray-700', pending: 'bg-amber-100 text-amber-800',
}
export const StatusBadge = ({ s }: { s: string }) => (
  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${COLORS[s] ?? 'bg-gray-100 text-gray-700'}`}>
    {s.replace(/_/g, ' ')}
  </span>
)

export const StatCard = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-2xl bg-gray-50 p-5">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
  </div>
)

/** Small data-loading hook: returns rows + loading/error + reload() */
export function useRows<T = Row>(fetcher: () => PromiseLike<{ data: any; error: any }>, deps: any[] = []) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let on = true
    setLoading(true)
    Promise.resolve(fetcher())
      .then(({ data, error }) => {
        if (!on) return
        if (error) setError(error.message ?? 'Could not load data')
        else { setError(''); setData((data as T[]) ?? []) }
        setLoading(false)
      })
      .catch((e) => { if (on) { setError(String(e?.message ?? e)); setLoading(false) } })
    return () => { on = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { data, loading, error, reload: () => setTick((t) => t + 1) }
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}>
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}
export const PageSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}</div>
    <div className="skeleton h-64" />
  </div>
)
