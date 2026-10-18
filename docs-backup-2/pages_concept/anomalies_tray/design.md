Generate a premium, high-density Anomaly Investigation Tray (`anomalies_tray`) and Forensic Drawer panel design specification for VeedorIA, tailored for B2G Auditor roles and aligned with the 'Institutional Authority' design system.

Aesthetic Guidelines & Design Tokens:
- Theme Name: The Institution (Institutional Authority).
- Dual-Mode Support (Light & Dark Versions): Provide styling tokens for both Light Mode (default) and Dark Mode.
- Color Mappings:
  * Light Mode: Canvas Base (#f9f9ff), Cards/Surfaces (#ffffff), Inset Panels (#f2f3ff), Text Primary (#1B2A4A), Text Secondary (#434654), Border (#cbd5e1).
  * Dark Mode: Canvas Base (#111319), Cards/Surfaces (#1e1f25), Inset Panels (#1a1b21), Text Primary (#e2e2ea), Text Secondary (#c4c6d4), Border (#434654).
  * Semantic Accents: High Severity Red (#F87171), Medium Severity Orange (#FB923C), Low/Normal Green (#10B981).
- Typography: Display (Manrope), Body/UI (Inter), Monospace (JetBrains Mono for RNCs, UNSPSC, process codes, and prices).
- Shapes: Primary Buttons/Inputs (12px radius), Cards/Panels (16px radius), Badges (20px pill).
- Depth & Shadows: Strict "No-Line" layout rule. Sections are separated by tonal background shifts. Thin ghost borders (10% opacity) are used only when structurally necessary.

Structure & Layout:

Workspace Content Scope:
- This prompt specifies ONLY the main workspace anomaly tray and forensic drawer page content. Do NOT generate the Left Sidebar, Top Header, or surrounding page layout wrappers (these are managed by the global container shell defined in [console_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/console_layout.md)).
- Enforce rendering this layout inside the main right-side scrollable workspace container.

2. Metrics Row (Tonal Inset Cards, Grid 1x4):
   - Card 1: "Total Anomalías" - Count: `142` (Large Manrope bold). Icon: Alert triangle.
   - Card 2: "Críticas / Alta Severidad" - Count: `28` in Coral Red. Icon: Shield alert.
   - Card 3: "En Investigación" - Count: `47` in Orange. Icon: Clock.
   - Card 4: "Resueltas (Mes)" - Count: `67` in Green. Icon: Badge check.

3. Toolbar & Filters (Flat layout above table):
   - Toolbar Actions Layout (Flex container, justify-between, items-center, gap 16px):
     * Local Search Input (Left): A text input field (12px radius, height 40px, 1px border #cbd5e1, with search icon, placeholder: "Buscar por código de proceso, título o RNC..."). Focus transitions border to 2px Institutional Blue with a soft 2px blue outer glow.
   - Dropdown Filters (Flex row, gap 12px, margin-top 12px):
     * "Estado de Alerta" selectbox (Pendientes [Default], Confirmadas, Descartadas, Todas).
     * "Tipo de Alerta" selectbox (Sobreprecio, Fraccionamiento, Colusión, Todos).
     * "Severidad Mínima" selectbox (Alta, Media, Baja).
     * "Fecha" selectbox (Últimos 30 días, 90 días, Personalizado).

4. Anomalies Vertical Stack (Card-based List):
   - Sorting: The vertical list of anomaly cards must be ordered in descending order of severity by default to prioritize critical cases.
    - Anomaly Cards (Height 130px, 16px radius, padding 16px, hover state shifts background to Surface Inset, 1px ghost border):
      * Left Border: A 4px thick vertical accent bar reflecting severity (Red for Critica, Orange for Media, Yellow for Baja).
      * Content Layout (Flexbox row, justify-between):
        - Left Side (Detail Summary):
          * Row 1: Anomaly Type Badge (e.g., pill badge "Sobreprecio" in red text/bg tint) + Process Code: `LPN-MINERD-2026-0012` (JetBrains Mono, 12px, bold Slate Grey).
          * Row 1b (Collusion only): Confidence pill badge right after the type badge. Green (`#10B981`) for "ALTA", Amber (`#F59E0B`) for "MEDIA", Gray (`#94A3B8`) for "BAJA". 20px height, 8px radius, white text 10px bold. Small text: "X señal(es)" in Text Secondary 10px.
          * Row 2: Process Title: "Adquisición de Laptops Educativas para Escuelas Públicas" (Manrope, 15px bold, Text Primary).
          * Row 3: Explanation Snippet: "Precio unitario adjudicado excede la mediana de mercado por +104.8%." (Inter, 13px, Text Secondary).
        - Right Side (Metrics & Actions):
          * Row 1: Amount Affected: `RD$ 4,120,000` (Large JetBrains Mono, bold, Text Primary).
          * Row 2: Date Detected: "2026-06-25" (JetBrains Mono, 11px, Text Secondary).
          * Row 3: "Investigar" link button (Inter, 13px, Institutional Blue, bold, with right-arrow). Clicking this opens the Forensic Drawer.

5. Forensic Investigation Drawer (Slides out from the right, occupies 40% width, blur backdrop):
   - Header:
     * Close button (Ghost cross icon) on the left.
     * Title: "Caso: LPN-MINERD-2026-0012" (Manrope, 18px bold).
     * Sublabel: "Unidad Compradora: Dirección General de Compras MINERD" (Inter, 13px, Text Secondary).
   - Inset Scrollable Panels:
      * Panel A: Risk Gauge (Semicircular Dial):
        - Semi-donut meter mapping confidence level (ALTA=95/100, MEDIA=75/100, BAJA=40/100). Needle color based on confidence: Green for ALTA, Amber for MEDIA, Red for BAJA.
        - Text indicator matches confidence level.
        - Below the dial: "X señal(es) de colisión detectadas" showing the exact `signals_count` from the backend. This replaces the old factor calculation.
      * Panel B: Price Scatter Plot (D3 simulation mock):
        - Title row (flex row, justify-between, items-center): "Dispersión de Precios Unitarios (UNSPSC 43211503 - Laptops)" (Inter, 12px bold, uppercase) + Expand icon button (Maximize2 from Lucide, 16px, ghost variant, text-outline). Clicking Expand opens the chart in Fullscreen Overlay (see section 6).
        - Y-Axis: Price in RD$. X-Axis: Suppliers/Contracts.
        - A horizontal dashed line representing the "Mediana Comercial de Referencia: RD$ 41,500".
        - Data points: Muted blue dots representing other competitive bids.
        - Target item: A large, pulsing Red Dot representing the awarded price: "RD$ 85,000" (labeled).
      * Panel C: Institution Split-Purchasing Timeline (Fraccionamiento):
        - Title row (flex row, justify-between, items-center): "Línea Temporal de Compras Asociadas (Últimos 90 Días)" (Inter, 12px bold, uppercase) + Expand icon button (Maximize2 from Lucide, 16px, ghost variant, text-outline).
        - Horizontal track with chronological ticks:
          - Tick 1 (60 days ago): `RD$ 2.4M` to Supplier X.
          - Tick 2 (45 days ago): `RD$ 2.3M` to Supplier X.
          - Tick 3 (10 days ago, analyzed): `RD$ 2.4M` to Supplier X.
          - Helper text alert below: "Tres adjudicaciones consecutivas al mismo proveedor por montos inferiores al umbral de Licitación Pública (RD$ 2.5M). Indicio de fraccionamiento." (Inter, 12px, Coral Red text, background red tint).
      * Panel D: Collusion Network Graph (D3 force simulation):
        - Title row (flex row, justify-between, items-center): "Red de Proveedores Vinculados" (Inter, 12px bold, uppercase) + Expand icon button (Maximize2 from Lucide, 16px, ghost variant, text-outline).
        - Interactive D3 force-directed graph showing suppliers as labeled circles and detected links as colored edges: shared_phone=red, shared_address=purple, shared_domain=amber, similar_name=blue, shared_rnc_prefix=gray. Edge thickness reflects weight.
        - Nodes are draggable. Force simulation re-runs on drag end.
        - Below the graph: a list of all connections in format "Supplier A ⟷ Supplier B (reason)" with alternating background rows (11px text).
6. Chart Fullscreen Overlay:
   - Any chart panel with an Expand icon button can be opened in a fullscreen overlay.
   - The overlay uses a `<Modal size="full">` from HeroUI: fixed position, full viewport, dark backdrop (`rgba(0,0,0,0.6)`) with `backdrop-blur-sm`.
   - The chart SVG re-renders at viewport dimensions (`calc(100vw - 48px)` wide × `calc(100vh - 48px)` tall) so D3 recomputes its layout for the larger canvas — force simulation spreads nodes farther apart, axis ticks redistribute, bars get more horizontal space.
   - Close controls: X icon (white, 24px) fixed at top-right (24px offset) + Escape key press.
   - The same chart component remounts inside the overlay (via React `key` change) to trigger a fresh D3 render with the new container size.

    - Resolution Action Block (Fixed at the bottom of the drawer):
     * Label: "RESOLVER ANOMALÍA" (Inter, 11px uppercase bold).
     * Textarea input: "Comentario / Justificación de la decisión (Obligatorio)" (12px radius, placeholder: "Describe los hallazgos o justificación fiscal...").
     * Buttons (Flex row, gap 12px):
       - Button A: "Confirmar Alerta (Red Flag)" - Solid Coral Red button. Height 48px, radius 12px, white text. Triggers escalation and logs action in AuditLog.
       - Button B: "Descartar Alerta (False Positive)" - Secondary flat outline button. Height 48px, radius 12px, Slate Grey text. Requires justification, logs action in AuditLog.
