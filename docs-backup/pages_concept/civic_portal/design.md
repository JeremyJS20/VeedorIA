# VeedorIA Civic Portal — Spec & Stitch Prompt

This document defines the design and prompt specifications for **Screen 4: CivicTech Public Portal (/public)**, conforming to the **"The Institution"** design system and the citizen veeduría model.

---

## 1. Visual Layout & Structure

### 1.1 Civic Header & Title
* **Header:** A simple, clean version of the navigation bar. Lacks user profile or advanced configuration settings, showing only the theme toggle, language pill, and a button to return to the landing page.
* **Portal Title:** "Portal de Veeduría Ciudadana" (font-sans, bold, text-accent).

### 1.2 Interactive Search & Query Bar
* **Aesthetics:** Centered on the page, floating on a large glass card (`glass-card`, `24px` radius).
* **Placeholder:** "¿Qué deseas fiscalizar hoy? (ej. Laptops en MINERD, Asfalto en Obras Públicas, Jeringas en SNS)".
* **Style:** Large text input with a soft focus glow ring (using `--accent-primary-glow`). On focus, the background shifts to a deeper elevated tint.

### 1.3 National Budget Flow (Sankey Diagram)
A wide, interactive diagram showing where public funds end up:
* **Visual:** A Sankey diagram showing how the national budget flows from the top 5 Public Institutions (left) to the top 10 Private Contractors (right).
* **Hover:** Hovering over a stream reveals the total contract sum in DOP (using `font-mono`) and the percentage it represents of that agency's budget.
* **Color Coding:** Streams connected to high-risk suppliers or anomalous contracts glow in soft coral (`#F87171`), while normal flows stay in brand blue.

### 1.4 Price Checker & Markup Tool
* **Title:** "Comparador Comunitario de Precios Unitarios" (font-sans, 18px, medium).
* **Two Column Layout:**
  * **Left Column (Adjudicado por el Estado):** Shows the public unit price (e.g. `RD$ 85,000 / unidad` for `Laptops Educativas Intel Core i5` under a red banner warning `Licitación MINERD-2026`).
  * **Right Column (Precio en el Mercado Comercial):** Shows the verified average retail price (e.g. `RD$ 41,500 / unidad` in a green banner representing local consumer index).
  * **Central Badge:** A large warning pill stating `SOBREPRECIO DETECTADO: +104.8%` glowing in Coral.

---

## 2. Stitch Prompt

```text
Generate a civic portal screen for VeedorIA (/public route) using 'The Digital Institution' design system and Tailwind CSS 4 conventions.

Structure & Layout:
1. Navigation: A simple navigation header with the brand name "VeedorIA", a theme toggle, a language toggle, and a "Volver a Inicio" ghost button.
2. Centered Search Bar: A large, rounded, glassmorphic search input. Placeholder: "¿Qué deseas fiscalizar hoy? (ej. Laptops en MINERD)". Needs a large search button with a glowing cyan effect.
3. Wide Sankey Flow Chart: A visualization showing budget flows from 5 Public Institutions (on the left) to 10 Private Contractors (on the right). The flow paths must show transparent blue gradient fills.
4. Price Checker Widget: A split-column card comparing public vs retail prices:
   - Left Column: "Precio Adjudicado Estado" (RD$ 85,000 / unidad in a red alert banner, warning: Licitación MINERD).
   - Right Column: "Precio Promedio Mercado" (RD$ 41,500 / unidad in a green success banner).
   - Central Badge: A bold red pill stating "SOBREPRECIO DETECTADO: +104.8%" with a pulsing red glow.

Aesthetics:
- Canvas background is a deep navy void (#0A1628).
- Use frosted glass surfaces (backdrop-filter: blur(16px), background: var(--surface-card)) with zero solid 1px colored borders (No-Line rule).
- Apply high-contrast, accessible typography (Manrope for headers, Inter for UI text, JetBrains Mono for codes/prices).
- Active elements must showcase a soft diagonal gradient and a subtle blue-tinted drop glow shadow (box-shadow).
```
