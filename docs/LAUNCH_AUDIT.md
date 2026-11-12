# Launch Audit — JD Power Warehouse
**Domain:** https://www.jd-power-warehouse.com
**Date:** 2026-11-11 | **Hotfix / Production Launch Hardening**

## Verification Matrix

| # | Check | Status | Evidence / Notes |
|---|-------|--------|-----------------|
| 1 | DNS resolves | PASS | `jd-power-warehouse.com → 216.198.79.1 → 308 → www` |
| 2 | HTTPS active | PASS | HTTP 200 on `https://www.jd-power-warehouse.com/` |
| 3 | SSL certificate | PASS | Vercel auto-cert; curl SSL verify = 0 |
| 4 | www redirect | PASS | non-www → 308 → www |
| 5 | Vercel deployment | PASS | `Server: Vercel` header confirmed |
| 6 | Corte 6 + Hotfix deployed | FAIL | Local 2 commits ahead of origin; `git push origin main` required |
| 7 | Env vars on Vercel | BLOCKED | Supabase vars not set → MockAdapter mode |
| 8 | Supabase connection | BLOCKED | Depends on env vars |
| 9 | Admin login | PASS (redirect) | `/admin` → 307 → `/admin/login?next=%2Fadmin` via proxy.ts |
| 10 | Product catalogue | PASS code / BLOCKED prod | MockAdapter used until env vars set |
| 11 | Product images | BLOCKED | Supabase Storage not connected |
| 12 | Contact form | PASS code / BLOCKED prod | Submits to MockAdapter |
| 13 | Quote form | PASS code / BLOCKED prod | Wizard + rate limiting code correct |
| 14 | Admin authorization | PASS | `requireAdmin()` on all 7 modules; proxy.ts protects routes |
| 15 | RLS | PASS code / BLOCKED prod | 10 migrations pending push |
| 16 | Rate limiting | PASS code | Supabase-backed (migration pending push); fail-open policy |
| 17 | sitemap.xml | FAIL (not deployed) | HTTP 404 on live; Corte 6 + Hotfix not pushed |
| 18 | robots.txt | FAIL (not deployed) | HTTP 404 on live; Corte 6 not pushed |
| 19 | Metadata social (OG / Twitter) | FAIL (not deployed) | 0 OG tags on live homepage; not pushed |
| 20 | JSON-LD (Organization + WebSite) | FAIL (not deployed) | 0 JSON-LD blocks on live; not pushed |
| 21 | JSON-LD Product (/shop/[id]) | PASS code | generateMetadata + Product schema implemented; not pushed |
| 22 | Favicon / apple-icon | FAIL (not deployed) | HTTP 404; not pushed |
| 23 | OG Image 1200×630 | FAIL (not deployed) | HTTP 404; not pushed |
| 24 | CSP frame-src (Google Maps) | FAIL (not deployed) | Live CSP missing frame-src; Hotfix not pushed |
| 25 | unsafe-eval removed in prod | FAIL (not deployed) | Hotfix not pushed |
| 26 | Mobile performance | NOT MEASURED | Lighthouse not run (no live deploy with current code) |
| 27 | Canonical URL (www) | PASS code | SITE_CONFIG.url = https://www.jd-power-warehouse.com |
| 28 | Google Maps service area | PASS code | "Service area map" badge; "View on Maps" (no fake address) |
| 29 | Quality Gates CI | PASS | Last run on `987f660` (pre-hotfix): SUCCESS |
| 30 | MockAdapter in production | PASS code | Throws at startup if SUPABASE_URL missing (T7) |
| 31 | Admin user | BLOCKED | No admin created in Supabase Auth |
| 32 | Phone / WhatsApp | BLOCKED | Real number not confirmed |
| 33 | Social media URLs | BLOCKED | Real accounts not confirmed |
| 34 | Street address | BLOCKED | City-level only; exact address pending owner confirmation |
| 35 | Legal pages reviewed | BLOCKED | Owner/lawyer approval required |

## Required env vars for Vercel
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key - server only]
# DO NOT SET: ADMIN_DEV_BYPASS (inert in production but should not exist)
```

## Pre-launch checklist (owner actions)
- [ ] `git push origin main` — push Corte 6 + Hotfix to GitHub (triggers Vercel redeploy)
- [ ] Add custom domain `www.jd-power-warehouse.com` as primary in Vercel project settings
- [ ] Verify www → non-www redirect at Vercel level (or keep 308 at registrar)
- [ ] Add env vars to Vercel production environment
- [ ] Run `npx supabase db push --remote` to push all 10 migrations
- [ ] Create admin user in Supabase Auth (email + password)
- [ ] Add admin user row: `INSERT INTO admin_users(id, email, role) VALUES ('<uuid>', 'admin@...', 'admin')`
- [ ] Upload product images and set published status
- [ ] Confirm phone number and WhatsApp number → update `src/lib/site-config.ts`
- [ ] Confirm real Facebook/Instagram account URLs → update `src/lib/site-config.ts`
- [ ] Confirm street address → update `src/lib/site-config.ts` + `location.mapsQuery`
- [ ] Review and approve legal pages (privacy policy, terms, refund, shipping)
- [ ] Test full quote-request → admin-review flow end-to-end
- [ ] Verify Google Search Console: submit sitemap.xml
- [ ] Run Lighthouse Mobile Performance after first real deploy

## GO / NO-GO Decision

**CURRENT STATUS: NO-GO**

### Blocking issues (code — single fix):
1. ❌ Corte 6 + Hotfix commits not pushed → `git push origin main`

### Blocking issues (infrastructure — owner):
2. ❌ Vercel env vars not configured
3. ❌ Supabase migrations not pushed (10 pending, including new rate_limits)
4. ❌ Admin user not created
5. ❌ Real phone/WhatsApp not confirmed

### Non-blocking (fix after go-live):
- Dynamic product URLs in sitemap: working in code, needs live Supabase
- EN/ES i18n
- WhatsApp re-integration (pending real number)
- Email notifications on new quote/inquiry
- Exact street address in LocalBusiness JSON-LD
- Lighthouse Mobile Performance score
- Product-level OG image (currently falls back to site-wide OG image)

### GO criteria (when all are met):
- ✅ `git push origin main` executed + Vercel redeploy confirmed
- ✅ DNS resolves to Vercel (already true)
- ✅ HTTPS certificate active (already true)
- ✅ Env vars confirmed in Vercel
- ✅ Admin login works in production
- ✅ Product catalogue loads from Supabase
- ✅ Quote submission works end-to-end
- ✅ No high-severity security findings
- ✅ Phone/WhatsApp confirmed in site-config.ts OR explicitly accepted as deferred

## Security posture (Hotfix audit)
- `unsafe-eval` removed from production CSP (T6)
- MockAdapter cannot activate in production (T7 — throws at startup)
- Rate limiting: persistent, atomic, cross-instance via Supabase RPC (T1)
- IP hashed (SHA-256, 16 chars) before storage — no raw IPs persisted
- Rate limiter uses anon key only — service_role key never used for public endpoints
- `ADMIN_DEV_BYPASS` structurally inert in production (NODE_ENV guard)
- All 7 admin server actions require `requireAdmin()` as first statement
- RLS active on all tables (pending migration push for rate_limits table)
- HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- No credentials in version control
- Google Maps shows service area (city-level) — no fabricated street address

## Rollback plan
1. In Vercel dashboard → Deployments → click previous deployment → "Promote to Production"
2. DB rollback for rate_limits: `DROP TABLE public.quote_rate_limits CASCADE;` (additive migration)
3. No other schema changes in this hotfix
