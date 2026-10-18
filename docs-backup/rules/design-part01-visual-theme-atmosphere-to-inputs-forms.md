# Design System: The Institution



## 1. Visual Theme & Atmosphere

The design language is **immersive, institution-grade, and dual-themed** — establishing an authoritative "Digital Institution" presence — supporting both a deep-navy dark mode and a clean, clinical light mode. The brand identity draws from an institutional blue palette: deep navy anchors authority, while royal-to-bright blue gradients evoke digital trust and technological precision.

**Dark Mode:** A premium dark neutral canvas inspired by Stitch's dark theme — solid hex surfaces across 6 elevation levels, lighter blue primary for better contrast, and warmer text tones. A faint blue radial gradient at the canvas top prevents the background from feeling flat while keeping focus on content.

**Light Mode:** A bright, airy canvas with a very subtle blue tint (`#f9f9ff`), where surfaces become solid white panels with subtle shadows instead of glows. The blue accents remain vibrant against the light backdrop, and navy text grounds the hierarchy with authority.

Every surface floats with frosted-glass translucency (dark) or soft elevation shadows (light), reinforced by precise borders. The density is **focused and minimal** — generous whitespace, consistent spacing, and a clear visual hierarchy that channels attention.

The aesthetic philosophy: **"The Digital Institution — authoritative depth with tactile precision."**

The UI actively rejects startup minimalism, using Architectural Asymmetry and intentional breathing room to curate a sophisticated, secure experience.



## 2. Theme Architecture

Theme management is handled by **HeroUI's `useTheme()` hook** (`@heroui/react`). No custom ThemeProvider. HeroUI manages:
- `data-theme` attribute + class on `<html>`
- System preference detection (`prefers-color-scheme`)
- Persisting user choice in `localStorage` (key: `heroui-theme`)

CSS custom properties on `:root` define light tokens; `[data-theme="dark"]` blocks override them.

```css
:root { /* light theme tokens */ }
[data-theme="dark"] { /* dark theme overrides */ }
```

**Default:** Light mode.

**Usage in React:**
```tsx
import { useTheme } from '@heroui/react'

const { resolvedTheme, setTheme } = useTheme()
// resolvedTheme is always 'light'|'dark' (never 'system')
```

**Theme Toggle:** A minimal icon button (sun/moon) using `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')`. Plain `<button>` element, positioned in the top-right corner of the glass card header.

> **Optional — Tailwind CSS Integration:** If your project architecture supports Tailwind CSS 4, the design tokens defined in this document can be bridged into Tailwind's utility system via `@theme`. See **Section 13: Tailwind CSS 4 Integration** for the full mapping strategy, critical gotchas, and component class conventions. All Tailwind-specific guidance in this document is **optional** and does not alter the core design system — projects using vanilla CSS custom properties remain fully compliant.



## 3. Color Palette & Roles



### Brand Colors (Theme-Invariant)

These core VeedorIA brand colors remain constant across both themes:

| Descriptive Name | Hex | Functional Role |
|---|---|---|
| The Institution Navy | `#1B2A4A` | Brand anchor — logo, key headings in light mode |
| Institutional Blue | `#003d9b` | Primary accent — CTAs, success states, active indicators |
| Bright Blue | `#0052cc` | Upper gradient terminus, deep accent |
| Light Blue | `#4d8fd6` | Highlight accents, informational states, secondary glow |



### Surfaces — Dark Theme (Solid Hex)

| Token | Value | Purpose |
|---|---|---|
| `--surface-lowest` | `#0c0e14` | Deepest canvas layer (sticky headers) |
| `--surface-base` | `#111319` | Base canvas — main background |
| `--surface-low` | `#1a1b21` | Low elevation (pill badges, secondary containers) |
| `--surface-card` | `#1e1f25` | Card surfaces |
| `--surface-elevated` | `#282a30` | Elevated cards, hover states |
| `--surface-highest` | `#33343b` | Highest surface (modals, dropdowns) |

All surfaces are solid hex values for the canvas background and container surfaces. Featured glass surfaces use `rgba()` with `backdrop-filter: blur(16px)`.



