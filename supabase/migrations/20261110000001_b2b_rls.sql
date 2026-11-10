-- Migration 008: B2B RLS Policies
-- JD Power Warehouse — Corte 4A
--
-- Policy matrix:
--
--   business_customers  → admin: ALL
--   quotes              → anon: cannot SELECT or INSERT directly (only via RPC)
--                       → admin: SELECT, UPDATE
--   quote_lines         → anon: cannot SELECT or INSERT directly (only via RPC)
--                       → admin: ALL
--   quote_events        → admin: SELECT; INSERT via admin_update_quote_status RPC only
--
-- Public form submissions use create_quote_with_lines() SECURITY DEFINER RPC.
-- Admin status changes use admin_update_quote_status() SECURITY DEFINER RPC.
-- Neither anon nor authenticated users need direct write access to quote_lines.

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events        ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- business_customers — admin only
-- ---------------------------------------------------------------------------
CREATE POLICY customers_admin_select
  ON business_customers FOR SELECT
  USING (is_admin());

CREATE POLICY customers_admin_insert
  ON business_customers FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY customers_admin_update
  ON business_customers FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No DELETE: business customer records are retained for audit purposes.

-- ---------------------------------------------------------------------------
-- quotes — no direct anon access; admin can read and update
-- ---------------------------------------------------------------------------
-- Anon submits via create_quote_with_lines() RPC — no direct INSERT needed.
-- Admin reads all quotes.
CREATE POLICY quotes_admin_select
  ON quotes FOR SELECT
  USING (is_admin());

-- Admin updates (e.g. link customer, set valid_until, notes)
-- Status transitions go through admin_update_quote_status() RPC.
CREATE POLICY quotes_admin_update
  ON quotes FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No anon SELECT — quotes contain contact PII.
-- No DELETE — quotes are retained for history.

-- ---------------------------------------------------------------------------
-- quote_lines — no direct anon access; admin full access
-- ---------------------------------------------------------------------------
CREATE POLICY lines_admin_all
  ON quote_lines FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- quote_events — admin read only; INSERT via RPC (admin_update_quote_status)
-- ---------------------------------------------------------------------------
CREATE POLICY events_admin_select
  ON quote_events FOR SELECT
  USING (is_admin());

CREATE POLICY events_admin_insert
  ON quote_events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- GRANT EXECUTE on public-facing RPC to anon
-- (create_quote_with_lines is the only function anon may call)
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION create_quote_with_lines(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO anon;

-- admin_update_quote_status is for authenticated admins only
GRANT EXECUTE ON FUNCTION admin_update_quote_status(UUID, TEXT, UUID, TEXT) TO authenticated;

-- validate_quote_transition is a pure utility — no security risk in exposing
GRANT EXECUTE ON FUNCTION validate_quote_transition(TEXT, TEXT) TO authenticated;
