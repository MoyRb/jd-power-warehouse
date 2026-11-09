# Product Media Manager (Corte 3D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the React Fragment key warning in InquiriesTable, resolve broken Supabase Storage image URLs, add alt-text editing, upgrade ImageUploader to multi-file with preview queue and 10-image limit, add Storage bucket policies migration, wire new-product creation to redirect to the edit page, and create a product detail page with an image gallery.

**Architecture:** Most of the image infrastructure already exists (SupabaseAdapter.uploadImage/deleteImage/reorderImages, server actions, ImageUploader component). This plan fixes what's broken (Fragment key, Storage URL construction), adds the one missing DataAdapter method (updateImageAltText), upgrades the ImageUploader to match the full spec, and adds the product-detail page. No new npm dependencies.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, `@supabase/ssr`, Vitest.

**Spec:** User spec delivered in conversation (Corte 3D Product Media Manager, 2026-11-09).

## Global Constraints

- No new npm dependencies — all UI via Tailwind CSS.
- `requireAdmin()` before every image write operation (already enforced; keep).
- Maximum **10 images** per product — enforced in `uploadProductImageAction` AND client UI.
- Maximum **5 MB** per file (already enforced; keep).
- Allowed types: `image/jpeg`, `image/png`, `image/webp` (already enforced; keep).
- Primary image = image with lowest `sort_order` (existing contract; keep unchanged).
- Local catalog images under `/images/` must continue to work in catalog and product detail.
- No Storage migration pushed to remote DB; local only.
- No ADMIN_DEV_BYPASS; integration tests use real Supabase credentials when available.
- Language: UI labels in English, code identifiers in English.

## Review Focus

1. **Orphaned Storage file on DB insert failure** — if `SupabaseAdapter.uploadImage` uploads to Storage but the `product_images` insert fails, the file is left orphaned. Must add compensatory `storage.remove` in the catch block after the failed insert.
   → Added to Task 2 SupabaseAdapter step + integration test in Task 6.

2. **10-image limit: exactly at boundary (10 existing, attempt 11th)** — `uploadProductImageAction` must count existing images before accepting the file and return `{ error: 'Maximum 10 images per product' }` on overflow. Client must also disable the upload button when `images.length >= 10`.
   → Added to Task 3 unit test for the action.

3. **`getProductImageSrc` with `NEXT_PUBLIC_SUPABASE_URL` undefined** — must return `null` gracefully, never throw. Supabase storage paths (non-`/`, non-`mock://`, non-`http`) must not produce a broken URL when the env var is missing.
   → Added to Task 2 unit test (`product-image.test.ts`).

4. **Next.js `Image` component with Supabase storage hostname not in `remotePatterns`** — without adding `*.supabase.co` to `remotePatterns`, the production build will produce errors for `<Image src="https://...supabase.co/...">`. Must add this pattern.
   → Added to Task 2 step (modify `next.config.ts`).

