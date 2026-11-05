# JD Power Warehouse — Admin Backlog

Date: 2026-11-05
Phase: Corte 2 — in progress

---

## IMPLEMENTED (Corte 1 — public store)

- 11 public routes (/, /shop, /sell, /contact, /testimonials, /about, 4 legal)
- Design system: dark theme #0A0A0A, gold #F3C41B, all Tailwind tokens
- 27 real images integrated from reference site
- 16 product static dataset
- AnnouncementBar, SubHeader, Navbar, Footer, FloatingWhatsApp components
- All 3 public forms: UI complete, no server submission yet

---

## PENDING (Corte 2 — in progress)

### Block 1: Foundation (Tasks 1–4)
- [x] Task 1: docs/ADMIN_AUDIT.md, ADMIN_ARCHITECTURE.md, ADMIN_BACKLOG.md
- [ ] Task 2: SQL migrations (001_initial_schema, 002_rls_policies, 003_indexes, seed)
- [ ] Task 3: DB types, DataAdapter interface, MockAdapter, SupabaseAdapter stub
- [ ] Task 4: Zod schemas, auth utilities, Next.js middleware

### Block 2: Admin Panel (Tasks 5–13)
- [ ] Task 5: Admin layout, sidebar, login/logout
- [ ] Task 6: Dashboard (stats cards)
- [ ] Task 7: Products table + status management
- [ ] Task 8: Product create/edit form
- [ ] Task 9: Image uploader with server-side validation
- [ ] Task 10: Categories management
- [ ] Task 11: Inventory management
- [ ] Task 12: Inquiries inbox
- [ ] Task 13: Settings page

### Block 3: Integration (Tasks 14–15)
- [ ] Task 14: Wire Quick Inquiry + Contact + Sell forms to inquiries DB
- [ ] Task 15: Public shop reads from DataAdapter (replace static import)

### Block 4: QA (Tasks 16–18)
- [ ] Task 16: Vitest unit tests (adapter, validations, auth guards)
- [ ] Task 17: Playwright e2e tests (auth, CRUD, public sync, forms)
- [ ] Task 18: Final documentation + PROGRESS.md update

---

## BLOCKED (requires Supabase project)

The following cannot be completed until a Supabase project is created and
credentials are provided. All code, SQL, and configuration is ready.

| Item | Env var needed |
|---|---|
| Connect SupabaseAdapter | NEXT_PUBLIC_SUPABASE_URL |
| Authenticate users via Supabase Auth | NEXT_PUBLIC_SUPABASE_ANON_KEY |
| Run migrations against cloud DB | SUPABASE_SERVICE_ROLE_KEY |
| Upload images to Supabase Storage | SUPABASE_SERVICE_ROLE_KEY |
| Seed production data | SUPABASE_SERVICE_ROLE_KEY |

**How to unblock:** Create a Supabase project → copy the three env vars above
into `.env.local` → run `supabase db push` → run `psql -f supabase/seed.sql`.

---

## DEFERRED (future phases)

- Sell-form image attachments → requires Supabase Storage bucket for inquiry files
- AnnouncementBar text reading from `store_settings` DB (currently hardcoded)
- EN/ES i18n toggle
- B2B customer company accounts and approval workflows
- Special pricing / price tiers
- Request for Quote (RFQ) flow
- Multi-tenancy (platform for multiple stores)
- Cart and checkout
- Shipping integrations
- Admin notifications (email on new inquiry)
- Full-text product search
