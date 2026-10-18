Generate a premium, data-dense Dashboard screen for the VeedorIA main portal using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, with dynamic Role-Based Access Control (RBAC) layouts and subscription-tiered feature gates.

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
- Interactive Theme Toggler: Include a Sun/Moon icon in the left sidebar bottom section that toggle-switches the entire layout between its Light and Dark mode versions.

Workspace Content Scope:
- This prompt specifies ONLY the main workspace dashboard content area. Do NOT generate the Left Sidebar, Top Header, or surrounding page layout wrappers (these are managed by the global container shell defined in [console_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/console_layout.md)).
- Enforce rendering this dashboard layout inside the main right-side scrollable workspace container.

Dynamic Dashboard Layout (Adapts depending on the active or simulated user role and plan tier):

### Layout Variant 1: For AUDITOR (B2G Government Auditor)
- Stats Cards Grid (1x4 Layout):
  * Card 1: `Procesos Activos` (Total number, e.g. "2,456" in bold Public Sans, with weekly sparkline).
  * Card 2: `Alertas de Fraccionamiento` (Total anomalies, e.g. "12", styled with warning amber icon).
  * Card 3: `Monto Fiscalizado` (Total contract sum, e.g. "RD$ 1.24B" in bold Public Sans, with green success icon).
  * Card 4: `Análisis de Sobreprecio (IA)`:
    - *Plan Gate:* If **B2G Básico**, this card displays a lock overlay with the message "Disponible en B2G Premium". If **B2G Premium/Enterprise**, displays the Trust Score Index value "92.0%" with a progress bar track.
- Central Workspace Panel:
  * Title: "Bandeja de Monitoreo de Procesos" (Public Sans, bold, 20px).
  * Table: Dense procurement datatable with columns: Code (mono), Description, Institution (e.g. MINERD, MOPC), Method, Amount (DOP, right-aligned), and Risk Level (Badge).
  * Risk Badges (Pills with 4px radius): `Crítico` (Coral container #ffdad6, dark red text #93000a), `Advertencia` (Amber container, dark orange text), and `Bajo` (Light blue container #d0e1fb, dark blue text #54647a).
  * *Plan Gate:* If **B2G Básico**, rows containing a `Crítico` overpricing risk display a blurred overlay over the specific "Amount" and "Risk Level" columns, with an inline tooltip: "Desbloquea B2G Premium para auditar sobreprecios unitarios".

### Layout Variant 2: For BIDDER (B2B Private Supplier)
*Note: Refer to Screen 3 (Market Intelligence) for the dedicated Supplier analytics dashboard. The main Overview for B2B bidders shows:
- Stats Cards Grid (1x4 Layout):
  * Card 1: `Licitaciones Activas` (Total bids tracked in supplier's sectors, e.g. "15").
  * Card 2: `Tasa de Éxito Estimada`:
    - *Plan Gate:* If **B2B PyME**, displays a lock icon with the text "Desbloquear con Plan Corporativo". If **B2B Corporativo**, displays a metric value e.g. "68%" with a blue progress bar.
  * Card 3: `Monto Adjudicado` (Total sum won, e.g. "RD$ 45.2M" in bold Public Sans).
  * Card 4: `Sectores Inscritos` (Number of UNSPSC categories tracked, e.g. "3 / 3").
- Central Workspace Panel:
  * Title: "Oportunidades de Licitación Recomendadas" (Public Sans, bold, 20px).
  * Table: Tenders matching supplier categories, columns: Code, Description, Buying Entity, Estimated Budget (DOP), Deadline, and Competitor Intensity (e.g., "Alta", "Media", "Baja" as clean badges).

### Layout Variant 3: For ADMINISTRATOR (System Admin)
- Stats Cards Grid (1x4 Layout):
  * Card 1: `Usuarios Activos` (Total logged-in users, e.g. "128").
  * Card 2: `Trabajos de Ingestión` (Background job status, e.g. "1 Ingesta Activa" with pulsing green indicator).
  * Card 3: `Alertas del Servidor` (System health errors, e.g. "0" with a green checkmark).
  * Card 4: `Uso de API (Mensual)` (API quota consumed, e.g. "72%").
- Central Workspace Panel:
  * Title: "Bitácora de Auditoría del Sistema" (Public Sans, bold, 20px).
  * Table: Immutable system logs, columns: Timestamp (mono), User (e.g., "admin@veedoria.ai"), Action (e.g., "Ingestión Manual Iniciada"), Entity Affected, IP Address.
  * *Global Visibility Note:* Admins are never subject to any subscription locks or blurred content. All tools, charts, and metrics are fully unlocked and visible to them, and they can simulate other roles using the preview toggle in the header.
