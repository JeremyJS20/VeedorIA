Generate a high-fidelity, trust-building landing page for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions.

Aesthetic Guidelines & Design Tokens:
- Theme Name: The Institution (Institutional Authority).
- Dual-Mode Support (Light & Dark Versions): The screen must support and be generated in both Light Mode (default) and Dark Mode. Provide layouts and styling for both states.
- Light Mode Color Mapping:
  * Canvas Background (Base): Solid light with subtle blue tint (#f9f9ff)
  * Card/Panel Background (Surface Card): Solid white (#ffffff)
  * Secondary/Inset Surfaces (Surface Inset): Subtle navy-tinted light grey (#f2f3ff or rgba(27, 42, 74, 0.04))
  * Primary Text (Text Primary): The Institution Navy (#1B2A4A)
  * Secondary Text (Text Secondary): Slate Grey (#434654)
  * Primary Button & Active Accent (Accent Primary): Vibrant Institutional Blue (#003d9b). Primary buttons should use a 135° diagonal gradient from #003d9b (gradient start) to #0052cc (gradient end) with white text (#ffffff).
  * Secondary Actions (Accent Secondary): Slate Grey (#505f76)
  * Borders (Surface Border): 1px hairline border in navy-tinted grey (rgba(27, 42, 74, 0.10) or #cbd5e1)
- Dark Mode Color Mapping:
  * Canvas Background (Surface Base): Deep dark grey/black (#111319)
  * Card/Panel Background (Surface Card): Solid dark card surface (#1e1f25)
  * Secondary/Inset Surfaces (Surface Low/Elevated): Muted dark grey (#1a1b21 or #282a30)
  * Primary Text (Text Primary): Soft off-white (#e2e2ea)
  * Secondary Text (Text Secondary): Muted silver/grey (#c4c6d4)
  * Primary Button & Active Accent (Accent Primary): Soft pastel blue/purple (#b2c5ff). Primary buttons should use a 135° diagonal gradient from #b2c5ff (gradient start) to #003d9b (gradient end) with dark navy text (#0A1628).
  * Secondary Actions (Accent Secondary): Muted Slate (#505f76)
  * Borders (Surface Border): 1px thin border (rgba(255, 255, 255, 0.05) or #434654)
- Typography:
  * Display Font: Manrope (weights 400-900). For hero headlines, use Display-LG (56px bold, 64px line-height, -0.02em letterSpacing). Standard page headlines (h1) use Headline-LG (26px bold, 32px line-height).
  * Body Font: Inter (weights 400-700). Subheadlines use 15px regular, body copy and labels use 13px medium, micro labels use 11px uppercase with 0.08em wide tracking.
  * Monospace: JetBrains Mono. Reserved for technical/data values (e.g. 12px, regular).
- Layout & Spacing:
  * Spacing Scale: Base 8px rhythm (4px xs, 8px sm, 16px md, 24px lg, 32px xl, 48px 2xl).
  * Desktop Max-Width: 1280px. Gutters: 24px.
  * Mobile Margins: 16px.
- Shapes:
  * Primary Buttons & Inputs: 12px border radius. Primary buttons have minimum 64px height.
  * Secondary/Ghost Buttons, Nav links, Dropdowns: 8px border radius.
  * Inset Panels & Cards: 16px border radius.
  * Glass Cards & Hero Panels: 20px or 24px border radius.
  * Badges & Tags: 20px border radius (pill) or 4px.
- Depth, Shadows & Borders:
  * "No-Line" Layout Rule: Structural layout sections are separated solely by background tonal shifts, not solid borders. When a border is legally/accessibly required, use a thin "Ghost Border" (10% opacity: #c4c6d4 in Light, #747783 in Dark).
  * Light Mode: Surfaces are solid white panels with soft elevation drop shadows (e.g. `rgba(27, 42, 74, 0.08)`).
  * Dark Mode: Surfaces are solid hex colors with subtle blue/primary glowing halos/box-shadows (e.g. `rgba(77, 143, 214, 0.25)`).
- Interactive Theme Toggler: Include a Sun/Moon icon in the navigation header that toggle-switches the entire layout between its Light and Dark mode versions.

Page Structure & Section-by-Section Specifications:

1. Public Layout Scope:
   - This screen utilizes the centralized layout defined in [public_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/public_layout.md).
   - Do NOT generate the sticky top horizontal Navigation Header or Footer (these are managed by the parent public wrapper). Enforce rendering this landing body content inside the main viewport of the wrapper.

2. Split-Screen Hero Section (100vh):
   - Layout: 2-column grid (55% left, 45% right) on desktop, single column on mobile.
   - Left Column:
     * A small flat badge with #f2f3ff background, #003d9b text: "SISTEMA DE VEEDURÍA Y FISCALIZACIÓN" (Inter, Label-MD, 4px radius).
     * Headline: "Inteligencia de Datos para Compras Públicas Claras y Competitivas" (Public Sans, 48px, bold, line-height 56px, color #1B2A4A). The words "Compras Públicas" are highlighted in Institutional Blue.
     * Subheadline: "VeedorIA transforma datos complejos de contrataciones estatales en información útil para todos. Ayudamos a los ciudadanos a vigilar el gasto público, a las empresas a licitar mejor, y al gobierno a comprar con integridad." (Public Sans, 16px, color #434654, line-height 24px).
     * Action Buttons (Flex row, gap 16px): Primary button "BUSCAR LICITACIÓN GRATIS" (solid Institutional Blue #003d9b background, white text, 56px height, 4px radius, hover darkens by 10%). Secondary button "SOLICITAR DEMO" (outline style, 1px border #505f76, slate text, 56px height, 4px radius, hover background #f2f3ff).
   - Right Column (Simplified Trust Dashboard):
     * A flat white card (background #ffffff, 1px border #c4c6d4, 8px radius) representing a clean analytics overview:
       - Header: "Resumen de Integridad Nacional" (Public Sans, bold, 18px).
       - Stat Item 1: "Monto Total Monitoreado: RD$ 142.5 Mil Millones" (JetBrains Mono or Public Sans, bold, color #003d9b).
       - Trust Score Index: A clean track (height 6px, background #eaedff, 9999px radius) with a progress fill in Institutional Blue representing "94.8% Transparencia General".
       - Success Feed: 2 small text rows showing a checkmark icon next to "MOPC resolvió alerta de fraccionamiento" and "Ahorro estimado proyectado: RD$ 12.4M".

3. Standards & Integration Row:
   - A full-width row with a light grey background (#f2f3ff) and a thin bottom border.
   - Displays a centered row of monochrome compliance badges: OCDS Standard Compliant, DGCP Datos Abiertos, Open Contracting Partnership, AI Models Open Source. Text is styled in Inter (Label-MD, color #505f76).

4. The Three Gateways (Grid 1x3):
   - Centered container with a margin-top of 48px.
   - Title: "Soluciones a la Medida de cada Actor" (Public Sans, bold, 32px, centered).
   - Grid: Three cards (white background, 1px border #c4c6d4, 8px radius, padding 24px):
     * Card 1 (CivicTech - Ciudadano & Prensa): Globe icon, title "Portal Ciudadano", description "Fiscaliza el gasto público sin barreras técnicas de forma gratuita. Accede a alertas de sobreprecio y descarga reportes.", action text "Explorar Datos Abiertos ->" in Institutional Blue.
     * Card 2 (B2B SaaS - Proveedores): Trending Up icon, title "Para Proveedores", description "Optimiza tus ofertas económicas analizando el historial completo de precios unitarios adjudicados de tu sector.", action text "Ver Planes para Empresas ->".
     * Card 3 (B2G SaaS - Instituciones): Shield Check icon, title "Para Instituciones", description "Protege el presupuesto de tu entidad detectando preventivamente riesgos de colusión de proveedores o fraccionamiento.", action text "Ver Soluciones de Auditoría ->".

5. Interactive Price Checker Widget:
   - Container: White background card with 1px border (#c4c6d4), 8px radius, padding 32px.
   - Title: "Compara los Precios del Estado con la Realidad del Mercado" (Public Sans, bold, 24px, centered).
   - Subtitle: "Ingresa un producto para ver cómo detectamos desviaciones" (Public Sans, 14px, color #434654, centered).
   - Product Input Area: A clean search bar prepopulated with "Laptops Educativas Intel Core i5 (MINERD)" with a search button in solid Institutional Blue.
   - Comparison Grid (2 Columns):
     * Left Column (Estado): "Precio Adjudicado Estado" (Inter, Label-MD), large amount "RD$ 85,000 / unidad" (bold, color #93000a) inside a red-tinted alert card (background #ffdad6, 1px border #ffb4ab, 4px radius).
     * Right Column (Mercado Promedio): "Precio Promedio Mercado" (Inter, Label-MD), large amount "RD$ 41,500 / unidad" (bold, color #54647a) inside a blue-tinted card (background #d0e1fb, 1px border #adc6ff, 4px radius).
     * Central Badge: A bold red pill badge stating "SOBREPRECIO DETECTADO: +104.8%" centered between columns.

6. Real-Time Impact Indicators (Stats Section):
   - Grid of 4 items with a container-low background (#f2f3ff), padding 32px, 8px radius:
     * Stat 1: "RD$ 142.5B+" - Fondos Monitoreados (Total contract volume analyzed).
     * Stat 2: "2,450+" - Proveedores Analizados (Total active state suppliers cataloged).
     * Stat 3: "92.0%" - Precisión de IA (Model verification accuracy).
     * Stat 4: "RD$ 412M" - Desviaciones Identificadas (Total value of alerts generated).

7. Simple Pricing Table:
   - Title: "Planes Transparentes y Accesibles" (Public Sans, bold, 32px, centered).
   - Grid (3 Columns of white cards, 1px border, 8px radius):
     * Plan 1 (PyME B2B): "RD$ 5,000/mes". Includes category tracking and price history.
     * Plan 2 (Corporativo B2B): "RD$ 20,000/mes". Includes predictive winning rates and mass export.
     * Plan 3 (Auditoría B2G): "Desde RD$ 30,000/mes". Custom modules for government purchasing units.
     * Footnote: "El acceso cívico y ciudadano es totalmente gratuito."

8. Frequently Asked Questions (FAQ Section):
   - Clean accordion-style layout in Public Sans. Questions:
     * "¿De dónde provienen los datos?" (Answer: API de datos abiertos de la DGCP bajo el estándar OCDS).
     * "¿El buscador público tiene algún costo?" (Answer: No, es gratuito para periodistas, ONGs y ciudadanos).
     * "¿Cómo detectan las irregularidades?" (Answer: Modelos de IA de código abierto (Isolation Forest) que identifican precios atípicos).

9. Final Conversion Banner & Footer:
   - Banner: Flat container-low (#f2f3ff) background with a 1px border, large heading, and Institutional Blue CTA button.
   - Footer: Deep navy-black text (#1B2A4A), 3 columns of clean links (Plataforma, Transparencia, Legal), and badge "Powered by Datos Abiertos DGCP".
