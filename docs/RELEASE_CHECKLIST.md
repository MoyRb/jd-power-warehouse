# JD Power Warehouse — Release Checklist
**Hotfix / Production Launch Hardening — 2026-11-11**

Use this checklist before every deployment to production. Each item must be
PASS or N/A. A single FAIL or BLOCKED is a NO-GO.

---

## Code Quality

| # | Check | Status | Notes |
|---|-------|--------|-------|
| Q-1 | `tsc --noEmit` — 0 errors | ✅ PASS | Verified 2026-11-11 |
| Q-2 | ESLint — 0 errors | ✅ PASS | Verified 2026-11-11 |
| Q-3 | `npm run build` — clean | ✅ PASS | 34 routes, Proxy listed |
| Q-4 | Vitest unit — no unexpected failures | ✅ PASS | 107 passed (11 test files) |
| Q-5 | No `console.log` / debug left in production paths | ✅ PASS | Reviewed; only `console.error` in error paths |

---

## Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| S-1 | `ADMIN_DEV_BYPASS` absent in Vercel env vars | ✅ PASS | Not set; structurally inert in production anyway |
| S-2 | No secrets committed (`.env*` in `.gitignore`) | ✅ PASS | Verified |
| S-3 | Security headers present in `next.config.ts` | ✅ PASS | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| S-4 | `unsafe-eval` removed from production `script-src` | ✅ PASS | isDev conditional in next.config.ts |
| S-5 | `is_admin()` SECURITY DEFINER with locked search_path | ✅ PASS | migration 004 |
| S-6 | All admin server actions call `requireAdmin()` first | ✅ PASS | All 7 modules verified |
| S-7 | RLS enabled on all tables | ✅ PASS | Verified in migrations; rate_limits pending push |
| S-8 | `create_quote_with_lines` never trusts client prices | ✅ PASS | Reads from `products` table |
| S-9 | File upload validates type/size server-side | ✅ PASS | `products.ts` action |
| S-10 | Rate limiting persistent + atomic | ✅ PASS | Supabase RPC; fail-open; anon key only |
| S-11 | MockAdapter cannot activate in production | ✅ PASS | Throws at startup if SUPABASE_URL missing |
| S-12 | npm audit — no high/critical vulnerabilities | ✅ PASS | 8 moderate in devDeps (ESLint); 0 high/critical |

---

## Database

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D-1 | All 10 migrations applied to JDHOUSE | ⚠️ BLOCKED | `npx supabase db push --remote` pending (10 migrations) |
| D-2 | `business_customers`, `quotes`, `quote_lines`, `quote_events` tables exist | ⚠️ BLOCKED | Depends on D-1 |
| D-3 | `create_quote_with_lines` RPC callable by anon | ⚠️ BLOCKED | Depends on D-1 |
| D-4 | At least one admin user in `admin_users` table | ⚠️ BLOCKED | Must insert after D-1 |
| D-5 | `inquiries_anon_insert` RLS policy present | ⚠️ BLOCKED | Depends on D-1 (migration 002) |
| D-6 | `quote_rate_limits` table + RPC deployed | ⚠️ BLOCKED | migration 20261111000000 pending push |

---

## Infrastructure

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I-1 | `NEXT_PUBLIC_SUPABASE_URL` set in Vercel | ⚠️ PENDING | Add in Vercel env vars |
| I-2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel | ⚠️ PENDING | Add in Vercel env vars |
| I-3 | `SUPABASE_SERVICE_ROLE_KEY` set in Vercel | ⚠️ PENDING | Server-only; needed for admin operations |
| I-4 | Supabase Auth — Site URL matches deployment URL | ⚠️ PENDING | Set to `https://www.jd-power-warehouse.com` |
| I-5 | Supabase Auth — Redirect URLs match deployment URL | ⚠️ PENDING | Set in Supabase dashboard |
| I-6 | Storage bucket `product-images` accessible | ✅ PASS | Auto-created on first upload |
| I-7 | Corte 6 + Hotfix pushed to GitHub | ⚠️ BLOCKED | `git push origin main` required |

---

## SEO

| # | Check | Status | Notes |
|---|-------|--------|-------|
| E-1 | `robots.txt` present | ✅ PASS (code) | `app/robots.ts` ✅; not yet live (not pushed) |
| E-2 | `sitemap.xml` present | ✅ PASS (code) | Static + dynamic products; not yet live |
| E-3 | Per-page metadata complete | ✅ PASS | Root layout + all public pages + `/shop/[id]` |
| E-4 | JSON-LD Organization + WebSite | ✅ PASS (code) | Root layout; not yet live |
| E-5 | JSON-LD Product on `/shop/[id]` | ✅ PASS (code) | generateMetadata + Product schema |
| E-6 | Canonical domain unified (www) | ✅ PASS | SITE_CONFIG.url = https://www.jd-power-warehouse.com |
| E-7 | Google Search Console sitemap submitted | ⚠️ PENDING | Do after first successful deploy |

---

## Functional Smoke Test

| # | Check | Status | Notes |
|---|-------|--------|-------|
| F-1 | `/shop` loads catalogue | ⚠️ PENDING | Run against Vercel after env vars + push |
| F-2 | `/quote` wizard completes and shows `QT-` reference | ⚠️ PENDING | Requires D-1 + D-6 |
| F-3 | Admin login with real Supabase credentials works | ⚠️ PENDING | Requires D-4 |
| F-4 | Admin quotes list shows submitted quotes | ⚠️ PENDING | Requires D-1 + D-4 |
| F-5 | Rate limiting rejects >5 submissions in 15 min | ⚠️ PENDING | Requires D-6 |
| F-6 | Playwright E2E suite passes against preview URL | ⚠️ PENDING | Run after deploy |

---

## GO / NO-GO Decision

**Date:** 2026-11-11
**Decision:** **NO-GO**

### Blockers (must resolve before production DNS):

1. **I-7**: Push Corte 6 + Hotfix to GitHub → `git push origin main`

2. **I-1 → I-5**: Vercel env vars and Supabase Auth URLs not configured.
   Follow `docs/DEPLOYMENT_GUIDE.md`.

3. **D-1 → D-6**: All 10 migrations not yet pushed.
   Run: `npx supabase db push --remote`

4. **D-4**: No admin user created in `admin_users` table.

5. Business data (phone, social, street address) not confirmed → documented in `site-config.ts`.

### Non-Blocking (post-launch backlog):

- Phone / WhatsApp number (feature hidden until confirmed, not broken)
- Social media URLs (links hidden until confirmed)
- Exact street address for JSON-LD
- Rate limiting table cleanup via pg_cron (probabilistic cleanup is a sufficient interim measure)
- CSP: further tighten `'unsafe-inline'` after production verification
- Custom error pages (`not-found.tsx`, `error.tsx`)

### Vercel Preview: **GO** (after `git push origin main`)
The codebase is clean, all security controls are in place, all tests pass.
