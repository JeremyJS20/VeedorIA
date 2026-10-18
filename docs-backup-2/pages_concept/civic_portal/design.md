Generate a civic portal screen for VeedorIA (/public route) using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, optimized for free, unauthenticated citizen access.

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
  * Display Font: Manrope (weights 400-900). Standard page headlines (h1) use Headline-LG (26px bold, 32px line-height).
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

Structure & Layout:

1. Public Layout Scope:
   - This screen utilizes the centralized layout defined in [public_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/public_layout.md).
   - Do NOT generate the sticky top horizontal Navigation Header or Footer (these are managed by the parent public wrapper). Enforce rendering this citizen portal search body content inside the main viewport of the wrapper.

2. Centered Search Bar:
   - Layout: Centered on the page, placed inside a white card (white background, 1px border #c4c6d4, 8px radius, padding 32px).
   - Title: "Portal de Veeduría Ciudadana" (Public Sans, bold, 32px, centered).
   - Search Field: A large text input with a 1px border (#cbd5e1), white background, and 4px radius. Focus state turns the border to 2px Institutional Blue with a soft 2px blue outer glow. Placeholder: "¿Qué deseas fiscalizar hoy? (ej. Laptops en MINERD, Asfalto en Obras Públicas)".
   - Search Button: Solid Institutional Blue button next to the input, styled with white text, 56px height, and 4px radius.
   - Natural Language Suggestion Chips (Flex row, wrap, gap 8px, margin-top 16px, items-center):
     * Label: "Sugerencias de búsqueda:" (Inter, 12px, Text Secondary).
     * Chips (Clickable pills, 20px radius, Inter 12px, height 32px, padding horizontal 12px, background #f2f3ff, text #003d9b, hover background rgba(0,61,155,0.08)):
       - "¿Cuánto gastó mi provincia?"
       - "Laptops con sobreprecio en MINERD"
       - "Proveedores con alertas en Obras Públicas"
       - "Contratos de asfalto en Santiago"

3. Wide Sankey Flow Chart Card:
   - Container: White background panel with 1px border (#c4c6d4), 8px radius, padding 24px, margin-top 32px.
   - Title: "Distribución del Presupuesto Nacional de Compras" (Public Sans, bold, 20px).
   - Subtitle: "Flujo de fondos públicos desde las principales instituciones hacia proveedores privados en la última semana." (Inter, 14px, color #434654).
   - Chart: A Sankey diagram showing budget flows from 5 Public Institutions (on the left) to 10 Private Contractors (on the right). The flow paths must show transparent blue gradient fills. Hovering over a path reveals a tooltip with the total amount in DOP (using Public Sans, bold) and percentage.

4. Interactive Geographic Purchase Map Card:
   - Container: White background card with 1px border (#c4c6d4), 8px radius, padding 24px, margin-top 32px.
   - Title: "Distribución del Gasto Público por Provincias" (Public Sans, bold, 20px).
   - Subtitle: "Mapa interactivo mostrando el volumen de contrataciones adjudicadas por provincia en pesos dominicanos (DOP)." (Inter, 14px, color #434654).
   - Interactive Map: Rendered SVG map of the Dominican Republic (divided by provinces). Provinces are colored using a HSL sequential scale based on purchase volume (high volume in deep navy blue, low volume in light blue-white).
   - Interactions: Hovering over a province highlights its borders (with a 2px Institutional Blue outline) and displays a tooltip card:
     * Heading: Name of the province (e.g., "Santiago", "Distrito Nacional").
     * Row 1: "Total Contratado:" (JetBrains Mono, e.g., "RD$ 12,450M").
     * Row 2: "Procesos Activos:" (Inter, e.g., "42 licitaciones").
     * Row 3: "Alertas Críticas:" (Inter, e.g., "3 sobreprecios" highlighted in Coral Red).
   - Clicking a province filters the search results below to display only procurement processes for that location.

5. Price Checker Widget:
   - Container: White background card with 1px border (#c4c6d4), 8px radius, padding 32px, margin-top 32px.
   - Title: "Comparador de Precios Unitarios en Tiempo Real" (Public Sans, bold, 20px, centered).
   - Layout: Two columns:
     * Left Column (Estado): "Precio Adjudicado Estado" (Inter, Label-MD), large amount "RD$ 85,000 / unidad" (bold, color #93000a) inside a red-tinted alert card (background #ffdad6, 1px border #ffb4ab, 4px radius). Includes the metadata "Licitación MINERD-2026".
     * Right Column (Mercado Promedio): "Precio Promedio Mercado" (Inter, Label-MD), large amount "RD$ 41,500 / unidad" (bold, color #54647a) inside a blue-tinted card (background #d0e1fb, 1px border #adc6ff, 4px radius).
     * Central Badge: A bold red pill badge stating "SOBREPRECIO DETECTADO: +104.8%" centered between columns.
