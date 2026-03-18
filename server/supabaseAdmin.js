import { createClient } from '@supabase/supabase-js'

let _client = null

export function getSupabaseAdmin() {
  if (_client) return _client
  const url = (process.env.API_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.API_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('API_SUPABASE_SERVICE_ROLE_KEY not configured')
  _client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  return _client
}
