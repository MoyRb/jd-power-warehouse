'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import type { InquiryStatus } from '@/lib/db/types'

export async function updateInquiryStatusAction(
  id: string,
  status: InquiryStatus,
): Promise<void> {
  await requireAdmin()
  await db.updateInquiryStatus(id, status)
  revalidatePath('/admin/inquiries')
}
