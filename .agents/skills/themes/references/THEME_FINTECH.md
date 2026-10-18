# Theme: Fintech

theme_base: fintech
mode: dark

## Colors

### Primary family (brand-tinted darks)
- Primary: #0B1A2E (blue-tinted dark — not pure navy)
- Primary-light: #152A42
- Primary-dark: #071222
- Primary-50: rgba(11, 26, 46, 0.04)
- Primary-100: rgba(11, 26, 46, 0.08)
- Primary-200: rgba(11, 26, 46, 0.12)

### Accent (Green default — money/growth signal)
- Accent: #22C55E (green — "your money is safe/growing")
- Accent-hover: #16A34A
- Accent-muted: rgba(34, 197, 94, 0.15)
- Cyan: #06B6D4 (available via `accent: "cyan"` override — dated but supported)
- Cyan-hover: #22D3EE
- Cyan-muted: rgba(6, 182, 212, 0.15)

### Semantic
- Success: #22C55E
- Success-muted: rgba(34, 197, 94, 0.15)
- Success-light: #E8F5E9
- Warning: #EAB308
- Warning-muted: rgba(234, 179, 8, 0.15)
- Warning-light: #FEF9C3
- Error: #EF4444
- Error-muted: rgba(239, 68, 68, 0.15)
- Error-light: #FEE2E2
- Info: #3B82F6
- Info-muted: rgba(59, 130, 246, 0.15)
- Info-light: #DBEAFE

### Text
- Text: #F1F5F9
- Text-secondary: #94A3B8
- Text-tertiary: #64748B
- Text-disabled: #475569
- Visited-link: #A78BFA

## Surfaces
- Page: #0B1A2E (brand-tinted dark)
- Card: #111D2E (blue-tinted)
- Elevated: #1A2B3D
- Highlighted: rgba(34, 197, 94, 0.04)
- Info-surface: rgba(34, 197, 94, 0.08)
- Input: rgba(17, 29, 46, 0.6)
- Input-hover: rgba(17, 29, 46, 0.8)
- Overlay: rgba(0, 0, 0, 0.6)
- Skeleton: #1A2B3D

## Borders
- Default: rgba(148, 163, 184, 0.2)
- Subtle: rgba(148, 163, 184, 0.1)
- Focus: 3px solid #0085B3 (teal — visible on dark)
- Error: rgba(239, 68, 68, 0.4)
- Divider: rgba(148, 163, 184, 0.08)
- Accent-stripe: 3px solid var(--accent)

## Glass
- Background: rgba(17, 29, 46, 0.93)
- Blur: 6px
- Border: 1px solid rgba(34, 197, 94, 0.06)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.1)

## Typography
- Font: DM Sans (variable, woff2)
- Headings-font: Space Grotesk
- Headings-weight: 700-800
- Body-weight: 400
- Line-height-body: 1.6
- Line-height-heading: 1.2
- Line-height-compact: 1.4
- Letter-spacing-heading: -0.02em
- Letter-spacing-uppercase: 0.05em
- Line-length: 48rem
- Font-scaling: 1 | 1.25 | 1.5
- Tabular-nums: font-feature-settings: "tnum", "ss01" — MANDATORY for all financial figures

## Gradients
- Primary: linear-gradient(135deg, #22C55E, #16A34A)
- Surface: linear-gradient(180deg, #0B1A2E, #111D2E)
- Accent-subtle: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.03))

## States
- Hover: color-mix(in srgb, var(--accent), white 15%)
- Active-scale: 0.98
- Disabled-opacity: 0.5
- Focus-ring: 0 0 0 3px #0085B3

## Motion
- Fast: 150ms
- Normal: 250ms
- Slow: 400ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Spring: cubic-bezier(0.23, 1.2, 0.32, 1) (for animated amounts, Plaid-style)

## Border Radius
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- pill: 9999px

## Data Visualization
- Chart-1: #22C55E (green/primary)
- Chart-2: #EAB308 (amber)
- Chart-3: #8B5CF6 (purple)
- Chart-4: #06B6D4 (teal)
- Chart-5: #F97316 (orange)
- Chart-6: #EC4899 (pink)

