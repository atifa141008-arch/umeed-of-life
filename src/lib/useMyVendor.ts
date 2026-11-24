import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'
import { Row } from './format'
import { useRows } from '../components/ui'

export function useMyVendor() {
  const { session } = useAuth()
  const r = useRows(() => supabase.from('vendors').select('*').eq('user_id', session?.user.id ?? '').limit(1), [session?.user.id])
  return { vendor: (r.data[0] as Row | undefined), loading: r.loading, reload: r.reload }
}
