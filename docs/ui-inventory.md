# UI inventory

Shared components of this project. Read it BEFORE building any screen; reuse what is here and add an entry
when you create a component that other screens will use. `validate-ui.py` fails when a `Replaces` pattern
appears outside `Path` and `Allowed`.

Entry format (one `## Name` per component):
- Path: file or folder that owns the component
- Use when: one line on when to use it
- Replaces: `literal text` (or `re:regex`) that must NOT be written by hand elsewhere
- Allowed: optional extra globs where that text is fine

> `Replaces: -` means *no enforceable literal*: the component is a single-use page section (landing/portal)
> composed only inside its own page, so there is nothing to forbid. It still must be reused if another screen
> needs that section.

## AnomalyCard
- Path: app/frontend/src/presentation/components/AnomalyCard.tsx
- Use when: rendering a single anomaly finding in the B2G review queue (severity, type, process, quick actions)
- Replaces: -

## AnomalyDrawer
- Path: app/frontend/src/presentation/components/AnomalyDrawer.tsx
- Use when: opening the full detail of an anomaly with evidence tabs, signals and the CONFIRMED/DISMISSED form
- Replaces: -

## AnomalyFilters
- Path: app/frontend/src/presentation/components/AnomalyFilters.tsx
- Use when: filtering the anomaly inbox by type, status, severity range, institution and date window
- Replaces: -

## CTABanner
- Path: app/frontend/src/presentation/components/CTABanner.tsx
- Use when: closing a public landing page section with a conversion call to action
- Replaces: -

## CollusionNetwork
- Path: app/frontend/src/presentation/components/CollusionNetwork.tsx
- Use when: rendering the supplier collusion graph (D3 force layout) from `GET /api/auditor/collusion-network`
- Replaces: -
- Rule: el ancho del SVG sale de `useElementWidth` (`presentation/hooks/useElementWidth.ts`). NO medir con `clientWidth` una sola vez: si el contenedor mide 0 al montar, el gráfico se dibuja dentro de un SVG de 0 px y queda invisible para siempre (el efecto no vuelve a correr).

## ConsoleInspectorDrawers
- Path: app/frontend/src/presentation/components/ConsoleInspectorDrawers.tsx
- Use when: opening a process (`ProcessInspectorDrawer`) or supplier (`SupplierInspectorDrawer`) side panel without leaving the console
- Replaces: -

## FAQSection
- Path: app/frontend/src/presentation/components/FAQSection.tsx
- Use when: adding the public FAQ accordion to a landing or informational page
- Replaces: -

## Footer
- Path: app/frontend/src/presentation/components/Footer.tsx
- Use when: public pages that need the institutional footer with legal links
- Replaces: -

## FragmentationBarChart
- Path: app/frontend/src/presentation/components/FragmentationBarChart.tsx
- Use when: showing contract fragmentation over time against the DGCP modality threshold
- Replaces: -
- Rule: el ancho del SVG sale de `useElementWidth` (`presentation/hooks/useElementWidth.ts`). NO medir con `clientWidth` una sola vez: si el contenedor mide 0 al montar, el ancho interno queda negativo y el gráfico no se ve.

## HeroSection
- Path: app/frontend/src/presentation/components/HeroSection.tsx
- Use when: opening the public landing page with the value proposition and primary CTA
- Replaces: -

## InstitutionTimeline
- Path: app/frontend/src/presentation/components/InstitutionTimeline.tsx
- Use when: showing the chronological award/spend timeline of an institution
- Replaces: -

## LanguageSwitcher
- Path: app/frontend/src/presentation/components/LanguageSwitcher.tsx
- Use when: any public header that must switch ES/EN (i18next)
- Replaces: -

## Logo
- Path: app/frontend/src/presentation/components/Logo.tsx
- Use when: rendering the brand lockup (light/dark variants) in headers, auth shells and footers
- Replaces: -

## Navbar
- Path: app/frontend/src/presentation/components/Navbar.tsx
- Use when: top navigation of the public/civic portal
- Replaces: -

## PortalsSection
- Path: app/frontend/src/presentation/components/PortalsSection.tsx
- Use when: presenting the three product portals (Civic, B2G, B2B) on the landing page
- Replaces: -

## PriceCheckerSection
- Path: app/frontend/src/presentation/components/PriceCheckerSection.tsx
- Use when: marketing section that previews the public price checker
- Replaces: -

## PriceScatter
- Path: app/frontend/src/presentation/components/PriceScatter.tsx
- Use when: plotting unit prices against the UNSPSC median to expose overpricing
- Replaces: -
- Rule: el ancho del SVG sale de `useElementWidth` (`presentation/hooks/useElementWidth.ts`). NO medir con `clientWidth` una sola vez ni usar `clientWidth || 480`: el fallback dibuja el gráfico a 480 unidades dentro de un SVG de 0 px, o sea invisible.