### Surfaces — Light Theme

| Token | Value | Functional Role |
|---|---|---|---|
| `--surface-base` | `#f9f9ff` | Base canvas — very subtle blue tint |
| `--surface-card` | `#ffffff` | Primary card background — solid white, no transparency |
| `--surface-elevated` | `#ffffff` | Elevated interactive surfaces — solid white |
| `--surface-inset` | `rgba(27, 42, 74, 0.04)` | Subtle navy tint for inset containers |
| `--surface-border` | `rgba(27, 42, 74, 0.10)` | Hairline borders — navy-tinted for contrast |
| `--surface-overlay` | `rgba(27, 42, 74, 0.60)` | Modal overlay — navy wash |



### Accent Colors (Semantic — Both Themes)

| Token | Dark Value | Light Value | Functional Role |
|---|---|---|---|---|
| `--accent-primary` | `#b2c5ff` | `#003d9b` | Primary CTA, success, active states |
| `--accent-tertiary` | `#ffb59b` | | Tertiary accent (warm highlight) |
| `--accent-primary-end` | `#003d9b` | `#0052cc` | Gradient terminus for primary buttons |
| `--accent-primary-dim` | `rgba(77, 143, 214, 0.12)` | `rgba(0, 61, 155, 0.10)` | Tinted backgrounds |
| `--accent-primary-glow` | `rgba(77, 143, 214, 0.25)` | `rgba(0, 61, 155, 0.15)` | Box-shadow halos (subtler in light) |
| `--accent-warning` | `#FBBF24` | `#F59E0B` | Warning states, manual review needed |
| `--accent-warning-end` | `#F59E0B` | `#D97706` | Warning gradient end |
| `--accent-warning-dim` | `rgba(251, 191, 36, 0.12)` | `rgba(245, 158, 11, 0.10)` | Warning tinted backgrounds |
| `--accent-warning-glow` | `rgba(251, 191, 36, 0.25)` | `rgba(245, 158, 11, 0.15)` | Warning glow |
| `--accent-error` | `#F87171` | `#EF4444` | Error states, rejection, failed verification |
| `--accent-error-end` | `#EF4444` | `#DC2626` | Error gradient end |
| `--accent-error-dim` | `rgba(248, 113, 113, 0.12)` | `rgba(239, 68, 68, 0.10)` | Error tinted backgrounds |
| `--accent-error-glow` | `rgba(248, 113, 113, 0.25)` | `rgba(239, 68, 68, 0.15)` | Error glow |
| `--accent-info` | `#4d8fd6` | `#0052cc` | Informational states, loading spinners |
| `--accent-muted` | `#9CA3AF` | `#6B7280` | Muted/expired states, deactivated elements |



### Text Colors

| Token | Dark Value | Light Value | Functional Role |
|---|---|---|---|---|
| `--text-primary` | `#e2e2ea` | `#1B2A4A` | Headlines, values, body copy |
| `--text-secondary` | `#c4c6d4` | `#434654` | Subheadlines, labels, descriptions |
| `--text-tertiary` | `#8d909e` | `#9CA3AF` | Fine print, metadata labels, timestamps |
| `--text-inverse` | `#0A1628` | `#FFFFFF` | Text on bright CTA buttons |
| `--text-on-accent` | `#0A1628` | `#FFFFFF` | Text on accent-colored elements |



## 4. Typography Rules

**Font Family (Display):** Manrope — a modern sans-serif with geometric character, loaded from Google Fonts with weights 400-900. Used for headlines, branding, and UI labels. Falls back to `Inter → system-ui → sans-serif`.

**Font Family (Body):** Inter — a clean, highly legible sans-serif optimized for screens. Used for body text, descriptions, and all reading content. Falls back to `system-ui → -apple-system → sans-serif`.

**Monospace:** JetBrains Mono (fallback: Fira Code → ui-monospace) — reserved exclusively for technical data values (session IDs, scores, raw JSON).

