# VeedorIA Landing Page — Spec & Stitch Prompt

This document defines the high-fidelity, trust-inspiring design and prompt specifications for the **VeedorIA Landing Page**, aligned with the **"The Institution"** design system rules.

---

## 1. Visual Tokens (The Institution Standard)

### 1.1 Palette & Surfaces
* **Canvas Background (Dark Mode):** `#0A1628` (Deep navy void, projects authority and stability)
* **Glass Surface (Dark Mode):** `rgba(13, 25, 50, 0.70)` (Backdrop blur `16px`, soft glowing accents)
* **Institutional Blue:** `#003d9b` (Primary trust brand color)
* **Bright Blue:** `#0052cc` (Primary CTAs, active buttons)
* **Light Blue (Highlight):** `#4d8fd6` (Accents, informational icons, and progress bars)
* **Semantic Success (Green):** `#10B981` (Normal market rates, verified contracts)
* **Semantic Error / Coral (Red):** `#F87171` (Identified overpricing or high risk)

### 1.2 Typography & Tone
* **Branding & Headings:** `Manrope` (Authoritative display font, bold, professional)
* **Body Text:** `Inter` (Friendly, highly readable sans-serif)
* **Technical Metrics:** `JetBrains Mono` (Only for pricing, comparison indices, and RNC numbers)
* **Rule:** Clean, human-centered language. Avoid overly dense developer/hacker jargon. Focus on **transparency, fair competition, savings, and ease of use**.

---

## 2. Page Sections Layout

### 2.1 Nav Header (Sticky, 64px)
* **Left:** Clean shield icon in Institutional Blue + **VeedorIA** logo.
* **Center (The Gateways):** Navigation links: `Buscador Ciudadano`, `Para Empresas (B2B)`, `Para Instituciones (B2G)`.
* **Right:** A clean "Sincronizado con DGCP" badge with a pulsing green indicator (verifies data legitimacy) + CTA "Entrar al Sistema".

### 2.2 Hero Section: The Portal to Integrity (100vh)
* **Layout:** Asymmetrical 55/45 horizontal split.
* **Left Column (55%):**
  * *Context Badge:* `SISTEMA DE VEEDURÍA Y ANÁLISIS DE COMPRAS PÚBLICAS`.
  * *Headline:* "Inteligencia de Datos para Compras Públicas Claras y Competitivas" (`Manrope`, 54px, bold). Diagonal gradient text from Light Blue (`#4d8fd6`) to Institutional Blue (`#003d9b`).
  * *Description:* "VeedorIA transforma datos complejos de contrataciones estatales en información útil para todos. Ayudamos a los ciudadanos a vigilar el gasto público, a las empresas a licitar mejor, y al gobierno a comprar con integridad."
  * *Dual CTAs:*
    1. Primary CTA: "Buscar una Licitación Gratis" (Bright blue, oversized, tactile feedback).
    2. Secondary CTA: "Solicitar Demostración B2G" (Ghost button style).
* **Right Column (45% - Simplified Trust Dashboard):**
  * A premium glass card representing a simplified, real-time national procurement summary:
    * **Active Indicator:** `Monto Total Monitoreado: RD$ 142.5 Mil Millones` (Large typography).
    * **Trust Score Index:** A horizontal progress bar reading `94.8% Transparencia General` in Bright Blue.
    * **Recent Success Stories:** A clean, human-readable micro-feed:
      * `✓ MOPC resolvió alerta de fraccionamiento.`
      * `✓ Ahorro estimado proyectado: RD$ 12.4 Millones en la última semana.`

### 2.3 The Standards & Integridad Row (Social Proof)
* A clean, full-width row displaying recognized open data standards and compliance logos in monochrome gray:
  * `[OCDS Standard Compliant]` • `[DGCP Datos Abiertos]` • `[Open Contracting Partnership]` • `[AI Models Open Source]`

### 2.4 The Three Gateways (Targeted Audience Hooks)
A dedicated 3-column section showing exactly how the platform monetization and value models function:
1. **Citizen & Press (CivicTech - Free):**
   * *Icon:* Users / Globe.
   * *Copy:* "Fiscaliza el gasto público sin complicaciones. Explora alertas automatizadas de sobreprecio, flujos de fondos y reportes transparentes de forma gratuita."
   * *Action:* "Explorar Datos Abiertos" (Link with arrow).
