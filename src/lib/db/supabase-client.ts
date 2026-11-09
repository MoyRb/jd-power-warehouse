/**
 * Service-role Supabase client — server-side only.
 * Never import this in client components or expose to the browser.
 *
 * Uses the service role key which bypasses RLS. Authorization is enforced
 * at the application layer (requireAdmin()) before any DataAdapter calls.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getServiceRoleClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return _client
}
