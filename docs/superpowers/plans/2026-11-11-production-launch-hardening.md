# Production Launch Hardening Plan

> **Executor:** Native (mismo contexto). Implementación inmediata post-plan.

**Goal:** Corregir 10 hallazgos técnicos que impiden el lanzamiento comercial B2B.

**Architecture:** Hotfix branch; cambios quirúrgicos sobre código existente; nueva migración SQL para rate limiting; sin nuevas dependencias externas.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase PostgreSQL/Auth, Vitest, Vercel

## Execution Order
1. T4 — Canonical domain (www) → propagates to T2, T3, T5
2. T6 — CSP hardening (independent)
3. T7 — MockAdapter production guard (independent)
4. T1 — Rate limiting: migration + code (depends on nothing)
5. T2 — Product SEO/JSON-LD (depends on T4)
6. T3 — Dynamic sitemap (depends on T4, T7 safe fallback)
7. T5 — Maps/contact cleanup (depends on T4)
8. T8 — GitHub Actions trigger fix (independent)
9. T9 — Tests run
10. T10 — Docs update + release audit
