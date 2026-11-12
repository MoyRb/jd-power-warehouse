import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { SITE_CONFIG } from '@/lib/site-config'

// Next.js 16 with cacheComponents:true is incompatible with `export const dynamic`.
// Calling headers() inside the function achieves the same effect: opt-out of static
// caching so the sitemap always reflects the current DB state.

const BASE = SITE_CONFIG.url

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Force dynamic evaluation (see next.config.ts cacheComponents:true note)
  await headers()

  const now = new Date().toISOString()

  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/shop`,                 lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/quote`,                lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about`,                lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`,              lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/sell`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/testimonials`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy-policy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms-and-conditions`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/refund-policy`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/shipping-policy`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Dynamic product pages — only published products are indexable
  let productPages: MetadataRoute.Sitemap = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      // Import lazily so a missing Supabase config in dev doesn't break the build
      const { db } = await import('@/lib/db')
      const result = await db.listProducts({ status: 'published', page: 1, per_page: 1000 })

      productPages = result.data.map((product) => ({
        url:             `${BASE}/shop/${product.id}`,
        lastModified:    product.updated_at ?? now,
        changeFrequency: 'weekly' as const,
        priority:        0.6,
      }))
    } catch (err) {
      // Supabase unavailable — omit product URLs rather than fail the entire sitemap.
      // Search Console will retry; static pages are always included.
      console.error('[sitemap] Failed to fetch published products:', err)
    }
  }

  return [...staticPages, ...productPages]
}
