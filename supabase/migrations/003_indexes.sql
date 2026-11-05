-- Migration 003: Indexes
-- JD Power Warehouse — Corte 2

CREATE INDEX IF NOT EXISTS idx_products_status
  ON products(status);

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_status_category
  ON products(status, category_id);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images(product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id
  ON inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id
  ON inventory_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at
  ON inventory_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_status
  ON inquiries(status);

CREATE INDEX IF NOT EXISTS idx_inquiries_type
  ON inquiries(type);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
  ON inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
  ON audit_log(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log(created_at DESC);
