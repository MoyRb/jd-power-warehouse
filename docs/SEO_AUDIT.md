# SEO Audit — JD Power Warehouse
**Date:** 2026-11-11 | **Corte 6**

## Summary

| Area | Status | Notes |
|------|--------|-------|
| metadataBase | ✅ DONE | `https://jd-power-warehouse.com` |
| Title templates | ✅ DONE | `%s \| JD Power Warehouse` |
| Meta descriptions | ✅ DONE | Unique per page |
| Canonical URLs | ✅ DONE | All public pages |
| OpenGraph | ✅ DONE | Type, title, description, image, locale |
| Twitter Cards | ✅ DONE | summary_large_image |
| OG image | ✅ DONE | 1200×630 generated via ImageResponse |
| sitemap.xml | ✅ DONE | `/app/sitemap.ts` — 11 static routes |
| robots.txt | ✅ DONE | `/app/robots.ts` — admin/api blocked |
| Favicon | ✅ DONE | icon.tsx (32×32) + apple-icon.tsx (180×180) |
| JSON-LD Organization | ✅ DONE | Schema.org Organization + LocalBusiness |
| JSON-LD WebSite | ✅ DONE | With SearchAction |
| JSON-LD Breadcrumbs | ✅ DONE | Helper ready, not yet wired to pages |
| JSON-LD Product | ⚠️ DEFERRED | Individual product pages not implemented |
| Semantic HTML | ✅ EXISTING | `<main>`, `<nav>`, `<footer>`, `<section>`, `<h1>-<h3>` |
| Alt text | ✅ EXISTING | Descriptive alt on all images |
| Internal linking | ✅ EXISTING | Home → Shop, Sell, About, Contact |
| Dynamic product pages | ✅ EXISTING | `/shop/[id]` partial prerender |
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
/privacy-policy (priority 0.3, yearly)
/terms-and-conditions (priority 0.3, yearly)
/refund-policy (priority 0.3, yearly)
/shipping-policy (priority 0.3, yearly)
```

## Product pages sitemap
Individual `/shop/[id]` pages are NOT yet included in sitemap.xml.
Requires either:
1. Build-time enumeration via `db.listProducts({ status: 'published' })` in `sitemap.ts`
2. Dynamic sitemap with Supabase connection at request time

**ACTION REQUIRED (post-launch):** Add dynamic product URLs to sitemap.

## Structured data verified
- No fake AggregateRating, Review, or ReviewCount
- No unconfirmed street address in LocalBusiness
- No inventory/pricing claims
- Quote request correctly modeled as inquiry, not purchase
- LocalBusiness openingHoursSpecification matches displayed hours

## Remaining SEO gaps (not blocking launch)
1. Product-level JSON-LD (`@type: Product`) on `/shop/[id]`
2. BreadcrumbList wired to individual pages
3. Dynamic product pages in sitemap
4. hreflang for future EN/ES i18n
5. llms.txt (optional, low priority)
