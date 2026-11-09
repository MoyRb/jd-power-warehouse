import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import ProductForm from '@/components/admin/ProductForm'
import ImageUploader from '@/components/admin/ImageUploader'
import { updateProductAction } from '@/app/admin/_actions/products'

export const instant = false

interface EditProductPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  await requireAdmin()
  const { id } = await params
  const { created } = await searchParams

  const [product, categories] = await Promise.all([
    db.getProduct(id),
    db.listCategories(),
  ])

  if (!product) notFound()

  const action = updateProductAction.bind(null, id)

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {created === '1' && (
        <div className="mb-6 px-4 py-3 bg-green-900/20 border border-green-700/40 rounded-xl">
          <p className="text-green-400 text-sm font-medium">
            Product created! Now add images below.
          </p>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Edit Product</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">
          <a href="/admin/products" className="hover:text-[#f6f4ee] transition-colors">Products</a>
          {` / ${product.name}`}
        </p>
      </div>
      <ProductForm product={product} categories={categories} action={action} />

      <div className="mt-8 pt-8 border-t border-[#2e2e2e] max-w-2xl">
        <ImageUploader productId={id} images={product.images ?? []} />
      </div>
    </div>
  )
}
