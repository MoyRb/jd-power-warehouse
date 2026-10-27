# JD Power Warehouse — Auditoría Visual

**URL de referencia:** https://preview-1784678966980352958.vibepreview.com/
**Fecha de auditoría:** 2026-10-26
**Método:** Playwright (Chromium headless) — capturas a 1440px, 768px y 390px
**Estado de acceso:** ✅ Sitio accesible, HTTP 200 en todas las páginas reales

---

## 1. Resumen Ejecutivo

JD Power Warehouse es una tienda/almacén local de liquidación en Plainfield & Homer Glen, IL.
Vende herramientas de poder, muebles de exterior, equipos de jardinería, parrillas y artículos del
hogar de overstock, devoluciones y liquidaciones — con descuentos de hasta 70%.

**Modelo de negocio observado (distinto a lo supuesto):**
- No hay carrito de compras ni checkout online en el sitio de referencia.
- Los clientes reservan por WhatsApp o recogen en tienda.
- También compran artículos de particulares (función `/sell`).
- El sitio es más B2C/retail local que B2B SaaS.
- Idiomas: Inglés y Español (toggle EN/ES visible).

---

## 2. Inventario de Pantallas

| Ruta | Título | Estado | Tiene contenido real |
|------|--------|--------|----------------------|
| `/` | JD Power Warehouse — Discount Home Improvement & Tools | ✅ 200 | Sí |
| `/shop` | Shop Liquidation Inventory | ✅ 200 | Sí |
| `/sell` | Sell Your Overstock & Tools for Cash | ✅ 200 | Sí |
| `/testimonials` | Customer Testimonials | ✅ 200 | Sí |
| `/about` | About Us | ✅ 200 | Sí |
| `/contact` | Contact Us | ✅ 200 | Sí |
| `/privacy-policy` | Privacy Policy | ✅ 200 | Sí (texto legal) |
| `/terms-and-conditions` | Terms & Conditions | ✅ 200 | Sí (texto legal) |
| `/refund-policy` | Refund Policy | ✅ 200 | Sí (texto legal) |
| `/shipping-policy` | Shipping & Pickup Policy | ✅ 200 | Sí (texto legal) |
| `/products` | — (redirige a home) | ⚠️ 200 | No existe |
| `/categories` | — (redirige a home) | ⚠️ 200 | No existe |
| `/cart` | — (redirige a home) | ⚠️ 200 | No existe |
| `/checkout` | — (redirige a home) | ⚠️ 200 | No existe |
| `/login` | — (redirige a home) | ⚠️ 200 | No existe |
| `/register` | — (redirige a home) | ⚠️ 200 | No existe |
| `/account` | — (redirige a home) | ⚠️ 200 | No existe |
| `/orders` | — (redirige a home) | ⚠️ 200 | No existe |

**Capturas disponibles:** `evidence/reference/`

---

## 3. Sistema de Diseño

### 3.1 Paleta de Colores

| Token | HSL | Hex aproximado | RGB | Uso |
|-------|-----|----------------|-----|-----|
| `--background` | hsl(0 0% 4%) | `#0A0A0A` | rgb(10, 10, 10) | Fondo global y footer |
| `--foreground` | hsl(45 30% 95%) | `#F6F4EE` | rgb(246, 244, 238) | Texto principal (crema cálido) |
| `--primary` | hsl(47 90% 53%) | `#F3C41B` | rgb(243, 196, 27) | Acento dorado — botones, headings internos, bordes destacados |
| `--primary-foreground` | hsl(0 0% 6%) | `#0F0F0F` | rgb(15, 15, 15) | Texto sobre botones dorados |
| `--card` | hsl(0 0% 8%) | `#141414` | rgb(20, 20, 20) | Fondo de tarjetas/cards |
| `--card-foreground` | hsl(45 30% 95%) | `#F6F4EE` | rgb(246, 244, 238) | Texto en cards |
| `--secondary` | hsl(45 20% 18%) | `#2E2B1F` | — | Elementos secundarios |
| `--muted` | hsl(0 0% 16%) | `#292929` | rgb(41, 41, 41) | Fondos sutiles |
| `--muted-foreground` | hsl(0 0% 55%) | `#8C8C8C` | rgb(140, 140, 140) | Texto secundario/placeholders |
| `--border` | hsl(0 0% 18%) | `#2E2E2E` | — | Bordes de inputs y cards |
| `--destructive` | hsl(0 72% 51%) | `#DC2626` | — | Errores |
| `--radius` | — | — | — | 0.75rem (12px) |

