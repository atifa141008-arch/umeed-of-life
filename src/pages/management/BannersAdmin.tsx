import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { useToast } from '../../components/Toast'
import { Empty, ErrorNote, Switch, useRows } from '../../components/ui'
import Icon from '../../components/Icon'
import { TONES } from '../../components/Banner'

const blank = { title: '', text: '', cta_label: 'Shop now', link: '/marketplace/shop', tone: 'red', active: true }

export default function BannersAdmin() {
  const toast = useToast()
  const { data, loading, error, reload } = useRows(() => supabase.from('banners').select('*').order('sort_order').order('created_at'))
  const [edit, setEdit] = useState<Row | null>(null)

  const save = async () => {
    if (!edit?.title?.trim()) return toast('Title is required', 'err')
    const row = { title: edit.title, text: edit.text, cta_label: edit.cta_label, link: edit.link, tone: edit.tone, active: edit.active }
    const res = edit.id ? await supabase.from('banners').update(row).eq('id', edit.id) : await supabase.from('banners').insert({ ...row, sort_order: data.length + 1 })
    if (res.error) return toast(res.error.message, 'err')
    toast('Banner saved'); setEdit(null); reload()
  }
  const del = async (b: Row) => { if (!confirm(`Delete "${b.title}"?`)) return; await supabase.from('banners').delete().eq('id', b.id); toast('Banner deleted'); reload() }
  const move = async (i: number, d: number) => {
    const a = data[i], b = data[i + d]; if (!a || !b) return
    await supabase.from('banners').update({ sort_order: b.sort_order ?? i + d }).eq('id', a.id)
    await supabase.from('banners').update({ sort_order: a.sort_order ?? i }).eq('id', b.id)
    reload()
  }
  const toggle = async (b: Row, active: boolean) => { await supabase.from('banners').update({ active }).eq('id', b.id); reload() }

  if (error) return <ErrorNote>{error}. Run <b>supabase/dashboard.sql</b> first.</ErrorNote>

  if (edit)
    return (
      <div className="grid animate-fade-in gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="font-sans text-lg font-bold">{edit.id ? 'Edit banner' : 'New banner'}</h2>
          <label className="block text-sm font-medium">Title<input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="input mt-1" /></label>
          <label className="block text-sm font-medium">Text<textarea value={edit.text ?? ''} onChange={(e) => setEdit({ ...edit, text: e.target.value })} rows={2} className="input mt-1" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Button text<input value={edit.cta_label ?? ''} onChange={(e) => setEdit({ ...edit, cta_label: e.target.value })} className="input mt-1" /></label>
            <label className="block text-sm font-medium">Button link<input value={edit.link ?? ''} onChange={(e) => setEdit({ ...edit, link: e.target.value })} className="input mt-1" /></label>
          </div>
          <div><p className="text-sm font-medium">Colour</p><div className="mt-2 flex gap-2">{Object.entries(TONES).map(([k, g]) => (
            <button key={k} onClick={() => setEdit({ ...edit, tone: k })} aria-label={k} className={`h-10 w-16 rounded-xl bg-gradient-to-r ${g} ring-offset-2 transition ${edit.tone === k ? 'ring-2 ring-brand-700' : ''}`} />))}</div></div>
          <div className="flex items-center gap-3 text-sm"><Switch checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Active" />Show on the marketplace</div>
          <div className="flex gap-2"><button onClick={save} className="btn-primary">Save banner</button><button onClick={() => setEdit(null)} className="btn-outline">Cancel</button></div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">Preview</p>
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${TONES[edit.tone] ?? TONES.red} px-8 py-10 text-white`}>
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <h3 className="relative font-display text-3xl font-bold">{edit.title || 'Your title'}</h3>
            <p className="relative mt-2 text-white/90">{edit.text}</p>
            {edit.cta_label && <span className="relative mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-mred-700">{edit.cta_label}</span>}
          </div>
        </div>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-sm text-gray-600">Banners rotate on the Marketplace home page. If none are active, the default slides are used.</p>
        <button onClick={() => setEdit({ ...blank })} className="btn-primary btn-sm"><Icon name="plus" className="mr-1 h-4 w-4" />New banner</button></div>
      {loading ? <div className="skeleton h-28" /> : !data.length ? <Empty>No banners yet. The default slides are being shown.</Empty> : data.map((b: Row, i) => (
        <div key={b.id} className="animate-fade-in flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div className={`h-16 w-28 shrink-0 rounded-xl bg-gradient-to-r ${TONES[b.tone] ?? TONES.red}`} />
          <div className="min-w-0 flex-1"><p className="truncate font-bold">{b.title}</p><p className="truncate text-sm text-gray-500">{b.text}</p><p className="text-xs text-gray-400">{b.cta_label} → {b.link}</p></div>
          <Switch checked={b.active} onChange={(v) => toggle(b, v)} label="Active" />
          <div className="flex gap-1">
            <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-100 disabled:opacity-30"><Icon name="up2" className="h-4 w-4" /></button>
            <button onClick={() => move(i, 1)} disabled={i === data.length - 1} aria-label="Move down" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-100 disabled:opacity-30"><Icon name="down" className="h-4 w-4" /></button>
            <button onClick={() => setEdit(b)} aria-label="Edit" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-100"><Icon name="edit" className="h-4 w-4" /></button>
            <button onClick={() => del(b)} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Icon name="trash" className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