## PricingSection
- Path: app/frontend/src/presentation/components/PricingSection.tsx
- Use when: showing the commercial plan catalog on the landing page
- Replaces: -

## SectionContainer
- Path: app/frontend/src/presentation/components/SectionContainer.tsx
- Use when: wrapping a landing/portal section to get the standard max-width, padding and vertical rhythm
- Replaces: -

## SectionErrorBoundary
- Path: app/frontend/src/presentation/components/SectionErrorBoundary.tsx
- Use when: isolating a heavy or chart section so a render error does not blank the whole page
- Replaces: -

## SeverityGauge
- Path: app/frontend/src/presentation/components/SeverityGauge.tsx
- Use when: showing an anomaly severity score with confidence and number of contributing signals
- Replaces: -

## SocialProofSection
- Path: app/frontend/src/presentation/components/SocialProofSection.tsx
- Use when: adding trust indicators/metrics to the public landing page
- Replaces: -

## StatsSection
- Path: app/frontend/src/presentation/components/StatsSection.tsx
- Use when: showing aggregate platform metrics (contracts, institutions, savings detected) on the landing page
- Replaces: -

## ThemeToggler
- Path: app/frontend/src/presentation/components/ThemeToggler.tsx
- Use when: any header that must switch light/dark mode
- Replaces: -

## AuthShell
- Path: app/frontend/src/presentation/components/auth/AuthShell.tsx
- Use when: any authentication screen (login, register, invitation, password recovery) that needs the shared split layout
- Replaces: -

## RequireAuth
- Path: app/frontend/src/presentation/components/auth/RequireAuth.tsx
- Use when: guarding a route by `permission`, `allowedRoles` or `allowedTenantTypes`; renders the "Acceso Restringido" state
- Replaces: -

## BudgetSankeyCard
- Path: app/frontend/src/presentation/components/public/BudgetSankeyCard.tsx
- Use when: showing public budget flow (institution → supplier) as a Sankey
- Replaces: -

## LivePriceCheckerWidget
- Path: app/frontend/src/presentation/components/public/LivePriceCheckerWidget.tsx
- Use when: citizen-facing live price comparison for a list of items
- Replaces: -

## ProvincialSpendCard
- Path: app/frontend/src/presentation/components/public/ProvincialSpendCard.tsx
- Use when: showing real awarded spending per supplier province (ranked bars, all provinces, with coverage note)
- Replaces: -

## Badge
- Path: app/frontend/src/presentation/components/ui/Badge.tsx
- Use when: any status/label chip (primary, success, error) instead of hand-building `badge` classes
- Replaces: `badge-`

## Button
- Path: app/frontend/src/presentation/components/ui/Button.tsx
- Use when: any action button; wraps HeroUI with the project `btn-{variant}` / `btn-{size}` classes
- Replaces: `btn-full-width`
- Allowed: `app/frontend/src/presentation/pages/ForgotPasswordPage.tsx`
- Allowed: `app/frontend/src/presentation/pages/ResetPasswordPage.tsx`

## FullscreenOverlay
- Path: app/frontend/src/presentation/components/ui/FullscreenOverlay.tsx
- Use when: expanding a chart/visualization to fullscreen with backdrop and close handling
- Replaces: -

## Sidebar navigation
- Path: app/frontend/src/presentation/components/nav/
- Use when: adding, moving or hiding an entry of the console sidebar. The groups live in `navModel.ts` (`buildNavGroups`); `NavItem.tsx` renders a plain entry, `NavSection.tsx` the group header and `NavAccordion.tsx` an entry with `?seccion=` sub-views
- Replaces: -
- Rule: an entry is never written as raw `<NavLink>` inside `DashboardLayout`; it is data in `navModel.ts`. Gates (`isB2GOrPlatform`, `canCommercial`, `canAnalytics`, `isPlatformAdmin`) are decided there, not in JSX
- Rule: the breadcrumb comes from `buildPageTitles(navData)`, so an item and its breadcrumb cannot disagree. Routes without a sidebar entry (perfil, competidor) go in `EXTRA_PAGE_TITLES`
- Order: panorama (sin encabezado) → veeduría → mercado → comercial → cumplimiento → operación → configuración → gestión. Cada grupo se empuja ya filtrado, así que nunca queda un encabezado vacío

## GlassCard
- Path: app/frontend/src/presentation/components/ui/GlassCard.tsx
- Use when: elevated/glass surfaces on public or marketing screens instead of hand-building `glass-card`
- Replaces: `glass-card`

## InsetPanel
- Path: app/frontend/src/presentation/components/ui/InsetPanel.tsx
- Use when: inset content panel inside a console page (profile blocks, settings groups) instead of `div.inset-panel`
- Replaces: `inset-panel`

## StatusChip
- Path: app/frontend/src/presentation/components/ui/StatusChip.tsx
- Use when: any status/label chip that must convey state with color + icon + text (health, sync runs, ticket states)
- Replaces: -

