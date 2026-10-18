# Theme: Custom

<!-- 
  Fill in YOUR project's design values below.
  Use any existing theme (THEME_INSTITUTIONAL.md, THEME_CORPORATE.md, THEME_FINTECH.md) as reference.
  All values are required — the design system maps CSS variables from these.
-->

theme_base: custom
mode: light <!-- or: dark -->

## Colors

### Primary family
- Primary: #
- Primary-light: #
- Primary-dark: #
- Primary-50: rgba(0, 0, 0, 0.04)
- Primary-100: rgba(0, 0, 0, 0.08)
- Primary-200: rgba(0, 0, 0, 0.12)

### Accent
- Accent: #
- Accent-hover: #
- Accent-muted: rgba(0, 0, 0, 0.12)

### Semantic
- Success: #16A34A
- Success-muted: rgba(22, 163, 74, 0.12)
- Success-light: #DCFCE7
- Warning: #CA8A04
- Warning-muted: rgba(202, 138, 4, 0.12)
- Warning-light: #FEF9C3
- Error: #DC2626
- Error-muted: rgba(220, 38, 38, 0.12)
- Error-light: #FEE2E2
- Info: #2563EB
- Info-muted: rgba(37, 99, 235, 0.12)
- Info-light: #DBEAFE

### Text
- Text: # (use off-black like #1C2333 or #1F2937 — never pure #000000)
- Text-secondary: #
- Text-disabled: #
- Visited-link: #7B1FA2

## Surfaces
- Page: # (use blue/warm-tinted like #F4F7F9 — never pure #F5F5F5)
- Card: #FFFFFF
- Elevated: #FFFFFF
- Highlighted: primary-50
- Info-surface: primary-100
- Input: #
- Input-hover: #
- Overlay: rgba(0, 0, 0, 0.4)
- Skeleton: #E5E7EB

## Borders
- Default: rgba(0, 0, 0, 0.12)
- Subtle: rgba(0, 0, 0, 0.06)
- Focus: 3px solid # (use teal #0085B3 or primary-based)
- Error: rgba(220, 38, 38, 0.4)
- Divider: rgba(0, 0, 0, 0.06)
- Accent-stripe: 3px solid var(--primary)

## Glass
- Background: rgba(255, 255, 255, 0.93)
- Blur: 6px
- Border: 1px solid rgba(0, 0, 0, 0.06)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.06)

## Typography
- Font: Inter (variable, woff2 — universal modern standard)
- Headings-font: Inter
- Headings-weight: 600-700
- Body-weight: 400
- Line-height-body: 1.6
- Line-height-heading: 1.2
- Line-height-compact: 1.4
- Letter-spacing-heading: -0.02em
- Letter-spacing-uppercase: 0.05em
- Line-length: 48rem
- Font-scaling: 1 | 1.25 | 1.5

