'use client'

import { useRef, useState, useTransition } from 'react'
import type { ProductImage } from '@/lib/db/types'
import {
  uploadProductImageAction,
  deleteProductImageAction,
  reorderImagesAction,
} from '@/app/admin/_actions/products'

interface ImageUploaderProps {
  productId: string
  images: ProductImage[]
}

const MAX_SIZE = 5 * 1024 * 1024

export default function ImageUploader({ productId, images: initialImages }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState(initialImages)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragSourceId = useRef<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be 5 MB or smaller')
      return
    }

    setError(null)
    const formData = new FormData()
    formData.set('file', file)

    startTransition(async () => {
      const result = await uploadProductImageAction(productId, formData)
      if (result.error) {
        setError(result.error)
      }
      // Page will revalidate; server refreshes images list via page re-render
    })

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      await deleteProductImageAction(imageId, productId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
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
    setImages(reordered)

    startTransition(async () => {
      await reorderImagesAction(productId, reordered.map((img) => img.id))
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#f6f4ee] font-bold text-sm">Images</h3>
        <button
          type="button"
          disabled={pending}
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs bg-[#2e2e2e] text-[#f6f4ee] rounded-lg hover:bg-[#3e3e3e] transition-colors disabled:opacity-50"
        >
          {pending ? 'Uploading…' : '+ Add Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-900/20 border border-red-700/40 rounded-lg">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {images.length === 0 ? (
        <p className="text-[#8c8c8c] text-sm py-6 text-center border border-dashed border-[#2e2e2e] rounded-xl">
          No images yet. Click &quot;Add Image&quot; to upload.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(img.id)}
              onDragOver={(e) => handleDragOver(e, img.id)}
              onDrop={(e) => handleDrop(e, img.id)}
              onDragLeave={() => setDragOverId(null)}
              className={`relative group aspect-square bg-[#1a1a1a] border rounded-xl overflow-hidden cursor-grab transition-colors ${
                dragOverId === img.id ? 'border-[#f3c41b]/60' : 'border-[#2e2e2e]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.storage_path.startsWith('mock://') ? '/placeholder-product.jpg' : img.storage_path}
                alt={img.alt_text ?? 'Product image'}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/80 disabled:opacity-50"
                aria-label="Delete image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
