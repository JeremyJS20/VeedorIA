### 13.3 Resulting Utility Classes

Once registered, these utilities become available:

| Utility Class | CSS Output | Design Token |
|---|---|---|
| `bg-surface-card` | `background: var(--surface-card)` | Section 3 Surfaces |
| `bg-surface-inset` | `background: var(--surface-inset)` | Section 3 Surfaces |
| `text-fg` | `color: var(--text-primary)` | Section 3 Text |
| `text-fg-secondary` | `color: var(--text-secondary)` | Section 3 Text |
| `text-fg-tertiary` | `color: var(--text-tertiary)` | Section 3 Text |
| `text-accent` | `color: var(--accent-primary)` | Section 3 Accents |
| `text-error` | `color: var(--accent-error)` | Section 3 Accents |
| `border-surface-border` | `border-color: var(--surface-border)` | Section 3 Surfaces |
| `border-accent` | `border-color: var(--accent-primary)` | Section 3 Accents |
| `bg-accent-dim` | `background: var(--accent-primary-dim)` | Section 3 Accents |
| `bg-error-dim` | `background: var(--accent-error-dim)` | Section 3 Accents |

**Theme-reactive:** Because these resolve to CSS variables (not static hex values), they automatically adapt when `[data-theme]` changes — no Tailwind `dark:` prefix needed for theme-aware colors.



### 13.4 Component Class Strategy

The design system uses a **hybrid approach**: Tailwind utilities for layout/spacing/typography, and BEM-ish component classes for complex visual patterns.

**Use Tailwind utilities for:**
- Layout: `flex`, `grid`, `gap-4`, `items-center`, `justify-between`
- Spacing: `p-5`, `m-4`, `mb-6`, `px-8`
- Typography: `font-bold`, `font-mono`, `text-sm`, `uppercase`, `tracking-wide`
- Positioning: `relative`, `absolute`, `top-1/2`, `-translate-y-1/2`
- Sizing: `w-full`, `min-w-[200px]`, `max-w-[360px]`, `h-8`
- Overflow: `overflow-hidden`, `overflow-x-auto`, `truncate`

**Use component CSS classes for:**
- Glass surfaces: `.glass-card` (`backdrop-filter: blur(16px)` glass in both modes, glow shadows in dark mode)
- Glass glow: `.glass-card-glow` (adds stronger blue glow drop shadow)
- Solid surfaces: `.inset-panel` (solid surface with `--surface-container` background, `--outline-variant` border, on-hover elevation via `.inset-panel-hoverable`)
- Badges: `.badge` (monospace inline flex with `--accent-*` color mapping, wraps HeroUI `<Chip>`)
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` (wraps HeroUI `<Button>`, provides gradient fills, glow shadows, scale transforms)

Example component classes:

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--outline-variant);
  border-radius: 24px;
  padding: 24px;
}

[data-theme="dark"] .glass-card {
  background: rgba(17, 19, 25, 0.7);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4),
    inset 0 0.5px 0 0 rgba(255, 255, 255, 0.05);
}

.glass-card-glow {
  box-shadow: 0 20px 40px -5px rgba(0, 61, 155, 0.08);
}

[data-theme="dark"] .glass-card-glow {
  box-shadow: 0 20px 40px -5px rgba(0, 61, 155, 0.3);
}

.inset-panel {
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: 16px;
  padding: 24px;
  transition: all 200ms ease;
}

.inset-panel-hoverable:hover {
  background: var(--surface-container-high);
}

[data-theme="light"] .inset-panel-hoverable:hover {
  background: #ffffff;
}
```

**Rule:** Component classes own visual complexity (blur, gradients, multi-property transitions). Tailwind utilities own structural simplicity (padding, flex, gap).



### 13.5 Critical Gotchas

#### 13.5.1 CSS Layer Ordering

Tailwind 4 uses `@layer` for cascade control. The layer order is: `base` < `components` < `utilities`.

**Problem:** CSS rules written **outside** any `@layer` have higher priority than all layered rules — including utilities. This means:

```css
/* ❌ BREAKS utilities — unlayered * selector overrides p-5, m-4, gap-3 */
*, *::before, *::after {
  padding: 0;
  margin: 0;
}
```

**Solution:** Do **not** add manual resets when using Tailwind 4. The `@import "tailwindcss"` directive includes a comprehensive preflight that handles `box-sizing`, margins, and padding resets within `@layer base` — which utilities can correctly override.

#### 13.5.2 Namespace Replacement

When you define custom values in `@theme` for a given namespace prefix (e.g., `--text-*`), Tailwind 4 **replaces the entire default set** for that namespace. If you define `--text-2xs`, `--text-xs`, `--text-sm`, `--text-base` — then `text-lg`, `text-xl`, `text-2xl` etc. **stop working** because they were not defined.

**Mitigation:** Only register namespaces that don't collide with Tailwind defaults. Use `--color-fg-*` instead of `--text-*` for text colors. For font sizes, either define the full scale or avoid the `--text-*` namespace entirely and use the runtime variables directly.

#### 13.5.3 `@apply` Specificity

Component classes using `@apply` are generated in `@layer components`. Utility classes from HTML are in `@layer utilities`. This means **utilities always beat `@apply`** when specificity is equal — which is the correct behavior. You can safely use `className="glass-card p-5"` and `p-5` will add padding on top of `.glass-card`'s styles.

However, if you need a component class to **always** enforce a value (e.g., a button's minimum height), use a direct CSS property instead of `@apply`:

```css
/* ✅ Direct property — can't be overridden by utilities */
.btn { min-height: 38px; }

/* ⚠️ @apply — CAN be overridden by min-h-0 or min-h-* utilities */
.btn { @apply min-h-[38px]; }
```

#### 13.5.4 Date Input Theming

Native `<input type="date">` elements use the browser's built-in date picker, which follows the `color-scheme` CSS property. Set it per theme:

```css
.input[type="date"] { color-scheme: light; }
[data-theme="dark"] .input[type="date"] { color-scheme: dark; }
```



### 13.6 File Organization

The recommended structure for the main CSS file:

```css
/* 1. Tailwind import (includes preflight + utilities) */
@import "tailwindcss";

/* 2. @theme bridge — registers design tokens for TW utilities */
@theme {
  --font-sans: ...;
  --color-surface-*: ...;
  --color-fg-*: ...;
  --color-accent-*: ...;
}

/* 3. Runtime theme variables (CSS custom properties) */
:root { /* light theme tokens from Section 3 */ }
[data-theme="dark"] { /* dark overrides from Section 3 */ }

/* 4. Base styles (typography, links, focus rings) */
html { font-family: var(--font-sans); color: var(--text-primary); ... }

/* 5. Component classes (glass-card, inset-panel, data-table, sidebar, etc.) */
.glass-card { ... }
.inset-panel { ... }
.data-table { ... }
.btn { ... }

/* 6. Page layout (sidebar, page-header, page-body) */
/* 7. Animations (@keyframes) */
/* 8. Print styles (@media print) */
```

**Key principle:** Sections 1–2 are Tailwind-specific. Sections 3–8 are the same CSS you'd write without Tailwind — the only difference is that component classes can use `@apply` with the registered theme utilities instead of repeating `background: var(--surface-card)` manually.
