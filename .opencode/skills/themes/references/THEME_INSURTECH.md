# Theme: InsurTech

theme_base: insurtech
mode: light

## Colors

### Primary family
- Primary: #0D3B52 (deep authoritative blue)
- Primary-light: #1A5A7A
- Primary-dark: #082838
- Primary-50: rgba(13, 59, 82, 0.04)
- Primary-100: rgba(13, 59, 82, 0.08)
- Primary-200: rgba(13, 59, 82, 0.12)

### Accent (Electric blue — fintech-adjacent)
- Accent: #2A7AE8 (electric blue — trust + tech)
- Accent-hover: #1A6AD8
- Accent-muted: rgba(42, 122, 232, 0.12)
- Accent-light: #EBF3FE

### Semantic
- Success: #059669 (emerald)
- Success-muted: rgba(5, 150, 105, 0.12)
- Success-light: #D1FAE5
- Warning: #F59E0B (amber)
- Warning-muted: rgba(245, 158, 11, 0.12)
- Warning-light: #FEF3C7
- Error: #DC2626 (red)
- Error-muted: rgba(220, 38, 38, 0.12)
- Error-light: #FEE2E2
- Info: #2563EB (blue)
- Info-muted: rgba(37, 99, 235, 0.12)
- Info-light: #DBEAFE

### Text
- Text: #1C2333 (off-black with blue tint)
- Text-secondary: #5C6B7A
- Text-tertiary: #8896A6
- Text-disabled: #B0BEC5
- Visited-link: #7B1FA2

## Surfaces
- Page: #F4F7F9 (blue-tinted)
- Card: #FFFFFF
- Elevated: #FFFFFF
- Highlighted: rgba(13, 59, 82, 0.04) (primary-50)
- Info-surface: rgba(13, 59, 82, 0.08) (primary-100)
- Input: #EDF1F5 (blue-tinted)
- Input-hover: #E3E9EF
- Overlay: rgba(28, 35, 51, 0.5)
- Skeleton: #E8ECF0

## Borders
- Default: rgba(28, 35, 51, 0.12)
- Subtle: rgba(28, 35, 51, 0.06)
- Focus: 3px solid #0085B3 (teal)
- Error: rgba(220, 38, 38, 0.4)
- Divider: rgba(28, 35, 51, 0.06)
- Accent-stripe: 3px solid var(--primary)

## Glass
- Background: rgba(255, 255, 255, 0.93)
- Blur: 6px
- Border: 1px solid rgba(13, 59, 82, 0.06)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.06)

## Typography
- Font: Inter (variable, woff2 — clean, geometric, fintech-standard)
- Headings-font: Sora (geometric, trustworthy)
- Headings-weight: 700
- Body-weight: 400
- Body-size-min: 14px
- Line-height-body: 1.6
- Line-height-heading: 1.2
- Line-height-compact: 1.4
- Letter-spacing-heading: -0.02em
- Letter-spacing-uppercase: 0.05em
- Line-length: 48rem
- Font-scaling: 1 | 1.25 | 1.5
- Mono-font: JetBrains Mono (for policy IDs, premium amounts)

