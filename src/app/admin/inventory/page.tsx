import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import InventoryTable from '@/components/admin/InventoryTable'

export const instant = false

export default async function AdminInventoryPage() {
  await requireAdmin()

  const [productsResult, categories] = await Promise.all([
    db.listProducts(),
    db.listCategories(),
  ])

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Inventory</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">
          Adjust stock levels for each product
        </p>
      </div>
      <InventoryTable products={productsResult.data} categories={categories} />
    </div>
  )
}
