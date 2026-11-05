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
