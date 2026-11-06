import { MockAdapter } from './mock-adapter'
import { SupabaseAdapter } from './supabase-adapter'

export type { DataAdapter } from './adapter'
export * from './types'

// Active adapter: SupabaseAdapter when configured, MockAdapter otherwise.
// ADMIN_DEV_BYPASS=true forces MockAdapter even if Supabase URL is set
// (used for local dev and E2E tests without a real Supabase connection).
export const db: import('./adapter').DataAdapter =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.ADMIN_DEV_BYPASS !== 'true'
    ? new SupabaseAdapter()
    : new MockAdapter()
