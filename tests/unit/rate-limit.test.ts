import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js before importing the module under test
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@supabase/supabase-js'
import { checkQuoteRateLimit } from '@/lib/rate-limit'

const mockCreateClient = vi.mocked(createClient)

function makeRpcMock(returnData: boolean | null, error: object | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data: returnData, error })
  mockCreateClient.mockReturnValue({ rpc } as never)
  return rpc
}

describe('checkQuoteRateLimit', () => {
  const HASH = 'abc123def456789a'

  beforeEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
  })

  it('fails open (returns true) when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'some-key')

    const result = await checkQuoteRateLimit(HASH)
    expect(result).toBe(true)
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('fails open (returns true) when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    const result = await checkQuoteRateLimit(HASH)
    expect(result).toBe(true)
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns true when RPC returns true (request allowed)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    makeRpcMock(true)

    const result = await checkQuoteRateLimit(HASH)
    expect(result).toBe(true)
  })

  it('returns false when RPC returns false (request blocked)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    makeRpcMock(false)

    const result = await checkQuoteRateLimit(HASH)
    expect(result).toBe(false)
  })

  it('fails open when RPC returns an error', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    makeRpcMock(null, { message: 'connection refused', code: '08006' })

    const result = await checkQuoteRateLimit(HASH)
    expect(result).toBe(true)
  })

  it('fails open when createClient throws', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    mockCreateClient.mockImplementation(() => { throw new Error('network error') })

    const result = await checkQuoteRateLimit(HASH)
    expect(result).toBe(true)
  })

  it('calls RPC with only p_id_hash (no caller-controlled limit params)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    const rpc = makeRpcMock(true)

    await checkQuoteRateLimit(HASH)

    // Limits are hard-coded in the SQL function — not passed as parameters
    expect(rpc).toHaveBeenCalledWith('check_quote_rate_limit', {
      p_id_hash: HASH,
    })
    // Verify no limit/window params were passed (would allow bypass)
    const callArg = rpc.mock.calls[0][1] as Record<string, unknown>
    expect(callArg).not.toHaveProperty('p_limit')
    expect(callArg).not.toHaveProperty('p_window_minutes')
  })

  it('falls back to in-process Map when RPC errors (not fully open)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    makeRpcMock(null, { message: 'db unavailable', code: '08006' })

    // First 5 fallback calls should be allowed
    for (let i = 0; i < 5; i++) {
      const result = await checkQuoteRateLimit('fallback-hash-test')
      expect(result).toBe(true)
    }
    // 6th call should be blocked by in-process fallback
    const blocked = await checkQuoteRateLimit('fallback-hash-test')
    expect(blocked).toBe(false)
  })

  it('uses anon key — not service_role key', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'correct-anon-key')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'secret-service-role-key')
    makeRpcMock(true)

    await checkQuoteRateLimit(HASH)

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'correct-anon-key',
    )
    // Ensure service_role key was not used
    const callArgs = mockCreateClient.mock.calls[0]
    expect(callArgs[1]).not.toBe('secret-service-role-key')
  })
})
