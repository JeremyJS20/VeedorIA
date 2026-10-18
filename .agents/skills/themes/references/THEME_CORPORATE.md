# Theme: Corporate

theme_base: corporate
mode: light

## Colors

### Primary family
- Primary: #0176D3 (Salesforce/SAP convergence)
- Primary-light: #1B96FF
- Primary-dark: #014486
- Primary-50: rgba(1, 118, 211, 0.04)
- Primary-100: rgba(1, 118, 211, 0.08)
- Primary-200: rgba(1, 118, 211, 0.12)

### Accent
- Accent: #0D9DDA (cloud-blue, Salesforce)
- Accent-hover: #0B7ED4
- Accent-muted: rgba(13, 157, 218, 0.12)

### Neutral
- Gray: #64748B (secondary UI, not accent)

### Semantic
- Success: #2E844A
- Success-muted: rgba(46, 132, 74, 0.12)
- Success-light: #EBF7E6
- Warning: #D83A00
- Warning-muted: rgba(216, 58, 0, 0.12)
- Warning-light: #FEF1ED
- Error: #BA0517
- Error-muted: rgba(186, 5, 23, 0.12)
- Error-light: #FEF1ED
- Info: #0176D3
- Info-muted: rgba(1, 118, 211, 0.12)
- Info-light: #EEF4FF

### Text
- Text: #1A1B1E (off-black — Salesforce gray-13)
- Text-secondary: #514F4D
- Text-tertiary: #706E6B
- Text-disabled: #C9C7C5
- Visited-link: #7B1FA2

## Surfaces
- Page: #F3F2F2 (Salesforce gray-3 — warm-tinted)
- Card: #FFFFFF
- Elevated: #FFFFFF
- Highlighted: rgba(1, 118, 211, 0.04) (primary-50)
- Info-surface: rgba(1, 118, 211, 0.08) (primary-100)
- Input: #ECEBEA
- Input-hover: #E3E5ED
- Overlay: rgba(26, 27, 30, 0.5)
- Skeleton: #E9EBED

## Borders
- Default: rgba(26, 27, 30, 0.12)
- Subtle: rgba(26, 27, 30, 0.06)
- Focus: 3px solid #0176D3 (primary-based — enterprise convention)
- Error: rgba(186, 5, 23, 0.4)
- Divider: rgba(26, 27, 30, 0.06)
- Accent-stripe: 3px solid var(--primary)

## Glass
- Background: rgba(255, 255, 255, 0.93)
- Blur: 6px
- Border: 1px solid rgba(1, 118, 211, 0.06)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.06)

## Typography
- Font: Inter (variable, woff2 — enterprise standard)
- Headings-font: Plus Jakarta Sans
- Headings-weight: 600-700
- Body-weight: 400
- Body-size-min: 14px (UI text), 16px (reading content)
- Line-height-body: 1.5
- Line-height-heading: 1.2
- Line-height-compact: 1.25
- Letter-spacing-heading: -0.02em
- Letter-spacing-uppercase: 0.05em
- Line-length: 48rem
- Font-scaling: 1 | 1.25 | 1.5
- Metric-font: Inter with font-weight 700 for KPI numbers

