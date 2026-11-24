import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { Empty, Spinner, useRows } from '../../components/ui'

export default function Vendors() {
  const { data, loading } = useRows(() => supabase.from('vendors').select('id,store_name,description,logo_url').eq('status', 'active').order('store_name'))
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-bold">Vendors & Stores</h1>
      <p className="mt-2 text-gray-600">Independent stores on Umeed Marketplace.</p>
      <div className="mt-8">
        {loading ? <Spinner /> : !data.length ? <Empty>Verified stores will be listed here.</Empty> : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {data.map((v: Row) => (
              <Link key={v.id} to={`/marketplace/shop?vendor=${v.id}`} className="card hover:border-mred-500">
                {v.logo_url && <img src={v.logo_url} alt="" className="mb-3 h-14 w-14 rounded-full object-cover" />}
                <p className="font-semibold">{v.store_name}</p>
                <p className="mt-1 line-clamp-3 text-sm text-gray-600">{v.description}</p>
                <p className="mt-3 text-xs font-semibold text-mred-600">View products →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
