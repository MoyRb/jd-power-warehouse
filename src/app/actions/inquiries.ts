'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { CreateInquirySchema } from '@/lib/validations/inquiry'
import type { CreateInquiryInput } from '@/lib/validations/inquiry'
import type { CreateInquiryInput as DbCreateInquiryInput } from '@/lib/db/types'

// In-memory rate limiter: ip_hash → list of timestamps
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60_000

async function getIpHash(): Promise<string> {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
  return createHash('sha256').update(ip).digest('hex')
}

function isRateLimited(ipHash: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(ipHash) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  )
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  rateLimitMap.set(ipHash, [...timestamps, now])
  return false
}

export async function submitInquiryAction(
  data: CreateInquiryInput,
): Promise<{ success: boolean }> {
  // Validate — silent on failure to prevent enumeration
  const result = CreateInquirySchema.safeParse(data)
  if (!result.success) return { success: true }

  const ipHash = await getIpHash()

  // Rate limit — silent
  if (isRateLimited(ipHash)) return { success: true }

  await db.createInquiry({ ...result.data, ip_hash: ipHash } as DbCreateInquiryInput)
  return { success: true }
}
