-- Migration 005: Analytics performance indexes
-- LOCAL ONLY — run `npx supabase db push --remote` to apply after migrations 001-004 are confirmed.
-- These indexes improve dashboard aggregate queries.

CREATE INDEX IF NOT EXISTS idx_products_status
  ON products(status);

CREATE INDEX IF NOT EXISTS idx_products_category_status
  ON products(category_id, status);

CREATE INDEX IF NOT EXISTS idx_inventory_quantity
  ON inventory(quantity);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
  ON inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_type_status
  ON inquiries(type, status);
