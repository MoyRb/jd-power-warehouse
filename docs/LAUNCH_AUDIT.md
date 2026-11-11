# Launch Audit — JD Power Warehouse
**Domain:** https://jd-power-warehouse.com
**Date:** 2026-11-11 | **Corte 6**

## Verification Matrix

| # | Check | Status | Evidence / Notes |
|---|-------|--------|-----------------|
| 1 | DNS resolves | BLOCKED | Domain not yet pointed to Vercel |
| 2 | HTTPS active | BLOCKED | Depends on DNS |
| 3 | SSL certificate | BLOCKED | Vercel provisions via DNS |
| 4 | www redirect | NOT VERIFIED | Configure in Vercel dashboard |
| 5 | Vercel deployment | BLOCKED | No production deployment executed |
| 6 | Env vars on Vercel | NOT CONFIGURED | See list below |
| 7 | Supabase connection | BLOCKED | Env vars not set in Vercel |
| 8 | Admin login | BLOCKED | Depends on Supabase + admin user creation |
| 9 | Product catalogue | BLOCKED | Depends on Supabase + published products |
| 10 | Product images | BLOCKED | Depends on Supabase Storage |
| 11 | Contact form | PASS (local) | Submits inquiry to DB; email not sent |
| 12 | Quote form | PASS (local) | 3-step wizard, server action with rate-limiting |
| 13 | B2B customers | PASS (local) | Admin CRUD; RLS enforced |
| 14 | Admin authorization | PASS (local) | `requireAdmin()` on all 7 action modules |
| 15 | RLS | PASS (local) | 14 integration smoke tests (skip in CI) |
| 16 | Rate limiting | PASS (local) | 5 req/15 min on quote submit; serverless-safe |
| 17 | SEO/sitemap | PASS (local) | sitemap.xml + robots.txt build correctly |
| 18 | Metadata social | PASS (local) | OG + Twitter Cards + 1200×630 image |
| 19 | Google Maps | PASS (local) | Plainfield, IL embed; Get Directions button |
| 20 | Mobile performance | NOT MEASURED | Lighthouse not run (no live URL) |

## Required env vars for Vercel
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key - server only]
ADMIN_DEV_BYPASS=[DO NOT SET in production]
```

## Pre-launch checklist (owner actions)
- [ ] Add custom domain `jd-power-warehouse.com` in Vercel project settings
- [ ] Update DNS A/CNAME records to point to Vercel (via registrar/Hostinger)
- [ ] Add env vars to Vercel production environment
- [ ] Run `npx supabase db push --remote` to push all 9 migrations
- [ ] Create admin user in Supabase auth (email + password)
- [ ] Add admin user row to `admin_users` table: `INSERT INTO admin_users(id, email, role) VALUES (auth.uid(), 'admin@...', 'admin')`
- [ ] Upload product images and set published status
- [ ] Confirm phone number and WhatsApp number → update `src/lib/site-config.ts`
- [ ] Confirm real Facebook/Instagram account URLs → update `src/lib/site-config.ts`
- [ ] Review and approve legal pages (privacy policy, terms, refund, shipping)
- [ ] Test full quote-request → admin-review → email-sent flow end-to-end
- [ ] Verify Google Search Console: submit sitemap.xml

## GO / NO-GO Decision

**CURRENT STATUS: NO-GO (pre-launch)**

### Blocking issues:
1. ❌ No production deployment (Vercel not configured)
2. ❌ DNS not pointed to Vercel
3. ❌ Env vars not configured in Vercel
4. ❌ Admin user not created in Supabase
5. ❌ Real phone/WhatsApp number not confirmed → WhatsApp reserve flow disabled
6. ❌ Legal pages not reviewed by business owner

### Non-blocking (fix after go-live):
- Product-level JSON-LD on /shop/[id]
- Dynamic product URLs in sitemap.xml
- EN/ES i18n
- Email notifications on new quote/inquiry
- WhatsApp re-integration (pending real number)

### GO criteria (when all are met):
- ✅ DNS resolves to Vercel
- ✅ HTTPS certificate active
- ✅ Env vars confirmed in Vercel
- ✅ Admin login works in production
- ✅ Product catalogue loads from Supabase
- ✅ Quote submission works end-to-end
- ✅ No high-severity security findings
- ✅ Phone/WhatsApp confirmed in site-config.ts

## Rollback plan
1. In Vercel dashboard → Deployments → click previous deployment → "Promote to Production"
2. No DB rollback needed (migrations are additive; no schema changes in Corte 6)

## Security posture (Corte 5 audit)
- `ADMIN_DEV_BYPASS` structurally inert in production (NODE_ENV guard)
- All 7 admin server actions require `requireAdmin()` as first statement
- RLS active on all tables
- HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- No credentials in version control
- No service role key exposed client-side
