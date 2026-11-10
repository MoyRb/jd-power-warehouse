/**
 * SupabaseAdapter — full DataAdapter implementation backed by JDHOUSE Supabase project.
 *
 * Uses @supabase/ssr createServerClient (cookie-based) so the same adapter works for:
 *  - Public pages  → anon session, RLS returns published products only
 *  - Admin actions → admin JWT from cookie session, RLS allows all operations via is_admin()
 *
 * No service role key required. Authorization is enforced by RLS policies on every table.
 * Application-layer authorization (requireAdmin) is a defence-in-depth layer on top of RLS.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
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
  ProductStats,
  CategoryStat,
  InquiryStats,
  LowStockProduct,
  // B2B
  BusinessCustomer,
  CustomerFilter,
  CreateCustomerInput,
  UpdateCustomerInput,
  Quote,
  QuoteFilter,
  QuoteStatus,
  QuoteLine,
  CreateQuoteInput,
  QuoteStats,
} from './types'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const STORAGE_BUCKET = 'product-images'

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function mapProduct(raw: Record<string, unknown>): Product {
  const inv = raw.inventory as { quantity: number } | null
  const imgs = (raw.product_images as ProductImage[] | null) ?? []
  const cat = raw.categories as Category | null

  return {
    id: raw.id as string,
    sku: raw.sku as string | null,
    name: raw.name as string,
    description: raw.description as string | null,
    price: Number(raw.price),
    original_price: raw.original_price != null ? Number(raw.original_price) : null,
    category_id: raw.category_id as string | null,
    status: raw.status as ProductStatus,
    badge: raw.badge as 'Sale' | 'New' | null,
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
    quantity: inv?.quantity ?? 0,
    images: [...imgs].sort((a, b) => a.sort_order - b.sort_order),
    category: cat ?? undefined,
  }
}

type ClientFactory = () => Promise<ReturnType<typeof createServerClient>>

export class SupabaseAdapter implements DataAdapter {
  /**
   * Optional client factory injected at construction.
   * - Production: not set → uses Next.js cookie-based client (session-aware)
   * - Tests: inject a factory returning a plain createClient (anon or service role)
   */
  private readonly _clientFactory: ClientFactory | null

  constructor(clientFactory?: ClientFactory) {
    this._clientFactory = clientFactory ?? null
  }

  private async getClient() {
    if (this._clientFactory) {
      return this._clientFactory()
    }
    const cookieStore = await cookies()
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch {
              // Server Component — cookie mutations silently ignored
            }
          },
        },
      },
    )
  }

  // ---------------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------------

  async listProducts(filter?: ProductFilter): Promise<PaginatedResult<Product>> {
    const supabase = await this.getClient()
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 100
    const start = (page - 1) * perPage
    const end = start + perPage - 1

    let query = supabase
      .from('products')
      .select('*, categories(*), product_images(*), inventory(*)', { count: 'exact' })
      .range(start, end)
      .order('created_at', { ascending: false })

    if (filter?.status !== undefined) {
      query = query.eq('status', filter.status)
    }
    if (filter?.category_id) {
      query = query.eq('category_id', filter.category_id)
    }
    if (filter?.search) {
      const q = `%${filter.search}%`
      query = query.or(`name.ilike.${q},description.ilike.${q}`)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    return {
      data: (data as Record<string, unknown>[]).map(mapProduct),
      total: count ?? 0,
      page,
      per_page: perPage,
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), product_images(*), inventory(*)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return mapProduct(data as Record<string, unknown>)
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const supabase = await this.getClient()

    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: input.sku ?? null,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        original_price: input.original_price ?? null,
        category_id: input.category_id ?? null,
        status: input.status,
        badge: input.badge ?? null,
      })
      .select('id')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'createProduct failed')

    // Create inventory row
    await supabase
      .from('inventory')
      .insert({ product_id: data.id, quantity: 0 })

    const product = await this.getProduct(data.id)
    if (!product) throw new Error('Product created but getProduct returned null')
    return product
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const supabase = await this.getClient()

    const patch: Record<string, unknown> = {}
    if (input.name !== undefined) patch.name = input.name
    if (input.description !== undefined) patch.description = input.description
    if (input.price !== undefined) patch.price = input.price
    if (input.original_price !== undefined) patch.original_price = input.original_price
    if (input.category_id !== undefined) patch.category_id = input.category_id
    if (input.status !== undefined) patch.status = input.status
    if (input.badge !== undefined) patch.badge = input.badge
    if (input.sku !== undefined) patch.sku = input.sku

    const { error } = await supabase.from('products').update(patch).eq('id', id)
    if (error) throw new Error(error.message)

    const product = await this.getProduct(id)
    if (!product) throw new Error('Product not found after update')
    return product
  }

  async setProductStatus(id: string, status: ProductStatus): Promise<Product> {
    return this.updateProduct(id, { status })
  }

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  async listCategories(): Promise<Category[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as Category[]
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: input.name,
        slug: input.slug,
        sort_order: input.sort_order ?? 0,
      })
      .select('*')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'createCategory failed')
    return data as Category
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const supabase = await this.getClient()
    const patch: Record<string, unknown> = {}
    if (input.name !== undefined) patch.name = input.name
    if (input.slug !== undefined) patch.slug = input.slug
    if (input.sort_order !== undefined) patch.sort_order = input.sort_order

    const { data, error } = await supabase
      .from('categories')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'updateCategory failed')
    return data as Category
  }

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  async getInventory(productId: string): Promise<InventoryRecord | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (error || !data) return null
    return data as InventoryRecord
  }

  async adjustInventory(
    productId: string,
    delta: number,
    reason: string,
  ): Promise<InventoryRecord> {
    const supabase = await this.getClient()

    const existing = await this.getInventory(productId)
    const currentQty = existing?.quantity ?? 0
    const newQty = Math.max(0, currentQty + delta)

    // Upsert inventory record
    const { data, error } = await supabase
      .from('inventory')
      .upsert(
        { product_id: productId, quantity: newQty },
        { onConflict: 'product_id' },
      )
      .select('*')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'adjustInventory failed')

    // Record movement (best-effort; audit trail)
    await supabase
      .from('inventory_movements')
      .insert({ product_id: productId, delta, reason, admin_id: null })

    return data as InventoryRecord
  }

  // ---------------------------------------------------------------------------
  // Inquiries
  // ---------------------------------------------------------------------------

  async listInquiries(filter?: InquiryFilter): Promise<PaginatedResult<Inquiry>> {
    const supabase = await this.getClient()
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 50
    const start = (page - 1) * perPage
    const end = start + perPage - 1

    let query = supabase
      .from('inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end)

    if (filter?.status) query = query.eq('status', filter.status)
    if (filter?.type) query = query.eq('type', filter.type)

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    return {
      data: (data ?? []) as Inquiry[],
      total: count ?? 0,
      page,
      per_page: perPage,
    }
  }

  async createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        type: input.type,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        message: input.message,
        item_name: input.item_name ?? null,
        item_description: input.item_description ?? null,
        item_condition: input.item_condition ?? null,
        asking_price: input.asking_price ?? null,
        ip_hash: input.ip_hash ?? null,
        status: 'new',
      })
      .select('*')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'createInquiry failed')
    return data as Inquiry
  }

  async updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async listSettings(): Promise<Record<string, unknown>> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')

    if (error) throw new Error(error.message)
    return Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]))
  }

  async getSetting(key: string): Promise<unknown> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) return null
    return data.value
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .from('store_settings')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) throw new Error(error.message)
  }

  // ---------------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------------

  async uploadImage(productId: string, file: ImageFile): Promise<ProductImage> {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error('INVALID_TYPE')
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('FILE_TOO_LARGE')
    }

    const supabase = await this.getClient()

    // Bucket must exist before uploads — created administratively or via migration 006.
    // No runtime creation: attempting createBucket with admin session triggers RLS on
    // storage.buckets and would fail silently or raise a confusing error.
    const imageId = randomUUID()
    const ext = EXT_MAP[file.type] ?? 'jpg'
    const storagePath = `${productId}/${imageId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, { contentType: file.type })

    if (uploadError) throw new Error(uploadError.message)

    // Count existing images for sort_order
    const { count } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    const { data, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: storagePath,
        alt_text: file.name,
        sort_order: count ?? 0,
      })
      .select('*')
      .single()

    if (insertError || !data) {
      // Compensatory delete — storagePath is scoped to this productId so only this file is removed
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw new Error(insertError?.message ?? 'uploadImage insert failed')
    }
    return data as ProductImage
  }

  async deleteImage(imageId: string): Promise<void> {
    const supabase = await this.getClient()

    // Fetch storage_path before deleting the record
    const { data: img } = await supabase
      .from('product_images')
      .select('storage_path')
      .eq('id', imageId)
      .single()

    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)

    if (error) throw new Error(error.message)

    if (img?.storage_path) {
      await supabase.storage.from(STORAGE_BUCKET).remove([img.storage_path])
    }
  }

  async reorderImages(productId: string, imageIds: string[]): Promise<void> {
    const supabase = await this.getClient()

    await Promise.all(
      imageIds.map((imgId, index) =>
        supabase
          .from('product_images')
          .update({ sort_order: index })
          .eq('id', imgId)
          .eq('product_id', productId),
      ),
    )
  }

  async updateImageAltText(imageId: string, productId: string, altText: string): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .from('product_images')
      .update({ alt_text: altText })
      .eq('id', imageId)
      .eq('product_id', productId)
    if (error) throw new Error(error.message)
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  async getProductStats(lowStockThreshold = 5): Promise<ProductStats> {
    const zero: ProductStats = {
      total: 0, published: 0, draft: 0, archived: 0,
      totalCategories: 0, totalUnits: 0, outOfStock: 0, lowStock: 0,
      estimatedInventoryValue: 0,
    }
    try {
      const supabase = await this.getClient()

      const [
        { count: total },
        { count: published },
        { count: draft },
        { count: archived },
        { count: totalCategories },
        { data: invRows },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase
          .from('inventory')
          .select('quantity, products!inner(price, status)')
          .neq('products.status', 'archived'),
      ])

      let totalUnits = 0
      let outOfStock = 0
      let lowStock = 0
      let estimatedInventoryValue = 0

      for (const row of (invRows ?? []) as Array<{ quantity: number; products: { price: number; status: string } }>) {
        const qty = row.quantity
        const price = Number(row.products.price)
        totalUnits += qty
        estimatedInventoryValue += qty * price
        if (qty === 0) {
          outOfStock++
        } else if (lowStockThreshold > 0 && qty <= lowStockThreshold) {
          lowStock++
        }
      }

      return {
        total: total ?? 0,
        published: published ?? 0,
        draft: draft ?? 0,
        archived: archived ?? 0,
        totalCategories: totalCategories ?? 0,
        totalUnits,
        outOfStock,
        lowStock,
        estimatedInventoryValue,
      }
    } catch {
      return zero
    }
  }

  async getCategoryStats(lowStockThreshold = 5): Promise<CategoryStat[]> {
    try {
      const supabase = await this.getClient()

      const [{ data: categories }, { data: products }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('id, price, status, category_id, inventory(quantity)'),
      ])

      return (categories ?? []).map((cat: Record<string, unknown>) => {
        const catProducts = (products ?? []).filter(
          (p: Record<string, unknown>) => p.category_id === cat.id,
        ) as Array<{ id: string; price: number | string; status: string; category_id: string; inventory: { quantity: number } | null }>

        const productCount = catProducts.length
        const publishedCount = catProducts.filter((p) => p.status === 'published').length
        let totalUnits = 0
        let outOfStock = 0
        let lowStock = 0
        let estimatedValue = 0

        for (const p of catProducts) {
          if (p.status === 'archived') continue
          const qty = p.inventory?.quantity ?? 0
          const price = Number(p.price)
          totalUnits += qty
          estimatedValue += qty * price
          if (qty === 0) {
            outOfStock++
          } else if (lowStockThreshold > 0 && qty <= lowStockThreshold) {
            lowStock++
          }
        }

        return {
          id: cat.id as string,
          name: cat.name as string,
          slug: cat.slug as string,
          productCount,
          publishedCount,
          totalUnits,
          outOfStock,
          lowStock,
          estimatedValue,
        }
      })
    } catch {
      return []
    }
  }

  async getInquiryStats(days = 30): Promise<InquiryStats> {
    const zero: InquiryStats = { total: 0, byType: {}, byStatus: {}, pending: 0, trend: [] }
    try {
      const supabase = await this.getClient()

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      const cutoffISO = cutoff.toISOString()

      const [{ count: total }, { data: recent }] = await Promise.all([
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase
          .from('inquiries')
          .select('type, status, created_at')
          .gte('created_at', cutoffISO),
      ])

      const byType: Record<string, number> = {}
      const byStatus: Record<string, number> = {}

      for (const row of (recent ?? []) as Array<{ type: string; status: string; created_at: string }>) {
        byType[row.type] = (byType[row.type] ?? 0) + 1
        byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
      }

      const pending = (byStatus['new'] ?? 0) + (byStatus['read'] ?? 0)

      // Build trend array for the last `days` days
      const trend: { date: string; count: number }[] = []
      const rows = (recent ?? []) as Array<{ created_at: string }>
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().substring(0, 10)
        const count = rows.filter((r) => r.created_at.substring(0, 10) === dateStr).length
        trend.push({ date: dateStr, count })
      }

      return { total: total ?? 0, byType, byStatus, pending, trend }
    } catch {
      return zero
    }
  }

  async getLowStockProducts(threshold = 5): Promise<LowStockProduct[]> {
    try {
      const supabase = await this.getClient()

      const { data } = await supabase
        .from('inventory')
        .select('quantity, products!inner(id, name, status, categories(name))')
        .lte('quantity', threshold)
        .neq('products.status', 'archived')
        .order('quantity', { ascending: true })

      return (data ?? []).map((row: Record<string, unknown>) => {
        const p = row.products as { id: string; name: string; status: string; categories: { name: string } | null }
        return {
          id: p.id,
          name: p.name,
          categoryName: p.categories?.name ?? null,
          quantity: row.quantity as number,
          status: p.status as 'draft' | 'published' | 'archived',
        }
      })
    } catch {
      return []
    }
  }

  // ---------------------------------------------------------------------------
  // B2B — Business Customers
  // ---------------------------------------------------------------------------

  async listCustomers(filter?: CustomerFilter): Promise<PaginatedResult<BusinessCustomer>> {
    const supabase = await this.getClient()
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 100
    const start = (page - 1) * perPage

    let query = supabase
      .from('business_customers')
      .select('*', { count: 'exact' })
      .range(start, start + perPage - 1)
      .order('created_at', { ascending: false })

    if (filter?.search) {
      const q = `%${filter.search}%`
      query = query.or(`company_name.ilike.${q},contact_name.ilike.${q},email.ilike.${q}`)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      data: (data ?? []) as BusinessCustomer[],
      total: count ?? 0,
      page,
      per_page: perPage,
    }
  }

  async getCustomer(id: string): Promise<BusinessCustomer | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('business_customers')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as BusinessCustomer
  }

  async createCustomer(data: CreateCustomerInput): Promise<BusinessCustomer> {
    const supabase = await this.getClient()
    const { data: row, error } = await supabase
      .from('business_customers')
      .insert({
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone ?? null,
        address: data.address ?? null,
        country: data.country ?? null,
        tax_id: data.tax_id ?? null,
        tax_id_type: data.tax_id_type ?? null,
        notes: data.notes ?? null,
      })
      .select('*')
      .single()

    if (error || !row) throw new Error(error?.message ?? 'createCustomer failed')
    return row as BusinessCustomer
  }

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<BusinessCustomer> {
    const supabase = await this.getClient()
    const patch: Record<string, unknown> = {}
    if (data.company_name !== undefined) patch.company_name = data.company_name
    if (data.contact_name !== undefined) patch.contact_name = data.contact_name
    if (data.email !== undefined) patch.email = data.email
    if (data.phone !== undefined) patch.phone = data.phone
    if (data.address !== undefined) patch.address = data.address
    if (data.country !== undefined) patch.country = data.country
    if (data.tax_id !== undefined) patch.tax_id = data.tax_id
    if (data.tax_id_type !== undefined) patch.tax_id_type = data.tax_id_type
    if (data.notes !== undefined) patch.notes = data.notes
    if (data.price_tier !== undefined) patch.price_tier = data.price_tier

    const { data: row, error } = await supabase
      .from('business_customers')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !row) throw new Error(error?.message ?? 'updateCustomer failed')
    return row as BusinessCustomer
  }

  // ---------------------------------------------------------------------------
  // B2B — Quotes (helpers)
  // ---------------------------------------------------------------------------

  private mapQuoteLine(raw: Record<string, unknown>): QuoteLine {
    const p = raw.products as { id: string; name: string; sku: string | null; price: number | string } | null
    return {
      id: raw.id as string,
      quote_id: raw.quote_id as string,
      product_id: raw.product_id as string | null,
      quantity: raw.quantity as number,
      description: raw.description as string | null,
      unit_list_price: raw.unit_list_price != null ? Number(raw.unit_list_price) : null,
      unit_quoted_price: raw.unit_quoted_price != null ? Number(raw.unit_quoted_price) : null,
      currency_code: (raw.currency_code as string) ?? 'USD',
      customer_note: raw.customer_note as string | null,
      sort_order: raw.sort_order as number,
      created_at: raw.created_at as string,
      product: p ? { id: p.id, name: p.name, sku: p.sku, price: Number(p.price) } : undefined,
    }
  }

  private mapQuote(raw: Record<string, unknown>, lines: QuoteLine[] = []): Quote {
    const customer = raw.business_customers as BusinessCustomer | null
    return {
      id: raw.id as string,
      quote_ref: raw.quote_ref as string,
      customer_id: raw.customer_id as string | null,
      anon_name: raw.anon_name as string | null,
      anon_email: raw.anon_email as string | null,
      anon_phone: raw.anon_phone as string | null,
      anon_company: raw.anon_company as string | null,
      status: raw.status as QuoteStatus,
      currency_code: (raw.currency_code as string) ?? 'USD',
      admin_notes: raw.admin_notes as string | null,
      valid_until: raw.valid_until as string | null,
      ip_hash: raw.ip_hash as string | null,
      created_at: raw.created_at as string,
      updated_at: raw.updated_at as string,
      customer: customer ?? undefined,
      lines,
    }
  }

  // ---------------------------------------------------------------------------
  // B2B — Quotes
  // ---------------------------------------------------------------------------

  async listQuotes(filter?: QuoteFilter): Promise<PaginatedResult<Quote>> {
    const supabase = await this.getClient()
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 50
    const start = (page - 1) * perPage

    let query = supabase
      .from('quotes')
      .select('*, business_customers(*)', { count: 'exact' })
      .range(start, start + perPage - 1)
      .order('created_at', { ascending: false })

    if (filter?.status) query = query.eq('status', filter.status)
    if (filter?.customer_id) query = query.eq('customer_id', filter.customer_id)
    if (filter?.search) {
      const q = `%${filter.search}%`
      query = query.or(`quote_ref.ilike.${q},anon_name.ilike.${q},anon_company.ilike.${q}`)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      data: (data ?? []).map((r: unknown) => this.mapQuote(r as Record<string, unknown>)),
      total: count ?? 0,
      page,
      per_page: perPage,
    }
  }

  async getQuote(id: string): Promise<Quote | null> {
    const supabase = await this.getClient()

    const [{ data: quoteData, error: qErr }, { data: linesData }] = await Promise.all([
      supabase
        .from('quotes')
        .select('*, business_customers(*), quote_events(*)')
        .eq('id', id)
        .single(),
      supabase
        .from('quote_lines')
        .select('*, products(id, name, sku, price)')
        .eq('quote_id', id)
        .order('sort_order', { ascending: true }),
    ])

    if (qErr || !quoteData) return null

    const lines = (linesData ?? []).map((l: unknown) => this.mapQuoteLine(l as Record<string, unknown>))
    const events = ((quoteData as Record<string, unknown>).quote_events ?? []) as Array<Record<string, unknown>>

    const quote = this.mapQuote(quoteData as Record<string, unknown>, lines)
    quote.events = events.map(e => ({
      id: e.id as string,
      quote_id: e.quote_id as string,
      admin_id: e.admin_id as string | null,
      event_type: e.event_type as import('./types').QuoteEventType,
      old_status: e.old_status as QuoteStatus | null,
      new_status: e.new_status as QuoteStatus | null,
      note: e.note as string | null,
      created_at: e.created_at as string,
    }))

    return quote
  }

  /**
   * Creates a quote with lines atomically via the create_quote_with_lines RPC.
   * Price snapshotting and line validation happen inside the PostgreSQL function.
   */
  async createQuote(data: CreateQuoteInput): Promise<Quote> {
    const supabase = await this.getClient()

    const { data: result, error } = await supabase.rpc('create_quote_with_lines', {
      p_anon_name:    data.anon_name,
      p_anon_email:   data.anon_email,
      p_anon_phone:   data.anon_phone ?? null,
      p_anon_company: data.anon_company ?? null,
      p_lines: data.lines.map(l => ({
        product_id:    l.product_id ?? null,
        quantity:      l.quantity,
        description:   l.description ?? null,
        customer_note: l.customer_note ?? null,
      })),
      p_ip_hash: data.ip_hash ?? null,
    })

    if (error) throw new Error(error.message)

    const { id } = result as { id: string; quote_ref: string }
    const quote = await this.getQuote(id)
    if (!quote) throw new Error('Quote created but getQuote returned null')
    return quote
  }

  /**
   * Updates quote status atomically with event recording via the
   * admin_update_quote_status RPC (enforces state machine + reopen rules).
   */
  async updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    note: string | null,
    adminId?: string,
  ): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase.rpc('admin_update_quote_status', {
      p_quote_id:   id,
      p_new_status: status,
      p_admin_id:   adminId ?? null,
      p_note:       note,
    })
    if (error) throw new Error(error.message)
  }

  async setQuoteLinePrices(
    quoteId: string,
    prices: Array<{ lineId: string; unitQuotedPrice: number | null }>,
  ): Promise<void> {
    const supabase = await this.getClient()
    for (const { lineId, unitQuotedPrice } of prices) {
      if (unitQuotedPrice !== null && unitQuotedPrice < 0) throw new Error('price_must_be_non_negative')
      const { error } = await supabase
        .from('quote_lines')
        .update({ unit_quoted_price: unitQuotedPrice })
        .eq('id', lineId)
        .eq('quote_id', quoteId)
      if (error) throw new Error(error.message)
    }
  }

  async addQuoteLine(
    quoteId: string,
    data: { product_id?: string | null; quantity: number; description?: string | null },
  ): Promise<QuoteLine> {
    const supabase = await this.getClient()

    // Snapshot list price if product_id provided
    let unitListPrice: number | null = null
    if (data.product_id) {
      const { data: p } = await supabase
        .from('products')
        .select('price')
        .eq('id', data.product_id)
        .single()
      if (p) unitListPrice = Number((p as { price: number | string }).price)
    }

    // Calculate next sort_order
    const { data: existing } = await supabase
      .from('quote_lines')
      .select('sort_order')
      .eq('quote_id', quoteId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxOrder = (existing as Array<{ sort_order: number }> | null)?.[0]?.sort_order ?? 0

    const { data: row, error } = await supabase
      .from('quote_lines')
      .insert({
        quote_id: quoteId,
        product_id: data.product_id ?? null,
        quantity: data.quantity,
        description: data.description ?? null,
        unit_list_price: unitListPrice,
        sort_order: maxOrder + 1,
      })
      .select('*, products(id, name, sku, price)')
      .single()

    if (error || !row) throw new Error(error?.message ?? 'addQuoteLine failed')
    return this.mapQuoteLine(row as Record<string, unknown>)
  }

  async removeQuoteLine(quoteId: string, lineId: string): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .from('quote_lines')
      .delete()
      .eq('id', lineId)
      .eq('quote_id', quoteId)
    if (error) throw new Error(error.message)
  }

  async linkCustomerToQuote(quoteId: string, customerId: string): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .from('quotes')
      .update({ customer_id: customerId })
      .eq('id', quoteId)
    if (error) throw new Error(error.message)
  }

  // ---------------------------------------------------------------------------
  // B2B — Analytics
  // ---------------------------------------------------------------------------

  async getQuoteStats(days = 30): Promise<QuoteStats> {
    const zero: QuoteStats = {
      total: 0, byStatus: {}, pending: 0, sent: 0, accepted: 0, rejected: 0, expired: 0,
      sentValue: 0, acceptedValue: 0, conversionRate: null, trend: [],
    }
    try {
      const supabase = await this.getClient()

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      // Aggregate counts per status
      const { data: statusRows } = await supabase
        .from('quotes')
        .select('status, created_at')
        .order('created_at', { ascending: false })

      const rows = (statusRows ?? []) as Array<{ status: string; created_at: string }>
      const byStatus: Record<string, number> = {}
      for (const r of rows) {
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
      }

      const total = rows.length
      const pending = (byStatus['pending'] ?? 0) + (byStatus['reviewing'] ?? 0)

      // Value calculations: sent and accepted quotes with priced lines
      const { data: valueRows } = await supabase
        .from('quote_lines')
        .select('quote_id, quantity, unit_quoted_price, quotes!inner(status)')
        .not('unit_quoted_price', 'is', null)
        .in('quotes.status', ['sent', 'accepted'])

      let sentValue = 0
      let acceptedValue = 0
      for (const vr of (valueRows ?? []) as Array<{
        quantity: number
        unit_quoted_price: number | string
        quotes: { status: string }
      }>) {
        const val = Number(vr.quantity) * Number(vr.unit_quoted_price)
        if (vr.quotes.status === 'sent') sentValue += val
        if (vr.quotes.status === 'accepted') acceptedValue += val
      }

      const denom = (byStatus['sent'] ?? 0) + (byStatus['accepted'] ?? 0) + (byStatus['rejected'] ?? 0)
      const conversionRate = denom > 0 ? (byStatus['accepted'] ?? 0) / denom : null

      // Trend
      const trend: Array<{ date: string; count: number }> = []
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().substring(0, 10)
        const count = rows.filter(r => r.created_at.substring(0, 10) === dateStr).length
        trend.push({ date: dateStr, count })
      }

      return {
        total,
        byStatus,
        pending,
        sent: byStatus['sent'] ?? 0,
        accepted: byStatus['accepted'] ?? 0,
        rejected: byStatus['rejected'] ?? 0,
        expired: byStatus['expired'] ?? 0,
        sentValue: Math.round(sentValue * 100) / 100,
        acceptedValue: Math.round(acceptedValue * 100) / 100,
        conversionRate,
        trend,
      }
    } catch {
      return zero
    }
  }
}