**Color de fondo testimonials hero:** `#F3C41B` (dorado completo, fondo sólido)

### 3.2 Tipografía

| Elemento | Tamaño | Peso | Color | Notas |
|----------|--------|------|-------|-------|
| Body | 16px | 400 | `#F6F4EE` | System sans-serif, sin fuente web personalizada |
| H1 (hero home) | 72px | 700 | `#FFFFFF` | Blanco sobre imagen de fondo |
| H1 (páginas internas) | 48px | 700 | `#F3C41B` | Dorado sobre fondo oscuro |
| H2 | 36px | 700 | `#F3C41B` | Dorado |
| Nav links | 14–16px | 500 | `#F6F4EE` | Crema |
| Muted/subtítulos | 14–16px | 400 | `#8C8C8C` | Gris |
| Labels de formulario | 14px | 500 | `#F6F4EE` | |
| Precio en shop | ~20px | 700 | `#F3C41B` | Destacado dorado |

**Stack de fuente:** `ui-sans-serif, system-ui, sans-serif` (no hay Google Fonts ni fuente web cargada).

### 3.3 Espaciado y Bordes

- Border radius global: `0.75rem` (12px)
- Botones: padding `~12px 24px`, border-radius heredado (12px)
- Cards: esquinas redondeadas, fondo `#141414`, sin sombra visible (diseño plano)
- Inputs: borde sutil `#2E2E2E`, fondo oscuro, placeholder gris
- Separadores: línea fina `1px solid #2E2E2E`

### 3.4 Iconografía

- Lucide React (o similar) para íconos de nav y UI
- WhatsApp: ícono verde propio
- Facebook e Instagram en footer
- Íconos de proceso en `/sell`: paquete, dólar, check
- Íconos de categorías: herramientas, jardín, silla, parrilla, etc.
- Avatar de testimonial: círculo con inicial en dorado

---

## 4. Anatomía de Componentes por Pantalla

### 4.1 Homepage (`/`)

**Estructura vertical:**
1. **Announcement bar** — Fondo negro, texto crema/dorado. Marquee animado con 4 mensajes:
   - "Open! Daily 6am–10pm"
   - "Save up to 70% off retail prices today at JD Power Warehouse!"
   - "Have overstock or returned items? **Sell your items to us!**" (link dorado)
   - "New inventory added weekly!"

2. **Sub-header** — Fondo muy oscuro (`#0F0F0F`):
   - Izquierda: 📞 (815) 555-0123 | Hours: Daily 6am-10pm | Plainfield, IL
   - Derecha: Iconos Facebook, Instagram, botón WhatsApp, toggle idioma 🌐 ES

3. **Navegación principal** — Fondo transparente sobre dark:
   - Logo JD POWER (círculo, escudo, amarillo/negro) — izquierda
   - Links: Home | Catalogue | Sell Your Items | Testimonials | About Us | Contact
   - Botón CTA dorado: **"View Inventory"**

4. **Hero** — Imagen de fondo de taller/herramientas, overlay oscuro semitransparente:
   - H1 blanco 72px: "Quality Home Improvement for Less"
   - Subtítulo crema: "Discounted tools, hardware, landscaping, and outdoor furniture from Plainfield, IL."
   - CTA dorado: **"View Inventory"**
   - Card derecha (dark glassmorphism): "Quick Inquiry" — inputs Name, Phone, "What are you looking for?", botón Submit Request

5. **Explore Categories** — Grid horizontal de 6 categorías con ícono y label:
   - Tools & Construction Supplies
   - Landscaping Products
   - Outdoor Furniture
   - Grills & Outdoor Cooking
   - Seasonal Deals
   - Home Improvement Products
   - Todas redirigen a `/shop`

