import { describe, it, expect, vi, afterEach } from 'vitest'

describe('getServiceRoleClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('throws SUPABASE_NOT_CONFIGURED when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake-key')
    const { getServiceRoleClient } = await import('../../src/lib/db/supabase-client')
    expect(() => getServiceRoleClient()).toThrow('SUPABASE_NOT_CONFIGURED')
  })

  it('throws SUPABASE_NOT_CONFIGURED when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    const { getServiceRoleClient } = await import('../../src/lib/db/supabase-client')
    expect(() => getServiceRoleClient()).toThrow('SUPABASE_NOT_CONFIGURED')
  })

  it('returns a client with from and storage when env vars are present', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake-service-role-key')
    const { getServiceRoleClient } = await import('../../src/lib/db/supabase-client')
    const client = getServiceRoleClient()
    expect(typeof client.from).toBe('function')
    expect(typeof client.storage).toBe('object')
  })

  it('returns the same instance on repeated calls within a module scope (singleton)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake-service-role-key')
    const { getServiceRoleClient } = await import('../../src/lib/db/supabase-client')
    const a = getServiceRoleClient()
    const b = getServiceRoleClient()
    expect(a).toBe(b)
  })
})
