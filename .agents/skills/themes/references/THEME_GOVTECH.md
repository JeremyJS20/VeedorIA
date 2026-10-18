# Theme: GovTech

theme_base: govtech
mode: light

## Colors

### Primary family
- Primary: #1E3A5F
- Primary-light: #2A5A8F
- Primary-dark: #0D2540
- Primary-50: rgba(30, 58, 95, 0.04)
- Primary-100: rgba(30, 58, 95, 0.08)
- Primary-200: rgba(30, 58, 95, 0.12)

### Accent (Gold)
- Accent: #B8860B
- Accent-hover: #9A7209
- Accent-muted: rgba(184, 134, 11, 0.12)
- Accent-light: #FFF8E1

### Semantic
- Success: #2E7D32
- Success-muted: rgba(46, 125, 50, 0.12)
- Success-light: #E8F5E9
- Warning: #E65100
- Warning-muted: rgba(230, 81, 0, 0.12)
- Warning-light: #FFF3E0
- Error: #C62828
- Error-muted: rgba(198, 40, 40, 0.12)
- Error-light: #FFEBEE
- Info: #2E5299
- Info-muted: rgba(46, 82, 153, 0.12)
- Info-light: #E8EDF4

### Text
- Text: #1C2333 (off-black with blue tint)
- Text-secondary: #5C6B7A
- Text-disabled: #94A3B8
- Visited-link: #7B1FA2

## Surfaces
- Page: #F4F7F9 (blue-tinted)
- Card: #FFFFFF
- Elevated: #FFFFFF
- Highlighted: rgba(30, 58, 95, 0.04) (primary-50)
- Info-surface: rgba(30, 58, 95, 0.08) (primary-100)
- Input: #EDF1F5 (blue-tinted)
- Input-hover: #E3E9EF
- Overlay: rgba(28, 35, 51, 0.5)
- Skeleton: #E8ECF0

## Borders
- Default: rgba(28, 35, 51, 0.12)
- Subtle: rgba(28, 35, 51, 0.06)
- Focus: 3px solid #0085B3 (teal — distinct, high-visibility)
- Error: rgba(198, 40, 40, 0.4)
- Divider: rgba(28, 35, 51, 0.06)
- Accent-stripe: 3px solid var(--primary)

## Glass
- Background: rgba(255, 255, 255, 0.93)
- Blur: 6px
- Border: 1px solid rgba(30, 58, 95, 0.06)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.06)

## Typography
- Font: Public Sans (variable, woff2 — USWDS institutional standard)
- Headings-font: Lexend (designed for readability)
- Headings-weight: 600-700
- Body-weight: 400
- Body-size-min: 16px
- Line-height-body: 1.6
- Line-height-heading: 1.2
- Line-height-compact: 1.4
- Letter-spacing-heading: -0.02em
- Letter-spacing-uppercase: 0.05em
- Line-length: 48rem
- Font-scaling: 1 (normal) | 1.25 (large) | 1.5 (extra-large)

