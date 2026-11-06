import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Settings action must never delete store_settings rows.
// The RLS policy in migration 002 (after hardening) grants admins only
// SELECT, INSERT, UPDATE — not DELETE. This test verifies the application
// layer does not issue a delete either, so the constraint is enforced at
// both the SQL and application levels.

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

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockSetSetting = vi.fn()
const mockDeleteSetting = vi.fn()

vi.mock('../../src/lib/db', () => ({
  db: {
    setSetting: (...args: unknown[]) => mockSetSetting(...args),
    deleteSetting: (...args: unknown[]) => mockDeleteSetting(...args),
  },
}))

describe('updateSettingsAction (settings RLS negative test)', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.ADMIN_DEV_BYPASS = 'true'
    // Vitest runs in NODE_ENV=test which is != 'production', so bypass is active
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    mockSetSetting.mockClear()
    mockDeleteSetting.mockClear()
    mockSetSetting.mockResolvedValue(undefined)
  })

  afterEach(() => {
    delete process.env.ADMIN_DEV_BYPASS
  })

  it('calls setSetting for each provided key — never deleteSetting', async () => {
    const { updateSettingsAction } = await import(
      '../../src/app/admin/_actions/settings'
    )
    const formData = new FormData()
    formData.set('store_name', 'Test Store')
    formData.set('contact_phone', '+1 555 000 0000')

    await updateSettingsAction(formData)

    expect(mockSetSetting).toHaveBeenCalledWith('store_name', 'Test Store')
    expect(mockSetSetting).toHaveBeenCalledWith('contact_phone', '+1 555 000 0000')
    // The critical assertion: no delete was ever called
    expect(mockDeleteSetting).not.toHaveBeenCalled()
  })

  it('rejects values longer than 500 characters without calling any DB operation', async () => {
    const { updateSettingsAction } = await import(
      '../../src/app/admin/_actions/settings'
    )
    const formData = new FormData()
    formData.set('store_name', 'x'.repeat(501))

    const result = await updateSettingsAction(formData)

    expect(result.error).toMatch(/store_name/)
    expect(mockSetSetting).not.toHaveBeenCalled()
    expect(mockDeleteSetting).not.toHaveBeenCalled()
  })
})
