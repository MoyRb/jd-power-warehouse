# Architecture

Proposed stack: Next.js, TypeScript, PostgreSQL, Supabase.

Initial approach: modular monolith.

Define clear boundaries for:
- Identity and authorization
- Organizations and customers
- Catalog and pricing
- Inventory
- Cart and checkout
- Orders and fulfillment
- Billing and payments
- Administration and audit logs

Do not select the tenancy model without business discovery.

Maintain architectural decisions in this document.
