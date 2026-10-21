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

## ProvincialMapCard
- Path: app/frontend/src/presentation/components/public/ProvincialMapCard.tsx
- Use when: showing provincial spending distribution on the civic portal
- Replaces: -

## Badge
- Path: app/frontend/src/presentation/components/ui/Badge.tsx
- Use when: any status/label chip (primary, success, error) instead of hand-building `badge` classes
- Replaces: `badge-`

## Button
- Path: app/frontend/src/presentation/components/ui/Button.tsx
- Use when: any action button; wraps HeroUI with the project `btn-{variant}` / `btn-{size}` classes
- Replaces: -

## FullscreenOverlay
- Path: app/frontend/src/presentation/components/ui/FullscreenOverlay.tsx
- Use when: expanding a chart/visualization to fullscreen with backdrop and close handling
- Replaces: -

## GlassCard
- Path: app/frontend/src/presentation/components/ui/GlassCard.tsx
- Use when: elevated/glass surfaces on public or marketing screens instead of hand-building `glass-card`
- Replaces: `glass-card`

## InsetPanel
- Path: app/frontend/src/presentation/components/ui/InsetPanel.tsx
- Use when: inset content panel inside a console page (profile blocks, settings groups) instead of `div.inset-panel`
- Replaces: `inset-panel`

---

## Missing composites (known duplication — do not re-implement; plan the extraction)

These are NOT components yet. Until they exist, a new screen must ask before writing another copy.

| Need | Current duplication | Proposal |
|------|--------------------|----------|
| Table of records (header, empty state, pagination) | `<table` hand-written in 9 pages (`SyncOperationsPage`, `AuditLogPage`, `SupportCenterPage`, `UsersManagementPage`, `DetectionConfigPage`, `AuditResolutionsPage`, `InstitutionalProcessesPage`, `RolesMatrixPage`, `ComplianceReportsPage`) | `ui/DataTable` + `ui/Pagination` |
| Modal / side drawer shell | `fixed inset-0` hand-written in 6 places (`SyncOperationsPage`, `CalibrationConsolePage`, `AuditLogPage`, `SupportCenterPage`, `AnomalyDrawer`, `ConsoleInspectorDrawers`) | `ui/Modal` + `ui/Drawer` (focus trap, ESC, scroll lock) |
| Filter bar (inputs + selects + clear) | repeated grid of labelled inputs in `AuditLogPage`, `SupportCenterPage`, `AuditResolutionsPage`, `MyBidsPipelinePage` | `ui/FilterBar` |
| KPI card | repeated `border-l-4` card in `SyncOperationsPage`, `CalibrationConsolePage`, `SubscriptionBillingPage`, `DetectionConfigPage` | `ui/KpiCard` |
| Status chip with icon + text | repeated `px-2.5 py-1 rounded-lg border` spans (WCAG 1.4.1 requires color+icon+text) | `ui/StatusChip` |
| Buttons bypassing `ui/Button` | `btn btn-primary btn-lg btn-full-width` hand-written 8× in `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `InvitationGatewayPage` (needs `isDisabled` migration) | reuse `ui/Button` |