6. **Why Shop With Us** — 2 columnas: imagen izquierda (warehouse shelves), texto derecha:
   - Unbeatable Prices
   - Quality Tested
   - Our Community (Motto)
   - Local Pickup

7. **"Have overstock or items to liquidate?"** — Dark section, texto + bullets + imagen:
   - CTA: **"Start Selling"** → `/sell`

8. **CTA Final** — Banda ancha dorada `#F3C41B`, texto negro:
   - "READY TO START YOUR NEXT PROJECT?"
   - Botones: "Browse Inventory" (negro) | "Message on WhatsApp" (negro con ícono)

9. **Footer** — 4 columnas sobre fondo `#0A0A0A`:
   - Col 1: Logo JD POWER + "JD POWER WAREHOUSE" + tagline
   - Col 2: Quick Links (Home, Shop Inventory, Sell Your Items, Testimonials, About Us)
   - Col 3: Store Info (teléfono, WhatsApp Support, Plainfield & Homer Glen IL, Daily 6am-10pm)
   - Col 4: Follow Us (Facebook, Instagram)
   - Barra inferior: Privacy Policy • Terms & Conditions • Refund Policy • Shipping Policy | © 2026

### 4.2 Catalogue / Shop (`/shop`)

- Announcement bar + sub-header + nav (idénticos a home)
- **H1 dorado:** "Our Inventory"
- **Controles de filtro:** buscador texto | dropdown "All Categories" | sort "Name A-Z" | icono carrito 🛒
- **Grid de productos:** 4 columnas (desktop), 2 columnas (tablet), 1 columna (mobile)
- **Product Card:**
  - Badge de categoría esquina superior (ej. "Outdoor", "Tools", "Home Improvement")
  - Badge "Sale" o "New" si aplica
  - Imagen del producto (ratio ~4:3 o 1:1)
  - Nombre del producto (blanco, bold)
  - Precio en dorado (`$450`)
  - Descripción corta (gris, 1-2 líneas)
  - Botón "**+ Add to Cart**" (dorado, full-width en la card)
- **Footer mínimo:** solo 4 links legales + copyright (sin columnas)

**Productos observados en /shop:**
- 7-Piece Patio Dining Set — $450
- DeWalt 20V Max Drill Combo Kit — $129
- Folding Adirondack Chair — $65
- Gorilla Carts Steel Utility Cart — (precio no capturado)
- Kitchen Faucet with Pull-Down Sprayer — $95
- LED Shop Light (4ft) — $19
- Milwaukee M18 Fuel Sawzall — $159
- Outdoor Solar Path Lights (6pk) — $24
- Ridgid 14 Gal Wet/Dry Vac — (precio no capturado)
- Ryobi 40V Brushless Mower — $299
- Smart Wi-Fi Thermostat — $89
- Weber Spirit II E-210 Gas Grill — $349

### 4.3 Sell Your Items (`/sell`)

- H1 dorado 48px: "Sell Your Items to Us"
- Subtítulo: "Have overstock or items you want to liquidate? We buy quality home improvement goods."
- **Proceso en 3 cards:** Submit Details → Get an Offer → Get Paid
- **Formulario completo:**
  - Full Name (input)
  - Email Address (input)
  - Phone Number (input)
  - Item Name (input, placeholder "e.g. DeWalt Miter Saw")
  - Item Description (textarea, placeholder "Describe the condition, age, and any issues…")
  - Condition (radio: New / Used)
  - Asking Price (input con prefijo `$`)
  - Upload Images (drag & drop zone, PNG/JPG hasta 10MB)
  - Botón dorado full-width: **"Submit for Review"**

### 4.4 Testimonials (`/testimonials`)

- Hero con **fondo dorado sólido** `#F3C41B`, texto negro:
  - "Testimonials"
  - Subtítulo en negro
- Grid 3×2 de tarjetas de reseña (dark cards):
  - Estrellas (⭐⭐⭐⭐⭐) en dorado
  - Comillas decorativas grandes en gris
  - Cita en cursiva
  - Avatar: círculo dorado con inicial, nombre, ciudad
- CTA final: "Join our community of happy DIYers"
  - Stats horizontales: LOCAL BUSINESS | COMMUNITY FIRST | QUALITY GUARANTEED

