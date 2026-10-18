Generate a premium, multi-step Password Recovery and Password Reset flow for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, maintaining style consistency with the Login and Register screens.

Aesthetic Guidelines & Design Tokens:
- Theme Name: The Institution (Institutional Authority).
- Dual-Mode Support (Light & Dark Versions): Provide layouts and styling for both states.
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
- Shapes:
  * Primary Buttons & Inputs: 12px border radius. Primary buttons have minimum 64px height.
  * Inset Panels & Cards: 16px border radius.
- Depth, Shadows & Borders:
  * "No-Line" Layout Rule: Structural layout sections are separated solely by background tonal shifts, not solid borders. When a border is required, use a thin "Ghost Border" (10% opacity: #cbd5e1 in Light, #434652 in Dark).

Structure & Sub-Screen Specifications:

All screens are structured as a single 450px centered card with a ghost border, aligned perfectly with the Login layout.

1. Step 1: Request Password Recovery Screen (`/forgot-password`):
   - Header:
     * A small padlock icon in Slate Grey (#505f76) at the top.
     * Title: "Recuperar Contraseña" (Manrope, 24px, bold).
     * Subtitle: "Ingresa tu correo para recibir un enlace de restablecimiento seguro." (Inter, 14px, Slate Grey, centered).
   - Form Fields:
     * Email Address input (12px radius, 48px height, white background, 1px border #cbd5e1). Left-aligned envelope icon. Label is styled in Inter (Label-MD).
   - Primary CTA:
     * A full-width button reading "ENVIAR ENLACE" (Accent Primary gradient, height 56px, radius 12px, bold white text).
   - Footer:
     * Centered text link at the very bottom: "Volver a Iniciar Sesión" (Inter, 13px, color #003d9b, hover text color #0052cc, bold highlight). Redirects to `/login`.

2. Step 2: Email Sent Success Feedback Screen:
   - Header:
     * A checkmark shield icon in Green (#10B981) at the top, representing safety and verification.
     * Title: "Enlace de Acceso Enviado" (Manrope, 24px, bold).
     * Description: "Hemos enviado instrucciones para restablecer tu contraseña a **usuario@correo.com**. Revisa tu bandeja de entrada o carpeta de spam." (Inter, 14px, Slate Grey, centered).
   - Inset Card (Surface Inset background, 16px radius, padding 16px, margin-bottom 24px):
     * A small helper notice: "El enlace enviado tiene una validez de 15 minutos por razones de seguridad institucional." (Inter, 12px, centered, matching monospace parameters where appropriate).
   - Primary CTA:
     * A full-width button reading "VOLVER AL LOGIN" (gradient, height 56px, radius 12px, bold white text, redirects to `/login`).
   - Secondary Link:
     * A centered flat button "Reenviar correo de restablecimiento" (Inter, 13px, color #505f76, hover text color #003d9b).

3. Step 3: Set New Password Screen (`/reset-password?token=XYZ`):
   - Header:
     * A small key icon in Institutional Blue (#003d9b) at the top.
     * Title: "Restablecer Contraseña" (Manrope, 24px, bold).
     * Subtitle: "Crea una nueva contraseña segura para tu cuenta." (Inter, 14px, Slate Grey, centered).
   - Form Fields:
     * New Password input (12px radius, 48px height, lock icon on left, hide/show password eye toggle on right).
     * Confirm New Password input (12px radius, 48px height, lock icon on left).
   - Password Strength Meter:
     * A horizontal multi-segment bar displaying password complexity (Weak: Red, Medium: Yellow, Strong: Green) with labels highlighting missing requirements: "Mínimo 8 caracteres, 1 mayúscula, 1 número." (Inter, 11px).
   - Primary CTA:
     * A full-width button reading "ACTUALIZAR CONTRASEÑA" (Accent Primary gradient, height 56px, radius 12px, bold white text).
     * On successful submission, page displays a temporary toast/success banner and auto-redirects to `/login` after 3 seconds.
