import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, slugify } from '../../lib/format'
import { useRows, Empty } from '../../components/ui'

export default function News() {
  const { data, reload } = useRows(() => supabase.from('news_posts').select('id,title,published').order('created_at', { ascending: false }))
  const [err, setErr] = useState('')

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const title = String(f.get('title'))
    const { error } = await supabase.from('news_posts').insert({ title, slug: slugify(title), excerpt: String(f.get('excerpt')), body: String(f.get('body')) })
    if (error) return setErr(error.message)
    setErr(''); form.reset(); reload()
  }
  const toggle = async (p: Row) => {
    await supabase.from('news_posts').update({ published: !p.published, published_at: !p.published ? new Date().toISOString() : null }).eq('id', p.id)
    reload()
  }
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <form onSubmit={create} className="space-y-4">
        <h2 className="text-xl font-bold">New post</h2>
        <input name="title" required placeholder="Title" className="input" />
        <input name="excerpt" placeholder="Short summary" className="input" />
        <textarea name="body" rows={6} placeholder="Full text" className="input" />
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary">Save as draft</button>
      </form>
      <div>
        <h2 className="text-xl font-bold">Posts</h2>
        {!data.length && <div className="mt-3"><Empty>No posts yet.</Empty></div>}
        <ul className="mt-3 space-y-3">
          {data.map((p: Row) => (
            <li key={p.id} className="card flex items-center justify-between gap-3 !p-4 text-sm">
              <span className="font-medium">{p.title}</span>
              <button onClick={() => toggle(p)} className="btn-outline btn-sm">{p.published ? 'Unpublish' : 'Publish'}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
