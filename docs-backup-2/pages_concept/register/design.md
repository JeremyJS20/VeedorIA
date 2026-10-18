Generate a premium, multi-step Registration screen for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, structured strictly around the platform's multi-tenant Organization database architecture.

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
- Interactive Theme Toggler: Include a Sun/Moon icon in the navigation header that toggle-switches the entire layout between its Light and Dark mode versions.

Page Structure & Multi-Step Registration Specifications:

1. Atmosphere:
   - A clean, light canvas background (#f9f9ff) matching the login page exactly. No floating spheres or glowing elements.
   - Includes a Sun/Moon theme toggler in the top-right corner.

2. Centered Register Card (450px width - Identical to the Login Card):
   - A white card (white background, 1px border using #cbd5e1, 16px radius, padding 32px) containing:
     * Header: A small shield icon in Institutional Blue (#003d9b) centered at the top, followed by the title "Crear Cuenta" (Manrope, bold, 24px) and subtitle "Regístrate e intégrate a tu espacio de trabajo" (Inter, 14px, color #434654, centered).
     * Multi-Step Wizard: A thin progress line (height 4px, background #f2f3ff) representing the active registration step:
       - Step 1: Tipo de Registro (Join vs. Create)
       - Step 2: Datos de Cuenta (User details)
       - Step 3: Activación/Pago (Verification/Checkout)

   - URL Parameter Handling (Pre-population Rule):
     * If the URL contains `?code=XYZ` (e.g., redirect from Invitation Gateway `/join?code=XYZ`):
       - Bypasses Step 1 automatically.
       - Progresses directly to Step 2, setting the active path to Option A (Join Organization).
       - Automatically populates the Invitation Code field with `XYZ`.
       - Triggers immediate backend validation of `XYZ` to show the corresponding organization badge ("Uniéndose a: [Org Name]").

3. Step 1: Selection of Registration Type (Vertical Stack inside the 450px card - bypassed if ?code is in URL):
   - Staggered vertical option cards (height 80px, 12px radius, 1px border #cbd5e1, padding 16px):
     * Option A: "Tengo un Código de Invitación" (Unirse a Organización)
       - Sublabel: "Para auditores gubernamentales autorizados o colaboradores invitados por una empresa."
       - Selection triggers the appearance of an Invitation Code input field inline.
     * Option B: "Registrar mi Empresa (B2B SaaS)"
       - Sublabel: "Crear una nueva organización y contratar un plan de inteligencia comercial."
     * Option C: Citizen Bypass (Acceso Ciudadano)
       - Sublabel: "Ingreso libre sin registro para veeduría cívica y prensa."
       - Clicking immediately redirects to the unauthenticated `/public` portal bypass.
   - Primary CTA: Solid Institutional Blue button. Height 56px, radius 12px, bold white text ("CONTINUAR").

4. Step 2: Account Creation Form (Appears when Option A or Option B is selected, 550px max width centered):
   - Google Sign-Up Button (Autofill): A full-width flat outline button (1px border #cbd5e1, Slate Grey text in Inter, 8px radius, height 48px, margin-bottom 16px) containing a Google icon and the text "Completar datos con Google".
     * *Autofill Behavior:* Clicking this button uses Google OAuth to fetch the user's Full Name and Email, automatically completing those fields and skipping manual password creation.
   - Social Divider: A thin horizontal line with a centered label "O REGISTRARSE CON CORREO" (Inter, Label-MD, color #505f76, margin-bottom 16px).
   - Form Fields (Custom input styles, 12px radius, input heights 48px, visible if manual registration is used):
     * Full Name input.
     * Email Address input.
     * Password input (with lock icon and strength meter indicator).
     * **If Option A (Join Organization) was selected:**
       - The validated Organization details are shown in a flat badge: e.g. *"Uniéndose a: Ministerio de Educación (MINERD) - Plan Premium B2G"*.
       - (Requires no additional organization fields since they are auto-resolved from the invitation code).
     * **If Option B (Create Organization) was selected:**
       - Company Name input.
       - Company RNC input (monospace font).
       - Plan Tier Selector (High-contrast tab toggle inside card: "Plan PyME - RD$ 5,000/mes" vs. "Plan Corporativo - RD$ 20,000/mes").
   - Primary CTA: Solid Institutional Blue button reading "CONTINUAR".

5. Step 3: Activation & Billing (Adapts dynamically to Step 1 selection):
   - **If Option A (Join Organization) was selected:**
     - Displays a summary: *"Tu cuenta de auditor/colaborador se asociará a la organización licenciada."*
     - Primary CTA: Solid Institutional Blue button reading "ACTIVAR CUENTA".
   - **If Option B (Create Organization) was selected:**
     - Displays invoice details: *"Suscripción de Empresa: [Plan Seleccionado]"*.
     - Credit Card fields (Card Number, Expiration MM/AA, CVV) with standard 12px input radius and 48px height.
     - Primary CTA: Solid Institutional Blue button reading "CREAR ORGANIZACIÓN Y PAGAR".

6. Login Redirect Link (Bottom):
   - Centered text link at the very bottom of the card: "¿Ya tienes una cuenta? Iniciar Sesión" (Inter, 13px, color #003d9b, hover text color #0052cc, bold highlight on "Iniciar Sesión"). Redirects back to the login page (/login).
