// DB types — JD Power Warehouse
// Column names match supabase/migrations/001_initial_schema.sql exactly.

export type ProductStatus = 'draft' | 'published' | 'archived'
export type InquiryStatus = 'new' | 'read' | 'replied' | 'archived'
export type InquiryType = 'quick_inquiry' | 'contact' | 'sell_request'
export type AdminRole = 'admin' | 'super_admin'
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'archive'
  | 'status_change'
  | 'inventory_adjust'

export interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  alt_text: string | null
  sort_order: number
  created_at?: string
}

export interface Product {
  id: string
  sku: string | null
  name: string
  description: string | null
  price: number
  original_price: number | null
  category_id: string | null
  status: ProductStatus
  badge: 'Sale' | 'New' | null
  created_at: string
  updated_at: string
  // Joined fields — populated by adapter, not stored in DB columns
  category?: Category
  images?: ProductImage[]
  quantity?: number
}

export interface InventoryRecord {
  id: string
  product_id: string
  quantity: number
  updated_at: string
}

export interface InventoryMovement {
  id: string
  product_id: string
  delta: number
  reason: string | null
  admin_id: string | null
  created_at: string
}

export interface Inquiry {
  id: string
  type: InquiryType
  name: string
  email: string
  phone: string | null
  message: string
  item_name: string | null
  item_description: string | null
  item_condition: string | null
  asking_price: number | null
  status: InquiryStatus
  created_at: string
}

export interface ProductFilter {
  status?: ProductStatus
  category_id?: string
  search?: string
  page?: number
  per_page?: number
}

export interface InquiryFilter {
  status?: InquiryStatus
  type?: InquiryType
  page?: number
  per_page?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export type CreateProductInput = {
  sku?: string | null
  name: string
  description?: string | null
  price: number
  original_price?: number | null
  category_id?: string | null
  status: ProductStatus
  badge?: 'Sale' | 'New' | null
}

export type UpdateProductInput = Partial<CreateProductInput>

export type CreateCategoryInput = {
  name: string
  slug: string
  sort_order?: number
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export interface CreateInquiryInput {
  type: InquiryType
  name: string
  email: string
  phone?: string
  message: string
  item_name?: string
  item_description?: string
  item_condition?: string
  asking_price?: number
}

export interface ImageFile {
  name: string
  type: string
  size: number
  buffer: Buffer
}
