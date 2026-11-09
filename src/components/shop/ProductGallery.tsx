'use client'

import { useState } from 'react'
import { getProductImageSrc } from '@/lib/product-image'
import type { ProductImage } from '@/lib/db/types'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full bg-[#141414] border border-[#2e2e2e] rounded-2xl flex items-center justify-center">
        <span className="text-[#8c8c8c] text-sm">No images</span>
      </div>
    )
  }

  const activeSrc = getProductImageSrc(images[activeIdx]?.storage_path ?? '')
  const activeAlt = images[activeIdx]?.alt_text ?? productName

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square w-full bg-[#141414] border border-[#2e2e2e] rounded-2xl overflow-hidden relative">
        {activeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeSrc}
            alt={activeAlt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#8c8c8c] text-sm">No preview</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => {
            const src = getProductImageSrc(img.storage_path)
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  activeIdx === idx ? 'border-[#f3c41b]' : 'border-[#2e2e2e] hover:border-[#4e4e4e]'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={img.alt_text ?? productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
