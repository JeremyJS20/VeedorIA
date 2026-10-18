Generate a premium, high-fidelity responsive Public Layout wrapper template for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, consisting of a sticky top horizontal Navigation Header and a simple Footer.

Aesthetic Guidelines & Design Tokens:
- Theme Name: The Institution (Institutional Authority).
- Dual-Mode Support (Light & Dark Versions): Provide styling tokens for both Light Mode (default) and Dark Mode.
- Color Mappings:
  * Light Mode: Canvas Base (#f9f9ff), Header Background (#ffffff), Text Primary (#1B2A4A), Text Secondary (#505f76), Border (#cbd5e1).
  * Dark Mode: Canvas Base (#111319), Header Background (#1e1f25), Text Primary (#e2e2ea), Text Secondary (#c4c6d4), Border (#434652).
- Typography: Display (Manrope), Body/UI (Inter).
- Shapes: Header CTAs (8px or 12px radius), Badges (20px pill).
- Depth & Shadows: Enforce the "No-Line" layout rule. Separation of main sections is handled by background tone shifts. Use a thin 1px ghost border (10% opacity) for the header bottom line.

Layout Structure:
1. One-Column Layout:
   - Sticky Top Header: 64px height, horizontal layout.
   - Main Body Content: Scrollable main viewport taking the full remaining width and height.
   - Footer: Positioned at the bottom of the page viewport.

Sticky Navigation Header Specifications:
- Height 64px, sticky position at the top, full width.
- Left: Brand name "VeedorIA" in bold Public Sans/Manrope next to a small shield logo in Institutional Blue (#003d9b).
- Center: Navigation links list in Inter (13px, weight 500):
  * "Buscador Ciudadano" (links to `/public`)
  * "Para Empresas" (scrolls to B2B landing section)
  * "Para Instituciones" (scrolls to B2G landing section)
  * Link Hover State: Muted text color transitions to Text Primary (#1B2A4A / #e2e2ea) with a subtle underline fade-in.
- Right (Utility Controls):
  * Live status badge with a green pulsing dot next to "Sync: LIVE" (monospace font, 11px, Slate Grey text).
  * Language selector dropdown toggle (ES / EN).
  * Sun/Moon Theme Toggler icon (toggles Light/Dark mode).
  * CTA Button: Primary outline button reading "INICIAR SESIÓN" (radius 8px, height 40px, text Institutional Blue in light, pastel blue in dark). Redirects to `/login`.

Public Footer Specifications:
- Height 80px, flat layout.
- Left: Copyright text "© 2026 VeedorIA. Algunos derechos reservados." (Inter, 12px, Text Secondary).
- Right: Quick privacy and terms links ("Términos y Condiciones", "Privacidad") in Inter (12px, Text Secondary).
