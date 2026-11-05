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

export class SupabaseAdapter implements DataAdapter {
  listProducts(_filter?: ProductFilter): Promise<PaginatedResult<Product>> { throw new Error(NOT_CONNECTED) }
  getProduct(_id: string): Promise<Product | null> { throw new Error(NOT_CONNECTED) }
  createProduct(_data: CreateProductInput): Promise<Product> { throw new Error(NOT_CONNECTED) }
  updateProduct(_id: string, _data: UpdateProductInput): Promise<Product> { throw new Error(NOT_CONNECTED) }
  setProductStatus(_id: string, _status: ProductStatus): Promise<Product> { throw new Error(NOT_CONNECTED) }
  listCategories(): Promise<Category[]> { throw new Error(NOT_CONNECTED) }
  createCategory(_data: CreateCategoryInput): Promise<Category> { throw new Error(NOT_CONNECTED) }
  updateCategory(_id: string, _data: UpdateCategoryInput): Promise<Category> { throw new Error(NOT_CONNECTED) }
  getInventory(_productId: string): Promise<InventoryRecord | null> { throw new Error(NOT_CONNECTED) }
  adjustInventory(_productId: string, _delta: number, _reason: string): Promise<InventoryRecord> { throw new Error(NOT_CONNECTED) }
  listInquiries(_filter?: InquiryFilter): Promise<PaginatedResult<Inquiry>> { throw new Error(NOT_CONNECTED) }
  createInquiry(_data: CreateInquiryInput): Promise<Inquiry> { throw new Error(NOT_CONNECTED) }
  updateInquiryStatus(_id: string, _status: InquiryStatus): Promise<void> { throw new Error(NOT_CONNECTED) }
  listSettings(): Promise<Record<string, unknown>> { throw new Error(NOT_CONNECTED) }
  getSetting(_key: string): Promise<unknown> { throw new Error(NOT_CONNECTED) }
  setSetting(_key: string, _value: unknown): Promise<void> { throw new Error(NOT_CONNECTED) }
  uploadImage(_productId: string, _file: ImageFile): Promise<ProductImage> { throw new Error(NOT_CONNECTED) }
  deleteImage(_imageId: string): Promise<void> { throw new Error(NOT_CONNECTED) }
  reorderImages(_productId: string, _imageIds: string[]): Promise<void> { throw new Error(NOT_CONNECTED) }
}
