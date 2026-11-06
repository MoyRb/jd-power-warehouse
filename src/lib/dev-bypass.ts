/**
 * Single source of truth for dev bypass eligibility.
 *
 * Returns true ONLY when BOTH conditions hold:
 *   1. NODE_ENV is not 'production' — structural guard. Next.js always sets
 *      NODE_ENV='production' for `next build` / `next start`, so this cannot
 *      be satisfied on a production deployment regardless of env vars.
 *   2. ADMIN_DEV_BYPASS === 'true' — explicit opt-in that must NOT appear in
 *      production environment variables (Vercel, Railway, Fly, etc.).
 *
 * All auth and DB selection code must call this function, never inline the
 * check, so this invariant is enforced in one place.
 */
export function isDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.ADMIN_DEV_BYPASS === 'true'
  )
}
