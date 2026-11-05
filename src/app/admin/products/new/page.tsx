import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import ProductForm from '@/components/admin/ProductForm'
import { createProductAction } from '@/app/admin/_actions/products'

export const instant = false

export default async function NewProductPage() {
  await requireAdmin()
  const categories = await db.listCategories()

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">New Product</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">
          <a href="/admin/products" className="hover:text-[#f6f4ee] transition-colors">Products</a>
          {' / New'}
        </p>
      </div>
      <ProductForm categories={categories} action={createProductAction} />
    </div>
  )
}
