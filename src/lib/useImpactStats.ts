import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

export type Stat = { key: string; label: string; value: number }

const fallback: Stat[] = [
  { key: 'lives_impacted', label: 'Lives Impacted', value: 0 },
  { key: 'projects_completed', label: 'Projects Completed', value: 0 },
  { key: 'active_partners', label: 'Active Partners', value: 0 },
  { key: 'communities_reached', label: 'Communities Reached', value: 0 },
]

export function useImpactStats() {
  const [stats, setStats] = useState<Stat[]>(fallback)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('impact_stats')
      .select('key, label, value')
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length) setStats(data as Stat[])
      })
  }, [])
  return stats
}
