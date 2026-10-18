# VeedorIA Dashboard — Spec & Stitch Prompt

This document defines the design and prompt specifications for **Screen 2: Auditor / Citizen Dashboard (Monitoreo de Procesos)**, conforming strictly to **"The Institution"** design system.

---

## 1. Visual Layout & Structure

### 1.1 Collapsible Sidebar (Left, 240px to 64px)
* **Atmosphere:** Translucent dark blue glass panel (`bg-surface-card` with a backdrop blur of `16px`, bordered by `border-surface-border`).
* **Top Area:** Shield icon next to the bold word "VeedorIA" (`Manrope`, 18px). Hidden when collapsed.
* **Navigation Links:** Flex row alignment with Lucide-style icons.
  * Links: `Overview` (Home), `Procesos` (Table - active), `Red de Colusión` (Graph), `Alertas` (Bell), `Configuración` (Sliders).
  * Hover: Background changes to `--surface-inset`, text/icon brightens to `--text-primary`.
  * Active: Background changes to `--accent-primary-dim`, text/icon uses `--accent-primary`. Displays a 3px solid `--accent-primary` indicator bar on the left edge.
* **Bottom Area:** Auditor profile card with avatar and logout ghost button.

### 1.2 Dashboard Header (Top)
* **Breadcrumb:** Simple navigation path: `Inicio / Monitoreo de Procesos` (font-sans, 12px, `--text-secondary`).
* **Search Bar:** Centered input with a soft focus glow ring. Includes a right-aligned shortcut tag reading `Ctrl + K` in monospace (`font-mono`, 11px).
* **Live Status Badge:** Displays a pulsing green dot next to `DGCP Sincronizado hace 2 horas` (font-mono, `--text-secondary`).
* **Avatar & Theme Toggle:** Top-right utilities.

### 1.3 Stats Cards Grid (1x4)
Frosted glass cards (`glass-card`, 20px radius, soft drop shadows in light mode / subtle blue glows in dark mode) displaying core metrics:
1. **Procesos Activos**: Large total count (e.g., `2,456` in JetBrains Mono) with a small inline sparkline showing the 7-day trend.
2. **Anomalías Abiertas**: Highlighted with an error-red icon, displaying the total count of unreviewed alerts (e.g., `42`) with a small red trend delta (`+12%`).
3. **Monto Contratado**: Large formatted DOP currency amount (e.g., `RD$ 1.24B` in JetBrains Mono) with a success-green indicator icon.
4. **Confianza del Modelo**: Displays a trust index value (`92.0%`) with a horizontal gradient progress bar (`--accent-primary` to `--accent-primary-end`) showing the model confidence metric.

### 1.4 Central Procurement Table
A dense data table (`.table-container`) for exploring contracts:
* **Table Headers:** Uppercase micro-labels in monospace (`font-mono`, `text-fg-tertiary`, `tracking-wide`, 11px).
* **Columns:**
  * `Código`: The OCDS code of the process (e.g., `MINERD-CCC-LPN-2026-0004` in JetBrains Mono).
  * `Descripción`: Procurement title, truncated with an ellipsis and displaying a tooltip on hover.
  * `Institución`: Government buyer (e.g., `MINERD`, `MOPC`, `SNS` as clean text tags).
  * `Método`: Contract method (e.g., `Licitación Pública`, `Compra Menor`).
  * `Monto`: Formatted amount in DOP (e.g., `RD$ 45,200,000` in JetBrains Mono, right-aligned).
  * `Riesgo`: Semantic badge displaying the AI risk category.
* **Risk Badges:**
  * `Crítico`: Coral background, pulsing red dot, white text (used for high overpricing or collusion).
  * `Advertencia`: Amber background, orange text (used for pending review, bid fractioning).
  * `Bajo`: Cyan background, blue text (clean processes).
* **States:** 
  * Hovering over a row changes its background to `--surface-inset`.
  * Shimmer loading state uses skeleton bars to replace content before data resolution.

---

## 2. Stitch Prompt

```text
Generate a premium, data-dense Dashboard screen for the VeedorIA main portal using 'The Digital Institution' design system and Tailwind CSS 4 conventions.

Structure & Layout:
1. Left Navigation Sidebar (240px): A translucent glassmorphic panel (bg-surface-card, border-surface-border) containing:
   - At the top: Brand identity with a clean shield icon and the bold text "VeedorIA" (font-sans).
   - Navigation links with Lucide-style icons: Overview (Home), Processes (Table), Collusion Network (Graph), Alerts (Bell), Settings (Sliders). The active link should display in active blue (text-accent) with a subtle left indicator bar.
   - At the bottom: A clean profile card for the auditor with logout options.
2. Top Header Bar:
   - A search bar using input-style classes, including a keyboard shortcut indicator "Ctrl + K" in monospace (font-mono).
   - A live synchronisation status badge with a green pulsing dot reading "DGCP Sincronizado hace 2 horas" (font-mono, text-fg-secondary).
   - A theme selector (Sun/Moon icon) and user notification bell.
3. Stats Cards Grid (1x4): Four glass cards (glass-card) displaying:
   - Active Processes: Total number, weekly delta sparkline.
   - Open Anomalies: Semantic red alert icon, risk value, delta indicator.
   - Total Contract Value: Highlighted in green success, DOP currency.
   - Model Confidence Score: 92% trust meter progress bar using progress-bar styles (gradient track).
4. Core Datatable: A dense, professional table showing public procurement processes:
   - Headers styled with uppercase micro-labels (font-mono, tracking-wide, text-fg-tertiary, text-xs).
   - Columns: Code (font-mono), Description (truncated with ellipsis), Institution (e.g. MINERD, MOPC), Method, Amount (DOP, font-mono), Risk Level (Badge).
   - Status/Risk Badges: 'Critical' (Coral background, pulsing red circle, text-error), 'Warning' (Amber background, text-warning), and 'Low' (Cyan background).
   - A table-row shimmer skeleton state option showing initial loading state.

Aesthetics:
- Canvas background is a deep navy void (#0A1628).
- Use frosted glass surfaces (backdrop-filter: blur(16px), background: var(--surface-card)) with zero solid 1px colored borders (No-Line rule).
- Apply high-contrast, accessible typography (Manrope for headers, Inter for UI text, JetBrains Mono for codes/prices).
- Active elements must showcase a soft diagonal gradient and a subtle blue-tinted drop glow shadow (box-shadow).
```
