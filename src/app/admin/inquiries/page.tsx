import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import InquiriesTable from '@/components/admin/InquiriesTable'

export const instant = false

export default async function AdminInquiriesPage() {
  await requireAdmin()
  const result = await db.listInquiries()

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Inquiries</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">{result.total} total</p>
      </div>
      <InquiriesTable inquiries={result.data} />
    </div>
  )
}
