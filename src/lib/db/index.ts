import { MockAdapter } from './mock-adapter'
import { SupabaseAdapter } from './supabase-adapter'

export type { DataAdapter } from './adapter'
export * from './types'

// Active adapter: MockAdapter in dev/test (no env vars), SupabaseAdapter in production.
// To connect Supabase: add NEXT_PUBLIC_SUPABASE_URL to .env.local
export const db: import('./adapter').DataAdapter =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new SupabaseAdapter()
    : new MockAdapter()
