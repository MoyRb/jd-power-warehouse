# Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub admin dashboard with a full B2B analytics center showing real PostgreSQL-backed KPIs, category breakdown, inquiry trends, and critical inventory — all computed server-side.

**Architecture:** Four new analytics methods added to `DataAdapter` (and both adapters). An `AnalyticsService` module bundles all analytics into one server call. A new dashboard page replaces the existing one using Server Components for all computation. SVG/CSS inline charts, no new libraries. Low-stock threshold stored in `store_settings` (key `low_stock_threshold`, default `5`).

**Tech Stack:** Next.js 16 App Router Server Components, TypeScript strict, Tailwind CSS v4, `@supabase/ssr`, Vitest.

**Spec:** User spec delivered in conversation (Corte 3C analytics, 2026-11-09).

## Global Constraints

- No new npm dependencies — charts via inline SVG and CSS only.
- All data computation in Server Components — never send raw catalogs to the browser for calculation.
- `requireAdmin()` must be called before any analytics query.
- DataAdapter interface additions must be implemented in BOTH MockAdapter and SupabaseAdapter.
- `estimatedInventoryValue` labeled as "Potential Sale Value" in UI — never "revenue" or "profit".
- Low-stock threshold default: `5` units (configurable via `store_settings.low_stock_threshold`).
- Archived products excluded from inventory value and published counts.
- Empty states, loading errors, and zero-data must render gracefully (never throw to the page).
- Local migration file created but NOT pushed to remote DB.
- Language: UI labels in English (code identifiers), explanations in Spanish.

## Review Focus

1. **Archived products in inventory value** — `estimatedInventoryValue` must exclude archived/draft products; test that archiving a product removes it from the value total.
   → Added to Task 1 MockAdapter test.

2. **Category with zero products** — `getCategoryStats()` must return an entry for every category, even ones with no products (LEFT JOIN semantics); value and counts should be `0`.
   → Added to Task 1 MockAdapter test.

3. **Empty inquiries DB (0 rows)** — `getInquiryStats()` must return zeros and an empty trend array, not throw; test with an empty adapter.
   → Added to Task 1 MockAdapter test.

4. **Low-stock threshold = 0** — a threshold of 0 means "out of stock only"; `lowStock` count should be 0 and `outOfStock` correct; test this boundary.
   → Added to Task 1 MockAdapter test.

