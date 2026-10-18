Generate a premium, single-card Invitation Gateway screen for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, designed to handle dynamic referral codes (`/join?code=XYZ`) for joining existing Organizations.

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
  * Monospace: JetBrains Mono. Reserved for technical/data values (e.g. 12px, RNC numbers, and verification codes).
- Layout & Spacing:
  * Spacing Scale: Base 8px rhythm (4px xs, 8px sm, 16px md, 24px lg, 32px xl, 48px 2xl).
- Shapes:
  * Primary Buttons & Inputs: 12px border radius. Primary buttons have minimum 64px height.
  * Inset Panels & Cards: 16px border radius.
- Depth, Shadows & Borders:
  * "No-Line" Layout Rule: Structural layout sections are separated solely by background tonal shifts, not solid borders. When a border is required, use a thin "Ghost Border" (10% opacity: #cbd5e1 in Light, #434652 in Dark).
  * Light Mode: Soft elevation drop shadows (e.g. `rgba(27, 42, 74, 0.08)`).
  * Dark Mode: Subtle primary glowing halos/box-shadows (e.g. `rgba(77, 143, 214, 0.25)`).

Page Structure & Flow:

1. Dynamic Router & Loader State:
   - When the user lands on `/join?code=XYZ` without a session:
     * A temporary, beautiful loading state is displayed centered in the page.
     * Spinner: A sleek, circular dual-tone spinner in Institutional Blue (light mode) or pastel blue (dark mode) with a message "Validando código de invitación..." (Inter, 14px, Slate Grey).
   - If the code is invalid or missing:
     * Card transitions to an Error State: Displays a warning shield icon in Red (#F87171), heading "Código Inválido o Expirado" (Manrope, 20px bold) and description "El código de invitación ingresado no existe o ha caducado. Por favor, solicita uno nuevo a tu administrador de organización." (Inter, 13px).
     * CTA: A full-width outline button reading "IR AL INICIO" (height 48px, radius 12px, redirecting to /).

2. Validated Invitation Gateway Card (450px width):
   - Card dimensions match the Login and Register cards exactly (450px width, padding 32px, 16px radius, ghost border).
   - Header:
     * A small colored badge at the top: "INVITACIÓN DETECTADA" (Inter, 11px uppercase bold, tracked, green text #10B981, background light green tint #ecfdf5).
     * Inviting Organization Display: A central circular logo placeholder (64px x 64px, 12px radius, light grey background with a building icon for B2G or a briefcase icon for B2B) displaying the name of the organization prominently, e.g. "Ministerio de Educación (MINERD)" or "Constructora Pérez S.R.L." in Manrope (18px, bold, centered).
     * Subtitle: "Te han invitado a unirte a este espacio de trabajo como Auditor/Colaborador." (Inter, 13px, color #434654, centered).

3. Split Action Pathways (Dual CTA layout):
   - Since the user could be a new registration or an existing team member with a different account:
     * Primary PATHWAY (New User):
       - A large, prominent gradient button "CREAR NUEVA CUENTA" (height 56px, radius 12px, bold text, Accent Primary gradient).
       - Clicking this redirects the user to `/register?code=XYZ`. This URL pre-population bypasses Step 1 (Registration Type Selection) on the Register page, directly opening Step 2 (Account details) with the Organization parameters pre-loaded.
     * Secondary PATHWAY (Existing User):
       - A flat outline button "CON CUENTA EXISTENTE / INICIAR SESIÓN" (height 48px, radius 12px, border #cbd5e1, text Slate Grey).
       - Clicking this redirects the user to `/login?code=XYZ`, linking their existing credentials to the new Organization upon successful login.

4. Organization Info Block (Bottom Inset):
   - Below the actions, a flat inset card (Surface Inset background, 16px radius, padding 16px) containing metadata about the invitation:
     * Label: "DETALLES DE LA LICENCIA" (Inter, 11px uppercase bold).
     * Row 1: "Plan Asociado:" - "B2G Gubernamental Premium" or "B2B SaaS PyME" (Inter, 13px, right-aligned bold).
     * Row 2: "Invitado por:" - "Administrador General" (Inter, 13px, right-aligned bold).
     * Row 3: "Código de Control:" - "MINERD-2026-XYZ" (JetBrains Mono, 12px, right-aligned, representing the invitation code in monospace).
