Generate a premium login screen for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, with a clear bypass for unauthenticated Citizen access.

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

1. Atmosphere: A clean, light canvas background (#f9f9ff) with a subtle vertical layout grid. No floating spheres or glowing elements.
2. Centered Auth Card (450px width):
   - A white card (white background, 1px border using #c4c6d4, 8px radius, padding 32px) containing:
     * Header: A small shield icon in Institutional Blue (#003d9b) centered at the top, followed by the title "Acceder a VeedorIA" (Public Sans, bold, 24px) and subtitle "Ingresa tus credenciales para acceder a la consola" (Inter, 14px, color #434654, centered).
     * Email Input: A text input field with a user/mail icon on the left. White background, 1px border (#cbd5e1), 4px radius, 48px height. Focus state turns the border to 2px Institutional Blue with a soft 2px blue outer glow. Label is styled in Inter (Label-MD).
     * Password Input: A password input field with a lock icon on the left and a right-aligned ghost eye icon to show/hide password. White background, 1px border, 4px radius, 48px height.
     * Form Row (Flex row, justify-between, items-center, margin-top 16px):
       - Left: A custom "Recordarme" checkbox (4px radius, outline border, Inter label).
       - Right: "Olvidé mi contraseña" text link (Inter, color #003d9b, hover text color #003d9b).
     * Primary CTA: A full-width button. Height 56px, radius 4px, background solid Institutional Blue (#003d9b), bold white text ("INICIAR SESIÓN"), hover state darkens the background by 10%. No shadow or glow.
     * Bypass Option for Citizens (NO REGISTRATION REQUIRED):
       - A prominent, friendly text link centered below the primary button: "O CONTINUAR COMO CIUDADANO (Acceso libre sin registro)" styled in Inter (Label-MD, color #505f76, hover text color #003d9b, with an arrow indicator ->).
       - *Context:* This link immediately redirects to the public `/public` route, allowing any normal citizen to explore budget flows and price checks without creating an account or logging in.
     * Social Login Divider: A thin horizontal line with a centered label "O ACCEDER CON" in uppercase Inter (Label-MD, color #505f76).
     * Google Sign-In Button (margin-top 16px): A full-width flat outline button (1px border #cbd5e1, Slate Grey text in Inter, 8px radius, height 48px) containing a Google icon and the text "Acceder con Google".
     * Registration Redirect Link (Bottom):
       - Centered text link at the very bottom of the card: "¿No tienes una cuenta? Regístrate y selecciona tu plan" (Inter, 13px, color #003d9b, hover text color #0052cc, with a bold highlight on "Regístrate"). Redirects directly to the registration page (/register).