## Gradients
- Primary: linear-gradient(135deg, #0176D3, #014486)
- Surface: linear-gradient(180deg, #F3F2F2, #FFFFFF)
- Accent-subtle: linear-gradient(135deg, rgba(1, 118, 211, 0.06), rgba(1, 118, 211, 0.02))

## States
- Hover: color-mix(in srgb, var(--primary), white 15%)
- Active-scale: 0.98
- Disabled-opacity: 0.5
- Focus-ring: 0 0 0 3px #0176D3

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
- Chart-1: #0176D3 (primary)
- Chart-2: #5867E8 (indigo)
- Chart-3: #0D9DDA (teal)
- Chart-4: #2E844A (green)
- Chart-5: #D83A00 (orange)
- Chart-6: #7F8CED (purple)

## Dark Mode
- Dark-page: #0D0E12
- Dark-card: #1A1B1E
- Dark-elevated: #2B2826
- Dark-input: rgba(26, 27, 30, 0.6)
- Dark-text: #F3F2F2
- Dark-text-secondary: #B0ADAB
- Dark-primary: #1B96FF
- Dark-accent: #0D9DDA
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
- **Density** (SHOULD): compact — ERP/CRM data-dense, maximize information per viewport. Override: `density: "comfortable"` for less dense layouts. Compact mode: 32px touch targets (opt-in for power users via `compactMode: true`).
- **Card style** (SHOULD): flat, no elevation, subtle border (`--border-subtle`). Clean and professional.
- **Navigation** (SHOULD): sidebar always visible on desktop (240px, non-collapsible). Top bar for search + actions only.
- **Form layout** (SHOULD): multi-column grid (2-3 columns) for data entry. Single column for settings/profile.
- **Data visualization** (SHOULD): tables with inline editing + filter bars + bulk actions + export. KPI cards for summary with metric text style (bold 24-28px numbers). Charts for trends.
- **Container** (SHOULD): max-width 76.5rem (1224px). Content constrained to 48rem line-length for prose.

### Visual
- **Illustration style** (SHOULD): none or icons-only (Lucide outline). Professional, not decorative. NEVER illustration or photography.
- **Animation level** (SHOULD): minimal — focus states, loading indicators, toast notifications. No hover scale, no scroll reveals, no page transitions.
- **Entry animations** (SHOULD): fadeInUp for cards, dropdowns, modals. Override: `entryAnimations: false` to disable.
- **Color usage** (SHOULD): Blue primary for branding and primary actions. Cloud-blue accent for secondary interactive. Gray for neutral UI. Semantic colors for status. NEVER gradient backgrounds. Override: `accent: "teal"` for alternative accent.
- **Typography emphasis** (MUST): Inter variable for everything (enterprise standard). Plus Jakarta Sans for headings only. Tabular nums for all financial/numeric data.
- **Surface hierarchy** (SHOULD): Page (#F3F2F2) → Card (#FFFFFF) → Elevated (#FFFFFF with shadow) → Highlighted (primary-50 bg) → Info (primary-100 bg). Minimal visual noise.
- **Focus indicator** (MUST): 3px solid #0176D3 (primary) — visible on all surfaces. Never `outline: none` without replacement.
- **Links** (SHOULD): `text-decoration-thickness: max(0.08em, 1px)`, `text-underline-offset: 0.25em`. No `border-bottom` hack. Visited state in purple (#7B1FA2).
- **Command palette** (SHOULD): Keyboard-driven command palette (Cmd+K) for power users. Table stakes in enterprise 2024+.

### Modern Patterns
- **Side panel** (SHOULD): detail views in side panel (320px), not modal. Preserves context.
- **Inline editing** (SHOULD): editable fields directly in tables and cards. No separate edit forms.
- **Activity feed** (MAY): recent activity as primary dashboard content (alternative to stat cards). Enable: `activityFeed: true` in themeOverrides.

### NEVER (MUST — all non-overridable)
- NEVER use glassmorphism or backdrop-filter blur
- NEVER use gradient backgrounds on any element
- NEVER use playful or expressive animations
- NEVER use more than 2 accent colors (blue + cloud-blue)
- NEVER use illustration or photography in UI
- NEVER use glassmorphism, neumorphism, or any trend-based surface treatment
- NEVER use rounded-full buttons (max radius: 8px)
- NEVER use sidebar collapse by default (data-dense users need persistent nav)
- NEVER use animation without `prefers-reduced-motion` fallback (WCAG 2.3.3)
- NEVER use color-only status (always color + icon + text — WCAG 1.4.1)
- NEVER use touch targets below 44px (WCAG 2.5.5)
- NEVER use `outline: none` without `:focus-visible` replacement
- NEVER use `border-bottom` for link underlines
- NEVER use pure #000000 for text (use off-black #1A1B1E)

## themeOverrides

Override SHOULD/MAY directives in `.sdd-config.json`:

```json
{
  "theme": "corporate",
  "themeOverrides": {
    "density": "comfortable",
    "accent": "teal",
    "commandPalette": true,
    "cardHover": "none",
    "entryAnimations": true,
    "inputWrapper": true,
    "progressiveDisclosure": true,
    "pageHeaderIcon": true,
    "ambienteBadge": true,
    "sidePanel": true,
    "inlineEditing": true,
    "activityFeed": true,
    "compactMode": false
  }
}
```

MUST directives cannot be overridden. If an override contradicts a MUST, it is rejected.

## Override Key Schema

| Key | Type | Values | Default | Shared |
|-----|------|--------|---------|--------|
| `density` | string | `"compact"`, `"comfortable"` | `"compact"` | No |
| `accent` | string | `"teal"`, `"primary"`, hex | `"primary"` | No |
| `commandPalette` | boolean | `true`, `false` | `true` | No |
| `cardHover` | string | `"shadow-md"`, `"scale"`, `"none"` | `"none"` | Yes |
| `entryAnimations` | boolean | `true`, `false` | `true` | Yes |
| `inputWrapper` | boolean | `true`, `false` | `true` | Yes |
| `progressiveDisclosure` | boolean | `true`, `false` | `true` | Yes |
| `pageHeaderIcon` | boolean | `true`, `false` | `true` | Yes |
| `ambienteBadge` | boolean | `true`, `false` | `false` | Yes |
| `sidePanel` | boolean | `true`, `false` | `true` | No |
| `inlineEditing` | boolean | `true`, `false` | `true` | No |
| `activityFeed` | boolean | `true`, `false` | `false` | No |
| `compactMode` | boolean | `true`, `false` | `false` | No |

## Style Notes
- Modern enterprise aesthetic (2024-2026) — Salesforce/SAP convergence
- Off-black text (#1A1B1E) — reduces eye fatigue during long work sessions
- Warm-tinted page background (#F3F2F2) — not pure gray
- Inter variable font — enterprise standard (Atlassian Sans is Inter-based)
- Primary #0176D3 — converges with Salesforce, SAP, Atlassian
- Cloud-blue accent (#0D9DDA) — secondary interactive
- Command palette (Cmd+K) — table stakes in enterprise 2024+
- Side panel for detail views — preserves context vs modals
- Inline editing — no context switch for data changes
- Metric text style for KPI numbers (bold, large)
- `color-mix()` for computed hover states
- Dark mode with brand-tinted darks
- Data visualization palette: 6 harmonized chart colors
- Line length constrained to 48rem