## Light Mode
- Light-page: #F8FAFC
- Light-card: #FFFFFF
- Light-elevated: #FFFFFF
- Light-input: #F1F5F9
- Light-text: #0F172A
- Light-text-secondary: #64748B
- Light-primary: #0B1A2E
- Light-accent: #22C55E
- Light-border: rgba(15, 23, 42, 0.12)

## Modern CSS Techniques

```css
:root { --font-scaling: 1; font-size: calc(100% * var(--font-scaling)); }
a { text-decoration-thickness: max(0.08em, 1px); text-underline-offset: 0.25em; }
.button:hover { background: color-mix(in srgb, var(--accent), white 15%); }
.prose { max-inline-size: 48rem; }
.amount { font-feature-settings: "tnum", "ss01"; font-variant-numeric: tabular-nums; }
.visually-hidden { clip-path: inset(50%); block-size: 1px; inline-size: 1px; overflow: hidden; position: absolute; }
@media (width >= 768px) { }
```

## Design Directives

Directives have 3 levels:
- **(MUST)** — Hard rule. Violation = bug. No override.
- **(SHOULD)** — Theme default. Overridable via `themeOverrides` in `.sdd-config.json` with justification.
- **(MAY)** — Opt-in. Only applied if enabled in `themeOverrides`.

### Layout
- **Density** (SHOULD): compact — data-dense, minimal whitespace between data elements. Override: `density: "comfortable"` for less dense layouts.
- **Card style** (SHOULD): "quiet depth" — solid surfaces with thin borders and subtle shadows. Override: `cardStyle: "glassmorphism"` for frosted glass (blur 6px, 0.93 opacity — overlays only). Override: `cardStyle: "elevated"` for solid elevated cards.
- **Navigation** (SHOULD): sidebar (collapsible 240px → 64px icon-only). NEVER top-nav-only for authenticated pages.
- **Form layout** (SHOULD): single column, centered (max-width 480px). Multi-column only for address/name pairs.
- **Data visualization** (SHOULD): contextual KPI cards with sparklines + trend indicators + comparison context. Sortable/filterable tables with sparklines in rows. Charts for trends.
- **Container** (SHOULD): max-width 76.5rem (1224px). Content constrained to 48rem line-length.

