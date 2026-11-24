import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row } from '../../lib/format'
import { useRows, Spinner } from '../../components/ui'

export default function Impact() {
  const { data, loading } = useRows(() => supabase.from('impact_stats').select('key,label,value').order('sort_order'))
  const [stats, setStats] = useState<Row[]>([])
  const [note, setNote] = useState('')
  useEffect(() => setStats(data), [data])

  const save = async () => {
    setNote('Saving…')
    for (const s of stats) {
      const { error } = await supabase.from('impact_stats').update({ value: s.value }).eq('key', s.key)
      if (error) return setNote(error.message)
    }
    await supabase.from('audit_logs').insert({ action: 'update_impact_stats', entity: 'impact_stats', details: stats })
    setNote('Saved')
  }
  if (loading) return <Spinner />
  return (
    <div className="max-w-lg space-y-4">
      {stats.map((s, i) => (
        <label key={s.key} className="block text-sm font-medium">{s.label}
          <input type="number" min={0} value={s.value} className="input mt-1"
            onChange={(e) => setStats(stats.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))} />
        </label>
      ))}
      <button onClick={save} className="btn-primary">Save figures</button>
      {note && <p className="text-sm text-gray-600">{note}</p>}
    </div>
  )
}
