Generate a premium, high-fidelity responsive Console Layout wrapper template for VeedorIA using the 'Institutional Authority' design system and Tailwind CSS 4 conventions, consisting of a Left Sidebar and a minimal Top Header.

Aesthetic Guidelines & Design Tokens:
- Theme Name: The Institution (Institutional Authority).
- Dual-Mode Support (Light & Dark Versions): Provide styling tokens for both Light Mode (default) and Dark Mode.
- Color Mappings:
  * Light Mode: Canvas Base (#f9f9ff), Sidebar Background/Surface Inset (#f2f3ff), Text Primary (#1B2A4A), Text Secondary (#505f76), Border (rgba(27, 42, 74, 0.08) or #cbd5e1).
  * Dark Mode: Canvas Base (#111319), Sidebar Background/Surface Inset (#1a1b21), Text Primary (#e2e2ea), Text Secondary (#c4c6d4), Border (rgba(255, 255, 255, 0.05) or #434652).
- Typography: Display (Manrope), Body/UI (Inter), Monospace (JetBrains Mono).
- Shapes: Primary Buttons/Inputs (12px radius), Sidebar Items (8px radius), Avatar (circular).
- Depth & Shadows: Enforce the "No-Line" layout rule. Sections are separated by background shifts. Use thin ghost borders (10% opacity) only for essential boundaries.

Layout Grid Structure:
1. Two-Column Layout (min-h-screen):
   - Left Column (Sidebar): Width transitions dynamically from 240px (expanded state) to 64px (collapsed state) using a smooth CSS width transition (transition-all, duration-300ms). Full height (100vh), fixed positioning.
   - Right Column (Main Viewport): Takes 100% of remaining width. Contains the Top Header (64px height) and the scrollable workspace container.

Left Sidebar Component Specifications:
1. Brand Header (Top):
   - Height 64px, flex row alignment.
   - Collapse Button: A circular icon button (height 24px, width 24px, 12px radius, white background, 1px border #cbd5e1, shadow elevation, pointer cursor) positioned absolutely on the right border edge of the sidebar (right-[-12px] top-[20px] z-index-20). Displays a chevron-left icon (when expanded) or chevron-right icon (when collapsed) that toggles the sidebar's state.
   - Logo Display Logic:
     * Expanded State (default): Displays the full logo, consisting of the shield isotype icon in Institutional Blue (#003d9b) next to the text logo "VeedorIA" in Manrope (bold, 18px, tracking-tight).
     * Collapsed State: Displays ONLY the shield isotype icon centered inside the brand area, hiding the "VeedorIA" text logo.
2. Navigation Links List (Inter, Label-MD, 13px, weight 500):
   - Items are rendered as flex rows (48px height, 12px horizontal padding, 8px border radius, transition duration 200ms).
   - Inactive State: Text and Lucide icon (20px x 20px) are Slate Grey (#505f76 in light, #c4c6d4 in dark) on a transparent background.
   - Hover State: Background transitions smoothly to rgba(27, 42, 74, 0.04) in light, rgba(255, 255, 255, 0.03) in dark. Text/icon color changes to Text Primary (#1B2A4A / #e2e2ea). Nav item container translates +2px to the right for an active responsive feel.
   - Active State: Background changes to rgba(0, 61, 155, 0.06) in light, rgba(178, 197, 255, 0.08) in dark. Text/icon turns to Institutional Blue (#003d9b) in light, pastel blue (#b2c5ff) in dark, with weight 600. A 4px vertical active indicator bar (height 24px, 2px radius) in solid primary color is rendered on the absolute left edge of the nav item.
   - Collapsed State Display: Hides all item label texts and right badges/locks, displaying ONLY the centered 20px Lucide icons. The active state left indicator bar remains fully visible.
3. Role-Based Menu Switcher (Dynamic links):
   - B2G Auditor: `Overview` (Home), `Procesos` (Table), `Bandeja de Alertas` (Bell), `Red de Colusión` (Network), `Configuración de IA` (Sliders).
     * If B2G Básico plan: `Red de Colusión` and `Configuración de IA` are set to 50% opacity, rendering a small Lock icon (14px) on the right. Hovering displays a tooltip "Disponible en Plan Premium".
     * Bell icon has a circular count badge (18px height) on the right. Monospace text (JetBrains Mono, 10px bold, white) on Coral Red (#F87171) background for pending critical alerts.
   - B2B Supplier: `Overview` (Home), `Mis Licitaciones` (List/Kanban), `Analítica de Precios` (Bar Chart), `Oportunidades` (Briefcase), `Suscripción` (Credit Card).
     * If B2B PyME plan: `Analítica de Precios` is gated with 50% opacity, a Lock icon, and upgrade tooltip.
   - Admin: `Overview` (Home), `Procesos` (Table), `Bandeja de Alertas` (Bell), `Red de Colusión` (Network), `Configuración de IA` (Sliders), `Gestión de Usuarios` (Users), `Logs del Sistema` (Terminal), `Soporte Técnico` (Lifebuoy). All items are fully unlocked.
4. Bottom Section (User Card & Preferences):
   - Vertical Layout Stack: Positioned at the bottom of the sidebar. It contains the User Profile Card on top, and the Logout Button positioned directly beneath it.
   - User Profile Card details: Flex container displaying Avatar (circular, 36px), Username (Inter, 13px bold), and Role/Tier badge (Inter, 11px, Text Secondary).
     * Collapsed State Display: Hides the username, role/tier badge, and the 3-dots trigger. Displays ONLY the centered circular avatar. Clicking the avatar directly opens the preferences dropdown popover.
   - Dropdown Trigger: A 3-vertical-dots icon button placed on the right of the user card (only visible when expanded).
   - Floating Dropdown Menu (Overlay): Rendered on top of all layout layers (absolute positioning, z-index 50, shadow elevation, 1px ghost border). Contains a vertical stack of buttons for "Language (ES/EN)", "Ajustes de Cuenta", and "Modo Oscuro" toggler. Does NOT shift sidebar layout when opened.
   - Logout Button: Ghost button (12px radius, height 40px, red text #EF4444 on hover) positioned directly below the User Profile Card.
     * Collapsed State Display: Collapses the full button text into a simple, centered exit icon (Lucide `LogOut`, 20px x 20px) positioned below the user avatar.

Top Header Component Specifications:
1. Minimalist Bar:
   - Height 64px, bottom border with 10% opacity.
   - Left: Breadcrumbs navigation in Inter (12px, Text Secondary).
   - Center: Empty space for clean layout.
   - Right (Admin Role Simulator Dropdown):
     * A select dropdown menu reading "Simular Rol:". Active only for ADMIN role. Options: `[ADMIN (Actual)]`, `[AUDITOR B2G PREMIUM]`, `[AUDITOR B2G BÁSICO]`, `[OFERENTE B2B PYME]`, `[OFERENTE B2B CORPORATIVO]`.
     * Selecting an option dynamically re-renders the Sidebar links, plan gating locks, and dashboard viewports in real time to preview the user role experiences.
