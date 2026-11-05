import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import ProductsTable from '@/components/admin/ProductsTable'

export const instant = false

export default async function AdminProductsPage() {
  await requireAdmin()

  const [productsResult, categories] = await Promise.all([
    db.listProducts(),
    db.listCategories(),
  ])

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#f6f4ee]">Products</h1>
          <p className="text-[#8c8c8c] text-sm mt-1">{productsResult.total} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-[#f3c41b] text-[#0f0f0f] font-black text-sm rounded-xl hover:bg-[#e8b818] transition-colors"
        >
          + New Product
        </Link>
      </div>

      <ProductsTable
        products={productsResult.data}
        categories={categories}
      />
    </div>
  )
}
