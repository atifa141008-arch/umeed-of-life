import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { catEmoji, defaultCategories } from '../../data/market'
import Banner from '../../components/Banner'
import HScroll from '../../components/HScroll'
import ProductCard, { GRID } from '../../components/ProductCard'
import ProductGrid from '../../components/ProductGrid'
import { useRows } from '../../components/ui'

function Section({ title, to, children, id }: { title: string; to?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-5 rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 md:text-2xl">{title}</h2>
        {to && <Link to={to} className="text-sm font-semibold text-mred-600 hover:underline">See more ›</Link>}
      </div>
      {children}
    </section>
  )
}

export default function MHome() {
  const stores = useRows(() => supabase.from('vendors').select('id,store_name,logo_url').eq('status', 'active').order('created_at', { ascending: false }).limit(30))
  const cats = useRows(() => supabase.from('categories').select('*').eq('active', true).order('sort_order'))
  const best = useRows(() => supabase.from('products').select('*, vendors(store_name,slug)').eq('status', 'approved').gt('sold_count', 0).order('sold_count', { ascending: false }).limit(8))
  const categories: Row[] = cats.data.length ? cats.data : defaultCategories

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
      <Banner />

      <Section title="Stores" to="/marketplace/vendors">
        {!stores.data.length ? <p className="py-6 text-center text-sm text-gray-500">Verified stores will appear here.</p> : (
          <HScroll>
            {stores.data.map((s: Row) => (
              <Link key={s.id} to={`/marketplace/shop?vendor=${s.id}`} className="group w-20 shrink-0 snap-start text-center md:w-24">
                <span className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-peach-100 font-display text-2xl font-bold text-mred-600 ring-2 ring-peach-200 transition group-hover:ring-mred-500 md:h-20 md:w-20">
                  {s.logo_url ? <img src={s.logo_url} alt="" className="h-full w-full object-cover" /> : s.store_name?.[0]?.toUpperCase()}
                </span>
                <span className="mt-2 line-clamp-2 block text-xs font-medium text-gray-700 group-hover:text-mred-600">{s.store_name}</span>
              </Link>
            ))}
          </HScroll>
        )}
      </Section>

      <Section title="Categories" to="/marketplace/categories" id="marketplace-categories">
        <HScroll>
          {categories.map((c) => (
            <Link key={c.slug} to={`/marketplace/shop?category=${c.slug}`} className="group w-20 shrink-0 snap-start text-center md:w-24">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-peach-100 to-peach-300 text-3xl transition group-hover:scale-105 md:h-20 md:w-20 md:text-4xl">{catEmoji(c.slug)}</span>
              <span className="mt-2 line-clamp-2 block text-xs font-medium text-gray-700 group-hover:text-mred-600">{c.name}</span>
            </Link>
          ))}
        </HScroll>
      </Section>

      {best.data.length > 0 && (
        <Section title="Best Selling" to="/marketplace/shop?sort=best">
          <div className={GRID}>{best.data.map((p: Row) => <ProductCard key={p.id} p={p} />)}</div>
          <div className="mt-6 text-center"><Link to="/marketplace/shop?sort=best" className="btn-red-outline">See more</Link></div>
        </Section>
      )}

      <Section title="All Products" id="marketplace-products">
        <ProductGrid />
      </Section>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Verified sellers', 'Where verification is confirmed'], ['Easy returns', 'Check policy before ordering'], ['Cash on Delivery', 'Only where available'], ['Secure ordering', 'Prices checked on the server']].map(([t, d]) => (
          <div key={t} className="rounded-2xl bg-peach-100 p-4"><p className="text-sm font-semibold text-mred-700">{t}</p><p className="mt-1 text-xs text-gray-600">{d}</p></div>
        ))}
      </div>
    </div>
  )
}