5. **Unauthorized user accessing analytics** — a request without admin session must redirect to `/admin/login`, not leak any metric; enforced by `requireAdmin()` in the page; verified by existing E2E auth test suite (no new test needed — existing `admin-auth.spec.ts` covers this).

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/db/types.ts` | Modify | Add `ProductStats`, `CategoryStat`, `InquiryDayCount`, `InquiryStats`, `LowStockProduct` types |
| `src/lib/db/adapter.ts` | Modify | Add 4 analytics methods to `DataAdapter` interface |
| `src/lib/db/mock-adapter.ts` | Modify | Implement analytics methods from in-memory data |
| `src/lib/db/supabase-adapter.ts` | Modify | Implement analytics methods using Supabase JS queries |
| `src/lib/analytics.ts` | Create | `getAdminAnalytics()` — bundles all analytics into one parallel fetch |
| `src/components/admin/BarChart.tsx` | Create | CSS percentage horizontal bar chart (no deps) |
| `src/components/admin/Sparkline.tsx` | Create | SVG inline line chart for 30-day trend (no deps) |
| `src/components/admin/KpiGrid.tsx` | Create | Responsive KPI card grid (wraps StatsCard) |
| `src/app/admin/(protected)/page.tsx` | Modify | Full analytics dashboard with all sections |
| `supabase/migrations/20261109000000_analytics_indexes.sql` | Create | Local-only performance indexes (not pushed to remote) |
| `tests/unit/analytics.test.ts` | Create | Unit tests for all analytics methods on MockAdapter |
| `tests/integration/analytics-integration.test.ts` | Create | Integration smoke tests for SupabaseAdapter analytics |

---

## Task 1: Analytics types + DataAdapter + both adapter implementations

**Files:**
- Modify: `src/lib/db/types.ts`
- Modify: `src/lib/db/adapter.ts`
- Modify: `src/lib/db/mock-adapter.ts`
- Modify: `src/lib/db/supabase-adapter.ts`
- Test: `tests/unit/analytics.test.ts`

**Interfaces:**
- Produces:
  - `ProductStats` — `{ total, published, draft, archived, totalCategories, totalUnits, outOfStock, lowStock, estimatedInventoryValue }`
  - `CategoryStat` — `{ id, name, slug, productCount, publishedCount, totalUnits, outOfStock, lowStock, estimatedValue }`
  - `InquiryDayCount` — `{ date: string, count: number }` (date = "YYYY-MM-DD")
  - `InquiryStats` — `{ total, byType: Record<InquiryType,number>, byStatus: Record<InquiryStatus,number>, pending, trend: InquiryDayCount[] }`
  - `LowStockProduct` — `{ id, name, categoryName: string|null, quantity, status }`
  - `DataAdapter.getProductStats(lowStockThreshold?: number): Promise<ProductStats>`
  - `DataAdapter.getCategoryStats(lowStockThreshold?: number): Promise<CategoryStat[]>`
  - `DataAdapter.getInquiryStats(days?: number): Promise<InquiryStats>`
  - `DataAdapter.getLowStockProducts(threshold?: number): Promise<LowStockProduct[]>`

- [ ] **Step 1: Write failing tests for MockAdapter analytics**

  File: `tests/unit/analytics.test.ts`

  ```ts
  describe('MockAdapter analytics', () => {
    it('getProductStats returns correct counts for seeded data', ...)
    // expects total=16, published=16, draft=0, archived=0, totalCategories≥1
    it('getProductStats.estimatedInventoryValue excludes archived products', ...)
    // archive one product → value decreases
    it('getProductStats.outOfStock counts products with quantity=0', ...)
    it('getProductStats.lowStock counts 0<qty<=threshold, not outOfStock products', ...)
    it('getProductStats with threshold=0 returns lowStock=0', ...)
    it('getCategoryStats returns entry for every category, even with 0 products', ...)
    // create a category with no products → appears with zeros
    it('getCategoryStats.estimatedValue excludes archived products', ...)
    it('getInquiryStats with empty adapter returns zeros and empty trend', ...)
    it('getInquiryStats.pending = byStatus.new + byStatus.read', ...)
    it('getLowStockProducts returns only products at or below threshold', ...)
    it('getLowStockProducts with threshold=0 returns only out-of-stock products', ...)
  })
  ```

- [ ] **Step 2: Run tests — verify RED**

  Run: `npx vitest run tests/unit/analytics.test.ts`
  Expected: FAIL — `getProductStats is not a function`

- [ ] **Step 3: Add types to `src/lib/db/types.ts`**

  Append after existing type definitions:
  - `ProductStats` interface (fields listed in Produces above)
  - `CategoryStat` interface
  - `InquiryDayCount` interface
  - `InquiryStats` interface (pending = byStatus.new + byStatus.read)
  - `LowStockProduct` interface

- [ ] **Step 4: Add 4 methods to `DataAdapter` interface in `src/lib/db/adapter.ts`**

  Under a `// Analytics` comment:
  ```ts
  getProductStats(lowStockThreshold?: number): Promise<ProductStats>
  getCategoryStats(lowStockThreshold?: number): Promise<CategoryStat[]>
  getInquiryStats(days?: number): Promise<InquiryStats>
  getLowStockProducts(threshold?: number): Promise<LowStockProduct[]>
  ```

