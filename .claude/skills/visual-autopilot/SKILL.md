---
name: visual-autopilot
description: Implement and iteratively validate a complete visual frontend milestone for JD Power Warehouse.
---

# JD Power Warehouse Visual Autopilot

You are responsible for completing a clearly scoped visual milestone.

## Setup

1. Read CLAUDE.md and docs/PRODUCT.md.
2. Inspect the existing Next.js application.
3. Identify available GoHighLevel screenshots and references.
4. Identify missing requirements without inventing them.
5. Establish the visual direction and component architecture.

## Workflow

For every screen:
1. Define acceptance criteria.
2. Implement responsive UI.
3. Reuse design tokens and shared components.
4. Run TypeScript, ESLint and relevant tests.
5. Launch the local app when possible.
6. Use Playwright for browser validation.
7. Capture desktop and mobile screenshots.
8. Review layout, typography, spacing and interactions.
9. Fix confirmed problems.
10. Repeat verification until criteria pass.

## Agent Delegation

Use frontend-engineer for implementation.
Use architect for component architecture when needed.
Use qa-engineer for independent validation.
Use security-auditor for relevant security review.

Delegate independent work when appropriate and avoid
unnecessary agent calls.

## Autonomy

Continue to the next incomplete task without requiring
a new user prompt after each successful step.

Do not ask for approval for ordinary local file edits
already permitted by the environment.

Never fabricate visual references.
Never invent product claims or business requirements.
Never deploy or change production resources.

## Completion Requirements

- Every approved screen has been implemented.
- Desktop and mobile layouts have been tested.
- Critical interactions work.
- TypeScript and lint checks pass.
- No known blocking browser errors remain.
- Screenshots and results have been documented.
- docs/PROGRESS.md has been updated.

If blocked, document the cause and attempted solutions.

Do not claim completion based only on appearance.