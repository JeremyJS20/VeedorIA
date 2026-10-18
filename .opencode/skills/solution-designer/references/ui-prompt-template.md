# UI Design Prompt Template — Reference

Generate ONE section per page/screen in this format. Each prompt MUST be self-contained — include ALL visual details so the agent or Stitch/v0 can generate without reading other files.

## ⚠️ REQUIRE: Before generating UI prompts

1. Read the active theme from `core/themes/THEME_[NAME].md`
2. Read `design-system-base.md` for component patterns, tokens, and **Shared UI Patterns**
3. Read `themeOverrides` from `.sdd-config.json` — merge with theme defaults to determine active directives:
   - **SHOULD defaults** from the theme apply UNLESS overridden
   - **Shared patterns** (cardHover, entryAnimations, inputWrapper, progressiveDisclosure, pageHeaderIcon, ambienteBadge) apply to ALL themes with theme-specific defaults — check `## Override Key Schema` in the theme file for defaults
   - **MUST directives** always apply — cannot be overridden
   - If a SHOULD override is set to `false` or `"none"` → skip that pattern in the prompt
   - If a MAY override is set to `true` → include that feature in the prompt
4. Extract and embed ALL values directly in each prompt:
   - Exact hex colors (NOT "use primary color" — write "#0A1628")
   - Exact font family and weights (NOT "use heading font" — write "Inter, 700")
   - Exact spacing in px (NOT "use space-4" — write "16px")
   - Exact border-radius, shadows, transitions
5. **Active overrides block** — include this section at the top of each Visual Prompt:
   ```
   ACTIVE THEME OVERRIDES:
   - cardHover: [value from themeOverrides or theme default]
   - entryAnimations: [value]
   - inputWrapper: [value]
   - progressiveDisclosure: [value]
   - pageHeaderIcon: [value]
   - ambienteBadge: [value]
   - [theme-specific overrides...]
   ```

NEVER write "see theme file" or "refer to design system" in a prompt. The prompt must work standalone.

---

## System Layout & Shared Components

Before generating per-page prompts, define the **app shell** and **reusable components** that are shared across pages. These are generated ONCE in `prompts.md` and referenced by page prompts.

### App Shell (System Layout)

Define the persistent layout that wraps all authenticated pages:

```
APP SHELL — [App Name]

STRUCTURE:
- Sidebar (left): [width], [bg], [border-right]
  - Logo area: [height], [alignment]
  - Nav items: [icon + label], [active state], [hover state]
  - Collapse toggle: [position], [collapsed width], [icon-only mode]
  - User/profile: [bottom], [avatar + name + role]
- Toolbar (top): [height], [bg], [items: breadcrumb, search, notifications, user menu]
- Content area: [padding], [max-width], [scroll behavior]

RESPONSIVE:
- Desktop (≥1024px): sidebar expanded + toolbar + content
- Tablet (768-1023px): sidebar collapsed (icon-only) + toolbar + content
- Mobile (<768px): sidebar hidden, hamburger menu in toolbar, content full-width

[Include exact colors, sizes, transitions from theme]
```

### Shared Components

Define once, reference by name in page prompts:

| Component | Define once | Pages that use it |
|-----------|-------------|-------------------|
| `AppShell` | Sidebar + Toolbar + Content area | All authenticated pages |
| `Navbar` | Top bar (logo, nav links, user menu) | Public pages (landing, login, register) |
| `DataTable` | Sortable headers, pagination, row actions, empty state, loading skeleton | List/search pages |
| `FilterBar` | Search input + filter dropdowns + active filter pills | List pages with filters |
| `FormLayout` | Card container + field stack + action buttons + validation | All form pages |
| `Modal` | Overlay + card + close button + action footer | Confirmation dialogs, detail views |
| `Toast` | Position, colors per type (success/error/warning), auto-dismiss | Global |

⚠️ **Rule**: If a component appears in 2+ pages, define it in Shared Components. Page prompts then say `Uses: AppShell, DataTable, FilterBar` instead of repeating the full definition.

⚠️ **Self-contained exception**: The Visual Prompt for each page MUST still include all values inline for standalone use in Stitch/v0/Bolt. But shared components avoid re-specifying behavior/interactions that are identical across pages.

## Example: Page /payments/new — Payment Form

### Metadata
- **Route**: `/payments/new`
- **Auth**: Required (role: user)
- **Layout**: Single column, centered
- **Responsive**: Mobile-first

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A modern payment form on a dark fintech interface.

LAYOUT:
- Page background: #0A1628 (deep navy)
- Content centered, max-width 480px, padding 24px horizontal
- Vertical stack, gap 24px

CARD (main container):
- Background: rgba(17, 24, 39, 0.8) with backdrop-filter blur(16px)
- Border: 1px solid rgba(6, 182, 212, 0.15)
- Border-radius: 12px
- Shadow: 0 20px 25px rgba(0, 0, 0, 0.15)
- Padding: 32px

