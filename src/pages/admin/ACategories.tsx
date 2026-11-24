import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { ErrorNote, useRows } from '../../components/ui'

export default function ACategories() {
  const { data, reload } = useRows(() => supabase.from('categories').select('*').order('sort_order'))
  const [err, setErr] = useState('')
  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const name = String(f.get('name')).trim()
    const { error } = await supabase.from('categories').insert({ name, description: String(f.get('description')), slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), sort_order: data.length + 1 })
    if (error) return setErr(error.message)
    setErr(''); form.reset(); reload()
  }
  const toggle = async (c: Row) => { await supabase.from('categories').update({ active: !c.active }).eq('id', c.id); reload() }
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={add} className="card space-y-3">
        <h2 className="text-lg font-bold">Add category</h2>
        <input name="name" required placeholder="Name" className="input" /><input name="description" placeholder="Short description" className="input" />
        {err && <ErrorNote>{err}</ErrorNote>}<button className="btn-red">Add</button>
      </form>
      <ul className="space-y-2">{data.map((c: Row) => (
        <li key={c.id} className="card flex items-center justify-between !p-3 text-sm"><span><b>{c.name}</b> <span className="text-gray-500">{c.description}</span></span>
          <button onClick={() => toggle(c)} className="btn-red-outline btn-sm">{c.active ? 'Hide' : 'Show'}</button></li>))}</ul>
    </div>
  )
}
