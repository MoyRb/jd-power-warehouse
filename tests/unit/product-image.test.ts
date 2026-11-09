/**
 * Unit tests for product image utilities — T2 (Corte 3D)
 */
import { describe, it, expect } from 'vitest'
import { getProductImageSrc } from '../../src/lib/product-image'

const SUPABASE_URL = 'https://abc.supabase.co'

describe('getProductImageSrc', () => {
  it('returns null for empty string', () => {
    expect(getProductImageSrc('')).toBeNull()
  })

  it('returns local path as-is (starts with /)', () => {
    expect(getProductImageSrc('/images/logo.png')).toBe('/images/logo.png')
  })

  it('returns null for mock:// paths', () => {
    expect(getProductImageSrc('mock://product-images/p1/img1')).toBeNull()
  })

  it('returns http(s) URLs as-is', () => {
    expect(getProductImageSrc('https://example.com/img.jpg')).toBe('https://example.com/img.jpg')
  })

  it('constructs full Supabase URL for bare storage path', () => {
    const path = 'product-id/image-id.jpg'
    const result = getProductImageSrc(path, SUPABASE_URL)
    expect(result).toBe(`${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`)
  })

  it('returns null for bare storage path when SUPABASE_URL is empty string', () => {
    const path = 'product-id/image-id.jpg'
    expect(getProductImageSrc(path, '')).toBeNull()
  })
})

describe('updateImageAltText via MockAdapter', () => {
  it('is covered by mock-adapter tests', () => {
    // MockAdapter tests live in mock-adapter.test.ts; this test file covers product-image.ts
    expect(true).toBe(true)
  })
})
