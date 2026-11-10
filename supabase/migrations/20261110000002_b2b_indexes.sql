-- Migration 009: B2B performance indexes
-- JD Power Warehouse — Corte 4A

-- business_customers
CREATE INDEX IF NOT EXISTS idx_customers_email
  ON business_customers(email);

CREATE INDEX IF NOT EXISTS idx_customers_company
  ON business_customers(company_name);

CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON business_customers(created_at DESC);

-- quotes
CREATE INDEX IF NOT EXISTS idx_quotes_status
  ON quotes(status);

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id
  ON quotes(customer_id);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at
  ON quotes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotes_status_created
  ON quotes(status, created_at DESC);

-- quote_lines
CREATE INDEX IF NOT EXISTS idx_lines_quote_id
  ON quote_lines(quote_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_lines_product_id
  ON quote_lines(product_id)
  WHERE product_id IS NOT NULL;

-- quote_events
CREATE INDEX IF NOT EXISTS idx_events_quote_id
  ON quote_events(quote_id, created_at DESC);
