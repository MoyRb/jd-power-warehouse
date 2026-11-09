'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ProductImage } from '@/lib/db/types'
import { getProductImageSrc } from '@/lib/product-image'
import {
  uploadProductImageAction,
  deleteProductImageAction,
  reorderImagesAction,
  updateImageAltTextAction,
} from '@/app/admin/_actions/products'

interface ImageUploaderProps {
  productId: string
  images: ProductImage[]
}

interface QueueItem {
  key: string
  file: File
  previewUrl: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

type OptimisticAction =
  | { type: 'delete'; id: string }
  | { type: 'reorder'; images: ProductImage[] }
  | { type: 'altText'; id: string; altText: string }

const MAX_SIZE = 5 * 1024 * 1024
const MAX_IMAGES = 10
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUploader({ productId, images: initialImages }: ImageUploaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, applyOptimistic] = useOptimistic(
    initialImages,
    (state: ProductImage[], action: OptimisticAction) => {
      switch (action.type) {
        case 'delete':
          return state.filter((img) => img.id !== action.id)
        case 'reorder':
          return action.images
        case 'altText':
          return state.map((img) =>
            img.id === action.id ? { ...img, alt_text: action.altText } : img,
          )
      }
    },
  )
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragSourceId = useRef<string | null>(null)
  const [editingAltId, setEditingAltId] = useState<string | null>(null)
  const [altDraft, setAltDraft] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const slots = MAX_IMAGES - images.length - queue.filter((q) => q.status !== 'error').length
    if (slots <= 0) {
      setError(`Maximum ${MAX_IMAGES} images per product`)
      return
    }

