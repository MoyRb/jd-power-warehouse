/**
 * Unit tests for DataAdapter analytics methods — exercised via MockAdapter.
 * Covers all Review Focus items from the plan.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MockAdapter } from '../../src/lib/db/mock-adapter'

describe('MockAdapter analytics', () => {
  let adapter: MockAdapter

  beforeEach(() => {
    adapter = new MockAdapter()
  })

  // ---- getProductStats ----

  it('getProductStats returns correct counts for seeded data', async () => {
    const stats = await adapter.getProductStats()
    // MockAdapter seeds 16 products all as 'published'
    expect(stats.total).toBe(16)
    expect(stats.published).toBe(16)
    expect(stats.draft).toBe(0)
    expect(stats.archived).toBe(0)
    expect(stats.totalCategories).toBeGreaterThanOrEqual(1)
    expect(typeof stats.totalUnits).toBe('number')
    expect(typeof stats.estimatedInventoryValue).toBe('number')
  })

  it('getProductStats.estimatedInventoryValue excludes archived products', async () => {
    const before = await adapter.getProductStats()
    // Archive one product that has quantity 10
    const products = await adapter.listProducts({ status: 'published' })
    const target = products.data[0]
    await adapter.setProductStatus(target.id, 'archived')
    const after = await adapter.getProductStats()
    expect(after.estimatedInventoryValue).toBeLessThan(before.estimatedInventoryValue)
    expect(after.archived).toBe(1)
  })

  it('getProductStats.outOfStock counts products with quantity=0', async () => {
    // Set one product to 0 inventory
    const products = await adapter.listProducts({ status: 'published' })
    const target = products.data[0]
    await adapter.adjustInventory(target.id, -10, 'test drain')
    const stats = await adapter.getProductStats()
    expect(stats.outOfStock).toBeGreaterThanOrEqual(1)
  })

  it('getProductStats.lowStock counts 0<qty<=threshold, not outOfStock products', async () => {
    // Set one product to exactly threshold quantity (default 5)
    const products = await adapter.listProducts({ status: 'published' })
    const target = products.data[0]
    // drain from 10 to 3 → lowStock
    await adapter.adjustInventory(target.id, -7, 'test to low')
    const stats = await adapter.getProductStats(5)
    expect(stats.lowStock).toBeGreaterThanOrEqual(1)
    // outOfStock should not include the product at qty=3
    const outBefore = stats.outOfStock
    await adapter.adjustInventory(target.id, -3, 'drain to zero')
    const stats2 = await adapter.getProductStats(5)
    expect(stats2.outOfStock).toBeGreaterThan(outBefore)
    expect(stats2.lowStock).toBeLessThanOrEqual(stats.lowStock) // moved from lowStock to outOfStock
  })

  it('getProductStats with threshold=0 returns lowStock=0', async () => {
    const stats = await adapter.getProductStats(0)
    expect(stats.lowStock).toBe(0)
  })

  // ---- getCategoryStats ----

  it('getCategoryStats returns entry for every category, even with 0 products', async () => {
    // Create a new empty category
    const empty = await adapter.createCategory({ name: 'Empty Cat', slug: 'empty-cat' })
    const stats = await adapter.getCategoryStats()
    const found = stats.find((c) => c.id === empty.id)
    expect(found).toBeDefined()
    expect(found!.productCount).toBe(0)
    expect(found!.publishedCount).toBe(0)
    expect(found!.totalUnits).toBe(0)
    expect(found!.estimatedValue).toBe(0)
  })

  it('getCategoryStats.estimatedValue excludes archived products', async () => {
    // Pick a category that has products
    const stats = await adapter.getCategoryStats()
    const withProducts = stats.find((c) => c.productCount > 0)
    if (!withProducts) return // no category with products, skip
    const before = withProducts.estimatedValue

    // Archive all products in that category
    const products = await adapter.listProducts({ category_id: withProducts.id })
    for (const p of products.data) {
      await adapter.setProductStatus(p.id, 'archived')
    }

    const statsAfter = await adapter.getCategoryStats()
    const after = statsAfter.find((c) => c.id === withProducts.id)!
    expect(after.estimatedValue).toBeLessThan(before)
  })

  // ---- getInquiryStats ----

  it('getInquiryStats with empty adapter returns zeros and empty trend', async () => {
    // Fresh adapter has no inquiries
    const stats = await adapter.getInquiryStats()
    expect(stats.total).toBe(0)
    expect(stats.pending).toBe(0)
    expect(Array.isArray(stats.trend)).toBe(true)
    // trend may be empty or have zero-count entries
    for (const entry of stats.trend) {
      expect(entry.count).toBe(0)
    }
  })

  it('getInquiryStats.pending = byStatus.new + byStatus.read', async () => {
    // Create some inquiries
    await adapter.createInquiry({ type: 'contact', name: 'A', message: 'x' })
    await adapter.createInquiry({ type: 'quick_inquiry', name: 'B', message: 'y' })
    const all = await adapter.listInquiries()
    const inq0 = all.data[0]
    // Mark one as 'read'
    await adapter.updateInquiryStatus(inq0.id, 'read')

    const stats = await adapter.getInquiryStats()
    const pending = (stats.byStatus['new'] ?? 0) + (stats.byStatus['read'] ?? 0)
    expect(stats.pending).toBe(pending)
    expect(stats.total).toBe(2)
  })

  // ---- getLowStockProducts ----

  it('getLowStockProducts returns only products at or below threshold', async () => {
    // Default all products have qty=10, threshold=5 → no low stock
    const result = await adapter.getLowStockProducts(5)
    // All products have qty=10, so none should appear
    expect(result.length).toBe(0)

    // Set one to qty=3
    const products = await adapter.listProducts()
    await adapter.adjustInventory(products.data[0].id, -7, 'drain')
    const result2 = await adapter.getLowStockProducts(5)
    expect(result2.length).toBeGreaterThanOrEqual(1)
    for (const p of result2) {
      expect(p.quantity).toBeLessThanOrEqual(5)
    }
  })

  it('getLowStockProducts with threshold=0 returns only out-of-stock products', async () => {
    // Drain one product to 0
    const products = await adapter.listProducts()
    const target = products.data[0]
    await adapter.adjustInventory(target.id, -10, 'drain to zero')

    // Also set another to 3 (should NOT appear at threshold=0)
    const target2 = products.data[1]
    await adapter.adjustInventory(target2.id, -7, 'drain partial')

    const result = await adapter.getLowStockProducts(0)
    expect(result.every((p) => p.quantity === 0)).toBe(true)
    // The partially drained product should not appear
    const ids = result.map((p) => p.id)
    expect(ids).not.toContain(target2.id)
  })
})
