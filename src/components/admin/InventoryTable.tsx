'use client'

import { useState, useTransition } from 'react'
import type { Product, Category } from '@/lib/db/types'
import { adjustInventoryAction } from '@/app/admin/_actions/inventory'

interface InventoryTableProps {
  products: Product[]
  categories: Category[]
}

interface AdjustState {
  productId: string
  delta: string
  reason: string
}

export default function InventoryTable({ products, categories }: InventoryTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, p.quantity ?? 0])),
  )
  const [adjusting, setAdjusting] = useState<AdjustState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function openAdjust(productId: string) {
    setAdjusting({ productId, delta: '', reason: '' })
    setError(null)
  }

  function handleSave() {
    if (!adjusting) return
    setError(null)
    const formData = new FormData()
    formData.set('product_id', adjusting.productId)
    formData.set('delta', adjusting.delta)
    formData.set('reason', adjusting.reason)

    startTransition(async () => {
      const result = await adjustInventoryAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      const delta = parseInt(adjusting.delta, 10)
      setQuantities((prev) => ({
        ...prev,
        [adjusting.productId]: Math.max(0, (prev[adjusting.productId] ?? 0) + delta),
      }))
      setAdjusting(null)
    })
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#2e2e2e]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e2e] bg-[#141414]">
              <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Product</th>
              <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Stock</th>
              <th className="text-right px-4 py-3 text-[#8c8c8c] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const qty = quantities[product.id] ?? 0
              const lowStock = qty < 3
              const cat = categories.find((c) => c.id === product.category_id)
              const isAdjusting = adjusting?.productId === product.id

              return (
                <>
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
                    <td className="px-4 py-3">
                      <span
                        className={`text-lg font-black ${lowStock ? 'text-amber-400' : 'text-[#f6f4ee]'}`}
                      >
                        {qty}
                      </span>
                      {lowStock && (
                        <span className="ml-2 text-xs text-amber-400/70">low stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => isAdjusting ? setAdjusting(null) : openAdjust(product.id)}
                        className="px-3 py-1.5 text-xs bg-[#2e2e2e] text-[#f6f4ee] rounded-lg hover:bg-[#3e3e3e] transition-colors disabled:opacity-50"
                      >
                        {isAdjusting ? 'Cancel' : 'Adjust'}
                      </button>
                    </td>
                  </tr>

                  {isAdjusting && (
                    <tr className="border-b border-[#2e2e2e] bg-[#141414]/40">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="block text-xs text-[#8c8c8c] mb-1">
                              Delta (+ add / - remove)
                            </label>
                            <input
                              autoFocus
                              type="number"
                              value={adjusting.delta}
                              onChange={(e) =>
                                setAdjusting((p) => p ? { ...p, delta: e.target.value } : p)
                              }
                              placeholder="e.g. 5 or -2"
                              className="w-28 px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-lg text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors"
                            />
                          </div>
                          <div className="flex-1 min-w-48">
                            <label className="block text-xs text-[#8c8c8c] mb-1">Reason</label>
                            <input
                              type="text"
                              value={adjusting.reason}
                              onChange={(e) =>
                                setAdjusting((p) => p ? { ...p, reason: e.target.value } : p)
                              }
                              placeholder="Received shipment, sold, etc."
                              className="w-full px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-lg text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={handleSave}
                            className="px-4 py-1.5 bg-[#f3c41b] text-[#0f0f0f] font-black text-sm rounded-lg hover:bg-[#e8b818] transition-colors disabled:opacity-50"
                          >
                            {pending ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
