import { db } from './db'
import type { ProductStats, CategoryStat, InquiryStats, LowStockProduct, QuoteStats } from './db'

export interface AdminAnalytics {
  products: ProductStats
  categories: CategoryStat[]
  inquiries: InquiryStats
  lowStock: LowStockProduct[]
  quotes: QuoteStats
  threshold: number
}

const ZERO_PRODUCTS: ProductStats = {
  total: 0, published: 0, draft: 0, archived: 0,
  totalCategories: 0, totalUnits: 0, outOfStock: 0, lowStock: 0,
  estimatedInventoryValue: 0,
}

const ZERO_INQUIRIES: InquiryStats = {
  total: 0, byType: {}, byStatus: {}, pending: 0, trend: [],
}

const ZERO_QUOTES: QuoteStats = {
  total: 0, byStatus: {}, pending: 0, sent: 0, accepted: 0,
  rejected: 0, expired: 0, sentValue: 0, acceptedValue: 0,
  conversionRate: null, trend: [],
}

export async function getAdminAnalytics(threshold = 5): Promise<AdminAnalytics> {
  const [products, categories, inquiries, lowStock, quotes] = await Promise.all([
    db.getProductStats(threshold).catch(() => ZERO_PRODUCTS),
    db.getCategoryStats(threshold).catch(() => []),
    db.getInquiryStats(30).catch(() => ZERO_INQUIRIES),
    db.getLowStockProducts(threshold).catch(() => []),
    db.getQuoteStats(30).catch(() => ZERO_QUOTES),
  ])

  return { products, categories, inquiries, lowStock, quotes, threshold }
}
