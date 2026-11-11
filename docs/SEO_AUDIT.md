# SEO Audit — JD Power Warehouse
**Date:** 2026-11-11 | **Hotfix / Production Launch Hardening**

## Summary

| Area | Status | Notes |
|------|--------|-------|
| metadataBase | ✅ DONE | `https://www.jd-power-warehouse.com` (www canonical) |
| Title templates | ✅ DONE | `%s \| JD Power Warehouse` |
| Meta descriptions | ✅ DONE | Unique per page |
| Canonical URLs | ✅ DONE | All public pages; www canonical enforced |
| OpenGraph | ✅ DONE | Type, title, description, image, locale |
| Twitter Cards | ✅ DONE | summary_large_image |
| OG image | ✅ DONE | 1200×630 generated via ImageResponse |
| sitemap.xml | ✅ DONE | Static routes + dynamic published products from Supabase |
| robots.txt | ✅ DONE | `/app/robots.ts` — admin/api blocked |
| Favicon | ✅ DONE | icon.tsx (32×32) + apple-icon.tsx (180×180) |
| JSON-LD Organization | ✅ DONE | Schema.org Organization + LocalBusiness |
| JSON-LD WebSite | ✅ DONE | With SearchAction |
| JSON-LD Breadcrumbs | ✅ DONE | BreadcrumbJsonLd wired to /shop/[id] |
| JSON-LD Product | ✅ DONE | `@type: Product` + Offer on /shop/[id] |
| Canonical domain (www) | ✅ DONE | SITE_CONFIG.url = https://www.jd-power-warehouse.com |
| Semantic HTML | ✅ EXISTING | `<main>`, `<nav>`, `<footer>`, `<section>`, `<h1>-<h3>` |
| Alt text | ✅ EXISTING | Descriptive alt on all images |
| Internal linking | ✅ EXISTING | Home → Shop, Sell, About, Contact |
| Dynamic product pages | ✅ DONE | generateMetadata per product + cache() dedup |
| Admin indexing | ✅ BLOCKED | robots.ts disallows /admin/ |

## Indexable pages
```
/ (priority 1.0, weekly)
/shop (priority 0.9, daily)
/quote (priority 0.8, monthly)
/about (priority 0.7, monthly)
/contact (priority 0.7, monthly)
/sell (priority 0.6, monthly)
/testimonials (priority 0.5, monthly)
/shop/[id] (priority 0.6, weekly) — dynamic, from Supabase
/privacy-policy (priority 0.3, yearly)
/terms-and-conditions (priority 0.3, yearly)
/refund-policy (priority 0.3, yearly)
/shipping-policy (priority 0.3, yearly)
```

## Product pages sitemap
Individual `/shop/[id]` pages are now included in sitemap.xml dynamically.
Implementation: `db.listProducts({ status: 'published', per_page: 1000 })` in `sitemap.ts`.
- Requires Supabase env vars in Vercel production
- Graceful fallback: if Supabase unavailable → omit product URLs, keep static routes
- Uses `updated_at` from DB as `lastModified` (not artificial timestamp)

## Structured data verified
- No fake AggregateRating, Review, or ReviewCount
- No unconfirmed street address in LocalBusiness
- No inventory/pricing claims beyond displayed price
- Quote request correctly modeled as inquiry, not purchase
- LocalBusiness openingHoursSpecification matches displayed hours
- Product JSON-LD: Offer includes price + availability — no guarantee/warranty claims

## Deployment status
⚠️ All SEO features are implemented and build correctly, but Corte 6 + Hotfix
commits have NOT been pushed to GitHub yet. Live site is running pre-Corte6 code.
**Required action:** `git push origin main` → Vercel auto-deploys.

## Remaining SEO gaps (not blocking launch)
1. hreflang for future EN/ES i18n
2. Product-level OG image (currently falls back to site-wide 1200×630)
3. llms.txt (optional, low priority)
4. Exact street address in LocalBusiness JSON-LD (pending owner confirmation)
5. Google Search Console verification + sitemap submission (after first deploy)
