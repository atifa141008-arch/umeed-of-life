import { FormEvent, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Row, dt, pkr } from '../../lib/format'
import { StatusBadge, useRows } from '../../components/ui'
import Icon from '../../components/Icon'

const STEPS = ['new', 'accepted', 'processing', 'shipped', 'delivered']
const LABEL: Record<string, string> = { new: 'Placed', accepted: 'Accepted', processing: 'Packing', shipped: 'Shipped', delivered: 'Delivered' }

function Track({ status }: { status: string }) {
  if (status === 'cancelled') return <p className="mt-3 text-xs font-semibold text-red-700">This shipment was cancelled.</p>
  const at = Math.max(STEPS.indexOf(status), 0)
  return (
    <ol className="mt-4 flex items-start" aria-label="Shipment progress">
      {STEPS.map((s, i) => (
        <li key={s} className={`flex items-start ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
          <span className="flex w-12 flex-col items-center gap-1">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${i <= at ? 'bg-mred-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{i < at ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className={`text-[10px] font-medium ${i <= at ? 'text-ink' : 'text-gray-400'}`}>{LABEL[s]}</span>
          </span>
          {i < STEPS.length - 1 && <span className={`mt-3 h-0.5 flex-1 rounded ${i < at ? 'bg-mred-600' : 'bg-gray-200'}`} />}
        </li>
      ))}
    </ol>
  )
}

export default function Account() {
  const { profile, refreshProfile, signOut } = useAuth()
  const placed = (useLocation().state as any)?.placed
  const { data, loading } = useRows(() => supabase.from('orders').select('*, vendor_orders(*, order_items(*))').order('created_at', { ascending: false }))
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('profiles').update({ full_name: f.full_name, phone: f.phone, address: f.address, city: f.city }).eq('id', profile!.id)
    setBusy(false)
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Your details were saved.' }); refreshProfile()
  }
  const name = profile?.full_name || profile?.email || 'Customer'
  const spent = data.filter((o: Row) => o.status !== 'cancelled').reduce((s: number, o: Row) => s + Number(o.total), 0)

  return (
    <div className="bg-gray-50/70">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mred-600 font-sans text-xl font-bold text-white">{name[0]?.toUpperCase()}</span>
          <div className="min-w-0 flex-1"><h1 className="truncate text-2xl font-bold text-ink md:text-3xl">Hello, {name.split(' ')[0]}</h1><p className="text-sm text-gray-500">{profile?.email}</p></div>
          <div className="flex gap-2"><Link to="/marketplace/shop" className="btn-red btn-sm !py-2.5">Continue shopping</Link><button onClick={() => signOut()} className="btn-red-outline btn-sm !py-2.5">Sign out</button></div>
        </div>

        {placed && <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"><Icon name="check" className="h-5 w-5 shrink-0" />Thank you! Your order was placed. You can follow it below.</div>}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs text-gray-500">Orders</p><p className="font-sans text-2xl font-bold text-ink">{data.length}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs text-gray-500">Total spent</p><p className="font-sans text-2xl font-bold text-ink">{pkr(spent)}</p></div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="mb-3 font-sans text-lg font-bold text-ink">My orders</h2>
            <div className="space-y-4">
              {loading ? <div className="skeleton h-40" /> : !data.length ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-peach-100 text-mred-600"><Icon name="bag" className="h-6 w-6" /></span>
                  <h3 className="mt-4 font-sans text-base font-bold text-ink">No orders yet</h3><p className="mt-1 text-sm text-gray-500">When you place an order you can follow it here.</p>
                  <Link to="/marketplace/shop" className="btn-red mt-5">Start shopping</Link>
                </div>
              ) : data.map((o: Row) => (
                <article key={o.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
                    <div><p className="font-sans text-[15px] font-bold text-ink">{o.order_number}</p><p className="text-xs text-gray-500">{dt(o.created_at)}</p></div>
                    <div className="text-right"><p className="font-sans text-base font-bold text-ink">{pkr(o.total)}</p><p className="text-xs text-gray-500">{o.payment_method.toUpperCase()} • {o.payment_status}</p></div>
                  </header>
                  <div className="space-y-3 p-4">
                    {o.vendor_orders?.map((vo: Row) => (
                      <div key={vo.id} className="rounded-xl bg-peach-50 p-4 text-sm">
                        <div className="flex flex-wrap items-center gap-2"><Icon name="store" className="h-4 w-4 text-mred-600" /><b className="text-ink">{vo.order_items?.[0]?.vendor_name}</b><StatusBadge s={vo.status} />
                          {vo.tracking_number && <span className="ml-auto flex items-center gap-1 text-xs text-gray-600"><Icon name="truck" className="h-3.5 w-3.5" />{vo.courier} • {vo.tracking_number}</span>}</div>
                        <ul className="mt-3 space-y-2">{vo.order_items?.map((i: Row) => (
                          <li key={i.id} className="flex items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-gray-200">{i.image_url && <img src={i.image_url} alt="" className="h-full w-full object-cover" />}</div>
                            <span className="min-w-0 flex-1 truncate">{i.product_name} <span className="text-gray-500">× {i.quantity}</span></span><span className="font-semibold">{pkr(i.line_total)}</span></li>))}</ul>
                        <Track status={vo.status} />
                      </div>))}
                  </div>
                </article>))}
            </div>
          </section>

          <form onSubmit={save} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-sans text-lg font-bold text-ink">My details</h2>
            <p className="mb-4 text-xs text-gray-500">Used to pre-fill your delivery information.</p>
            <div className="space-y-3">
              {([['full_name', 'Full name', 'Your name'], ['phone', 'Phone', '03xx xxxxxxx'], ['address', 'Delivery address', 'House, street, area'], ['city', 'City', 'City']] as const).map(([k, l, ph]) => (
                <label key={k} className="block"><span className="mb-1.5 block text-[13px] font-semibold text-gray-700">{l}</span>
                  <input name={k} defaultValue={(profile as any)?.[k] ?? ''} placeholder={ph} className="input" /></label>))}
            </div>
            {msg && <p role="alert" className={`mt-4 rounded-xl px-3 py-2 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
            <button disabled={busy} className="btn-red mt-4 w-full">{busy ? 'Saving…' : 'Save details'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
