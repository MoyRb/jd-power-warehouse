-- Migration 006: Storage bucket policies for product-images
-- LOCAL ONLY — run `npx supabase db push --remote` to apply after migrations 001-005.
-- Creates the product-images bucket (if absent) and sets up RLS policies.

-- Ensure bucket exists with public read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload (INSERT)
CREATE POLICY "product_images_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND is_admin()
);

-- Allow authenticated admins to delete their uploads
CREATE POLICY "product_images_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND is_admin()
);

-- Allow public read of all product images (bucket is public, but explicit policy for clarity)
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');
