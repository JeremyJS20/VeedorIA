# Theme: Institutional

theme_base: institutional
mode: light

## Colors

### Primary family
- Primary: #1A5F7A
- Primary-light: #2A7A9A
- Primary-dark: #0D3B52
- Primary-50: rgba(26, 95, 122, 0.04)
- Primary-100: rgba(26, 95, 122, 0.08)
- Primary-200: rgba(26, 95, 122, 0.12)

### Accent
- Accent: #2A7A9A (primary-light by default)
- Gold: #D4A574 (available via `accent: "gold"` override)
- Gold-hover: #C08E5A
- Gold-muted: rgba(212, 165, 116, 0.12)

### Semantic
- Success: #388E3C
- Success-muted: rgba(56, 142, 60, 0.12)
- Success-light: #E8F5E9
- Warning: #F57C00
- Warning-muted: rgba(245, 124, 0, 0.12)
- Warning-light: #FFF3E0
- Error: #D32F2F
- Error-muted: rgba(211, 47, 47, 0.12)
- Error-light: #FFEBEE
- Info: #2E5299
- Info-muted: rgba(46, 82, 153, 0.12)
- Info-light: #E8EDF4

### Text
- Text: #1C2333 (off-black with blue tint — reduces eye fatigue)
- Text-secondary: #5C6B7A (blue-tinted gray)
- Text-disabled: #94A3B8
- Visited-link: #7B1FA2

## Surfaces
- Page: #F4F7F9 (blue-tinted — warmer than pure gray)
- Card: #FFFFFF
- Elevated: #FFFFFF
- Highlighted: rgba(26, 95, 122, 0.04) (primary-50 — tips, featured)
- Info-surface: rgba(26, 95, 122, 0.08) (primary-100 — callouts, banners)
- Input: #EDF1F5 (blue-tinted, better contrast on page)
- Input-hover: #E3E9EF
- Overlay: rgba(28, 35, 51, 0.5) (blue-tinted)
- Skeleton: #E8ECF0

## Borders
- Default: rgba(28, 35, 51, 0.12)
- Subtle: rgba(28, 35, 51, 0.06)
- Focus: 3px solid #0085B3 (teal — distinct, high-visibility brand element)
- Error: rgba(211, 47, 47, 0.4)
- Divider: rgba(28, 35, 51, 0.06)
- Accent-stripe: 3px solid var(--primary) (left border for important cards)

## Glass
- Background: rgba(255, 255, 255, 0.93)
- Blur: 6px
- Border: 1px solid rgba(26, 95, 122, 0.06)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.06)

## Typography
- Font: Public Sans (variable, woff2 — USWDS institutional standard)
- Headings-font: Atkinson Hyperlegible (designed for low vision — most modern choice)
- Headings-weight: 600-700
- Body-weight: 400
- Body-size-min: 16px
- Line-height-body: 1.6
- Line-height-heading: 1.2
- Line-height-compact: 1.4
- Letter-spacing-heading: -0.02em
- Letter-spacing-uppercase: 0.05em
- Line-length: 48rem (max reading width — modern legibility standard)
- Font-scaling: 1 (normal) | 1.25 (large) | 1.5 (extra-large) via CSS custom property

