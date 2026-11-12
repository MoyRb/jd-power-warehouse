/**
 * Tests for src/lib/db/index.ts adapter selection logic.
 *
 * The module exports a singleton `db`, so we test createAdapter() behaviour
 * indirectly via dynamic import with environment stubs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('db adapter selection', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('returns SupabaseAdapter in production when env vars are set', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')

    // MockAdapter has a stable identifier we can check
    const { db } = await import('@/lib/db')
    expect(db.constructor.name).toBe('SupabaseAdapter')
  })

  it('throws in production when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

    await expect(import('@/lib/db')).rejects.toThrow(
      'NEXT_PUBLIC_SUPABASE_URL is not configured',
    )
  })

  it('returns MockAdapter in development when no Supabase URL is set', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

    const { db } = await import('@/lib/db')
    expect(db.constructor.name).toBe('MockAdapter')
  })

  it('returns MockAdapter in development when dev bypass is enabled', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('ADMIN_DEV_BYPASS', 'true')

    const { db } = await import('@/lib/db')
    expect(db.constructor.name).toBe('MockAdapter')
  })
})
