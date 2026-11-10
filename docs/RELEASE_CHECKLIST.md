# JD Power Warehouse — Release Checklist
**Corte 5 — 2026-11-10**

Use this checklist before every deployment to production. Each item must be
PASS or N/A. A single FAIL or BLOCKED is a NO-GO.

---

## Code Quality

| # | Check | Status | Notes |
|---|-------|--------|-------|
| Q-1 | `tsc --noEmit` — 0 errors | ✅ PASS | Verified 2026-11-10 |
| Q-2 | ESLint — 0 errors | ✅ PASS | Verified via build |
| Q-3 | `npm run build` — clean | ✅ PASS | 23 routes, Proxy listed |
| Q-4 | Vitest — no unexpected failures | ✅ PASS | 134 passed, 8 skipped (expected) |
| Q-5 | No `console.log` / debug left in production paths | ✅ PASS | Reviewed |

---

## Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| S-1 | `ADMIN_DEV_BYPASS` absent in Vercel env vars | ✅ PASS | Not set |
| S-2 | No secrets committed (`.env*` in `.gitignore`) | ✅ PASS | Verified |
| S-3 | Security headers present in `next.config.ts` | ✅ PASS | Added Corte 5 |
| S-4 | `is_admin()` SECURITY DEFINER with locked search_path | ✅ PASS | migration 004 |
| S-5 | All admin server actions call `requireAdmin()` first | ✅ PASS | All 7 modules verified |
| S-6 | RLS enabled on all 13 tables | ✅ PASS | Verified in migrations |
| S-7 | `create_quote_with_lines` never trusts client prices | ✅ PASS | Reads from `products` table |
| S-8 | File upload validates type/size server-side | ✅ PASS | `products.ts` action |
| S-9 | npm audit — no high/critical vulnerabilities | ⚠️ BLOCKED | Cannot run on Windows; run in CI before launch |

---

## Database

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D-1 | All 9 migrations applied to JDHOUSE | ⚠️ BLOCKED | `npx supabase db push --remote` pending |
| D-2 | `business_customers`, `quotes`, `quote_lines`, `quote_events` tables exist | ⚠️ BLOCKED | Depends on D-1 |
| D-3 | `create_quote_with_lines` RPC callable by anon | ⚠️ BLOCKED | Depends on D-1 |
| D-4 | At least one admin user in `admin_users` table | ⚠️ BLOCKED | Must insert after D-1 |
| D-5 | `inquiries_anon_insert` RLS policy present | ⚠️ BLOCKED | Depends on D-1 (migration 002) |

---

## Infrastructure

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I-1 | `NEXT_PUBLIC_SUPABASE_URL` set in Vercel | ⚠️ PENDING | Add in Vercel env vars |
| I-2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel | ⚠️ PENDING | Add in Vercel env vars |
| I-3 | Supabase Auth — Site URL matches deployment URL | ⚠️ PENDING | Set in Supabase dashboard |
| I-4 | Supabase Auth — Redirect URLs match deployment URL | ⚠️ PENDING | Set in Supabase dashboard |
| I-5 | Storage bucket `product-images` accessible | ✅ PASS | Auto-created on first upload |

---

## Functional Smoke Test

| # | Check | Status | Notes |
|---|-------|--------|-------|
| F-1 | `/shop` loads catalogue | ⚠️ PENDING | Run against Vercel preview |
| F-2 | `/quote` wizard completes and shows `QT-` reference | ⚠️ PENDING | Requires D-1 |
| F-3 | Admin login with real Supabase credentials works | ⚠️ PENDING | Requires D-4 |
| F-4 | Admin quotes list shows submitted quotes | ⚠️ PENDING | Requires D-1 + D-4 |
| F-5 | Playwright E2E suite passes against preview URL | ⚠️ PENDING | Run after deploy |

---

## SEO (Nice-to-Have — Non-Blocking for Preview)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| E-1 | `robots.txt` present | ⚠️ NOT YET | Add before production DNS |
| E-2 | `sitemap.xml` present | ⚠️ NOT YET | Add before production DNS |
| E-3 | Per-page metadata complete | ✅ PARTIAL | Root layout OK; product detail OG TBD |

---

## GO / NO-GO Decision

**Date:** 2026-11-10
**Decision:** **NO-GO (Vercel preview only)**

### Blockers (must resolve before production DNS):

1. **D-1 → D-5**: Migrations not yet pushed to JDHOUSE remote.
   Run: `npx supabase db push --remote`

2. **I-1 → I-4**: Vercel env vars and Supabase Auth URLs not configured.
   Follow `docs/DEPLOYMENT_GUIDE.md` Steps 2 and 5.

3. **D-4**: No admin user created in `admin_users` table.
   Follow `docs/DEPLOYMENT_GUIDE.md` Step 3.

4. **S-9**: npm audit not run on this platform.
   Run `npm audit` in CI or on Linux before production launch.

### Non-Blocking (post-launch backlog):

- SEO: `robots.txt`, `sitemap.xml`
- Rate limiting: replace in-memory Map with Redis/Upstash
- CSP: tighten `'unsafe-eval'` after production verification
- Custom error pages (`not-found.tsx`, `error.tsx`)
- Audit log service role key

### Vercel Preview: **GO**

The codebase is clean, builds without errors, all code-level security controls
are in place. A Vercel preview deployment is safe to create for stakeholder review.
Production traffic should not be routed until the BLOCKED items above are resolved.