## Gradients
- Primary: linear-gradient(135deg, #1E3A5F, #0D2540)
- Surface: linear-gradient(180deg, #F4F7F9, #FFFFFF)
- Accent-subtle: linear-gradient(135deg, rgba(30, 58, 95, 0.06), rgba(30, 58, 95, 0.02))
- Header: linear-gradient(135deg, #0D2540, #1E3A5F)

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
- Chart-1: #1E3A5F (primary)
- Chart-2: #B8860B (gold)
- Chart-3: #2E7D32 (green)
- Chart-4: #E65100 (orange)
- Chart-5: #7B1FA2 (purple)
- Chart-6: #0085B3 (teal)

## Dark Mode
- Dark-page: #0D1B2A
- Dark-card: #1B2838
- Dark-elevated: #243447
- Dark-input: rgba(27, 40, 56, 0.6)
- Dark-text: #E8EDF2
- Dark-text-secondary: #94A3B8
- Dark-primary: #3A7BC8
- Dark-accent: #D4A574
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
- **Density** (MUST): comfortable — accessible spacing, not cramped. Large touch targets (≥48×48px). Clear visual separation.
- **Card style** (SHOULD): flat with outlined border (`1px solid var(--border-default)`). No shadows. No elevation.
- **Navigation** (SHOULD): top navigation bar + mandatory breadcrumbs. Sidebar for admin only. NEVER icon-only nav.
- **Form layout** (MUST): single column, large touch targets (≥48×48px), clear section headers. Wizard for multi-step services with step labels (not just numbers). Visible labels on all form fields (no placeholder-only).
- **Data visualization** (SHOULD): simple tables with status badges (color + icon + text) + progress bars + summary counts. Avoid complex charts.
- **Container** (SHOULD): max-width 76.5rem (1224px). Content constrained to 48rem line-length for prose.

### Visual
- **Illustration style** (SHOULD): government seals/crests in headers, simple line icons. Formal, institutional. NEVER decorative illustration.
- **Animation level** (SHOULD): minimal — `prefers-reduced-motion` is the DEFAULT. Focus states, loading indicators only. No hover effects, no transitions beyond focus.
- **Entry animations** (SHOULD): fadeInUp (translateY + opacity, 250-400ms) for cards, dropdowns, modals. Always respects `prefers-reduced-motion`. Override: `entryAnimations: false` to disable.
- **Color usage** (SHOULD): Deep navy primary for authority. Gold accent sparingly for CTAs and highlights. Semantic colors for status. High contrast (WCAG AAA). Override: `accent: "teal"` for alternative accent.
- **Typography emphasis** (MUST): Public Sans for body (USWDS institutional standard, variable font). Lexend for headings (designed for readability). Minimum 16px body text (accessibility mandate).
- **Surface hierarchy** (SHOULD): Page (#F4F7F9) → Card (#FFFFFF) → Elevated (#FFFFFF with border) → Highlighted (primary-50 bg) → Info (primary-100 bg + left border). Blue-tinted page bg provides warmth.
- **Focus indicator** (MUST): 3px solid #0085B3 (teal) — distinct brand element, visible on all surfaces. Never `outline: none` without replacement.
- **Links** (SHOULD): `text-decoration-thickness: max(0.08em, 1px)`, `text-underline-offset: 0.25em`. No `border-bottom` hack. Visited state in purple (#7B1FA2).
- **Accessibility audit panel** (MAY): In-app WCAG compliance checker panel. Enable: `a11yPanel: true` in themeOverrides.

### Modern Patterns
- **Search-first homepage** (SHOULD): prominent search bar as primary interaction on public landing pages. Conversational placeholder ("What are you looking for?"). No hero image for government portals.
- **Pill shortcuts** (MAY): chip/pill buttons for quick-access actions. Touch-friendly, scannable. Enable: `pillShortcuts: true` in themeOverrides.
- **Summary box** (SHOULD): key info callout with icon + primary-100 bg + left border. For important information the user must see.
- **Process indicator** (SHOULD): labeled steps (not numbered) with checkmark for completed, primary circle for current, gray for upcoming.
- **Identifier footer** (SHOULD): standardized footer with legal links, accessibility statement, and government identifier.
- **Language selector** (MAY): first-class component for multilingual portals. Enable: `languageSelector: true` in themeOverrides.

### NEVER (MUST — all non-overridable)
- NEVER use glassmorphism or backdrop-filter blur
- NEVER use dark mode (government UI is ALWAYS light for accessibility)
- NEVER use font size below 16px for body text (accessibility mandate)
- NEVER use icon-only navigation (labels ALWAYS required)
- NEVER use animation without `prefers-reduced-motion` fallback (WCAG 2.3.3)
- NEVER use decorative illustration or photography
- NEVER use color-only status indicators (always color + icon + text for accessibility — WCAG 1.4.1)
- NEVER use auto-dismissing notifications for important information
- NEVER use placeholder-only labels on form fields (always visible labels)
- NEVER use touch targets below 48px (WCAG 2.5.5)
- NEVER use `outline: none` without `:focus-visible` replacement
- NEVER use `border-bottom` for link underlines (use `text-decoration` with thickness/offset)
- NEVER use pure #000000 for text (use off-black #1C2333)
- NEVER use pure #F5F5F5 for page background (use blue-tinted #F4F7F9)

## themeOverrides

Override SHOULD/MAY directives in `.sdd-config.json`:

```json
{
  "theme": "govtech",
  "themeOverrides": {
    "accent": "teal",
    "a11yPanel": true,
    "cardHover": "none",
    "entryAnimations": true,
    "inputWrapper": true,
    "progressiveDisclosure": true,
    "pageHeaderIcon": true,
    "ambienteBadge": true,
    "pillShortcuts": true,
    "languageSelector": true
  }
}
```

MUST directives cannot be overridden. If an override contradicts a MUST, it is rejected.

## Override Key Schema

| Key | Type | Values | Default | Shared |
|-----|------|--------|---------|--------|
| `accent` | string | `"teal"`, `"gold"`, hex | `"gold"` | No |
| `a11yPanel` | boolean | `true`, `false` | `false` | No |
| `cardHover` | string | `"shadow-md"`, `"scale"`, `"none"` | `"none"` | Yes |
| `entryAnimations` | boolean | `true`, `false` | `true` | Yes |
| `inputWrapper` | boolean | `true`, `false` | `true` | Yes |
| `progressiveDisclosure` | boolean | `true`, `false` | `true` | Yes |
| `pageHeaderIcon` | boolean | `true`, `false` | `true` | Yes |
| `ambienteBadge` | boolean | `true`, `false` | `false` | Yes |
| `pillShortcuts` | boolean | `true`, `false` | `false` | No |
| `languageSelector` | boolean | `true`, `false` | `false` | No |

## Style Notes
- Modern government aesthetic (2024-2026) — authoritative, accessible, warm
- Off-black text (#1C2333) with blue tint — reduces eye fatigue
- Blue-tinted page background (#F4F7F9) — warmer than pure gray
- Public Sans variable font — USWDS institutional standard
- Lexend headings — designed for readability
- Teal focus indicator (#0085B3) — distinct brand element, high visibility
- `color-mix()` for computed hover states
- Search-first homepage for citizen portals
- Pill/chip shortcuts for quick actions
- Summary box for key information callouts
- Process indicator with labeled steps
- Identifier footer with legal links
- High contrast WCAG AAA compliance
- Minimum body size 16px (accessibility mandate)
- Line length constrained to 48rem
- Data visualization palette: 6 harmonized chart colors
- Dark mode palette available (but NEVER forced)
