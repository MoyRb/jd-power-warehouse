---
active: true
iteration: 1
session_id: 
max_iterations: 12
completion_promise: "VISUAL_COMPLETE"
started_at: "2026-10-26T23:43:14Z"
---

CORTE VISUAL JD POWER WAREHOUSE. Lee CLAUDE.md docs/VISUAL_REFERENCE.md docs/VISUAL_AUDIT.md docs/PRODUCT.md y docs/PROGRESS.md. Aplica visual-autopilot y frontend-design. OBJETIVO: reconstruir fielmente todas las pantallas públicas verificadas en la auditoría visual. Identidad visual: dark theme #0A0A0A fondo, acento dorado #F3C41B, texto crema #F6F4EE, system font, border-radius 12px. Stack: Next.js App Router, TypeScript estricto, Tailwind v4. Prioridades: 1) globals.css con design tokens, 2) componentes compartidos AnnouncementBar+SubHeader+Navbar+Footer, 3) Homepage, 4) /shop catálogo, 5) /sell formulario, 6) /contact, 7) /testimonials, 8) /about, 9) páginas legales. No inventar funcionalidades no observadas. No conectar auth ni pagos reales. Actualiza docs/PROGRESS.md con avances. Captura screenshots con Playwright para comparar contra evidence/reference/. Solo emite <promise>VISUAL_COMPLETE</promise> cuando todas las pantallas públicas estén implementadas, el build pase, y las capturas comparativas estén guardadas.
