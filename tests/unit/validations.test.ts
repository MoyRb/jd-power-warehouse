import { describe, it, expect } from 'vitest'
import { CreateProductSchema, UpdateProductSchema } from '../../src/lib/validations/product'
import { CreateInquirySchema } from '../../src/lib/validations/inquiry'
import { AdjustInventorySchema } from '../../src/lib/validations/inventory'

describe('CreateProductSchema', () => {
  it('rejects negative price', () => {
    const result = CreateProductSchema.safeParse({ name: 'Test', price: -1, status: 'draft' })
    expect(result.success).toBe(false)
  })

  it('rejects price above 999999.99', () => {
    const result = CreateProductSchema.safeParse({ name: 'Test', price: 1000000, status: 'draft' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown status value', () => {
    const result = CreateProductSchema.safeParse({ name: 'Test', price: 10, status: 'deleted' })
    expect(result.success).toBe(false)
  })

  it('accepts valid draft product', () => {
    const result = CreateProductSchema.safeParse({ name: 'Valid Product', price: 99.99, status: 'draft' })
    expect(result.success).toBe(true)
  })
})

describe('UpdateProductSchema', () => {
  it('accepts partial update with only price', () => {
    const result = UpdateProductSchema.safeParse({ price: 49.99 })
    expect(result.success).toBe(true)
  })
})

describe('CreateInquirySchema — quick_inquiry', () => {
  it('rejects empty name', () => {
    const result = CreateInquirySchema.safeParse({
      type: 'quick_inquiry',
      name: '',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid quick_inquiry with no email or phone', () => {
    const result = CreateInquirySchema.safeParse({
      type: 'quick_inquiry',
      name: 'John',
      message: 'Looking for drills',
    })
    expect(result.success).toBe(true)
  })
})

describe('CreateInquirySchema — contact', () => {
  it('rejects malformed email', () => {
    const result = CreateInquirySchema.safeParse({
      type: 'contact',
      name: 'Jane',
      email: 'not-an-email',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid contact inquiry', () => {
    const result = CreateInquirySchema.safeParse({
      type: 'contact',
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello',
    })
    expect(result.success).toBe(true)
  })
})

describe('CreateInquirySchema — sell_request', () => {
  it('rejects sell_request without item_name', () => {
    const result = CreateInquirySchema.safeParse({
      type: 'sell_request',
      name: 'Bob',
      email: 'bob@example.com',
      message: 'Want to sell',
      // item_name missing
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid sell_request with all required fields', () => {
    const result = CreateInquirySchema.safeParse({
      type: 'sell_request',
      name: 'Bob',
      email: 'bob@example.com',
      message: 'Want to sell my drill',
      item_name: 'DeWalt Drill',
    })
    expect(result.success).toBe(true)
  })
})

describe('AdjustInventorySchema', () => {
  it('rejects non-integer delta', () => {
    const result = AdjustInventorySchema.safeParse({
      product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      delta: 2.5,
      reason: 'adjustment',
    })
    expect(result.success).toBe(false)
  })

  it('accepts negative integer delta', () => {
    const result = AdjustInventorySchema.safeParse({
      product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      delta: -3,
      reason: 'sold',
    })
    expect(result.success).toBe(true)
  })
})
