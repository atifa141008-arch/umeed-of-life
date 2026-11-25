import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { Switch, useRows } from '../../components/ui'
import Icon from '../../components/Icon'
import { EmptyState, Field, Notice, PageLoading, Panel } from '../vendor/dashboard/parts'

export default function ACategories() {
  const { data, loading, reload } = useRows(() => supabase.from('categories').select('*').order('sort_order'))
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
  const toggle = async (c: Row, active: boolean) => { await supabase.from('categories').update({ active }).eq('id', c.id); reload() }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <Panel title="Add category" className="lg:col-span-2">
        <form onSubmit={add} className="space-y-4">
          <Field label="Name"><input name="name" required placeholder="e.g. Home & Kitchen" className="input" /></Field>
          <Field label="Short description" hint="Optional — shown on the categories page."><input name="description" placeholder="What belongs here" className="input" /></Field>
          {err && <Notice tone="red">{err}</Notice>}
          <button className="btn-red w-full"><Icon name="plus" className="mr-1.5 h-4 w-4" />Add category</button>
        </form>
      </Panel>
      <Panel title={`All categories${data.length ? ` (${data.length})` : ''}`} className="lg:col-span-3" pad={false}>
        {loading ? <div className="p-5"><PageLoading /></div> : !data.length ? <div className="p-5"><EmptyState icon="tag" title="No categories yet" text="Add the first category using the form." /></div> : (
          <ul className="divide-y divide-gray-100">{data.map((c: Row) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl acc-soft"><Icon name="tag" className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{c.name}</p><p className="truncate text-xs text-gray-500">{c.description || 'No description'}</p></div>
              <span className="hidden text-xs text-gray-400 sm:block">{c.active ? 'Visible' : 'Hidden'}</span>
              <Switch checked={!!c.active} onChange={(v) => toggle(c, v)} label={`${c.active ? 'Hide' : 'Show'} ${c.name}`} />
            </li>))}</ul>
        )}
      </Panel>
    </div>
  )
}
