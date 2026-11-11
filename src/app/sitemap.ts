import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/site-config'

const BASE = SITE_CONFIG.url

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/shop`,              lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/quote`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about`,             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`,           lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/sell`,              lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/testimonials`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy-policy`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms-and-conditions`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/refund-policy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/shipping-policy`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Note: individual product pages (/shop/[id]) are served dynamically from
  // Supabase and cannot be statically enumerated at build time without a DB
  // connection. Add them here when a getPublishedProductIds() helper is
  // available, or implement a dynamic sitemap endpoint.

  return staticPages
}
