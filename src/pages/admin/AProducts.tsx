import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, pkr } from '../../lib/format'
import { Empty, ErrorNote, Spinner, StatusBadge, useRows } from '../../components/ui'

export default function AProducts() {
  const [status, setStatus] = useState('pending_review')
  const { data, loading, error, reload } = useRows(() => {
    let q = supabase.from('products').select('*, vendors(store_name), categories(name)').order('created_at', { ascending: false }).limit(100)
    if (status) q = q.eq('status', status)
    return q
  }, [status])
  const [msg, setMsg] = useState('')

  const moderate = async (p: Row, to: string) => {
    let note = ''
    if (to !== 'approved') { note = prompt(to === 'rejected' ? 'Reason for rejection (shown to vendor):' : 'Reason for disabling:') ?? ''; if (!note) return }
    const { error } = await supabase.rpc('moderate_product', { p_id: p.id, p_status: to, p_note: note })
    setMsg(error ? error.message : ''); reload()
  }
  const feature = async (p: Row) => { await supabase.from('products').update({ is_featured: !p.is_featured }).eq('id', p.id); reload() }

  return (
    <div className="space-y-4">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-xs">
        <option value="pending_review">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="disabled">Disabled</option><option value="">All</option>
      </select>
      {msg && <ErrorNote>{msg}</ErrorNote>}
      {loading ? <Spinner /> : error ? <ErrorNote>{error}</ErrorNote> : !data.length ? <Empty>No products in this view.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((p: Row) => (
            <article key={p.id} className="card flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-peach-50">{p.image_urls?.[0] && <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-center justify-between gap-2"><b className="truncate">{p.name}</b><StatusBadge s={p.status} /></div>
                <p className="text-xs text-gray-500">{p.vendors?.store_name} • {p.categories?.name ?? 'No category'}</p>
                <p className="mt-1">{pkr(p.sale_price ?? p.price)} • stock {p.stock}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.status !== 'approved' && <button onClick={() => moderate(p, 'approved')} className="btn-red btn-sm">Approve</button>}
                  {p.status === 'pending_review' && <button onClick={() => moderate(p, 'rejected')} className="btn-red-outline btn-sm">Reject</button>}
                  {p.status === 'approved' && <><button onClick={() => feature(p)} className="btn-peach btn-sm">{p.is_featured ? 'Unfeature' : 'Feature'}</button><button onClick={() => moderate(p, 'disabled')} className="btn-red-outline btn-sm">Disable</button></>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
