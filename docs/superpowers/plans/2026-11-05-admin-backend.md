# Admin Panel & Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional admin panel backed by a typed data-adapter layer so the owner can manage products, categories, inventory, and customer inquiries without touching code, while the public store reads live data from the same source.

**Architecture:** Schema-first deferred connection (Option A). A `DataAdapter` interface abstracts all persistence; a `MockAdapter` (in-memory, seeded from existing static data) enables development and CI testing before Supabase credentials exist. Swapping to `SupabaseAdapter` requires only env-var configuration. All admin routes are protected server-side via Next.js middleware + Server Action re-validation. The public shop moves from static imports to server-side adapter calls.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4, `@supabase/ssr ^0.12.7`, `@supabase/supabase-js ^2.118.0`, `zod ^4.6.7`, Vitest ^5, Playwright ^1.64

**Spec:** `docs/superpowers/specs/2026-11-05-admin-backend-design.md`

## Global Constraints

- TypeScript strict mode: 0 errors after every task. Run `npm run typecheck`.
- ESLint: 0 errors after every task. Run `npm run lint`.
- Production build must pass after every task. Run `npm run build`.
- No new runtime dependencies — all required packages are already installed.
- No hard-delete at any role level; `archived` is the terminal product state.
- Authorization sources: `admin_users` table only — never `user_metadata`.
- Credentials never in source code or `.env.local` committed to git.
- Do not modify the visual design or responsive behavior of any existing public page.
- All Supabase SQL goes in `supabase/migrations/` with numeric prefixes; never inline DDL.
- `MockAdapter` must be the default when `NEXT_PUBLIC_SUPABASE_URL` is absent.
- Image upload validation (type + size) must run server-side, not only client-side.

## Review Focus

1. **Unauthenticated POST to Server Actions** — a curl request to any `_actions/*.ts` without a valid session cookie must return a 401-equivalent error, not succeed silently; test in Task 4 and Task 7.
2. **MockAdapter ID collisions** — UUIDs generated at mock-init time must be stable within a server process lifetime so edit pages load correctly; test in Task 3.
3. **Public shop renders zero products after integration** — when `adapter.listProducts({ status: 'published' })` returns an empty array (e.g., all products are draft), the shop must show the empty-state UI rather than crashing; test in Task 15.
4. **Inquiry spam / rate-limit bypass** — the `submitInquiry` action must silently succeed on the client (to avoid enumeration) while enforcing a per-IP-hash rate limit server-side; test in Task 14.
5. **Image MIME spoofing** — a `.js` file renamed to `.jpg` must be rejected by the server-side validation in `ImageUploader`; test in Task 9.

---

## File Map

### New files
```
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_indexes.sql
  seed.sql

src/
  middleware.ts
  lib/
    db/
      types.ts
      adapter.ts
      mock-adapter.ts
      supabase-adapter.ts
      index.ts
    auth/
      server.ts
    validations/
      product.ts
      category.ts
      inquiry.ts
      inventory.ts
  app/
    actions/
      inquiries.ts            ← public form Server Action
    admin/
      layout.tsx
      page.tsx                ← dashboard
      _actions/
        products.ts
        categories.ts
        inventory.ts
        inquiries.ts
        settings.ts
      login/
        page.tsx
        actions.ts
      products/
        page.tsx
        new/
          page.tsx
        [id]/
          edit/
            page.tsx
      categories/
        page.tsx
      inventory/
        page.tsx
      inquiries/
        page.tsx
      settings/
        page.tsx
  components/
    admin/
      AdminSidebar.tsx
      StatsCard.tsx
      ProductsTable.tsx
      ProductForm.tsx
      ImageUploader.tsx
      CategoryList.tsx
      InventoryTable.tsx
      InquiriesTable.tsx

tests/
  unit/
    mock-adapter.test.ts
    validations.test.ts
    auth-guard.test.ts
  e2e/
    admin-auth.spec.ts
    admin-products.spec.ts
    public-sync.spec.ts
    form-inquiries.spec.ts
```

### Modified files
```
src/components/ui/QuickInquiryForm.tsx   ← wire to submitInquiry action
src/components/contact/ContactForm.tsx   ← wire to submitInquiry action
src/components/sell/SellForm.tsx         ← wire to submitInquiry action
src/components/shop/ShopClient.tsx       ← accept products prop (remove static import)
src/app/shop/page.tsx                    ← fetch from adapter server-side
src/app/page.tsx                         ← fetch featured products from adapter
docs/PROGRESS.md                         ← update at end
```

---

## Task 1: Audit Documentation

**Files:**
- Create: `docs/ADMIN_AUDIT.md`
- Create: `docs/ADMIN_ARCHITECTURE.md`
- Create: `docs/ADMIN_BACKLOG.md`

**Interfaces:**
- Produces: nothing consumed by code; human-readable reference for all subsequent tasks

- [ ] **Step 1: Run current validation baseline**

```bash
cd C:\Users\moise\Developer\jd-power-warehouse
npm run lint && npm run typecheck && npm run build
```
Expected: 0 lint errors, 0 TS errors, 11 static routes built.

- [ ] **Step 2: Write `docs/ADMIN_AUDIT.md`**

Document: current route inventory (11 public routes), all components listing source file, data sources (static `products.ts`, `categories.ts`, `testimonials.ts`), form submission status (all 3 forms submit locally only — no persistence), images (27 in `public/images/`, 10 products with real images), git status (clean main branch), Supabase status (packages installed, no env vars, no project), regression risks (ShopClient imports products directly — must receive as prop to enable integration).

- [ ] **Step 3: Write `docs/ADMIN_ARCHITECTURE.md`**

Transcribe the approved design: module boundaries diagram, full DB schema tables (categories, products, product_images, inventory, inventory_movements, inquiries, admin_users, audit_log, store_settings), RLS policy table, DataAdapter interface, auth model, image upload flow, admin routes table, B2B extensibility notes.

- [ ] **Step 4: Write `docs/ADMIN_BACKLOG.md`**

