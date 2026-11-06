-- Migration 001: Initial Schema
-- JD Power Warehouse — Corte 2
-- Run: supabase db push
-- Safe to re-run: uses IF NOT EXISTS where applicable

-- ---------------------------------------------------------------------------
-- updated_at trigger function (reused across tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku            TEXT UNIQUE,
  name           TEXT NOT NULL,
  description    TEXT,
  price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) CHECK (original_price >= 0),
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published', 'archived')),
  badge          TEXT CHECK (badge IN ('Sale', 'New')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt_text     TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  quantity   INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- inventory_movements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  delta      INT NOT NULL,
  reason     TEXT,
  admin_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT NOT NULL CHECK (type IN ('quick_inquiry', 'contact', 'sell_request')),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  message          TEXT NOT NULL,
  -- sell_request specific fields (nullable for other types)
  item_name        TEXT,
  item_description TEXT,
  item_condition   TEXT,
  asking_price     NUMERIC(10, 2),
  -- status tracking
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new', 'read', 'replied', 'archived')),
  ip_hash          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin'
         CHECK (role IN ('admin', 'super_admin'))
);

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id  UUID NOT NULL,
  action     TEXT NOT NULL
               CHECK (action IN ('create', 'update', 'delete', 'publish', 'archive', 'status_change', 'inventory_adjust')),
  old_data   JSONB,
  new_data   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- store_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
