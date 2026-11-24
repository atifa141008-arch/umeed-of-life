import { useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { useMyVendor } from '../../../lib/useMyVendor'
import { Row, pkr, slugify } from '../../../lib/format'
import { Empty, ErrorNote, StatusBadge, useRows } from '../../../components/ui'

export default function VProducts() {
  const { session } = useAuth()
  const { vendor } = useMyVendor()
  const prods = useRows(() => supabase.from('products').select('*').order('created_at', { ascending: false }))
  const cats = useRows(() => supabase.from('categories').select('id,name').eq('active', true).order('sort_order'))
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [imgs, setImgs] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLFormElement>(null)

  const open = (p: Row | 'new') => { setEditing(p); setImgs(p === 'new' ? [] : p.image_urls ?? []); setFiles([]); setError('') }

  const save = async (status: string) => {
    const form = ref.current!
    if (!form.reportValidity()) return
    setBusy(true); setError('')
    try {
      const f = Object.fromEntries(new FormData(form)) as Record<string, string>
      const urls = [...imgs]
      for (const file of files) {
        if (file.size > 3 * 1024 * 1024) throw new Error('Each image must be 3 MB or smaller')
        const path = `${session!.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const up = await supabase.storage.from('product-images').upload(path, file)
        if (up.error) throw new Error(up.error.message)
        urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      }
      if (status === 'pending_review' && !urls.length) throw new Error('Add at least one image before submitting for review')
      const row = {
        name: f.name, description: f.description, category_id: f.category_id || null, sku: f.sku || null,
        price: Number(f.price), sale_price: f.sale_price ? Number(f.sale_price) : null, stock: Number(f.stock),
        image_urls: urls, status,
      }
      if (row.sale_price != null && row.sale_price >= row.price) throw new Error('Sale price must be lower than the regular price')
      const res = editing === 'new'
        ? await supabase.from('products').insert({ ...row, vendor_id: vendor!.id, slug: slugify(f.name) })
        : await supabase.from('products').update(row).eq('id', (editing as Row).id)
      if (res.error) throw new Error(res.error.message)
      setEditing(null); prods.reload()
    } catch (e: any) { setError(e.message) }
    setBusy(false)
  }

  const del = async (p: Row) => { if (confirm('Delete this product?')) { await supabase.from('products').delete().eq('id', p.id); prods.reload() } }

  if (editing) {
    const e = editing === 'new' ? {} as Row : editing
    const live = ['approved', 'disabled'].includes(e.status)
    return (
      <form ref={ref} className="mx-auto max-w-2xl space-y-4" onSubmit={(ev) => ev.preventDefault()}>
        <h2 className="text-xl font-bold">{editing === 'new' ? 'Add product' : 'Edit product'}</h2>
        {e.status === 'rejected' && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700"><b>Rejected:</b> {e.rejection_note}</p>}
        {live && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Changing name, price, images or description sends this product back for review. Stock-only changes stay live.</p>}
        <input name="name" required defaultValue={e.name} placeholder="Product name" className="input" />
        <select name="category_id" defaultValue={e.category_id ?? ''} className="input"><option value="">Category</option>{cats.data.map((c: Row) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <textarea name="description" required rows={5} defaultValue={e.description} placeholder="Description" className="input" />
        <div className="grid gap-4 sm:grid-cols-4">
          <input name="price" type="number" min={0} step="0.01" required defaultValue={e.price} placeholder="Price" className="input" />
          <input name="sale_price" type="number" min={0} step="0.01" defaultValue={e.sale_price ?? ''} placeholder="Sale price" className="input" />
          <input name="stock" type="number" min={0} required defaultValue={e.stock ?? 0} placeholder="Stock" className="input" />
          <input name="sku" defaultValue={e.sku ?? ''} placeholder="SKU" className="input" />
        </div>
        <div>
          <p className="text-sm font-medium">Images (max 5, JPG/PNG/WebP, 3 MB each)</p>
          <div className="mt-2 flex flex-wrap gap-2">{imgs.map((u) => (
            <div key={u} className="relative h-20 w-20"><img src={u} alt="" className="h-full w-full rounded-lg object-cover" />
              <button type="button" onClick={() => setImgs(imgs.filter((x) => x !== u))} className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-mred-600 text-xs text-white">×</button></div>))}
            {files.map((f) => <span key={f.name} className="rounded bg-peach-100 px-2 py-1 text-xs">{f.name}</span>)}
          </div>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="mt-2 text-sm"
            onChange={(ev) => setFiles([...files, ...Array.from(ev.target.files ?? [])].slice(0, 5 - imgs.length))} />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex flex-wrap gap-3">
          {live ? <button type="button" disabled={busy} onClick={() => save(e.status)} className="btn-red">Save changes</button> : (
            <>
              <button type="button" disabled={busy} onClick={() => save('draft')} className="btn-red-outline">Save draft</button>
              <button type="button" disabled={busy} onClick={() => save('pending_review')} className="btn-red">Submit for review</button>
            </>
          )}
          <button type="button" onClick={() => setEditing(null)} className="btn-peach">Cancel</button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Products</h2><button onClick={() => open('new')} className="btn-red btn-sm">+ Add product</button></div>
      {prods.error && <ErrorNote>{prods.error}</ErrorNote>}
      {!prods.data.length ? <Empty>No products yet. Add your first product and submit it for review.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr><th className="th">Product</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Status</th><th className="th"></th></tr></thead>
          <tbody>{prods.data.map((p: Row) => (
            <tr key={p.id}>
              <td className="td"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded bg-peach-50">{p.image_urls?.[0] && <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" />}</div><b>{p.name}</b></div></td>
              <td className="td">{pkr(p.sale_price ?? p.price)}</td><td className="td">{p.stock}</td>
              <td className="td"><StatusBadge s={p.status} />{p.rejection_note && <p className="mt-1 max-w-[14rem] text-xs text-red-700">{p.rejection_note}</p>}</td>
              <td className="td whitespace-nowrap"><button onClick={() => open(p)} className="btn-red-outline btn-sm">Edit</button>
                {['draft', 'rejected'].includes(p.status) && <button onClick={() => del(p)} className="ml-2 text-xs text-gray-500 hover:text-mred-600">Delete</button>}</td>
            </tr>))}</tbody></table></div>
      )}
    </div>
  )
}