## KpiCard
- Path: app/frontend/src/presentation/components/ui/KpiCard.tsx
- Use when: KPI/metric card at the top of a console page (label, value, hint, optional icon and accent)
- Replaces: -

## Modal
- Path: app/frontend/src/presentation/components/ui/Modal.tsx
- Use when: any dialog with title, body and optional footer actions; handles ESC, backdrop close, scroll lock, `role="dialog"` and `aria-modal`
- Replaces: `fixed inset-0`
- Allowed: `app/frontend/src/presentation/components/ui/Drawer.tsx`
- Allowed: `app/frontend/src/presentation/components/ui/FullscreenOverlay.tsx`
- Rule: el ancho va por la prop `size` (28/32/42rem). NO pasar `max-w-md|lg|xl` ni `max-w-xs|sm`: el `@theme` define `--spacing-{xs,sm,md,lg,xl}` y Tailwind resuelve esas claves contra ese namespace, así que `max-w-lg` vale 40px en vez de 32rem (el modal salía de 40px). Usar valor arbitrario `max-w-[32rem]` o la escala numérica `max-w-2xl`+

## Drawer
- Path: app/frontend/src/presentation/components/ui/Drawer.tsx
- Use when: right-side detail panel (record detail, ticket, audit entry) with sticky header and ESC/backdrop close
- Replaces: -
- Rule: el ancho va por `maxWidth` y el default es `max-w-[36rem]`. NO pasar `max-w-md|lg|xl` ni `max-w-xs|sm` (colisionan con `--spacing-*` y valen 24/40/64px — los drawers por defecto salían de 64px). Para un ancho propio usar `sm:w-[520px] lg:w-[580px]` o `max-w-[Nrem]`

## DataTable
- Path: app/frontend/src/presentation/components/ui/DataTable.tsx
- Use when: any table of records with columns, loading skeleton and empty state; pass `columns`, `rows`, `rowKey` and `emptyMessage`
- Replaces: `<table`
- Allowed: `app/frontend/src/presentation/pages/AuditLogPage.tsx`
- Allowed: `app/frontend/src/presentation/pages/RolesMatrixPage.tsx`

---

## Adoption debt (available but not yet enforced)

These components exist and must be used by **new** screens. `Replaces` is still `-` because turning it on
today would fail on legacy pages; the counts below are the migration target for the polish phase.

| Component | Hand-written copies remaining |
|-----------|------------------------------|
| `KpiCard` | adoptado en 11 páginas (~47 tarjetas). Fuera del componente, con motivo: la ficha de identidad del proveedor en `CompetitorProfilePage` (razón social, no métrica), el panel de alerta de `CollusionNetworkPage` y los selectores de rubro/plan de `SectorsExplorerPage` y `SubscriptionBillingPage` (son controles, no KPIs). |
| `StatusChip` | adoptado en `AuditResolutionsPage`, `InstitutionalProcessesPage`, `B2GIntegrationsPage`, `UsersManagementPage`, `OverviewDashboardPage`, `SyncOperationsPage`, `SupportCenterPage`, `DetectionConfigPage`. Lo que queda no son estados: badges de métrica (`%` de afinidad, severidad), celdas `Check`/`Minus` de `RolesMatrixPage` y banners de alerta a nivel de bloque. |
| `Modal` / `Drawer` | cerrado: los 6 overlays legacy usan `Modal`/`Drawer`. `FullscreenOverlay` es un componente distinto (gráfico a pantalla completa) y se conserva. |
| `DataTable` | 19 tablas migradas. Quedan 2 excepciones declaradas: `AuditLogPage` (tabla de diff antes/después dentro del drawer de detalle, formato clave-valor) y `RolesMatrixPage` (una columna por rol, generadas dinámicamente). |
| `Button` | 7 botones de auth migrados. Quedan 2 `<Link>` (`ForgotPasswordPage`, `ResetPasswordPage`) que conservan las clases `btn-*` porque `ui/Button` no acepta `as`; se resuelven si algún día hace falta un `ButtonLink`. |

## Missing composites (known duplication — do not re-implement; plan the extraction)

These are NOT components yet. Until they exist, a new screen must ask before writing another copy.

| Need | Current duplication | Proposal |
|------|--------------------|----------|
| Filter bar (inputs + selects + clear) | cada página arma su propio grid con `label` + control (`AuditLogPage`, `SupportCenterPage`, `AuditResolutionsPage`, `MyBidsPipelinePage`, `OpportunitiesRadarPage`). El patrón label+control solo se repite igual en `AuditLogPage`; el resto usa selects inline o barras de una fila, por eso `ui/FilterBar` quedó descartado. | Reevaluar `ui/FilterField` (label + control) solo si aparece una tercera página con el mismo layout exacto |
