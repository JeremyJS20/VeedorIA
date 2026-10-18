# VeedorIA Market Intelligence Console — Spec & Stitch Prompt

This document defines the design and prompt specifications for **Screen 3: B2B Market Intelligence Console**, conforming to the **"The Institution"** design system and the B2B state-supplier business model.

---

## 1. Visual Layout & Structure

### 1.1 Header & Selector Area
* **Breadcrumbs:** `Inicio / Consola Analítica / Inteligencia de Mercado` (font-sans, `--text-secondary`).
* **Section Title:** "Inteligencia de Mercado B2B" (font-sans, 24px, bold).
* **Category Selector Dropdown:** A sleek, input-styled select box displaying the active UNSPSC classification (e.g., `43211503 - Computadoras Notebook` or `30111500 - Cemento`).
  * On click, opens a glassmorphic dropdown list with autocomplete.
  * Suggests categories matching the user's subscribed profile (as per B2B tiered model).

### 1.2 The 2x2 Analytics Grid
A balanced layout of glass containers (`glass-card`, backdrop blur `16px`) presenting high-impact charts:

1. **Gráfico 1: Tendencia Histórica de Precios (Line Chart)**
   * Shows price unit fluctuations of the selected UNSPSC category over the last 24 months.
   * Elements: A sharp cyan line representing the median price, and a semi-translucent light blue shaded area indicating the minimum and maximum market rates found in OCDS contracts.
   * Axis labels in monospace (`font-mono`, 11px).

2. **Gráfico 2: Cuota de Mercado de Competidores (Donut Chart)**
   * Represents the contract volume distribution among competitor suppliers.
   * Legend: Monospace list of supplier RNCs (e.g., `101-XXXXX-X`) and commercial names, showing their percentage share.
   * Segments separated by a clean 2px gap (strict visualization rules).

3. **Gráfico 3: "Sweet Spot" de Licitaciones (Vertical Bar Chart)**
   * A pricing histogram displaying the ranges of unit prices that successfully win bids.
   * The bar containing the median successful bidding price (the "sweet spot") is highlighted in glowing bright blue (`#0052cc`), while the others remain in semi-translucent inset backgrounds.

4. **Gráfico 4: Comportamiento del Comprador (Horizontal Bar Chart)**
   * Lists the top-purchasing public institutions for the selected category (e.g., MINERD, MOPC, SNS) sorted by total DOP volume.
   * Bars styled with a diagonal blue-to-royal gradient.

### 1.3 Upcoming Licitaciones Panel (Right Sidebar or Bottom Row)
* A compact vertical feed showing upcoming bids matching the user's categories.
* Each item card displays:
  * **Title:** Description of the bid (e.g., "Suministro de Laptops para Docentes").
  * **Buying Agency:** (e.g., "MINERD").
  * **Estimated Value:** (e.g., `RD$ 25,000,000` in JetBrains Mono).
  * **Deadline Indicator:** A badge displaying the remaining days (e.g., `Faltan 5 días` in warning amber or `Faltan 20 días` in calm cyan).

---

## 2. Stitch Prompt

```text
Generate a dashboard screen for the VeedorIA B2B Market Intelligence Console using 'The Digital Institution' design system and Tailwind CSS 4 conventions.

Structure & Layout:
1. Top Section:
   - Breadcrumbs: "Inicio / Consola Analítica / Inteligencia de Mercado" (text-fg-tertiary).
   - Heading: "Inteligencia de Mercado B2B" (font-sans, bold).
   - Category Selector: A custom dropdown showing the active UNSPSC classification (e.g. "43211503 - Computadoras Notebook") with a search icon.
2. Analytics Grid (2x2 glass-card layout):
   - Card 1 (Price Trend): A line chart showing historical unit price trends with a solid cyan line and a soft shaded blue band showing min/max ranges.
   - Card 2 (Market Share): A donut chart representing contract distribution among competitor RNCs with a monospace side legend.
   - Card 3 (Sweet Spot Histogram): A vertical bar chart showing successful bid price ranges, with the optimal winning price range bar highlighted in glowing bright blue.
   - Card 4 (Top Buyers): A horizontal bar chart listing the top purchasing government agencies (MINERD, MOPC, SNS) by total DOP volume.
3. Sidebar - Upcoming Bids: A compact vertical list showing upcoming tenders matching the active category. Each item card should show a title, agency, estimated amount in DOP (font-mono), and a time-remaining badge (e.g., "5 days left" in warning amber).

Aesthetics:
- Canvas background is a deep navy void (#0A1628).
- Use frosted glass surfaces (backdrop-filter: blur(16px), background: var(--surface-card)) with zero solid 1px colored borders (No-Line rule).
- Apply high-contrast, accessible typography (Manrope for headers, Inter for UI text, JetBrains Mono for codes/prices).
- Active elements must showcase a soft diagonal gradient and a subtle blue-tinted drop glow shadow (box-shadow).
```
