import { MockAdapter } from './mock-adapter'
import { SupabaseAdapter } from './supabase-adapter'
import { isDevBypassEnabled } from '../dev-bypass'

export type { DataAdapter } from './adapter'
export * from './types'

// Active adapter: SupabaseAdapter when Supabase is configured AND dev bypass is off.
// isDevBypassEnabled() returns false in production (NODE_ENV='production'), so
// SupabaseAdapter is always used in production when NEXT_PUBLIC_SUPABASE_URL is set.
export const db: import('./adapter').DataAdapter =
  process.env.NEXT_PUBLIC_SUPABASE_URL && !isDevBypassEnabled()
    ? new SupabaseAdapter()
    : new MockAdapter()
