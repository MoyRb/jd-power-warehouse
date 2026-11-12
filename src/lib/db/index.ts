import { MockAdapter } from './mock-adapter'
import { SupabaseAdapter } from './supabase-adapter'
import { isDevBypassEnabled } from '../dev-bypass'

export type { DataAdapter } from './adapter'
export * from './types'

// Adapter selection:
//
//  Production (NODE_ENV=production):
//    - NEXT_PUBLIC_SUPABASE_URL must be set.
//    - Missing env var → startup error; MockAdapter is NEVER used in production.
//
//  Development / test:
//    - If ADMIN_DEV_BYPASS=true OR no Supabase URL is set → MockAdapter (safe for local dev).
//    - Otherwise → SupabaseAdapter (useful for integration work against JDHOUSE).

function createAdapter(): import('./adapter').DataAdapter {
  const isProduction = process.env.NODE_ENV === 'production'
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (isProduction) {
    if (!hasSupabase) {
      // Fail loudly at startup rather than silently serve mock data to real users.
      throw new Error(
        '[db] NEXT_PUBLIC_SUPABASE_URL is not configured. ' +
        'Set the environment variable in Vercel before deploying to production.',
      )
    }
    return new SupabaseAdapter()
  }

  // Non-production: allow MockAdapter when Supabase is unavailable or dev bypass is active
  if (hasSupabase && !isDevBypassEnabled()) {
    return new SupabaseAdapter()
  }

  return new MockAdapter()
}

export const db: import('./adapter').DataAdapter = createAdapter()
