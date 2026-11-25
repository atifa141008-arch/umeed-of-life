import { DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { Row, pkr, slugify } from '../../../lib/format'
import { StatusBadge } from '../../../components/ui'
import Icon from '../../../components/Icon'
import VariantsEditor, { OptionGroup, Variant, fromRows } from './VariantsEditor'
import { Field, Notice, PageLoading, Panel, num } from './parts'

const MAX_IMAGES = 5
const MAX_BYTES = 3 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

type Props = { product: Row | null; vendorId: string; categories: Row[]; onClose: (changed: boolean) => void }

/** Loads the product's saved variants first, then shows the editor. */
export default function ProductEditor(props: Props) {
  const [rows, setRows] = useState<Row[] | null>(props.product ? null : [])
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (!props.product) return
    supabase.from('product_variants').select('*').eq('product_id', props.product.id).order('position').then(({ data, error }) => {
      if (error) setMissing(true)
      setRows(error ? [] : (data as Row[]))
    })
  }, [props.product])
  if (rows === null) return <PageLoading />
  return <Form {...props} initialVariants={rows} tableMissing={missing} />
}

function Form({ product, vendorId, categories, onClose, initialVariants, tableMissing }: Props & { initialVariants: Row[]; tableMissing: boolean }) {
  const { session } = useAuth()
  const init = useMemo(() => fromRows(initialVariants), [initialVariants])
  const p = product ?? ({} as Row)
  const live = ['approved', 'disabled'].includes(p.status)

  const [name, setName] = useState<string>(p.name ?? '')
  const [categoryId, setCategoryId] = useState<string>(p.category_id ?? '')
  const [description, setDescription] = useState<string>(p.description ?? '')
  const [hasVariants, setHasVariants] = useState(initialVariants.length > 0)
  const [price, setPrice] = useState(p.price != null ? String(p.price) : '')
  const [salePrice, setSalePrice] = useState(p.sale_price != null ? String(p.sale_price) : '')
  const [stock, setStock] = useState(p.stock != null ? String(p.stock) : '0')
  const [sku, setSku] = useState<string>(p.sku ?? '')
  const [imgs, setImgs] = useState<string[]>(p.image_urls ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [groups, setGroups] = useState<OptionGroup[]>(init.groups)
  const [variants, setVariants] = useState<Variant[]>(init.variants)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const savedId = useRef<string | null>(product?.id ?? null)
  const originalIds = useRef<string[]>(initialVariants.map((r) => r.id))

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list)
    const bad = incoming.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES)
    if (bad) setError(`"${bad.name}" was skipped — images must be JPG, PNG or WebP and 3 MB or smaller.`)
    else setError('')
    const ok = incoming.filter((f) => TYPES.includes(f.type) && f.size <= MAX_BYTES)
    setFiles((cur) => [...cur, ...ok].slice(0, Math.max(MAX_IMAGES - imgs.length, 0)))
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }

  const pNum = num(price), sNum = num(salePrice)
  const discount = Number.isFinite(sNum) && Number.isFinite(pNum) && pNum > 0 && sNum < pNum ? Math.round((1 - sNum / pNum) * 100) : 0
  const variantsOk = variants.length > 0 && variants.every((v) => v.name.trim() && Number.isFinite(num(v.price)) && num(v.price) >= 0)
  const checklist: [string, boolean][] = [
    ['Product name', !!name.trim()],
    ['Description', !!description.trim()],
    ['At least one image', imgs.length + files.length > 0],
    [hasVariants ? 'Variants with prices' : 'Price', hasVariants ? variantsOk : Number.isFinite(pNum) && pNum >= 0],
    ['Category', !!categoryId],
  ]
  const done = checklist.filter(([, ok]) => ok).length

  const validate = (): string => {
    if (!name.trim()) return 'Enter a product name'
    if (!description.trim()) return 'Enter a description'
    if (!hasVariants) {
      if (!Number.isFinite(pNum) || pNum < 0) return 'Enter a valid price'
      if (salePrice !== '' && (!Number.isFinite(sNum) || sNum >= pNum)) return 'Sale price must be lower than the regular price'
      if (!Number.isInteger(num(stock)) || num(stock) < 0) return 'Stock must be a whole number, 0 or more'
      return ''
    }
    if (!variants.length) return 'Add at least one variant, or switch to a simple product'
    const seen = new Set<string>()
    for (const v of variants) {
      const label = v.name.trim() || 'A variant'
      if (!v.name.trim()) return 'Every variant needs a name'
      if (seen.has(v.name.trim().toLowerCase())) return `Two variants are named "${v.name.trim()}"`
      seen.add(v.name.trim().toLowerCase())
      const vp = num(v.price), vs = num(v.sale_price)
      if (!Number.isFinite(vp) || vp < 0) return `${label}: enter a valid price`
      if (v.sale_price !== '' && (!Number.isFinite(vs) || vs >= vp)) return `${label}: sale price must be lower than its price`
      if (!Number.isInteger(num(v.stock)) || num(v.stock) < 0) return `${label}: stock must be a whole number, 0 or more`
    }
    return ''
  }

  const save = async (status: string) => {
    const problem = validate()
    if (problem) return setError(problem)
    setBusy(true); setError('')
    try {
      const urls = [...imgs]
      for (const file of files) {
        const path = `${session!.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const up = await supabase.storage.from('product-images').upload(path, file)
        if (up.error) throw new Error(up.error.message)
        urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      }
      if (status === 'pending_review' && !urls.length) throw new Error('Add at least one image before submitting for review')
      setImgs(urls); setFiles([])

      // headline values shown on the shop: the variant with the lowest selling price, and total stock
      let head = { price: pNum, sale_price: salePrice !== '' ? sNum : null as number | null, stock: num(stock) }
      if (hasVariants) {
        const best = [...variants].sort((a, b) => eff(a) - eff(b))[0]
        head = { price: num(best.price), sale_price: best.sale_price !== '' ? num(best.sale_price) : null, stock: variants.reduce((t, v) => t + num(v.stock), 0) }
      }
      const row = { name: name.trim(), description: description.trim(), category_id: categoryId || null, sku: !hasVariants ? sku.trim() || null : null, ...head, image_urls: urls, status }

      if (savedId.current) {
        const res = await supabase.from('products').update(row).eq('id', savedId.current)
        if (res.error) throw new Error(res.error.message)
      } else {
        const res = await supabase.from('products').insert({ ...row, vendor_id: vendorId, slug: slugify(name) }).select('id').single()
        if (res.error) throw new Error(res.error.message)
        savedId.current = res.data.id as string
      }

      const keep = hasVariants ? variants.map((v) => v.id) : []
      const removed = originalIds.current.filter((id) => !keep.includes(id))
      if (removed.length) {
        const del = await supabase.from('product_variants').delete().in('id', removed)
        if (del.error) throw new Error(varErr(del.error.message))
      }
      if (hasVariants) {
        const up = await supabase.from('product_variants').upsert(variants.map((v, i) => ({
          id: v.id, product_id: savedId.current, name: v.name.trim(), options: v.options, sku: v.sku.trim() || null,
          price: num(v.price), sale_price: v.sale_price !== '' ? num(v.sale_price) : null, stock: num(v.stock), position: i,
        })), { onConflict: 'id' })
        if (up.error) throw new Error(varErr(up.error.message))
      }
      originalIds.current = keep
      onClose(true)
      return
    } catch (e: any) { setError(e.message) }
    setBusy(false)
  }

  const actions = (
    <>
      {live ? <button type="button" disabled={busy} onClick={() => save(p.status)} className="btn-red flex-1">{busy ? 'Saving…' : 'Save changes'}</button> : (
        <>
          <button type="button" disabled={busy} onClick={() => save('draft')} className="btn-red-outline flex-1">Save draft</button>
          <button type="button" disabled={busy} onClick={() => save('pending_review')} className="btn-red flex-1">{busy ? 'Saving…' : 'Submit for review'}</button>
        </>
      )}
    </>
  )
  const cover = imgs[0] ?? previews[0]

  return (
    <div className="pb-24 lg:pb-0">
      <button type="button" onClick={() => onClose(false)} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-mred-600"><Icon name="left" className="h-4 w-4" />Back to products</button>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink md:text-[1.7rem]">{product ? 'Edit product' : 'Add product'}</h1>
        {product && <StatusBadge s={p.status} />}
      </div>

      <div className="space-y-4 pb-4">
        {p.status === 'rejected' && <Notice tone="red"><b>Rejected:</b> {p.rejection_note}</Notice>}
        {live && <Notice tone="amber">Changing the name, description, images, category, price or variants sends this product back for review. Stock-only changes stay live.</Notice>}
        {tableMissing && <Notice tone="amber">Variants are not set up in your database yet. Run <code className="rounded bg-white/60 px-1">supabase/variants.sql</code> in the Supabase SQL editor, then reload.</Notice>}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Basic information">
            <div className="space-y-4">
              <Field label="Product name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Hand-embroidered cotton kurta" className="input" /></Field>
              <Field label="Category"><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input"><option value="">Select a category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Description" hint={`${description.length}/2000`}><textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={6} placeholder="Materials, size, care instructions, what makes it special…" className="input" /></Field>
            </div>
          </Panel>

          <Panel title="Images" action={<span className="text-xs text-gray-400">{imgs.length + files.length}/{MAX_IMAGES}</span>}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {imgs.map((u, i) => (
                <div key={u} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-gray-200">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-white">Cover</span>}
                  <button type="button" aria-label="Remove image" onClick={() => setImgs(imgs.filter((x) => x !== u))} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-gray-600 shadow hover:bg-mred-600 hover:text-white"><Icon name="close" className="h-3.5 w-3.5" /></button>
                </div>))}
              {previews.map((u, i) => (
                <div key={u} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-gray-200">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  {!imgs.length && i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-white">Cover</span>}
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">New</span>
                  <button type="button" aria-label="Remove image" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-gray-600 shadow hover:bg-mred-600 hover:text-white"><Icon name="close" className="h-3.5 w-3.5" /></button>
                </div>))}
              {imgs.length + files.length < MAX_IMAGES && (
                <label onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
                  className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition-colors ${drag ? 'border-mred-600 bg-peach-50' : 'border-gray-300 hover:border-mred-500 hover:bg-peach-50'}`}>
                  <Icon name="image" className="h-6 w-6 text-gray-400" /><span className="px-1 text-[11px] font-semibold text-gray-500">Add image</span>
                  <input type="file" multiple accept={TYPES.join(',')} className="sr-only" onChange={(e) => { addFiles(e.target.files ?? []); e.target.value = '' }} />
                </label>)}
            </div>
            <p className="mt-3 text-xs text-gray-400">JPG, PNG or WebP, up to 3 MB each. The first image is the cover shown in search and listings.</p>
          </Panel>

          <Panel title="Pricing &amp; inventory">
            <div role="radiogroup" aria-label="Product type" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
              {[[false, 'Simple product', 'One price'], [true, 'With variants', 'Size, color… each priced']].map(([v, t, s]) => (
                <button key={String(v)} type="button" role="radio" aria-checked={hasVariants === v} onClick={() => setHasVariants(v as boolean)}
                  className={`rounded-lg px-3 py-2 text-left transition-colors ${hasVariants === v ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}>
                  <span className={`block text-sm font-bold ${hasVariants === v ? 'text-mred-700' : 'text-gray-700'}`}>{t as string}</span><span className="block text-[11px] text-gray-500">{s as string}</span>
                </button>))}
            </div>
            {!hasVariants ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price (PKR)"><input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="input" /></Field>
                <Field label="Sale price (PKR)" hint={discount ? `${discount}% off — customers pay ${pkr(sNum)}` : 'Optional. Must be lower than the price.'}><input type="number" min={0} step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Optional" className="input" /></Field>
                <Field label="Stock quantity"><input type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} className="input" /></Field>
                <Field label="SKU" hint="Optional internal code"><input value={sku} onChange={(e) => setSku(e.target.value)} className="input" /></Field>
              </div>
            ) : (
              <VariantsEditor groups={groups} setGroups={setGroups} variants={variants} setVariants={setVariants} />
            )}
          </Panel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Panel title="Publish">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-peach-50 ring-1 ring-gray-200">{cover && <img src={cover} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{name || 'Untitled product'}</p><p className="text-xs text-gray-500">{hasVariants ? `${variants.length} variant${variants.length === 1 ? '' : 's'}` : 'Simple product'}</p></div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs"><span className="font-semibold text-gray-600">Listing quality</span><span className="text-gray-400">{done}/{checklist.length}</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-mred-600 transition-all" style={{ width: `${(done / checklist.length) * 100}%` }} /></div>
              <ul className="mt-3 space-y-1.5">{checklist.map(([l, ok]) => (
                <li key={l} className={`flex items-center gap-2 text-xs ${ok ? 'text-gray-700' : 'text-gray-400'}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{ok && <Icon name="check" className="h-3 w-3" />}</span>{l}</li>))}</ul>
            </div>
            {error && <div className="mt-4 hidden lg:block"><Notice tone="red">{error}</Notice></div>}
            <div className="mt-5 hidden flex-wrap gap-2 lg:flex">{actions}</div>
            <button type="button" onClick={() => onClose(false)} className="mt-3 hidden w-full text-center text-sm font-medium text-gray-500 hover:text-mred-600 lg:block">Cancel</button>
            {!live && <p className="mt-3 text-[11px] leading-relaxed text-gray-400">Drafts are only visible to you. Submitted products go live after the marketplace team approves them.</p>}
          </Panel>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        {error && <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <div className="mx-auto flex max-w-xl gap-2">{actions}</div>
      </div>
    </div>
  )
}

const eff = (v: Variant) => { const p = num(v.price), s = num(v.sale_price); return Number.isFinite(s) && s < p ? s : p }
const varErr = (m: string) => (/product_variants/.test(m) && /(exist|schema|cache)/i.test(m) ? 'Variants are not set up in the database yet — run supabase/variants.sql in Supabase first.' : m)
