import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import CategoryList from '@/components/admin/CategoryList'

export const instant = false

export default async function AdminCategoriesPage() {
  await requireAdmin()
  const categories = await db.listCategories()

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Categories</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">{categories.length} categories</p>
      </div>
      <CategoryList categories={categories} />
    </div>
  )
}