- [ ] **Step 5: Implement analytics methods in `MockAdapter`**

  `getProductStats(threshold = 5)`:
  - Iterate `this.products.values()` for counts by status
  - Iterate `this.categories.values()` for `totalCategories`
  - For inventory stats: iterate `this.inventory.values()`, join with product status
  - `estimatedInventoryValue`: sum `price * quantity` only for `status !== 'archived'` products
  - `lowStock`: `0 < quantity <= threshold` AND product not archived
  - `outOfStock`: `quantity === 0` AND product not archived

  `getCategoryStats(threshold = 5)`:
  - Start from all categories (even empty ones)
  - For each category: count products by status, sum inventory quantities, compute value
  - Products not in any category go into an "Uncategorized" virtual entry only if they exist

  `getInquiryStats(days = 30)`:
  - `byType`: count by type
  - `byStatus`: count by status
  - `pending`: byStatus.new + byStatus.read
  - `trend`: generate last `days` date entries, count inquiries per date using `created_at.substring(0,10)`
  - If no inquiries: return zeros and empty `trend: []`

  `getLowStockProducts(threshold = 5)`:
  - Join products + inventory + categories
  - Filter: `quantity <= threshold` AND product not archived
  - Return sorted by quantity ASC

- [ ] **Step 6: Run tests — verify GREEN**

  Run: `npx vitest run tests/unit/analytics.test.ts`
  Expected: all tests pass

- [ ] **Step 7: Implement analytics methods in `SupabaseAdapter`**

  `getProductStats(threshold = 5)`:
  - 5 HEAD count queries (total, published, draft, archived, totalCategories) run in parallel
  - 1 query: `supabase.from('inventory').select('quantity, products!inner(price, status)')` — fetch all inventory with product price/status server-side
  - Compute `totalUnits`, `outOfStock`, `lowStock`, `estimatedInventoryValue` in JS from the fetched data
  - Wrap entire method in try/catch — return zeroed ProductStats on error

  `getCategoryStats(threshold = 5)`:
  - Fetch categories: `supabase.from('categories').select('*')`
  - Fetch products with inventory: `supabase.from('products').select('id, price, status, category_id, inventory(quantity)')`
  - Group and compute in JS (server-side aggregation)
  - Wrap in try/catch

  `getInquiryStats(days = 30)`:
  - 1 HEAD query for total
  - Fetch inquiries from last `days` days: `.select('type, status, created_at').gte('created_at', cutoffISO)`
  - Compute byType, byStatus, trend grouping in JS
  - Wrap in try/catch

  `getLowStockProducts(threshold = 5)`:
  - `supabase.from('inventory').select('quantity, products!inner(id, name, status, categories(name))').lte('quantity', threshold).order('quantity', { ascending: true })`
  - Map to `LowStockProduct[]`
  - Wrap in try/catch

- [ ] **Step 8: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 9: Full unit suite (no regressions)**

  Run: `npx vitest run tests/unit/`
  Expected: all pass (count ≥ 55)

- [ ] **Step 10: Commit**

  ```
  feat: add analytics methods to DataAdapter + both adapters
  ```

---

