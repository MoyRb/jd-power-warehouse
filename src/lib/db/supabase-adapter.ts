// SupabaseAdapter — stub
// Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Will be fully implemented when Supabase credentials are available.
import type { DataAdapter } from './adapter'
import type {
  Product,
  ProductFilter,
  ProductStatus,
  PaginatedResult,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  InventoryRecord,
  Inquiry,
  InquiryFilter,
  InquiryStatus,
  CreateInquiryInput,
  ProductImage,
  ImageFile,
} from './types'

const NOT_CONNECTED = 'SupabaseAdapter: Supabase not connected. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'

/* eslint-disable @typescript-eslint/no-unused-vars */
export class SupabaseAdapter implements DataAdapter {
  listProducts(filter?: ProductFilter): Promise<PaginatedResult<Product>> { throw new Error(NOT_CONNECTED) }
  getProduct(id: string): Promise<Product | null> { throw new Error(NOT_CONNECTED) }
  createProduct(data: CreateProductInput): Promise<Product> { throw new Error(NOT_CONNECTED) }
  updateProduct(id: string, data: UpdateProductInput): Promise<Product> { throw new Error(NOT_CONNECTED) }
  setProductStatus(id: string, status: ProductStatus): Promise<Product> { throw new Error(NOT_CONNECTED) }
  listCategories(): Promise<Category[]> { throw new Error(NOT_CONNECTED) }
  createCategory(data: CreateCategoryInput): Promise<Category> { throw new Error(NOT_CONNECTED) }
  updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> { throw new Error(NOT_CONNECTED) }
  getInventory(productId: string): Promise<InventoryRecord | null> { throw new Error(NOT_CONNECTED) }
  adjustInventory(productId: string, delta: number, reason: string): Promise<InventoryRecord> { throw new Error(NOT_CONNECTED) }
  listInquiries(filter?: InquiryFilter): Promise<PaginatedResult<Inquiry>> { throw new Error(NOT_CONNECTED) }
  createInquiry(data: CreateInquiryInput): Promise<Inquiry> { throw new Error(NOT_CONNECTED) }
  updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> { throw new Error(NOT_CONNECTED) }
  listSettings(): Promise<Record<string, unknown>> { throw new Error(NOT_CONNECTED) }
  getSetting(key: string): Promise<unknown> { throw new Error(NOT_CONNECTED) }
  setSetting(key: string, value: unknown): Promise<void> { throw new Error(NOT_CONNECTED) }
  uploadImage(productId: string, file: ImageFile): Promise<ProductImage> { throw new Error(NOT_CONNECTED) }
  deleteImage(imageId: string): Promise<void> { throw new Error(NOT_CONNECTED) }
  reorderImages(productId: string, imageIds: string[]): Promise<void> { throw new Error(NOT_CONNECTED) }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
