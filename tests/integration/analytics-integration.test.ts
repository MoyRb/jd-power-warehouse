/**
 * Integration smoke tests for SupabaseAdapter analytics methods.
 * Skipped when NEXT_PUBLIC_SUPABASE_URL is not set.
 *
 * Uses anon client injection — reads only, no admin session required.
 * SupabaseAdapter analytics methods wrap errors with try/catch,
 * so these tests verify shape and types, not specific values.
 */
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { SupabaseAdapter } from '../../src/lib/db/supabase-adapter'

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

describe.skipIf(!HAS_SUPABASE)('SupabaseAdapter analytics (real JDHOUSE DB)', () => {
  const anonClientFactory = () =>
    Promise.resolve(
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ) as ReturnType<typeof createClient>,
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new SupabaseAdapter(anonClientFactory as any)

  it('getProductStats returns a ProductStats object with numeric fields', async () => {
    const stats = await adapter.getProductStats()
    expect(typeof stats.total).toBe('number')
    expect(typeof stats.published).toBe('number')
    expect(typeof stats.draft).toBe('number')
    expect(typeof stats.archived).toBe('number')
    expect(typeof stats.totalCategories).toBe('number')
    expect(typeof stats.totalUnits).toBe('number')
    expect(typeof stats.outOfStock).toBe('number')
    expect(typeof stats.lowStock).toBe('number')
    expect(typeof stats.estimatedInventoryValue).toBe('number')
  })

  it('getProductStats.total >= 0 and matches published + draft + archived', async () => {
    const stats = await adapter.getProductStats()
    expect(stats.total).toBeGreaterThanOrEqual(0)
    expect(stats.total).toBe(stats.published + stats.draft + stats.archived)
  })

  it('getCategoryStats returns an array', async () => {
    const stats = await adapter.getCategoryStats()
    expect(Array.isArray(stats)).toBe(true)
    for (const c of stats) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.name).toBe('string')
      expect(typeof c.productCount).toBe('number')
      expect(typeof c.estimatedValue).toBe('number')
    }
  })

  it('getInquiryStats returns InquiryStats with numeric fields', async () => {
    const stats = await adapter.getInquiryStats()
    expect(typeof stats.total).toBe('number')
    expect(typeof stats.pending).toBe('number')
    expect(typeof stats.byType).toBe('object')
    expect(typeof stats.byStatus).toBe('object')
    expect(Array.isArray(stats.trend)).toBe(true)
  })

  it('getLowStockProducts returns LowStockProduct array', async () => {
    const result = await adapter.getLowStockProducts(999) // high threshold → likely returns items
    expect(Array.isArray(result)).toBe(true)
    for (const p of result) {
      expect(typeof p.id).toBe('string')
      expect(typeof p.name).toBe('string')
      expect(typeof p.quantity).toBe('number')
      expect(['draft', 'published', 'archived'].includes(p.status)).toBe(true)
    }
  })
})
