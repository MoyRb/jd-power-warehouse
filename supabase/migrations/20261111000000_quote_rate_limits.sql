-- Migration: Quote rate limiting table + atomic RPC
-- Purpose: persistent, cross-instance rate limiting for /quote form submissions
-- Replaces: in-memory Map in src/app/quote/actions.ts

CREATE TABLE IF NOT EXISTS public.quote_rate_limits (
  id_hash       TEXT        PRIMARY KEY,         -- SHA-256 hex of IP, first 16 chars
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INT         NOT NULL DEFAULT 1
                            CHECK (request_count > 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: no direct row access — all interaction is via SECURITY DEFINER function
ALTER TABLE public.quote_rate_limits ENABLE ROW LEVEL SECURITY;
-- Intentionally no SELECT / INSERT / UPDATE policies for anon or authenticated.
-- The function below is the only entry point.

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS quote_rate_limits_updated_at_idx
  ON public.quote_rate_limits (updated_at);

-- ───────────────────────────────────────────────────────────────────────────
-- check_quote_rate_limit
--
-- Atomically increments the counter for p_id_hash within the current time
-- window and returns TRUE if the request is allowed, FALSE if the caller
-- has exceeded the hard-coded limit of 5 requests per 15 minutes.
--
-- Limits are HARD-CODED inside the function (not passed as parameters) so
-- the anon role cannot call this function with a relaxed limit.
--
-- Concurrency: INSERT … ON CONFLICT serialises on the primary key, so
-- simultaneous requests from the same hash are handled correctly by the
-- database without application-level locking.
--
-- Failure policy: the caller (actions.ts) catches exceptions and fails
-- open (allows the request) so a transient DB outage does not block users.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_quote_rate_limit(p_id_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  -- Hard-coded limits — not caller-controlled to prevent bypass via direct RPC call
  v_limit          CONSTANT INT         := 5;
  v_window         CONSTANT INTERVAL    := INTERVAL '15 minutes';
  v_now            TIMESTAMPTZ          := now();
  v_new_count      INT;
BEGIN
  INSERT INTO public.quote_rate_limits (id_hash, window_start, request_count, updated_at)
  VALUES (p_id_hash, v_now, 1, v_now)
  ON CONFLICT (id_hash) DO UPDATE SET
    -- Reset window when the previous window has expired
    window_start  = CASE
                      WHEN v_now - quote_rate_limits.window_start > v_window
                      THEN v_now
                      ELSE quote_rate_limits.window_start
                    END,
    request_count = CASE
                      WHEN v_now - quote_rate_limits.window_start > v_window
                      THEN 1
                      ELSE quote_rate_limits.request_count + 1
                    END,
    updated_at    = v_now
  RETURNING request_count INTO v_new_count;

  -- TRUE  → request is within limit (allow)
  -- FALSE → request exceeds limit (deny)
  RETURN v_new_count <= v_limit;
END;
$$;

-- Allow the anonymous role to call the function (quote form is unauthenticated)
GRANT EXECUTE ON FUNCTION public.check_quote_rate_limit(TEXT)
  TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- Cleanup: remove stale entries older than 24 hours.
-- Called by check_quote_rate_limit on a probabilistic basis (see actions.ts)
-- or can be scheduled via pg_cron / Supabase Edge Functions cron.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_quote_rate_limits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.quote_rate_limits
  WHERE updated_at < now() - INTERVAL '24 hours';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_quote_rate_limits() TO anon, authenticated;
