'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { AdjustInventorySchema } from '@/lib/validations/inventory'

export async function adjustInventoryAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin()

  const raw = {
    product_id: formData.get('product_id') as string,
    delta: parseInt(formData.get('delta') as string, 10),
    reason: formData.get('reason') as string,
  }

  const result = AdjustInventorySchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Validation error' }
  }

  await db.adjustInventory(result.data.product_id, result.data.delta, result.data.reason)
  revalidatePath('/admin/inventory')
  revalidatePath('/shop')
  return {}
}
