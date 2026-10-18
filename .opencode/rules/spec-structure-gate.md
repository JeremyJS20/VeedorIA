# SPEC STRUCTURE GATE — Violation = BLOCK

## BEFORE creating ANY file under `specs/`

Run this checklist IN ORDER. If ANY check fails → **STOP → fix first**. Do NOT create the file until all checks pass.

1. ☐ **Epic WI in project DESTINO?** The work Epic lives in `AZURE_DEVOPS_PROJECT` (from `.sdd-config.json`), NOT in SDD-Intakes.
   - type=new → CREATE new Epic in proyecto destino FIRST
   - type=change/migration → use EXISTING Epic in proyecto destino
   - ❌ Never use the SDD-Intakes Epic as the work Epic
2. ☐ **Feature WI(s) under the Epic?** Decompose the intake into Features. No Feature WI = no requirements.
   - If none → CREATE Feature WI(s) FIRST (parent link to Epic via `wit_work_items_link`)
3. ☐ **Feature spec folder(s) NESTED inside Epic folder?**
   - Pattern: `specs/{epic_prefix}{epic_ID}-{epic_name}/{feat_prefix}{feat_ID}-{feat_name}/`
   - If folder missing → CREATE it FIRST
4. ☐ **Correct destination for THIS file?**
   - `intake.md` → Epic folder root ✅
   - `requirements.md`, `design.md`, `tasks.md`, `test-plan.md`, `test-cases.md`, `migration-plan.md` → Feature subfolder ✅
   - ❌ BLOCKED: `requirements.md` directly in `specs/{epic}/`

## Directory template (MANDATORY)

```
specs/
└── {epic_prefix}{epic_ID}-{epic_name}/     ← Epic (from AZURE_DEVOPS_PROJECT, NOT SDD-Intakes)
    ├── intake.md                            ← Epic intake ONLY
    ├── {feat_prefix}{feat_ID}-{feat_name}/  ← Feature 1 (NESTED — never sibling)
    │   ├── requirements.md
    │   ├── design.md
    │   ├── tasks.md
    │   ├── test-plan.md
    │   └── test-cases.md
    └── {feat_prefix}{feat_ID}-{feat_name}/  ← Feature 2 (NESTED)
        └── ...
```

Feature without own intake reads Epic intake via `../intake.md`.

## VIOLATIONS (auto-block)

| # | Violation | Fix |
|---|---|---|
| 1 | `requirements.md` (or design/tasks/test-*) directly in Epic folder | Move to Feature subfolder |
| 2 | Feature folder as sibling of Epic (`specs/{feat}/` at same level) | Move INSIDE Epic folder |
| 3 | No Feature WI before creating requirements | Create Feature WI(s) first |
| 4 | Using SDD-Intakes Epic as the work Epic | Create Epic in project destino |
| 5 | No Feature spec folder before spec files | Create Feature folder first |
| 6 | Empty/stub spec file (< 10 lines, no `##` headings) | Fill with real content |
| 7 | Non-canonical `.md` in a spec folder (e.g. `backend-relevamiento.md`, `analisis.md`) | BLOCK. Allowed ONLY: `intake.md`, `requirements.md`, `design.md`, `tasks.md`, `test-plan.md`, `test-cases.md`, `migration-plan.md` (+ `baselines/`, `mockups/`). Relevamiento/análisis → a section INSIDE requirements.md/design.md; aux docs → `docs/` |
| 8 | Creating/editing a spec file not owned by the current role (e.g. developer writing `requirements.md`) | BLOCK. requirements/intake/product → analyst · design/tasks → developer · test-plan/test-cases → qa. Add role (`sdd-sync.sh --role {user},{owner}`) or hand to the owner. A missing skill ≠ permission to write it by hand |

## ORDER OF OPERATIONS after intake.md approved

1. Create Epic in `AZURE_DEVOPS_PROJECT` (type=new) or confirm existing (type=change/migration)
2. Link Epics: destino ← relates to → SDD-Intakes
3. Create Feature WIs under Epic (decompose from intake, parent link)
4. Create Feature spec folders NESTED inside Epic folder
5. Tag SDD-Intakes Epic: `intake-routed`
6. Continue SDD lifecycle inside the Feature folder
