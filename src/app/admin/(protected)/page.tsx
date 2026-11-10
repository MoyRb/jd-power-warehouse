import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { getAdminAnalytics } from '@/lib/analytics'
import StatsCard from '@/components/admin/StatsCard'
import { BarChart } from '@/components/admin/BarChart'
import { Sparkline } from '@/components/admin/Sparkline'

export const instant = false

export default async function AdminDashboardPage() {
  await requireAdmin()

  const rawThreshold = await db.getSetting('low_stock_threshold')
  const threshold = typeof rawThreshold === 'number' ? rawThreshold : 5
  const analytics = await getAdminAnalytics(threshold)

  const { products, categories, inquiries, lowStock, quotes } = analytics
  const isLive = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-10">

      {/* ── Section 1: Header + connection status ── */}
      <div>
        <h1 className="text-2xl font-black text-[#f6f4ee]">Analytics Dashboard</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">
          {isLive ? 'Connected to Supabase — live data' : 'Mock data — connect Supabase to persist changes'}
        </p>
        {!isLive && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 border border-amber-700/40 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-400 text-xs font-medium">Dev mode — data resets on server restart</span>
          </div>
        )}
      </div>

      {/* ── Section 2: KPI Row (8 cards, 2×4 grid) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={products.total}
          label="in catalog"
        />
        <StatsCard
          title="Published"
          value={products.published}
          label="visible in store"
          accent={products.published > 0}
        />
        <StatsCard
          title="Drafts"
          value={products.draft}
          label="not published"
        />
        <StatsCard
          title="Archived"
          value={products.archived}
          label="removed from store"
        />
        <StatsCard
          title="Categories"
          value={products.totalCategories}
          label="active"
        />
        <StatsCard
          title="Total Units"
          value={products.totalUnits}
          label="in inventory"
        />
        <StatsCard
          title="Out of Stock"
          value={products.outOfStock}
          label="need restocking"
          accent={products.outOfStock > 0}
        />
        <StatsCard
          title="Low Stock"
          value={products.lowStock}
          label={`≤ ${threshold} units`}
          accent={products.lowStock > 0}
        />
      </div>

      {/* ── Section 3: Estimated Inventory Value ── */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6">
        <p className="text-[#8c8c8c] text-sm font-medium mb-2">Potential Sale Value</p>
        <p className="text-4xl font-black text-[#f3c41b]">
          {products.estimatedInventoryValue.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })}
        </p>
        <p className="text-[#8c8c8c] text-xs mt-1">
          Published products at current prices × inventory quantity
        </p>
      </div>

      {/* ── Section 4: Products by Category ── */}
      <div>
        <h2 className="text-lg font-bold text-[#f6f4ee] mb-4">Products by Category</h2>
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 space-y-6">
          <BarChart
            items={categories.map((c) => ({
              label: c.name,
              value: c.publishedCount,
              sublabel: `${c.totalUnits} units`,
            }))}
          />

          {categories.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#8c8c8c] text-xs border-b border-[#2e2e2e]">
                    <th className="text-left py-2 pr-4 font-medium">Category</th>
                    <th className="text-right py-2 pr-4 font-medium">Products</th>
                    <th className="text-right py-2 pr-4 font-medium">Published</th>
                    <th className="text-right py-2 pr-4 font-medium">Units</th>
                    <th className="text-right py-2 font-medium">Potential Value</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a]">
                      <td className="py-2 pr-4 text-[#f6f4ee]">{cat.name}</td>
                      <td className="py-2 pr-4 text-right text-[#8c8c8c]">{cat.productCount}</td>
                      <td className="py-2 pr-4 text-right text-[#f6f4ee]">{cat.publishedCount}</td>
                      <td className="py-2 pr-4 text-right text-[#8c8c8c]">{cat.totalUnits}</td>
                      <td className="py-2 text-right text-[#8c8c8c]">
                        {cat.estimatedValue.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Inquiry Analytics ── */}
      <div>
        <h2 className="text-lg font-bold text-[#f6f4ee] mb-4">Inquiry Analytics</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Left: counts */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[#8c8c8c] text-sm">Total Inquiries</span>
              <span className="text-[#f6f4ee] font-bold">{inquiries.total}</span>
            </div>
            <div className="border-t border-[#2e2e2e] pt-3 space-y-2">
              {(['quick_inquiry', 'contact', 'sell_request'] as const).map((type) => (
                <div key={type} className="flex justify-between items-center text-sm">
                  <span className="text-[#8c8c8c] capitalize">{type.replace('_', ' ')}</span>
                  <span className="text-[#f6f4ee]">{inquiries.byType[type] ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#2e2e2e] pt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#f3c41b] font-medium">Pending (new + read)</span>
                <span className="text-[#f3c41b] font-bold">{inquiries.pending}</span>
              </div>
            </div>
          </div>

          {/* Right: 30-day trend */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6">
            <p className="text-[#8c8c8c] text-sm mb-4">30-Day Trend</p>
            <Sparkline data={inquiries.trend} />
            {inquiries.trend.length === 0 && (
              <p className="text-[#8c8c8c] text-sm text-center mt-2">No inquiries yet</p>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="mt-4 bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#8c8c8c] text-xs border-b border-[#2e2e2e]">
                {(['new', 'read', 'replied', 'archived'] as const).map((status) => (
                  <th key={status} className="text-center py-2 font-medium capitalize">{status}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {(['new', 'read', 'replied', 'archived'] as const).map((status) => (
                  <td key={status} className="text-center py-3 text-[#f6f4ee] font-bold">
                    {inquiries.byStatus[status] ?? 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 6: Quote Analytics ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f6f4ee]">Quote Analytics</h2>
          <Link href="/admin/quotes" className="text-xs text-[#f3c41b] hover:underline">View all →</Link>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {/* KPI summary */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[#8c8c8c] text-sm">Total Quotes</span>
              <span className="text-[#f6f4ee] font-bold">{quotes.total}</span>
            </div>
            <div className="border-t border-[#2e2e2e] pt-3 space-y-2">
              {(['pending', 'reviewing', 'sent', 'accepted', 'rejected', 'expired'] as const).map((s) => (
                <div key={s} className="flex justify-between items-center text-sm">
                  <span className="text-[#8c8c8c] capitalize">{s}</span>
                  <span className="text-[#f6f4ee]">{quotes.byStatus[s] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value + conversion */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 space-y-4">
            <div>
              <p className="text-[#8c8c8c] text-xs mb-1">Sent Quote Value</p>
              <p className="text-2xl font-black text-[#f3c41b]">
                {quotes.sentValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[#8c8c8c] text-xs mb-1">Accepted Quote Value</p>
              <p className="text-2xl font-black text-green-400">
                {quotes.acceptedValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="border-t border-[#2e2e2e] pt-3">
              <p className="text-[#8c8c8c] text-xs mb-1">Conversion Rate</p>
              <p className="text-xl font-bold text-[#f6f4ee]">
                {quotes.conversionRate != null ? `${(quotes.conversionRate * 100).toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-[#555] mt-0.5">accepted / (sent + accepted + rejected)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 7: Critical Inventory (Low Stock) ── */}
      <div>
        <h2 className="text-lg font-bold text-[#f6f4ee] mb-1">Critical Inventory</h2>
        <p className="text-[#8c8c8c] text-sm mb-4">Products at or below {threshold} units</p>

        {lowStock.length === 0 ? (
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 text-center">
            <p className="text-[#8c8c8c] text-sm">All products are adequately stocked.</p>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8c8c8c] text-xs border-b border-[#2e2e2e]">
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-right py-3 px-4 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a]">
                    <td className="py-3 px-4 text-[#f6f4ee]">{p.name}</td>
                    <td className="py-3 px-4 text-[#8c8c8c]">{p.categoryName ?? '—'}</td>
                    <td className={`py-3 px-4 text-right font-bold ${p.quantity === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                      {p.quantity}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === 'published' ? 'bg-green-900/40 text-green-400' :
                        p.status === 'draft'     ? 'bg-yellow-900/40 text-yellow-400' :
                                                   'bg-zinc-800 text-zinc-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/inventory`}
                        className="text-xs text-[#f3c41b] hover:underline"
                      >
                        Restock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 8: Quick actions ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/products/new', label: 'Add Product',    desc: 'Create a new product listing' },
          { href: '/admin/inquiries',    label: 'View Inquiries', desc: `${inquiries.pending} pending message${inquiries.pending !== 1 ? 's' : ''}` },
          { href: '/admin/quotes',       label: 'View Quotes',    desc: `${quotes.pending} pending quote${quotes.pending !== 1 ? 's' : ''}` },
          { href: '/admin/inventory',    label: 'Manage Stock',   desc: 'Adjust inventory levels' },
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
