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

  it('returns dev session when ADMIN_DEV_BYPASS=true and no SUPABASE env vars', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.ADMIN_DEV_BYPASS = 'true'
    const { getAdminSession } = await import('../../src/lib/auth/server')
    const session = await getAdminSession()
    expect(session).not.toBeNull()
    expect(session?.userId).toBe('mock-admin-id')
    expect(session?.role).toBe('admin')
    delete process.env.ADMIN_DEV_BYPASS
  })

  it('returns null when no SUPABASE env vars and ADMIN_DEV_BYPASS is not set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.ADMIN_DEV_BYPASS
    const { getAdminSession } = await import('../../src/lib/auth/server')
    const session = await getAdminSession()
    expect(session).toBeNull()
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  it('returns session when ADMIN_DEV_BYPASS=true', async () => {
    process.env.ADMIN_DEV_BYPASS = 'true'
    const { requireAdmin } = await import('../../src/lib/auth/server')
    const session = await requireAdmin()
    expect(session.userId).toBe('mock-admin-id')
    delete process.env.ADMIN_DEV_BYPASS
  })

  it('throws redirect when ADMIN_DEV_BYPASS not set and no Supabase', async () => {
    delete process.env.ADMIN_DEV_BYPASS
    const { requireAdmin } = await import('../../src/lib/auth/server')
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/admin/login')
  })
})
