Generate a data-dense Organization Settings & Team Management console screen for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions.

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
  * Borders (Surface Border): 1px thin border (rgba(255, 255, 255, 0.05) or #434652)
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
  * "No-Line" Layout Rule: Structural layout sections are separated solely by background tonal shifts, not solid borders. When a border is legally/accessibly required, use a thin "Ghost Border" (10% opacity: #cbd5e1 in Light, #434652 in Dark).
  * Light Mode: Surfaces are solid white panels with soft elevation drop shadows (e.g. `rgba(27, 42, 74, 0.08)`).
  * Dark Mode: Surfaces are solid hex colors with subtle blue/primary glowing halos/box-shadows (e.g. `rgba(77, 143, 214, 0.25)`).
- Interactive Theme Toggler: Include a Sun/Moon icon in the left sidebar bottom section that toggle-switches the entire layout between its Light and Dark mode versions.

Structure & Layout:

Workspace Content Scope:
- This prompt specifies ONLY the main workspace Organization Settings content area. Do NOT generate the Left Sidebar, Top Header, or surrounding page layout wrappers (these are managed by the global container shell defined in [console_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/console_layout.md)).
- Enforce rendering this layout inside the main right-side scrollable workspace container.

1. Workspace Header Toolbar (Top of page content):
   - Title: "Ajustes de Organización" (Manrope, bold, 32px, color #1B2A4A).

3. Main Workspace Panel (White card, 1px border #cbd5e1, 16px radius, padding 32px, margin-top 24px):
   
   - Section 1: General Details (Grid 2 columns):
     * Left Column: Institution/Company Name input.
     * Right Column: Identification Number (RNC / Government ID) input (monospace font, readonly state).
     * Help Text: "Los detalles de facturación y nivel de plan se configuran de acuerdo a esta identificación."

   - Section 2: Team Members & Roster (Header: "Miembros del Equipo" in Manrope, bold, 20px):
     * Description: "Lista de usuarios autorizados que comparten acceso a esta consola de auditoría/licitaciones."
     * Member Table: Dense table, columns:
       - Member Name (with initials avatar circle).
       - Email Address.
       - Role Badge: `[Propietario]` (Accent Primary dim background) or `[Miembro]` (neutral background).
       - Join Date.
       - Actions: A ghost button reading "Remover" (red text on hover) to remove a user.
     * *Seat Quota Gauge (Seat Counter):*
       - Top Right of Section: Progress track indicating seat limits: "4 de 10 cuentas de auditores activas" (Inter, 13px, color #434654).

   - Section 3: Invitation System (Header: "Invitaciones al Espacio de Trabajo", Inset Panel, 16px radius, background #f2f3ff):
     * Description: "Comparte este código con tus colaboradores para que puedan unirse automáticamente a esta organización al registrarse."
     * Invitation Input Field: Monospace field displaying `MINERD-PREMIUM-XYZ` (readonly). Includes a "Copiar Código" outline button.
     * Danger Action: A secondary button reading "Regenerar Código" (solid warning/error tone). Includes a description warning: "Al regenerar el código, el token anterior quedará invalidado inmediatamente."

   - Section 4: Subscription & Billing Info (Visible only to B2B ORG_OWNER / B2G admin):
     * Header: "Suscripción Activa" (Manrope, bold, 20px).
     * Subscription Card (Background #f9f9ff, 12px radius, padding 20px):
       - Plan Name: "Plan Corporativo B2B" (or "Plan Premium B2G").
       - Monthly Cost: "RD$ 20,000 / mes" (bold, Institutional Blue).
       - Payment Method: "Tarjeta Visa terminada en 4242 (Vence 12/2028)" with a "Cambiar Tarjeta" ghost button next to it.
       - Billing History Link: "Descargar facturas fiscales anteriores ->" (Inter, 13px, color #003d9b).
       - Plan Actions (Flex row, gap 16px, margin-top 16px):
         * Primary outline button "Cambiar de Plan" (triggers PyME vs. Corporate comparison modal).
         * Danger link "Cancelar Suscripción".
