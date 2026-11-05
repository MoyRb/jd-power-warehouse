'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { SETTINGS_KEYS } from '@/lib/db/settings-keys'

const SettingValueSchema = z.string().max(500)

export async function updateSettingsAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin()

  for (const key of Object.values(SETTINGS_KEYS)) {
    const raw = formData.get(key)
    if (raw === null) continue

    const result = SettingValueSchema.safeParse(raw)
    if (!result.success) {
      return { error: `Invalid value for ${key}: ${result.error.issues[0]?.message}` }
    }

    await db.setSetting(key, result.data)
  }

  revalidatePath('/admin/settings')
  return {}
}
