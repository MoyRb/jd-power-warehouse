# Environment Variables Setup

Copy the following into `.env.local` (gitignored — never commit).

```bash
# Admin Dev Bypass — LOCAL DEVELOPMENT ONLY
# NEVER set this in staging, preview, or production environments.
ADMIN_DEV_BYPASS=true

# Supabase — required for real data persistence
# NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

When `NEXT_PUBLIC_SUPABASE_URL` is set, `SupabaseAdapter` is used automatically.
When it is absent and `ADMIN_DEV_BYPASS=true`, `MockAdapter` is used for local dev.
