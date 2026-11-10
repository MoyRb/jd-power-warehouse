import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import CustomersTable from '@/components/admin/CustomersTable'

export const instant = false

export default async function AdminCustomersPage() {
  await requireAdmin()
  const result = await db.listCustomers({ per_page: 200 })

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#f6f4ee]">Customers</h1>
          <p className="text-[#8c8c8c] text-sm mt-1">{result.total} B2B customers</p>
        </div>
        <Link
          href="/admin/customers/new"
          className="px-4 py-2 bg-[#f3c41b] text-[#0a0a0a] text-sm font-bold rounded-lg hover:bg-[#e6b800] transition-colors"
        >
          + New Customer
        </Link>
      </div>
      <CustomersTable customers={result.data} />
    </div>
  )
}