### 4.5 About Us (`/about`)

- H1 dorado: "Our Story" + subtítulo
- Sección "Our Mission" (col izquierda texto + col derecha 2 cards):
  - Card: "Family Owned" — Operated locally with a commitment to our neighbors.
  - Card: "Quality Assured" — Every item is inspected before it hits our floor.
- Sección "Community First": texto de ubicación
- **Footer completo** (4 columnas)

### 4.6 Contact (`/contact`)

- H1 blanco centrado: "Get In Touch"
- Subtítulo gris
- **4 info cards** con ícono dorado:
  - WhatsApp (+1 815-555-0123)
  - Call Us (+1 815-555-0123)
  - Location (Plainfield & Homer Glen, IL)
  - Hours (Daily 6am–10pm)
- **Formulario izquierda:**
  - Name | Phone (2 cols)
  - Email (full width)
  - "How can we help you?" (textarea)
  - Botón dorado: **"Send Message"**
- **Mapa derecha:** Embed de Google Maps centrado en Plainfield, IL
- "Connect With Us" con iconos social

### 4.7 Páginas Legales (`/privacy-policy`, `/terms-and-conditions`, `/refund-policy`, `/shipping-policy`)

- Header completo + nav
- Contenido de texto en prosa, sin estructura especial
- Footer mínimo (solo legal links)

---

## 5. Navegación y Flujos Observados

### Flujo de compra observado:
```
Homepage → Explore Categories / "View Inventory" → /shop (catálogo)
→ Product Card "Add to Cart" → [estado desconocido, posiblemente WhatsApp]
```

### Flujo de venta:
```
Top bar "Sell your items to us!" / Nav "Sell Your Items" → /sell
→ Formulario → Submit for Review
```

### Flujo de contacto:
```
Nav "Contact" → /contact → Formulario / WhatsApp / Teléfono
```

### Navegación por idioma:
- Toggle `🌐 ES` visible en sub-header derecha
- Indica soporte bilingüe EN/ES

### WhatsApp flotante:
- Botón flotante dorado círculo con ícono de burbuja de chat (visible en /sell, /contact y otros)
- Posición: bottom-right

---

## 6. Identidad Visual Confirmada

### Logo
- Círculo con escudo/rayo, colores negro y dorado
- Texto "JD POWER" en arco superior, ícono central, "WAREHOUSE" abajo
- Dimensiones originales: 1254×1254 px
- Uso: nav (pequeño ~60px) + footer

### Tono de marca
- Oscuro/industrial — evoca almacén y trabajo manual
- Dorado/ámbar — premium, confianza, energía
- Sin colores pastel, sin diseño genérico B2B corporativo
- Fotografías reales de productos y del warehouse

### Animaciones observadas
- Marquee animado en announcement bar (scroll horizontal)
- No se observaron animaciones complejas
- Hover states no capturados (requeriría inspección manual adicional)

---

## 7. Diferencias con el Proyecto Next.js Actual

| Aspecto | Referencia | Nuestro proyecto actual |
|---------|-----------|------------------------|
| Pantallas | 10 rutas reales | Solo scaffolding Next.js vacío |
| Tema | Oscuro #0A0A0A + dorado | Tailwind por defecto (light) |
| Fuente | System sans-serif | Inter por defecto |
| CSS vars | shadcn/ui pattern (HSL) | Globals básico de Next.js |
| Tailwind | v4 (estimado) | v4 instalado ✅ |
| Componentes | ~15 componentes únicos | Ninguno implementado |
| Cart/Checkout | No existe en referencia | No implementado |
| Auth | No existe en referencia | No implementado |
| Idioma | EN + ES | No implementado |

---

## 8. Recursos Reutilizables Identificados

### Imágenes (via CDN de Vibe):
- Logo JD Power: `vibe.filesafe.space/…/151663a7-…` (1254×1254)
- Imágenes de productos: domain `vibe.filesafe.space` — NO reutilizar sin autorización

### Librería de íconos:
- Stack compatible con Lucide React (ya instalado en nuestro `package.json`)

