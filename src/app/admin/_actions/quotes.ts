'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import type { QuoteStatus } from '@/lib/db/types'

export async function updateQuoteStatusAction(
  quoteId: string,
  newStatus: QuoteStatus,
  note: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await db.updateQuoteStatus(quoteId, newStatus, note || null)
    revalidatePath('/admin/quotes')
    revalidatePath(`/admin/quotes/${quoteId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

export async function setQuoteLinePricesAction(
  quoteId: string,
  prices: Array<{ lineId: string; unitQuotedPrice: number | null }>,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await db.setQuoteLinePrices(quoteId, prices)
    revalidatePath(`/admin/quotes/${quoteId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

export async function addQuoteLineAction(
  quoteId: string,
  line: { product_id?: string | null; quantity: number; description?: string | null; customer_note?: string | null },
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await db.addQuoteLine(quoteId, line)
    revalidatePath(`/admin/quotes/${quoteId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

export async function removeQuoteLineAction(
  quoteId: string,
  lineId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await db.removeQuoteLine(quoteId, lineId)
    revalidatePath(`/admin/quotes/${quoteId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}
