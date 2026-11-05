import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import ProductForm from '@/components/admin/ProductForm'
import { updateProductAction } from '@/app/admin/_actions/products'

export const instant = false

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdmin()
  const { id } = await params

  const [product, categories] = await Promise.all([
    db.getProduct(id),
    db.listCategories(),
  ])

  if (!product) notFound()

  const action = updateProductAction.bind(null, id)

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Edit Product</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">
          <a href="/admin/products" className="hover:text-[#f6f4ee] transition-colors">Products</a>
          {` / ${product.name}`}
        </p>
      </div>
      <ProductForm product={product} categories={categories} action={action} />
    </div>
  )
}
