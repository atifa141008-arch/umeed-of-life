import { KeyboardEvent, useState } from 'react'
import Icon from '../../../components/Icon'
import { pkr } from '../../../lib/format'
import { Notice, num } from './parts'

export type OptionGroup = { name: string; values: string[] }
export type Variant = {
  id: string; name: string; options: Record<string, string>
  sku: string; price: string; sale_price: string; stock: string; custom?: boolean
}

export const MAX_VARIANTS = 100
const MAX_GROUPS = 3
const uid = () => crypto.randomUUID()

/** Every combination of the option values, e.g. Size [S,M] x Color [Red] -> S/Red, M/Red */
function combos(groups: OptionGroup[]): [string, string][][] {
  return groups.reduce<[string, string][][]>(
    (acc, g) => acc.flatMap((a) => g.values.map((v) => [...a, [g.name.trim(), v] as [string, string]])), [[]])
}

/** Rebuilds the generated variant rows after the options change, keeping anything already typed. */
export function regenerate(groups: OptionGroup[], prev: Variant[]): Variant[] {
  const valid = groups.filter((g) => g.name.trim() && g.values.length)
  const customs = prev.filter((v) => v.custom)
  if (!valid.length) return customs
  const seed = prev[0]
  const generated = combos(valid).slice(0, MAX_VARIANTS).map((c): Variant => {
    const name = c.map((x) => x[1]).join(' / ')
    const options = Object.fromEntries(c)
    const old = prev.find((v) => !v.custom && v.name === name)
    return old ? { ...old, options } : { id: uid(), name, options, sku: '', price: seed?.price ?? '', sale_price: '', stock: '0' }
  })
  return [...generated, ...customs].slice(0, MAX_VARIANTS)
}

/** Restores option groups + rows from variants saved in the database. */
export function fromRows(rows: Record<string, any>[]): { groups: OptionGroup[]; variants: Variant[] } {
  const groups: OptionGroup[] = []
  const variants = rows.map((r): Variant => {
    const options = (r.options ?? {}) as Record<string, string>
    const keys = Object.keys(options)
    keys.forEach((k) => {
      let g = groups.find((x) => x.name === k)
      if (!g) { g = { name: k, values: [] }; groups.push(g) }
      if (!g.values.includes(options[k])) g.values.push(options[k])
    })
    return {
      id: r.id, name: r.name, options, sku: r.sku ?? '', price: String(r.price ?? ''), sale_price: r.sale_price == null ? '' : String(r.sale_price),
      stock: String(r.stock ?? 0), custom: keys.length === 0,
    }
  })
  return { groups, variants }
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState('')
  const add = (raw: string) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    if (!parts.length) return
    const next = [...values]
    parts.forEach((p) => { if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p) })
    onChange(next); setText('')
  }
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text) }
    else if (e.key === 'Backspace' && !text && values.length) onChange(values.slice(0, -1))
  }
  return (
    <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 focus-within:border-brand-600">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-peach-100 py-1 pl-3 pr-1.5 text-xs font-semibold text-mred-700">
          {v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="grid h-4 w-4 place-items-center rounded-full hover:bg-mred-600 hover:text-white"><Icon name="close" className="h-3 w-3" /></button>
        </span>))}
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={key} onBlur={() => add(text)} placeholder={values.length ? '' : placeholder}
        className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none" />
    </div>
  )
}

const money = 'input !rounded-lg !py-2 !pl-11 !pr-2 text-right'
const plain = 'input !rounded-lg !py-2 !px-2.5'

