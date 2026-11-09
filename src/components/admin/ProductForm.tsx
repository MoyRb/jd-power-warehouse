'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, Category } from '@/lib/db/types'

interface ProductFormProps {
  product?: Product
  categories: Category[]
  action: (formData: FormData) => Promise<{ id?: string; error?: string }>
}

const inputClass =
  'w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors'

const labelClass = 'block text-sm font-medium text-[#f6f4ee] mb-1.5'

export default function ProductForm({ product, categories, action }: ProductFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.id) {
        router.push(`/admin/products/${result.id}/edit?created=1`)
      } else {
        router.push('/admin/products')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className={labelClass}>Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            name="name"
            required
            defaultValue={product?.name ?? ''}
            placeholder="Product name"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description ?? ''}
            placeholder="Product description"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label className={labelClass}>Price <span className="text-red-400">*</span></label>
          <input
            type="number"
            name="price"
            required
            min="0"
            step="0.01"
            defaultValue={product?.price ?? ''}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Original Price</label>
          <input
            type="number"
            name="original_price"
            min="0"
            step="0.01"
            defaultValue={product?.original_price ?? ''}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>SKU</label>
          <input
            type="text"
            name="sku"
            defaultValue={product?.sku ?? ''}
            placeholder="SKU-001"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select
            name="category_id"
            defaultValue={product?.category_id ?? ''}
            className={inputClass}
          >
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            name="status"
            defaultValue={product?.status ?? 'draft'}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Badge</label>
          <select
            name="badge"
            defaultValue={product?.badge ?? ''}
            className={inputClass}
          >
            <option value="">— None —</option>
            <option value="Sale">Sale</option>
            <option value="New">New</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-[#f3c41b] text-[#0f0f0f] font-black text-sm rounded-xl hover:bg-[#e8b818] transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving…' : product ? 'Save Changes' : 'Create Product'}
        </button>
        <a
          href="/admin/products"
          className="px-4 py-2.5 text-[#8c8c8c] text-sm hover:text-[#f6f4ee] transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
