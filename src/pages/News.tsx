import { useEffect, useState } from 'react'
import { PageHero } from '../components/Section'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { usePageTitle } from '../lib/usePageTitle'

type Post = { id: string; title: string; excerpt: string | null; published_at: string | null }

export default function News() {
  usePageTitle('News')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('news_posts')
      .select('id, title, excerpt, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts((data as Post[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <>
      <PageHero title="News & updates">Announcements from Umeed of Life.</PageHero>
      <section className="container-x py-16">
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-gray-600">
            No news published yet. Updates will appear here.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {posts.map((p) => (
              <article key={p.id} className="rounded-2xl border border-gray-200 p-6 transition hover:-translate-y-1 hover:shadow-lg">
                {p.published_at && (
                  <p className="text-xs text-gray-500">{new Date(p.published_at).toLocaleDateString()}</p>
                )}
                <h2 className="mt-1 text-xl font-bold text-brand-900">{p.title}</h2>
                {p.excerpt && <p className="mt-2 text-sm text-gray-600">{p.excerpt}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
