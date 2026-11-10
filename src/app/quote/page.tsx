import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import QuoteRequestForm from '@/components/quote/QuoteRequestForm'

export const instant = false

export const metadata: Metadata = {
  title: 'Request a Quote | JD Power Warehouse',
  description: 'Request a bulk or B2B quote for products. We respond within 24 hours.',
}

interface QuotePageProps {
  searchParams: Promise<{ product_id?: string }>
}

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const { product_id } = await searchParams
  const { data: products } = await db.listProducts({ status: 'published', per_page: 200 })

  const catalogProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    sku: p.sku ?? null,
    category: p.category,
  }))

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-sm text-[#8c8c8c] mb-4">
            <Link href="/shop" className="hover:text-[#f6f4ee] transition-colors">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-[#f6f4ee]">Request Quote</span>
          </nav>
          <h1 className="text-4xl font-black text-[#f6f4ee] mb-2">Request a Quote</h1>
          <p className="text-[#8c8c8c] max-w-xl">
            Need bulk pricing or a custom order? Add items below and we&apos;ll get back to you within 24 hours with pricing.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <QuoteRequestForm
          products={catalogProducts}
          initialProductId={product_id ?? null}
        />
      </div>
    </main>
  )
}
