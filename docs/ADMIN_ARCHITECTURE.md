# JD Power Warehouse — Admin Architecture

Date: 2026-11-05
Status: Approved design — Corte 2

## Overview

Modular monolith. Single-store B2B administration. Extensible without
multi-tenancy today. All auth and authorization enforced server-side.
Public store and admin panel share one data layer via the DataAdapter
interface.

---

## Module Boundaries

```
┌──────────────────────────────────────────────────────┐
│  Public Store (existing — /app/(public)/)            │
│  / /shop /sell /contact /testimonials /about /legal  │
│  Reads: published products, categories               │
│  Writes: inquiries (via Server Action)               │
└───────────────────┬──────────────────────────────────┘
                    │ DataAdapter interface
┌───────────────────▼──────────────────────────────────┐
│  Data Layer (src/lib/db/)                            │
│  DataAdapter interface                               │
│  MockAdapter  — dev/test, no Supabase needed         │
│  SupabaseAdapter — production, requires env vars     │
└───────────────────┬──────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────┐
│  Admin Panel (/app/admin/)                           │
│  Protected by middleware + requireAdmin()            │
│  /admin /admin/products /admin/categories            │
│  /admin/inventory /admin/inquiries /admin/settings   │
│  /admin/login (unprotected)                          │
│  Reads + Writes: all data                            │
└──────────────────────────────────────────────────────┘
```

---

## Database Schema

### categories
```sql
id          uuid pk default gen_random_uuid()
name        text not null unique
slug        text not null unique
sort_order  int not null default 0
created_at  timestamptz default now()
```

### products
```sql
id             uuid pk default gen_random_uuid()
sku            text unique
name           text not null
description    text
price          numeric(10,2) not null check (price >= 0)
original_price numeric(10,2) check (original_price >= 0)
category_id    uuid references categories(id)
status         text not null default 'draft'
               check (status in ('draft','published','archived'))
badge          text check (badge in ('Sale','New'))
created_at     timestamptz default now()
updated_at     timestamptz default now()
```

### product_images
```sql
id           uuid pk default gen_random_uuid()
product_id   uuid references products(id) on delete cascade
storage_path text not null
alt_text     text
sort_order   int not null default 0
created_at   timestamptz default now()
```

### inventory
```sql
id          uuid pk default gen_random_uuid()
product_id  uuid references products(id) on delete cascade unique
quantity    int not null default 0 check (quantity >= 0)
updated_at  timestamptz default now()
```

### inventory_movements
```sql
id          uuid pk default gen_random_uuid()
product_id  uuid references products(id)
delta       int not null
reason      text
admin_id    uuid references auth.users(id)
created_at  timestamptz default now()
```

### inquiries
```sql
id               uuid pk default gen_random_uuid()
type             text not null check (type in ('quick_inquiry','contact','sell_request'))
name             text not null
email            text not null
phone            text
message          text not null
-- sell_request extras
item_name        text
item_description text
item_condition   text
asking_price     numeric(10,2)
-- meta
status           text not null default 'new'
                 check (status in ('new','read','replied','archived'))
ip_hash          text
created_at       timestamptz default now()
```

### admin_users
```sql
id   uuid pk references auth.users(id) on delete cascade
role text not null default 'admin'
     check (role in ('admin','super_admin'))
```

### audit_log
```sql
id          uuid pk default gen_random_uuid()
admin_id    uuid references auth.users(id)
table_name  text not null
record_id   uuid not null
action      text not null
old_data    jsonb
new_data    jsonb
created_at  timestamptz default now()
```

### store_settings
```sql
key        text pk
value      jsonb not null
updated_at timestamptz default now()
```

---

## RLS Policy Summary

| Table | Anon read | Anon write | Admin read | Admin write |
|---|---|---|---|---|
| categories | yes (all) | no | yes | yes |
| products | published only | no | all | yes |
| product_images | published products only | no | all | yes |
| inventory | published products only | no | all | yes |
| inventory_movements | no | no | yes | yes |
| inquiries | no | INSERT only | yes | yes (status) |
| admin_users | no | no | own row only | no |
| audit_log | no | no | yes | no (trigger only) |
| store_settings | yes | no | yes | yes |

Admin check: `auth.uid() IN (SELECT id FROM admin_users)` — never `user_metadata`.

---

## Auth Model

- **Provider**: Supabase Auth (email + password)
- **Session**: JWT cookie via `@supabase/ssr createServerClient`
- **Admin authority**: `admin_users` table, populated via SQL or super_admin
- **Middleware**: `src/middleware.ts` — redirects unauthenticated requests on `/admin/*` to `/admin/login`
- **Server Actions**: each calls `requireAdmin()` before any DB operation
- **Dev mode**: MockAdapter returns a hardcoded dev session when no env vars exist and `NODE_ENV !== 'production'`
- **First admin bootstrap**: run SQL `INSERT INTO admin_users(id, role) VALUES ('<auth_user_id>', 'super_admin')` after creating first user via Supabase dashboard

---

## DataAdapter Interface

```typescript
interface DataAdapter {
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

  uploadImage(productId: string, file: ImageFile): Promise<ProductImage>
  deleteImage(imageId: string): Promise<void>
  reorderImages(productId: string, imageIds: string[]): Promise<void>
}
```

Active adapter selected in `src/lib/db/index.ts` based on `NEXT_PUBLIC_SUPABASE_URL` env var.

---

## Image Upload Flow

1. Admin selects file(s) in `ImageUploader` component
2. Client validates: type must be `image/jpeg`, `image/png`, or `image/webp`; size ≤ 5 MB
3. `uploadProductImageAction` Server Action validates again (server-side)
4. MockAdapter: stores mock path `mock://product-images/{productId}/{uuid}`
5. SupabaseAdapter: uploads to `product-images` bucket (private); creates `product_images` row
6. Public URLs: local paths (`/images/...`) rendered directly; Supabase paths via signed URL (1-hour TTL)

---

## Admin Panel Routes

| Route | Protection | Purpose |
|---|---|---|
| `/admin/login` | Public | Email + password form |
| `/admin` | requireAdmin | Dashboard: stats cards |
| `/admin/products` | requireAdmin | Products table with status management |
| `/admin/products/new` | requireAdmin | Create product form |
| `/admin/products/[id]/edit` | requireAdmin | Edit product + images + stock inline |
| `/admin/categories` | requireAdmin | Category list with inline edit |
| `/admin/inventory` | requireAdmin | Stock table with adjustment modal |
| `/admin/inquiries` | requireAdmin | Inbox with status management |
| `/admin/settings` | requireAdmin | Store configuration fields |

---

## B2B Extensibility Notes

Schema is single-store today. Future extensions do not require breaking changes:

- `customer_companies` table (B2B accounts) — add as separate module
- `price_tiers` table (special pricing) — `products` table gets FK
- `quotes` table (RFQ flow) — separate domain module
- Multi-tenancy: add `tenant_id` FK to all domain tables + RLS tenant isolation
- None of these conflict with the current schema

---

## Index Strategy

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

---

## Env Vars Required for Supabase Connection

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

None of these are committed. Add to `.env.local` (gitignored).
