import { randomUUID } from 'crypto'
import { products as staticProducts } from '../../data/products'
import { categories as staticCategories } from '../../data/categories'
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
  QuoteEvent,
} from './types'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function now(): string {
  return new Date().toISOString()
}

// Fixed timestamp used only during seed() so module-level MockAdapter
// initialisation does not call new Date() during Next.js prerendering.
const SEED_DATE = '2024-01-01T00:00:00.000Z'

// State machine transitions (mirrors the PostgreSQL validate_quote_transition function)
function isValidQuoteTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  const allowed: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
    pending:   ['reviewing', 'rejected'],
    reviewing: ['sent', 'rejected'],
    sent:      ['accepted', 'rejected', 'expired'],
    expired:   ['reviewing'],
  }
  return (allowed[from] ?? []).includes(to)
}

let quoteRefSeq = 0
function nextQuoteRef(): string {
  quoteRefSeq += 1
  const year = new Date().getFullYear()
  return `QT-${year}-${String(quoteRefSeq).padStart(4, '0')}`
}

export class MockAdapter implements DataAdapter {
  private products: Map<string, Product>
  private categories: Map<string, Category>
  private inventory: Map<string, InventoryRecord>  // keyed by product_id
  private images: Map<string, ProductImage>
  private inquiries: Map<string, Inquiry>
  private settings: Map<string, unknown>
  // B2B
  private customers: Map<string, BusinessCustomer>
  private quotes: Map<string, Quote>
  private quoteLines: Map<string, QuoteLine>
  private quoteEvents: Map<string, QuoteEvent>

  constructor() {
    this.products = new Map()
    this.categories = new Map()
    this.inventory = new Map()
    this.images = new Map()
    this.inquiries = new Map()
    this.settings = new Map()
    this.customers = new Map()
    this.quotes = new Map()
    this.quoteLines = new Map()
    this.quoteEvents = new Map()

    this.seed()
  }

  private seed(): void {
    // Seed categories from src/data/categories.ts
    // cat.slug is the ProductCategory value (e.g. 'Tools', 'Outdoor')
    // cat.name is the display name (e.g. 'Tools & Construction Supplies')
    // Products are matched via p.category === cat.slug
    const categorySlugToId = new Map<string, string>()
    staticCategories.forEach((cat, index) => {
      const id = randomUUID()
      categorySlugToId.set(cat.slug, id)
      const dbSlug = cat.slug.toLowerCase().replace(/\s+/g, '-')
      const category: Category = {
        id,
        name: cat.slug, // use the short name (Tools, Outdoor, etc.) as canonical name
        slug: dbSlug,
        sort_order: index + 1,
        created_at: SEED_DATE,
      }
      this.categories.set(id, category)
    })

    // Seed products from src/data/products.ts
    staticProducts.forEach((p) => {
      const id = randomUUID()
      const categoryId = categorySlugToId.get(p.category) ?? null
      const product: Product = {
        id,
        sku: null,
        name: p.name,
        description: p.description,
        price: p.price,
        original_price: p.originalPrice ?? null,
        category_id: categoryId,
        status: 'published',
        badge: p.badge ?? null,
        created_at: SEED_DATE,
        updated_at: SEED_DATE,
        quantity: 10,
      }
      this.products.set(id, product)

      // Inventory
      const invId = randomUUID()
      this.inventory.set(id, {
        id: invId,
        product_id: id,
        quantity: 10,
        updated_at: SEED_DATE,
      })

      // Images
      if (p.image) {
        const imgId = randomUUID()
        const img: ProductImage = {
          id: imgId,
          product_id: id,
          storage_path: p.image,
          alt_text: p.name,
          sort_order: 0,
        }
        this.images.set(imgId, img)
      }
    })

    // Seed default settings
    const defaults: Record<string, unknown> = {
      store_name: 'JD Power Warehouse',
      announcement_bar_text:
        'FREE LOCAL PICKUP — Plainfield & Homer Glen, IL — Open Daily 6AM-10PM — WhatsApp: (815) 555-0123',
      contact_phone: '+1 (815) 555-0123',
      contact_email: 'info@jdpowerwarehouse.com',
      business_hours: 'Daily 6am–10pm',
      whatsapp_number: '18155550123',
    }
    for (const [k, v] of Object.entries(defaults)) {
      this.settings.set(k, v)
    }

    this.seedB2B()
  }

