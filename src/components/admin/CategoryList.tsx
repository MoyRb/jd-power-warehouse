'use client'

import { useState, useTransition } from 'react'
import type { Category } from '@/lib/db/types'
import { createCategoryAction, updateCategoryAction } from '@/app/admin/_actions/categories'

interface CategoryListProps {
  categories: Category[]
}

interface RowState {
  id: string | null // null = new
  name: string
  slug: string
  sort_order: string
}

const inputClass =
  'px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-lg text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CategoryList({ categories: initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState(
    [...initialCategories].sort((a, b) => a.sort_order - b.sort_order),
  )
  const [editing, setEditing] = useState<RowState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function startEdit(cat: Category) {
    setEditing({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      sort_order: String(cat.sort_order),
    })
    setError(null)
  }

  function startNew() {
    setEditing({ id: null, name: '', slug: '', sort_order: String(categories.length) })
    setError(null)
  }

  function handleNameChange(value: string) {
    if (!editing) return
    setEditing((prev) =>
      prev ? { ...prev, name: value, slug: prev.id === null ? toSlug(value) : prev.slug } : prev,
    )
  }

  function handleSave() {
    if (!editing) return
    setError(null)
    const formData = new FormData()
    formData.set('name', editing.name)
    formData.set('slug', editing.slug)
    formData.set('sort_order', editing.sort_order)

    startTransition(async () => {
      let result: { error?: string }
      if (editing.id === null) {
        result = await createCategoryAction(formData)
      } else {
        result = await updateCategoryAction(editing.id, formData)
      }

      if (result.error) {
        setError(result.error)
        return
      }

      // Optimistic update
      if (editing.id === null) {
        setCategories((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            name: editing.name,
            slug: editing.slug,
            sort_order: parseInt(editing.sort_order, 10),
            created_at: new Date().toISOString(),
          },
        ])
      } else {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editing.id
              ? { ...c, name: editing.name, slug: editing.slug, sort_order: parseInt(editing.sort_order, 10) }
              : c,
          ),
        )
      }
      setEditing(null)
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          disabled={pending}
          onClick={startNew}
          className="px-4 py-2 bg-[#f3c41b] text-[#0f0f0f] font-black text-sm rounded-xl hover:bg-[#e8b818] transition-colors disabled:opacity-50"
        >
          + Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-[#2e2e2e] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e2e] bg-[#141414]">
              <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Name</th>
              <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden sm:table-cell">Slug</th>
              <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium w-20">Order</th>
              <th className="text-right px-4 py-3 text-[#8c8c8c] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New category row */}
            {editing?.id === null && (
              <tr className="border-b border-[#2e2e2e] bg-[#141414]/60">
                <td className="px-4 py-3">
                  <input
                    autoFocus
                    type="text"
                    value={editing.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Category name"
                    className={inputClass}
                  />
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <input
                    type="text"
                    value={editing.slug}
                    onChange={(e) => setEditing((p) => p ? { ...p, slug: e.target.value } : p)}
                    placeholder="category-slug"
                    className={inputClass}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing((p) => p ? { ...p, sort_order: e.target.value } : p)}
                    className={`${inputClass} w-16`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={handleSave}
                      className="px-3 py-1.5 text-xs bg-[#f3c41b] text-[#0f0f0f] font-bold rounded-lg hover:bg-[#e8b818] transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-3 py-1.5 text-xs text-[#8c8c8c] hover:text-[#f6f4ee] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {categories.length === 0 && editing?.id !== null && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#8c8c8c] text-sm">
                  No categories yet.
                </td>
              </tr>
            )}

            {categories.map((cat) =>
              editing?.id === cat.id ? (
                <tr key={cat.id} className="border-b border-[#2e2e2e] last:border-0 bg-[#141414]/60">
                  <td className="px-4 py-3">
                    <input
                      autoFocus
                      type="text"
                      value={editing.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <input
                      type="text"
                      value={editing.slug}
                      onChange={(e) => setEditing((p) => p ? { ...p, slug: e.target.value } : p)}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={editing.sort_order}
                      onChange={(e) => setEditing((p) => p ? { ...p, sort_order: e.target.value } : p)}
                      className={`${inputClass} w-16`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={handleSave}
                        className="px-3 py-1.5 text-xs bg-[#f3c41b] text-[#0f0f0f] font-bold rounded-lg hover:bg-[#e8b818] transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="px-3 py-1.5 text-xs text-[#8c8c8c] hover:text-[#f6f4ee] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={cat.id} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#141414]/60 transition-colors">
                  <td className="px-4 py-3 text-[#f6f4ee] font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-[#8c8c8c] font-mono text-xs hidden sm:table-cell">{cat.slug}</td>
                  <td className="px-4 py-3 text-[#8c8c8c]">{cat.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="px-3 py-1.5 text-xs bg-[#2e2e2e] text-[#f6f4ee] rounded-lg hover:bg-[#3e3e3e] transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