Three sections: IMPLEMENTED (current public store), PENDING (all 18 plan tasks), BLOCKED (Supabase credentials — list exact env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

- [ ] **Step 5: Commit**

```bash
git add docs/ADMIN_AUDIT.md docs/ADMIN_ARCHITECTURE.md docs/ADMIN_BACKLOG.md
git commit -m "docs: add admin audit, architecture, and backlog for Corte 2"
```

---

## Task 2: Database Schema Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`
- Create: `supabase/migrations/003_indexes.sql`
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: SQL artifacts consumed by Task 3 (types must match column names exactly) and Task 4 (RLS policy patterns inform auth utilities)

- [ ] **Step 1: Create `supabase/migrations/001_initial_schema.sql`**

Write the full DDL from the approved design. Tables in this order: `categories`, `products`, `product_images`, `inventory`, `inventory_movements`, `inquiries`, `admin_users`, `audit_log`, `store_settings`. Include all check constraints and foreign keys exactly as specified in the design doc. Add `updated_at` trigger function reused across tables. No `DROP TABLE` statements.

- [ ] **Step 2: Create `supabase/migrations/002_rls_policies.sql`**

Enable RLS on all 9 tables. For each table, write the exact policies matching the RLS table in the design doc:
- `categories`: anon SELECT allowed; INSERT/UPDATE/DELETE require `auth.uid() IN (SELECT id FROM admin_users)`.
- `products`: anon SELECT where `status = 'published'`; full SELECT + all writes for admin.
- `product_images`: join through products table for anon (only images of published products); full access for admin.
- `inventory`: anon SELECT where product is published; full access for admin.
- `inventory_movements`: no anon access; full access for admin.
- `inquiries`: anon INSERT only (no SELECT); full access for admin.
- `admin_users`: no anon access; SELECT own row only for authenticated users; no self-escalation.
- `audit_log`: no anon access; SELECT for admin; no direct INSERT (populated via trigger).
- `store_settings`: anon SELECT; admin INSERT/UPDATE.

Include `CREATE POLICY` with descriptive names like `products_anon_read_published`, `products_admin_all`.

- [ ] **Step 3: Create `supabase/migrations/003_indexes.sql`**

```sql
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id, sort_order);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_type ON inquiries(type);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
```

- [ ] **Step 4: Create `supabase/seed.sql`**

Seed data: 6 categories (Tools, Outdoor, Landscaping, Grills, Home Improvement, Seasonal) with stable UUIDs. 16 products from `src/data/products.ts` with matching stable UUIDs, all set to `status = 'published'`. One `inventory` row per product with `quantity = 10`. Image paths from existing `public/images/catalog/` stored as local paths (conditional rendering handled in Task 3).

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migrations, RLS policies, indexes, and seed data"
```

---

## Task 3: DB Types + DataAdapter Interface + MockAdapter

**Files:**
- Create: `src/lib/db/types.ts`
- Create: `src/lib/db/adapter.ts`
- Create: `src/lib/db/mock-adapter.ts`
- Create: `src/lib/db/supabase-adapter.ts`
- Create: `src/lib/db/index.ts`
- Test: `tests/unit/mock-adapter.test.ts`

**Interfaces:**
- Produces: `DataAdapter` interface and `Product`, `Category`, `Inventory`, `Inquiry` DTOs consumed by all subsequent tasks

- [ ] **Step 1: Write `src/lib/db/types.ts`**

Export these TypeScript types (must match SQL column names exactly):

```typescript
export type ProductStatus = 'draft' | 'published' | 'archived'
export type InquiryStatus = 'new' | 'read' | 'replied' | 'archived'
export type InquiryType = 'quick_inquiry' | 'contact' | 'sell_request'
export type AdminRole = 'admin' | 'super_admin'

export interface Category {
  id: string; name: string; slug: string; sort_order: number; created_at: string
}

export interface ProductImage {
  id: string; product_id: string; storage_path: string; alt_text: string | null; sort_order: number
}

export interface Product {
  id: string; sku: string | null; name: string; description: string | null
  price: number; original_price: number | null; category_id: string | null
  status: ProductStatus; badge: 'Sale' | 'New' | null
  created_at: string; updated_at: string
  // joined fields (not in DB, populated by adapter)
  category?: Category; images?: ProductImage[]; quantity?: number
}

export interface InventoryRecord {
  id: string; product_id: string; quantity: number; updated_at: string
}

export interface InventoryMovement {
  id: string; product_id: string; delta: number; reason: string | null
  admin_id: string | null; created_at: string
}

export interface Inquiry {
  id: string; type: InquiryType; name: string; email: string; phone: string | null
  message: string; item_name: string | null; item_description: string | null
  item_condition: string | null; asking_price: number | null
  status: InquiryStatus; created_at: string
}

export interface ProductFilter {
  status?: ProductStatus; category_id?: string; search?: string
  page?: number; per_page?: number
}

export interface InquiryFilter {
  status?: InquiryStatus; type?: InquiryType; page?: number; per_page?: number
}

export interface PaginatedResult<T> { data: T[]; total: number; page: number; per_page: number }

export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'quantity'>
export type UpdateProductInput = Partial<CreateProductInput>
export type CreateCategoryInput = Omit<Category, 'id' | 'created_at'>
export type UpdateCategoryInput = Partial<CreateCategoryInput>
export interface CreateInquiryInput {
  type: InquiryType; name: string; email: string; phone?: string; message: string
  item_name?: string; item_description?: string; item_condition?: string; asking_price?: number
}
```

- [ ] **Step 2: Write `src/lib/db/adapter.ts`**

Export `DataAdapter` interface with these methods (exact signatures):

```typescript
export interface DataAdapter {
  listProducts(filter?: ProductFilter): Promise<PaginatedResult<Product>>
  getProduct(id: string): Promise<Product | null>
  createProduct(data: CreateProductInput): Promise<Product>
  updateProduct(id: string, data: UpdateProductInput): Promise<Product>
  setProductStatus(id: string, status: ProductStatus): Promise<Product>

  listCategories(): Promise<Category[]>
  createCategory(data: CreateCategoryInput): Promise<Category>
  updateCategory(id: string, data: UpdateCategoryInput): Promise<Category>

  getInventory(productId: string): Promise<InventoryRecord | null>
  adjustInventory(productId: string, delta: number, reason: string): Promise<InventoryRecord>

  listInquiries(filter?: InquiryFilter): Promise<PaginatedResult<Inquiry>>
  createInquiry(data: CreateInquiryInput): Promise<Inquiry>
  updateInquiryStatus(id: string, status: InquiryStatus): Promise<void>

  listSettings(): Promise<Record<string, unknown>>
  getSetting(key: string): Promise<unknown>
  setSetting(key: string, value: unknown): Promise<void>
}
```

- [ ] **Step 3: Write failing tests in `tests/unit/mock-adapter.test.ts`**

```typescript
// test: listProducts returns all published products by default
// test: listProducts with status filter returns only matching products
// test: getProduct returns null for unknown id
// test: createProduct assigns a uuid id and sets status to 'draft'
// test: setProductStatus('id', 'archived') persists across getProduct call
// test: adjustInventory with delta +5 increases quantity
// test: adjustInventory with delta that would go below 0 throws or clamps to 0
// test: createInquiry persists and is returned by listInquiries
// test: listProducts pagination: page 1 with per_page 2 returns 2 items
```

Run: `npx vitest run tests/unit/mock-adapter.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write `src/lib/db/mock-adapter.ts`**

Implement `MockAdapter implements DataAdapter`. Initialize with seed data from `src/data/products.ts` and `src/data/categories.ts`, converting to the new `Product`/`Category` DTO types. Use `crypto.randomUUID()` for all new record IDs. Store data in private `Map` instances. All methods return `Promise.resolve(...)` wrappers. `adjustInventory` must clamp to minimum 0.

- [ ] **Step 5: Write `src/lib/db/supabase-adapter.ts`**

Stub only — export class `SupabaseAdapter implements DataAdapter`. Each method throws `new Error('SupabaseAdapter: Supabase not connected. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')`. This file will be filled in Task 16 when credentials are available.

- [ ] **Step 6: Write `src/lib/db/index.ts`**

```typescript
import { MockAdapter } from './mock-adapter'
import { SupabaseAdapter } from './supabase-adapter'
export type { DataAdapter } from './adapter'
export * from './types'

export const db: DataAdapter =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new SupabaseAdapter()
    : new MockAdapter()
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run tests/unit/mock-adapter.test.ts
```
Expected: all 9 tests PASS.

- [ ] **Step 8: Verify build**

```bash
npm run typecheck && npm run build
```
Expected: 0 TS errors, 0 build errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/db/ tests/unit/mock-adapter.test.ts
git commit -m "feat: add DataAdapter interface, MockAdapter, and type definitions"
```

---

## Task 4: Zod Schemas + Auth Utilities + Middleware

**Files:**
- Create: `src/lib/validations/product.ts`
- Create: `src/lib/validations/category.ts`
- Create: `src/lib/validations/inquiry.ts`
- Create: `src/lib/validations/inventory.ts`
- Create: `src/lib/auth/server.ts`
- Create: `src/middleware.ts`
- Test: `tests/unit/validations.test.ts`
- Test: `tests/unit/auth-guard.test.ts`

**Interfaces:**
- Consumes: `ProductStatus`, `InquiryType`, `InquiryStatus` from `src/lib/db/types.ts`
- Produces: `CreateProductSchema`, `UpdateProductSchema`, `CreateInquirySchema`, `AdjustInventorySchema`; `requireAdmin()`, `getAdminSession()` from auth/server.ts

- [ ] **Step 1: Write failing validation tests in `tests/unit/validations.test.ts`**

```typescript
// test: CreateProductSchema rejects negative price
// test: CreateProductSchema rejects price > 999999.99
// test: CreateProductSchema rejects unknown status value
// test: CreateInquirySchema rejects empty name
// test: CreateInquirySchema rejects malformed email
// test: CreateInquirySchema accepts valid quick_inquiry with no phone
// test: AdjustInventorySchema rejects non-integer delta
// test: SellRequestSchema requires item_name when type is sell_request
```

Run: `npx vitest run tests/unit/validations.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 2: Write `src/lib/validations/product.ts`**

```typescript
export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().min(0).max(999999.99),
  original_price: z.number().min(0).max(999999.99).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft','published','archived']),
  badge: z.enum(['Sale','New']).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
})
export const UpdateProductSchema = CreateProductSchema.partial()
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
```

- [ ] **Step 3: Write `src/lib/validations/category.ts`**

```typescript
export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  sort_order: z.number().int().min(0).default(0),
})
export const UpdateCategorySchema = CreateCategorySchema.partial()
```

- [ ] **Step 4: Write `src/lib/validations/inquiry.ts`**

```typescript
export const CreateInquirySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('quick_inquiry'),
    name: z.string().min(1).max(100),
    email: z.string().email().optional(),   // QuickInquiryForm has no email field
    phone: z.string().max(30).optional(),
    message: z.string().min(1).max(2000),
  }),
  z.object({
    type: z.literal('contact'),
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    message: z.string().min(1).max(2000),
  }),
  z.object({
    type: z.literal('sell_request'),
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    message: z.string().min(1).max(2000),
    item_name: z.string().min(1).max(200),
    item_description: z.string().max(2000).optional(),
    item_condition: z.enum(['new','used']).optional(),
    asking_price: z.number().min(0).max(999999.99).optional(),
  }),
])
```

- [ ] **Step 5: Write `src/lib/validations/inventory.ts`**

```typescript
export const AdjustInventorySchema = z.object({
  product_id: z.string().uuid(),
  delta: z.number().int(),
  reason: z.string().min(1).max(500),
})
```

- [ ] **Step 6: Write `src/lib/auth/server.ts`**

```typescript
// createServerSupabaseClient(): SupabaseClient — uses @supabase/ssr createServerClient with cookies()
// getAdminSession(): Promise<{ userId: string; role: AdminRole } | null>
//   reads session via supabase.auth.getUser(), then looks up admin_users table
//   returns null if no session or user not in admin_users
// requireAdmin(): Promise<{ userId: string; role: AdminRole }>
//   calls getAdminSession(); throws redirect('/admin/login') if null
//   NEVER reads user_metadata for role
```

When `NEXT_PUBLIC_SUPABASE_URL` is absent (MockAdapter mode), `getAdminSession()` returns a hardcoded dev session `{ userId: 'mock-admin-id', role: 'admin' }`. This is guarded by `process.env.NODE_ENV !== 'production'` check.

- [ ] **Step 7: Write `src/middleware.ts`**

Protect all routes starting with `/admin` except `/admin/login`. Use `@supabase/ssr` `createServerClient` to check for a valid session. Redirect to `/admin/login` with `?next=<requested-url>` if no session. Do not use `user_metadata` for any check. Apply only to `matcher: ['/admin/:path*']`.

- [ ] **Step 8: Run validation tests**

```bash
npx vitest run tests/unit/validations.test.ts
```
Expected: all 8 tests PASS.

- [ ] **Step 9: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/lib/validations/ src/lib/auth/ src/middleware.ts tests/unit/validations.test.ts
git commit -m "feat: add Zod validation schemas, auth utilities, and admin route middleware"
```

---

## Task 5: Admin Layout + Sidebar + Login

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/login/actions.ts`
- Create: `src/components/admin/AdminSidebar.tsx`

**Interfaces:**
- Consumes: `requireAdmin()` from `src/lib/auth/server.ts`
- Produces: shared admin shell layout used by Tasks 6–13

- [ ] **Step 1: Write `src/components/admin/AdminSidebar.tsx`**

Client component. Props: `currentPath: string`. Render a sidebar with brand logo + "Admin" label at top, then navigation links: Dashboard (`/admin`), Products (`/admin/products`), Categories (`/admin/categories`), Inventory (`/admin/inventory`), Inquiries (`/admin/inquiries`), Settings (`/admin/settings`). Active link highlighted with gold (`#F3C41B`) left border. Bottom: logout button that calls a form action. Dark background `#141414`, border-right `#2e2e2e`. Responsive: collapsible on mobile.

- [ ] **Step 2: Write `src/app/admin/login/page.tsx`**

Server Component. If a session already exists, redirect to `/admin`. Render an email + password form. Brand-consistent dark card, gold accent. Import and call `loginAction` from `./actions`. Show error state if `searchParams.error` is set.

- [ ] **Step 3: Write `src/app/admin/login/actions.ts`**

```typescript
'use server'
// loginAction(formData: FormData): Promise<void>
//   calls supabase.auth.signInWithPassword({ email, password })
//   on error: redirect('/admin/login?error=invalid_credentials')
//   on success: redirect('/admin')

// logoutAction(): Promise<void>
//   calls supabase.auth.signOut()
//   redirect('/admin/login')
```

In MockAdapter mode (no env vars), `loginAction` accepts any credentials and sets a mock cookie, then redirects to `/admin`.

- [ ] **Step 4: Write `src/app/admin/layout.tsx`**

Server Component. Calls `requireAdmin()` — this handles the redirect if unauthenticated. Renders `AdminSidebar` on the left, `{children}` on the right. Dark base `#0A0A0A`. Full height layout with sticky sidebar. Pass `pathname` from `headers()` to `AdminSidebar` for active link highlighting.

- [ ] **Step 5: Verify build and navigation**

```bash
npm run typecheck && npm run build
```
Expected: `/admin/login` route present in build output.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/ src/components/admin/AdminSidebar.tsx
git commit -m "feat: add admin layout, sidebar, and login/logout flow"
```

---

## Task 6: Dashboard Page

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/StatsCard.tsx`

**Interfaces:**
- Consumes: `db.listProducts()`, `db.listInquiries()`, `db.listProducts({ status: 'published' })` from `src/lib/db/index.ts`
- Produces: `/admin` dashboard route

- [ ] **Step 1: Write `src/components/admin/StatsCard.tsx`**

Props: `title: string; value: number | string; label: string; accent?: boolean`. Renders a card with dark background, stat value large and bold, accent gold when `accent=true`. Reusable across the dashboard.

- [ ] **Step 2: Write `src/app/admin/page.tsx`**

Server Component. Calls `requireAdmin()`. Fetches in parallel: `db.listProducts()` for total count, `db.listProducts({ status: 'published' })` for published count, `db.listProducts({ status: 'draft' })` for draft count, `db.listInquiries({ status: 'new' })` for unread count. Renders a grid of `StatsCard` components: Total Products, Published, Draft, New Inquiries. Below: a note showing MockAdapter mode vs. live mode.

- [ ] **Step 3: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/components/admin/StatsCard.tsx
git commit -m "feat: add admin dashboard with product and inquiry stats"
```

---

## Task 7: Products Table Page

**Files:**
- Create: `src/app/admin/products/page.tsx`
- Create: `src/components/admin/ProductsTable.tsx`
- Create: `src/app/admin/_actions/products.ts`

**Interfaces:**
- Consumes: `db.listProducts(filter)`, `db.setProductStatus()` from `src/lib/db/index.ts`; `requireAdmin()`, `UpdateProductSchema`
- Produces: `/admin/products` route; `setProductStatusAction` used by Tasks 8+

- [ ] **Step 1: Write `src/app/admin/_actions/products.ts`**

```typescript
'use server'
// setProductStatusAction(productId: string, status: ProductStatus): Promise<void>
//   calls requireAdmin(), then db.setProductStatus(productId, status)
//   writes to audit_log via db.createAuditEntry (add this method to adapter if missing)
//   revalidatePath('/admin/products') and revalidatePath('/shop')
//
// deleteProductAction — NOT IMPLEMENTED (archive-only policy)
```

- [ ] **Step 2: Write `src/components/admin/ProductsTable.tsx`**

Client component. Props: `products: Product[]; categories: Category[]`. Renders a sortable table: Name, Category, Price, Status badge (color-coded: draft=gray, published=green, archived=red/muted), Stock qty, Actions column. Actions: "Publish" / "Unpublish" / "Archive" buttons that call `setProductStatusAction` via `useTransition`. Edit link goes to `/admin/products/[id]/edit`. Filter bar above table: status select, category select, search input (client-side filter on prop data). Empty state when no products match.

- [ ] **Step 3: Write `src/app/admin/products/page.tsx`**

Server Component. Calls `requireAdmin()`. Fetches `db.listProducts()` and `db.listCategories()`. Passes to `ProductsTable`. Add "New Product" button linking to `/admin/products/new`.

- [ ] **Step 4: Verify build and check Review Focus item 1**

Verify that calling `setProductStatusAction` without a valid session (simulated by temporarily removing the `requireAdmin()` call and checking the redirect path) throws, not silently succeeds.

```bash
npm run typecheck && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/products/page.tsx src/components/admin/ProductsTable.tsx src/app/admin/_actions/products.ts
git commit -m "feat: add admin products table with status management actions"
```

---

## Task 8: Product Create / Edit Form

**Files:**
- Create: `src/app/admin/products/new/page.tsx`
- Create: `src/app/admin/products/[id]/edit/page.tsx`
- Create: `src/components/admin/ProductForm.tsx`

**Interfaces:**
- Consumes: `CreateProductSchema`, `UpdateProductSchema`; `db.createProduct()`, `db.updateProduct()`, `db.getProduct()`, `db.listCategories()`; `setProductStatusAction` from Task 7
- Produces: `/admin/products/new` and `/admin/products/[id]/edit` routes

- [ ] **Step 1: Write `src/components/admin/ProductForm.tsx`**

Client component. Props:
```typescript
{
  product?: Product        // undefined for create
  categories: Category[]
  action: (formData: FormData) => Promise<{ error?: string }>
}
```
Renders: Name (required), Description (textarea), Price (number, required), Original Price (optional), SKU, Category (select), Status (select: draft/published/archived), Badge (select: none/Sale/New). Submit button. Shows `action` result error inline if present. No `useFormState` — use `useTransition` with async call pattern.

- [ ] **Step 2: Add `createProductAction` and `updateProductAction` to `src/app/admin/_actions/products.ts`**

```typescript
// createProductAction(formData: FormData): Promise<{ error?: string }>
//   calls requireAdmin()
//   parse form fields, validate with CreateProductSchema
//   calls db.createProduct(data)
//   revalidatePath('/admin/products') + revalidatePath('/shop')
//   returns {} on success, { error: message } on validation failure

// updateProductAction(id: string, formData: FormData): Promise<{ error?: string }>
//   calls requireAdmin()
//   parse form fields, validate with UpdateProductSchema
//   calls db.updateProduct(id, data)
//   revalidatePath paths above
```

- [ ] **Step 3: Write `src/app/admin/products/new/page.tsx`**

Server Component. Calls `requireAdmin()`. Fetches `db.listCategories()`. Renders `ProductForm` with `action={createProductAction}`. On success (no error returned), redirect to `/admin/products`.

- [ ] **Step 4: Write `src/app/admin/products/[id]/edit/page.tsx`**

Server Component. Calls `requireAdmin()`. Calls `db.getProduct(params.id)`. If null, render "Product not found" with back link. Fetches `db.listCategories()`. Renders `ProductForm` with `product` pre-populated and `action` bound to `updateProductAction(params.id, ...)`.

- [ ] **Step 5: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/products/ src/components/admin/ProductForm.tsx
git commit -m "feat: add product create and edit forms with server-side validation"
```

---

## Task 9: Image Uploader

**Files:**
- Create: `src/components/admin/ImageUploader.tsx`
- Modify: `src/app/admin/products/[id]/edit/page.tsx`
- Modify: `src/app/admin/_actions/products.ts`

**Interfaces:**
- Consumes: `db.uploadImage()`, `db.deleteImage()`, `db.reorderImages()` — add these to `DataAdapter` interface and `MockAdapter`
- Produces: image management UI integrated into the product edit page

- [ ] **Step 1: Extend `DataAdapter` and `MockAdapter`**

Add to `adapter.ts`:
```typescript
uploadImage(productId: string, file: { name: string; type: string; size: number; buffer: Buffer }): Promise<ProductImage>
deleteImage(imageId: string): Promise<void>
reorderImages(productId: string, imageIds: string[]): Promise<void>
```

`MockAdapter.uploadImage`: validates type (`image/jpeg`, `image/png`, `image/webp`) and size (≤ 5 MB = 5 * 1024 * 1024 bytes) — throws `Error('INVALID_TYPE')` or `Error('FILE_TOO_LARGE')` if violated. Stores a fake path `mock://product-images/${productId}/${randomUUID()}`. Returns a `ProductImage` row.

- [ ] **Step 2: Add server action for image upload to `src/app/admin/_actions/products.ts`**

```typescript
// uploadProductImageAction(productId: string, formData: FormData): Promise<{ error?: string }>
//   calls requireAdmin()
//   reads file from formData.get('file') as File
//   server-side validation: type must be image/jpeg|png|webp, size ≤ 5MB
//   calls db.uploadImage(productId, { name, type, size, buffer })
//   revalidatePath(`/admin/products/${productId}/edit`)
//   returns {} on success, { error } on failure
//
// deleteProductImageAction(imageId: string, productId: string): Promise<void>
//   calls requireAdmin()
//   calls db.deleteImage(imageId)
//   revalidatePath(`/admin/products/${productId}/edit`)
```

- [ ] **Step 3: Write `src/components/admin/ImageUploader.tsx`**

Client component. Props: `productId: string; images: ProductImage[]`. Renders existing images as a sortable list (drag-and-drop reorder via HTML5 drag events, calls `reorderImagesAction` on drop). "Add Image" button opens a file picker — accepts `image/jpeg,image/png,image/webp`, max 5 MB validated client-side first. On file select, calls `uploadProductImageAction` via `useTransition`. Delete button per image calls `deleteProductImageAction`. Shows loading spinner during upload. Shows error message if server rejects.

Add `reorderImagesAction` to `_actions/products.ts`:
```typescript
// reorderImagesAction(productId: string, imageIds: string[]): Promise<void>
//   calls requireAdmin(), db.reorderImages(productId, imageIds)
//   revalidatePath(`/admin/products/${productId}/edit`)
```

- [ ] **Step 4: Integrate `ImageUploader` into `src/app/admin/products/[id]/edit/page.tsx`**

Fetch `product.images` (already included in `db.getProduct` response). Render `ImageUploader` below `ProductForm`.

- [ ] **Step 5: Verify Review Focus item 5 (MIME spoofing)**

Add test to `tests/unit/mock-adapter.test.ts`:
```typescript
// test: uploadImage rejects file with type 'application/javascript' even if named '.jpg'
```

Run: `npx vitest run tests/unit/mock-adapter.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/ImageUploader.tsx src/app/admin/_actions/products.ts src/lib/db/ tests/unit/mock-adapter.test.ts
git commit -m "feat: add image uploader with server-side type and size validation"
```

---

## Task 10: Categories Management

**Files:**
- Create: `src/app/admin/categories/page.tsx`
- Create: `src/components/admin/CategoryList.tsx`
- Create: `src/app/admin/_actions/categories.ts`

**Interfaces:**
- Consumes: `db.listCategories()`, `db.createCategory()`, `db.updateCategory()`; `CreateCategorySchema`, `UpdateCategorySchema`
- Produces: `/admin/categories` route

- [ ] **Step 1: Write `src/app/admin/_actions/categories.ts`**

```typescript
'use server'
// createCategoryAction(formData: FormData): Promise<{ error?: string }>
//   requireAdmin(), validate with CreateCategorySchema, db.createCategory(data)
//   revalidatePath('/admin/categories')
//
// updateCategoryAction(id: string, formData: FormData): Promise<{ error?: string }>
//   requireAdmin(), validate with UpdateCategorySchema, db.updateCategory(id, data)
//   revalidatePath('/admin/categories')
```

- [ ] **Step 2: Write `src/components/admin/CategoryList.tsx`**

Client component. Props: `categories: Category[]`. Renders a list of category rows with inline edit capability (click to expand form with name/slug/sort fields). "Add Category" button appends a new empty row. Each row: edit form calls `updateCategoryAction` or `createCategoryAction`. Sorted by `sort_order`.

- [ ] **Step 3: Write `src/app/admin/categories/page.tsx`**

Server Component. `requireAdmin()`. Fetch `db.listCategories()`. Render `CategoryList`.

- [ ] **Step 4: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/categories/ src/components/admin/CategoryList.tsx src/app/admin/_actions/categories.ts
git commit -m "feat: add admin categories management page"
```

---

## Task 11: Inventory Management

**Files:**
- Create: `src/app/admin/inventory/page.tsx`
- Create: `src/components/admin/InventoryTable.tsx`
- Create: `src/app/admin/_actions/inventory.ts`

**Interfaces:**
- Consumes: `db.listProducts()`, `db.getInventory()`, `db.adjustInventory()`; `AdjustInventorySchema`
- Produces: `/admin/inventory` route

- [ ] **Step 1: Extend `MockAdapter` to aggregate inventory alongside products**

`MockAdapter.listProducts()` should include `quantity` as a joined field on each `Product` by looking up the inventory map. Add a test: `listProducts()` result has `quantity` field for each product.

- [ ] **Step 2: Write `src/app/admin/_actions/inventory.ts`**

```typescript
'use server'
// adjustInventoryAction(formData: FormData): Promise<{ error?: string }>
//   requireAdmin()
//   validate with AdjustInventorySchema
//   db.adjustInventory(product_id, delta, reason)
//   revalidatePath('/admin/inventory'), revalidatePath('/shop')
```

- [ ] **Step 3: Write `src/components/admin/InventoryTable.tsx`**

Client component. Props: `products: Product[]` (each has `quantity` field). Renders table: Product Name, Category, Current Stock, Last Updated. Each row has an "Adjust" button that opens an inline form: delta (positive/negative integer) + reason text. Submits `adjustInventoryAction`. Shows new quantity after update. Low-stock highlight (< 3) in amber.

- [ ] **Step 4: Write `src/app/admin/inventory/page.tsx`**

Server Component. `requireAdmin()`. `db.listProducts()`. Render `InventoryTable`.

- [ ] **Step 5: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/inventory/ src/components/admin/InventoryTable.tsx src/app/admin/_actions/inventory.ts
git commit -m "feat: add admin inventory management with stock adjustment"
```

---

## Task 12: Inquiries Inbox

**Files:**
- Create: `src/app/admin/inquiries/page.tsx`
- Create: `src/components/admin/InquiriesTable.tsx`
- Create: `src/app/admin/_actions/inquiries.ts`

**Interfaces:**
- Consumes: `db.listInquiries()`, `db.updateInquiryStatus()`
- Produces: `/admin/inquiries` route

- [ ] **Step 1: Write `src/app/admin/_actions/inquiries.ts`**

```typescript
'use server'
// updateInquiryStatusAction(id: string, status: InquiryStatus): Promise<void>
//   requireAdmin(), db.updateInquiryStatus(id, status)
//   revalidatePath('/admin/inquiries')
```

- [ ] **Step 2: Write `src/components/admin/InquiriesTable.tsx`**

Client component. Props: `inquiries: Inquiry[]`. Renders table: Type badge (quick/contact/sell colored), Name, Email, Date, Status badge, expand toggle. Expanded row shows full message + sell-specific fields if type is `sell_request`. Status dropdown per row calls `updateInquiryStatusAction`. Filter tabs at top: All / New / Read / Replied / Archived.

- [ ] **Step 3: Write `src/app/admin/inquiries/page.tsx`**

Server Component. `requireAdmin()`. `db.listInquiries()`. Render `InquiriesTable`.

- [ ] **Step 4: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/inquiries/ src/components/admin/InquiriesTable.tsx src/app/admin/_actions/inquiries.ts
git commit -m "feat: add admin inquiries inbox with status management"
```

---

## Task 13: Settings Page

**Files:**
- Create: `src/app/admin/settings/page.tsx`
- Create: `src/app/admin/_actions/settings.ts`

**Interfaces:**
- Consumes: `db.listSettings()`, `db.setSetting()`
- Produces: `/admin/settings` route

- [ ] **Step 1: Define settings key constants**

Add `src/lib/db/settings-keys.ts`:
```typescript
export const SETTINGS_KEYS = {
  STORE_NAME: 'store_name',
  ANNOUNCEMENT_BAR_TEXT: 'announcement_bar_text',
  CONTACT_PHONE: 'contact_phone',
  CONTACT_EMAIL: 'contact_email',
  BUSINESS_HOURS: 'business_hours',
  WHATSAPP_NUMBER: 'whatsapp_number',
} as const
```

Extend `MockAdapter` to initialize these keys with current values from the codebase.

- [ ] **Step 2: Write `src/app/admin/_actions/settings.ts`**

```typescript
'use server'
// updateSettingsAction(formData: FormData): Promise<{ error?: string }>
//   requireAdmin()
//   for each SETTINGS_KEYS value: read from formData, validate (string, max 500)
//   call db.setSetting(key, value) for each
//   revalidatePath('/admin/settings')
```

- [ ] **Step 3: Write `src/app/admin/settings/page.tsx`**

Server Component. `requireAdmin()`. `db.listSettings()`. Renders a form with labeled inputs for each `SETTINGS_KEYS` entry, pre-populated with current values. Submit calls `updateSettingsAction`. Note: settings updates to announcement bar / store name require a code change to consume from `db` — document this as a PENDING item in `ADMIN_BACKLOG.md`.

- [ ] **Step 4: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/settings/ src/app/admin/_actions/settings.ts src/lib/db/settings-keys.ts
git commit -m "feat: add admin settings page with store configuration fields"
```

---

## Task 14: Public Inquiry Form Wiring

**Files:**
- Create: `src/app/actions/inquiries.ts`
- Modify: `src/components/ui/QuickInquiryForm.tsx`
- Modify: `src/components/contact/ContactForm.tsx`
- Modify: `src/components/sell/SellForm.tsx`

**Interfaces:**
- Consumes: `CreateInquirySchema` from `src/lib/validations/inquiry.ts`; `db.createInquiry()`
- Produces: `submitInquiryAction` used by all three public forms

- [ ] **Step 1: Write `src/app/actions/inquiries.ts`**

```typescript
'use server'
// submitInquiryAction(data: CreateInquiryInput): Promise<{ success: boolean }>
//   validate with CreateInquirySchema — on failure, return { success: true } (silent to prevent enumeration)
//   rate-limit: hash requester IP via headers().get('x-forwarded-for') ?? '0.0.0.0' with crypto SHA-256
//     store recent hashes in memory (or a simple in-memory LRU for mock mode)
//     if same ip_hash submitted more than 5 times in 60 seconds, still return { success: true } (silent)
//   db.createInquiry({ ...data, ip_hash: hash }) — ip_hash stored server-side only, never returned to client
//   return { success: true }
```

- [ ] **Step 2: Modify `QuickInquiryForm.tsx`**

Replace `onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}` with an async submit handler that calls `submitInquiryAction({ type: 'quick_inquiry', name, phone, message })`. Preserve all existing visual styling. Show same "Request Received!" success state on `{ success: true }`. Email is optional in the `quick_inquiry` Zod schema, so no new form field is needed.

- [ ] **Step 3: Modify `ContactForm.tsx`**

Replace `handleSubmit` with async call to `submitInquiryAction({ type: 'contact', name, email, phone, message })`. Preserve all visual styling and success state.

- [ ] **Step 4: Modify `SellForm.tsx`**

Replace `handleSubmit` with async call to `submitInquiryAction({ type: 'sell_request', name: form.fullName, email: form.email, phone: form.phone, message: form.description, item_name: form.itemName, item_condition: form.condition, asking_price: parseFloat(form.askingPrice) || undefined })`. Preserve all visual styling and success state. File upload currently stores files in component state only — note in `ADMIN_BACKLOG.md` that image attachments for sell requests require Supabase Storage integration (PENDING).

- [ ] **Step 5: Verify Review Focus item 4 (rate limiting)**

Add to `tests/unit/validations.test.ts`:
```typescript
// test: submitInquiryAction called 6 times from same IP returns { success: true } each time (silent rate limit)
```

Run: `npx vitest run tests/unit/validations.test.ts`
Expected: PASS.

- [ ] **Step 6: Verify build and visual integrity**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/actions/inquiries.ts src/components/ui/QuickInquiryForm.tsx src/components/contact/ContactForm.tsx src/components/sell/SellForm.tsx tests/unit/
git commit -m "feat: wire all three public forms to inquiry Server Action with rate limiting"
```

---

## Task 15: Public Shop Integration

**Files:**
- Modify: `src/components/shop/ShopClient.tsx`
- Modify: `src/app/shop/page.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `db.listProducts({ status: 'published' })` from `src/lib/db/index.ts`; `Product` DTO from `src/lib/db/types.ts`
- Produces: shop reads from adapter; existing `src/data/products.ts` retained as MockAdapter seed only

- [ ] **Step 1: Update `ShopClient.tsx` to accept products as prop**

Change `ShopClient` signature from no props to:
```typescript
interface ShopClientProps { products: Product[]; categories: Category[] }
export default function ShopClient({ products, categories }: ShopClientProps)
```

Remove `import { products } from '@/data/products'`. The `filtered` useMemo now operates on the `products` prop. The `FILTER_CATEGORIES` constant is replaced by `['All', ...categories.map(c => c.name)]`. Keep all existing filtering, sorting, and rendering logic. Keep all existing CSS classes unchanged.

- [ ] **Step 2: Update `src/app/shop/page.tsx`**

Make it a Server Component (remove any `'use client'` if present). Fetch `db.listProducts({ status: 'published' })` and `db.listCategories()`. Pass results to `<ShopClient products={...} categories={...} />`. Add `revalidate = 60` export for ISR.

- [ ] **Step 3: Update `src/app/page.tsx`**

Fetch `db.listProducts({ status: 'published', per_page: 8 })` server-side for any featured product sections. Pass to child components that need product data. Keep all static sections (hero, categories grid, Why Shop With Us, CTAs) unchanged.

- [ ] **Step 4: Image rendering — handle legacy local paths**

Add a utility function `getProductImageSrc(storagePath: string): string`:
- If `storagePath` starts with `/` or `mock://`: return the path as-is (or a placeholder for mock paths)
- Otherwise: return a Supabase signed URL (stubbed to return a placeholder URL in MockAdapter mode)

Apply this in `ShopClient.tsx` and anywhere product images are rendered.

- [ ] **Step 5: Verify Review Focus item 3 (empty catalog)**

Add to `tests/unit/mock-adapter.test.ts`:
```typescript
// test: listProducts({ status: 'published' }) with all products archived returns { data: [], total: 0 }
```

Run: `npx vitest run tests/unit/mock-adapter.test.ts`
Expected: PASS.

- [ ] **Step 6: Verify build and confirm existing product count**

```bash
npm run typecheck && npm run build
```

Confirm `/shop` still renders 16 products (from MockAdapter seed = same as before).

- [ ] **Step 7: Commit**

```bash
git add src/components/shop/ShopClient.tsx src/app/shop/page.tsx src/app/page.tsx
git commit -m "feat: integrate public shop with DataAdapter (MockAdapter in dev, Supabase when live)"
```

---

## Task 16: Vitest Unit Tests

**Files:**
- Modify: `tests/unit/mock-adapter.test.ts` (complete all remaining tests)
- Modify: `tests/unit/validations.test.ts` (complete all remaining tests)
- Create: `tests/unit/auth-guard.test.ts`

**Interfaces:**
- Consumes: all previous tasks' exported functions and types

- [ ] **Step 1: Complete `tests/unit/auth-guard.test.ts`**

```typescript
// test: requireAdmin in mock mode returns dev session without real Supabase
// test: getAdminSession returns null when no SUPABASE env vars and not in dev mock mode
//       (simulate by overriding NODE_ENV to 'production' in test)
// test: setProductStatusAction called without session redirects to login
//       (mock requireAdmin to throw redirect, verify catch)
```

- [ ] **Step 2: Run all unit tests**

```bash
npx vitest run tests/unit/
```
Expected: all tests PASS. Document total count.

- [ ] **Step 3: Verify full check script**

```bash
npm run check
```
Expected: lint 0 errors, typecheck 0 errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/
git commit -m "test: complete unit test suite for adapter, validations, and auth guards"
```

---

## Task 17: Playwright E2E Tests

**Files:**
- Create: `tests/e2e/admin-auth.spec.ts`
- Create: `tests/e2e/admin-products.spec.ts`
- Create: `tests/e2e/public-sync.spec.ts`
- Create: `tests/e2e/form-inquiries.spec.ts`

**Interfaces:**
- Consumes: running dev server (`npm run dev`); MockAdapter (no Supabase needed)

- [ ] **Step 1: Configure Playwright for local dev server**

Check `playwright.config.ts` exists. If not, create it with `webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: true }` and `baseURL: 'http://localhost:3000'`.

- [ ] **Step 2: Write `tests/e2e/admin-auth.spec.ts`**

```typescript
// test: GET /admin redirects to /admin/login when not authenticated
// test: GET /admin/products redirects to /admin/login when not authenticated
// test: login page renders email and password fields
// test: mock login (any credentials in dev mode) redirects to /admin dashboard
// test: /admin dashboard shows stats cards after login
// test: logout button redirects to /admin/login
```

- [ ] **Step 3: Write `tests/e2e/admin-products.spec.ts`**

```typescript
// test: /admin/products shows product table with 16 rows (mock seed)
// test: clicking "New Product" navigates to /admin/products/new
// test: creating a product with valid data redirects to /admin/products
// test: creating a product with empty name shows validation error
// test: editing a product changes its name in the table
// test: setting a product to "archived" removes it from the published list
// test: "Archive" action on a published product updates its status badge
```

- [ ] **Step 4: Write `tests/e2e/public-sync.spec.ts`**

```typescript
// test: /shop renders product grid with 16 items (all published in mock)
// test: after archiving a product via admin, /shop no longer shows it
//       (page.goto('/shop') after archiving — relies on revalidatePath)
// test: creating a new product and publishing it makes it visible at /shop
// test: /shop empty-state renders when all products are archived
```

- [ ] **Step 5: Write `tests/e2e/form-inquiries.spec.ts`**

```typescript
// test: Quick Inquiry form submission shows success state
// test: Contact form submission shows "Message Sent!" success state
// test: Sell form submission shows "Request Received!" success state
// test: submitted inquiry appears in /admin/inquiries inbox
// test: inquiry status can be changed from "new" to "read" via admin
```

- [ ] **Step 6: Run E2E tests**

```bash
npx playwright test
```
Expected: all tests pass. If any fail, fix root cause before proceeding. Do not skip or comment out failing tests.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/ playwright.config.ts
git commit -m "test: add Playwright e2e suite for admin auth, product CRUD, public sync, and form wiring"
```