## Gradients
- Primary: linear-gradient(135deg, #1A5F7A, #0D3B52)
- Surface: linear-gradient(180deg, #F4F7F9, #FFFFFF)
- Accent-subtle: linear-gradient(135deg, rgba(26, 95, 122, 0.06), rgba(26, 95, 122, 0.02))
- Header: linear-gradient(135deg, #0D3B52, #1A5F7A) (dark-to-primary for headers)

## States
- Hover: color-mix(in srgb, var(--primary), white 15%) — computed, no separate token
- Active-scale: 0.98
- Disabled-opacity: 0.5
- Focus-ring: 0 0 0 3px #0085B3 (teal — matches border-focus)

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
- pill: 9999px (for chips, badges, pills)

## Data Visualization
- Chart-1: #1A5F7A (primary)
- Chart-2: #D4A574 (gold)
- Chart-3: #388E3C (green)
- Chart-4: #F57C00 (orange)
- Chart-5: #7B1FA2 (purple)
- Chart-6: #0085B3 (teal)

## Dark Mode
- Dark-page: #0D1B2A
- Dark-card: #1B2838
- Dark-elevated: #243447
- Dark-input: rgba(27, 40, 56, 0.6)
- Dark-text: #E8EDF2
- Dark-text-secondary: #94A3B8
- Dark-primary: #3A9BC8
- Dark-accent: #D4A574
- Dark-border: rgba(148, 163, 184, 0.12)
- Dark-overlay: rgba(0, 0, 0, 0.6)

## Modern CSS Techniques

```css
:root {
  --font-scaling: 1;
  font-size: calc(100% * var(--font-scaling));
}

a {
  text-decoration-thickness: max(0.08em, 1px);
  text-underline-offset: 0.25em;
}

.button:hover {
  background: color-mix(in srgb, var(--primary), white 15%);
}

.button:active {
  background: color-mix(in srgb, var(--primary), black 10%);
}

.sidebar-item:hover {
  background: color-mix(in srgb, var(--primary-dark), white 8%);
}

.prose {
  max-inline-size: 48rem;
}

.visually-hidden {
  clip-path: inset(50%);
  block-size: 1px;
  inline-size: 1px;
  overflow: hidden;
  position: absolute;
}

@media (width >= 768px) { /* range syntax */ }
```

## Design Directives

Directives have 3 levels:
- **(MUST)** — Hard rule. Violation = bug. No override.
- **(SHOULD)** — Theme default. Overridable via `themeOverrides` in `.sdd-config.json` with justification.
- **(MAY)** — Opt-in. Only applied if enabled in `themeOverrides`.

### Layout
- **Density** (MUST): comfortable — accessible spacing, large touch targets (≥48×48px). Clear section separation.
- **Card style** (SHOULD): elevated with shadow-sm (`0 2px 8px rgba(0,0,0,0.06)`). Left accent stripe (3px primary) for important cards. Section headers with accent-subtle gradient background. Hover → shadow-md + translateY(-2px). Override: `cardHover: "scale"` for subtler effect.
- **Navigation** (SHOULD): top nav for public pages + sidebar for admin portals. Breadcrumbs for depth >2. Mega-menu for large taxonomies.
- **Sidebar** (SHOULD): primary-dark (#0D3B52, derived from primary) with primary border accent (1px left on active). Active item with primary bg + white text. Hover computed via `color-mix()`. Icons + full labels. Collapsible with icon-only + tooltip. Override: `sidebarLight: true` for light sidebar variant.
- **Form layout** (SHOULD): single column with clear section headers and dividers. Progressive disclosure: primary fields always visible, advanced fields collapsible. Wizard with labeled steps (not numbered) for multi-step.
- **Data visualization** (SHOULD): summary cards above with KPIs + icons + per-metric semantic colors. Tables with status badges + progress indicators. Print-friendly layouts. Chart palette: 6 harmonized colors (see Data Visualization section).
- **Page header** (SHOULD): icon in primary-100 circle + title (Atkinson Hyperlegible) + description. Provides context for each page.
- **Container** (SHOULD): max-width 76.5rem (1224px). Content constrained to 48rem line-length for prose.

### Visual
- **Illustration style** (SHOULD): institutional icons (document, building, graduation cap), simple line art. Formal but warm. No whimsical illustrations. Purposeful micro-interactions (check confirm, status transition) are allowed.
- **Animation level** (SHOULD): purposeful — hover color shift on interactive elements, subtle scale on buttons (0.98), smooth focus transitions (250ms). No scroll reveals, no decorative animation. `prefers-reduced-motion` respected by default.
- **Entry animations** (SHOULD): fadeInUp (translateY + opacity, 250-400ms) for cards, dropdowns, modals. Always respects `prefers-reduced-motion`. Override: `entryAnimations: false` to disable.
- **Color usage** (SHOULD): Primary blue family for all CTAs, highlights, active states, and card accents. Primary gradient for headers and sidebar. Accent-subtle gradient for section headers. Semantic colors for status. Gold token available via `accent: "gold"` override.
- **Typography emphasis** (MUST): Public Sans for body (USWDS institutional standard, variable font). Atkinson Hyperlegible for headings (designed for low vision). Minimum 16px body text. Additional fonts allowed for specific purposes (mono for code/data, display for hero) if accessible.
- **Surface hierarchy** (SHOULD): Page (#F4F7F9) → Card (#FFFFFF shadow-sm) → Elevated (#FFFFFF shadow-md + primary top border) → Highlighted (primary-50 bg) → Info (primary-100 bg + left border). Blue-tinted page bg provides warmth and depth.
- **Buttons** (SHOULD): Primary = primary solid. CTA = primary solid (highest visual weight, use for main action per view). Secondary = primary outline. Ghost = text only with primary on hover. All with subtle scale on active (0.98). Hover computed via `color-mix()`.
- **Input wrapper** (SHOULD): icon left + input + optional toggle right. Hover → bg change. Focus → primary border + focus shadow + white bg. Transparent input inside wrapper.
- **Links** (SHOULD): `text-decoration-thickness: max(0.08em, 1px)`, `text-underline-offset: 0.25em`. No `border-bottom` hack. Visited state in purple (#7B1FA2).
- **Focus indicator** (MUST): 3px solid #0085B3 (teal) — distinct brand element, visible on all surfaces. Never `outline: none` without replacement.
- **Ambiente badge** (MAY): Tag with severity by environment (dev=warn, cert=info, prod=success). Enable: `ambienteBadge: true` in themeOverrides.

### Modern Patterns
- **Search-first homepage** (SHOULD): prominent search bar as primary interaction on public landing pages. Conversational placeholder ("What are you looking for?"). No hero image for institutional portals.
- **Pill shortcuts** (MAY): chip/pill buttons for quick-access actions (border-radius: pill). Touch-friendly, scannable. Enable: `pillShortcuts: true` in themeOverrides.
- **Dark header + light body** (SHOULD): header/toolbar uses primary-dark bg with white text. Content area stays light. Provides visual hierarchy without full dark mode.
- **Task-based navigation** (MAY): organize by life situations / user tasks instead of department structure. Enable: `taskNav: true` in themeOverrides.
- **Summary box** (SHOULD): key info callout with icon + primary-100 bg + left border. For important information the user must see.
- **Process indicator** (SHOULD): labeled steps (not numbered) with checkmark for completed, primary circle for current, gray for upcoming. For multi-step forms and workflows.
- **Identifier footer** (SHOULD): standardized footer with legal links, accessibility statement, and government/institutional identifier.
- **Language selector** (MAY): first-class component for multilingual portals. Enable: `languageSelector: true` in themeOverrides.

### NEVER (MUST — all non-overridable)
- NEVER force dark mode (light default; dark optional via toggle if project supports it)
- NEVER use whimsical illustrations or decorative animations
- NEVER use font size below 16px for body text (WCAG mandate for public portals)
- NEVER use glassmorphism as primary surface (glass allowed for overlays/modals only: blur 6px, 0.93 opacity)
- NEVER use animation without `prefers-reduced-motion` fallback (WCAG 2.3.3)
- NEVER use color-only status (always color + icon + text — WCAG 1.4.1)
- NEVER use touch targets below 48px (WCAG 2.5.5)
- NEVER use `outline: none` without `:focus-visible` replacement
- NEVER use `border-bottom` for link underlines (use `text-decoration` with thickness/offset)
- NEVER use pure #000000 or #212121 for text (use off-black #1C2333 — reduces eye fatigue)
- NEVER use pure #F5F5F5 for page background (use blue-tinted #F4F7F9 — warmer)

## themeOverrides

Override SHOULD/MAY directives in `.sdd-config.json`:

```json
{
  "theme": "institutional",
  "themeOverrides": {
    "accent": "gold",
    "cardHover": "scale",
    "sidebarLight": false,
    "entryAnimations": true,
    "inputWrapper": true,
    "progressiveDisclosure": true,
    "pageHeaderIcon": true,
    "ambienteBadge": true,
    "pillShortcuts": true,
    "taskNav": true,
    "languageSelector": true
  }
}
```

MUST directives cannot be overridden. If an override contradicts a MUST, it is rejected.

## Override Key Schema

| Key | Type | Values | Default | Shared |
|-----|------|--------|---------|--------|
| `accent` | string | `"gold"`, `"primary"`, hex | `"primary"` | No |
| `cardHover` | string | `"shadow-md"`, `"scale"`, `"none"` | `"shadow-md"` | Yes |
| `sidebarLight` | boolean | `true`, `false` | `false` | No |
| `entryAnimations` | boolean | `true`, `false` | `true` | Yes |
| `inputWrapper` | boolean | `true`, `false` | `true` | Yes |
| `progressiveDisclosure` | boolean | `true`, `false` | `true` | Yes |
| `pageHeaderIcon` | boolean | `true`, `false` | `true` | Yes |
| `ambienteBadge` | boolean | `true`, `false` | `false` | Yes |
| `pillShortcuts` | boolean | `true`, `false` | `false` | No |
| `taskNav` | boolean | `true`, `false` | `false` | No |
| `languageSelector` | boolean | `true`, `false` | `false` | No |

## Style Notes
- Modern institutional aesthetic (2024-2026) — warm, authoritative, accessible
- Off-black text (#1C2333) with blue tint — reduces eye fatigue vs pure black
- Blue-tinted page background (#F4F7F9) — warmer than pure gray
- Public Sans variable font — USWDS institutional standard
- Atkinson Hyperlegible headings — designed for low vision, most modern choice
- Primary color family (light/dark/50/100/200) — complete palette, not a single blue
- Accent = primary-light by default — gold available via override
- Teal focus indicator (#0085B3) — distinct brand element, high visibility
- `color-mix()` for computed hover states — modern CSS, fewer tokens
- Elevated cards with shadows, not flat borders
- Primary gradient for headers and sidebar — establishes brand presence
- Dark header + light body — visual hierarchy without dark mode
- Dark sidebar derived from primary-dark (#0D3B52) — not hardcoded
- Hover effects provide interactivity feedback (shadow-md + translateY)
- Progressive disclosure for complex forms
- Input wrapper pattern with icon + focus states
- Search-first homepage for public portals
- Pill/chip shortcuts for quick actions
- Summary box for key information callouts
- Process indicator with labeled steps
- Identifier footer with legal links
- Large touch targets 48px minimum (WCAG)
- High legibility for older demographics
- Line length constrained to 48rem for optimal reading
- Data visualization palette: 6 harmonized chart colors
- Dark mode palette available for toggle
- Minimum body size 16px (public-facing portals)
- Print-friendly views
