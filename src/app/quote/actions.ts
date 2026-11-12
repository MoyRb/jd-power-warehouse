'use server'

import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { CreateQuoteSchema } from '@/lib/validations/quote'
import { checkQuoteRateLimit } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// IP hash helper — hashes the client IP before use or storage.
// On Vercel, x-forwarded-for is set by the Vercel edge (not spoofable by
// the client); the first value is the real client IP.
// ---------------------------------------------------------------------------
async function getIpHash(): Promise<string> {
  try {
    const headerStore = await headers()
    const ip =
      headerStore.get('x-forwarded-for') ??
      headerStore.get('x-real-ip') ??
      'unknown'
    return createHash('sha256').update(ip.split(',')[0].trim()).digest('hex').slice(0, 16)
  } catch {
    return 'unknown'
  }
}

export interface SubmitQuoteResult {
  success: boolean
  quoteRef?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export async function submitQuoteAction(
  _prevState: SubmitQuoteResult | null,
  formData: FormData,
): Promise<SubmitQuoteResult> {
  const ipHash = await getIpHash()

  const allowed = await checkQuoteRateLimit(ipHash)
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please wait a few minutes before trying again.' }
  }

  // Parse lines from JSON payload embedded in form
  let linesRaw: unknown
  try {
    linesRaw = JSON.parse(formData.get('lines') as string ?? '[]')
  } catch {
    return { success: false, error: 'Invalid request format.' }
  }

  const raw = {
    anon_name:    formData.get('anon_name') as string,
    anon_email:   formData.get('anon_email') as string,
    anon_phone:   formData.get('anon_phone') as string | null || null,
    anon_company: formData.get('anon_company') as string | null || null,
    lines: linesRaw,
    ip_hash: ipHash,
  }

  const result = CreateQuoteSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: result.error.issues[0]?.message ?? 'Validation error',
      fieldErrors,
    }
  }

  try {
    const quote = await db.createQuote(result.data)
    return { success: true, quoteRef: quote.quote_ref }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    // Map RPC error codes to user-friendly messages
    if (msg.includes('product_not_found')) return { success: false, error: 'One or more selected products are no longer available.' }
    if (msg.includes('too_many_lines')) return { success: false, error: 'A quote request can contain at most 20 items.' }
    if (msg.includes('lines_required')) return { success: false, error: 'Add at least one item to your quote request.' }
    return { success: false, error: 'Unable to submit your request. Please try again.' }
  }
}
