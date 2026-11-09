/**
 * RLS negative tests — verify Row Level Security is enforced.
 * Uses the ANON key (unauthenticated client) to verify restrictions.
 * Skipped when NEXT_PUBLIC_SUPABASE_URL is not set.
 */
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

describe.skipIf(!HAS_SUPABASE)('RLS negative tests (anon client)', () => {
  const anonClient = HAS_SUPABASE
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    : null

  it('anon cannot INSERT into products (RLS blocks write)', async () => {
    const { error } = await anonClient!.from('products').insert({
      name: '[rls-test] unauthorized insert',
      price: 1,
      status: 'published',
    })
    expect(error).not.toBeNull()
    // 42501 = insufficient_privilege (RLS violation)
    // Supabase may return code "42501" or a generic permission error
    expect(error!.message).toBeTruthy()
  })

  it('anon SELECT on products returns only published rows', async () => {
    const { data, error } = await anonClient!
      .from('products')
      .select('id, status')
    expect(error).toBeNull()
    // Every returned row must be published
    if (data && data.length > 0) {
      expect(data.every((p) => p.status === 'published')).toBe(true)
    }
  })

  it('anon cannot read contact_email setting (is_public = false)', async () => {
    const { data, error } = await anonClient!
      .from('store_settings')
      .select('key, value')
      .eq('key', 'contact_email')
    expect(error).toBeNull()
    // contact_email has is_public=false → should not appear in anon SELECT
    expect(data).toHaveLength(0)
  })

  it('anon can INSERT an inquiry (public form submission)', async () => {
    const { data, error } = await anonClient!.from('inquiries').insert({
      type: 'contact',
      name: '[rls-test] anon inquiry',
      email: 'rls-test@example.com',
      message: 'RLS anon insert test — delete this row',
    })
    // Anon insert on inquiries should succeed (inquiries_anon_insert policy)
    expect(error).toBeNull()
    // We don't clean this up here as we can't SELECT it back (no SELECT policy for anon)
    void data
  })

  it('anon cannot SELECT from admin_users (own-row policy, anon has no row)', async () => {
    const { data, error } = await anonClient!.from('admin_users').select('id, role')
    // Either an error or an empty result — anon has no row in admin_users
    if (error) {
      expect(error.message).toBeTruthy()
    } else {
      expect(data).toHaveLength(0)
    }
  })
})
