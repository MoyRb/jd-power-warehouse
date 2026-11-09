/**
 * Real admin upload test — validates full image upload flow against JDHOUSE.
 *
 * Requirements in .env.local:
 *   SUPABASE_ADMIN_EMAIL=<admin email registered in auth.users + admin_users>
 *   SUPABASE_ADMIN_PASSWORD=<admin password>
 *
 * The test signs in, uploads a minimal JPEG via SupabaseAdapter,
 * verifies persistence in product_images, confirms getProductImageSrc
 * produces a public URL, then cleans up.
 *
 * Skipped when credentials or Supabase URL are absent.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SupabaseAdapter } from '../../src/lib/db/supabase-adapter'
import { getProductImageSrc } from '../../src/lib/product-image'

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const HAS_ADMIN_CREDS =
  HAS_SUPABASE &&
  !!process.env.SUPABASE_ADMIN_EMAIL &&
  !!process.env.SUPABASE_ADMIN_PASSWORD

// Minimal valid JPEG — SOI marker + APP0 + EOI (22 bytes; Supabase stores it as-is)
const TINY_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
])

describe.skipIf(!HAS_ADMIN_CREDS)('Admin image upload — real Supabase storage (JDHOUSE)', () => {
  let adminClient: SupabaseClient
  let adapter: SupabaseAdapter
  let createdImageId: string | undefined
  let targetProductId: string | undefined

  // Sign in once before all tests in this suite
  beforeAll(async () => {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { error } = await adminClient.auth.signInWithPassword({
      email: process.env.SUPABASE_ADMIN_EMAIL!,
      password: process.env.SUPABASE_ADMIN_PASSWORD!,
    })
    if (error) throw new Error(`Admin sign-in failed: ${error.message}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter = new SupabaseAdapter(() => Promise.resolve(adminClient as any))
  })

  afterAll(async () => {
    if (createdImageId && targetProductId) {
      await adapter.deleteImage(createdImageId)
    }
    await adminClient?.auth.signOut()
  })

  it('uploads a JPEG and persists a product_images row', async () => {
    // Pick a real product to associate the test image with
    const { data: products } = await adminClient
      .from('products')
      .select('id')
      .eq('status', 'published')
      .limit(1)
      .single()

    expect(products).not.toBeNull()
    targetProductId = products!.id as string

    const img = await adapter.uploadImage(targetProductId!, {
      name: '[integration-test] tiny.jpg',
      type: 'image/jpeg',
      size: TINY_JPEG.length,
      buffer: TINY_JPEG,
    })

    createdImageId = img.id

    expect(img.id).toBeTruthy()
    expect(img.product_id).toBe(targetProductId)
    expect(img.storage_path).toMatch(new RegExp(`^${targetProductId}/`))
    expect(img.storage_path).toMatch(/\.jpg$/)
  })

  it('product_images row is queryable by anon after upload', async () => {
    expect(createdImageId).toBeTruthy()
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    // Anon can read published product images (RLS: anon SELECT allowed on published products)
    const { data, error } = await anonClient
      .from('product_images')
      .select('id, storage_path')
      .eq('id', createdImageId!)
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBe(createdImageId)
  })

  it('getProductImageSrc returns a valid public Storage URL', () => {
    expect(createdImageId).toBeTruthy()
    // We know the storage_path from the previous test run; query it again via adapter
    // For this assertion we just need a known path pattern
    const fakePath = `${targetProductId}/test-image.jpg`
    const url = getProductImageSrc(fakePath, process.env.NEXT_PUBLIC_SUPABASE_URL)
    expect(url).toBe(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${fakePath}`,
    )
  })

  it('anon CANNOT upload to storage (RLS blocks INSERT without is_admin())', async () => {
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { error } = await anonClient.storage
      .from('product-images')
      .upload('anon-test/should-fail.jpg', TINY_JPEG, { contentType: 'image/jpeg' })

    expect(error).not.toBeNull()
  })
})
