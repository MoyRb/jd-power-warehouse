'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { CreateProductSchema, UpdateProductSchema } from '@/lib/validations/product'
import type { ProductStatus } from '@/lib/db/types'

export async function setProductStatusAction(
  productId: string,
  status: ProductStatus,
): Promise<void> {
  await requireAdmin()
  await db.setProductStatus(productId, status)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
}

export async function createProductAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin()

  const raw = {
    name: formData.get('name') as string,
    description: formData.get('description') as string | null || null,
    price: parseFloat(formData.get('price') as string),
    original_price: formData.get('original_price')
      ? parseFloat(formData.get('original_price') as string)
      : null,
    sku: formData.get('sku') as string | null || null,
    category_id: formData.get('category_id') as string | null || null,
    status: formData.get('status') as string,
    badge: formData.get('badge') as string | null || null,
  }

  const result = CreateProductSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Validation error' }
  }

  await db.createProduct(result.data)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return {}
}

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin()

  const raw = {
    name: formData.get('name') as string | undefined,
    description: formData.get('description') as string | null || null,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
    original_price: formData.get('original_price')
      ? parseFloat(formData.get('original_price') as string)
      : null,
    sku: formData.get('sku') as string | null || null,
    category_id: formData.get('category_id') as string | null || null,
    status: formData.get('status') as string | undefined,
    badge: formData.get('badge') as string | null || null,
  }

  const result = UpdateProductSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Validation error' }
  }

  await db.updateProduct(id, result.data)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return {}
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

const MAX_IMAGES_PER_PRODUCT = 10

export async function uploadProductImageAction(
  productId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const product = await db.getProduct(productId)
  if ((product?.images?.length ?? 0) >= MAX_IMAGES_PER_PRODUCT) {
    return { error: `Maximum ${MAX_IMAGES_PER_PRODUCT} images per product` }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Only JPEG, PNG, and WebP images are allowed' }
  }
  if (file.size > MAX_SIZE) {
    return { error: 'Image must be 5 MB or smaller' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  try {
    await db.uploadImage(productId, {
      name: file.name,
      type: file.type,
      size: file.size,
      buffer,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return { error: msg === 'INVALID_TYPE' ? 'Invalid file type' : msg === 'FILE_TOO_LARGE' ? 'File too large' : msg }
  }

  revalidatePath(`/admin/products/${productId}/edit`)
  return {}
}

export async function deleteProductImageAction(
  imageId: string,
  productId: string,
): Promise<void> {
  await requireAdmin()
  await db.deleteImage(imageId)
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function reorderImagesAction(
  productId: string,
  imageIds: string[],
): Promise<void> {
  await requireAdmin()
  await db.reorderImages(productId, imageIds)
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function updateImageAltTextAction(
  imageId: string,
  productId: string,
  altText: string,
): Promise<{ error?: string }> {
  await requireAdmin()
  const trimmed = altText.trim()
  if (!trimmed) return { error: 'Alt text cannot be empty' }
  if (trimmed.length > 200) return { error: 'Alt text must be 200 characters or fewer' }
  try {
    await db.updateImageAltText(imageId, productId, trimmed)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update alt text' }
  }
  revalidatePath(`/admin/products/${productId}/edit`)
  return {}
}
