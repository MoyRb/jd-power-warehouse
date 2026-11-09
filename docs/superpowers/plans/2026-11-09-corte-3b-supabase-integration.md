# Corte 3B — Supabase Real Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full SupabaseAdapter (replacing the stub), add integration tests against the real JDHOUSE DB, and validate end-to-end: auth, CRUD, storage, RLS restrictions, and all existing test suites.

**Architecture:** A single `getServiceRoleClient()` helper (server-only) provides a service-role Supabase client used by all SupabaseAdapter methods. The DataAdapter interface contract is unchanged — only the implementation in `supabase-adapter.ts` changes. Integration tests live in `tests/integration/` and are guarded by `skipIf(!NEXT_PUBLIC_SUPABASE_URL)` so they only run when credentials are available. Existing unit and E2E suites remain unchanged.

**Tech Stack:** `@supabase/supabase-js` v2, `@supabase/ssr` (auth only), Vitest, Playwright, TypeScript strict.

**Spec:** User spec delivered in conversation (Corte 3B instructions, 2026-11-09).

## Global Constraints

- Never hardcode credentials; all keys read from `process.env.*`.
- `ADMIN_DEV_BYPASS` must NOT be set when running integration/E2E tests for Supabase validation.
- DB schema is fixed — no new migrations to remote; use existing tables exactly as defined in `supabase/migrations/`.
- `price` and `original_price` returned as numeric strings by Supabase JS v2 — cast to `Number()` in mapper.
- Storage bucket name: `product-images` (kebab-case).
- Vitest unit suite stays at `tests/unit/**` — integration suite is a separate include path.
- Playwright webServer starts with `ADMIN_DEV_BYPASS=true` — do NOT change `playwright.config.ts`.
- TypeScript strict mode; no `any` without explicit cast comment.

## Review Focus

1. **RLS anon-INSERT on products** — anon client must NOT be able to insert products; expect Supabase error `42501`.
2. **Service role bypasses RLS** — service role client CAN read draft/archived products; verify by creating a draft and reading it back.
3. **adjustInventory atomicity** — if the inventory UPDATE succeeds but movement INSERT fails (e.g. constraint), quantity is left correct; test that delta is correctly bounded at zero.
4. **store_settings is_public filter** — anon client can only read rows with `is_public = true`; `contact_email` must NOT appear in anon SELECT.
5. **uploadImage bucket auto-create** — if the `product-images` bucket does not yet exist, `uploadImage` creates it; subsequent calls do not error.

---

## Task 1: Service-role Supabase client helper

**Files:**
- Create: `src/lib/db/supabase-client.ts`

**Interfaces:**
- Produces: `getServiceRoleClient(): SupabaseClient` — returns a singleton service-role client, throws `Error('SUPABASE_NOT_CONFIGURED')` if env vars missing.

- [ ] **Step 1: Create `src/lib/db/supabase-client.ts`**

  Implement `getServiceRoleClient()`:
  - Import `createClient` from `@supabase/supabase-js`
  - Require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; throw `Error('SUPABASE_NOT_CONFIGURED')` if either is absent
  - Create client with `auth: { persistSession: false, autoRefreshToken: false }`
  - Cache in a module-level variable (singleton); return cached instance on subsequent calls

- [ ] **Step 2: Verify TypeScript compiles**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

---

## Task 2: SupabaseAdapter — data operations

**Files:**
- Modify: `src/lib/db/supabase-adapter.ts` (full rewrite — currently all stubs)

**Interfaces:**
- Consumes: `getServiceRoleClient()` from `./supabase-client`
- Produces: all 15 DataAdapter data methods implemented

**DB shape → type mapping (mapper, used by both listProducts and getProduct):**
```ts
function mapProduct(raw: Record<string, unknown>): Product {
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
    quantity: (raw.inventory as { quantity: number } | null)?.quantity ?? 0,
    images: (raw.product_images as ProductImage[] | null)
      ?.sort((a, b) => a.sort_order - b.sort_order) ?? [],
    category: raw.categories as Category | null ?? undefined,
  }
}
```

- [ ] **Step 1: Implement `listProducts(filter?)`**

  Query: `supabase.from('products').select('*, categories(*), product_images(*), inventory(*)')`
  - Apply `.eq('status', filter.status)` if `filter.status` defined
  - Apply `.eq('category_id', filter.category_id)` if set
  - Apply `.or('name.ilike.%q%,description.ilike.%q%')` for search, where `q = filter.search`
  - Pagination: `.range(start, start + perPage - 1)` where `start = (page-1)*perPage`; use `.count('exact')` to get `total`
  - Return `{ data: rows.map(mapProduct), total, page, per_page: perPage }`

