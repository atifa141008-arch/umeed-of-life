import { FormEvent, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Row, dt, pkr } from '../../lib/format'
import { Empty, Spinner, StatusBadge, useRows } from '../../components/ui'

export default function Account() {
  const { profile, refreshProfile } = useAuth()
  const placed = (useLocation().state as any)?.placed
  const { data, loading } = useRows(() => supabase.from('orders').select('*, vendor_orders(*, order_items(*))').order('created_at', { ascending: false }))
  const [msg, setMsg] = useState('')

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    const { error } = await supabase.from('profiles').update({ full_name: f.full_name, phone: f.phone, address: f.address, city: f.city }).eq('id', profile!.id)
    setMsg(error ? error.message : 'Saved'); refreshProfile()
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-3">
      <section className="lg:col-span-2">
        {placed && <p className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">Thank you! Your order was placed. You can follow it below.</p>}
        <h1 className="text-3xl font-bold">My orders</h1>
        <div className="mt-5 space-y-4">
          {loading ? <Spinner /> : !data.length ? <Empty>You have not placed any orders yet.</Empty> : data.map((o: Row) => (
            <article key={o.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{o.order_number}</p><StatusBadge s={o.status} />
              </div>
              <p className="text-xs text-gray-500">{dt(o.created_at)} • Payment: {o.payment_method.toUpperCase()} ({o.payment_status}) • Total {pkr(o.total)}</p>
              {o.vendor_orders?.map((vo: Row) => (
                <div key={vo.id} className="mt-3 rounded-xl bg-peach-50 p-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2"><b>{vo.order_items?.[0]?.vendor_name}</b><StatusBadge s={vo.status} />
                    {vo.tracking_number && <span className="text-xs text-gray-600">{vo.courier} • {vo.tracking_number}</span>}</p>
                  <ul className="mt-2 space-y-1">{vo.order_items?.map((i: Row) => <li key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{pkr(i.line_total)}</span></li>)}</ul>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
      <form onSubmit={save} className="card h-fit space-y-3">
        <h2 className="text-lg font-bold">My details</h2>
        <input name="full_name" defaultValue={profile?.full_name ?? ''} placeholder="Full name" className="input" />
        <input name="phone" defaultValue={profile?.phone ?? ''} placeholder="Phone" className="input" />
        <input name="address" defaultValue={profile?.address ?? ''} placeholder="Delivery address" className="input" />
        <input name="city" defaultValue={profile?.city ?? ''} placeholder="City" className="input" />
        <p className="text-xs text-gray-500">{profile?.email}</p>
        <button className="btn-red">Save</button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </form>
    </div>
  )
}