TYPOGRAPHY (Inter font family):
- Page title: "New Payment" — 24px, weight 700, color #F1F5F9
- Field labels: 14px, weight 500, color #94A3B8, margin-bottom 6px
- Input text: 16px, weight 400, color #F1F5F9
- Helper text: 12px, weight 400, color #64748B

FORM FIELDS (stacked, gap 16px):
1. Amount input
   - Large display: 32px, weight 600, color #F1F5F9
   - Currency selector inline-right: dropdown (USD / PAB)
   - Prefix "$" in #64748B

2. Card number
   - Format: XXXX XXXX XXXX XXXX (auto-format on type)
   - Card brand icon appears right side on first 4 digits
   - Icons: Visa (blue), Mastercard (orange/red), Amex (blue)
   - Placeholder: "1234 5678 9012 3456", color #475569

3. Row (2 columns, gap 12px):
   - Left 50%: Expiry — placeholder "MM/YY"
   - Right 50%: CVV — placeholder "123", type password

4. Description (optional)
   - Textarea, 3 rows
   - Placeholder: "Payment description (optional)"
   - Character counter bottom-right: "0/255", color #64748B

INPUT STYLING (all inputs):
- Background: rgba(17, 24, 39, 0.6)
- Border: 1px solid rgba(148, 163, 184, 0.2)
- Border-radius: 8px
- Padding: 12px 16px
- Transition: border-color 200ms ease, box-shadow 200ms ease
- Focus: border-color #06B6D4, box-shadow 0 0 0 3px rgba(6, 182, 212, 0.1)
- Error: border-color #EF4444, box-shadow 0 0 0 3px rgba(239, 68, 68, 0.1)