### Variables CSS:
- El sistema de diseño usa HSL tokens compatible con shadcn/ui
- Podemos replicar la paleta exacta con las variables documentadas arriba

---

## 9. Plan de Reconstrucción por Prioridades

### Fase 1 — Fundamentos visuales (sin datos dinámicos)
**Objetivo: replicar la identidad visual y estructura antes de conectar datos**

1. Configurar tokens de diseño en `globals.css` (paleta dark + dorado)
2. Layout base: announcement bar + sub-header + nav + footer
3. Homepage estática: hero + categories + why us + CTA band
4. `/shop` estático: grid de productos con cards
5. `/sell` estático: formulario de venta
6. `/contact` estático: form + info cards
7. `/testimonials` + `/about` estáticos
8. Páginas legales (texto)

### Fase 2 — Interactividad básica
1. Búsqueda y filtros en `/shop`
2. Toggle idioma EN/ES
3. WhatsApp flotante funcional
4. Formularios con validación (sin backend)
5. Carrito (si se decide implementar vs. modelo WhatsApp)

### Fase 3 — Backend y datos
1. Integración Supabase para productos
2. Formularios conectados a backend
3. Auth (si se requiere — no existe en referencia)
4. Panel admin para inventario

### Prioridad de componentes:
```
1. AnnouncementBar
2. SubHeader
3. Navbar (con logo, links, CTA, lang toggle)
4. Hero (con imagen + form lateral)
5. CategoryGrid
6. ProductCard
7. ProductGrid (con filtros)
8. FeatureSection ("Why Shop With Us")
9. SellCTABand
10. YellowCTABand
11. ContactInfoCards
12. ContactForm
13. TestimonialCard / TestimonialGrid
14. Footer (4 columnas)
15. LegalPage (template)
16. SellForm (formulario complejo)
17. FloatingWhatsApp
```

---

## 10. Preguntas Abiertas / Información Faltante

1. **Modelo de compra:** La referencia tiene "Add to Cart" pero no hay `/cart` ni `/checkout`. ¿El MVP debe implementar carrito real o usar WhatsApp como canal de compra?
2. **Autenticación:** La referencia no tiene login/registro. ¿El proyecto B2B requiere cuentas de empresa?
3. **Multi-idioma:** La referencia tiene toggle EN/ES. ¿Implementamos `next-intl` desde el inicio?
4. **Hover states y microinteracciones:** No capturados. Requieren inspección manual en browser.
5. **Animación del marquee:** Implementar con CSS animation o librería.
6. **Fuente tipográfica:** ¿Confirmar system font o añadir una fuente personalizada?
7. **Producto real vs. demo:** Los precios y productos de la referencia, ¿son reales o demo?
8. **Panel de administración:** No existe en la referencia. ¿Está en scope?

Registrar decisiones pendientes en `docs/PROGRESS.md`.

---

## 11. Capturas de Referencia Disponibles

| Archivo | Viewport | Descripción |
|---------|----------|-------------|
| `home-desktop.png` | 1440px | Homepage completa |
| `home-tablet.png` | 768px | Homepage tablet |
| `home-mobile.png` | 390px | Homepage móvil |
| `shop-desktop.png` | 1440px | Catálogo de productos |
| `shop-mobile.png` | 390px | Catálogo móvil |
| `sell-desktop.png` | 1440px | Formulario de venta |
| `sell-mobile.png` | 390px | Formulario móvil |
| `contact-desktop.png` | 1440px | Página de contacto |
| `contact-mobile.png` | 390px | Contacto móvil |
| `testimonials-desktop.png` | 1440px | Testimonios |
| `testimonials-mobile.png` | 390px | Testimonios móvil |
| `about-desktop.png` | 1440px | Sobre nosotros |
| `about-mobile.png` | 390px | About móvil |
| `privacy-policy-desktop.png` | 1440px | Política de privacidad |
| `refund-policy-desktop.png` | 1440px | Política de devolución |
| `shipping-policy-desktop.png` | 1440px | Política de envío |
| `terms-and-conditions-desktop.png` | 1440px | T&C |

*Capturas de rutas inexistentes (account, cart, login…) muestran la página de inicio renderizada.*