## Task 2: Analytics service + UI chart components

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/components/admin/BarChart.tsx`
- Create: `src/components/admin/Sparkline.tsx`

**Interfaces:**
- Consumes: `DataAdapter.getProductStats`, `getCategoryStats`, `getInquiryStats`, `getLowStockProducts`
- Produces:
  - `getAdminAnalytics(threshold?: number): Promise<AdminAnalytics>` — parallel fetch, never throws
  - `AdminAnalytics` — `{ products: ProductStats, categories: CategoryStat[], inquiries: InquiryStats, lowStock: LowStockProduct[], threshold: number }`
  - `<BarChart items={BarChartItem[]} maxValue?: number />` where `BarChartItem = { label: string, value: number, sublabel?: string }`
  - `<Sparkline data={InquiryDayCount[]} width?: number height?: number />`

- [ ] **Step 1: Create `src/lib/analytics.ts`**

  Signature: `export async function getAdminAnalytics(threshold = 5): Promise<AdminAnalytics>`
  - Calls `db.getProductStats(threshold)`, `db.getCategoryStats(threshold)`, `db.getInquiryStats(30)`, `db.getLowStockProducts(threshold)` in parallel via `Promise.all`
  - Wraps each in try/catch individually — partial failures return zeroed objects, never throws
  - Export `AdminAnalytics` type

- [ ] **Step 2: Create `src/components/admin/BarChart.tsx`**

  Props: `items: BarChartItem[]; maxValue?: number; className?: string`
  - CSS horizontal bars: each bar `width: (value/max)*100 + '%'`, `bg-[#f3c41b]`, height 8px, rounded
  - Shows `label` on the left (w-32 truncated), bar in center, `value` on the right (w-10 text-right)
  - Empty state: `<p className="text-[#8c8c8c] text-sm">No data</p>`

- [ ] **Step 3: Create `src/components/admin/Sparkline.tsx`**

  Props: `data: InquiryDayCount[]; width?: number; height?: number; className?: string`
  - SVG `viewBox="0 0 {w} {h}"`, `preserveAspectRatio="none"`, `width="100%"`
  - Compute min/max counts; map (index, count) → (x, y) SVG coordinates
  - Render `<polyline points={...} fill="none" stroke="#f3c41b" strokeWidth="1.5" />`
  - Fill area under curve with `<polygon ... fill="#f3c41b" fillOpacity="0.1" />`
  - Empty state (data.length < 2): render a flat line or nothing
  - Default dimensions: `width=400, height=80`

- [ ] **Step 4: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 5: Commit**

  ```
  feat: add analytics service + BarChart + Sparkline components
  ```

---

## Task 3: Analytics dashboard page

**Files:**
- Modify: `src/app/admin/(protected)/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `getAdminAnalytics()` from `@/lib/analytics`
- Consumes: `BarChart`, `Sparkline`, `StatsCard` from `@/components/admin/*`

The page is a Server Component with `export const instant = false`. All data fetched server-side with `requireAdmin()`.

Dashboard sections in order:

**Section 1: Header + connection status** (keep existing pattern)

**Section 2: KPI Row (8 cards, 2×4 grid on desktop)**
- Total Products / in catalog
- Published / visible in store (accent if > 0)
- Drafts / not published
- Archived / removed from store
- Categories / active
- Total Units / in inventory
- Out of Stock / need restocking (accent if > 0)
- Low Stock / ≤ {threshold} units (accent if > 0)

**Section 3: Estimated Inventory Value**
- One wide card showing `$estimatedInventoryValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })`
- Sublabel: "Potential Sale Value (published products at current prices)"

**Section 4: Products by Category**
- `<h2>Products by Category</h2>`
- `<BarChart>` with `items = categories.map(c => ({ label: c.name, value: c.publishedCount, sublabel: `${c.totalUnits} units` }))`
- Also a compact table: Category | Products | Published | Units | Potential Value

**Section 5: Inquiry Analytics**
- Two side-by-side cards:
  - Left: Counts — Total, by Type (quick_inquiry, contact, sell_request), Pending
  - Right: 30-day trend `<Sparkline data={inquiries.trend} />`
- Status breakdown table: New | Read | Replied | Archived

**Section 6: Critical Inventory (Low Stock)**
- Header: "Products at or below {threshold} units"
- Table: Product | Category | Stock | Status | Action (link to edit)
- Empty state: "All products are adequately stocked."

**Section 7: Quick actions** (keep existing pattern)

- [ ] **Step 1: Read low-stock threshold from settings**

  At top of page component:
  ```ts
  const rawThreshold = await db.getSetting('low_stock_threshold')
  const threshold = typeof rawThreshold === 'number' ? rawThreshold : 5
  const analytics = await getAdminAnalytics(threshold)
  ```

- [ ] **Step 2: Replace page content with full dashboard**

  Implement all 7 sections described above in `page.tsx`.
  - Use `StatsCard` for all KPI cards (extend with `variant` if needed, or render inline).
  - `BarChart` for category breakdown.
  - `Sparkline` for inquiry trend.
  - Table for critical inventory: `<table>` with Tailwind classes matching existing admin table style (`bg-[#141414]`, `border-[#2e2e2e]`).

- [ ] **Step 3: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 4: Lint**

  Run: `npx eslint src`
  Expected: 0 errors

- [ ] **Step 5: Next.js build**

  Run: `npx next build`
  Expected: clean (22/22 routes)

- [ ] **Step 6: Commit**

  ```
  feat: replace admin dashboard with full analytics center
  ```

---

## Task 4: Local performance indexes migration

**Files:**
- Create: `supabase/migrations/20261109000000_analytics_indexes.sql`

- [ ] **Step 1: Create migration file**

  Content:
  ```sql
  -- Migration 005: Analytics performance indexes
  -- LOCAL ONLY — run `npx supabase db push --remote` to apply after migration 001–004 are confirmed.
  -- These indexes improve dashboard aggregate queries.
  CREATE INDEX IF NOT EXISTS idx_products_status
    ON products(status);
  CREATE INDEX IF NOT EXISTS idx_products_category_status
    ON products(category_id, status);
  CREATE INDEX IF NOT EXISTS idx_inventory_quantity
    ON inventory(quantity);
  CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
    ON inquiries(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_inquiries_type_status
    ON inquiries(type, status);
  ```

- [ ] **Step 2: Document in PROGRESS.md**

  Note migration 005 as local-only, waiting for migrations 001–004 to be applied first.

- [ ] **Step 3: Commit**

  ```
  feat: add local analytics performance indexes migration (not pushed to remote)
  ```

---

## Task 5: Integration tests for analytics

**Files:**
- Modify: `tests/unit/analytics.test.ts` (extend Review Focus tests added in Task 1)
- Create: `tests/integration/analytics-integration.test.ts`

**Interfaces:**
- Consumes: `SupabaseAdapter` via injected anon clientFactory
- Consumes: `MockAdapter` from Task 1

- [ ] **Step 1: Verify all Review Focus tests are in `tests/unit/analytics.test.ts`**

  Confirm these 5 tests exist and pass:
  - `estimatedInventoryValue excludes archived products`
  - `getCategoryStats returns entry for every category, even with 0 products`
  - `getInquiryStats with empty adapter returns zeros and empty trend`
  - `lowStock count with threshold=0 returns lowStock=0`
  - `getLowStockProducts with threshold=0 returns only out-of-stock`

- [ ] **Step 2: Create `tests/integration/analytics-integration.test.ts`**

  Guard: `describe.skipIf(!process.env.NEXT_PUBLIC_SUPABASE_URL)(...)`

  Tests (anon client, reads only):
  - `getProductStats returns a ProductStats object with numeric fields`
  - `getProductStats.total >= 0 and matches published + draft + archived`
  - `getCategoryStats returns an array`
  - `getInquiryStats returns InquiryStats with numeric fields`
  - `getLowStockProducts returns LowStockProduct array`

- [ ] **Step 3: Run all tests**

  Run: `npx vitest run`
  Expected: all pass (unit + integration)

- [ ] **Step 4: Commit**

  ```
  test: add analytics unit + integration tests
  ```

---

## Task 6: Full validation + PROGRESS.md update

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Lint**

  Run: `npx eslint src`
  Expected: 0 errors

- [ ] **Step 2: TypeScript strict**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 3: Full vitest suite**

  Run: `npx vitest run`
  Expected: all pass (target ≥ 70 total)

- [ ] **Step 4: Production build**

  Run: `npx next build`
  Expected: clean, all routes compiled

- [ ] **Step 5: Update PROGRESS.md**

  Append Corte 3C analytics section with:
  - What was implemented
  - Test counts
  - New migration 005 (local only)
  - Pending: push migrations 001–004 to unlock full Supabase integration

- [ ] **Step 6: Commit**

  ```
  docs: update PROGRESS.md for Corte 3C analytics dashboard
  ```
