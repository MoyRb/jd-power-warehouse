import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import QuotesTable from '@/components/admin/QuotesTable'

export const instant = false

export default async function AdminQuotesPage() {
  await requireAdmin()
  const result = await db.listQuotes({ per_page: 100 })

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Quotes</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">{result.total} total quote requests</p>
      </div>
      <QuotesTable quotes={result.data} />
    </div>
  )
}
