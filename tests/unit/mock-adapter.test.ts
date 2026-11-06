import { describe, it, expect, beforeEach } from 'vitest'
import { MockAdapter } from '../../src/lib/db/mock-adapter'

describe('MockAdapter', () => {
  let adapter: MockAdapter

  beforeEach(() => {
    adapter = new MockAdapter()
  })

  it('listProducts returns all 16 published products by default', async () => {
    const result = await adapter.listProducts()
    expect(result.data.length).toBe(16)
    expect(result.total).toBe(16)
    expect(result.data.every((p) => p.status === 'published')).toBe(true)
  })

  it('listProducts with status filter returns only matching products', async () => {
    const result = await adapter.listProducts({ status: 'draft' })
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('getProduct returns null for unknown id', async () => {
    const product = await adapter.getProduct('00000000-0000-0000-0000-000000000000')
    expect(product).toBeNull()
  })

  it('createProduct assigns a uuid id and defaults status to draft', async () => {
    const product = await adapter.createProduct({
      name: 'Test Widget',
      price: 9.99,
      status: 'draft',
    })
    expect(product.id).toBeTruthy()
    expect(product.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(product.status).toBe('draft')
    expect(product.name).toBe('Test Widget')
  })

  it('setProductStatus archived persists and getProduct reflects it', async () => {
    const all = await adapter.listProducts()
    const target = all.data[0]
    await adapter.setProductStatus(target.id, 'archived')
    const updated = await adapter.getProduct(target.id)
    expect(updated?.status).toBe('archived')
  })

  it('listProducts with status published excludes archived product', async () => {
    const all = await adapter.listProducts()
    const target = all.data[0]
    await adapter.setProductStatus(target.id, 'archived')
    const published = await adapter.listProducts({ status: 'published' })
    expect(published.data.find((p) => p.id === target.id)).toBeUndefined()
  })

  it('adjustInventory increases quantity', async () => {
    const all = await adapter.listProducts()
    const productId = all.data[0].id
    const before = await adapter.getInventory(productId)
    const beforeQty = before?.quantity ?? 0
    const after = await adapter.adjustInventory(productId, 5, 'restock')
    expect(after.quantity).toBe(beforeQty + 5)
  })

  it('adjustInventory clamps quantity to minimum 0', async () => {
    const all = await adapter.listProducts()
    const productId = all.data[0].id
    const before = await adapter.getInventory(productId)
    const currentQty = before?.quantity ?? 0
    // delta larger than current quantity
    const after = await adapter.adjustInventory(productId, -(currentQty + 100), 'over-adjustment')
    expect(after.quantity).toBe(0)
  })

  it('createInquiry persists and appears in listInquiries', async () => {
    const before = await adapter.listInquiries()
    await adapter.createInquiry({
      type: 'contact',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello, I need help.',
    })
    const after = await adapter.listInquiries()
    expect(after.total).toBe(before.total + 1)
    expect(after.data.some((i) => i.email === 'jane@example.com')).toBe(true)
  })

  it('listProducts pagination returns correct slice', async () => {
    // Add a few draft products to have more than per_page
    for (let i = 0; i < 5; i++) {
      await adapter.createProduct({ name: `Draft ${i}`, price: 1, status: 'draft' })
    }
    const page1 = await adapter.listProducts({ status: 'draft', page: 1, per_page: 2 })
    expect(page1.data.length).toBe(2)
    expect(page1.page).toBe(1)
    expect(page1.per_page).toBe(2)
    expect(page1.total).toBeGreaterThanOrEqual(5)
  })

  it('listProducts includes quantity on each product', async () => {
    const result = await adapter.listProducts()
    expect(result.data[0].quantity).toBeDefined()
    expect(typeof result.data[0].quantity).toBe('number')
  })

  it('listProducts({ status: published }) returns empty when all products are archived', async () => {
    // Archive all products
    const all = await adapter.listProducts()
    for (const p of all.data) {
      await adapter.setProductStatus(p.id, 'archived')
    }
    const result = await adapter.listProducts({ status: 'published' })
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
  })

  it('uploadImage rejects file with type application/javascript', async () => {
    const all = await adapter.listProducts()
    const productId = all.data[0].id
    await expect(
      adapter.uploadImage(productId, {
        name: 'malicious.jpg',
        type: 'application/javascript',
        size: 1024,
        buffer: Buffer.from(''),
      }),
    ).rejects.toThrow('INVALID_TYPE')
  })

  it('uploadImage rejects file larger than 5MB', async () => {
    const all = await adapter.listProducts()
    const productId = all.data[0].id
    await expect(
      adapter.uploadImage(productId, {
        name: 'huge.jpg',
        type: 'image/jpeg',
        size: 6 * 1024 * 1024,
        buffer: Buffer.from(''),
      }),
    ).rejects.toThrow('FILE_TOO_LARGE')
  })
})
