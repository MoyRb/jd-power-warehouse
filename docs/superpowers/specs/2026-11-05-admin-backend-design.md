# Design: JD Power Warehouse — Admin Panel & Backend (Corte 2)

Date: 2026-11-05
Status: APPROVED — 2026-11-05

## Intent and Why

The public store is visually complete but entirely static: 16 products are hardcoded in a TypeScript file. The business owner needs to manage inventory, pricing, images, and customer inquiries without touching code. This design establishes the backend layer (Supabase schema + RLS + Server Actions) and the admin panel (/admin/*) that powers it, while keeping the approved public UI unchanged.

## Goals

- Owner can create, edit, publish, unpublish, and archive products from a web UI.
- Owner can manage categories and stock levels.
- Owner can read and triage customer inquiries (Quick Inquiry form submissions).
- Public catalog reads from the database; a published product appears in the shop automatically.
- Admin routes are inaccessible to unauthenticated users — enforced server-side, not just client-side.
- All writes are authorized via Supabase Auth + RLS, never via client-supplied role claims.
- Application is fully buildable and testable before Supabase credentials exist.

## Non-Goals

- Multi-tenancy (single store only; schema is extensible but not multi-tenant now).
- Cart, checkout, payments, shipping, taxes, invoicing.
- Customer-facing accounts or B2B approval workflows.
- EN/ES i18n (deferred).
- Real-time inventory reservation.

## Anti-Goals (failure conditions)

- Admin UI that only looks functional but doesn't actually persist data when Supabase is connected.
- RLS policies disabled or set to "allow all" to resolve errors.
- Authorization based on `user_metadata` (editable by users).
- Credentials committed to source control.
- Public shop broken or visually regressed.

## Constraints

- No new runtime dependencies beyond what is already installed.
- Supabase is not yet connected; a data-adapter pattern isolates the connection.
- TypeScript strict mode; ESLint 0 errors must be maintained throughout.
- Production build must remain green after every phase.

## Approach Selected: Schema-First, Deferred Connection (Option A)

### Options considered

**Option A — Schema-first, deferred connection (selected)**
Build all SQL migrations, RLS policies, Server Actions, and admin UI code now.
A `DataAdapter` interface abstracts the data source; a `MockAdapter` enables
local development and testing. Connecting a real Supabase project is a single
env-var + migration step.

Trade-off: admin UI is functional locally but does not persist across server
restarts until Supabase is connected.

**Option B — Supabase CLI local**
Requires Docker. Blocked if Docker is unavailable. Not selected.

**Option C — Documentation only**
Leaves too much work deferred. Not selected.

## Architecture

### Module boundaries

```
src/
  app/
    (public)/          — existing public routes (untouched)
    admin/             — NEW: admin panel routes
      login/
      (dashboard)/     — layout with sidebar, auth guard
        page.tsx       — dashboard
        products/
        categories/
        inventory/
        inquiries/
        settings/
  lib/
    db/                — NEW: data adapter
      adapter.ts       — DataAdapter interface
      mock-adapter.ts  — in-memory implementation (dev/test)
      supabase-adapter.ts — real implementation (needs env vars)
      index.ts         — exports active adapter based on env
    auth/              — NEW: session utilities (server-side)
    validations/       — NEW: Zod schemas for all mutations
  components/
    admin/             — NEW: admin-only UI components
```

### Database schema (PostgreSQL / Supabase)

**Table: categories**
```sql
id          uuid primary key default gen_random_uuid()
name        text not null unique
slug        text not null unique
sort_order  int not null default 0
created_at  timestamptz default now()
```

**Table: products**
```sql
id            uuid primary key default gen_random_uuid()
sku           text unique
name          text not null
description   text
price         numeric(10,2) not null check (price >= 0)
original_price numeric(10,2) check (original_price >= 0)
category_id   uuid references categories(id)
status        text not null default 'draft'
              check (status in ('draft','published','archived'))
badge         text check (badge in ('Sale','New'))
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

**Table: product_images**
```sql
id          uuid primary key default gen_random_uuid()
product_id  uuid references products(id) on delete cascade
storage_path text not null       -- Supabase Storage object path
alt_text    text
sort_order  int not null default 0
created_at  timestamptz default now()
```

**Table: inventory**
```sql
id          uuid primary key default gen_random_uuid()
product_id  uuid references products(id) on delete cascade unique
quantity    int not null default 0 check (quantity >= 0)
updated_at  timestamptz default now()
```

**Table: inventory_movements**
```sql
id          uuid primary key default gen_random_uuid()
product_id  uuid references products(id)
delta       int not null          -- positive = restock, negative = adjustment
reason      text
admin_id    uuid references auth.users(id)
created_at  timestamptz default now()
```

**Table: inquiries**
```sql
id          uuid primary key default gen_random_uuid()
type        text not null
            check (type in ('quick_inquiry','contact','sell_request'))
name        text not null
email       text not null
phone       text
message     text not null
-- sell_request extras
item_name       text
item_description text
item_condition  text
asking_price    numeric(10,2)
-- status
status      text not null default 'new'
            check (status in ('new','read','replied','archived'))
ip_hash     text           -- for rate-limiting, never raw IP stored
created_at  timestamptz default now()
```

Each form type maps to its own `type` value. All three existing forms
(`/` Quick Inquiry, `/contact`, `/sell`) will be wired to this table via
Server Actions. Sell-specific fields (item_name, condition, asking_price)
are nullable and only populated for `sell_request` rows.

**Table: admin_users**
```sql
id      uuid primary key references auth.users(id) on delete cascade
role    text not null default 'admin'
        check (role in ('admin','super_admin'))
```

**Table: audit_log**
```sql
id          uuid primary key default gen_random_uuid()
admin_id    uuid references auth.users(id)
table_name  text not null
record_id   uuid not null
action      text not null   -- 'create','update','delete','publish','archive'
old_data    jsonb
new_data    jsonb
created_at  timestamptz default now()
```

**Table: store_settings**
```sql
key     text primary key
value   jsonb not null
updated_at timestamptz default now()
```

### RLS policy summary

| Table | Anon read | Anon write | Admin read | Admin write |
|---|---|---|---|---|
| categories | yes | no | yes | yes |
| products | published only | no | all | yes |
| product_images | published only | no | all | yes |
| inventory | published only (qty) | no | all | yes |
| inventory_movements | no | no | yes | yes |
| inquiries | no | insert only | yes | yes |
| admin_users | no | no | own row | no |
| audit_log | no | no | yes | no |
| store_settings | yes | no | yes | yes |

Admin = `auth.uid() IN (SELECT id FROM admin_users)` — never `user_metadata`.

### Auth model

- Supabase Auth handles sessions (email+password, JWT cookie via `@supabase/ssr`).
- `admin_users` table is the authority for admin access; created by super_admin or via SQL.
- Server Components and middleware read session server-side; never trust client-supplied identity.
- Middleware (`src/middleware.ts`) redirects unauthenticated requests to `/admin/login`.

### Image upload flow

1. Admin selects file(s) in product form.
2. Client validates: type must be `image/jpeg`, `image/png`, or `image/webp`; size ≤ 5 MB.
3. Server Action validates again (Zod + MIME re-check).
4. File uploaded to Supabase Storage bucket `product-images` (non-public; signed URLs).
5. `product_images` row created with `storage_path`.
6. Public URL generated via signed URL at read time.

### DataAdapter interface

```typescript
interface DataAdapter {
  // Products
  listProducts(filter?: ProductFilter): Promise<Product[]>
  getProduct(id: string): Promise<Product | null>
  createProduct(data: CreateProductInput): Promise<Product>
  updateProduct(id: string, data: UpdateProductInput): Promise<Product>
  deleteProduct(id: string): Promise<void>
  setProductStatus(id: string, status: ProductStatus): Promise<Product>

  // Categories
  listCategories(): Promise<Category[]>
  createCategory(data: CreateCategoryInput): Promise<Category>
  updateCategory(id: string, data: UpdateCategoryInput): Promise<Category>

  // Inventory
  getInventory(productId: string): Promise<InventoryRecord>
  adjustInventory(productId: string, delta: number, reason: string): Promise<void>

  // Inquiries
  listInquiries(filter?: InquiryFilter): Promise<Inquiry[]>
  updateInquiryStatus(id: string, status: InquiryStatus): Promise<void>

  // Images
  uploadImage(productId: string, file: File): Promise<ProductImage>
  deleteImage(imageId: string): Promise<void>
  reorderImages(productId: string, imageIds: string[]): Promise<void>
}
```

### Admin panel routes

| Route | Purpose |
|---|---|
| /admin/login | Email + password form, Supabase Auth |
| /admin | Dashboard: product count, low stock alerts, unread inquiries |
| /admin/products | Paginated table with status/category filters, bulk actions |
| /admin/products/new | Create product form |
| /admin/products/[id]/edit | Edit product + images + stock |
| /admin/categories | List + inline edit/create |
| /admin/inventory | Stock levels table, adjustment modal |
| /admin/inquiries | Inquiry list with status management |
| /admin/settings | Store name, contact info, announcement bar text |

### Public store integration

`src/data/products.ts` is replaced by a server-side data fetch:
- `src/app/shop/page.tsx` calls `adapter.listProducts({ status: 'published' })`.
- `src/app/page.tsx` (homepage categories + featured) does the same.
- Static generation is preserved where possible; ISR with 60s revalidation when Supabase is live.
- During mock mode, the existing 16 products are returned from `MockAdapter`.

## Implementation order

1. `docs/ADMIN_AUDIT.md` — full audit of current state.
2. `docs/ADMIN_ARCHITECTURE.md` — this design distilled.
3. `supabase/migrations/001_initial_schema.sql` — full schema.
4. `supabase/migrations/002_rls_policies.sql` — all RLS policies.
5. `supabase/seed.sql` — seed with current 16 products + categories.
6. DataAdapter interface + MockAdapter.
7. Zod validation schemas.
8. Auth utilities + middleware.
9. Admin layout + sidebar + login page.
10. Products CRUD (table → new → edit).
11. Image upload component.
12. Categories management.
13. Inventory management.
14. Inquiries list.
15. Settings page.
16. Public store integration (replace static data with adapter).
17. Vitest unit tests (adapter, validations, auth guards).
18. Playwright e2e tests (auth flow, product CRUD, public sync).
19. `docs/ADMIN_BACKLOG.md` — remaining work.
20. `docs/PROGRESS.md` update.

## Security checklist

- [ ] Middleware enforces auth on all /admin/* routes server-side.
- [ ] Every Server Action re-validates session and role.
- [ ] RLS enforced at DB level independent of app logic.
- [ ] `admin_users` populated only via authenticated super_admin or direct SQL.
- [ ] No `user_metadata` used for authorization.
- [ ] Zod validates all inputs before DB writes.
- [ ] Image uploads validated server-side (type + size).
- [ ] Supabase Storage bucket is private; signed URLs only.
- [ ] No credentials in source code or committed env files.
- [ ] Audit log written for all product status changes and inventory adjustments.
- [ ] Playwright negative tests: anon cannot write, non-admin cannot access /admin/*.

## Approved architectural decisions (2026-11-05)

- **T2 — Archive-only**: No hard-delete at any role level in this phase. Products move draft → published → archived. Archived products are hidden from public catalog but retain all data and inventory history.
- **T3 — All three forms feed inquiries**: Quick Inquiry (`/`), Contact (`/contact`), and Sell Your Items (`/sell`) each create an `inquiry` row with `type` discriminator. Existing visual design and responsive behavior are preserved; only the form submission logic changes.
- **B2B extensibility**: Schema is modular with clear domain boundaries (catalog, inventory, inquiries, auth, settings). No multi-tenancy now, but no structural blockers to adding it. Index strategy and pagination built in from the start. Customer/company and special-pricing models are reserved in architecture but not implemented.

## Open builder decisions (marked as my calls)

- **MockAdapter resets on server restart** (acceptable; explicitly documented as dev-only).
- **Signed URL TTL: 1 hour** (reasonable default; configurable via store_settings later).
- **Pagination: 20 items per page** (standard default).
- **Admin design language**: dark sidebar (#141414) + gold accents (#F3C41B) matching brand, clean table layout.
- **ISR revalidation: 60 seconds** (balances freshness vs. cost; tunable).
