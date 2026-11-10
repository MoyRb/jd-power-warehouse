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

// ---------------------------------------------------------------------------
// B2B — Corte 4A
// ---------------------------------------------------------------------------

export type QuoteStatus =
  | 'pending'
  | 'reviewing'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type QuoteEventType =
  | 'status_change'
  | 'note_added'
  | 'price_set'
  | 'line_added'
  | 'line_removed'
  | 'reopened'

/**
 * B2B company record. tax_id + tax_id_type are optional and country-agnostic
 * to support RFC (MX), EIN (US), VAT (EU), etc. (D8).
 * price_tier is a stub for future volume pricing (D3).
 */
export interface BusinessCustomer {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  address: string | null
  country: string | null       // ISO-3166-1 alpha-2
  tax_id: string | null
  tax_id_type: string | null   // 'RFC' | 'EIN' | 'VAT' | custom
  price_tier: string | null    // future: 'standard' | 'preferred' | 'contract'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface QuoteLine {
  id: string
  quote_id: string
  product_id: string | null    // null = free-form line
  quantity: number
  description: string | null   // required when product_id is null
  unit_list_price: number | null  // snapshot of catalog price at submission
  unit_quoted_price: number | null  // set by admin after review
  currency_code: string
  customer_note: string | null
  sort_order: number
  created_at: string
  // Joined fields
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'price'>
}

export interface Quote {
  id: string
  quote_ref: string            // human-readable: QT-2026-0001
  customer_id: string | null
  anon_name: string | null
  anon_email: string | null
  anon_phone: string | null
  anon_company: string | null
  status: QuoteStatus
  currency_code: string
  admin_notes: string | null
  valid_until: string | null
  ip_hash: string | null
  created_at: string
  updated_at: string
  // Joined fields
  customer?: BusinessCustomer
  lines?: QuoteLine[]
  events?: QuoteEvent[]
}

export interface QuoteEvent {
  id: string
  quote_id: string
  admin_id: string | null
  event_type: QuoteEventType
  old_status: QuoteStatus | null
  new_status: QuoteStatus | null
  note: string | null
  created_at: string
}

export interface QuoteFilter {
  status?: QuoteStatus
  customer_id?: string
  search?: string   // searches quote_ref, anon_name, anon_company
  page?: number
  per_page?: number
}

export interface CustomerFilter {
  search?: string   // searches company_name, contact_name, email
  page?: number
  per_page?: number
}

export interface CreateQuoteInput {
  anon_name: string
  anon_email: string
  anon_phone?: string | null
  anon_company?: string | null
  lines: Array<{
    product_id?: string | null
    quantity: number
    description?: string | null
    customer_note?: string | null
  }>
  ip_hash?: string | null
}

export interface CreateCustomerInput {
  company_name: string
  contact_name: string
  email: string
  phone?: string | null
  address?: string | null
  country?: string | null
  tax_id?: string | null
  tax_id_type?: string | null
  notes?: string | null
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  price_tier?: string | null   // admin-managed; not in CreateCustomerInput
}

export interface UpdateQuoteLineInput {
  unit_quoted_price?: number | null
  quantity?: number
  description?: string | null
  customer_note?: string | null
}

export interface QuoteStats {
  total: number
  byStatus: Record<string, number>
  pending: number         // pending + reviewing (requires action)
  sent: number
  accepted: number
  rejected: number
  expired: number
  sentValue: number       // sum qty * unit_quoted_price for sent quotes (USD)
  acceptedValue: number   // sum qty * unit_quoted_price for accepted quotes (USD)
  /** accepted / (sent + accepted + rejected) — null when denominator is 0 */
  conversionRate: number | null
  trend: Array<{ date: string; count: number }>
}
