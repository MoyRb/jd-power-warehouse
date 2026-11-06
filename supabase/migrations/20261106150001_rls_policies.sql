-- Migration 002: Row Level Security Policies
-- JD Power Warehouse — Corte 2
--
-- Authorization rule: admin = auth.uid() IN (SELECT id FROM admin_users)
-- NEVER use user_metadata for authorization.
-- NEVER create permissive policies to resolve RLS errors.

-- ---------------------------------------------------------------------------
-- Helper: is_admin() function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE POLICY categories_anon_read
  ON categories FOR SELECT
  USING (true);

CREATE POLICY categories_admin_all
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE POLICY products_anon_read_published
  ON products FOR SELECT
  USING (status = 'published');

CREATE POLICY products_admin_read_all
  ON products FOR SELECT
  USING (is_admin());

CREATE POLICY products_admin_insert
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY products_admin_update
  ON products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No DELETE policy: archive-only design. Hard-delete is not permitted.

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
CREATE POLICY product_images_anon_read_published
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
        AND products.status = 'published'
    )
  );

CREATE POLICY product_images_admin_read_all
  ON product_images FOR SELECT
  USING (is_admin());

CREATE POLICY product_images_admin_insert
  ON product_images FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY product_images_admin_update
  ON product_images FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY product_images_admin_delete
  ON product_images FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
CREATE POLICY inventory_anon_read_published
  ON inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = inventory.product_id
        AND products.status = 'published'
    )
  );

CREATE POLICY inventory_admin_read_all
  ON inventory FOR SELECT
  USING (is_admin());

CREATE POLICY inventory_admin_insert
  ON inventory FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY inventory_admin_update
  ON inventory FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- inventory_movements — no anon access
-- ---------------------------------------------------------------------------
CREATE POLICY inventory_movements_admin_all
  ON inventory_movements FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------------------
-- Anon can INSERT (submit a form) but cannot SELECT their own rows (privacy)
CREATE POLICY inquiries_anon_insert
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Admin can read and update status
CREATE POLICY inquiries_admin_read
  ON inquiries FOR SELECT
  USING (is_admin());

CREATE POLICY inquiries_admin_update
  ON inquiries FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No delete: preserve inquiry history

-- ---------------------------------------------------------------------------
-- admin_users — no anon access; users can only read their own row
-- ---------------------------------------------------------------------------
CREATE POLICY admin_users_own_row
  ON admin_users FOR SELECT
  USING (id = auth.uid());

-- No INSERT/UPDATE/DELETE via RLS: admin_users populated via SQL only
-- (or by a super_admin using service role key)

-- ---------------------------------------------------------------------------
-- audit_log — no anon access; admin can read but not write directly
-- ---------------------------------------------------------------------------
CREATE POLICY audit_log_admin_read
  ON audit_log FOR SELECT
  USING (is_admin());

-- INSERT done by server-side service role only, not by authenticated users

-- ---------------------------------------------------------------------------
-- store_settings
-- ---------------------------------------------------------------------------
-- Anon SELECT: replaced in migration 004 with is_public=true filter.
-- Defined here (permissive) so the app can read settings before 004 runs.
CREATE POLICY store_settings_anon_read
  ON store_settings FOR SELECT
  USING (true);

-- Admin write: principle of least privilege — SELECT, INSERT, UPDATE only.
-- DELETE is intentionally omitted: settings keys are permanent; use UPDATE
-- to clear values. No application code path issues a DELETE on this table.
CREATE POLICY store_settings_admin_select
  ON store_settings FOR SELECT
  USING (is_admin());

CREATE POLICY store_settings_admin_insert
  ON store_settings FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY store_settings_admin_update
  ON store_settings FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