CTA BUTTON:
- Text: "Pay $XX.XX" (live amount)
- Full width, height 48px, border-radius 8px
- Background: linear-gradient(135deg, #06B6D4, #0891B2)
- Color: white, font 16px weight 600
- Hover: transform scale(1.02), shadow 0 8px 16px rgba(6, 182, 212, 0.3)
- Active: transform scale(0.98)
- Disabled: opacity 0.5, cursor not-allowed, no hover effects
- Loading: text replaced with 20px spinner (white), fields disabled

SECURITY BADGES (below card):
- Horizontal row, centered, gap 8px
- Lock icon (Lucide Lock, 14px) + "PCI DSS Compliant"
- Text: 12px, color #64748B

MICRO-ANIMATIONS:
- Input focus: 200ms border-color transition
- Button hover: 150ms transform + shadow
- Card brand icon: 200ms opacity fade-in
- Error shake: 300ms horizontal shake on validation fail
- Success: green checkmark scale-in animation

MOBILE (< 640px):
- Card: border-radius 0, full-width, no horizontal margin
- Padding: 24px instead of 32px
- Amount font: 28px instead of 32px
```

### Components (from design-system-base)
| Component | Variant | Size |
|-----------|---------|------|
| Card | elevated, glassmorphism | — |
| Input | text, number, select, textarea | md |
| Button | primary | lg |
| Icon | Lucide: CreditCard, Lock, Check, AlertCircle | md (20px) |

### Spacing tokens used
| Token | Value | Where |
|-------|-------|-------|
| `--space-3` | 12px | Input padding vertical |
| `--space-4` | 16px | Field gap, input padding horizontal |
| `--space-6` | 24px | Section gap, mobile padding |
| `--space-8` | 32px | Card padding |

### States
| State | Visual change |
|-------|--------------|
| Empty | All fields empty, CTA shows "Pay $0.00", CTA disabled (opacity 0.5) |
| Filling | Fields validate on blur, CTA updates live amount |
| Validation error | Red border + error text below field, icon AlertCircle |
| Submitting | CTA shows spinner, all fields disabled, opacity 0.7 |
| Success | Redirect to /payments/:id, success toast top-right (green, auto-dismiss 5s) |
| Payment error | Error banner below card: red bg, white text, shake animation |

### Interactions
| Trigger | Action |
|---------|--------|
| Type in card number | Auto-format XXXX XXXX, detect brand on 4th digit |
| Type in amount | Format with 2 decimals, update CTA text live |
| Blur on field | Validate, show error if invalid |
| Click disabled CTA | Highlight first invalid field |
| Submit success | Show toast, redirect after 2s |
| Submit error | Show error banner, re-enable form |

### Accessibility
| Element | Requirement |
|---------|-------------|
| All inputs | `<label>` with `for` attribute, `aria-describedby` for error messages |
| Card brand icon | `aria-hidden="true"` (decorative) |
| CTA button | `aria-busy="true"` during submit, `aria-disabled="true"` when disabled |
| Error messages | `role="alert"` for screen reader announcement |
| Amount display | `aria-live="polite"` for live updates |
| Tab order | Amount → Currency → Card → Expiry → CVV → Description → Submit |
| Focus indicator | 3px cyan ring on all interactive elements |

---

## Example: Page /dashboard — Main Dashboard

### Metadata
- **Route**: `/dashboard`
- **Auth**: Required (role: user)
- **Layout**: Sidebar + main content
- **Responsive**: Desktop-first, sidebar collapses on mobile

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A modern analytics dashboard on a dark fintech interface.

LAYOUT:
- Sidebar: width 240px, background #111827, border-right 1px solid rgba(148, 163, 184, 0.08)
- Collapsed sidebar: 64px (icon-only), tooltip on hover
- Top bar: height 64px, background rgba(17, 24, 39, 0.93), backdrop-filter blur(6px), border-bottom 1px solid rgba(148, 163, 184, 0.06), sticky top 0, z-index 20
- Main content: background #0A1628, padding 24px, overflow-y auto

SIDEBAR:
- Logo area: 64px height, padding 16px, border-bottom 1px solid rgba(148, 163, 184, 0.06)
- Nav items: padding 12px 16px, border-radius 8px, color #94A3B8, font 14px weight 500
- Active item: background rgba(6, 182, 212, 0.1), color #06B6D4, left-border 3px solid #06B6D4
- Hover: background rgba(148, 163, 184, 0.06)
- Sections: separated by 1px divider rgba(148, 163, 184, 0.06), section label 11px uppercase #475569 weight 600

TOP BAR:
- Left: breadcrumb (12px, color #64748B, separator "/")
- Center: search input (max-width 400px, background rgba(17, 24, 39, 0.6), border 1px solid rgba(148, 163, 184, 0.1), border-radius 8px, placeholder "Search..." color #475569)
- Right: notification bell (badge red dot 8px if unread) + avatar circle 32px

STATS CARDS ROW (4 cards, gap 16px):
- Card: background rgba(17, 24, 39, 0.93), border 1px solid rgba(148, 163, 184, 0.06), border-radius 12px, padding 20px
- Label: 12px weight 500 color #64748B uppercase letter-spacing 0.05em
- Value: 28px weight 700 color #F1F5F9, font Space Grotesk
- Change indicator: 12px, green #22C55E with ↑ or red #EF4444 with ↓, background rgba of color at 0.1, padding 2px 6px, border-radius 4px
- Sparkline: 40px height, accent color #06B6D4, bottom of card

DATA TABLE:
- Header: background rgba(17, 24, 39, 0.6), font 12px weight 600 color #64748B uppercase
- Rows: border-bottom 1px solid rgba(148, 163, 184, 0.04), padding 12px 16px
- Row hover: background rgba(6, 182, 212, 0.03)
- Cell text: 14px weight 400 color #F1F5F9
- Status badges: padding 4px 8px, border-radius 4px, font 12px weight 500
  - Active: bg rgba(34, 197, 94, 0.1) color #22C55E
  - Pending: bg rgba(234, 179, 8, 0.1) color #EAB308
  - Failed: bg rgba(239, 68, 68, 0.1) color #EF4444
- Pagination: bottom, 14px, previous/next buttons ghost style

MOBILE (< 768px):
- Sidebar hidden, hamburger menu top-left
- Stats cards: 2 per row, gap 12px
- Table: horizontal scroll, min-width 600px
- Top bar: search hidden, icon-only
```

### Components (from design-system-base)
| Component | Variant | Size |
|-----------|---------|------|
| Nav | sidebar, breadcrumb | — |
| Card | default, elevated | — |
| Table | sortable headers, pagination | — |
| Button | ghost, primary | sm, md |
| Input | text (search) | md |
| Badge | status | sm |

### States
| State | Visual change |
|-------|--------------|
| Loading | Skeleton cards (4 pulse rectangles) + skeleton table rows (6 rows) |
| No data | Centered illustration + "No transactions yet" + CTA |
| Error | Error banner top of main content, red muted bg, retry button |
| Sidebar collapsed | 64px width, icons only, labels hidden, tooltip on hover |

---

## Example: Page /login — Authentication

### Metadata
- **Route**: `/login`
- **Auth**: Public
- **Layout**: Split screen
- **Responsive**: Mobile-first

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A modern login page with split-screen layout, dark fintech theme.

LAYOUT:
- Left panel (50%): background linear-gradient(135deg, #0A1628, #111827), centered branding + illustration
- Right panel (50%): background #111827, centered form card
- Mobile: left panel hidden, form full-width with subtle gradient bg

LEFT PANEL:
- Logo: SVG or text, 24px weight 700, color #F1F5F9, top-left padding 32px
- Center: abstract financial illustration or animated gradient mesh
- Bottom: tagline 16px weight 400 color #94A3B8, max-width 320px, centered
- Decorative: subtle grid pattern overlay at 3% opacity

RIGHT PANEL:
- Form card: max-width 400px, centered vertically and horizontally
- No visible card border — content directly on panel background

FORM:
- Title: "Welcome back" — 28px weight 700 color #F1F5F9, Space Grotesk
- Subtitle: "Sign in to your account" — 14px weight 400 color #64748B, margin-bottom 32px

- Email input:
  - Label: "Email" 14px weight 500 color #94A3B8
  - Input: background rgba(17, 24, 39, 0.6), border 1px solid rgba(148, 163, 184, 0.2), border-radius 8px, padding 12px 16px
  - Icon left: Mail (Lucide, 18px, color #475569)

- Password input:
  - Label: "Password" with "Forgot?" link right-aligned, color #06B6D4, 13px
  - Input: same as email, type password
  - Icon left: Lock (Lucide, 18px, color #475569)
  - Toggle eye icon right: EyeOff/Eye (Lucide, 18px)

- Remember me: checkbox + label "Remember me" 14px color #94A3B8

- Submit button:
  - "Sign in" — full width, height 48px, border-radius 8px
  - Background: linear-gradient(135deg, #06B6D4, #0891B2)
  - Color white, 16px weight 600
  - Hover: brightness 1.1, shadow 0 8px 16px rgba(6, 182, 212, 0.2)

- Divider: "or continue with" — 13px color #475569, lines rgba(148, 163, 184, 0.1)

- Social buttons row (gap 12px):
  - Google, GitHub — height 44px, border 1px solid rgba(148, 163, 184, 0.2), border-radius 8px, bg transparent
  - Icon 20px + label 14px weight 500 color #F1F5F9
  - Hover: background rgba(148, 163, 184, 0.06)

- Footer: "Don't have an account? Sign up" — 14px, "Sign up" color #06B6D4

MOBILE (< 768px):
- Left panel: hidden
- Right panel: full width, background gradient #0A1628 → #111827
- Form: padding 24px, max-width none
- Social buttons: stacked vertically
```

### States
| State | Visual change |
|-------|--------------|
| Empty | All fields empty, submit enabled |
| Typing | Focus ring on active input |
| Validation error | Red border + "Invalid email" below field |
| Submitting | Button shows spinner, fields disabled |
| Auth error | Red banner above form: "Invalid credentials", shake animation 300ms |
| Success | Redirect to /dashboard |

### Accessibility
| Element | Requirement |
|---------|-------------|
| Form | `role="form"`, `aria-label="Sign in"` |
| Password toggle | `aria-label="Show password"` / `"Hide password"` |
| Error messages | `role="alert"`, `aria-live="assertive"` |
| Social buttons | `aria-label="Sign in with Google"` |
| Tab order | Email → Password → Remember → Sign in → Google → GitHub → Sign up |

---

## Example: Page /tasks — Data Table

### Metadata
- **Route**: `/tasks`
- **Auth**: Required
- **Layout**: Dashboard (sidebar + main)
- **Responsive**: Desktop-first

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A data management page with filters, sortable table, and bulk actions.

PAGE HEADER:
- Breadcrumb: "Dashboard / Tasks" — 12px color #64748B
- Title row: "Tasks" 24px weight 700 color #F1F5F9 + right: "Create Task" primary button (height 40px, bg gradient #06B6D4→#0891B2, border-radius 8px, icon Plus 16px)

FILTERS BAR:
- Background: rgba(17, 24, 39, 0.93), border 1px solid rgba(148, 163, 184, 0.06), border-radius 12px, padding 16px, margin-bottom 16px
- Row: gap 12px, flex-wrap
- Search: width 240px, icon Search left, placeholder "Search tasks..."
- Status dropdown: "All statuses" — bg transparent, border rgba(148, 163, 184, 0.2), width 160px
- Date range: icon Calendar, "Last 30 days" — same style
- Clear filters: ghost button "Clear" — 13px color #64748B, visible only when filters active

BULK ACTIONS BAR (visible when rows selected):
- Background: rgba(6, 182, 212, 0.08), border-radius 8px, padding 8px 16px
- Left: "3 selected" — 14px weight 500 color #06B6D4
- Right: "Delete" danger ghost + "Export" ghost + "Assign" ghost

TABLE:
- Container: border 1px solid rgba(148, 163, 184, 0.06), border-radius 12px, overflow hidden
- Header: background rgba(17, 24, 39, 0.6), font 12px weight 600 color #64748B uppercase letter-spacing 0.05em, padding 12px 16px
- Sortable columns: cursor pointer, hover color #94A3B8, active: icon ChevronUp/Down 12px
- Checkbox column: width 48px, centered
- Rows: padding 14px 16px, border-bottom 1px solid rgba(148, 163, 184, 0.04)
- Row hover: background rgba(6, 182, 212, 0.02)
- Row selected: background rgba(6, 182, 212, 0.06)

COLUMNS:
- [ ] checkbox | Title (14px, weight 500, color #F1F5F9, max-width 300px truncate) | Status badge | Assignee (avatar 24px + name 13px) | Due date (13px color #94A3B8) | Priority (dot 8px + label) | Actions (⋯ menu)

PAGINATION:
- Bottom bar: padding 12px 16px, border-top 1px solid rgba(148, 163, 184, 0.04)
- Left: "Showing 1-10 of 54" — 13px color #64748B
- Right: page buttons (32px square, border-radius 6px, current=bg accent muted)

ROW ACTIONS MENU (on ⋯ click):
- Dropdown: bg #1E293B, border rgba(148, 163, 184, 0.1), border-radius 8px, shadow-lg, padding 4px
- Items: 14px, padding 8px 12px, border-radius 4px, hover bg rgba(148, 163, 184, 0.06)
- Destructive: color #EF4444

MOBILE (< 768px):
- Table → card list layout
- Each card: border-radius 8px, padding 16px, margin-bottom 8px
- Title + status badge top, metadata below, actions bottom-right
```

### States
| State | Visual change |
|-------|--------------|
| Loading | Skeleton: filter bar + 6 skeleton rows |
| Empty (no filters) | Centered: clipboard icon + "No tasks yet" + "Create Task" CTA |
| Empty (filtered) | "No tasks match your filters" + "Clear filters" link |
| Bulk selected | Blue highlight bar appears above table |
| Deleting | Confirmation modal: "Delete 3 tasks? This cannot be undone." |

---

## Example: Page /settings — Settings

### Metadata
- **Route**: `/settings`
- **Auth**: Required
- **Layout**: Dashboard (sidebar + main), settings tabs
- **Responsive**: Desktop-first

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A settings page with tabbed navigation and form sections.

PAGE:
- Title: "Settings" — 24px weight 700 color #F1F5F9
- Subtitle: "Manage your account preferences" — 14px color #64748B

TABS:
- Horizontal tabs: border-bottom 1px solid rgba(148, 163, 184, 0.08)
- Tab items: padding 12px 16px, 14px weight 500, color #64748B
- Active tab: color #06B6D4, border-bottom 2px solid #06B6D4
- Hover: color #94A3B8
- Tabs: Profile | Notifications | Security | Billing

PROFILE SECTION:
- Avatar: 80px circle, border 2px solid rgba(148, 163, 184, 0.1), "Change" overlay on hover (bg rgba(0,0,0,0.5) + camera icon)
- Form: 2-column grid (gap 16px) on desktop, single column mobile
  - Full name (text input)
  - Email (text input, disabled bg, lock icon — "Contact support to change")
  - Phone (text input, country code dropdown left)
  - Timezone (select dropdown)
  - Bio (textarea, 3 rows, character counter "0/280")

NOTIFICATIONS SECTION:
- Card per category: background rgba(17, 24, 39, 0.93), border rgba(148, 163, 184, 0.06), border-radius 12px, padding 20px
- Each row: label left (14px weight 500 #F1F5F9 + description 13px #64748B below) + toggle switch right
- Toggle switch: width 44px, height 24px, border-radius 12px
  - Off: bg rgba(148, 163, 184, 0.2), circle white left
  - On: bg #06B6D4, circle white right
  - Transition: 200ms ease
- Categories: Email, Push, SMS — each with 3-4 toggles

SECURITY SECTION:
- Password change: current + new + confirm fields, "Update" button
- Two-factor: toggle + setup flow
- Sessions: table of active sessions (device, location, last active), "Revoke" danger ghost per row

SAVE BAR (sticky bottom when changes detected):
- Background: rgba(17, 24, 39, 0.95), border-top 1px solid rgba(148, 163, 184, 0.08), padding 12px 24px
- Left: "You have unsaved changes" — 14px color #EAB308, icon AlertTriangle
- Right: "Discard" ghost + "Save changes" primary button
- Animation: slide-up 200ms on appear

MOBILE (< 768px):
- Tabs: horizontal scroll, no wrap
- Form: single column
- Save bar: full width, buttons stacked if needed
```

### States
| State | Visual change |
|-------|--------------|
| Clean | Save bar hidden, no highlights |
| Modified | Save bar appears, changed fields have subtle left-border accent |
| Saving | Save button shows spinner, "Saving..." |
| Saved | Toast: "Settings saved" (green, top-right, auto-dismiss 3s) |
| Error | Toast: "Failed to save" (red, persistent) + retry |
| Toggle animating | 200ms slide + color transition |

---

## Example: Page /patients/:id — Healthcare Patient Dashboard

### Metadata
- **Route**: `/patients/:id`
- **Auth**: Required (role: clinician)
- **Layout**: Sidebar + main content
- **Responsive**: Desktop-first, sidebar collapses on tablet
- **Theme**: Healthcare (light mode)

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A clean clinical patient dashboard on a light healthcare interface.

LAYOUT:
- Sidebar: width 240px, background #FFFFFF, border-right 1px solid rgba(30, 27, 75, 0.06)
- Top bar: height 56px, background #FFFFFF, border-bottom 1px solid rgba(30, 27, 75, 0.06), padding 0 24px
- Main content: background #FAF5FF, padding 24px, overflow-y auto

SIDEBAR:
- Logo area: 56px height, padding 16px
- Nav items: padding 10px 16px, border-radius 8px, color #6B6899, font 14px weight 500
- Active item: background rgba(124, 58, 237, 0.08), color #7C3AED, left-border 3px solid #7C3AED
- Hover: background rgba(30, 27, 75, 0.04)
- Sections: separated by 1px divider rgba(30, 27, 75, 0.06)

TOP BAR:
- Left: breadcrumb "Patients / John Doe" — 13px, color #6B6899, separator "/"
- Right: notification bell + avatar circle 32px

PATIENT HEADER:
- Background: #FFFFFF, border 1px solid rgba(30, 27, 75, 0.06), border-radius 12px, padding 20px
- Left: avatar 64px circle, name 20px weight 700 color #1E1B4B (Outfit font), MRN "MRN-12345" 13px color #6B6899
- Right: status badge — "Active" bg rgba(34, 197, 94, 0.12) color #22C55E + "Last visit: Jan 15, 2026" 13px color #6B6899
- Below: tab navigation — Overview | Vitals | Medications | Notes | History

VITALS SECTION (grid 4 columns, gap 16px):
- Card: background #FFFFFF, border 1px solid rgba(30, 27, 75, 0.06), border-radius 12px, padding 16px
- Label: 12px weight 500 color #6B6899 uppercase letter-spacing 0.05em
- Value: 24px weight 700 color #1E1B4B (Outfit font)
- Unit: 14px weight 400 color #6B6899
- Status indicator: colored dot 8px + text label 12px
  - Normal: dot #22C55E + "Normal" color #388E3C
  - Attention: dot #F59E0B + "Attention" color #F57C00
  - Critical: dot #EF4444 + "Critical" color #D32F2F
- Trend arrow: ↑ or ↓ 12px, color matches status

MEDICATIONS TABLE:
- Container: border 1px solid rgba(30, 27, 75, 0.06), border-radius 12px, overflow hidden
- Header: background #F5F0FF, font 12px weight 600 color #6B6899 uppercase, padding 10px 16px
- Rows: padding 12px 16px, border-bottom 1px solid rgba(30, 27, 75, 0.04)
- Row hover: background rgba(124, 58, 237, 0.02)
- Cell text: 14px weight 400 color #1E1B4B
- Status badges: padding 4px 8px, border-radius 4px, font 12px weight 500
  - Active: bg rgba(34, 197, 94, 0.12) color #22C55E
  - Completed: bg rgba(30, 27, 75, 0.06) color #6B6899

MOBILE (< 768px):
- Sidebar hidden, hamburger menu top-left
- Vitals: 2 per row, gap 12px
- Table: horizontal scroll, min-width 500px
```

### Components (from design-system-base)
| Component | Variant | Size |
|-----------|---------|------|
| Nav | sidebar, breadcrumb | — |
| Card | default, flat | — |
| Table | sortable headers | — |
| Badge | status (with icon + text) | sm |
| Button | ghost | sm |

### States
| State | Visual change |
|-------|--------------|
| Loading | Skeleton: patient header + 4 vitals cards + 6 table rows |
| No medications | Centered: pill icon + "No active medications" + "Add medication" CTA |
| Critical vital | Vital card has red left-border 3px + pulsing dot animation (respects reduced-motion) |
| Tab switching | Content fade 200ms (no slide — minimal animation) |

### Accessibility
| Element | Requirement |
|---------|-------------|
| Vital status | `aria-label="Blood pressure: 120/80, Normal"` |
| Medication table | `<caption>` visually hidden, `aria-label` on table |
| Status badges | `aria-label` includes status text (not color-only) |
| Tab navigation | `role="tablist"`, `aria-selected` on active tab |
| Critical vital alert | `role="alert"`, `aria-live="assertive"` |

---

## Example: Page /contacts — Corporate CRM List

### Metadata
- **Route**: `/contacts`
- **Auth**: Required (role: sales)
- **Layout**: Sidebar (always visible) + main content
- **Responsive**: Desktop-first
- **Theme**: Corporate (light mode)

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A data-dense CRM contacts list on a clean corporate interface.

LAYOUT:
- Sidebar: width 240px (non-collapsible), background #FFFFFF, border-right 1px solid rgba(15, 23, 42, 0.06)
- Top bar: height 48px, background #FFFFFF, border-bottom 1px solid rgba(15, 23, 42, 0.06)
- Main content: background #F8FAFC, padding 20px

SIDEBAR:
- Nav items: padding 8px 16px, color #64748B, font 13px weight 500
- Active item: background rgba(30, 64, 175, 0.06), color #1E40AF, font weight 600
- Sections: CRM | Reports | Settings — separated by 1px divider

TOP BAR:
- Left: breadcrumb "CRM / Contacts" — 12px color #64748B
- Right: search input (width 280px) + "New Contact" primary button + avatar

PAGE HEADER:
- Title: "Contacts" — 20px weight 700 color #0F172A (Plus Jakarta Sans)
- Subtitle: "1,234 contacts" — 13px color #64748B
- Right: view toggle (table / cards) + export button

FILTERS BAR:
- Background: #FFFFFF, border 1px solid rgba(15, 23, 42, 0.06), border-radius 8px, padding 12px 16px
- Row: gap 8px
- Search: width 200px, placeholder "Search contacts..."
- Filter dropdowns: "All companies" (width 160px), "All statuses" (width 140px), "Last activity" (width 140px)
- Active filters: pills with × close, bg rgba(30, 64, 175, 0.06), color #1E40AF, border-radius 4px
- Clear: ghost link "Clear all" 12px color #64748B

TABLE:
- Container: border 1px solid rgba(15, 23, 42, 0.06), border-radius 8px, overflow hidden
- Header: background #F1F5F9, font 11px weight 600 color #64748B uppercase letter-spacing 0.05em, padding 8px 12px
- Rows: padding 10px 12px, border-bottom 1px solid rgba(15, 23, 42, 0.04)
- Row hover: background rgba(30, 64, 175, 0.02)
- Row selected: background rgba(30, 64, 175, 0.04), checkbox checked

COLUMNS:
- [ ] checkbox | Name (14px weight 500, color #0F172A) + Company below (12px color #64748B) | Email (13px color #64748B, hover color #1E40AF underline) | Phone (13px color #64748B) | Status badge | Last activity (13px color #64748B, relative "2d ago") | Owner (avatar 24px + name 12px) | ⋯ actions

BULK ACTIONS (visible when rows selected):
- Bar: background rgba(30, 64, 175, 0.04), border-radius 6px, padding 6px 12px
- "3 selected" 13px weight 500 color #1E40AF + "Assign" ghost + "Delete" danger ghost + "Export" ghost

PAGINATION:
- Bottom: padding 8px 12px, "Showing 1-50 of 1,234" 12px color #64748B + page buttons

MOBILE (< 768px):
- Table → card list, each card: name + company + status + last activity
- Filters: collapsible panel
```

### States
| State | Visual change |
|-------|--------------|
| Loading | Skeleton: filter bar + 10 skeleton rows |
| Empty (no filters) | "No contacts yet" + "Import contacts" CTA + "Create contact" CTA |
| Empty (filtered) | "No contacts match your filters" + "Clear filters" link |
| Bulk selected | Blue highlight bar above table |

### Accessibility
| Element | Requirement |
|---------|-------------|
| Checkbox | `aria-label="Select contact {name}"` |
| Email link | `<a href="mailto:...">` not `<div onClick>` |
| Status badge | `aria-label` includes text (not color-only) |
| Bulk actions | `aria-live="polite"` for selection count |
| Sort headers | `aria-sort="ascending"` / `"descending"` |

---

## Example: Page /services/:id/apply — GovTech Service Application

### Metadata
- **Route**: `/services/:id/apply`
- **Auth**: Public (optional account)
- **Layout**: Top nav + centered wizard
- **Responsive**: Mobile-first
- **Theme**: GovTech (light mode)

### Visual Prompt (copy to Stitch/v0/Bolt)

```
A government service application form with wizard steps on a light, accessible interface.

LAYOUT:
- Top nav: height 56px, background #FFFFFF, border-bottom 1px solid rgba(26, 26, 26, 0.06)
- Breadcrumb: "Home / Services / Business License / Apply" — 13px, color #616161, separator "/"
- Main content: centered, max-width 720px, background #FAFAFA, padding 24px

TOP NAV:
- Left: government seal icon 32px + "Department of Business Services" 15px weight 600 color #1A1A1A (Lexend font)
- Right: language selector "EN | ES" 13px color #616161 + "Help" link color #1E3A5F

WIZARD PROGRESS:
- Background: #FFFFFF, border 1px solid rgba(26, 26, 26, 0.06), border-radius 8px, padding 16px, margin-bottom 24px
- Steps: horizontal, gap 0
  - Completed: circle 28px bg #1E3A5F color #FFFFFF + label 13px weight 500 color #1E3A5F + checkmark icon
  - Current: circle 28px border 2px solid #1E3A5F color #1E3A5F + label 13px weight 600 color #1A1A1A
  - Upcoming: circle 28px border 2px solid rgba(26, 26, 26, 0.12) color #9E9E9E + label 13px color #9E9E9E
- Step labels: "Eligibility" | "Your Information" | "Business Details" | "Review & Submit"
- Connector lines: 1px solid rgba(26, 26, 26, 0.12) between circles, solid #1E3A5F for completed

FORM CARD:
- Background: #FFFFFF, border 1px solid rgba(26, 26, 26, 0.06), border-radius 8px, padding 24px

SECTION HEADERS:
- 16px weight 600 color #1A1A1A (Lexend font), margin-bottom 16px, padding-bottom 8px, border-bottom 1px solid rgba(26, 26, 26, 0.06)

FORM FIELDS (single column, gap 20px):
- Label: 14px weight 500 color #1A1A1A, margin-bottom 4px, ALWAYS visible (never placeholder-only)
- Input: background #F5F5F5, border 1px solid rgba(26, 26, 26, 0.12), border-radius 6px, padding 12px 14px, min-height 48px
- Focus: border-color #1E3A5F, box-shadow 0 0 0 2px rgba(30, 58, 95, 0.15)
- Error: border-color #C62828, error text 13px color #C62828 below field with AlertCircle icon 14px
- Required indicator: red asterisk * after label, 14px color #C62828
- Helper text: 13px color #616161 below field

FIELD TYPES:
- Text input: standard
- Select: dropdown with chevron icon, min-height 48px
- Textarea: 4 rows, resizable vertical
- Checkbox: 20px square, accent #1E3A5F, label 14px color #1A1A1A, hit target ≥48×48px
- Radio group: vertical stack, gap 12px, each option: radio 20px + label 14px, hit target ≥48×48px
- Date: date input with calendar icon, min-height 48px
- File upload: dashed border area, drag-and-drop, "Choose file" button

ACTION BAR (sticky bottom):
- Background: #FFFFFF, border-top 1px solid rgba(26, 26, 26, 0.06), padding 16px 24px
- Left: "← Previous" ghost button 14px color #616161
- Right: "Save draft" ghost button 14px color #616161 + "Next →" primary button height 44px bg #1E3A5F color #FFFFFF border-radius 6px
- Primary hover: background #162D4A

MOBILE (< 768px):
- Wizard progress: vertical stepper (left sidebar)
- Form: full-width, padding 16px
- Action bar: full-width, buttons stacked
```

### States
| State | Visual change |
|-------|--------------|
| Step 1 loading | Pre-fill from session if returning user |
| Validation error | Red border on field + error text + focus first error + "Please fix 2 errors" banner top |
| Saving draft | "Next" button shows "Saving..." + spinner, fields remain enabled |
| Step complete | Auto-advance to next step with 200ms fade (no animation if reduced-motion) |
| Final review | All data read-only summary + "Edit" link per section + "Submit application" primary CTA |
| Submitted | Confirmation page: green checkmark + reference number + "Print confirmation" button |

### Accessibility
| Element | Requirement |
|---------|-------------|
| All inputs | Visible `<label>` with `for` attribute, `aria-describedby` for helper/error |
| Wizard steps | `role="tablist"`, steps `role="tab"`, content `role="tabpanel"` |
| Required fields | `aria-required="true"`, asterisk in label |
| Error summary | `role="alert"`, `aria-live="assertive"` at top of form |
| File upload | `aria-label="Upload document"`, drop zone `role="button"` |
| Action buttons | Previous: `aria-label="Go to previous step"`, Next: `aria-label="Continue to next step"` |
| Touch targets | ALL interactive elements ≥48×48px (WCAG AAA) |
| Min font size | 16px body text (accessibility mandate) |

---

## Rules for generating UI prompts

1. ALWAYS embed exact hex colors from the active theme (NEVER "use primary")
2. ALWAYS specify font family, size in px/rem, and weight as numbers
3. ALWAYS specify spacing in px (and note the token name in parentheses)
4. ALWAYS specify border-radius, shadows, transitions with exact CSS values
5. ALWAYS include mobile breakpoint adjustments
6. ALWAYS list ALL states with visual description
7. ALWAYS list interactions as trigger → action pairs
8. ALWAYS include accessibility table
9. ALWAYS list components with variant and size from design-system-base
10. The Visual Prompt section must be SELF-CONTAINED — pasteable to Stitch/v0 without any other file
11. Skip UI prompts section entirely for backend-only projects (no frontend stack)
12. For dashboard/admin pages: include data table layout, filters, pagination
13. For forms: include validation rules per field, error messages, success flow
14. ALWAYS respect `prefers-reduced-motion` — note which animations to disable
15. ALWAYS define the App Shell (system layout) FIRST in prompts.md — before any page prompts
16. If a component (sidebar, navbar, data table, modal, toast) appears in 2+ pages → define it once in Shared Components, reference by name in page prompts
17. Page prompts include `Uses: AppShell, DataTable, FilterBar` to reference shared components instead of re-specifying
18. ALWAYS read the active theme's `## Design Directives` before generating — every prompt MUST comply with the theme's Layout, Visual, and NEVER rules
19. ALWAYS check `design-anti-patterns.md` before generating — avoid generic AI aesthetics, visual anti-patterns, and UX anti-patterns
20. NEVER generate a UI prompt that looks like the Fintech examples unless the active theme IS fintech — each theme produces visually distinct interfaces
21. ALWAYS vary layout patterns across pages in the same app — dashboard, form, list, detail, and settings MUST use different layout structures
22. After generating ALL page prompts, compare them — if 2+ pages have identical layout structure → differentiate before saving
