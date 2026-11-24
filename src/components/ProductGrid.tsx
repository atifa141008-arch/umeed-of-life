import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Row } from '../lib/format'
import { usePageSize } from '../lib/useMediaQuery'
import ProductCard, { GRID } from './ProductCard'
import Pagination from './Pagination'
import { Empty, ErrorNote, Spinner } from './ui'

type Props = { q?: string; catId?: string; vendor?: string; sort?: string; hold?: boolean }

/** Paged product list: 20 per page on mobile, 40 on desktop. Shows "< 1 of N >". */
export default function ProductGrid({ q = '', catId, vendor, sort = 'new', hold }: Props) {
  const size = usePageSize()
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const top = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  useEffect(() => setPage(1), [q, catId, vendor, sort, size])

  useEffect(() => {
    if (hold) return
    let on = true
    setLoading(true)
    const from = (page - 1) * size
    let query = supabase.from('products').select('*, vendors(store_name,slug)', { count: 'exact' }).eq('status', 'approved')
    if (q) query = query.ilike('name', `%${q.replace(/[%,]/g, ' ')}%`)
    if (catId) query = query.eq('category_id', catId)
    if (vendor) query = query.eq('vendor_id', vendor)
    query = sort === 'low' ? query.order('price') : sort === 'high' ? query.order('price', { ascending: false })
      : sort === 'best' ? query.order('sold_count', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false })
    Promise.resolve(query.range(from, from + size - 1)).then(({ data, count, error }) => {
      if (!on) return
      if (error) setError(error.message); else { setError(''); setRows((data as Row[]) ?? []); setTotal(count ?? 0) }
      setLoading(false)
    })
    return () => { on = false }
  }, [page, size, q, catId, vendor, sort, hold])

  const change = (p: number) => {
    setPage(p)
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  useEffect(() => { first.current = false }, [])

  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <div ref={top} className="scroll-mt-32">
      {loading ? <Spinner /> : error ? <ErrorNote>Products could not be loaded right now.</ErrorNote> : !rows.length ? (
        <Empty>No products found. Products appear here once approved sellers publish them.</Empty>
      ) : (
        <>
          <div className={GRID}>{rows.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <Pagination page={page} pages={pages} onChange={change} />
        </>
      )}
    </div>
  )
}
