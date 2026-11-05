import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import StatsCard from '@/components/admin/StatsCard'

export const instant = false

export default async function AdminDashboardPage() {
  await requireAdmin()

  const [allProducts, publishedProducts, draftProducts, inquiries, newInquiries] =
    await Promise.all([
      db.listProducts(),
      db.listProducts({ status: 'published' }),
      db.listProducts({ status: 'draft' }),
      db.listInquiries(),
      db.listInquiries({ status: 'new' }),
    ])

  const isLive = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Dashboard</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">
          {isLive ? 'Connected to Supabase' : 'Mock data — connect Supabase to persist changes'}
        </p>
        {!isLive && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 border border-amber-700/40 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-400 text-xs font-medium">Dev mode — data resets on server restart</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Products"
          value={allProducts.total}
          label="in catalog"
        />
        <StatsCard
          title="Published"
          value={publishedProducts.total}
          label="visible in store"
          accent
        />
        <StatsCard
          title="Drafts"
          value={draftProducts.total}
          label="not yet published"
        />
        <StatsCard
          title="New Inquiries"
          value={newInquiries.total}
          label={`of ${inquiries.total} total`}
          accent={newInquiries.total > 0}
        />
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/admin/products/new', label: 'Add Product', desc: 'Create a new product listing' },
          { href: '/admin/inquiries',    label: 'View Inquiries', desc: `${newInquiries.total} unread message${newInquiries.total !== 1 ? 's' : ''}` },
          { href: '/admin/inventory',    label: 'Manage Stock', desc: 'Adjust inventory levels' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-5 bg-[#141414] border border-[#2e2e2e] rounded-xl hover:border-[#f3c41b]/40 transition-colors"
          >
            <p className="text-[#f6f4ee] font-bold text-sm mb-1">{item.label}</p>
            <p className="text-[#8c8c8c] text-xs">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