### Visual
- **Illustration style** (SHOULD): abstract gradient mesh, geometric patterns. NEVER clip-art or photographic.
- **Animation level** (SHOULD): moderate — micro-interactions (hover, toggle, validation), data update transitions, skeleton loading, animated number transitions (spring physics). No scroll-triggered reveals.
- **Entry animations** (SHOULD): fadeInUp for cards, dropdowns, modals. Override: `entryAnimations: false` to disable.
- **Color usage** (SHOULD): Green accent for financial success/growth signals (default). Cyan available via override. Gradients reserved for hero sections and primary CTAs. NEVER gradient-on-gradient. Override: `accent: "cyan"` for legacy cyan accent.
- **Typography emphasis** (MUST): Headings carry 80% of visual weight. Space Grotesk for numbers/data. DM Sans for body. Tabular nums MANDATORY for all financial figures (`font-feature-settings: "tnum", "ss01"`).
- **Surface hierarchy** (SHOULD): Page (#0B1A2E) → Card (#111D2E) → Elevated (#1A2B3D). Each level MUST be visually distinct. Brand-tinted darks, not pure black.
- **Focus indicator** (MUST): 3px solid #0085B3 (teal) — visible on all dark surfaces.
- **Links** (SHOULD): `text-decoration-thickness: max(0.08em, 1px)`, `text-underline-offset: 0.25em`. Visited state in light purple (#A78BFA).
- **Live data indicators** (SHOULD): Real-time pulse dots and live data badges for market data. Pulsing green dot + "Live" badge.
- **Animated amounts** (SHOULD): Count-up animation on page load. Smooth value transitions when data updates. Spring physics easing for premium feel.
- **Amount display** (SHOULD): Currency symbol muted + amount bold + tabular nums. Negative in red or parentheses (accounting style). Color: green = inflow, red = outflow.

### Modern Patterns
- **Side panel** (SHOULD): detail views in side panel (320px), not modal. Preserves data context.
- **Command palette** (MAY): keyboard-driven quick actions (Cmd+K). Enable: `commandPalette: true` in themeOverrides.

### NEVER (MUST — all non-overridable)
- NEVER use light backgrounds for data tables or dashboards (unless light mode override)
- NEVER use outlined/bordered cards as default (use elevated or glassmorphism)
- NEVER use top-nav-only layout for admin/dashboard pages
- NEVER use playful or rounded-illustration style
- NEVER use more than 2 accent colors (green/cyan + semantic only)
- NEVER use font size below 12px (data-dense but not microscopic)
- NEVER use flat design without depth cues (shadows, blur, or borders required)
- NEVER use animation without `prefers-reduced-motion` fallback (WCAG 2.3.3)
- NEVER use color-only status (always color + icon + text — WCAG 1.4.1)
- NEVER use touch targets below 44px (WCAG 2.5.5)
- NEVER use `outline: none` without `:focus-visible` replacement
- NEVER use `border-bottom` for link underlines
- NEVER use pure #000000 for dark surfaces (use brand-tinted darks)
- NEVER use financial figures without tabular nums

## themeOverrides

Override SHOULD/MAY directives in `.sdd-config.json`:

```json
{
  "theme": "fintech",
  "themeOverrides": {
    "density": "comfortable",
    "cardStyle": "elevated",
    "accent": "cyan",
    "liveIndicators": true,
    "cardHover": "none",
    "entryAnimations": true,
    "inputWrapper": true,
    "progressiveDisclosure": true,
    "pageHeaderIcon": true,
    "ambienteBadge": true,
    "sidePanel": true,
    "animatedAmounts": true,
    "commandPalette": true,
    "lightMode": false
  }
}
```

MUST directives cannot be overridden. If an override contradicts a MUST, it is rejected.

## Override Key Schema

| Key | Type | Values | Default | Shared |
|-----|------|--------|---------|--------|
| `density` | string | `"compact"`, `"comfortable"` | `"compact"` | No |
| `cardStyle` | string | `"elevated"`, `"glassmorphism"`, `"outlined"` | `"elevated"` | No |
| `accent` | string | `"green"`, `"cyan"`, hex | `"green"` | No |
| `liveIndicators` | boolean | `true`, `false` | `true` | No |
| `cardHover` | string | `"shadow-md"`, `"scale"`, `"none"` | `"none"` | Yes |
| `entryAnimations` | boolean | `true`, `false` | `true` | Yes |
| `inputWrapper` | boolean | `true`, `false` | `true` | Yes |
| `progressiveDisclosure` | boolean | `true`, `false` | `true` | Yes |
| `pageHeaderIcon` | boolean | `true`, `false` | `true` | Yes |
| `ambienteBadge` | boolean | `true`, `false` | `false` | Yes |
| `sidePanel` | boolean | `true`, `false` | `true` | No |
| `animatedAmounts` | boolean | `true`, `false` | `true` | No |
| `commandPalette` | boolean | `true`, `false` | `false` | No |
| `lightMode` | boolean | `true`, `false` | `false` | No |

## Style Notes
- Modern fintech aesthetic (2024-2026) — brand-tinted darks, green accent
- Green accent (#22C55E) — "your money is safe/growing" (Wise, Nubank convergence)
- Cyan available via override — legacy support, but green is the 2024+ default
- Brand-tinted darks (#0B1A2E) — not pure navy, not pure black
- "Quiet depth" surfaces — subtle shadows + thin borders, NO heavy glassmorphism
- Tabular nums MANDATORY for all financial figures
- Animated amounts with spring physics — premium feel
- Live data indicators — pulsing dots, "Live" badges
- Side panel for detail views — preserves data context
- DM Sans variable + Space Grotesk — modern font pairing
- Teal focus indicator (#0085B3) — visible on dark surfaces
- `color-mix()` for computed hover states
- Data visualization palette: 6 harmonized chart colors
- Light mode palette available via override
- Line length constrained to 48rem
