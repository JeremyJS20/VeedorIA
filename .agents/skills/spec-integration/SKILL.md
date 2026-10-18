---
name: IDE × SDD Integration
description: Guide IDE spec/plan modes to use SDD Standard powers, paths, and workflow
---

# IDE × SDD Integration

When the IDE has a native spec or plan mode (requirements → design → tasks), use SDD Standard workflow instead of IDE defaults.

## Spec/Plan mode integration

When the IDE activates a structured mode (spec mode, plan mode, etc.):

### Paths — use SDD structure, not IDE defaults
- Save specs to `specs/{prefix}[ID]-{name}/` (project root), NOT the IDE's internal spec directory
- `{prefix}` and work item ID come from `.sdd-config.json` → `spec_prefix` and Azure DevOps
- Example: `specs/AB#456-kanban-board/requirements.md`
- If no work item exists yet → use `specs/{feature-name}/`
- **Epic-level spec folder**: `specs/{prefix}{ID}-{name}/intake.md` — contains project-level levelling. Feature spec folders are nested inside: `specs/{prefix}{ID}-{name}/{feature_prefix}{feature_ID}-{feature_name}/`
- **Example (Epic → Features nested):**
  ```
  specs/
  └── AB#1000-gestion-tareas/              ← Epic
      ├── intake.md                         ← Epic intake
      ├── AB#1001-tasks/                    ← Feature 1 (nested)
      │   ├── requirements.md
      │   ├── design.md
      │   └── tasks.md
      └── AB#1002-notifications/            ← Feature 2 (nested)
          ├── requirements.md
          ├── design.md
          └── tasks.md
  ```
  ❌ INCORRECT: Features as siblings of Epic (e.g. `specs/AB#1001-tasks/` at same level as `specs/AB#1000-gestion-tareas/`)
- **Feature-level intake** (conditional): `specs/{epic_prefix}{epic_ID}-{epic_name}/{prefix}{ID}-{name}/intake.md` — only if module-specific business input not covered by Epic intake. Must reference Parent Intake: `../intake.md`
- **Feature without own intake**: reads Epic intake via relative path `../intake.md`
- **Intake import from SDD-Intakes**: When Analyst requests "traer intake de {proyecto}", read intake.md attachment from Epic in SDD-Intakes ADO project → save to `specs/{slug}/intake.md` in repo destino
- **Intake sources**: (1) Copilot Agent → SDD-Intakes Epic attachment → Analyst rutea → repo destino, (2) Analyst creates directly in IDE → repo destino. Both produce the same result: `specs/{slug}/intake.md` exists before requirements.

### Workflow — follow SDD powers
- For requirements: use the `requirements-analyst` power workflow (EARS notation, 7 sources, scope analysis)
- For design: use the `solution-designer` power workflow (stack selection from tech.md, component drill-down)
- For tasks: use the `solution-designer` power output format (dependency chains, estimations, REQ references)
- Do NOT use the IDE's default templates — use the SDD power's format

### Specs for existing code (reverse and hybrid)
Same gates, same folders and one file at a time as a new feature; only the source of the content changes. Never write code before the three files are approved.
- **Reverse (as-built)**: code exists without specs. Mine it first with codebase-memory (`search_graph`, `get_code_snippet`, `trace_path`) and git history. `requirements.md` and `design.md` describe what the code does today (header: `> 📋 As-Built — reverse-engineered from code and git history [commit]`), in EARS, with real tables, endpoints and payloads. `tasks.md` holds the gaps: missing unit/E2E tests, validations, debt. Ask the user "this is what the code does today, is it right?" before approving.
- **Hybrid (extension)**: a new sub-feature on an existing module. List the existing tables, endpoints and states it depends on under Dependencies/Assumptions, then write the forward spec only for the new part.
- **Git archaeology** (code says WHAT, git says WHY): `git log --oneline -25 -- <files>` for evolution, `git log -S "<keyword>"` for when a rule appeared, `git blame -L` on formulas, rates and magic numbers to find their legal or business origin.
- **Bug != Feature**: commits or branches `fix/AB#...` are bugs. Never put a bug ID in a spec's `Work Item:` header (only Epic, Feature or User Story/PBI; if none exists write `Pendiente (sin PBI/Feature en ADO)`). Historical bugs go in an optional context section of the spec.

### Do NOT create
- IDE-specific spec config files (e.g., `.config.kiro`, `.plan.json`)
- Files inside IDE-managed spec directories (e.g., `.agents/specs/`, `.cursor/specs/`)
- IDE default requirement/design templates

### DO use
- `precheck.md` on first interaction
- `workflow-router.md` for routing to the correct power
- Azure DevOps MCP for work item tracking
- Server-memory MCP for session persistence
- All SDD hooks for quality gates

## Free chat / vibe mode integration

When in free chat (no structured mode):
- Still follow `precheck.md` on first message
- Still route through `workflow-router.md`
- Powers activate by keyword
- Good for: quick fixes, investigations, explanations, single-task work

## What IDE structured modes add (keep these benefits)
- Phase gates (requirements approved → design → tasks)
- Living spec documents that update as implementation progresses
- Visual progress tracking in the IDE

## What SDD adds on top
- Azure DevOps integration (work items, assignments, state transitions)
- Role enforcement (analyst, developer, qa)
- 20 specialized powers with lifecycle gates
- Cross-role handoff with ADO tags
- Server-memory for persistence across sessions
- MCP health checks and credential management
