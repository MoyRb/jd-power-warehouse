import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import ProductGallery from '@/components/shop/ProductGallery'

export const instant = false

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const product = await db.getProduct(id)

  if (!product || product.status !== 'published') notFound()

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
              href={`https://wa.me/18155550123?text=${encodeURIComponent(`Hi! I'm interested in: ${product.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl hover:bg-[#1ebe5d] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Reserve via WhatsApp</span>
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
