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
} from './types'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function now(): string {
  return new Date().toISOString()
}

export class MockAdapter implements DataAdapter {
  private products: Map<string, Product>
  private categories: Map<string, Category>
  private inventory: Map<string, InventoryRecord>  // keyed by product_id
  private images: Map<string, ProductImage>
  private inquiries: Map<string, Inquiry>
  private settings: Map<string, unknown>

  constructor() {
    this.products = new Map()
    this.categories = new Map()
    this.inventory = new Map()
    this.images = new Map()
    this.inquiries = new Map()
    this.settings = new Map()

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
        created_at: now(),
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
        created_at: now(),
        updated_at: now(),
        quantity: 10,
      }
      this.products.set(id, product)

      // Inventory
      const invId = randomUUID()
      this.inventory.set(id, {
        id: invId,
        product_id: id,
        quantity: 10,
        updated_at: now(),
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
      email: data.email,
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
}
