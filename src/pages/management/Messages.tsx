import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, dt } from '../../lib/format'
import { useToast } from '../../components/Toast'
import Icon from '../../components/Icon'
import { Empty, ErrorNote, StatusBadge, useRows } from '../../components/ui'

const TABS = ['all', 'new', 'read', 'replied']

export default function Messages() {
  const toast = useToast()
  const { data, loading, error, reload } = useRows(() => supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(300))
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Row | null>(null)

  const rows = data.filter((m: Row) => (tab === 'all' || m.status === tab) && `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(q.toLowerCase()))
  const mark = async (m: Row, status: string) => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', m.id)
    if (error) return toast(error.message, 'err')
    toast(`Marked as ${status}`); setSel({ ...m, status }); reload()
  }
  if (error) return <ErrorNote>{error}</ErrorNote>

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="relative"><Icon name="search" className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className="input !pl-10" /></div>
        <div className="mt-3 flex gap-1 rounded-full bg-gray-100 p-1 text-xs font-semibold">
          {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full py-2 capitalize transition ${tab === t ? 'bg-white shadow' : 'text-gray-500'}`}>{t}{t === 'new' && data.filter((m: Row) => m.status === 'new').length > 0 && <span className="ml-1 rounded-full bg-gold-400 px-1.5 text-brand-900">{data.filter((m: Row) => m.status === 'new').length}</span>}</button>)}
        </div>
        <ul className="mt-4 space-y-2">
          {loading ? [0, 1, 2].map((i) => <li key={i} className="skeleton h-20" />) : !rows.length ? <Empty>No messages here.</Empty> : rows.map((m: Row, i) => (
            <li key={m.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 8) * 30}ms`, animationFillMode: 'backwards' }}>
              <button onClick={() => setSel(m)} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${sel?.id === m.id ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-2"><b className="truncate text-sm">{m.name}</b>{m.status === 'new' && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gold-500" />}</div>
                <p className="truncate text-xs text-gray-500">{m.subject || 'No subject'}</p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-600">{m.message}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-3">
        {!sel ? <div className="grid h-64 place-items-center rounded-3xl border border-dashed border-gray-300 text-sm text-gray-500">Select a message to read it</div> : (
          <article key={sel.id} className="animate-fade-in rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-sans text-xl font-bold">{sel.subject || 'No subject'}</h2><p className="mt-1 text-sm text-gray-500">{sel.name} • {sel.email}{sel.phone ? ` • ${sel.phone}` : ''}</p><p className="text-xs text-gray-400">{dt(sel.created_at)}</p></div>
              <StatusBadge s={sel.status} />
            </div>
            <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">{sel.message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`mailto:${sel.email}?subject=${encodeURIComponent('Re: ' + (sel.subject || 'Your message to Umeed of Life'))}`} onClick={() => mark(sel, 'replied')} className="btn-primary btn-sm"><Icon name="mail" className="mr-2 h-4 w-4" />Reply by email</a>
              <button onClick={() => mark(sel, 'read')} className="btn-outline btn-sm">Mark read</button>
              <button onClick={() => mark(sel, 'replied')} className="btn-outline btn-sm">Mark replied</button>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
