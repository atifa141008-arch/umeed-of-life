import { supabase } from '../../lib/supabase'
import { Row, dt } from '../../lib/format'
import { Empty, ErrorNote, Spinner, useRows } from '../../components/ui'

export default function Audit() {
  const { data, loading, error } = useRows(() => supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100))
  if (loading) return <Spinner />
  if (error) return <ErrorNote>{error}</ErrorNote>
  if (!data.length) return <Empty>No audit entries yet.</Empty>
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr><th className="th">When</th><th className="th">Action</th><th className="th">Entity</th><th className="th">Details</th></tr></thead>
      <tbody>{data.map((a: Row) => (
        <tr key={a.id}><td className="td whitespace-nowrap">{dt(a.created_at)}</td><td className="td font-medium">{a.action}</td><td className="td">{a.entity}</td>
          <td className="td max-w-md break-words text-xs text-gray-600">{JSON.stringify(a.details)}</td></tr>
      ))}</tbody></table></div>
  )
}