5. **Alt text with HTML entities / long strings** — `<img alt="...">` in JSX is naturally escaped; plain-text storage requires no special sanitizer. Supabase `TEXT` column has no length limit; application can store freely. This is a confirmed non-issue — no special handling needed. Note: the `updateImageAltTextAction` accepts any non-null string; empty string is valid (no alt = decorative image).
   → Confirmed no additional test needed; noted in Task 2.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/admin/InquiriesTable.tsx` | Modify | Fix `<>` Fragment key bug |
| `src/lib/product-image.ts` | Modify | Construct proper Supabase Storage public URLs |
| `next.config.ts` | Modify | Add Supabase storage domain to `remotePatterns` |
| `src/lib/db/adapter.ts` | Modify | Add `updateImageAltText` method |
| `src/lib/db/mock-adapter.ts` | Modify | Implement `updateImageAltText` |
| `src/lib/db/supabase-adapter.ts` | Modify | Implement `updateImageAltText` + orphan cleanup in `uploadImage` |
| `src/app/admin/_actions/products.ts` | Modify | Add `updateImageAltTextAction`; `createProductAction` returns `{ id?, error? }` |
| `src/components/admin/ImageUploader.tsx` | Modify | Multi-file preview queue, primary badge, 10-limit, alt text inline edit, per-file status |
| `src/app/admin/(protected)/products/[id]/edit/page.tsx` | Modify | Show `?created=1` success banner |
| `src/app/shop/[id]/page.tsx` | Create | Product detail page with main image + thumbnail gallery |
| `src/components/shop/ShopClient.tsx` | Modify | Product cards link to `/shop/[id]` |
| `supabase/migrations/20261109000002_storage_policies.sql` | Create | Storage bucket creation + RLS policies (local only) |
| `tests/unit/product-image.test.ts` | Create | Unit tests for URL resolution edge cases |
| `tests/unit/image-actions.test.ts` | Create | Unit tests for 10-limit enforcement + alt text action |
| `tests/integration/image-upload.test.ts` | Create | Smoke tests for image operations against JDHOUSE |
| `docs/PROGRESS.md` | Modify | Document Corte 3D |

---

## Task 1: Fix React Fragment key bug + map() audit

**Files:**
- Modify: `src/components/admin/InquiriesTable.tsx`

**Interfaces:**
- Produces: nothing new; pure bug-fix.

**Root cause:** `InquiriesTable.tsx:116` wraps two `<tr>` rows in `<>…</>` inside `.map()`. React requires a stable `key` on the outermost element of each `.map()` call. The fix is `<Fragment key={inquiry.id}>`.

**Audit result (pre-confirmed):** `ProductsTable`, `CategoryList`, and `InventoryTable` use `key` on `<tr>` directly — no Fragment issue in those files.

- [ ] **Step 1: Fix InquiriesTable Fragment**

  In `src/components/admin/InquiriesTable.tsx`, change line 1 import to include `Fragment`:
  ```ts
  import { useState, useTransition, Fragment } from 'react'
  ```
  Then at line ~116, change `<>` → `<Fragment key={inquiry.id}>` and `</>` → `</Fragment>`.
  Remove `key={inquiry.id}` from the inner `<tr>` (the outer Fragment now carries the key).
  Keep `key={\`${inquiry.id}-expanded\`}` on the expanded `<tr>` (sibling disambiguation).

- [ ] **Step 2: Run TypeScript + ESLint**

  Run: `npx tsc --noEmit && npx eslint src`
  Expected: 0 errors

- [ ] **Step 3: Run existing test suite to confirm no regression**

  Run: `npx vitest run tests/unit/`
  Expected: all pass (count same as before this task)

- [ ] **Step 4: Commit**

  ```
  fix: replace bare Fragment with keyed Fragment in InquiriesTable
  ```

---

## Task 2: Fix Storage URL resolution + updateImageAltText + orphan cleanup

**Files:**
- Modify: `src/lib/product-image.ts`
- Modify: `next.config.ts`
- Modify: `src/lib/db/adapter.ts`
- Modify: `src/lib/db/mock-adapter.ts`
- Modify: `src/lib/db/supabase-adapter.ts`
- Modify: `src/app/admin/_actions/products.ts`
- Test: `tests/unit/product-image.test.ts`

**Interfaces:**
- Produces:
  - `getProductImageSrc(storagePath: string): string | null` — now constructs full Supabase public URLs
  - `DataAdapter.updateImageAltText(imageId: string, altText: string): Promise<void>`
  - `updateImageAltTextAction(imageId: string, productId: string, altText: string): Promise<{ error?: string }>`

- [ ] **Step 1: Write failing tests**

  File: `tests/unit/product-image.test.ts`

  ```ts
  it('returns local path unchanged for /images/... paths')
  // getProductImageSrc('/images/catalog/foo.png') === '/images/catalog/foo.png'

  it('returns null for mock:// paths')
  // getProductImageSrc('mock://product-images/x') === null

  it('returns null for empty string')
  // getProductImageSrc('') === null

  it('constructs Supabase public URL for bare storage paths')
  // with NEXT_PUBLIC_SUPABASE_URL='https://abc.supabase.co'
  // getProductImageSrc('prod-id/img-id.jpg') === 'https://abc.supabase.co/storage/v1/object/public/product-images/prod-id/img-id.jpg'

  it('returns null for bare storage path when NEXT_PUBLIC_SUPABASE_URL is undefined')
  // with NEXT_PUBLIC_SUPABASE_URL unset → null, no throw

  it('returns full URL unchanged for already-http paths')
  // getProductImageSrc('https://external.com/img.jpg') === 'https://external.com/img.jpg'
  ```

  Run: `npx vitest run tests/unit/product-image.test.ts`
  Expected: FAIL — `getProductImageSrc` returns raw path for Supabase paths

- [ ] **Step 2: Update `getProductImageSrc` in `src/lib/product-image.ts`**

  Signature (unchanged): `export function getProductImageSrc(storagePath: string): string | null`

  Logic order:
  1. `if (!storagePath) return null`
  2. `if (storagePath.startsWith('/')) return storagePath`
  3. `if (storagePath.startsWith('mock://')) return null`
  4. `if (storagePath.startsWith('http')) return storagePath`
  5. Supabase path: `const url = process.env.NEXT_PUBLIC_SUPABASE_URL; if (!url) return null; return \`${url}/storage/v1/object/public/product-images/${storagePath}\``

- [ ] **Step 3: Run product-image tests — GREEN**

  Run: `npx vitest run tests/unit/product-image.test.ts`
  Expected: all pass

- [ ] **Step 4: Add Supabase storage domain to `next.config.ts` `remotePatterns`**

  Add `images` key with `remotePatterns`:
  ```ts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  ```

- [ ] **Step 5: Add `updateImageAltText` to DataAdapter interface**

  In `src/lib/db/adapter.ts`, under the `// Images` section:
  ```ts
  updateImageAltText(imageId: string, altText: string): Promise<void>
  ```

- [ ] **Step 6: Implement `updateImageAltText` in MockAdapter**

  In `src/lib/db/mock-adapter.ts`:
  ```ts
  async updateImageAltText(imageId: string, altText: string): Promise<void> {
    const img = this.images.get(imageId)
    if (img) this.images.set(imageId, { ...img, alt_text: altText })
  }
  ```

- [ ] **Step 7: Implement `updateImageAltText` in SupabaseAdapter + fix orphan cleanup**

  In `src/lib/db/supabase-adapter.ts`:

  `updateImageAltText`: `supabase.from('product_images').update({ alt_text: altText }).eq('id', imageId)` — throw on error.

  Orphan cleanup in `uploadImage`: in the existing `if (insertError || !data)` block, add before the throw:
  ```ts
  await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
  ```

  Alt text note: JSX escapes `alt` attributes; no sanitizer needed; empty string is valid.

- [ ] **Step 8: Add `updateImageAltTextAction` to `src/app/admin/_actions/products.ts`**

  ```ts
  export async function updateImageAltTextAction(
    imageId: string,
    productId: string,
    altText: string,
  ): Promise<{ error?: string }> {
    await requireAdmin()
    try {
      await db.updateImageAltText(imageId, altText)
      revalidatePath(`/admin/products/${productId}/edit`)
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update alt text' }
    }
  }
  ```

- [ ] **Step 9: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 10: Full unit suite**

  Run: `npx vitest run tests/unit/`
  Expected: all pass

- [ ] **Step 11: Commit**

  ```
  feat: fix Supabase Storage URL construction, add updateImageAltText, fix orphan cleanup
  ```

---

## Task 3: Upgrade ImageUploader (multi-file, preview, primary badge, limit, alt text)

**Files:**
- Modify: `src/components/admin/ImageUploader.tsx`
- Modify: `src/app/admin/_actions/products.ts` (add 10-limit enforcement)
- Test: `tests/unit/image-actions.test.ts`

**Interfaces:**
- Consumes:
  - `updateImageAltTextAction(imageId, productId, altText): Promise<{error?}>`
  - `uploadProductImageAction(productId, formData): Promise<{error?}>`
  - `ProductImage` from `@/lib/db/types`
- Produces: upgraded `ImageUploader` component (same props interface as before)

**New client-side behavior:**
- File input: `multiple` attribute, accepts `image/jpeg,image/png,image/webp`
- On selection: validate each file (type, size) client-side → valid files enter an `uploadQueue` state; invalid files get immediate per-file error
- Each queued item shows: `URL.createObjectURL(file)` thumbnail, file name, status chip (`pending` / `uploading` / `done` / `error: message`)
- Upload sequentially per file; on each file: set status `uploading` → call `uploadProductImageAction` → set `done` or `error`
- Revoke object URLs on cleanup (`URL.revokeObjectURL`)
- Primary badge: first image in `images` array (index 0, lowest sort_order) shows a gold `Primary` label overlaid on the card
- Alt text: each image card shows a pencil icon button; clicking opens an inline `<input type="text">` pre-filled with current `alt_text`; a `Save` button calls `updateImageAltTextAction`; on success updates local state
- 10-image limit: `const isAtLimit = images.length >= 10`; when true, disable "Add Images" button and show "(10/10 — limit reached)" label; pending queue items beyond limit show individual errors

**Client-side state structure:**
```ts
interface QueueItem {
  key: string          // Math.random() temp key
  file: File
  preview: string      // object URL
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}
```

- [ ] **Step 1: Write 10-limit test**

  File: `tests/unit/image-actions.test.ts`

  ```ts
  it('uploadProductImageAction rejects when product already has 10 images', async () => {
    // Mock db.listImages to return 10 images
    // Call uploadProductImageAction with valid file
    // expect result.error === 'Maximum 10 images per product'
  })
  ```

  Note: this test requires mocking `db` — use `vi.mock('@/lib/db', ...)`.

  Run: `npx vitest run tests/unit/image-actions.test.ts`
  Expected: FAIL — no limit enforced yet

- [ ] **Step 2: Enforce 10-limit in `uploadProductImageAction`**

  In `src/app/admin/_actions/products.ts`, before the type/size check:
  ```ts
  const existing = await db.listProducts({ /* can't filter by images */ })
  ```
  Wait — there's no `listImages` method. Use `db.getProduct(productId)` to get `product.images` and check length.

  Add after `const file = ...`:
  ```ts
  const existing = await db.getProduct(productId)
  if (!existing) return { error: 'Product not found' }
  if ((existing.images?.length ?? 0) >= 10) {
    return { error: 'Maximum 10 images per product' }
  }
  ```

- [ ] **Step 3: Run 10-limit test — GREEN**

  Run: `npx vitest run tests/unit/image-actions.test.ts`
  Expected: all pass

- [ ] **Step 4: Upgrade ImageUploader component**

  Replace `src/components/admin/ImageUploader.tsx` with the new implementation using the `QueueItem` state structure above.

  Key behavior points:
  - `useEffect` on unmount: revoke all object URLs in queue
  - Upload loop: for each queued item, update status to `uploading`, call action, update to `done` or `error`; run sequentially (not `Promise.all`) to avoid race conditions with the 10-limit check
  - After each successful upload: call `revalidatePath` is handled by the action; but since ImageUploader is a client component, the images list won't auto-refresh. Add a callback prop `onUploadComplete?: () => void` or use `router.refresh()` after the upload loop finishes
  - Use `router.refresh()` from `useRouter()` after completing the upload queue to reload the page's server data
  - Add `useEffect(() => { setImages(initialImages) }, [initialImages])` so that after `router.refresh()` returns new props, the client state re-syncs (router.refresh re-renders the Server Component and passes fresh `initialImages` to ImageUploader; without this effect, `useState(initialImages)` would not re-initialize)
  - Primary image UX note: the gold "Primary" badge on `images[0]` explains to the user that the first image is the primary. Reordering via drag-and-drop changes which image is first. No separate "set as primary" button is needed — reorder achieves the same effect.

  **Exact prop signature (unchanged):**
  ```ts
  interface ImageUploaderProps {
    productId: string
    images: ProductImage[]
  }
  ```

- [ ] **Step 5: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 6: Run full unit suite**

  Run: `npx vitest run tests/unit/`
  Expected: all pass

- [ ] **Step 7: Commit**

  ```
  feat: upgrade ImageUploader with multi-file preview, 10-limit, primary badge, alt text edit
  ```

---

## Task 4: Storage policies migration + new product image flow

**Files:**
- Create: `supabase/migrations/20261109000002_storage_policies.sql`
- Modify: `src/app/admin/_actions/products.ts`
- Modify: `src/components/admin/ProductForm.tsx`
- Modify: `src/app/admin/(protected)/products/[id]/edit/page.tsx`

**Interfaces:**
- Produces:
  - `createProductAction(formData): Promise<{ id?: string; error?: string }>` (changed return type)
  - `EditProductPage` shows `?created=1` banner

- [ ] **Step 1: Create Storage policies migration**

  File: `supabase/migrations/20261109000002_storage_policies.sql`

  Content:
  ```sql
  -- Migration 006: Supabase Storage bucket + policies for product-images
  -- LOCAL ONLY — requires migrations 001-004 on remote before pushing this.
  -- Creates the bucket declaratively and sets Storage-level RLS.

  INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
  VALUES (
    'product-images',
    'product-images',
    true,
    ARRAY['image/jpeg', 'image/png', 'image/webp'],
    5242880
  )
  ON CONFLICT (id) DO UPDATE SET
    public             = EXCLUDED.public,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    file_size_limit    = EXCLUDED.file_size_limit;

  -- Public read (anon can see all images in the bucket by URL)
  DROP POLICY IF EXISTS "product_images_storage_public_read" ON storage.objects;
  CREATE POLICY "product_images_storage_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

  -- Admin upload
  DROP POLICY IF EXISTS "product_images_storage_admin_insert" ON storage.objects;
  CREATE POLICY "product_images_storage_admin_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images' AND (SELECT is_admin()));

  -- Admin delete
  DROP POLICY IF EXISTS "product_images_storage_admin_delete" ON storage.objects;
  CREATE POLICY "product_images_storage_admin_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'product-images' AND (SELECT is_admin()));
  ```

- [ ] **Step 2: Change `createProductAction` to return `{ id?, error? }`**

  In `src/app/admin/_actions/products.ts`:
  - Change return type to `Promise<{ id?: string; error?: string }>`
  - After `await db.createProduct(result.data)`, capture the result:
    ```ts
    const product = await db.createProduct(result.data)
    revalidatePath('/admin/products')
    revalidatePath('/shop')
    return { id: product.id }
    ```

- [ ] **Step 3: Write test for the return type change**

  In `tests/unit/image-actions.test.ts`, add:

  ```ts
  it('createProductAction returns { id } on success', async () => {
    // mock db.createProduct to return a product with known id
    // call createProductAction(formData)
    // expect result.id to be a string
    // expect result.error to be undefined
  })
  ```

  Run: `npx vitest run tests/unit/image-actions.test.ts`
  Expected: all pass

- [ ] **Step 4: Update `ProductForm` redirect logic**

  In `src/components/admin/ProductForm.tsx`, in `handleSubmit`:
  ```ts
  const result = await action(formData)
  if (result.error) {
    setError(result.error)
  } else if (!product && result.id) {
    // New product created — go to edit page to add images
    router.push(`/admin/products/${result.id}/edit?created=1`)
  } else {
    router.push('/admin/products')
  }
  ```

  Note: `action` prop type must remain `(formData: FormData) => Promise<{ id?: string; error?: string }>` — update the prop type in the interface.

- [ ] **Step 5: Show created banner in edit page**

  In `src/app/admin/(protected)/products/[id]/edit/page.tsx`:
  - Add `searchParams: Promise<{ created?: string }>` to props interface
  - Await it: `const { created } = await searchParams`
  - Below the breadcrumb, show conditional banner:
    ```tsx
    {created === '1' && (
      <div className="mb-4 px-4 py-3 bg-green-900/20 border border-green-700/40 rounded-xl">
        <p className="text-green-400 text-sm font-medium">
          Product created! Add images below.
        </p>
      </div>
    )}
    ```

- [ ] **Step 6: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 7: Commit**

  ```
  feat: Storage policies migration + create-product redirects to edit page for image upload
  ```

---

## Task 5: Product detail page + catalog card links

**Files:**
- Create: `src/app/shop/[id]/page.tsx`
- Modify: `src/components/shop/ShopClient.tsx`

**Interfaces:**
- Consumes: `db.getProduct(id)`, `getProductImageSrc()` from Task 2
- Produces: `/shop/[id]` route — publicly accessible, 404 for non-published products

**Detail page design:**
- Server Component with `export const instant = false`
- Uses `notFound()` if product not found or `status !== 'published'`
- Main image: first in `product.images` (sort_order 0), displayed with `next/image` fill
- Thumbnail strip: remaining images (sort_order 1+) as small clickable thumbnails (client-side selected image state lives in a small client component)
- Fallback: if no images, show category gradient div (same pattern as ShopClient)
- Product info: name, price, original_price (if set), badge, description, category breadcrumb
- "← Back to Shop" link
- No cart action needed (WhatsApp-first flow, existing button pattern)
- `onError` on `<img>` elements: set src to empty string or hide element to prevent broken image icons

- [ ] **Step 1: Create `src/app/shop/[id]/page.tsx`**

  Props: `{ params: Promise<{ id: string }> }`

  Server component:
  - `await requireAdmin()` — NO; this is public. Use `db.getProduct(id)` with the anon-accessible client (no auth needed).
  - `notFound()` if `!product || product.status !== 'published'`
  - Render: main image, thumbnail strip (client component `ProductGallery`), product info, back link

  Create a small client component inline or separate `ProductGallery` for the thumbnail selection:
  ```tsx
  // src/app/shop/[id]/ProductGallery.tsx — 'use client'
  // Props: images: ProductImage[]
  // State: selectedIndex: number
  // Render: large main image (images[selectedIndex]) + thumbnail row
  ```

- [ ] **Step 2: Link product cards in ShopClient**

  In `src/components/shop/ShopClient.tsx`, wrap the product card `<div key={product.id}>` in:
  ```tsx
  <Link key={product.id} href={`/shop/${product.id}`} className="...existing card classes...">
  ```
  Keep the existing "Add to Cart" button but add `onClick={(e) => e.preventDefault()}` on it so clicking the button does not navigate to the detail page. The card-level Link handles navigation; the button is a secondary CTA.

  Note: `addToCart` state and function remain unchanged.

- [ ] **Step 3: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 4: Next.js build**

  Run: `npx next build`
  Expected: clean build, one new route `/shop/[id]` appears in output

- [ ] **Step 5: Commit**

  ```
  feat: add product detail page /shop/[id] with image gallery + card links
  ```

---

## Task 6: Integration tests + full validation + PROGRESS.md

**Files:**
- Create: `tests/integration/image-upload.test.ts`
- Modify: `docs/PROGRESS.md`

**Interfaces:**
- Consumes: `SupabaseAdapter` via injected anon clientFactory (read ops only); admin ops documented as deferred to E2E

- [ ] **Step 1: Create integration smoke tests for image operations**

  File: `tests/integration/image-upload.test.ts`

  Guard: `describe.skipIf(!process.env.NEXT_PUBLIC_SUPABASE_URL)(...)`

  Tests (anon client):
  - `getProduct with images returns images array with storage_path strings`
  - `getProductImageSrc constructs valid URL for real Supabase storage paths`
  - `updateImageAltText in MockAdapter persists alt text change` (unit-level, no guard needed but placed here for grouping)

  Note: upload/delete operations require admin session and are deferred to Playwright E2E (documented as pending).

- [ ] **Step 2: Run full test suite**

  Run: `npx vitest run`
  Expected: all pass (target ≥ 80 total)

- [ ] **Step 3: TypeScript strict**

  Run: `npx tsc --noEmit`
  Expected: 0 errors

- [ ] **Step 4: ESLint**

  Run: `npx eslint src`
  Expected: 0 errors

- [ ] **Step 5: Next.js build**

  Run: `npx next build`
  Expected: clean build (target ≥ 23 routes — adds `/shop/[id]`)

- [ ] **Step 6: Update `docs/PROGRESS.md`**

  Append Corte 3D section:
  - What was fixed (key bug, Storage URL, orphan cleanup)
  - What was added (updateImageAltText, upgraded ImageUploader, Storage policies, detail page)
  - Test counts
  - New migrations (006, local only)
  - Pending: push migrations 001-005 to unlock full Storage integration, then validate image upload E2E

- [ ] **Step 7: Commit**

  ```
  docs: update PROGRESS.md for Corte 3D product media manager
  ```