2. **State Suppliers (B2B SaaS - Subscription):**
   * *Icon:* Trending Up / Target.
   * *Copy:* "Optimiza tus ofertas económicas. Accede al historial completo de precios unitarios adjudicados de tu sector, estima tu tasa de éxito y anticípate a licitaciones."
   * *Action:* "Ver Planes para Empresas" (Link with arrow).
3. **Public Institutions (B2G SaaS - Enterprise):**
   * *Icon:* Shield Check / Building.
   * *Copy:* "Protege el presupuesto de tu entidad. Detecta preventivamente riesgos de colusión de proveedores o anomalías de fraccionamiento antes de adjudicar."
   * *Action:* "Ver Soluciones de Auditoría" (Link with arrow).

### 2.5 The Friendly Price Checker Widget (Direct Engagement Hook)
An interactive widget that lets any user instantly understand what VeedorIA does.
* **Title:** "Compara los Precios del Estado con la Realidad del Mercado"
* **Subtitle:** "Ingresa un producto o mira nuestro ejemplo interactivo para ver cómo detectamos anomalías."
* **Interactive Container:**
  * **Product Input Area:** A clean search bar prepopulated with `Laptops Educativas Intel Core i5 (MINERD)`.
  * **Comparison Display:** Two columns:
    * Left (Estado): `RD$ 85,000 / unidad` (Risk Coral border, warns "Licitación MINERD-2026").
    * Right (Mercado Promedio): `RD$ 41,500 / unidad` (Success Green border, verified retail index).
    * **The Insight:** A central badge: `SOBREPRECIO DETECTADO: +104.8%` (Pulsing Coral glow). Below it, a simple text card explains: "VeedorIA detecta esta desviación analizando miles de facturas y registros de mercado automáticamente."

### 2.6 Real-Time Impact Indicators (Stats Section)
* A high-contrast grid showing key metrics monitored by our system (strictly within planned backend capability):
  * **RD$ 142.5 Mil Millones** - Fondos Monitoreados (Total contract volume analyzed).
  * **2,450+** - Proveedores Analizados (Total active state suppliers cataloged).
  * **92.0%** - Precisión de IA (Model verification accuracy).
  * **RD$ 412 Millones** - Desviaciones Identificadas (Total value of alerts generated).

### 2.7 Simple Pricing Table (Clarifying Business Intent)
* **Business (B2B):** `Plan PyME (RD$ 5,000/mes)` and `Plan Corporativo (RD$ 20,000/mes)`.
* **Government (B2G):** `Plan Auditoría (Desde RD$ 30,000/mes)`.
* *Note:* "El acceso a la veeduría y fiscalización ciudadana es y siempre será gratuito."

### 2.8 Frequently Asked Questions (FAQ Section)
* **¿De dónde provienen los datos?**
  * Directamente de la API de datos abiertos de la DGCP bajo el estándar OCDS.
* **¿El buscador público tiene algún costo?**
  * No, las herramientas para la ciudadanía son gratuitas.
* **¿Cómo detectan las irregularidades?**
  * Mediante modelos de IA (Isolation Forest) que identifican patrones inusuales de precios unitarios y colusión.

### 2.9 Final Call-To-Action Footer (Conversion Hub)
* A dark glass banner with a subtle blue underglow:
  * **Headline:** "¿Listo para impulsar la transparencia y la competitividad?"
  * **Dual Buttons:** `Iniciar Búsqueda Gratis` (Bright Blue) and `Consultar Soporte B2G` (Ghost).

---

## 3. Stitch Prompt

```text
Generate a high-fidelity, trust-building landing page for VeedorIA using the 'Digital Institution' design system. The page must be designed to engage all audiences (citizens, suppliers, and government). The hero is an asymmetrical split: the left features a gradient headline ("Inteligencia de Datos para Compras Públicas Claras y Competitivas") with dual CTAs, and the right holds a simplified glass dashboard displaying 'RD$ 142.5B Monitoreado', a transparency progress bar, and a success stories feed. Below the hero, place a 1x3 grid of glass cards showing three portals: CivicTech (Free), B2B Suppliers (Paid), and B2G Audit (Paid). Next, add an interactive 'Price Checker' widget comparing a public laptop price (in Red) vs a market price (in Green) showing a "+104.8% Markup" badge. Follow with a 1x4 grid of bold metrics (RD$ 142.5B+ monitored, 2,450+ suppliers, 92.0% AI accuracy, RD$ 412M deviations). Conclude with a clean pricing table, an elegant accordion FAQ section, and a final dark glass conversion banner at the bottom with bright CTAs. The design must look premium, modern, and highly accessible on a dark background.
```