- [ ] **Step 2: Implement `getProduct(id)`**

  Query with same select, `.eq('id', id).single()`; return `mapProduct(data)` or `null` if error/not found.

- [ ] **Step 3: Implement `createProduct(data)`**

  - INSERT into `products`; on success INSERT into `inventory(product_id, quantity)` with `quantity: 0`
  - Return `getProduct(newId)` to include joined fields

- [ ] **Step 4: Implement `updateProduct(id, data)` and `setProductStatus(id, status)`**

  - `updateProduct`: UPDATE products WHERE id; return `getProduct(id)`
  - `setProductStatus`: delegate to `updateProduct(id, { status })`

- [ ] **Step 5: Implement category methods**

  - `listCategories`: SELECT from `categories` ORDER BY `sort_order`
  - `createCategory`: INSERT; return inserted row
  - `updateCategory`: UPDATE WHERE id; return updated row

- [ ] **Step 6: Implement inventory methods**

  - `getInventory(productId)`: SELECT from `inventory` WHERE `product_id`; return row or null
  - `adjustInventory(productId, delta, reason)`:
    1. `getInventory(productId)` → currentQty (default 0)
    2. `newQty = Math.max(0, currentQty + delta)`
    3. UPSERT `inventory` ON CONFLICT(product_id) DO UPDATE SET quantity, updated_at
    4. INSERT into `inventory_movements(product_id, delta, reason, admin_id: null)`
    5. Return updated InventoryRecord

- [ ] **Step 7: Implement inquiry methods**

  - `listInquiries(filter?)`: SELECT with optional `.eq('status')`, `.eq('type')`; ORDER BY `created_at DESC`; paginate
  - `createInquiry(data)`: INSERT; return inserted row
  - `updateInquiryStatus(id, status)`: UPDATE WHERE id

- [ ] **Step 8: Implement settings methods**

  - `listSettings`: SELECT all from `store_settings`; return `Object.fromEntries(rows.map(r => [r.key, r.value]))`
  - `getSetting(key)`: SELECT WHERE key; return `row.value` or `null`
  - `setSetting(key, value)`: UPSERT `store_settings(key, value)` ON CONFLICT(key) DO UPDATE SET value

- [ ] **Step 9: Verify TypeScript compiles**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

---

## Task 3: SupabaseAdapter — Storage / Images

**Files:**
- Modify: `src/lib/db/supabase-adapter.ts` (complete the remaining 3 image methods)

**Interfaces:**
- Storage bucket: `product-images`
- Storage path pattern: `{productId}/{imageId}.{ext}` where ext derived from `file.type` (`image/jpeg`→`jpg`, `image/png`→`png`, `image/webp`→`webp`)

- [ ] **Step 1: Implement `uploadImage(productId, file)`**

  Validation (same as MockAdapter):
  - Reject if `file.type` not in `['image/jpeg','image/png','image/webp']` → throw `Error('INVALID_TYPE')`
  - Reject if `file.size > 5 * 1024 * 1024` → throw `Error('FILE_TOO_LARGE')`

  Ensure bucket exists: `supabase.storage.createBucket('product-images', { public: true })` — ignore error if bucket already exists (`Duplicate` error code from Supabase).

  Upload:
  - Generate `imageId = randomUUID()`
  - `storagePath = `{productId}/{imageId}.{ext}``
  - `supabase.storage.from('product-images').upload(storagePath, file.buffer, { contentType: file.type })`
  - On upload error, throw the error message

  Insert record:
  - INSERT into `product_images(product_id, storage_path, alt_text, sort_order)`
  - `sort_order` = count of existing images for this product
  - Return the inserted `ProductImage`

- [ ] **Step 2: Implement `deleteImage(imageId)`**

  - SELECT `product_images WHERE id` to get `storage_path`
  - DELETE from `product_images WHERE id`
  - `supabase.storage.from('product-images').remove([storagePath])`

- [ ] **Step 3: Implement `reorderImages(productId, imageIds)`**

  - For each `(imageId, index)` in `imageIds`: UPDATE `product_images SET sort_order = index WHERE id = imageId AND product_id = productId`
  - Use `Promise.all(...)` for parallel updates

- [ ] **Step 4: Final TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 5: Lint check**

  Run: `npx eslint src`
  Expected: 0 errors

---

