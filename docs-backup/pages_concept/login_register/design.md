# VeedorIA Login & Registration — Spec & Stitch Prompt

This document defines the design and prompt specifications for **Screen 5: Login & Registration**, conforming to the **"The Institution"** design system.

---

## 1. Visual Layout & Structure

### 1.1 Atmosphere & Backdrop
* **Canvas Background:** Deep navy void (`#0A1628`).
* **Visual FX:** A soft, large cyan glowing sphere (`--accent-primary-glow` background) positioned behind the login card, providing a warm, floating depth. No hard lines or patterns.

### 1.2 The Authentication Card
* **Dimensions:** Width `450px`, centered vertically and horizontally.
* **Surface:** Translucent glassmorphism (`glass-card`, blur `16px`, border `border-surface-border`, rounded corners `20px` radius).
* **Card Header:**
  * Shield icon in institutional blue centered on top.
  * Title: "Acceder a VeedorIA" (`Manrope`, 24px, bold).
  * Subtitle: "Ingresa tus credenciales para acceder a la consola" (`Inter`, 14px, `--text-secondary`).

### 1.3 Form Fields & Inputs
1. **Email Input:**
   * Inset glass background (`--surface-inset`), border (`--surface-border`), radius `12px`.
   * Includes a left-aligned Lucide User/Mail icon.
   * Focus state: Border turns to `--accent-primary` (40% opacity) and gains a `3px` glow ring.
2. **Password Input:**
   * Same input styling as email, with a left-aligned Lucide Lock icon.
   * Includes a right-aligned ghost eye icon to "reveal password" on click.
3. **Form Utilities:**
   * Flex row container (`justify-content: space-between`, `align-items: center`).
   * Left: "Recordarme" checkbox (custom box-radius `4px`, checkmark animation).
   * Right: "Olvidé mi contraseña" text link (turns to `--accent-primary` on hover).

### 1.4 Primary Action Button (CTA)
* **Button:** Full width (`.full-width` modifier).
* **Style:** Height `56px`, radius `12px`. Background is a 135° diagonal gradient from `--accent-primary` (`#4d8fd6`) to `--accent-primary-end` (`#003d9b`).
* **Text:** "Iniciar Sesión" in bold, uppercase micro-label style (`font-sans`, 12px, tracking-wider, text-inverse).
* **Feedback:** Tactile scale response on click (`scale(0.97)`), and active blue drop glow shadow.

### 1.5 Social & Government Login (B2G/B2B options)
* **Divider:** A dashed line with a centered label: `O ACCEDER CON` (`font-mono`, 10px, `--text-tertiary`).
* **Buttons Grid (1x2):** Two translucent glass buttons for external auth provider options (e.g., Google or Firma Digital OGTIC).

---

## 2. Stitch Prompt

```text
Generate a premium login screen for VeedorIA using 'The Digital Institution' design system and Tailwind CSS 4 conventions.

Structure & Layout:
1. Atmosphere: A full-screen deep navy backdrop (#0A1628) with a soft cyan glowing radial blur sphere floating behind the center card.
2. Centered Auth Card (450px width): A frosted glass panel (glass-card, backdrop-filter: blur(16px)) containing:
   - Header: A small shield icon, title "Acceder a VeedorIA" (font-sans, bold), and subtitle "Ingresa tus credenciales".
   - Email Input: An input field with a user/mail icon, inset background, and a soft focus cyan border.
   - Password Input: An input field with a lock icon, a right-aligned "show password" eye icon, and a focus ring.
   - Form Row: A custom "Remember me" checkbox on the left, and a "Forgot password?" link on the right.
   - Primary CTA: A full-width login button with a height of 56px, styled with a blue-to-royal gradient, bold text ("INICIAR SESIÓN"), and a soft cyan drop glow shadow.
   - Social Login Divider: A dashed horizontal line with a centered label "O ACCEDER CON" in uppercase monospace.
   - Integration Buttons: Two translucent ghost buttons side-by-side for Google Auth and Firma Digital OGTIC.

Aesthetics:
- Canvas background is a deep navy void (#0A1628).
- Use frosted glass surfaces (backdrop-filter: blur(16px), background: var(--surface-card)) with zero solid 1px colored borders (No-Line rule).
- Apply high-contrast, accessible typography (Manrope for headers, Inter for UI text, JetBrains Mono for codes/prices).
- Active elements must showcase a soft diagonal gradient and a subtle blue-tinted drop glow shadow (box-shadow).
```
