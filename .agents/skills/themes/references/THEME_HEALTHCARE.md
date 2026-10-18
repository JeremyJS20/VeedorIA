# Theme: Healthcare

theme_base: healthcare
mode: light

## Colors

### Primary family (Teal — modern healthcare standard)
- Primary: #0D9488 (teal — Zocdoc, Doximity, Viz.ai convergence)
- Primary-light: #14B8A6
- Primary-dark: #0F766E
- Primary-50: rgba(13, 148, 136, 0.04)
- Primary-100: rgba(13, 148, 136, 0.08)
- Primary-200: rgba(13, 148, 136, 0.12)

### Accent (Violet — AI indicator)
- Accent: #7C3AED (violet — signals AI/innovation)
- Accent-hover: #6D28D9
- Accent-muted: rgba(124, 58, 237, 0.12)
- Accent-light: #F5F3FF

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
- Text: #1F2937 (off-black — Gray-800, softer than pure black)
- Text-secondary: #6B7280 (Gray-500)
- Text-tertiary: #9CA3AF (Gray-400)
- Text-disabled: #D1D5DB
- Visited-link: #7B1FA2

## Surfaces
- Page: #F9FAFB (Gray-50 — neutral, teal-friendly)
- Card: #FFFFFF
- Elevated: #FFFFFF
- Highlighted: rgba(13, 148, 136, 0.04) (primary-50)
- Info-surface: rgba(13, 148, 136, 0.08) (primary-100)
- Input: #F3F4F6 (Gray-100)
- Input-hover: #E5E7EB (Gray-200)
- Overlay: rgba(31, 41, 55, 0.5)
- Skeleton: #E5E7EB

## Borders
- Default: rgba(31, 41, 55, 0.12)
- Subtle: rgba(31, 41, 55, 0.06)
- Focus: 3px solid #0D9488 (teal — matches primary)
- Error: rgba(220, 38, 38, 0.4)
- Divider: rgba(31, 41, 55, 0.06)
- Accent-stripe: 3px solid var(--primary)

## Glass
- Background: rgba(255, 255, 255, 0.93)
- Blur: 6px
- Border: 1px solid rgba(13, 148, 136, 0.06)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.06)

## Typography
- Font: Inter (variable, woff2 — dominates clinical platforms)
- Headings-font: Outfit (friendly but professional)
- Headings-weight: 700
- Body-weight: 400
- Body-size-min: 14px (clinical workflow), 16px (patient-facing)
- Line-height-body: 1.6
- Line-height-heading: 1.2
- Line-height-compact: 1.4
- Letter-spacing-heading: -0.02em
- Letter-spacing-uppercase: 0.05em
- Line-length: 48rem
- Font-scaling: 1 | 1.25 | 1.5
- Mono-font: JetBrains Mono (for lab values, vital signs, numeric data)

