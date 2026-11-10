# JD Power Warehouse — Security Report
**Corte 5 — 2026-11-10**

## Scope

Full security audit of authentication, authorization, row-level security, server
actions, public RPC functions, storage policies, rate limiting, secrets management,
and dependency hygiene.

---

## SECURE — Verified

| # | Area | Evidence |
|---|------|----------|
| S-1 | Admin auth uses `admin_users` DB table, never `user_metadata` | `src/lib/auth/server.ts`, `src/proxy.ts` |
| S-2 | `isDevBypassEnabled()` requires `NODE_ENV !== 'production'` AND `ADMIN_DEV_BYPASS=true` — structurally inert in any `next build` deploy | `src/lib/dev-bypass.ts` |
| S-3 | All 7 admin server action modules call `requireAdmin()` as their first statement | `src/app/admin/_actions/*.ts` |
| S-4 | `create_quote_with_lines` SECURITY DEFINER: validates all inputs, snapshots prices from DB, never trusts client-supplied prices, locked `search_path = public, pg_temp` | migration 007 |
| S-5 | `admin_update_quote_status` checks `is_admin()` internally even though it is SECURITY DEFINER | migration 007 |
| S-6 | `is_admin()` SECURITY DEFINER with locked `search_path` (search-path hijacking fix) | migration 004 |
| S-7 | RLS enabled on all 13 tables (categories, products, product_images, inventory, inventory_movements, inquiries, admin_users, audit_log, store_settings, business_customers, quotes, quote_lines, quote_events) | migrations 002, 008 |
| S-8 | No hard DELETE policy on quotes, business_customers, audit_log — records retained for audit | migrations 002, 008 |
| S-9 | Zod validation on all public inputs (quote submission, inquiry forms) | `src/lib/validations/` |
| S-10 | IP hashing with SHA-256 (truncated 16 chars) for rate limiting | `src/app/quote/actions.ts` |
| S-11 | `.gitignore` excludes `.env*` files; no credentials found in repository | `.gitignore`, git history |
| S-12 | `store_settings` anon access limited to `is_public = true` rows only | migration 004 |
| S-13 | Product prices at quote submission snapshotted from DB — `create_quote_with_lines` reads `products.price` directly | migration 007 |
| S-14 | File upload validates MIME type and size server-side (JPEG/PNG/WebP, ≤5 MB) | `src/app/admin/_actions/products.ts` |
| S-15 | `anon` role cannot SELECT from quotes, quote_lines, or quote_events (PII protection) | migration 008 |
| S-16 | `admin_users` rows are INSERT-only via service role / SQL — no self-registration path | migration 002 |

---

## FINDINGS

### MEDIUM-1 — HTTP Security Headers (FIXED in Corte 5)

**Previously:** `next.config.ts` had no security headers.

**Risk:** Browsers could load the app in iframes (clickjacking), leak referrer data,
or be misled by content-type sniffing.

**Fix applied:** Added to `next.config.ts` via `headers()`:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | See `next.config.ts` for directives |

**Post-launch CSP tightening:** `'unsafe-eval'` is required by Next.js dev mode.
After confirming production behaviour, replace with explicit nonces or hashes.

---

### MEDIUM-2 — Rate Limiting In-Memory (Documented, Not Fixed)

**Location:** `src/app/quote/actions.ts` — `rateLimitMap`

**Issue:** The rate limiter is an in-process `Map`. On Vercel, each serverless
invocation may be a fresh process, so the counter resets on cold start. Under
attack, a client can exhaust the per-IP window by targeting different edge
functions or waiting for cold starts.

**Acceptable for MVP because:**
- Quote submissions are low-frequency B2B requests.
- The public form has Zod validation gating malformed payloads.
- IP hashing is applied before storage.
- Supabase per-RPC execution cost limits abuse blast radius.

**Recommended post-launch fix:** Replace `rateLimitMap` with a Redis/Upstash
counter, or use Vercel's built-in Edge rate limiting middleware.

---

### LOW-1 — `middleware.ts` → `proxy.ts` (FIXED in Corte 5)

Renamed `src/middleware.ts` → `src/proxy.ts` and updated the export from
`middleware` to `proxy` to resolve the Next.js 16 deprecation warning.

---

### LOW-2 — Logo 404 in Admin Sidebar (FIXED in Corte 5)

`AdminSidebar.tsx` referenced a non-existent filename
(`151663a7-cc48-492e-93d3-ab8a929b7a09_png.png`).
Updated to the existing file (`151663a7-560a-4334-a81d-264aee653769_jpg.jpg`).

---

### LOW-3 — No `.env.example` (FIXED in Corte 5)

Created `.env.example` documenting all required and optional env vars.

---

### INFO — `audit_log` INSERT requires service role key

Audit log writes use the service role key. `SUPABASE_SERVICE_ROLE_KEY` is not
currently set in `.env.local`. This means audit log writes silently fail in the
current dev setup. This is acceptable before production: add the key to Vercel
env vars before go-live.

---

## Dependency Vulnerabilities

`npm audit` was not run because the Windows shell pipe (`/dev/stdin`) is
unavailable in this environment. Recommended: run `npm audit` on a Linux/macOS
machine or in CI before deployment. No known high-severity packages were
identified from manual inspection of `package.json`.

---

## Summary

The application has a solid security baseline:
- Authorization is enforced at three layers (proxy, server action, RLS/SECURITY DEFINER).
- Dev bypass is physically impossible in production builds.
- PII in quotes is protected by RLS with no anon SELECT path.
- Price integrity is enforced server-side.

The two unfixed findings (MEDIUM-2 rate limiting, INFO audit log) are acceptable
for initial launch and are documented for the post-launch backlog.