## Gradients
- Primary: linear-gradient(135deg, #000, #000)
- Surface: linear-gradient(180deg, #FFF, #FFF)
- Accent-subtle: linear-gradient(135deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.02))

## States
- Hover: color-mix(in srgb, var(--primary), white 15%)
- Active-scale: 0.98
- Disabled-opacity: 0.5
- Focus-ring: 0 0 0 3px #0085B3

## Motion
- Fast: 150ms
- Normal: 250ms
- Slow: 400ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

## Border Radius
- sm: 6px
- md: 8px
- lg: 12px
- xl: 16px
- pill: 9999px

## Data Visualization
- Chart-1: # (primary)
- Chart-2: # (accent)
- Chart-3: # (success)
- Chart-4: # (warning)
- Chart-5: # (purple #7B1FA2)
- Chart-6: # (teal #0085B3)

## Dark Mode
- Dark-page: #
- Dark-card: #
- Dark-elevated: #
- Dark-input: rgba(0, 0, 0, 0.6)
- Dark-text: #
- Dark-text-secondary: #
- Dark-primary: #
- Dark-accent: #
- Dark-border: rgba(148, 163, 184, 0.12)
- Dark-overlay: rgba(0, 0, 0, 0.6)

## Modern CSS Techniques

```css
:root { --font-scaling: 1; font-size: calc(100% * var(--font-scaling)); }
a { text-decoration-thickness: max(0.08em, 1px); text-underline-offset: 0.25em; }
.button:hover { background: color-mix(in srgb, var(--primary), white 15%); }
.prose { max-inline-size: 48rem; }
.visually-hidden { clip-path: inset(50%); block-size: 1px; inline-size: 1px; overflow: hidden; position: absolute; }
@media (width >= 768px) { }
```

## Design Directives

Directives have 3 levels:
- **(MUST)** — Hard rule. Violation = bug. No override.
- **(SHOULD)** — Theme default. Overridable via `themeOverrides` in `.sdd-config.json` with justification.
- **(MAY)** — Opt-in. Only applied if enabled in `themeOverrides`.

### Layout
- **Density** (SHOULD): [compact / comfortable / spacious] — choose based on product type and audience. Override: `density: "compact"` | `"comfortable"` | `"spacious"`.
- **Card style** (SHOULD): [flat / elevated / glassmorphism / outlined] — choose based on brand personality. Override: `cardStyle: "elevated"` | `"flat"` | `"glassmorphism"` | `"outlined"`.
- **Navigation** (SHOULD): [sidebar / top nav / bottom tabs / hybrid] — choose based on page complexity. Override: `navigation: "sidebar"` | `"top"` | `"bottom"` | `"hybrid"`.
- **Form layout** (SHOULD): [single column / multi-column / wizard] — choose based on form length and complexity. Override: `formLayout: "single-column"` | `"multi-column"` | `"wizard"`.
- **Data visualization** (SHOULD): [tables / charts / KPI cards / timeline / map] — choose based on data type. Override: `dataViz: "tables"` | `"charts"` | `"kpi"` | `"timeline"` | `"map"`.
- **Container** (SHOULD): max-width 76.5rem (1224px). Content constrained to 48rem line-length for prose.

### Visual
- **Illustration style** (MAY): [none / minimal icons / line art / photography / abstract] — choose based on brand. Enable: `illustrationStyle: "minimal-icons"` | `"line-art"` | `"photography"` | `"abstract"` in themeOverrides.
- **Animation level** (SHOULD): [minimal / moderate / expressive] — choose based on audience and brand personality. Override: `animationLevel: "minimal"` | `"moderate"` | `"expressive"`.
- **Color usage** (SHOULD): Use primary for branding/nav. Accent for interactive elements. Semantic for status. Max 2 accent colors.
- **Typography emphasis** (SHOULD): Use the font pair specified above. Headings carry visual weight. Tabular nums for data.
- **Surface hierarchy** (SHOULD): Page → Card → Elevated → Highlighted (primary-50) → Info (primary-100). Each level must be visually distinct.
- **Focus indicator** (MUST): 3px solid accent color — visible on all surfaces. Never `outline: none` without replacement.
- **Links** (SHOULD): `text-decoration-thickness: max(0.08em, 1px)`, `text-underline-offset: 0.25em`. Visited state in purple (#7B1FA2).
- **Dark mode** (MAY): Enable dark mode variant. Enable: `mode: "dark"` in themeOverrides (overrides the `mode` field above).

### Modern Patterns
- **Command palette** (MAY): keyboard-driven quick actions (Cmd+K). Enable: `commandPalette: true` in themeOverrides.
- **Summary box** (SHOULD): key info callout with icon + primary-100 bg + left border.
- **Side panel** (MAY): detail views in side panel, not modal. Enable: `sidePanel: true` in themeOverrides.

### NEVER (MUST — all non-overridable)
- NEVER use glassmorphism unless explicitly chosen in Card style (SHOULD — overridable via `cardStyle`)
- NEVER use font size below 14px for body text (WCAG 1.4.12)
- NEVER use animation without `prefers-reduced-motion` fallback (WCAG 2.3.3)
- NEVER use color-only status indicators (always color + icon + text — WCAG 1.4.1)
- NEVER use touch targets below 44px (WCAG 2.5.5)
- NEVER use more than 2 accent colors
- NEVER use `outline: none` without `:focus-visible` replacement
- NEVER use `border-bottom` for link underlines
- NEVER use pure #000000 for text (use off-black)
- NEVER use pure #F5F5F5 for page background (use blue/warm-tinted)

## themeOverrides

Override SHOULD/MAY directives in `.sdd-config.json`:

```json
{
  "theme": "custom",
  "themeOverrides": {
    "density": "comfortable",
    "cardStyle": "elevated",
    "navigation": "sidebar",
    "formLayout": "single-column",
    "dataViz": "tables",
    "animationLevel": "moderate",
    "illustrationStyle": "minimal-icons",
    "mode": "dark",
    "cardHover": "shadow-md",
    "entryAnimations": true,
    "inputWrapper": true,
    "progressiveDisclosure": true,
    "pageHeaderIcon": true,
    "ambienteBadge": true,
    "commandPalette": true,
    "sidePanel": true
  }
}
```

MUST directives cannot be overridden. If an override contradicts a MUST, it is rejected.

## Override Key Schema

| Key | Type | Values | Default | Shared |
|-----|------|--------|---------|--------|
| `density` | string | `"compact"`, `"comfortable"`, `"spacious"` | `"comfortable"` | No |
| `cardStyle` | string | `"elevated"`, `"flat"`, `"glassmorphism"`, `"outlined"` | `"elevated"` | No |
| `navigation` | string | `"sidebar"`, `"top"`, `"bottom"`, `"hybrid"` | `"sidebar"` | No |
| `formLayout` | string | `"single-column"`, `"multi-column"`, `"wizard"` | `"single-column"` | No |
| `dataViz` | string | `"tables"`, `"charts"`, `"kpi"`, `"timeline"`, `"map"` | `"tables"` | No |
| `animationLevel` | string | `"minimal"`, `"moderate"`, `"expressive"` | `"moderate"` | No |
| `illustrationStyle` | string | `"none"`, `"minimal-icons"`, `"line-art"`, `"photography"`, `"abstract"` | `"none"` | No |
| `mode` | string | `"light"`, `"dark"` | `"light"` | No |
| `cardHover` | string | `"shadow-md"`, `"scale"`, `"none"` | `"shadow-md"` | Yes |
| `entryAnimations` | boolean | `true`, `false` | `true` | Yes |
| `inputWrapper` | boolean | `true`, `false` | `true` | Yes |
| `progressiveDisclosure` | boolean | `true`, `false` | `true` | Yes |
| `pageHeaderIcon` | boolean | `true`, `false` | `true` | Yes |
| `ambienteBadge` | boolean | `true`, `false` | `false` | Yes |
| `commandPalette` | boolean | `true`, `false` | `false` | No |
| `sidePanel` | boolean | `true`, `false` | `false` | No |

## Style Notes
- [Describe your visual style: modern, minimal, bold, playful, etc.]
- [Animation preference: minimal, moderate, expressive]
- [Layout density: compact, comfortable, spacious]
- Off-black text (never pure #000000) — reduces eye fatigue
- Blue/warm-tinted page background (never pure #F5F5F5) — warmer
- Inter variable font — universal modern standard
- Teal focus indicator (#0085B3) — distinct brand element
- `color-mix()` for computed hover states
- Line length constrained to 48rem
- Data visualization palette: 6 chart colors
- Dark mode palette available via override
