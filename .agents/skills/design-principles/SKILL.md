---
name: Design Principles
description: design principles for distinctive, non-generic UI grounded in domain and theme
---

# Design Principles

Principles that produce distinctive, domain-appropriate interfaces. Source: assimilated from frontend-design, ui-ux-pro-max, emil-design-eng, and web-design-guidelines.

## ⚠️ REQUIRE: Active theme

1. Read `theme` from `.sdd-config.json`
2. Read `core/themes/THEME_[NAME].md` → `## Design Directives`
3. Read `design-anti-patterns.md`
4. ALL design decisions MUST comply with theme directives and avoid anti-patterns

---

## 1. Ground It in the Subject

Before designing, name one concrete subject, its audience, and the page's single job. The subject's own world — its materials, instruments, artifacts, and vernacular — is where distinctive choices come from.

| Question | Answer before designing |
|----------|----------------------|
| What is this product? | Name it specifically, not "a web app" |
| Who uses it? | Role, expertise level, context of use |
| What is this page's single job? | One verb: manage, create, review, monitor, compare |
| What does the domain look like? | Finance = numbers dense. Healthcare = status critical. Gov = form heavy. |

NEVER start with "A modern [X] interface". Start with the domain's reality.

## 2. Aesthetic Direction Before Implementation

Choose an aesthetic direction BEFORE writing any UI prompt. This is not a theme — it's the intentional visual personality within the theme.

| Direction | When | Example |
|-----------|------|---------|
| **Precision** | Data-dense, financial, analytical | Tight spacing, tabular data, monospace numbers, minimal decoration |
| **Calm** | Healthcare, wellness, education | Generous whitespace, soft borders, muted palette, breathing room |
| **Authority** | Government, legal, compliance | Structured grid, formal typography, minimal animation, clear hierarchy |
| **Trust** | Insurance, banking, security | Conservative palette, familiar patterns, clear feedback, no surprises |
| **Efficiency** | Internal tools, ERP, CRM | Compact layout, keyboard shortcuts, bulk actions, data-first |
| **Engagement** | Marketing, onboarding, public-facing | Hero moments, illustration, progressive disclosure, guided flow |

The aesthetic direction MUST align with the theme's Design Directives. If the theme says "minimal animation", you cannot choose "Engagement" with expressive motion.

## 3. Typography Carries Personality

Typography is the primary vehicle for visual identity, not colors or layout.

| Principle | Rule |
|-----------|------|
| **Pair deliberately** | Display + body faces are a design decision, not a default. Use the theme's specified pair. |
| **Set a type scale** | Define a modular scale (e.g., 1.25 ratio) and stick to it. No arbitrary font sizes. |
| **Weight creates hierarchy** | 2-3 weights only: regular (400) for body, medium (500) for labels, bold (700) for headings. |
| **Size creates scanability** | Headings 2-3x body size. Labels = body size. Captions = 0.75x body size. |
| **Line-height creates density** | Compact: 1.3-1.4. Comfortable: 1.5-1.6. Spacious: 1.7+. Match theme density. |

NEVER use Inter + Space Grotesk unless the active theme specifies it. Each theme has a distinct pairing for a reason.

## 4. Structure Is Information

Structural devices (numbering, eyebrows, dividers, labels) must encode something true about the content, not decorate it.

| Device | Use when | Don't use when |
|--------|----------|----------------|
| Numbered markers (01/02/03) | Content IS a sequence (process, timeline, steps) | Content is a collection with no inherent order |
| Section dividers | Sections are independent, can be read in any order | Sections are a continuous narrative |
| Eyebrow labels | Category/type above heading adds search value | Category is obvious from context |
| Breadcrumbs | Navigation depth >2 | Single-level pages |
| Tabs | ≥3 peer sections | 2 options (use toggle) |

## 5. Motion Is Deliberate

Animation serves the subject, not decoration. An orchestrated moment lands harder than scattered effects.

| Level | When | What |
|-------|------|------|
| **Minimal** | Corporate, GovTech, Institutional | Page transitions, focus states, loading indicators only |
| **Moderate** | Fintech, InsurTech | Micro-interactions (hover, toggle), form validation feedback, data update transitions |
| **Expressive** | Marketing, onboarding only | Scroll-triggered reveals, ambient atmosphere, orchestrated page-load sequences |

| Principle | Rule |
|-----------|------|
| **Orchestrate over scatter** | One well-timed sequence > 5 independent animations |
| **Compositor-only** | Animate `transform` + `opacity` only. Never `width`, `height`, `top`, `left`. |
| **Respect reduced-motion** | ALWAYS wrap in `@media (prefers-reduced-motion: no-preference)` |
| **Duration by purpose** | Micro: 150ms. Transition: 250ms. Page: 400ms. Never >500ms for UI feedback. |
| **Easing** | `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard). Never `linear` for UI. |

## 6. Match Complexity to Vision

| Vision | Execution |
|--------|-----------|
| Maximalist | Elaborate: layered backgrounds, multiple type treatments, rich interactions |
| Minimal | Precise: exact spacing, refined type details, restrained palette |
| Functional | Efficient: compact layout, keyboard-first, data-dense |

Elegance is executing the chosen vision well. A minimalist design with sloppy spacing is worse than a maximalist one with attention to detail.

## 7. The Hero Is a Thesis

For landing/public pages, the hero opens with the most characteristic thing in the subject's world — in whatever form makes sense:

| Domain | Hero thesis |
|--------|-------------|
| Payments | Live transaction amount animating |
| Healthcare | Patient status at a glance |
| Insurance | Policy coverage visualization |
| Government | Service category search |
| Internal tool | Skip hero → go straight to data |

A big number with a small label, supporting stats, and a gradient accent is the template answer. Use it ONLY if that's truly the best option for the domain.

## 8. Color Serves Function

| Principle | Rule |
|-----------|------|
| **Theme tokens are mandatory** | NEVER hardcode colors. Always `var(--theme-*)`. |
| **Accent = action** | Accent color is for interactive elements (links, CTAs, active states). Not for decoration. |
| **Semantic = status** | Success (green), warning (amber), error (red) are for system state. Not for branding. |
| **Surfaces = hierarchy** | Page → Card → Elevated. Each surface level communicates depth. |
| **2 accent colors max** | Primary accent + one secondary. Semantic colors don't count as accents. |
| **Contrast is non-negotiable** | WCAG AA minimum. GovTech: AAA. Test with theme's mode (light/dark). |

## 9. Taste Is Trained, Not Innate

Good taste is not personal preference. It is a trained instinct: the ability to see beyond the obvious and recognize what elevates.

| Practice | How |
|----------|-----|
| **Study great work** | Before designing, look at 3 reference interfaces in the same domain. Note what makes them distinctive. |
| **Reverse engineer** | Inspect animations. Measure spacing. Analyze type scales. Understand WHY something feels right. |
| **Question defaults** | Every default choice (Inter, cyan, sidebar, 4 stat cards) should be questioned. Is this the best option for THIS domain? |
| **Take one risk** | Make one deliberate, opinionated choice that a template wouldn't make. Justify it. |

## Application in SDD Workflow

| Step | How principles apply |
|------|---------------------|
| **solution-designer step 2.7** (theme selection) | Aesthetic direction is chosen alongside theme. Document in design.md. |
| **solution-designer step 3.4** (UI screens) | Read theme Design Directives + these principles + anti-patterns BEFORE generating any prompt. |
| **solution-designer step 3e** (cross-page coherence) | Verify each page follows a different layout, matches aesthetic direction, avoids anti-patterns. |
| **code-reviewer** | Flag violations of these principles as 🟡 Warning. |