export default function VariantsEditor({ groups, setGroups, variants, setVariants }: {
  groups: OptionGroup[]; setGroups: (g: OptionGroup[]) => void; variants: Variant[]; setVariants: (v: Variant[]) => void
}) {
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')

  const changeGroups = (g: OptionGroup[]) => { setGroups(g); setVariants(regenerate(g, variants)) }
  const patch = (id: string, p: Partial<Variant>) => setVariants(variants.map((v) => (v.id === id ? { ...v, ...p } : v)))
  const remove = (id: string) => setVariants(variants.filter((v) => v.id !== id))
  const addCustom = () => variants.length < MAX_VARIANTS && setVariants([...variants, { id: uid(), name: '', options: {}, sku: '', price: variants[0]?.price ?? '', sale_price: '', stock: '0', custom: true }])
  const applyBulk = () => setVariants(variants.map((v) => ({ ...v, ...(bulkPrice !== '' ? { price: bulkPrice, sale_price: '' } : {}), ...(bulkStock !== '' ? { stock: bulkStock } : {}) })))

  const effective = variants.map((v) => { const p = num(v.price), s = num(v.sale_price); return Number.isFinite(s) && s < p ? s : p }).filter(Number.isFinite)
  const stock = variants.reduce((t, v) => t + (Number.isFinite(num(v.stock)) ? num(v.stock) : 0), 0)
  const tooMany = combos(groups.filter((g) => g.name.trim() && g.values.length)).length > MAX_VARIANTS

  return (
    <div className="space-y-6">
      {/* 1. options */}
      <div>
        <div className="flex items-center justify-between">
          <div><h3 className="font-sans text-sm font-bold text-ink">Options</h3><p className="text-xs text-gray-500">Add what customers can choose, e.g. Size or Color. Type a value and press Enter.</p></div>
          {groups.length < MAX_GROUPS && <button type="button" onClick={() => setGroups([...groups, { name: '', values: [] }])} className="btn-red-outline btn-sm"><Icon name="plus" className="mr-1 h-3.5 w-3.5" />Add option</button>}
        </div>
        <div className="mt-3 space-y-3">
          {groups.map((g, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:grid-cols-[170px_1fr_auto] sm:items-start">
              <input aria-label="Option name" value={g.name} placeholder="Option name (Size)" onChange={(e) => changeGroups(groups.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="input !py-2.5" />
              <TagInput values={g.values} placeholder="Values: S, M, L" onChange={(vals) => changeGroups(groups.map((x, j) => (j === i ? { ...x, values: vals } : x)))} />
              <button type="button" aria-label="Remove option" onClick={() => changeGroups(groups.filter((_, j) => j !== i))} className="grid h-[46px] w-10 place-items-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-mred-600"><Icon name="trash" className="h-[18px] w-[18px]" /></button>
            </div>))}
          {!groups.length && <p className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-center text-xs text-gray-500">No options yet. Add an option to auto-create variants, or add a custom variant below.</p>}
        </div>
        {tooMany && <div className="mt-3"><Notice tone="amber">These options make more than {MAX_VARIANTS} combinations. Only the first {MAX_VARIANTS} are kept — remove a value to reduce them.</Notice></div>}
      </div>

      {/* 2. variants table */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h3 className="font-sans text-sm font-bold text-ink">Variants &amp; pricing</h3><p className="text-xs text-gray-500">Each variant has its own price, sale price, stock and SKU.</p></div>
          <button type="button" onClick={addCustom} disabled={variants.length >= MAX_VARIANTS} className="btn-peach btn-sm disabled:opacity-50"><Icon name="plus" className="mr-1 h-3.5 w-3.5" />Custom variant</button>
        </div>

        {variants.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-peach-50 p-3 text-sm">
            <span className="text-xs font-semibold text-gray-600">Apply to all:</span>
            <input type="number" min={0} step="0.01" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} placeholder="Price" aria-label="Price for all variants" className="input !w-28 !rounded-lg !py-1.5" />
            <input type="number" min={0} value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} placeholder="Stock" aria-label="Stock for all variants" className="input !w-24 !rounded-lg !py-1.5" />
            <button type="button" disabled={bulkPrice === '' && bulkStock === ''} onClick={applyBulk} className="btn-red btn-sm">Apply</button>
          </div>)}

        {!variants.length ? (
          <p className="mt-3 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">Add option values above and your variants will appear here.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)_40px] gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 md:grid">
              <span>Variant</span><span>Price</span><span>Sale price</span><span>SKU</span><span>Stock</span><span />
            </div>
            <ul className="divide-y divide-gray-100">
              {variants.map((v) => {
                const p = num(v.price), s = num(v.sale_price)
                const bad = Number.isFinite(s) && Number.isFinite(p) && s >= p
                return (
                  <li key={v.id} className="grid grid-cols-2 items-end gap-2 p-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)_40px] md:items-center">
                    <div className="col-span-2 md:col-span-1">
                      {v.custom
                        ? <input aria-label="Variant name" value={v.name} onChange={(e) => patch(v.id, { name: e.target.value })} placeholder="Variant name" className={plain} />
                        : <div><p className="text-sm font-semibold text-ink">{v.name}</p><p className="text-[11px] text-gray-400">{Object.entries(v.options).map(([k, val]) => `${k}: ${val}`).join(' • ')}</p></div>}
                    </div>
                    <label className="relative block"><span className="mb-1 block text-[11px] font-medium text-gray-500 md:sr-only">Price</span>
                      <span className="pointer-events-none absolute bottom-[9px] left-2.5 text-[11px] font-semibold text-gray-400 md:bottom-auto md:top-1/2 md:-translate-y-1/2">PKR</span>
                      <input type="number" min={0} step="0.01" value={v.price} onChange={(e) => patch(v.id, { price: e.target.value })} placeholder="0" className={money} /></label>
                    <label className="relative block"><span className="mb-1 block text-[11px] font-medium text-gray-500 md:sr-only">Sale price</span>
                      <span className="pointer-events-none absolute bottom-[9px] left-2.5 text-[11px] font-semibold text-gray-400 md:bottom-auto md:top-1/2 md:-translate-y-1/2">PKR</span>
                      <input type="number" min={0} step="0.01" value={v.sale_price} onChange={(e) => patch(v.id, { sale_price: e.target.value })} placeholder="Optional" className={`${money} ${bad ? '!border-red-400' : ''}`} /></label>
                    <label className="block"><span className="mb-1 block text-[11px] font-medium text-gray-500 md:sr-only">SKU</span>
                      <input value={v.sku} onChange={(e) => patch(v.id, { sku: e.target.value })} placeholder="SKU" className={plain} /></label>
                    <label className="block"><span className="mb-1 block text-[11px] font-medium text-gray-500 md:sr-only">Stock</span>
                      <input type="number" min={0} step={1} value={v.stock} onChange={(e) => patch(v.id, { stock: e.target.value })} className={plain} /></label>
                    <button type="button" aria-label={`Remove ${v.name || 'variant'}`} onClick={() => remove(v.id)} className="grid h-10 w-10 place-items-center justify-self-end rounded-lg text-gray-400 hover:bg-red-50 hover:text-mred-600"><Icon name="trash" className="h-[18px] w-[18px]" /></button>
                  </li>)
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-600">
              <span><b>{variants.length}</b> variant{variants.length > 1 ? 's' : ''} • <b>{stock}</b> in stock</span>
              {effective.length > 0 && <span>Price: <b>{Math.min(...effective) === Math.max(...effective) ? pkr(effective[0]) : `${pkr(Math.min(...effective))} – ${pkr(Math.max(...effective))}`}</b></span>}
            </div>
          </div>)}
      </div>
    </div>
  )
}
