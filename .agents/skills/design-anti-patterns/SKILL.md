---
name: "Design Anti-Patterns"
description: "visual and UX anti-patterns that produce generic, repetitive, or low-quality designs"
---

# Design Anti-Patterns

Rules that prevent generic AI-generated aesthetics. Violations produce interfaces that look templated, not distinctive.

## ⚠️ REQUIRE: Active theme

Read `theme` from `.sdd-config.json` → load `core/themes/THEME_[NAME].md` → read `## Design Directives`. Every anti-pattern below is evaluated against the active theme's directives.

---

## 1. Generic AI Aesthetics

The most common failure mode: every page looks like the same dark dashboard with gradient accents.

| Anti-pattern | Why it's bad | Fix |
|--------------|-------------|-----|
| **4 stat cards + data table** on every dashboard | This is the #1 AI-generated layout. It's the default, not a design. | Vary layout: use charts, timelines, Kanban, map views, or split-view depending on domain. |
| **Same layout for all pages** | Dashboard, settings, detail, and forms all use sidebar + card. | Each page type MUST have a distinct layout pattern (see design-system-base.md Layout Patterns). |
| **Gradient accent on every CTA** | Overused. Every AI button has `linear-gradient(135deg, ...)`. | Use solid accent color for CTAs. Reserve gradients for hero sections or brand moments only. |
| **"A modern [X] interface"** as opening prompt | Signals generic design thinking. | Describe the specific domain, audience, and single job of the page. Ground in the subject's world. |
| **Glassmorphism everywhere** | Frosted glass on every card is a trend, not a design system. | Use ONLY if theme Design Directives allow glass. Institutional: overlays/modals only. Fintech: allowed. Corporate: NEVER. |
| **Cyan/teal accent on dark navy** | The default AI color scheme. | Use the ACTIVE THEME's accent color. Never default to #06B6D4 on #0A1628 unless theme is fintech. |
| **Inter + Space Grotesk** as font pair | Overused combination. | Use the ACTIVE THEME's font pair. Each theme has a distinct pairing. |

## 2. Visual Anti-Patterns

| Anti-pattern | Rule | Exception |
|--------------|------|-----------|
| **Gradient-on-gradient** | NEVER stack gradient backgrounds on nested elements (card on page both gradient). | Hero sections where gradient is the brand moment. |
| **3+ accent colors** | Maximum 2 accent colors per page: primary accent + semantic (success/warning/error). | Data visualization legends (use muted variants). |
| **Centered layout for data-dense pages** | Tables, dashboards, admin panels → full-width with sidebar. Centered = form/landing only. | Mobile views where full-width is implicit. |
| **Icon-only navigation** | Icons without labels cause discoverability issues. | Mobile bottom nav (but add labels on ≥768px). Collapsed sidebar with tooltip. |
| **Monochrome cards** | All cards same bg, same border, same shadow = no visual hierarchy. | Vary elevation: primary card elevated (shadow-md), secondary (shadow-sm), tertiary (subtle border). Use accent stripe or accent-subtle header for emphasis. |
| **Uniform spacing** | Same gap between all sections = flat information hierarchy. | Use spacing scale: 8px within group, 16px between groups, 32px between sections, 48px between major areas. |
| **No empty states** | Empty tables/lists = broken UI. | ALWAYS design empty state (illustration + message + CTA). |
| **Truncated text without tooltip** | `text-overflow: ellipsis` without `title` attribute = inaccessible. | Add `title` attribute or tooltip on hover/focus. |
| **Status without color + label** | Color-only status badges fail for colorblind users. | ALWAYS: color + icon + text label. |

## 3. UX Anti-Patterns

