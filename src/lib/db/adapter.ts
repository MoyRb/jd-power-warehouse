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
  QuoteEvent,
  CreateQuoteInput,
  UpdateQuoteLineInput,
  QuoteStats,
} from './types'

export interface DataAdapter {
  // Products
  listProducts(filter?: ProductFilter): Promise<PaginatedResult<Product>>
  getProduct(id: string): Promise<Product | null>
  createProduct(data: CreateProductInput): Promise<Product>
  updateProduct(id: string, data: UpdateProductInput): Promise<Product>
  setProductStatus(id: string, status: ProductStatus): Promise<Product>

  // Categories
  listCategories(): Promise<Category[]>
  createCategory(data: CreateCategoryInput): Promise<Category>
  updateCategory(id: string, data: UpdateCategoryInput): Promise<Category>

  // Inventory
  getInventory(productId: string): Promise<InventoryRecord | null>
  adjustInventory(
    productId: string,
    delta: number,
    reason: string,
  ): Promise<InventoryRecord>

  // Inquiries
  listInquiries(filter?: InquiryFilter): Promise<PaginatedResult<Inquiry>>
  createInquiry(data: CreateInquiryInput): Promise<Inquiry>
  updateInquiryStatus(id: string, status: InquiryStatus): Promise<void>

  // Settings
  listSettings(): Promise<Record<string, unknown>>
  getSetting(key: string): Promise<unknown>
  setSetting(key: string, value: unknown): Promise<void>

  // Images
  uploadImage(productId: string, file: ImageFile): Promise<ProductImage>
  deleteImage(imageId: string): Promise<void>
  reorderImages(productId: string, imageIds: string[]): Promise<void>
  updateImageAltText(imageId: string, productId: string, altText: string): Promise<void>

  // Analytics
  getProductStats(lowStockThreshold?: number): Promise<ProductStats>
  getCategoryStats(lowStockThreshold?: number): Promise<CategoryStat[]>
  getInquiryStats(days?: number): Promise<InquiryStats>
  getLowStockProducts(threshold?: number): Promise<LowStockProduct[]>

  // B2B — Business Customers
  listCustomers(filter?: CustomerFilter): Promise<PaginatedResult<BusinessCustomer>>
  getCustomer(id: string): Promise<BusinessCustomer | null>
  createCustomer(data: CreateCustomerInput): Promise<BusinessCustomer>
  updateCustomer(id: string, data: UpdateCustomerInput): Promise<BusinessCustomer>

  // B2B — Quotes
  listQuotes(filter?: QuoteFilter): Promise<PaginatedResult<Quote>>
  getQuote(id: string): Promise<Quote | null>
  createQuote(data: CreateQuoteInput): Promise<Quote>
  updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    note: string | null,
    adminId?: string,
  ): Promise<void>
  setQuoteLinePrices(
    quoteId: string,
    prices: Array<{ lineId: string; unitQuotedPrice: number | null }>,
  ): Promise<void>
  addQuoteLine(
    quoteId: string,
    data: { product_id?: string | null; quantity: number; description?: string | null },
  ): Promise<QuoteLine>
  removeQuoteLine(quoteId: string, lineId: string): Promise<void>
  linkCustomerToQuote(quoteId: string, customerId: string): Promise<void>

  // B2B — Analytics
  getQuoteStats(days?: number): Promise<QuoteStats>
}

// Re-export B2B types for convenience
export type {
  BusinessCustomer,
  CustomerFilter,
  CreateCustomerInput,
  UpdateCustomerInput,
  Quote,
  QuoteFilter,
  QuoteStatus,
  QuoteLine,
  QuoteEvent,
  CreateQuoteInput,
  UpdateQuoteLineInput,
  QuoteStats,
}