## Gradients
- Primary: linear-gradient(135deg, #0D9488, #0F766E)
- Surface: linear-gradient(180deg, #F9FAFB, #FFFFFF)
- Accent-subtle: linear-gradient(135deg, rgba(13, 148, 136, 0.06), rgba(13, 148, 136, 0.02))

## States
- Hover: color-mix(in srgb, var(--primary), white 15%)
- Active-scale: 0.98
- Disabled-opacity: 0.5
- Focus-ring: 0 0 0 3px #0D9488

## Motion
- Fast: 150ms
- Normal: 250ms
- Slow: 400ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

## Border Radius
- sm: 6px (clinical precision + approachability)
- md: 8px
- lg: 12px
- xl: 16px
- pill: 9999px

## Data Visualization
- Chart-1: #0D9488 (teal)
- Chart-2: #7C3AED (violet)
- Chart-3: #059669 (emerald)
- Chart-4: #F59E0B (amber)
- Chart-5: #2563EB (blue)
- Chart-6: #DC2626 (red)

## Dark Mode
- Dark-page: #111827
- Dark-card: #1F2937
- Dark-elevated: #374151
- Dark-input: rgba(31, 41, 55, 0.6)
- Dark-text: #F9FAFB
- Dark-text-secondary: #9CA3AF
- Dark-primary: #14B8A6
- Dark-accent: #A78BFA
- Dark-border: rgba(156, 163, 175, 0.12)
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
- **Density** (MUST): comfortable — generous whitespace, breathing room between sections, large touch targets (≥48×48px). Not cramped.
- **Card style** (SHOULD): flat with subtle shadow (`--shadow-sm`). Clean white surfaces. No glassmorphism.
- **Navigation** (SHOULD): top nav for public pages, sidebar for admin/clinical pages. Breadcrumbs for depth >2.
- **Form layout** (SHOULD): wizard for multi-step clinical flows (intake, assessment, prescription). Single column for simple forms.
- **Data visualization** (SHOULD): clean tables with row separators + status indicators (colored dots + text) + timeline for chronological data. Charts for trends.
- **Container** (SHOULD): max-width 76.5rem (1224px). Content constrained to 48rem line-length.

### Visual
- **Illustration style** (SHOULD): clinical icons (outline style), anatomical/medical illustrations. Warm, not cold. NEVER abstract geometric.
- **Animation level** (SHOULD): minimal — page transitions, focus states, loading skeletons. No hover micro-interactions. `prefers-reduced-motion` respected by default.
- **Entry animations** (SHOULD): fadeInUp (translateY + opacity, 250-400ms) for cards, dropdowns, modals. Calm, not flashy. Override: `entryAnimations: false` to disable.
- **Color usage** (SHOULD): Teal primary for branding/navigation (bridges blue trust + green health). Violet accent for AI-generated content and innovation features. Semantic colors for clinical status (green=normal, amber=attention, red=critical). Override: `accent: "gold"` for gold accent.
- **Typography emphasis** (MUST): Inter for body (dominates clinical platforms, excellent at small sizes). Outfit for headings (friendly but professional). Minimum 14px body text (clinical accessibility). Mono font for lab values and numeric data.
- **Surface hierarchy** (SHOULD): Page (#F9FAFB) → Card (#FFFFFF) → Elevated (#FFFFFF with shadow) → Highlighted (primary-50 bg) → Info (primary-100 bg). Neutral page bg.
- **Focus indicator** (MUST): 3px solid #0D9488 (teal) — matches primary, visible on all surfaces.
- **Links** (SHOULD): `text-decoration-thickness: max(0.08em, 1px)`, `text-underline-offset: 0.25em`. Visited state in purple (#7B1FA2).
- **Clinical status indicators** (MAY): Enhanced status badges with pulse animation for critical states. Enable: `clinicalPulse: true` in themeOverrides.
- **AI indicator** (SHOULD): Violet (#7C3AED) accent for AI-generated content. Distinct from human-authored content.

### Modern Patterns
- **Patient header** (SHOULD): sticky top banner with name, DOB, MRN, allergies (red flag), status badge. Always visible during clinical workflow.
- **Vitals as cards** (SHOULD): key-value pairs with sparkline trends, color-coded ranges (normal=green, abnormal=red, borderline=amber). NOT table rows.
- **Summary box** (SHOULD): key info callout with icon + primary-100 bg + left border. For clinical alerts, care notes.
- **Command palette** (MAY): keyboard-driven quick actions for clinical efficiency. Enable: `commandPalette: true` in themeOverrides.

### NEVER (MUST — all non-overridable)
- NEVER use glassmorphism or backdrop-filter blur
- NEVER use dark mode (healthcare UI is ALWAYS light for readability and clinical accuracy)
- NEVER use font size below 14px for body text (accessibility for clinical users)
- NEVER use icon-only buttons (always icon + label in clinical context)
- NEVER use playful or decorative animation
- NEVER use red for non-critical elements (red = critical/emergency ONLY in healthcare)
- NEVER use abstract or geometric illustration style
- NEVER use dense data tables without row separators and adequate padding
- NEVER use animation without `prefers-reduced-motion` fallback (WCAG 2.3.3)
- NEVER use color-only status (always color + icon + text — WCAG 1.4.1)
- NEVER use touch targets below 48px (WCAG 2.5.5)
- NEVER use `outline: none` without `:focus-visible` replacement
- NEVER use `border-bottom` for link underlines
- NEVER use pure #000000 for text (use off-black #1F2937)

## themeOverrides

Override SHOULD/MAY directives in `.sdd-config.json`:

```json
{
  "theme": "healthcare",
  "themeOverrides": {
    "accent": "gold",
    "clinicalPulse": true,
    "cardHover": "shadow-md",
    "entryAnimations": true,
    "inputWrapper": true,
    "progressiveDisclosure": true,
    "pageHeaderIcon": true,
    "ambienteBadge": true,
    "patientHeader": true,
    "commandPalette": true
  }
}
```

MUST directives cannot be overridden. If an override contradicts a MUST, it is rejected.

## Override Key Schema

| Key | Type | Values | Default | Shared |
|-----|------|--------|---------|--------|
| `accent` | string | `"gold"`, `"primary"`, hex | `"primary"` | No |
| `clinicalPulse` | boolean | `true`, `false` | `false` | No |
| `cardHover` | string | `"shadow-md"`, `"scale"`, `"none"` | `"shadow-md"` | Yes |
| `entryAnimations` | boolean | `true`, `false` | `true` | Yes |
| `inputWrapper` | boolean | `true`, `false` | `true` | Yes |
| `progressiveDisclosure` | boolean | `true`, `false` | `true` | Yes |
| `pageHeaderIcon` | boolean | `true`, `false` | `true` | Yes |
| `ambienteBadge` | boolean | `true`, `false` | `false` | Yes |
| `patientHeader` | boolean | `true`, `false` | `true` | No |
| `commandPalette` | boolean | `true`, `false` | `false` | No |

## Style Notes
- Modern clinical aesthetic (2024-2026) — calm, authoritative, accessible
- Teal primary (#0D9488) — bridges blue trust + green health (Zocdoc, Doximity, Viz.ai)
- Violet accent (#7C3AED) — signals AI/innovation (Viz.ai, Flatiron, Doximity Ask)
- Off-black text (#1F2937) — softer than pure black, reduces eye strain
- Inter variable font — dominates clinical platforms
- Mono font for lab values — prevents misreading (0 vs O)
- Teal focus indicator (#0D9488) — matches primary
- `color-mix()` for computed hover states
- Patient header sticky — always visible during workflow
- Vitals as cards with sparklines — NOT table rows
- AI indicator violet — distinct from human-authored content
- Minimum 14px body (clinical), 16px (patient-facing)
- Line length constrained to 48rem
- Data visualization palette: 6 harmonized chart colors
- Dark mode palette available (for imaging/workflow intensive)
