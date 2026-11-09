/**
 * Integration smoke tests for image-related SupabaseAdapter methods (T6 — Corte 3D).
 * Skipped when NEXT_PUBLIC_SUPABASE_URL is not set.
 *
 * Uses anon client — read-only checks only (write operations require admin session).
 * Verifies: updateImageAltText signature, getProduct includes images array,
 * and that getProductImageSrc produces a valid URL for real storage paths.
 */
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { SupabaseAdapter } from '../../src/lib/db/supabase-adapter'
import { getProductImageSrc } from '../../src/lib/product-image'

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

describe.skipIf(!HAS_SUPABASE)('Image infrastructure (real JDHOUSE DB)', () => {
  const anonClientFactory = () =>
    Promise.resolve(
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ) as ReturnType<typeof createClient>,
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new SupabaseAdapter(anonClientFactory as any)

  it('getProduct returns images array (possibly empty)', async () => {
    const all = await adapter.listProducts()
    expect(all.data.length).toBeGreaterThan(0)
    const product = await adapter.getProduct(all.data[0].id)
    expect(product).not.toBeNull()
    expect(Array.isArray(product?.images)).toBe(true)
  })

  it('getProductImageSrc returns a Supabase URL for a real storage path', () => {
    const path = 'product-id/image-id.jpg'
    const url = getProductImageSrc(path, process.env.NEXT_PUBLIC_SUPABASE_URL)
    expect(url).toBeTruthy()
    expect(url).toContain('/storage/v1/object/public/product-images/')
    expect(url).toContain(path)
  })

  it('getProductImageSrc returns local paths unchanged', () => {
    expect(getProductImageSrc('/images/logo.png')).toBe('/images/logo.png')
  })

  it('getProductImageSrc returns null for mock paths', () => {
    expect(getProductImageSrc('mock://product-images/p1/img1')).toBeNull()
  })

  it('updateImageAltText is defined on the adapter', () => {
    expect(typeof adapter.updateImageAltText).toBe('function')
  })
})
