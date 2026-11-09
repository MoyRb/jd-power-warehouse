-- Migration 006: Storage RLS policies for product-images bucket
-- The 'product-images' bucket must be pre-created (via dashboard or admin tooling)
-- before this migration runs. This migration only adds RLS policies on storage.objects.
--
-- Policy matrix:
--   INSERT  → authenticated + is_admin()   (upload new files)
--   UPDATE  → authenticated + is_admin()   (replace / upsert)
--   DELETE  → authenticated + is_admin()   (remove files)
--   SELECT  → anon + authenticated         (public read; bucket is public)

-- Admins can upload files to the product-images bucket
CREATE POLICY "product_images_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND is_admin()
);

-- Admins can overwrite / upsert files (needed for future replace-in-place)
CREATE POLICY "product_images_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND is_admin()
)
WITH CHECK (
  bucket_id = 'product-images'
  AND is_admin()
);

-- Admins can delete files from the product-images bucket
CREATE POLICY "product_images_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND is_admin()
);

-- Visitors and authenticated users can view product images (public catalog)
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');