## Gradients
- Primary: linear-gradient(135deg, #0D3B52, #082838)
- Surface: linear-gradient(180deg, #F4F7F9, #FFFFFF)
- Accent-subtle: linear-gradient(135deg, rgba(13, 59, 82, 0.06), rgba(13, 59, 82, 0.02))
- Header: linear-gradient(135deg, #082838, #0D3B52)

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
- Chart-1: #0D3B52 (primary)
- Chart-2: #2A7AE8 (electric blue)
- Chart-3: #059669 (emerald)
- Chart-4: #F59E0B (amber)
- Chart-5: #7B1FA2 (purple)
- Chart-6: #0085B3 (teal)

## Dark Mode
- Dark-page: #0D1B2A
- Dark-card: #1B2838
- Dark-elevated: #243447
- Dark-input: rgba(27, 40, 56, 0.6)
- Dark-text: #E8EDF2
- Dark-text-secondary: #94A3B8
- Dark-primary: #1A5A7A
- Dark-accent: #4A90E8
- Dark-border: rgba(148, 163, 184, 0.12)
- Dark-overlay: rgba(0, 0, 0, 0.6)

## Modern CSS Techniques

```css
:root { --font-scaling: 1; font-size: calc(100% * var(--font-scaling)); }
a { text-decoration-thickness: max(0.08em, 1px); text-underline-offset: 0.25em; }
.button:hover { background: color-mix(in srgb, var(--primary), white 15%); }
.prose { max-inline-size: 48rem; }
.amount { font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; }
.visually-hidden { clip-path: inset(50%); block-size: 1px; inline-size: 1px; overflow: hidden; position: absolute; }
@media (width >= 768px) { }
```

## Design Directives

Directives have 3 levels:
- **(MUST)** — Hard rule. Violation = bug. No override.
- **(SHOULD)** — Theme default. Overridable via `themeOverrides` in `.sdd-config.json` with justification.
- **(MAY)** — Opt-in. Only applied if enabled in `themeOverrides`.

### Layout
- **Density** (SHOULD): comfortable — balanced whitespace, not cramped. Trust requires breathing room. Override: `density: "compact"` for data-heavy admin views.
- **Card style** (SHOULD): elevated with subtle shadow (`--shadow-md`). White surfaces on light bg. Professional depth. Override: `cardStyle: "outlined"` for a flatter aesthetic.
- **Navigation** (MUST): sidebar for admin + top breadcrumb for context. Breadcrumbs mandatory for policy/claim navigation.
- **Form layout** (SHOULD): wizard for claims and applications (multi-step with progress indicator). Conversational tone ("Where do you live?" not "Enter ZIP code"). Multi-column for data review. Override: `formLayout: "single-column"` for simple forms.
- **Data visualization** (SHOULD): tables with status cards + progress indicators for claims/policies + summary metrics. Charts for portfolio/trends.
- **Container** (SHOULD): max-width 76.5rem (1224px). Content constrained to 48rem line-length.

### Visual
- **Illustration style** (MUST): trust-focused icons (shield, checkmark, document), minimal line illustrations. NEVER abstract or playful.
- **Animation level** (SHOULD): minimal to moderate — form step transitions, status changes, expand/collapse. No decorative animation. Override: `animationLevel: "minimal"` for maximum restraint.
- **Entry animations** (SHOULD): fadeInUp for cards, dropdowns, modals. Override: `entryAnimations: false` to disable.
- **Color usage** (SHOULD): Deep blue primary for trust and authority. Electric blue accent for interactive elements (fintech-adjacent). Semantic colors for policy/claim status.
- **Typography emphasis** (MUST): Inter for body (clean, geometric, fintech-standard). Sora for headings (geometric, trustworthy). Tabular nums for amounts and IDs. Mono font for policy IDs.
- **Surface hierarchy** (SHOULD): Page (#F4F7F9) → Card (#FFFFFF) → Elevated (#FFFFFF with shadow) → Highlighted (primary-50 bg) → Info (primary-100 bg). Blue-tinted page bg.
- **Focus indicator** (MUST): 3px solid #0085B3 (teal) — visible on all surfaces.
- **Links** (SHOULD): `text-decoration-thickness: max(0.08em, 1px)`, `text-underline-offset: 0.25em`. Visited state in purple (#7B1FA2).
- **Policy/claim status indicators** (MAY): Color-coded status badges with icons for policy lifecycle stages (active, pending, lapsed, expired). Enable: `statusBadges: true` in themeOverrides.

### Modern Patterns
- **Policy cards** (SHOULD): each policy = card with status badge + premium amount (bold, large) + CTA. Action-oriented.
- **Claim timeline** (SHOULD): vertical or horizontal step indicator for claim progress. Estimated resolution shown.
- **Coverage visualization** (MAY): radial/stacked charts for coverage breakdown. Interactive sliders for "what if" scenarios. Enable: `coverageViz: true` in themeOverrides.
- **Conversational forms** (SHOULD): questions one at a time, conversational tone, smart defaults, address autocomplete.
- **Carrier logo trust wall** (MAY): carrier/reinsurer logos for trust signals. Enable: `carrierLogos: true` in themeOverrides.
- **Summary box** (SHOULD): key info callout with icon + primary-100 bg + left border. For coverage gaps, important deadlines.
- **Command palette** (MAY): keyboard-driven quick actions. Enable: `commandPalette: true` in themeOverrides.

### NEVER (MUST — all non-overridable)
- NEVER use dark mode (insurance UI is light for trust and readability)
- NEVER use glassmorphism (undermines trust — feels unstable)
- NEVER use dense layouts without adequate whitespace
- NEVER use playful or decorative elements
- NEVER use icon-only navigation (labels required for clarity — WCAG 1.3.1)
- NEVER use red for non-critical status (red = denied/failed ONLY)
- NEVER hide policy/claim IDs (always visible for reference)
- NEVER use animation without `prefers-reduced-motion` fallback (WCAG 2.3.3)
- NEVER use color-only status indicators (always color + icon + text — WCAG 1.4.1)
- NEVER use touch targets below 44px (WCAG 2.5.5)
- NEVER use `outline: none` without `:focus-visible` replacement
- NEVER use `border-bottom` for link underlines
- NEVER use pure #000000 for text (use off-black #1C2333)

## themeOverrides

Override SHOULD/MAY directives in `.sdd-config.json`:

```json
{
  "theme": "insurtech",
  "themeOverrides": {
    "density": "compact",
    "cardStyle": "outlined",
    "formLayout": "single-column",
    "animationLevel": "minimal",
    "statusBadges": true,
    "cardHover": "shadow-md",
    "entryAnimations": true,
    "inputWrapper": true,
    "progressiveDisclosure": true,
    "pageHeaderIcon": true,
    "ambienteBadge": true,
    "claimTimeline": true,
    "coverageViz": true,
    "carrierLogos": true,
    "commandPalette": true
  }
}
```

MUST directives cannot be overridden. If an override contradicts a MUST, it is rejected.

## Override Key Schema

| Key | Type | Values | Default | Shared |
|-----|------|--------|---------|--------|
| `density` | string | `"compact"`, `"comfortable"` | `"comfortable"` | No |
| `cardStyle` | string | `"elevated"`, `"outlined"` | `"elevated"` | No |
| `formLayout` | string | `"single-column"`, `"wizard"`, `"multi-column"` | `"wizard"` | No |
| `animationLevel` | string | `"minimal"`, `"moderate"` | `"moderate"` | No |
| `statusBadges` | boolean | `true`, `false` | `false` | No |
| `cardHover` | string | `"shadow-md"`, `"scale"`, `"none"` | `"shadow-md"` | Yes |
| `entryAnimations` | boolean | `true`, `false` | `true` | Yes |
| `inputWrapper` | boolean | `true`, `false` | `true` | Yes |
| `progressiveDisclosure` | boolean | `true`, `false` | `true` | Yes |
| `pageHeaderIcon` | boolean | `true`, `false` | `true` | Yes |
| `ambienteBadge` | boolean | `true`, `false` | `false` | Yes |
| `claimTimeline` | boolean | `true`, `false` | `true` | No |
| `coverageViz` | boolean | `true`, `false` | `false` | No |
| `carrierLogos` | boolean | `true`, `false` | `false` | No |
| `commandPalette` | boolean | `true`, `false` | `false` | No |

## Style Notes
- Modern insurtech aesthetic (2024-2026) — fintech-adjacent, trust + tech
- Deep blue primary (#0D3B52) — trust and authority
- Electric blue accent (#2A7AE8) — fintech-adjacent, tech signal
- Off-black text (#1C2333) — reduces eye fatigue
- Blue-tinted page background (#F4F7F9) — warmer than pure gray
- Inter variable font — clean, geometric, fintech-standard
- Sora headings — geometric, trustworthy
- Mono font for policy IDs and premium amounts
- Teal focus indicator (#0085B3) — distinct brand element
- `color-mix()` for computed hover states
- Policy cards with status + premium — action-oriented
- Claim timeline/stepper — visual progress tracking
- Conversational form tone — "Where do you live?" not "Enter ZIP code"
- Carrier logo trust wall — reinsurance credibility
- Summary box for coverage gaps and deadlines
- Data visualization palette: 6 harmonized chart colors
- Dark mode palette available (for premium feel)
- Line length constrained to 48rem