---

## Task 18: Final Documentation + Progress Update

**Files:**
- Modify: `docs/PROGRESS.md`
- Modify: `docs/ADMIN_BACKLOG.md`
- Modify: `docs/ADMIN_AUDIT.md` (add test results)
- Modify: `memory/MEMORY.md`

**Interfaces:**
- Consumes: results of all previous tasks

- [ ] **Step 1: Run full validation and record results**

```bash
npm run check && npx playwright test
```

Record: lint status, TS error count, Vitest test count + pass/fail, Playwright test count + pass/fail, build route count.

- [ ] **Step 2: Update `docs/PROGRESS.md`**

Add Phase 4 section. Record: completed tasks, test results, what is IMPLEMENTED, what is TESTED, what is PENDING (Supabase connection, sell-form image attachments, real announcement bar from settings, i18n), what is BLOCKED (Supabase credentials — list exact env vars). Update "Next safe task" to: "Connect Supabase: create project, copy env vars, run `supabase db push`, run seed."

- [ ] **Step 3: Update `docs/ADMIN_BACKLOG.md`**

Move completed tasks to IMPLEMENTED. Leave in PENDING: SupabaseAdapter implementation, sell-form image attachments, settings → live UI integration, i18n, B2B customer accounts, special pricing. Mark BLOCKED items with the env vars needed.

- [ ] **Step 4: Update memory**

Update `memory/MEMORY.md` Phase section and Implementation Status section to reflect Corte 2 completion.

- [ ] **Step 5: Final commit**

```bash
git add docs/ memory/
git commit -m "docs: update progress, backlog, and audit for Corte 2 admin panel completion"
```