| Role | Size | Weight | Letter Spacing | Line Height |
|---|---|---|---|---|
| Headline (h1) | 1.625rem (26px) | 700 (Bold) | -0.02em (tight) | 1.25 |
| Subheadline | 0.9375rem (15px) | 400 (Regular) | Normal | 1.6 |
| Section Headers | 0.8125rem (13px) | 500-700 | 0.06-0.08em (wide) | Normal |
| Body / Labels | 0.8125rem (13px) | 500 | 0.02em | Normal |
| Data Values (mono) | 0.75rem (12px) | 400 | Normal | Normal |
| Micro Labels | 0.6875rem (11px) | 700 | 0.08em (very wide) | Normal |

Section headers and micro labels use `text-transform: uppercase` with generous letter-spacing, creating a "military briefing" quality that reinforces the security / verification theme.

**Responsive scaling:** Headlines shrink to 1.375rem (22px) below 480px viewport width.



## 5. Component Stylings



### Theme Toggle

* **Placement:** Top-right of the glass card, or in a fixed utility bar.
* **Style:** Plain `<button>`, 36px square, centered sun (☀️) or moon (🌙) icon via HeroUI `useTheme()`. In light mode shows moon icon (switch to dark); in dark mode shows sun icon (switch to light).
* **Transition:** `background-color 200ms ease, color 200ms ease`.
* **Behavior:** Calls `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')` from `useTheme()` — HeroUI handles `data-theme` on `<html>` and persists to `localStorage` automatically.



### Buttons

* **Primary (`.btn-primary`):** Oversized, tactile dimensions (minimum 64px height) with subtly rounded corners (12px radius). Background is a 135° diagonal gradient from `--accent-primary` to `--accent-primary-end`. Text uses `--text-on-accent`. Surrounded by a compound box-shadow using `--accent-primary-glow`. On hover, glow intensifies and button lifts 1px. On press, it exhibits a highly tactile, physical response, scaling down instantly (0.98x). In **light mode**, glow is subtler and replaced with a soft drop shadow for natural elevation.
* **Primary Variants:** `.warning` swaps to warning gradient, `.error` to error gradient — each with matching glow/shadow colors. Error and warning variants in light mode use `--text-on-accent`.
* **Secondary (`.btn-secondary`):** Fully transparent background. `--text-secondary` that brightens to `--text-primary` on hover. Smaller padding (10px 20px), medium weight (500). No glow, no border.
* **Ghost (`.btn-ghost`):** `--surface-inset` background with `--surface-border` border. `--text-secondary` text, small size (13px). On hover, elevates to `--surface-elevated` with brightened text.
* **Full Width:** `.full-width` modifier stretches any button to 100% container width.



### Cards / Containers

* **Security Badges:** Exceptionally soft, pill-like corners (32px radius) utilizing rich Glassmorphism (70% backdrop with a heavy 24px blur). Inner icons sit in contrasting pristine white containers.
* **Glass Card (`.glass-card`):** Reserved for featured elements (hero dashboard card, CTA banner). Uses **glass** in both modes: `backdrop-filter: blur(16px)` with `rgba(255, 255, 255, 0.7)` in light mode and `rgba(17, 19, 25, 0.7)` in dark mode. Dark mode adds a glow drop shadow and luminous top edge. Rounded corners 24px. Internal padding 24px. The `.glass-card-glow` class adds stronger blue glow.
* **Inset Panel (`.inset-panel`):** Solid surface card with `--surface-container` background, `--outline-variant` border, 16px radius. No backdrop blur — pure solid surface. On hover, background shifts to `--surface-container-high` (or `#ffffff` in light mode) via `.inset-panel-hoverable`. Used for portal cards, pricing cards, FAQ items, and price checker comparisons. This is the primary card pattern for most non-hero UI components.
* **Reason Banner (`.reason-banner`):** Uses `--accent-error-dim` background with `--accent-error` at 20% opacity border.



### Inputs / Forms

* **Text Input:** `--surface-inset` background, `--surface-border` border, 12px radius. On focus: border transitions to `--accent-primary` at 40% opacity, gains a 3px ring using `--accent-primary-glow`, and background deepens to `--surface-elevated`. Placeholder text in `--text-tertiary`. Smooth transition (350ms, custom ease-out).
