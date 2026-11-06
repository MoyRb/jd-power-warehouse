# Security

Security is an ongoing engineering process, not a guarantee.

Requirements:
- Server-side authorization
- Least privilege
- Secure session management
- Input validation
- Secrets outside source control
- Dependency review
- Payment webhook verification
- Idempotency for financial operations
- Transaction-safe stock mutations
- Audit logs
- Tenant isolation if multi-tenant
- Automated security regression testing

## Implemented controls (Corte 2 — 2026-11-06)

### Authentication
- Supabase Auth (email+password) in production; `ADMIN_DEV_BYPASS` cookie-based session in dev/test only.
- `isDevBypassEnabled()` requires BOTH `NODE_ENV !== 'production'` AND `ADMIN_DEV_BYPASS === 'true'`.
  - Structural guard: Next.js sets `NODE_ENV=production` on every production build/start. The bypass is physically inert in production even if the env var is accidentally set.
- Session stored in HttpOnly cookie (`jdpw_dev_admin`, path=/admin, sameSite=lax) — not in localStorage.
- Middleware verifies both Supabase auth AND presence in `admin_users` table before allowing /admin access.

### Authorization (RLS)
- Row Level Security enabled on all 8 tables.
- `is_admin()` SECURITY DEFINER function (search_path = public, pg_temp) — cannot be hijacked via schema injection.
- Authorization never reads `user_metadata` — only the `admin_users` table.
- `store_settings` admin policies: SELECT, INSERT, UPDATE only. DELETE absent by design.
- `products` and `inventory`: no DELETE policy — archive-only design.
- `inquiries`: anon INSERT (form submission); admin SELECT + UPDATE only.
- `audit_log`: admin SELECT only; INSERT via service role key.
- `admin_users`: users read own row only; no INSERT/UPDATE/DELETE via RLS.

### Input validation
- Server actions validate all inputs server-side.
- Financial totals calculated and validated server-side (never trusted from client).
- Inquiry rate-limiting in MockAdapter (5 per 15 min per IP hash).

### Secrets
- No credentials in source control.
- `.env.local` git-ignored. Supabase anon key (safe to expose); service role key (server-only, never in Next.js public env).

Before production:
- Threat modeling
- Authorization and isolation tests
- Dependency and secret scanning
- Backup and recovery verification
- Independent security review
- Manual release approval