  // ---------------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------------

  async listProducts(filter?: ProductFilter): Promise<PaginatedResult<Product>> {
    let items = Array.from(this.products.values())

    if (filter?.status !== undefined) {
      items = items.filter((p) => p.status === filter.status)
    }

    if (filter?.category_id) {
      items = items.filter((p) => p.category_id === filter.category_id)
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase()
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      )
    }

    const total = items.length
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 100
    const start = (page - 1) * perPage
    const data = items.slice(start, start + perPage).map((p) => ({
      ...p,
      quantity: this.inventory.get(p.id)?.quantity ?? 0,
      images: Array.from(this.images.values())
        .filter((img) => img.product_id === p.id)
        .sort((a, b) => a.sort_order - b.sort_order),
      category: p.category_id ? this.categories.get(p.category_id) : undefined,
    }))

    return { data, total, page, per_page: perPage }
  }

  async getProduct(id: string): Promise<Product | null> {
    const p = this.products.get(id)
    if (!p) return null
    return {
      ...p,
      quantity: this.inventory.get(id)?.quantity ?? 0,
      images: Array.from(this.images.values())
        .filter((img) => img.product_id === id)
        .sort((a, b) => a.sort_order - b.sort_order),
      category: p.category_id ? this.categories.get(p.category_id) : undefined,
    }
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    const id = randomUUID()
    const ts = now()
    const product: Product = {
      id,
      sku: data.sku ?? null,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      original_price: data.original_price ?? null,
      category_id: data.category_id ?? null,
      status: data.status,
      badge: data.badge ?? null,
      created_at: ts,
      updated_at: ts,
    }
    this.products.set(id, product)
    // Create inventory record
    this.inventory.set(id, {
      id: randomUUID(),
      product_id: id,
      quantity: 0,
      updated_at: ts,
    })
    return { ...product, quantity: 0 }
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    const existing = this.products.get(id)
    if (!existing) throw new Error(`Product not found: ${id}`)
    const updated: Product = {
      ...existing,
      ...data,
      id,
      updated_at: now(),
    }
    this.products.set(id, updated)
    return { ...updated, quantity: this.inventory.get(id)?.quantity ?? 0 }
  }

  async setProductStatus(id: string, status: ProductStatus): Promise<Product> {
    return this.updateProduct(id, { status })
  }

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort(
      (a, b) => a.sort_order - b.sort_order,
    )
  }

  async createCategory(data: CreateCategoryInput): Promise<Category> {
    const id = randomUUID()
    const category: Category = {
      id,
      name: data.name,
      slug: data.slug,
      sort_order: data.sort_order ?? 0,
      created_at: now(),
    }
    this.categories.set(id, category)
    return category
  }

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    const existing = this.categories.get(id)
    if (!existing) throw new Error(`Category not found: ${id}`)
    const updated: Category = { ...existing, ...data, id }
    this.categories.set(id, updated)
    return updated
  }

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  async getInventory(productId: string): Promise<InventoryRecord | null> {
    return this.inventory.get(productId) ?? null
  }

  async adjustInventory(
    productId: string,
    delta: number,
    reason: string,
  ): Promise<InventoryRecord> {
    const existing = this.inventory.get(productId)
    const currentQty = existing?.quantity ?? 0
    const newQty = Math.max(0, currentQty + delta)
    const record: InventoryRecord = {
      id: existing?.id ?? randomUUID(),
      product_id: productId,
      quantity: newQty,
      updated_at: now(),
    }
    this.inventory.set(productId, record)
    // Also update the product's quantity field
    const product = this.products.get(productId)
    if (product) {
      this.products.set(productId, { ...product, quantity: newQty })
    }
    void reason // stored in audit log in SupabaseAdapter; mock doesn't persist movements
    return record
  }

  // ---------------------------------------------------------------------------
  // Inquiries
  // ---------------------------------------------------------------------------

  async listInquiries(filter?: InquiryFilter): Promise<PaginatedResult<Inquiry>> {
    let items = Array.from(this.inquiries.values())

    if (filter?.status) items = items.filter((i) => i.status === filter.status)
    if (filter?.type) items = items.filter((i) => i.type === filter.type)

    items.sort((a, b) => b.created_at.localeCompare(a.created_at))

    const total = items.length
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 50
    const start = (page - 1) * perPage

    return {
      data: items.slice(start, start + perPage),
      total,
      page,
      per_page: perPage,
    }
  }

  async createInquiry(data: CreateInquiryInput): Promise<Inquiry> {
    const id = randomUUID()
    const inquiry: Inquiry = {
      id,
      type: data.type,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      message: data.message,
      item_name: data.item_name ?? null,
      item_description: data.item_description ?? null,
      item_condition: data.item_condition ?? null,
      asking_price: data.asking_price ?? null,
      status: 'new',
      created_at: now(),
    }
    this.inquiries.set(id, inquiry)
    return inquiry
  }

  async updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
    const existing = this.inquiries.get(id)
    if (!existing) throw new Error(`Inquiry not found: ${id}`)
    this.inquiries.set(id, { ...existing, status })
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async listSettings(): Promise<Record<string, unknown>> {
    return Object.fromEntries(this.settings.entries())
  }

  async getSetting(key: string): Promise<unknown> {
    return this.settings.get(key) ?? null
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    this.settings.set(key, value)
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
    const id = randomUUID()
    const img: ProductImage = {
      id,
      product_id: productId,
      storage_path: `mock://product-images/${productId}/${id}`,
      alt_text: file.name,
      sort_order: Array.from(this.images.values()).filter(
        (i) => i.product_id === productId,
      ).length,
    }
    this.images.set(id, img)
    return img
  }

  async deleteImage(imageId: string): Promise<void> {
    this.images.delete(imageId)
  }

  async reorderImages(productId: string, imageIds: string[]): Promise<void> {
    imageIds.forEach((imgId, index) => {
      const img = this.images.get(imgId)
      if (img && img.product_id === productId) {
        this.images.set(imgId, { ...img, sort_order: index })
      }
    })
  }

  async updateImageAltText(imageId: string, productId: string, altText: string): Promise<void> {
    const img = this.images.get(imageId)
    if (!img || img.product_id !== productId) {
      throw new Error('Image not found')
    }
    this.images.set(imageId, { ...img, alt_text: altText })
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  async getProductStats(lowStockThreshold = 5): Promise<ProductStats> {
    const allProducts = Array.from(this.products.values())
    const total = allProducts.length
    const published = allProducts.filter((p) => p.status === 'published').length
    const draft = allProducts.filter((p) => p.status === 'draft').length
    const archived = allProducts.filter((p) => p.status === 'archived').length
    const totalCategories = this.categories.size

    let totalUnits = 0
    let outOfStock = 0
    let lowStock = 0
    let estimatedInventoryValue = 0

    for (const product of allProducts) {
      if (product.status === 'archived') continue
      const qty = this.inventory.get(product.id)?.quantity ?? 0
      totalUnits += qty
      estimatedInventoryValue += qty * product.price
      if (qty === 0) {
        outOfStock++
      } else if (lowStockThreshold > 0 && qty <= lowStockThreshold) {
        lowStock++
      }
    }

    return {
      total,
      published,
      draft,
      archived,
      totalCategories,
      totalUnits,
      outOfStock,
      lowStock,
      estimatedInventoryValue,
    }
  }

  async getCategoryStats(lowStockThreshold = 5): Promise<CategoryStat[]> {
    const result: CategoryStat[] = []

    for (const category of this.categories.values()) {
      const categoryProducts = Array.from(this.products.values()).filter(
        (p) => p.category_id === category.id,
      )

      const productCount = categoryProducts.length
      const publishedCount = categoryProducts.filter((p) => p.status === 'published').length

      let totalUnits = 0
      let outOfStock = 0
      let lowStock = 0
      let estimatedValue = 0

      for (const product of categoryProducts) {
        if (product.status === 'archived') continue
        const qty = this.inventory.get(product.id)?.quantity ?? 0
        totalUnits += qty
        estimatedValue += qty * product.price
        if (qty === 0) {
          outOfStock++
        } else if (lowStockThreshold > 0 && qty <= lowStockThreshold) {
          lowStock++
        }
      }

      result.push({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount,
        publishedCount,
        totalUnits,
        outOfStock,
        lowStock,
        estimatedValue,
      })
    }

    return result.sort((a, b) => b.productCount - a.productCount)
  }

  async getInquiryStats(days = 30): Promise<InquiryStats> {
    const allInquiries = Array.from(this.inquiries.values())
    const total = allInquiries.length

    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}

    for (const inq of allInquiries) {
      byType[inq.type] = (byType[inq.type] ?? 0) + 1
      byStatus[inq.status] = (byStatus[inq.status] ?? 0) + 1
    }

    const pending = (byStatus['new'] ?? 0) + (byStatus['read'] ?? 0)

    // Build trend: last `days` days, count inquiries per date
    const trend: { date: string; count: number }[] = []
    if (total === 0) {
      return { total, byType, byStatus, pending, trend }
    }

    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().substring(0, 10)
      const count = allInquiries.filter(
        (inq) => inq.created_at.substring(0, 10) === dateStr,
      ).length
      trend.push({ date: dateStr, count })
    }

    return { total, byType, byStatus, pending, trend }
  }

  async getLowStockProducts(threshold = 5): Promise<LowStockProduct[]> {
    const result: LowStockProduct[] = []

    for (const product of this.products.values()) {
      if (product.status === 'archived') continue
      const qty = this.inventory.get(product.id)?.quantity ?? 0
      if (qty <= threshold) {
        const category = product.category_id
          ? this.categories.get(product.category_id)
          : null
        result.push({
          id: product.id,
          name: product.name,
          categoryName: category?.name ?? null,
          quantity: qty,
          status: product.status,
        })
      }
    }

    return result.sort((a, b) => a.quantity - b.quantity)
  }

  // ---------------------------------------------------------------------------
  // B2B seed helpers (called from seed())
  // ---------------------------------------------------------------------------

  private seedB2B(): void {
    // Seed a couple of demo customers
    const c1Id = randomUUID()
    const c2Id = randomUUID()
    this.customers.set(c1Id, {
      id: c1Id, company_name: 'Hernández Construction LLC', contact_name: 'Miguel Hernández',
      email: 'miguel@hernandez-const.com', phone: '+1 815 555 0200',
      address: '123 Main St, Plainfield IL', country: 'US',
      tax_id: '82-4521000', tax_id_type: 'EIN',
      price_tier: 'preferred', notes: 'Regular B2B customer',
      created_at: SEED_DATE, updated_at: SEED_DATE,
    })
    this.customers.set(c2Id, {
      id: c2Id, company_name: 'ABC Hardware Supply', contact_name: 'Sarah Johnson',
      email: 'sarah@abchardware.com', phone: null,
      address: null, country: 'US',
      tax_id: null, tax_id_type: null,
      price_tier: null, notes: null,
      created_at: SEED_DATE, updated_at: SEED_DATE,
    })

    // Seed demo quotes in different states
    const publishedProducts = Array.from(this.products.values()).filter(p => p.status === 'published')
    if (publishedProducts.length === 0) return

    const p1 = publishedProducts[0]
    const p2 = publishedProducts.length > 1 ? publishedProducts[1] : publishedProducts[0]

    // Quote 1: sent — catalog + free-form (mixed)
    const q1Id = randomUUID()
    const q1Ref = nextQuoteRef()
    this.quotes.set(q1Id, {
      id: q1Id, quote_ref: q1Ref, customer_id: c1Id,
      anon_name: 'Miguel Hernández', anon_email: 'miguel@hernandez-const.com',
      anon_phone: '+1 815 555 0200', anon_company: 'Hernández Construction LLC',
      status: 'sent', currency_code: 'USD',
      admin_notes: 'Reviewed, prices set', valid_until: '2026-12-31',
      ip_hash: null, created_at: SEED_DATE, updated_at: SEED_DATE,
    })
    const ql1aId = randomUUID()
    this.quoteLines.set(ql1aId, {
      id: ql1aId, quote_id: q1Id, product_id: p1.id,
      quantity: 10, description: null,
      unit_list_price: p1.price, unit_quoted_price: Number((p1.price * 0.9).toFixed(2)),
      currency_code: 'USD', customer_note: null, sort_order: 1, created_at: SEED_DATE,
    })
    const ql1bId = randomUUID()
    this.quoteLines.set(ql1bId, {
      id: ql1bId, quote_id: q1Id, product_id: null,
      quantity: 5, description: 'Custom heavy-duty extension cords 50ft',
      unit_list_price: null, unit_quoted_price: 29.99,
      currency_code: 'USD', customer_note: 'Need orange color', sort_order: 2, created_at: SEED_DATE,
    })
    const qe1Id = randomUUID()
    this.quoteEvents.set(qe1Id, {
      id: qe1Id, quote_id: q1Id, admin_id: null,
      event_type: 'status_change', old_status: 'reviewing', new_status: 'sent',
      note: 'Prices set and quote sent to client', created_at: SEED_DATE,
    })

    // Quote 2: pending — free-form only
    const q2Id = randomUUID()
    const q2Ref = nextQuoteRef()
    this.quotes.set(q2Id, {
      id: q2Id, quote_ref: q2Ref, customer_id: null,
      anon_name: 'Sarah Johnson', anon_email: 'sarah@abchardware.com',
      anon_phone: null, anon_company: 'ABC Hardware Supply',
      status: 'pending', currency_code: 'USD',
      admin_notes: null, valid_until: null,
      ip_hash: null, created_at: SEED_DATE, updated_at: SEED_DATE,
    })
    const ql2Id = randomUUID()
    this.quoteLines.set(ql2Id, {
      id: ql2Id, quote_id: q2Id, product_id: p2.id,
      quantity: 25, description: null,
      unit_list_price: p2.price, unit_quoted_price: null,
      currency_code: 'USD', customer_note: 'Bulk order', sort_order: 1, created_at: SEED_DATE,
    })

    // Quote 3: accepted
    const q3Id = randomUUID()
    const q3Ref = nextQuoteRef()
    this.quotes.set(q3Id, {
      id: q3Id, quote_ref: q3Ref, customer_id: c2Id,
      anon_name: 'Sarah Johnson', anon_email: 'sarah@abchardware.com',
      anon_phone: null, anon_company: 'ABC Hardware Supply',
      status: 'accepted', currency_code: 'USD',
      admin_notes: 'Accepted by client on 2026-11-01',
      valid_until: '2026-11-30',
      ip_hash: null, created_at: SEED_DATE, updated_at: SEED_DATE,
    })
    const ql3Id = randomUUID()
    this.quoteLines.set(ql3Id, {
      id: ql3Id, quote_id: q3Id, product_id: p1.id,
      quantity: 50, description: null,
      unit_list_price: p1.price, unit_quoted_price: Number((p1.price * 0.85).toFixed(2)),
      currency_code: 'USD', customer_note: null, sort_order: 1, created_at: SEED_DATE,
    })
  }

  // ---------------------------------------------------------------------------
  // B2B — Business Customers
  // ---------------------------------------------------------------------------

  async listCustomers(filter?: CustomerFilter): Promise<PaginatedResult<BusinessCustomer>> {
    let items = Array.from(this.customers.values())

    if (filter?.search) {
      const q = filter.search.toLowerCase()
      items = items.filter(
        c =>
          c.company_name.toLowerCase().includes(q) ||
          c.contact_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      )
    }

    const total = items.length
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 100
    const data = items.slice((page - 1) * perPage, page * perPage)
    return { data, total, page, per_page: perPage }
  }

  async getCustomer(id: string): Promise<BusinessCustomer | null> {
    return this.customers.get(id) ?? null
  }

  async createCustomer(data: CreateCustomerInput): Promise<BusinessCustomer> {
    const customer: BusinessCustomer = {
      id: randomUUID(),
      company_name: data.company_name,
      contact_name: data.contact_name,
      email: data.email,
      phone: data.phone ?? null,
      address: data.address ?? null,
      country: data.country ?? null,
      tax_id: data.tax_id ?? null,
      tax_id_type: data.tax_id_type ?? null,
      price_tier: null,
      notes: data.notes ?? null,
      created_at: now(),
      updated_at: now(),
    }
    this.customers.set(customer.id, customer)
    return customer
  }

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<BusinessCustomer> {
    const existing = this.customers.get(id)
    if (!existing) throw new Error('Customer not found')
    const updated: BusinessCustomer = {
      ...existing,
      ...(data.company_name !== undefined && { company_name: data.company_name }),
      ...(data.contact_name !== undefined && { contact_name: data.contact_name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone ?? null }),
      ...(data.address !== undefined && { address: data.address ?? null }),
      ...(data.country !== undefined && { country: data.country ?? null }),
      ...(data.tax_id !== undefined && { tax_id: data.tax_id ?? null }),
      ...(data.tax_id_type !== undefined && { tax_id_type: data.tax_id_type ?? null }),
      ...('price_tier' in data && { price_tier: (data as { price_tier?: string | null }).price_tier ?? null }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
      updated_at: now(),
    }
    this.customers.set(id, updated)
    return updated
  }

  // ---------------------------------------------------------------------------
  // B2B — Quotes
  // ---------------------------------------------------------------------------

  private buildQuote(q: Quote): Quote {
    const lines = Array.from(this.quoteLines.values())
      .filter(l => l.quote_id === q.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(l => ({
        ...l,
        product: l.product_id ? (() => {
          const p = this.products.get(l.product_id!)
          return p ? { id: p.id, name: p.name, sku: p.sku, price: p.price } : undefined
        })() : undefined,
      }))

    const events = Array.from(this.quoteEvents.values())
      .filter(e => e.quote_id === q.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))

    const customer = q.customer_id ? this.customers.get(q.customer_id) : undefined

    return { ...q, lines, events, customer }
  }

  async listQuotes(filter?: QuoteFilter): Promise<PaginatedResult<Quote>> {
    let items = Array.from(this.quotes.values())

    if (filter?.status) {
      items = items.filter(q => q.status === filter.status)
    }
    if (filter?.customer_id) {
      items = items.filter(q => q.customer_id === filter.customer_id)
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase()
      items = items.filter(q =>
        q.quote_ref.toLowerCase().includes(s) ||
        (q.anon_name ?? '').toLowerCase().includes(s) ||
        (q.anon_company ?? '').toLowerCase().includes(s),
      )
    }

    items = items.sort((a, b) => b.created_at.localeCompare(a.created_at))

    const total = items.length
    const page = filter?.page ?? 1
    const perPage = filter?.per_page ?? 50
    const data = items.slice((page - 1) * perPage, page * perPage).map(q => this.buildQuote(q))
    return { data, total, page, per_page: perPage }
  }

  async getQuote(id: string): Promise<Quote | null> {
    const q = this.quotes.get(id)
    if (!q) return null
    return this.buildQuote(q)
  }

  async createQuote(data: CreateQuoteInput): Promise<Quote> {
    if (!data.lines || data.lines.length === 0) {
      throw new Error('lines_required')
    }
    if (data.lines.length > 20) {
      throw new Error('too_many_lines')
    }

    const id = randomUUID()
    const ref = nextQuoteRef()
    const ts = now()

    const quote: Quote = {
      id, quote_ref: ref,
      customer_id: null,
      anon_name: data.anon_name,
      anon_email: data.anon_email,
      anon_phone: data.anon_phone ?? null,
      anon_company: data.anon_company ?? null,
      status: 'pending',
      currency_code: 'USD',
      admin_notes: null,
      valid_until: null,
      ip_hash: data.ip_hash ?? null,
      created_at: ts,
      updated_at: ts,
    }
    this.quotes.set(id, quote)

    data.lines.forEach((line, idx) => {
      const hasProduct = line.product_id != null && line.product_id !== ''
      const hasDesc = line.description != null && line.description.trim() !== ''

      if (!hasProduct && !hasDesc) {
        throw new Error('line_requires_product_or_description')
      }
      if (line.quantity <= 0) {
        throw new Error('quantity_must_be_positive')
      }

      let unitListPrice: number | null = null
      let resolvedProductId: string | null = null

      if (hasProduct) {
        const product = this.products.get(line.product_id!)
        if (!product || product.status !== 'published') {
          throw new Error(`product_not_found: ${line.product_id}`)
        }
        unitListPrice = product.price
        resolvedProductId = line.product_id!
      }

      const lineId = randomUUID()
      this.quoteLines.set(lineId, {
        id: lineId,
        quote_id: id,
        product_id: resolvedProductId,
        quantity: line.quantity,
        description: line.description ?? null,
        unit_list_price: unitListPrice,
        unit_quoted_price: null,
        currency_code: 'USD',
        customer_note: line.customer_note ?? null,
        sort_order: idx + 1,
        created_at: ts,
      })
    })

    return this.buildQuote(quote)
  }

  async updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    note: string | null,
    adminId?: string,
  ): Promise<void> {
    const q = this.quotes.get(id)
    if (!q) throw new Error('quote_not_found')

    if (!isValidQuoteTransition(q.status, status)) {
      throw new Error(`invalid_transition: ${q.status} -> ${status}`)
    }

    const isReopen = q.status === 'expired' && status === 'reviewing'
    if (isReopen && (!note || note.trim() === '')) {
      throw new Error('reopen_requires_note')
    }

    const eventType = isReopen ? 'reopened' : 'status_change'

    const updated: Quote = { ...q, status, updated_at: now() }
    this.quotes.set(id, updated)

    const eventId = randomUUID()
    this.quoteEvents.set(eventId, {
      id: eventId,
      quote_id: id,
      admin_id: adminId ?? null,
      event_type: eventType,
      old_status: q.status,
      new_status: status,
      note: note ?? null,
      created_at: now(),
    })
  }

  async setQuoteLinePrices(
    quoteId: string,
    prices: Array<{ lineId: string; unitQuotedPrice: number | null }>,
  ): Promise<void> {
    for (const { lineId, unitQuotedPrice } of prices) {
      if (unitQuotedPrice !== null && unitQuotedPrice < 0) throw new Error('price_must_be_non_negative')
      const line = this.quoteLines.get(lineId)
      if (!line || line.quote_id !== quoteId) throw new Error(`line_not_found: ${lineId}`)
      this.quoteLines.set(lineId, { ...line, unit_quoted_price: unitQuotedPrice })
    }
    const q = this.quotes.get(quoteId)
    if (q) this.quotes.set(quoteId, { ...q, updated_at: now() })
  }

  async addQuoteLine(
    quoteId: string,
    data: { product_id?: string | null; quantity: number; description?: string | null },
  ): Promise<QuoteLine> {
    if (!this.quotes.has(quoteId)) throw new Error('quote_not_found')

    const hasProduct = data.product_id != null && data.product_id !== ''
    const hasDesc = data.description != null && (data.description ?? '').trim() !== ''
    if (!hasProduct && !hasDesc) throw new Error('line_requires_product_or_description')
    if (data.quantity <= 0) throw new Error('quantity_must_be_positive')

    let unitListPrice: number | null = null
    let resolvedProductId: string | null = null

    if (hasProduct) {
      const p = this.products.get(data.product_id!)
      if (!p || p.status !== 'published') throw new Error('product_not_found')
      unitListPrice = p.price
      resolvedProductId = data.product_id!
    }

    const existingLines = Array.from(this.quoteLines.values()).filter(l => l.quote_id === quoteId)
    const maxOrder = existingLines.reduce((m, l) => Math.max(m, l.sort_order), 0)

    const lineId = randomUUID()
    const line: QuoteLine = {
      id: lineId, quote_id: quoteId,
      product_id: resolvedProductId,
      quantity: data.quantity,
      description: data.description ?? null,
      unit_list_price: unitListPrice,
      unit_quoted_price: null,
      currency_code: 'USD',
      customer_note: null,
      sort_order: maxOrder + 1,
      created_at: now(),
    }
    this.quoteLines.set(lineId, line)

    const eventId = randomUUID()
    this.quoteEvents.set(eventId, {
      id: eventId, quote_id: quoteId, admin_id: null,
      event_type: 'line_added', old_status: null, new_status: null,
      note: `Added line: ${data.description ?? resolvedProductId}`,
      created_at: now(),
    })

    return line
  }

  async removeQuoteLine(quoteId: string, lineId: string): Promise<void> {
    const line = this.quoteLines.get(lineId)
    if (!line || line.quote_id !== quoteId) throw new Error('line_not_found')
    this.quoteLines.delete(lineId)

    const eventId = randomUUID()
    this.quoteEvents.set(eventId, {
      id: eventId, quote_id: quoteId, admin_id: null,
      event_type: 'line_removed', old_status: null, new_status: null,
      note: null, created_at: now(),
    })
  }

  async linkCustomerToQuote(quoteId: string, customerId: string): Promise<void> {
    const q = this.quotes.get(quoteId)
    if (!q) throw new Error('quote_not_found')
    if (!this.customers.has(customerId)) throw new Error('customer_not_found')
    this.quotes.set(quoteId, { ...q, customer_id: customerId, updated_at: now() })
  }

  // ---------------------------------------------------------------------------
  // B2B — Analytics
  // ---------------------------------------------------------------------------

  async getQuoteStats(days = 30): Promise<QuoteStats> {
    const allQuotes = Array.from(this.quotes.values())
    const byStatus: Record<string, number> = {}

    for (const q of allQuotes) {
      byStatus[q.status] = (byStatus[q.status] ?? 0) + 1
    }

    const pending = (byStatus['pending'] ?? 0) + (byStatus['reviewing'] ?? 0)

    // Compute values: sum(qty * unit_quoted_price) for sent and accepted quotes
    const linesMap = this.quoteLines

    const calcQuoteValue = (quoteId: string): number =>
      Array.from(linesMap.values())
        .filter((l: QuoteLine) => l.quote_id === quoteId && l.unit_quoted_price != null)
        .reduce((sum: number, l: QuoteLine) => sum + l.quantity * (l.unit_quoted_price ?? 0), 0)

    let sentValue = 0
    let acceptedValue = 0
    for (const q of allQuotes) {
      const val = calcQuoteValue(q.id)
      if (q.status === 'sent') sentValue += val
      if (q.status === 'accepted') acceptedValue += val
    }

    const denom = (byStatus['sent'] ?? 0) + (byStatus['accepted'] ?? 0) + (byStatus['rejected'] ?? 0)
    const conversionRate = denom > 0 ? (byStatus['accepted'] ?? 0) / denom : null

    // Build trend
    const trend: Array<{ date: string; count: number }> = []
    if (allQuotes.length > 0) {
      const refDate = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(refDate)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().substring(0, 10)
        const count = allQuotes.filter(q => q.created_at.substring(0, 10) === dateStr).length
        trend.push({ date: dateStr, count })
      }
    }

    return {
      total: allQuotes.length,
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
  }
}
