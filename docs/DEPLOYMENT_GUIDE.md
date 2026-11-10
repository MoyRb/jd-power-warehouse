# JD Power Warehouse — Deployment Guide
**Corte 5 — 2026-11-10**

This guide covers deploying a Vercel preview (not production DNS).
Follow each section in order. Do not skip the database step — the app
silently falls back to MockAdapter if Supabase is unreachable.

---

## Prerequisites

- [ ] Node.js ≥ 20
- [ ] Supabase project JDHOUSE (kodjmkykwnghknwlpzsi) accessible
- [ ] Vercel account with access to the team/personal workspace
- [ ] `supabase` CLI installed: `npm i -g supabase`
- [ ] Vercel CLI (optional): `npm i -g vercel`

---

## Step 1 — Apply Database Migrations

This is the most critical step. Without migrations, the public quote form,
admin writes, and RLS policies will not work.

```bash
# From project root
npx supabase login
npx supabase link --project-ref kodjmkykwnghknwlpzsi
npx supabase db push --remote
```

Expected: "Applying migration … done" for all 9 files in `supabase/migrations/`.

Verify in Supabase SQL editor:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
-- Should include: business_customers, quotes, quote_lines, quote_events
```

---

## Step 2 — Supabase Auth Configuration

In [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → URL Configuration:

| Field | Value |
|-------|-------|
| Site URL | `https://<your-vercel-preview-url>.vercel.app` |
| Redirect URLs | `https://<your-vercel-preview-url>.vercel.app/**` |

If using a custom domain later, add it here too.

**SMTP (optional for Vercel preview):**
Supabase provides a built-in email sender (rate-limited to 3/hour).
For production, configure a custom SMTP provider under Authentication → Email.

---

## Step 3 — Create the First Admin User

Admin users are stored in the `admin_users` table and are NOT self-registrable.
The flow is:
1. Sign up via Supabase Auth (or use Supabase dashboard → Authentication → Users → "Add User").
2. Copy the user UUID.
3. Insert into `admin_users`:

```sql
INSERT INTO admin_users (id, email, role)
VALUES ('<uuid-from-auth.users>', 'admin@yourdomain.com', 'admin');
```

---

## Step 4 — Vercel Project Setup

### Option A — Vercel Dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (default)
5. Build command: `npm run build` (default)
6. Output directory: `.next` (default)

### Option B — Vercel CLI

```bash
vercel
# Follow prompts; link to existing project or create new
```

---

## Step 5 — Set Environment Variables in Vercel

In Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Environment | Value |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | `https://kodjmkykwnghknwlpzsi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | (from Supabase Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | (from Supabase Settings → API → service_role) |

**Do NOT set `ADMIN_DEV_BYPASS` on Vercel.** The app requires it to be absent in production.

---

## Step 6 — Deploy Preview

```bash
# Via CLI
vercel --prod=false

# Or push to any non-main branch — Vercel auto-creates a preview URL
git push origin corte-5
```

Vercel generates a URL like `https://jd-power-warehouse-abc123.vercel.app`.

---

## Step 7 — Smoke Test the Preview

```bash
# Point Playwright at the preview URL
PLAYWRIGHT_BASE_URL=https://jd-power-warehouse-abc123.vercel.app npx playwright test
```

Manual checks:
- [ ] `/shop` loads product catalogue
- [ ] `/quote` wizard submits and shows `QT-` reference
- [ ] `/admin/login` with real Supabase credentials → `/admin`
- [ ] `/admin/quotes` shows submitted quotes

---

## Step 8 — Before Production DNS Cutover (checklist)

- [ ] All migrations applied (Step 1)
- [ ] Auth URLs updated to production domain
- [ ] `robots.txt` and `sitemap.xml` added
- [ ] npm audit clean (run on Linux/CI)
- [ ] Custom SMTP configured for auth emails
- [ ] CSP `'unsafe-eval'` tightened or removed

---

## Rollback Plan

Vercel: use "Instant Rollback" in Dashboard → Deployments → previous deploy → Promote.

Database: Supabase does not auto-rollback migrations. Maintain a rollback script
(`supabase/rollbacks/`) for each migration if needed.

---

## Supabase Storage Bucket

The `product-images` bucket is auto-created by `SupabaseAdapter.uploadImage()` on
first upload. The storage RLS policies are in migration 006. No manual bucket
creation is needed.
