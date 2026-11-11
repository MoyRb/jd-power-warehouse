import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/shop/',
          '/about',
          '/contact',
          '/sell',
          '/testimonials',
          '/quote',
          '/privacy-policy',
          '/terms-and-conditions',
          '/refund-policy',
          '/shipping-policy',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/_next/',
          '/404',
          '/500',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  }
}
