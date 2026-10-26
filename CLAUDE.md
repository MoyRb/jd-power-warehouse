# JD Power Warehouse — Claude Code

## Mission
Build a production-oriented B2B ecommerce platform based on
an existing GoHighLevel visual reference.

## Stack
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- PostgreSQL / Supabase (planned)
- Vitest and Playwright
- GitHub Actions

## Working protocol
1. Read docs/PRODUCT.md, docs/ARCHITECTURE.md,
   docs/SECURITY.md and docs/PROGRESS.md.
2. Inspect existing code before editing.
3. Plan large features and identify dependencies.
4. Delegate independent tasks to specialized agents.
5. Prefer isolated worktrees for parallel edits.
6. Use small, verifiable changes.
7. Run validation after meaningful changes.
8. Record progress and architectural decisions.
9. Report blockers, failures and remaining risks.

## Quality rules
- Never claim tests passed without executing them.
- Never claim the system is vulnerability-free.
- No placeholder logic represented as production-ready.
- Avoid unnecessary dependencies.
- Validate inputs and enforce server-side authorization.
- Financial totals must be calculated and validated server-side.
- Never trust client-supplied prices or tenant identifiers.
- Use secure transaction boundaries for inventory and orders.
- Preserve auditability for sensitive business operations.

## Safety boundaries
- Never expose or commit credentials.
- Never run destructive production SQL.
- Never deploy to production without explicit approval.
- Never process real payments during automated tests.
- Never bypass security checks to make tests pass.
- Never disable approval gates.
- Never install unreviewed external agent frameworks.
- Do not assume B2B requirements not yet confirmed.

## Autonomous execution
Continue with independent, safe development tasks when a
business decision is unresolved. Record the question in
docs/PROGRESS.md rather than inventing requirements.

Respect session limits and permissions.

## Completion criteria
A task is complete only when:
- Implementation matches documented acceptance criteria.
- Relevant tests pass.
- TypeScript and lint checks pass.
- Security implications have been reviewed.
- Documentation is updated.

## Language
Explain project progress and decisions in Spanish.
Code, identifiers and technical documentation may use English.
