import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import { Row, dt, pkr } from '../../lib/format'
import { AreaChart, BarList, Donut } from '../../components/charts'
import CountUp from '../../components/CountUp'
import Reveal from '../../components/Reveal'
import Icon from '../../components/Icon'
import { ErrorNote, PageSkeleton } from '../../components/ui'

const STATUS_COLORS: Record<string, string> = { new: '#f0b92c', accepted: '#3b82f6', processing: '#8b5cf6', shipped: '#06b6d4', delivered: '#157043', cancelled: '#ef4444' }

function Kpi({ icon, label, value, money, sub, i }: { icon: string; label: string; value: number; money?: boolean; sub?: string; i: number }) {
  return (
    <Reveal delay={i * 70}>
      <div className="group h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><Icon name={icon} className="h-5 w-5" /></span>
          {sub && <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold text-gold-600">{sub}</span>}
        </div>
        <p className="mt-4 font-display text-3xl font-bold text-brand-900">{money && <span className="mr-1 text-base font-sans font-semibold text-gray-400">PKR</span>}<CountUp value={Math.round(value)} /></p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
      </div>
    </Reveal>
  )
}

export default function Overview() {
  const { profile, session } = useAuth()
  const { can } = usePermissions()
  const [s, setS] = useState<Row | null>(null)
  const [err, setErr] = useState('')
  const [metric, setMetric] = useState<'orders' | 'value'>('orders')
  const [audit, setAudit] = useState<Row[]>([])

  useEffect(() => {
    supabase.rpc('dashboard_stats').then(({ data, error }) => { if (error) setErr(error.message); else setS(data as Row) })
  }, [])
  const canAudit = can('audit')
  useEffect(() => {
    if (canAudit) supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(6).then(({ data }) => setAudit(data ?? []))
  }, [canAudit])

  const h = new Date().getHours()
  const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const name = (profile?.full_name || session?.user.email || '').split(' ')[0]

  const links = [
    ['content', '/management/settings', 'Edit site settings', 'settings'], ['banners', '/management/banners', 'Manage banners', 'image'],
    ['mp_applications', '/management/applications', 'Review applications', 'users'], ['news', '/management/news', 'Write news', 'file'],
    ['finance', '/management/finance', 'Open finance', 'wallet'],
  ].filter(([k]) => can(k as string))

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-gold-400/20 blur-2xl" />
          <p className="text-sm text-brand-100">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{hello}{name ? `, ${name}` : ''}</h2>
          <p className="mt-1 text-sm text-brand-100">Here is how Umeed of Life is doing right now.</p>
          {links.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{links.map(([, to, label, icon]) => (
            <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/20"><Icon name={icon} className="h-4 w-4" />{label}</Link>
          ))}</div>}
        </div>
      </Reveal>

      {err && <ErrorNote>Dashboard numbers could not be loaded ({err}). Run <b>supabase/dashboard.sql</b> in the Supabase SQL Editor, then refresh.</ErrorNote>}
      {!s && !err && <PageSkeleton />}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi i={0} icon="users" label="Customers" value={s.customers} />
            <Kpi i={1} icon="store" label="Active stores" value={s.vendors} />
            <Kpi i={2} icon="package" label="Live products" value={s.products} />
            <Kpi i={3} icon="truck" label="Orders" value={s.orders} sub={`${s.orders_today} today`} />
            <Kpi i={4} icon="bag" label="Order value" value={s.order_value} money />
            {can('finance') && <>
              <Kpi i={5} icon="check" label="Delivered sales" value={s.gross_sales} money />
              <Kpi i={6} icon="trend" label="Commission earned" value={s.commission} money />
              <Kpi i={7} icon="wallet" label="Owed to vendors" value={s.vendor_payable} money />
            </>}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Reveal className="lg:col-span-2">
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="font-sans text-base font-bold">Last 14 days</h3><p className="text-xs text-gray-500">Marketplace activity</p></div>
                  <div className="flex rounded-full bg-gray-100 p-1 text-xs font-semibold">
                    {(['orders', 'value'] as const).map((m) => <button key={m} onClick={() => setMetric(m)} className={`rounded-full px-3 py-1.5 transition ${metric === m ? 'bg-white shadow' : 'text-gray-500'}`}>{m === 'orders' ? 'Orders' : 'Order value'}</button>)}
                  </div>
                </div>
                <AreaChart key={metric} money={metric === 'value'} color={metric === 'orders' ? '#157043' : '#d9a21b'} data={(s.series ?? []).map((d: Row) => ({ label: d.day, value: Number(d[metric]) }))} />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-sans text-base font-bold">Shipments by status</h3>
                <div className="mt-4"><Donut centre="shipments" data={Object.entries(s.status ?? {}).map(([k, v]) => ({ label: k, value: Number(v), color: STATUS_COLORS[k] ?? '#9ca3af' }))} /></div>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Reveal>
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-sans text-base font-bold">Top stores</h3><p className="mb-4 text-xs text-gray-500">By order value</p>
                {(s.top_vendors ?? []).length ? <BarList money items={s.top_vendors} /> : <p className="py-6 text-center text-sm text-gray-500">No orders yet.</p>}
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-sans text-base font-bold">Needs attention</h3>
                <ul className="mt-4 space-y-2">
                  {[['applications', 'Applications to review', '/management/applications', 'mp_applications'], ['products', 'Products to review', '/management/products', 'mp_products'],
                    ['messages', 'New messages', '/management/messages', 'messages'], ['orders', 'New vendor orders', '/management/orders', 'mp_orders']].filter(([, , , m]) => can(m)).map(([k, label, to]) => (
                    <li key={k}><Link to={to} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm transition hover:bg-brand-50">
                      <span>{label}</span><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.pending[k] > 0 ? 'bg-gold-400 text-brand-900' : 'bg-white text-gray-400'}`}>{s.pending[k]}</span></Link></li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-sans text-base font-bold">Recent activity</h3>
                {!can('audit') ? <p className="mt-4 text-sm text-gray-500">Activity is visible to roles with audit access.</p> : !audit.length ? <p className="mt-4 text-sm text-gray-500">No activity yet.</p> : (
                  <ul className="mt-4 space-y-3">{audit.map((a) => (
                    <li key={a.id} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" /><div><p className="font-medium">{String(a.action).replace(/_/g, ' ')}</p><p className="text-xs text-gray-500">{dt(a.created_at)}</p></div></li>
                  ))}</ul>
                )}
              </div>
            </Reveal>
          </div>
        </>
      )}
      <p className="text-center text-xs text-gray-400">Amounts in {pkr(0).slice(0, 3)}. Figures update when you refresh the page.</p>
    </div>
  )
}
