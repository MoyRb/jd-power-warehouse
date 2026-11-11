/**
 * Persistent, cross-instance rate limiter backed by Supabase PostgreSQL.
 *
 * Uses the `check_quote_rate_limit` SECURITY DEFINER function (migration
 * 20261111000000_quote_rate_limits.sql) which performs an atomic
 * INSERT … ON CONFLICT to handle concurrent requests correctly.
 *
 * Failure policy: FAIL-OPEN.  If Supabase is unavailable or not configured,
 * the request is allowed and an error is logged server-side.  This prevents
 * a database outage from blocking legitimate users while still rate-limiting
 * under normal conditions.
 *
 * IP note: on Vercel, x-forwarded-for is set by the edge and cannot be
 * spoofed by the client.  The first value in the comma-separated list is
 * the original client IP.  IPs are hashed (SHA-256, truncated to 16 hex
 * chars) before storage — raw IPs are never persisted.
 */

import { createClient } from '@supabase/supabase-js'

const RATE_LIMIT          = 5
const RATE_WINDOW_MINUTES = 15

/** Returns true if the request is allowed, false if it should be blocked. */
export async function checkQuoteRateLimit(ipHash: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Supabase not configured (local dev without .env.local) — fail open.
    return true
  }

  try {
    // Use a lightweight anon client; no cookie handling needed for this call.
    const client = createClient(url, key)

    const { data, error } = await client.rpc('check_quote_rate_limit', {
      p_id_hash:        ipHash,
      p_limit:          RATE_LIMIT,
      p_window_minutes: RATE_WINDOW_MINUTES,
    })

    if (error) {
      console.error('[rate-limit] RPC error — failing open:', error.message)
      return true
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
    console.error('[rate-limit] Unexpected error — failing open:', err)
    return true
  }
}
