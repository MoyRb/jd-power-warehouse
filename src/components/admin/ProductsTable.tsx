'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Product, Category } from '@/lib/db/types'
import type { ProductStatus } from '@/lib/db/types'
import { setProductStatusAction } from '@/app/admin/_actions/products'

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
}

const STATUS_BADGE: Record<ProductStatus, string> = {
  draft: 'bg-[#2e2e2e] text-[#8c8c8c]',
  published: 'bg-green-900/30 text-green-400 border border-green-700/40',
  archived: 'bg-red-900/20 text-red-400/70 border border-red-900/30',
}

export default function ProductsTable({ products, categories }: ProductsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()

  const filtered = products.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  function handleStatus(productId: string, status: ProductStatus) {
    startTransition(() => {
      setProductStatusAction(productId, status)
    })
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-lg text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-lg text-sm focus:outline-none focus:border-[#f3c41b] transition-colors"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-lg text-sm focus:outline-none focus:border-[#f3c41b] transition-colors"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8c8c8c] text-sm">
          No products match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2e2e2e]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e2e] bg-[#141414]">
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Price</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden lg:table-cell">Stock</th>
                <th className="text-right px-4 py-3 text-[#8c8c8c] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const cat = categories.find((c) => c.id === product.category_id)
                return (
                  <tr
                    key={product.id}
                    className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#141414]/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[#f6f4ee] font-medium">{product.name}</p>
                      {product.sku && (
                        <p className="text-[#8c8c8c] text-xs mt-0.5">SKU: {product.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#8c8c8c] hidden md:table-cell">
                      {cat?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[#f6f4ee]">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[product.status]}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8c8c8c] hidden lg:table-cell">
                      {product.quantity ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="px-2.5 py-1 text-xs bg-[#2e2e2e] text-[#f6f4ee] rounded-lg hover:bg-[#3e3e3e] transition-colors"
                        >
                          Edit
                        </Link>
                        {product.status !== 'published' && (
                          <button
                            disabled={pending}
                            onClick={() => handleStatus(product.id, 'published')}
                            className="px-2.5 py-1 text-xs bg-green-900/30 text-green-400 border border-green-700/40 rounded-lg hover:bg-green-900/50 transition-colors disabled:opacity-50"
                          >
                            Publish
                          </button>
                        )}
                        {product.status === 'published' && (
                          <button
                            disabled={pending}
                            onClick={() => handleStatus(product.id, 'draft')}
                            className="px-2.5 py-1 text-xs bg-[#2e2e2e] text-[#8c8c8c] rounded-lg hover:bg-[#3e3e3e] transition-colors disabled:opacity-50"
                          >
                            Unpublish
                          </button>
                        )}
                        {product.status !== 'archived' && (
                          <button
                            disabled={pending}
                            onClick={() => handleStatus(product.id, 'archived')}
                            className="px-2.5 py-1 text-xs bg-red-900/20 text-red-400/70 border border-red-900/30 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
