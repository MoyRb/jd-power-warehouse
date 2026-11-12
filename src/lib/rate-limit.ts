/**
 * Persistent, cross-instance rate limiter backed by Supabase PostgreSQL.
 *
 * Primary: calls `check_quote_rate_limit(TEXT)` — a SECURITY DEFINER RPC
 * (migration 20261111000000_quote_rate_limits.sql) that performs an atomic
 * INSERT … ON CONFLICT with hard-coded limits (5 requests / 15 min).
 * Limits are hard-coded inside the SQL function to prevent an anon caller
 * from bypassing them via a direct RPC call with relaxed parameters.
 *
 * Fallback: if Supabase is unavailable, falls back to an in-process Map.
 * The in-process Map resets on instance restart (unreliable across multiple
 * serverless instances) but is better than failing fully open.
 *
 * Failure policy:
 *   - Supabase reachable → primary path (persistent, cross-instance)
 *   - Supabase unavailable → in-process Map (best-effort, instance-local)
 *   - In-process Map throws → fail-open (allow request, log error)
 *
 * IP note: on Vercel, x-forwarded-for is set by the edge and cannot be
 * spoofed by the client. The first value is the real client IP. IPs are
 * hashed (SHA-256, 16 hex chars) before any use or storage.
 */

import { createClient } from '@supabase/supabase-js'

const RATE_LIMIT          = 5
const RATE_WINDOW_MS      = 15 * 60 * 1000

// ── In-process fallback ──────────────────────────────────────────────────────
// Used only when Supabase is unreachable. Resets on cold start.
// A Map is acceptable here because it only matters per-instance; the primary
// DB path handles the cross-instance case.
const fallbackMap = new Map<string, { count: number; windowStart: number }>()

function checkFallback(ipHash: string): boolean {
  const now    = Date.now()
  const record = fallbackMap.get(ipHash)

  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    fallbackMap.set(ipHash, { count: 1, windowStart: now })
    return true
  }
  if (record.count >= RATE_LIMIT) return false
  record.count++
  return true
}

// ── Primary: Supabase RPC ─────────────────────────────────────────────────────

/** Returns true if the request is allowed, false if it should be blocked. */
export async function checkQuoteRateLimit(ipHash: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Supabase not configured — use in-process fallback (local dev without .env.local).
    return checkFallback(ipHash)
  }

  try {
    // Use a lightweight anon client; no cookie handling needed for this call.
    const client = createClient(url, key)

    // Function signature is check_quote_rate_limit(TEXT) — limits are hard-coded
    // inside the SQL function to prevent anon-caller bypass via parameter override.
    const { data, error } = await client.rpc('check_quote_rate_limit', {
      p_id_hash: ipHash,
    })

    if (error) {
      console.error('[rate-limit] RPC error — falling back to in-process:', error.message)
      return checkFallback(ipHash)
    }

    // Probabilistic cleanup: ~1 in 100 requests triggers a stale-row purge.
    // This avoids a dedicated cron job while keeping the table small.
    if (Math.random() < 0.01) {
      void client.rpc('cleanup_quote_rate_limits').then(({ error: cleanErr }) => {
        if (cleanErr) console.error('[rate-limit] Cleanup error:', cleanErr.message)
      })
    }

    return data === true
  } catch (err) {
    console.error('[rate-limit] Unexpected error — falling back to in-process:', err)
    return checkFallback(ipHash)
  }
}
