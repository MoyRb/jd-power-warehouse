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
  email: string | null
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
  email?: string | null
  phone?: string | null
  message: string
  item_name?: string | null
  item_description?: string | null
  item_condition?: string | null
  asking_price?: number | null
  ip_hash?: string | null
}

export interface ImageFile {
  name: string
  type: string
  size: number
  buffer: Buffer
}

// ---------------------------------------------------------------------------
// Analytics types
// ---------------------------------------------------------------------------

export interface ProductStats {
  total: number
  published: number
  draft: number
  archived: number
  totalCategories: number
  totalUnits: number
  outOfStock: number
  lowStock: number
  estimatedInventoryValue: number
}

export interface CategoryStat {
  id: string
  name: string
  slug: string
  productCount: number
  publishedCount: number
  totalUnits: number
  outOfStock: number
  lowStock: number
  estimatedValue: number
}

export interface InquiryDayCount {
  date: string   // "YYYY-MM-DD"
  count: number
}

export interface InquiryStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  pending: number
  trend: InquiryDayCount[]
}

export interface LowStockProduct {
  id: string
  name: string
  categoryName: string | null
  quantity: number
  status: ProductStatus
}