| Anti-pattern | Why it's bad | Fix |
|--------------|-------------|-----|
| **Modal for multi-step flow** | Modals trap users in sequences with no progress visibility. | Use full page wizard with step indicator, or multi-step form with progress bar. |
| **Infinite scroll without virtualization** | DOM grows unbounded → memory leak + jank. | Virtualize lists >50 items. Or use pagination. |
| **Hidden primary actions** | CTA buried in menu, below fold, or same weight as secondary. | Primary action: visible, top-right or bottom, distinct style (filled button). |
| **Confirmation via toast** | "Are you sure?" in a toast that auto-dismisses = no real confirmation. | Destructive actions → modal dialog with consequence description. |
| **Tabs with <3 items** | 2 tabs = a toggle. Tabs need ≥3 to justify the pattern. | 2 options → segmented control, toggle, or switch. |
| **Sidebar + top nav redundancy** | Same links in sidebar AND top nav = confusion. | Sidebar: primary navigation. Top bar: search, notifications, user menu. Never duplicate. |
| **Form without inline validation** | Validate only on submit = frustrating. | Validate on blur. Show errors inline next to field. Focus first error on submit. |
| **No loading states** | Blank screen during data fetch = appears broken. | Skeleton matching content layout. Spinner for quick loads (<1s). |
| **Dead end pages** | Page with no navigation forward = user trapped. | Every page needs at least one forward action (CTA, next link, breadcrumb back). |

## 4. Code Anti-Patterns (from web-design-guidelines)

These produce inaccessible or broken UI regardless of visual quality.

| Anti-pattern | Fix |
|--------------|-----|
| `transition: all` | List properties explicitly: `transition: transform 200ms, opacity 200ms` |
| `outline: none` without `focus-visible` replacement | Remove outline, add `:focus-visible { outline: 2px solid var(--theme-accent); outline-offset: 2px }` |
| `<div onClick>` for actions | Use `<button>` or `<a>` |
| `<span onClick>` for navigation | Use `<Link>` or `<a>` |
| Icon-only button without `aria-label` | Add `aria-label="descriptive action"` |
| Form input without `<label>` or `aria-label` | Add `<label htmlFor="id">` or `aria-label` |
| `onPaste` with `preventDefault` | NEVER block paste |
| `user-scalable=no` or `maximum-scale=1` | NEVER disable zoom |
| Images without `width` + `height` | Add explicit dimensions (prevents CLS) |
| Large lists `.map()` without virtualization | Virtualize >50 items |
| Hardcoded date/number formats | Use `Intl.DateTimeFormat` / `Intl.NumberFormat` |
| `autoFocus` without justification | Avoid on mobile. Use sparingly on desktop for primary input only. |
| Animation without `prefers-reduced-motion` fallback | Wrap animations in `@media (prefers-reduced-motion: no-preference)` |
| `scroll-behavior: smooth` without reduced-motion check | Use JS `scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' })` |

## 5. SDD-Specific Anti-Patterns

| Anti-pattern | Detection | Fix |
|--------------|-----------|-----|
| **UI prompt ignores active theme** | Prompt uses Fintech colors when theme is Healthcare | ALWAYS read theme first. Embed theme colors/fonts in prompt. |
| **All pages use Dashboard layout** | Every page has sidebar + main content | Match layout to page type: form → centered, list → filters+table, detail → header+sections, landing → hero+features |
| **No cross-page variety** | 2+ pages have identical layout structure | After generating all prompts, compare. If identical → differentiate using theme directives. |
| **Design Directives not followed** | Theme says "elevated cards" but UI prompt uses "flat borders" | Validate each prompt against theme's `## Design Directives` before saving. |
| **Generic component diagram** | "Client → API → DB" in architecture | Generate from actual project analysis. Name real services, real data flows. |
| **Template placeholder content** | "Lorem ipsum" or "Example data" in specs | Generate from actual requirements and domain context. |

## Enforcement

When generating UI prompts or reviewing code:

1. **BEFORE generating**: Read active theme → read Design Directives → read this file
2. **DURING generating**: Check each decision against anti-patterns. If match → choose alternative.
3. **AFTER generating**: Run cross-page coherence check (see solution-designer step 3e)
4. **IN code review**: Flag anti-pattern violations as 🟡 Warning severity
