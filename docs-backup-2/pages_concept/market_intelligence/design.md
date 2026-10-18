Generate a dashboard screen for the VeedorIA B2B Market Intelligence Console using the 'Institutional Authority' design system and Tailwind CSS 4 conventions.

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

Workspace Content Scope:
- This prompt specifies ONLY the main workspace B2B Market Intelligence dashboard content area. Do NOT generate the Left Sidebar, Top Header, or surrounding page layout wrappers (these are managed by the global container shell defined in [console_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/console_layout.md)).
- Enforce rendering this layout inside the main right-side scrollable workspace container.

1. Workspace Header Toolbar (Top of page content):
   - Title: "Inteligencia de Mercado B2B" (Public Sans, bold, 32px, color #1B2A4A).
   - Category Selector Dropdown: Aligned to the right, a custom dropdown displaying the active UNSPSC classification (e.g. "43211503 - Computadoras Notebook"). Input style uses 1px border (#cbd5e1), white background, 12px radius, and height 40px. Upon focus, border transitions to 2px Institutional Blue (#003d9b) with a soft 2px blue outer glow.

2. Analytics Grid (2x2 layout of white cards with 1px borders and 8px radii, padding 24px, dynamic content depending on subscription tier):
   - Card 1 (Price Trend Line Chart):
     * Title: "Tendencia Histórica de Precios Unitarios" (Public Sans, bold, 18px).
     * Chart: A line chart showing historical unit price trends with a solid Institutional Blue line (#003d9b) and a soft shaded blue band (#d0e1fb) showing min/max ranges.
     * Axes: Solid Slate Grey (#505f76) lines with labels in Inter (11px, color #434654).
     * *Plan Gate:* If the user is on the **B2B PyME** tier, the chart is restricted to the last 12 months of historical data (visible warning banner at the top of the card: "Mostrando datos limitados a 12 meses (Plan PyME)"). If **B2B Corporativo**, it shows the full 24-month trend with an interactive date range selector.
   - Card 2 (Market Share Donut Chart):
     * Title: "Distribución de Adjudicaciones por RNC" (Public Sans, bold, 18px).
     * Chart: A donut chart representing contract distribution among competitor suppliers. Legend lists competitor names and RNCs (e.g. "101-XXXXX-X"), sorted by percentage, using Inter. Segments separated by a clean 2px gap.
     * *Plan Gate:* If **B2B PyME**, this card displays a blurred donut chart overlay with a lock icon and the centered text: "Desbloquea el Plan Corporativo para analizar la distribución y cuota de mercado de tus competidores directos".
   - Card 3 (Sweet Spot Histogram):
     * Title: "Rango de Precios con Mayor Éxito" (Public Sans, bold, 18px).
     * Chart: A vertical bar chart showing successful bid price ranges, with the optimal winning price range bar highlighted in glowing Institutional Blue (#003d9b).
     * *Plan Gate:* If **B2B PyME**, this card displays a lock overlay with a centered lock icon and the text: "Disponible en Plan Corporativo B2B. Obtén análisis predictivo para identificar el rango óptimo de precio ganador".
   - Card 4 (Top Buyers Horizontal Bar Chart):
     * Title: "Top Instituciones Compradoras" (Public Sans, bold, 18px).
     * Chart: A horizontal bar chart listing the top purchasing government agencies (MINERD, MOPC, SNS) by total DOP volume. Available to both PyME and Corporativo tiers.

3. Sidebar - Upcoming Tenders (Right Sidebar, 320px width):
   - Title: "Próximas Convocatorias del Sector" (Public Sans, bold, 18px, padding-bottom 16px).
   - Feed: A compact vertical list showing upcoming tenders matching the active category.
   - Each item is a card (white background, 1px border #c4c6d4, 8px radius, padding 16px, hover background #f2f3ff) displaying:
     * Title: Description of the bid (e.g. "Suministro de Laptops para Docentes" in Public Sans, bold, 14px).
     * Agency: Government buyer (e.g. "MINERD" in Inter, color #434654).
     * Estimated Amount: Value in DOP (e.g. "RD$ 25,000,000" in bold Public Sans).
     * Time-Remaining Badge: A flat pill badge (e.g., "5 días restantes" in warning amber or "20 días restantes" in calm blue).
