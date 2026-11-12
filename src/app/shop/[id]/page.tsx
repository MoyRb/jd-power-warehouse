import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cache } from 'react'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { getProductImageSrc } from '@/lib/product-image'
import { SITE_CONFIG } from '@/lib/site-config'
import { JsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import ProductGallery from '@/components/shop/ProductGallery'

export const instant = false

// Deduplicate the DB fetch between generateMetadata and the page component.
const getPublishedProduct = cache(async (id: string) => {
  const product = await db.getProduct(id)
  if (!product || product.status !== 'published') return null
  return product
})

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

// ── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: ProductDetailPageProps,
): Promise<Metadata> {
  const { id } = await params
  const product = await getPublishedProduct(id)

  if (!product) {
    // notFound() will be called by the page — return noindex as a safety net.
    return { robots: { index: false, follow: false } }
  }

  const title = product.name
  const description = product.description
    ? `${product.description.slice(0, 155)}…`
    : `Buy ${product.name} at JD Power Warehouse — up to 70% off retail in Plainfield, IL. Request a quote today.`

  const canonicalPath = `/shop/${id}`
  const canonicalUrl  = `${SITE_CONFIG.url}${canonicalPath}`

  const primaryImage = product.images?.[0]
  const imageUrl = primaryImage
    ? getProductImageSrc(primaryImage.storage_path)
    : null

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: imageUrl
        ? [{ url: imageUrl, alt: primaryImage?.alt_text ?? product.name }]
        : [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card:        imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images:      imageUrl ? [imageUrl] : ['/opengraph-image'],
    },
  }
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const product = await getPublishedProduct(id)

  if (!product) notFound()

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null

  // ── Product JSON-LD ────────────────────────────────────────────────────────
  const canonicalUrl = `${SITE_CONFIG.url}/shop/${id}`
  const primaryImage = product.images?.[0]
  const imageUrl = primaryImage
    ? getProductImageSrc(primaryImage.storage_path)
    : null

  const offerAvailability =
    product.quantity === undefined
      ? undefined
      : product.quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description && { description: product.description }),
    ...(product.sku && { sku: product.sku }),
    ...(imageUrl && { image: imageUrl }),
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      ...(offerAvailability && { availability: offerAvailability }),
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
      },
    },
    // No aggregateRating, review, warranty, or return policy claims
  }

  const breadcrumbItems = [
    { name: 'Shop', href: '/shop' },
    ...(product.category?.name
      ? [{ name: product.category.name, href: `/shop?category=${encodeURIComponent(product.category.name)}` }]
      : []),
    { name: product.name, href: `/shop/${id}` },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={productJsonLd} />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      {/* Breadcrumb */}
      <nav className="text-sm text-[#8c8c8c] mb-8">
        <Link href="/shop" className="hover:text-[#f6f4ee] transition-colors">Shop</Link>
        <span className="mx-2">/</span>
        {product.category?.name && (
          <>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category.name)}`}
              className="hover:text-[#f6f4ee] transition-colors"
            >
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-[#f6f4ee]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <ProductGallery images={product.images ?? []} productName={product.name} />

        {/* Details */}
        <div className="space-y-6">
          {/* Category + badge */}
          <div className="flex items-center gap-2">
            {product.category?.name && (
              <span className="text-xs text-[#8c8c8c] uppercase tracking-widest font-medium">
                {product.category.name}
              </span>
            )}
            {product.badge && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                product.badge === 'Sale' ? 'bg-red-600 text-white' : 'bg-[#f3c41b] text-[#0f0f0f]'
              }`}>
                {product.badge}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black text-[#f6f4ee] leading-tight">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-[#f3c41b]">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="text-[#8c8c8c] text-lg line-through">{formatPrice(product.original_price)}</span>
            )}
            {discount && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-[#8c8c8c] leading-relaxed">{product.description}</p>
          )}

          {/* Stock */}
          {product.quantity !== undefined && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-[#8c8c8c]">
                {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <a
              href={`mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(`Inquiry: ${product.name}`)}`}
              className="flex items-center justify-center gap-2 w-full bg-[#141414] border border-[#f3c41b]/40 text-[#f3c41b] font-bold py-3.5 rounded-xl hover:bg-[#1a1200] transition-colors"
            >
              <span>Inquire About This Item</span>
            </a>
            <Link
              href={`/quote?product_id=${product.id}`}
              className="flex items-center justify-center gap-2 w-full bg-[#f3c41b] text-[#0a0a0a] font-bold py-3.5 rounded-xl hover:bg-[#e6b800] transition-colors"
            >
              Request a Quote
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center w-full bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] font-bold py-3.5 rounded-xl hover:border-[#f3c41b]/40 transition-colors"
            >
              Ask a Question
            </Link>
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-[#555]">SKU: {product.sku}</p>
          )}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-[#2e2e2e]">
        <Link href="/shop" className="text-sm text-[#8c8c8c] hover:text-[#f6f4ee] transition-colors">
          ← Back to Shop
        </Link>
      </div>
    </div>
  )
}
