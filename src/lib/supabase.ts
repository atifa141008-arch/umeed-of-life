import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

// Placeholder values keep the site running before Supabase is connected.
export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'public-anon-key')
