import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// auth/server.ts uses next/headers and next/navigation which aren't available in Vitest.
// We test the exported logic by mocking these dependencies.

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: vi.fn(),
    delete: vi.fn(),
    get: (name: string) =>
      name === 'jdpw_dev_admin' ? { value: 'true' } : undefined,
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

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockSetProductStatus = vi.fn()
vi.mock('../../src/lib/db', () => ({
  db: { setProductStatus: (...args: unknown[]) => mockSetProductStatus(...args) },
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

describe('Server Action auth guard (Review Focus #1)', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.ADMIN_DEV_BYPASS
    mockSetProductStatus.mockClear()
  })

  it('setProductStatusAction without session throws redirect to /admin/login', async () => {
    const { setProductStatusAction } = await import('../../src/app/admin/_actions/products')
    await expect(setProductStatusAction('some-id', 'published')).rejects.toThrow(
      'REDIRECT:/admin/login',
    )
    // db.setProductStatus must NOT have been called
    expect(mockSetProductStatus).not.toHaveBeenCalled()
  })
})

// ---- Hardening: bypass must be blocked in production ----

describe('production bypass hardening', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  afterEach(() => {
    ;(process.env as Record<string, string>).NODE_ENV = originalNodeEnv
    delete process.env.ADMIN_DEV_BYPASS
  })

  it('getAdminSession returns null when NODE_ENV=production even with ADMIN_DEV_BYPASS=true', async () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.ADMIN_DEV_BYPASS = 'true'
    const { getAdminSession } = await import('../../src/lib/auth/server')
    const session = await getAdminSession()
    expect(session).toBeNull()
  })

  it('requireAdmin throws redirect when NODE_ENV=production even with ADMIN_DEV_BYPASS=true', async () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.ADMIN_DEV_BYPASS = 'true'
    const { requireAdmin } = await import('../../src/lib/auth/server')
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/admin/login')
  })

  it('getAdminSession returns null when jdpw_dev_admin cookie is present but bypass is production-blocked', async () => {
    // Verifies that a forged cookie cannot grant admin access in production.
    // The cookies() mock always returns jdpw_dev_admin=true, so if the bypass
    // code path were reached, it would incorrectly return a session.
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.ADMIN_DEV_BYPASS = 'true'
    const { getAdminSession } = await import('../../src/lib/auth/server')
    const session = await getAdminSession()
    expect(session).toBeNull()
  })

  it('setProductStatusAction throws redirect when NODE_ENV=production and ADMIN_DEV_BYPASS=true', async () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.ADMIN_DEV_BYPASS = 'true'
    mockSetProductStatus.mockClear()
    const { setProductStatusAction } = await import('../../src/app/admin/_actions/products')
    await expect(setProductStatusAction('some-id', 'published')).rejects.toThrow(
      'REDIRECT:/admin/login',
    )
    expect(mockSetProductStatus).not.toHaveBeenCalled()
  })
})