## Task 4: Integration test suite

**Files:**
- Modify: `vitest.config.ts` (add integration include path)
- Create: `tests/integration/supabase-adapter.smoke.test.ts`
- Create: `tests/integration/rls-negative.test.ts`

**Interfaces:**
- Consumes: `SupabaseAdapter` from `../../src/lib/db/supabase-adapter`
- Consumes: `createClient` from `@supabase/supabase-js` (for RLS negative tests using anon key)

- [ ] **Step 1: Update `vitest.config.ts`**

  Change `include` to: `['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts']`

- [ ] **Step 2: Write `tests/integration/supabase-adapter.smoke.test.ts`**

  Guard entire suite with:
  ```ts
  const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  describe.skipIf(!HAS_SUPABASE)('SupabaseAdapter smoke tests', () => { ... })
  ```

  Tests (each creates test data with prefix `[e2e-test]` and cleans up in afterAll):
  - `listCategories returns array` — expect `result.length >= 0` (may be empty on fresh DB)
  - `createProduct → getProduct round-trip` — create product named `'[test] E2E Widget'`, price `1.00`, status `'draft'`; getProduct(id) → verify name, price, status, quantity=0
  - `updateProduct changes name` — update the product from above; verify new name persists
  - `setProductStatus published → archived` — set status; getProduct → verify `status === 'archived'`
  - `listProducts status filter` — listProducts({ status: 'archived' }) → find the test product
  - `adjustInventory increases quantity` — adjustInventory(productId, 5, '[test] restock'); getInventory → quantity === 5
  - `adjustInventory bounded at zero` — adjustInventory(productId, -100, '[test] over-drain'); quantity === 0
  - `createInquiry stores contact type` — createInquiry({ type: 'contact', name: '[test] Tester', email: 'test@example.com', message: 'test', phone: null }); verify id returned
  - `listSettings returns object` — expect `typeof result === 'object'`
  - `setSetting → getSetting round-trip` — setSetting('[test]_key', 'hello'); getSetting('[test]_key') → 'hello'

  afterAll: delete test products (by id), delete inquiry (by id), delete test setting (via service role).

- [ ] **Step 3: Write `tests/integration/rls-negative.test.ts`**

  Guard with same `HAS_SUPABASE` check.

  Uses anon client: `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`

  Tests:
  - `anon cannot INSERT into products` — `anonClient.from('products').insert({ name: 'hack', price: 1, status: 'published' })`; expect `error` to be truthy (RLS violation)
  - `anon SELECT products returns only published` — expect all returned rows to have `status === 'published'`
  - `anon cannot read contact_email setting` — query `store_settings WHERE key = 'contact_email'`; expect `data` to be empty array (is_public = false)
  - `anon can INSERT inquiry` — `anonClient.from('inquiries').insert({ type: 'contact', name: 'anon-test', email: 'anon@example.com', message: 'rls test' })`; expect no error
  - `anon cannot SELECT from admin_users` — expect error or empty result (own row policy; anon has no row)

- [ ] **Step 4: Run integration tests**

  Run: `npx vitest run --config vitest.config.ts`
  Expected: all unit tests pass; integration tests pass if `NEXT_PUBLIC_SUPABASE_URL` set, otherwise skipped.

---

## Task 5: Full validation sweep

**Files:**
- No code changes — verification only

- [ ] **Step 1: Lint**

  Run: `npx eslint src`
  Expected: 0 errors, 0 warnings

- [ ] **Step 2: TypeScript strict**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 3: Vitest unit + integration**

  Run: `npx vitest run`
  Expected: 41+ unit tests pass; integration tests pass

- [ ] **Step 4: Next.js build**

  Run: `npx next build`
  Expected: clean build, 0 errors, all routes compiled

- [ ] **Step 5: Dev server smoke test (Supabase mode)**

  Run dev server WITHOUT `ADMIN_DEV_BYPASS`:
  ```
  npm run dev -- --port 3002
  ```
  Verify manually:
  - `GET /shop` returns real products from Supabase
  - `GET /admin` → redirects to `/admin/login` (no session)
  - Login with real admin credentials → dashboard loads with real data

---

## Task 6: Update PROGRESS.md

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Append Corte 3B section to PROGRESS.md**

  Include:
  - Date (2026-11-09)
  - What was implemented (SupabaseAdapter full implementation, storage, integration tests)
  - Test results (unit count, integration count, lint, build)
  - Open issues/blockers if any
  - Next safe task (Corte 4 or deployment prep)