    setError(null)
    const toQueue = files.slice(0, slots)
    const newItems: QueueItem[] = toQueue.map((file) => ({
      key: `${Date.now()}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as const,
    }))

    setQueue((prev) => [...prev, ...newItems])
    newItems.forEach((item) => uploadQueueItem(item))
  }

  function uploadQueueItem(item: QueueItem) {
    if (!ALLOWED.includes(item.file.type)) {
      setQueue((prev) =>
        prev.map((q) =>
          q.key === item.key
            ? { ...q, status: 'error', error: 'Only JPEG, PNG, and WebP allowed' }
            : q,
        ),
      )
      return
    }
    if (item.file.size > MAX_SIZE) {
      setQueue((prev) =>
        prev.map((q) =>
          q.key === item.key ? { ...q, status: 'error', error: 'Max 5 MB per image' } : q,
        ),
      )
      return
    }

    setQueue((prev) =>
      prev.map((q) => (q.key === item.key ? { ...q, status: 'uploading' } : q)),
    )

    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', item.file)
      const result = await uploadProductImageAction(productId, formData)
      if (result.error) {
        setQueue((prev) =>
          prev.map((q) =>
            q.key === item.key ? { ...q, status: 'error', error: result.error } : q,
          ),
        )
      } else {
        setQueue((prev) =>
          prev.map((q) => (q.key === item.key ? { ...q, status: 'done' } : q)),
        )
        router.refresh()
      }
    })
  }

  function dismissQueueItem(key: string) {
    setQueue((prev) => {
      const item = prev.find((q) => q.key === key)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((q) => q.key !== key)
    })
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      applyOptimistic({ type: 'delete', id: imageId })
      await deleteProductImageAction(imageId, productId)
    })
  }

  function handleDragStart(id: string) {
    dragSourceId.current = id
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    setDragOverId(id)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    setDragOverId(null)
    const sourceId = dragSourceId.current
    if (!sourceId || sourceId === targetId) return

    const reordered = [...images]
    const fromIdx = reordered.findIndex((img) => img.id === sourceId)
    const toIdx = reordered.findIndex((img) => img.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    startTransition(async () => {
      applyOptimistic({ type: 'reorder', images: reordered })
      await reorderImagesAction(productId, reordered.map((img) => img.id))
    })
  }

  function startEditAlt(img: ProductImage) {
    setEditingAltId(img.id)
    setAltDraft(img.alt_text ?? '')
  }

  function handleAltSave(imageId: string) {
    const trimmed = altDraft.trim()
    if (!trimmed) return
    setEditingAltId(null)
    startTransition(async () => {
      applyOptimistic({ type: 'altText', id: imageId, altText: trimmed })
      const result = await updateImageAltTextAction(imageId, productId, trimmed)
      if (result.error) setError(result.error)
    })
  }

  const atLimit = images.length >= MAX_IMAGES

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#f6f4ee] font-bold text-sm">
          Images <span className="text-[#8c8c8c] font-normal">({images.length}/{MAX_IMAGES})</span>
        </h3>
        <button
          type="button"
          disabled={pending || atLimit}
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs bg-[#2e2e2e] text-[#f6f4ee] rounded-lg hover:bg-[#3e3e3e] transition-colors disabled:opacity-50"
        >
          {pending ? 'Uploading…' : atLimit ? 'Limit reached' : '+ Add Images'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-900/20 border border-red-700/40 rounded-lg flex items-center justify-between">
          <p className="text-red-400 text-xs">{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-red-400 text-sm ml-2">×</button>
        </div>
      )}

      {/* Upload queue previews */}
      {queue.length > 0 && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {queue.map((item) => (
            <div
              key={item.key}
              className="relative aspect-square bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className={`absolute inset-0 flex items-center justify-center ${
                item.status === 'done' ? 'bg-green-900/40' :
                item.status === 'error' ? 'bg-red-900/60' :
                item.status === 'uploading' ? 'bg-black/40' : 'bg-black/20'
              }`}>
                {item.status === 'uploading' && (
                  <span className="text-white text-xs font-medium">Uploading…</span>
                )}
                {item.status === 'done' && (
                  <span className="text-green-400 text-xs font-medium">✓ Done</span>
                )}
                {item.status === 'error' && (
                  <div className="text-center px-2">
                    <p className="text-red-300 text-xs">{item.error}</p>
                  </div>
                )}
              </div>
              {(item.status === 'done' || item.status === 'error') && (
                <button
                  type="button"
                  onClick={() => dismissQueueItem(item.key)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-900/80"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded images grid */}
      {images.length === 0 && queue.length === 0 ? (
        <p className="text-[#8c8c8c] text-sm py-6 text-center border border-dashed border-[#2e2e2e] rounded-xl">
          No images yet. Click &quot;+ Add Images&quot; to upload.
        </p>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const src = getProductImageSrc(img.storage_path)
            const isPrimary = idx === 0
            return (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(img.id)}
                onDragOver={(e) => handleDragOver(e, img.id)}
                onDrop={(e) => handleDrop(e, img.id)}
                onDragLeave={() => setDragOverId(null)}
                className={`relative group bg-[#1a1a1a] border rounded-xl overflow-hidden cursor-grab transition-colors ${
                  dragOverId === img.id ? 'border-[#f3c41b]/60' : 'border-[#2e2e2e]'
                }`}
              >
                <div className="aspect-square">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={img.alt_text ?? 'Product image'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a]">
                      <span className="text-[#8c8c8c] text-xs">No preview</span>
                    </div>
                  )}
                </div>

                {isPrimary && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#f3c41b] text-black text-[10px] font-bold rounded">
                    Primary
                  </div>
                )}

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/80 disabled:opacity-50"
                  aria-label="Delete image"
                >
                  ×
                </button>

                <div className="p-1.5 border-t border-[#2e2e2e] bg-[#141414]">
                  {editingAltId === img.id ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={altDraft}
                        maxLength={200}
                        onChange={(e) => setAltDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAltSave(img.id)
                          if (e.key === 'Escape') setEditingAltId(null)
                        }}
                        className="flex-1 min-w-0 text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#3e3e3e] rounded text-[#f6f4ee] focus:outline-none focus:border-[#f3c41b]"
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={pending || !altDraft.trim()}
                        onClick={() => handleAltSave(img.id)}
                        className="text-[10px] text-[#f3c41b] hover:underline disabled:opacity-50 shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditAlt(img)}
                      className="w-full text-left text-[10px] text-[#8c8c8c] hover:text-[#f6f4ee] truncate transition-colors"
                      title={img.alt_text ?? 'Click to add alt text'}
                    >
                      {img.alt_text || <span className="italic text-[#555]">Add alt text…</span>}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
