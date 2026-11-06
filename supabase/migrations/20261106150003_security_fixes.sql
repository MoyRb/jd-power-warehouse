-- Migration 004: Security fixes from Block 1 audit
-- JD Power Warehouse — Corte 2
--
-- Fixes:
--   C-3: is_admin() SECURITY DEFINER missing SET search_path
--   I-1: store_settings anon read policy — add is_public column
--   I-2: ip_hash index on inquiries for rate-limit lookups
--   I-4: inquiries.email must be nullable (quick_inquiry has no email field)
--   I-5: categories missing updated_at column and trigger
--   M-4: audit_log.admin_id ON DELETE RESTRICT (preserve attribution)

-- ---------------------------------------------------------------------------
-- C-3: Fix is_admin() search path hijacking vulnerability
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
   SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- I-4: Make inquiries.email nullable
-- (quick_inquiry form has no email field; Zod enforces email for other types)
-- ---------------------------------------------------------------------------
ALTER TABLE inquiries ALTER COLUMN email DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- I-5: Add updated_at to categories
-- ---------------------------------------------------------------------------
ALTER TABLE categories ADD COLUMN IF NOT EXISTS
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- I-1: Add is_public to store_settings
-- Drop old anon SELECT policy; replace with public-only-row policy
-- ---------------------------------------------------------------------------
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS
  is_public BOOLEAN NOT NULL DEFAULT false;

-- Mark announcement/display settings as public
UPDATE store_settings SET is_public = true
  WHERE key IN (
    'store_name',
    'announcement_bar_text',
    'business_hours',
    'contact_phone',
    'whatsapp_number'
  );
-- contact_email remains private (is_public = false)

DROP POLICY IF EXISTS store_settings_anon_read ON store_settings;

CREATE POLICY store_settings_anon_read_public
  ON store_settings FOR SELECT
  USING (is_public = true);

-- ---------------------------------------------------------------------------
-- I-2: Index on ip_hash for rate-limit lookups
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inquiries_ip_hash
  ON inquiries(ip_hash)
  WHERE ip_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- M-4: Preserve audit attribution — RESTRICT prevents deleting users with logs
-- Note: This requires no active orphaned rows first.
-- ---------------------------------------------------------------------------
ALTER TABLE audit_log
  DROP CONSTRAINT IF EXISTS audit_log_admin_id_fkey;

ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES auth.users(id)
  ON DELETE RESTRICT;

-- Note: If you need to delete a user with audit history, set admin_id = NULL
-- manually first. This is intentional to preserve forensic attribution.
