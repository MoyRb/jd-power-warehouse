import { describe, it, expect, vi, beforeEach } from 'vitest'

// auth/server.ts uses next/headers and next/navigation which aren't available in Vitest.
// We test the exported logic by mocking these dependencies.

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
}))

describe('getAdminSession', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns dev session in mock mode (no SUPABASE env vars, NODE_ENV=test)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const { getAdminSession } = await import('../../src/lib/auth/server')
    const session = await getAdminSession()
    expect(session).not.toBeNull()
    expect(session?.userId).toBe('mock-admin-id')
    expect(session?.role).toBe('admin')
  })

  it('returns null when no SUPABASE env vars and NODE_ENV is production', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const original = process.env.NODE_ENV
    // @ts-expect-error — overriding read-only env for test
    process.env.NODE_ENV = 'production'
    const { getAdminSession } = await import('../../src/lib/auth/server')
    const session = await getAdminSession()
    expect(session).toBeNull()
    // @ts-expect-error
    process.env.NODE_ENV = original
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  it('returns session in mock dev mode', async () => {
    const { requireAdmin } = await import('../../src/lib/auth/server')
    const session = await requireAdmin()
    expect(session.userId).toBe('mock-admin-id')
  })

  it('throws redirect in production with no session', async () => {
    // @ts-expect-error
    process.env.NODE_ENV = 'production'
    const { requireAdmin } = await import('../../src/lib/auth/server')
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/admin/login')
    // @ts-expect-error
    process.env.NODE_ENV = 'test'
  })
})
