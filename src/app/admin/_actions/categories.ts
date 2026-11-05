'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { CreateCategorySchema, UpdateCategorySchema } from '@/lib/validations/category'

export async function createCategoryAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin()

  const raw = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    sort_order: formData.get('sort_order')
      ? parseInt(formData.get('sort_order') as string, 10)
      : 0,
  }

  const result = CreateCategorySchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Validation error' }
  }

  await db.createCategory(result.data)
  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  return {}
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin()

  const raw = {
    name: formData.get('name') as string | undefined,
    slug: formData.get('slug') as string | undefined,
    sort_order: formData.get('sort_order')
      ? parseInt(formData.get('sort_order') as string, 10)
      : undefined,
  }

  const result = UpdateCategorySchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Validation error' }
  }

  await db.updateCategory(id, result.data)
  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  return {}
}
