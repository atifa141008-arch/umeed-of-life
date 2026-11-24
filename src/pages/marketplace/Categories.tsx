import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { catEmoji, defaultCategories } from '../../data/market'
import { useRows } from '../../components/ui'

export default function Categories() {
  const { data } = useRows(() => supabase.from('categories').select('*').eq('active', true).order('sort_order'))
  const cats: Row[] = data.length ? data : defaultCategories
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Shop by Category</h1>
      <p className="mt-2 text-gray-600">Browse different categories and discover what you are looking for.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cats.map((c) => (
          <Link key={c.slug} to={`/marketplace/shop?category=${c.slug}`} className="rounded-2xl border border-peach-200 bg-peach-50 p-6 hover:border-mred-500 hover:shadow">
            <span className="text-3xl">{catEmoji(c.slug)}</span><p className="mt-2 font-display text-lg font-bold">{c.name}</p><p className="mt-1 text-xs text-gray-500">{c.description}</p>
            <p className="mt-4 text-xs font-semibold text-mred-600">Explore →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
