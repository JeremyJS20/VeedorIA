---
name: "Workflow Router"
description: "routes user requests to the correct power/role, output format, communication style"
---

> ⛔ **FIRST MESSAGE OF THE CONVERSATION — do this before anything else:** execute `precheck.md` IN ORDER (memory → git → MCP health → readiness → router), EVEN IF the message is just a greeting ("Hola", "buenas"). A greeting is NOT an exception and does NOT mean "skip to showing context". Reading only `.sdd-config.json` + git and replying with capabilities = a precheck violation. Run the full precheck first, THEN show context and STOP.

## ⛔ THE 7 RULES (violating any = failure)

1. **MCP FIRST** — Before any power: execute Step 0 (required MCPs). No verified MCP = do NOT proceed.
2. **⛔ TEMPLATE FIRST** — Before generating ANY file: READ the template in `specs/_templates/` FIRST. List its ## section headers to prove you read it. Do NOT invent sections, fields, or structures. Do NOT copy from existing files as substitute for reading the template.
3. **LANGUAGE** — All generated content in `docs_language` from .sdd-config.json (default: `es`). Technical terms in English OK.
4. **ADO SCOPED** — Every ADO operation includes `[System.TeamProject] = '{project}'`. Items from other projects = discard.
5. **ONE AND APPROVE** — Generate one file → show it → wait for explicit approval ("dale", "apruebo", "ok") → advance.
6. **EXISTS = HAS CONTENT** — product.md < 50 lines = placeholder = does not exist → trigger scanner. Spec < 10 lines or no `##` headings = does not exist.
7. **EXPLICIT ACTION** — Greeting, item selection, or "vamos" ≠ "proceed with a power". Only execute a power with clear instruction. ⛔ **BUT a greeting does NOT exempt the precheck** — on the FIRST interaction you ALWAYS run `precheck.md` IN ORDER FIRST (memory, git, MCP health, readiness), THEN show context + "¿En qué trabajamos?" and **STOP**. "Hola" = run precheck first, then stop — NOT "read config + git and reply". Rule 7 governs power execution AFTER the precheck, never instead of it.

## ⚠️ MANDATORY — execute before EVERY user request

1. ☐ **Read config** → `.sdd-config.json`: role, verbosity, project_type
1a. ☐ **Memory-first** (HARD GATE — applies to EVERY action, not just precheck)
    - server-memory is the **source of truth for project STATE** (what was done, current phase, next steps), not merely a token-saving cache. Before proposing any next step or lifecycle position, consult the state entities from `precheck.md` Step 1. NEVER re-propose as pending anything memory marks completed — reconcile out loud per `precheck.md` Step 1c if git/FS seems to differ.
    - server-memory: check for cached Decisions/Conventions BEFORE any technical decision. Not just at precheck — EVERY request.
    - codebase-memory: use `search_code`/`search_graph`/`get_architecture` BEFORE `Read`/`grep` on source files. If the info exists in the graph, NEVER `Read` the file directly.
    - Only `Read` files for: inline implementation details, specific line-level logic, or information not yet indexed.
    - NEVER use file-based memory (`~/.claude/.../memory/`, `.claude/memory/`) when server-memory MCP is available. Corrections, decisions, and conventions go to server-memory (`create_entities`), NOT local files.
2. ☐ **First interaction?** → Read and execute `precheck.md` IN ORDER. Do NOT skip.
   ⛔ Step 1 (server-memory read_graph) is MANDATORY — skipping it causes WRONG lifecycle position.
3. ☐ **Load steering triggers** → Read files from §1 that apply to this request
4. ☐ **Show context** → §2 format (skip if already shown this session)
5. ☐ **Actionable?** → User stated a clear action? If NO → **STOP: show context + "¿En qué trabajamos?"**. NEVER infer action from branch/files alone
6. ☐ **Match intent** → Find power in routing table (§4). If no match → ask user
7. ☐ **Verify lifecycle** → Check prerequisites (§5). Missing → **BLOCK** with reason
8. ☐ **Load pre-tasks** → Check §3 (work-item-setup, role-enforcement, etc.)
8b. ☐ **⛔ SPEC-WRITE GATE** (ACTIVE — before creating OR editing ANY file under `specs/`): verify BOTH, in order. This is a hard block, not a passive reminder — it runs even if the matched power's own skill is NOT synced for this role.
    - **Ownership vs role** → map the target file to its owner (requirements.md→analyst, design.md/tasks.md→developer, test-plan.md/test-cases.md→qa, intake.md/product.md→analyst; see `role-enforcement.md` §Artifact ownership). If the owner role is NOT in the user's `role` → **BLOCK**: "{file} es de rol {owner}. No podés crearlo/editarlo con rol {user}. Añadí el rol: `bash sdd-sync.sh --role {user},{owner}` o pedí al {owner}." ⚠️ A missing skill (e.g. developer lacks `requirements-analyst`) does NOT mean 'create it by hand' — it means BLOCK.
    - **Allowlist of artifacts** → a `specs/{prefix}{ID}-{name}/` folder admits ONLY: `intake.md`, `requirements.md`, `design.md`, `tasks.md`, `test-plan.md`, `test-cases.md`, `migration-plan.md` (+ `baselines/`, `mockups/` dirs). Any other `.md` (e.g. `backend-relevamiento.md`, `analisis.md`) → **BLOCK**: "{file} no es un artefacto SDD. El relevamiento/análisis va DENTRO de requirements.md o design.md; docs auxiliares van en `docs/`." Never invent spec files.
9. ☐ **Delegate** → Execute the matched power's mandatory checklist

**NEVER skip steps 5-8b.** Step 5 is a HARD GATE: no clear user action = no power execution. Step 8b is a HARD GATE: wrong role or non-canonical spec file = no write.

**ANTI-FLIP-FLOP**: HOLD your technical opinions. Only change if user provides NEW information.

**sdd-config.json**: NEVER edit manually. Use `sdd-sync.sh`:
- Role change → `bash sdd-sync.sh --role [role] --force`
- Standard update → `bash sdd-sync.sh --force`

**RETROFIT**: When touching ANY spec file: verify traceability header + footer + ADO WI link. No spec without traceability.

**CONSULT → CONFIRM → GENERATE**: Before creating ANY spec file:
1. Read inputs → 2. Propose key decisions → 3. Get confirmation → 4. ONLY THEN generate

| Power | Artifact | What to propose before generating |
|---|---|---|
| project-initializer / project-scanner | intake.md | Scope (in/out), actors, key business rules, NFRs |
| requirements-analyst | requirements.md | REQ list (ID + title + EARS rule) — review one by one |
| solution-designer | design.md | Stack, DB, API pattern, auth, infra |
| implementer | tasks.md | Task breakdown (list of tasks with estimates) |
| qa-engineer | test-plan.md | Test strategy, types, scope, risks, done criteria |
| qa-engineer | test-cases.md | Test cases (derived from test-plan.md) |
| migration-planner | migration-plan.md | Migration approach, phases, rollback strategy |

❌ PROHIBITED: Reading inputs → generating full file → "¿Apruebas?" (no consultation)
✅ CORRECT: Reading inputs → proposing decisions → confirming → generating file

**ADO updates = FIELDS, not just comments.** Content changes → update WI fields. Comments = audit trail only.

---

## 1. Steering triggers — read when applicable

| Trigger | File | What it controls |
|---|---|---|
| Working with specs | `spec-integration.md` | Spec folder naming, template usage, IDE spec mode |
| Creating spec files/folders | `spec-structure-gate.md` | BLOCKS wrong structure — nested Features, Epic in destino |
| Choosing tech stack | `tech.md` | Approved stacks, versions, selection criteria |

> `protected-files.md` and `token-optimization.md` are alwaysApply — already in context.
> `tool-protocol.md` loads via globs (specs/, product.md, .sdd-config.json).

## 2. Show context

Read `verbosity` from `.sdd-config.json` (default: `detailed`).

Detect: role, branch, environment (dev/cert/main/feature→Dev, hotfix→Prod), assigned work items.

Query ADO for **Requirements** where the role-specific Responsables sub-field matches the current user:

⚠️ **ALL ADO queries MUST be scoped to the configured project** (`AZURE_DEVOPS_PROJECT` from `.sdd-config.json` env). NEVER query across projects. NEVER list items from other projects. If WIQL is used, always include `[System.TeamProject] = '{project}'`. If a tool returns items from another project, discard them.

| Role | Responsables sub-field | Filter by state | WI Type |
|------|----------------------|----------------|---------|
| Analyst | Análisis | New, Approved, Ready for Design | Requirement |
| Developer | Desarrollo | Ready for Design, In Progress, Ready for QA | Requirement |
| QA | SQA | Ready for QA, In Testing, Ready for Release | Requirement |

⚠️ Only show **Requirement** WIs — not child WIs (Task, Modelo de Datos, Servicio, Estructuras de Datos, etc.). Query by the role-specific `Responsables` sub-field, NOT generic "Assigned to me".

WIQL (developer role):
```
[System.WorkItemType] = 'Requirement'
AND [System.TeamProject] = '{project}'
AND [{responsables_field}] CONTAINS '{user email}'
```

⚠️ `{responsables_field}` is NOT literal `Responsables.Desarrollo` — that does not exist in ADO. Discover the actual field reference name first:
1. Read a Requirement WI with `expand=All` → inspect fields for ones matching 'Responsables' or the role sub-field label ('Desarrollo', 'Análisis', 'SQA')
2. Use the discovered reference name (e.g. `Custom.Xxxx`) in the WIQL query
3. If discovery fails → query all Requirements by state, filter client-side by checking if user email appears in any Responsables-related field

### Cross-branch lifecycle detection

On `dev`/`main`/`cert` (non-feature):
1. Query tracker for assigned items → `git branch -r --list "*/feature/*{ID}-*"`
2. Detect lifecycle remotely: `git ls-tree -r --name-only origin/feature/{prefix}{ID}-xxx -- specs/`
3. Check each spec: requirements.md exists? approved (`- [x]`)? design.md? tasks.md? test-plan.md?
   ⚠️ **Content validation**: A spec file "exists" only if it has > 10 lines AND at least one `##` heading. Empty/stub files (< 10 lines or no headings) = treat as missing.
4. Build 📍 from remote contents → show items with position + branch
5. User picks item → `git checkout feature/{prefix}{ID}-xxx` → re-detect locally

On **feature branch** → skip cross-branch, use local `specs/`.

**Non-feature branch output**: `👤 [Name] · 📋 [role] · 🌿 dev` + items list (`{prefix}{ID} — Title (📍 position) 🌿 branch`) + `¿En cuál trabajamos?`

**`detailed`** — user, role, branch, env, items, review flags. **`brief`** — `📋 [role] · 🌿 [branch] · [N] items` + `¿Cuál?`

**Clear intent** ("diseña", "implementa task 3") → skip items query, proceed. **Ambiguous/greeting** → show FULL context + WAIT. **ADO unavailable** → skip items, continue.

**Selection disambiguation:** Options presented + vague response ("algo sencillo", "el más rápido") → suggest recommendation + ASK. Do NOT auto-select.

**Hypothetical ≠ approval:** "si apruebo...", "¿qué harás?", "¿qué pasaría si..." → DESCRIBE the plan. Do NOT execute. Wait for explicit "sí", "dale", "apruebo".

### Role capabilities (MANDATORY in opening message)

ALWAYS include role capabilities in the opening paragraph, even if health check had errors. Map from §4 powers:

⚠️ **If product.md is placeholder**: Check intake.md status:
- intake.md approved → show "📍 Inicializar proyecto desde intake" + all role powers available (auto-poblar first)
- intake.md not approved → show "🚫 Aprobá intake.md primero" + only project-initializer
- no intake.md → show "🚫 Ejecutá project-initializer o traé intake de SDD-Intakes" + only project-initializer/project-scanner

- **Analyst**: requirements-analyst, backlog-manager, sprint-planner, release-notes-writer, test-data-generator, migration-planner
- **Developer**: solution-designer, implementer, code-reviewer, db-migrator, pipeline-builder, aws-deployer, vercel-deployer, migration-planner, doc-generator
- **QA**: qa-engineer, api-tester, regression-analyst, test-data-generator

### Lifecycle position + opening message

**⛔ MEMORY FIRST — derive 📍 and next steps from memory before scanning the tree:**

1. **Memory first** — Check the state entities loaded in `precheck.md` Step 1 (`*-status`, `*-progress`, `*-pending-work`, `*plan*`, `completion-tracking`, `*-lifecycle`, observations with `phase:`/`next:`). If they exist, THEY define the 📍 and the proposed next steps.
2. **Scan to CONFIRM/COMPLETE, not to replace** — Then scan the spec folder (table below) to confirm memory and fill gaps memory doesn't cover. Do NOT let a file scan override what memory says was done.
3. **Reconcile out loud if they differ** — Apply `precheck.md` Step 1c: if the scan seems to contradict memory, reconcile explicitly in one line instead of silently re-proposing.

⛔ **NEVER list as a "next step" anything a state entity marks as completed.** No memory match for the project → fall back to the scan table below as the sole source.

Scan table (fallback / confirmation — current step by spec folder):

| Condition | 📍 Show |
|---|---|
| product.md placeholder + intake.md approved | 📍 Inicializar proyecto desde intake → continuar con lifecycle |
| product.md placeholder + intake.md not approved | 🚫 Aprobá intake.md primero |
| product.md placeholder + no intake + code exists | 🚫 Ejecutá project-scanner (detectó código) |
| product.md placeholder + no intake + no code | 🚫 Ejecutá project-initializer o traé intake de SDD-Intakes |
| intake.md exists, project_type empty | 📍 Inicializar proyecto (desde intake existente) |
| intake.md exists in SDD-Intakes (not yet routed) | 📍 Traer intake de SDD-Intakes |
| project_type empty | 📍 Nuevo — proyecto sin configurar |
| No spec folder | 📍 Crear work item |
| intake.md missing | 📍 Crear intake.md (levantamiento de negocio) |
| intake.md `- [ ]` | 📍 Aprobar intake.md |
| intake.md `- [x]`, requirements.md missing | 📍 Crear requirements.md (desde intake) |
| requirements.md `- [ ]` | 📍 Aprobar requirements.md |
| requirements.md `- [x]`, no design.md | 📍 Crear design.md |
| design.md `- [ ]` | 📍 Aprobar design.md |
| design.md `- [x]`, no tasks.md | 📍 Generar tasks.md |
| All exist, tasks incomplete | 📍 Implementar (N/M tasks) |
| All tasks done | 📍 Ejecutar tests |

**Lifecycle roadmap (MANDATORY in opening message):** Show full path with current step bold:

Standard: `📍 **intake** → reqs → design → tasks → impl → test → PR`

Migration (`project_type = "migration"`): `📍 scan → **migration-plan** → intake → reqs (per phase) → design → tasks → impl → test → cutover`

Existing + incremental (`project_type = "existing"`, intake type "change to existing"): `📍 **intake** → reqs (incremental) → design → tasks → impl → test → PR`

In progress: `📍 intake → reqs → design → tasks → **impl [3/5]** → test → PR`

`brief` mode: `📍 0/7 intake` → `📍 1/7 reqs`

**Intake sources (mandatory — always exists before reqs):**
- **From Copilot Agent**: Epic in SDD-Intakes ADO project with intake.md attachment. Analyst rutea al proyecto destino.
- **From Analyst directly**: Created in IDE via project-initializer/project-scanner power. No SDD-Intakes Epic needed.
- **IDE Agent does NOT search SDD-Intakes automatically** — only when Analyst explicitly requests: "traer intake de {proyecto}" or "sdd intake review".
- **When Analyst requests intake review**: Search Epics with tag `intake-created` in SDD-Intakes → read attachment → route to current project (no need to ask project destino — Analyst is already in it). For new: create Epic + Features. For change/migration: use existing Epic + add Features.

**Intake type → project_type mapping (MANDATORY — never use intake type as project_type):**

| Intake Type | → project_type | → product.md Type | Epic destino | Repo destino | Branch | SDD flow |
|---|---|---|---|---|---|---|
| new project | `new` | new | Crear nuevo | Crear nuevo | intake/{slug} | Completo |
| change to existing | `existing` | existing | Usar existente | Usar existente | intake/{slug}-v{n} | Incremental |
| migration | `migration` | migration | Usar existente | Usar existente | intake/{slug}-v{n} | Migration plan + rollback |
| new module | `existing` | existing | Usar existente | Usar existente | intake/{slug}-v{n} | Incremental |
| regulatory | `existing` | existing | Usar existente | Usar existente | intake/{slug}-v{n} | Incremental |

⚠️ `project_type` solo acepta: `"new"` | `"existing"` | `"migration"`. El intake type "change to existing" mapea a `project_type: "existing"` con requirements incrementales — NO es un valor separado de `project_type`.

### ⚠️ HARD GATE — Spec structure

**SPEC STRUCTURE GATE**: Before creating ANY spec folder, spec file, or proposing a repo structure, read `spec-structure-gate.md` FIRST and run its checklist IN ORDER. Features are ALWAYS nested inside `specs/{prefix}{ID}-{name}/`. NEVER place Feature folders as siblings of the Epic folder. NEVER place `requirements.md` (or design/tasks/test-*) directly in the Epic folder.

**After intake.md approved — ORDER OF OPERATIONS (MANDATORY):**
1. Create Epic in `AZURE_DEVOPS_PROJECT` (type=new) or confirm existing (type=change/migration)
2. Link Epics: Epic destino ← relates to → Epic SDD-Intakes
3. Create Feature WIs under Epic (decompose from intake, parent link via `wit_work_items_link`)
4. Create Feature spec folders NESTED inside Epic folder
5. Tag SDD-Intakes Epic: `intake-routed`
6. Continue SDD lifecycle inside the Feature folder

If the user asks for requirements but there is NO Feature WI and NO Feature spec folder → **BLOCK and create them FIRST** (steps 3-4). Never generate requirements at the Epic folder level.

### Critical rules — ALWAYS read before proposing

| Rule | Skill file | What it prevents |
|---|---|---|
| Spec folder structure | spec-structure-gate.md | Requirements outside Feature folders, Features as siblings |
| Artifact paths | artifact-storage.md | Files in wrong directories |
| Work item naming | azure-devops-workflow.md | Wrong WI title format |
| Branch naming | git-conventions.md | Branch from another feature branch |
| Tech stack | tech.md | Unapproved technologies |

**BEFORE proposing ANY structure, path, or naming**: read the corresponding skill file first. NEVER improvise.

### ⚠️ HARD GATE — One file at a time

**NEVER create the next lifecycle file without explicit user approval.** Each spec file is a STOP point:

1. Create ONE file (e.g., design.md)
2. Show it to user: `✅ Guardado → 📄 [file]`
3. Ask: `¿Apruebas? ¿Ajustes?`
4. **STOP. WAIT for response.**
5. Only after explicit approval → advance 📍 to next step

**What counts as approval**: "dale", "apruebo", "ok", "sí", "lgtm", "next", checkbox marked `- [x]`.
**What does NOT**: selecting an item, navigating to a branch, saying "vamos", greeting.

**Approval is per file, never cascading.** An approval covers ONLY the file you just presented and asked about. "dale"/"ok" answering a question about `requirements.md` approves `requirements.md`, not `design.md` or `tasks.md`. Before drafting the next file: (1) mark that file's `## Approval` checkbox with the approver's name and date, and replace `> ✅ Approved by: [pending]` in its header with the approver and ISO date; (2) never tick a checkbox or stamp a name the user did not approve on that turn; (3) draft the next file and STOP again. A user question, a bug report or a concern is NOT approval: answer it and wait.

**Item selection ≠ action.** When user selects a tracker item ("vamos a ese", "ese", "el primero"):
1. Checkout the branch
2. Re-detect lifecycle
3. Show context: `📍 [position]` + `¿Qué hacemos?`
4. **STOP. Do NOT auto-create any file.**

### Output format

**`detailed`** — `👤 [Name] · 📋 [role] · 🌿 [branch]` + `📍 [position]` + capabilities list (each on own line with `- ` prefix) + `¿En qué trabajamos?`. If role-blocked: `❌ [task] bloqueado — cambiar con: bash sdd-sync.sh --role [role] --force` + list what user CAN do.

**`brief`** — `📋 [role] · 🌿 [branch] · 📍 [position]` + lifecycle question (1 line).

**CRITICAL**: Each capability MUST be on its own line with `- ` prefix. NEVER paragraph. Developer/QA can `➕ Crear nuevo feature/WI`. Analyst cannot.

### New feature branching rule

When user wants to create a NEW feature/WI from ANY branch:
1. Create WI in tracker
2. `git stash` if there are uncommitted changes
3. `git checkout dev` → `git pull origin dev`
4. `git checkout -b feature/{prefix}{ID}-name`
5. Continue with requirements in the new branch

**NEVER create a feature branch from another feature branch.** Always from `dev`.

### Review flags

- Tag `needs-clarification` → `⚠️ needs-clarification` + show feedback comment
- Spec has `⚠️ REQUIRES REVIEW` → `⚠️ design.md requires review`

## 3. Before delegating to a power

| Situation | Load power/skill |
|---|---|
| New feature/fix without branch | work-item-setup |
| Role validation needed | role-enforcement |
| Commit/push | git-conventions |
| Spec changed | change-propagation |

> `project-initializer` and `project-scanner` are triggered by `precheck.md` (first interaction), not by this routing table.

## 4. Route to power

⚠️ **Each action maps to a REQUIRED power — delegate to it.** The `Power` column is the power the agent MUST execute for that action. Naming a role is not enough: route to the named power (e.g. "crear test plan" / "ejecutar pruebas" → **always `qa-engineer`**).

| User asks to... | Step | Role | Power (required) | Output |
|---|---|---|---|---|
| Traer intake de SDD-Intakes | 0 | 📋 Analyst | `project-initializer` | `intake.md` (from SDD-Intakes Epic attachment) → Epic in proyecto destino + Feature WIs + Feature spec folders |
| Create/analyze requirements | 1 | 📋 Analyst | `requirements-analyst` | `requirements.md` (EARS) |
| Select technologies | 1.5 | 💻 Developer | `solution-designer` | Tech in design.md |
| Create design/architecture | 2 | 💻 Developer | `solution-designer` | `design.md` |
| Create test plan | 3 | 🧪 QA | `qa-engineer` | `test-plan.md` |
| Create test cases | 3 | 🧪 QA | `qa-engineer` | `test-cases.md` |
| Implement code | 4 | 💻 Developer | `implementer` | Code + tests + tasks.md |
| Review code (PR) | 4.5 | 💻 Developer | `code-reviewer` | PR comments |
| Execute tests | 5 | 🧪 QA | `qa-engineer` | Run test plan |
| Migrate/upgrade/modernize | M | 💻 Developer | `migration-planner` | `migration-plan.md` |
| Deploy | D | 💻 Developer | `aws-deployer` / `vercel-deployer` | AWS CDK + smoke tests |
| Prepare release | 7 | All | `release-notes-writer` | Sign-off |

### Lifecycle suggestions

| Event | Suggest power | Condition |
|---|---|---|
| design.md saved with DB changes | db-migrator | New tables/columns |
| First design with Infrastructure | pipeline-builder | No CI/CD yet |
| All tasks complete | code-reviewer | Before QA handoff |
| QA approved | aws-deployer | If stacks include aws |
| QA approved | vercel-deployer | If stacks include vercel |
| Merge to main | release-notes-writer | WIs completed in sprint |

### On-demand powers (cross-role — available regardless of current role)

⚠️ These powers trigger on keywords regardless of whether user is analyst, developer, or QA. Do NOT interpret "qué hay pendiente" as "next lifecycle step" — it means "show me the backlog".

| Keywords | Power |
|---|---|
| backlog, priorizar, grooming, refinement, **qué hay pendiente**, **qué falta**, **items**, **lista de tareas** | backlog-manager |
| sprint, planificar, velocity, capacity, **cómo va el sprint**, **burndown**, **cierre**, **carryover** | sprint-planner |
| test api, postman, endpoint test | api-tester |
| regresión, flaky, test history | regression-analyst |
| test data, seed, fixtures | test-data-generator |
| documentation, readme, api docs, adr | doc-generator |

## 5. Lifecycle dependency enforcement

**No step can be skipped.** Verify prerequisites:

| Task | Requires | Verify |
|---|---|---|
| Requirements (1) | intake.md approved | `## Approval` has `- [x]` |
| Design (2) | requirements.md **exists + has content + approved** (analyst-owned) | File exists AND >10 lines + a `##` heading AND `## Approval` has `- [x]` |
| Tech selection (1.5) | requirements.md exists + has content | File exists AND >10 lines + a `##` heading |
| Test plan (3) | requirements.md exists + has content | File exists AND >10 lines + a `##` heading |
| Implementation (4) | design.md + tasks.md (both exist + content) | Both exist AND have content |
| Test execution (5) | test-plan.md | File exists |

**Approval flow:**
1. After generating artifact → "¿Lo apruebas?"
2. User approves → update `- [ ]` → `- [x]` with name and date
3. If user says "diseña" but requirements `- [ ]` → **BLOCK**: "Requirements necesita aprobación primero."
4. ⚠️ **If `requirements.md` does NOT exist (or is a stub) → BLOCK, do NOT proceed.** A missing requirements is NOT the same as an unapproved one — "no `- [ ]` found" does not mean "ok to design". `requirements.md` is **analyst-owned**: the developer must NOT generate it nor skip it. BLOCK: "No existe requirements.md — lo crea el analyst (requirements-analyst) antes del diseño."

Missing prerequisite → **block and explain**. No workarounds.

**Language rule (ALL powers):**
Before generating ANY content (files, ADO fields, chat summaries, output reports):
1. Read `docs_language` from `.sdd-config.json`
2. ALL generated text MUST be in that language. Default: `"es"`
3. **Template Translation:** If a structural template (e.g. from `core/templates/` or `references/`) is written in English, you MUST translate its headers, labels, and table columns to `docs_language` before outputting.
4. Exceptions: EARS keywords (SHALL/WHEN/WHILE/WHERE/IF), code identifiers, technical terms (API, JWT, DB, CRUD), command names
5. Do NOT "detect from user messages" — READ the config

**When blocked by role:** Don't just say "switch roles". Also list what the user CAN do with their current role (from §4 routing table). Example for analyst: "No puedo hacer design (requiere developer). Como analyst puedo: crear requirements para otro WI, organizar backlog, planificar sprints."

**⚠️ Role change restriction:** NEVER run `sdd-sync.sh --role` proactively. The user must EXPLICITLY request a role change ("cambia a developer", "sync con rol developer", etc.). If user says "dale", "sí", "avancemos" after you mention a role switch → that is permission to SUGGEST the command, NOT to execute it. Present: `Corre: bash sdd-sync.sh --role developer` and STOP.

> Output format, interaction pattern, and communication style → see `token-optimization.md` (alwaysApply).

## 6. After commit (all powers)

After ANY `git commit + push`, execute these integrations in order:

⚠️ Push is MANDATORY — commit without push = incomplete. NEVER do commit-only.

| # | Integration | Action | If unavailable |
|---|---|---|---|
| 1 | **server-memory** | Persist power-specific data (each power's checklist defines what) | Skip silently |
| 2 | **ADO** | Update work item per table below | Skip silently |
| 3 | **📍 Refresh** | Recalculate lifecycle, show `✅ Committed: [msg]` + `📍 [next]` | Always |
| 4 | **codebase-memory** | `index_repository` with `persistence: true` → writes `graph.db.zst` artifact to repo (team-shared) | Skip silently |

### Post-save checklist (MANDATORY after saving ANY spec file)

1. ☐ **Provenance header** in file → `> 📋 Generated by [power] · [date]` + `> ✅ Approved by: [pending]`
2. ☐ **ADO update** → Acceptance Criteria (fallback: Description) ← actual REQs (not a summary), in HTML format
3. ☐ **ADO signature** → footer: `— 📋 SDD · [power-name] · [YYYY-MM-DD]`
4. ☐ **ADO file links** → file references in ADO use full remote URL (clickable). Build from `git remote` + path. Always use `dev` branch for repo links (not feature branch) — links survive merge without post-merge update. Azure: `https://dev.azure.com/{org}/{project}/_git/{repo}?path=/{file}&version=GBdev`. GitHub: `https://github.com/{org}/{repo}/blob/dev/{file}`
5. ☐ **docs_language** → file content and ADO fields in `docs_language` from `.sdd-config.json`
6. ☐ **Cross-document coherence** → Check `change-propagation.md` §Propagation Matrix. If the saved file has downstream dependents, verify shared data (counts, decisions, tech stack) is consistent. If discrepancies found → fix or flag with `⚠️ REQUIRES REVIEW` marker.
7. ☐ **Chat output** → `✅ Guardado → 📄 [file](file:///path)` + approval + `📍 [next]`

> **Do NOT skip any step.** All 7 are mandatory every time a spec is saved.

**ADO actions by artifact (centralized — powers do NOT need their own ADO section):**

**WI type detection (BEFORE any update):** Query parent WI type. Feature/Epic → create child **Requirement**. Requirement → update directly (Acceptance Criteria (fallback: Description)). Task/Bug → update directly (Description). Save resolved `work_wi_id` to server-memory — all subsequent actions use this ID.

| Event | ADO Action | Fields / State |
|---|---|---|
| WI selected (Feature/Epic) | ⚠️ Duplicate check: query ADO by title prefix with WIQL CONTAINS (case-insensitive). If found → skip. Then `create_work_item` → child Requirement | Title, Tags: `[type]`, then `wit_work_items_link` for parent |
| WI selected (Requirement) | No action — use directly | — |
| intake.md created **locally** (no Epic exists yet) | ⚠️ Duplicate check (WIQL CONTAINS). If no Epic → **OFFER** to create it: `create_work_item` → **Epic** in `AZURE_DEVOPS_PROJECT` (via work-item-setup). Only after user confirms. | Title: `[producto] - {iniciativa}`, Description from intake §s, Tags += area/domain. |
| local intake confirmed → **mirror in SDD-Intakes** | Same confirmation. Duplicate-check SDD-Intakes (Title CONTAINS proyecto / Tags CONTAINS area). If none → `create_work_item` → **Epic** in `SDD-Intakes` + link `relates to` → destino Epic | Title: `[{area}] - {proyecto}`, Tags: `{area};{domain};intake-routed`, Comment: "Origen: intake local — ya ruteado (AB#{destino})". Prevents Copilot-Agent duplicates. |
| intake.md created (Epic **already exists**) | `update_work_item` Epic | Description += § Contexto + § Objetivo + § Alcance + § BRs + § NFRs + § Constraints + § Fuentes, Tags += area/domain |
| intake.md created (Feature) | `update_work_item` Feature | Description += § Contexto módulo + § BRs específicos, Tags += módulo |
| intake ruteado al proyecto destino (type=new) | 1. `create_work_item` → **Epic** in destino + 2. link destino ← relates to → SDD-Intakes + 3. Feature WIs + 4. Feature spec folders | Title: `[producto] - {iniciativa}`, tag SDD-Intakes: `intake-routed` |
| intake ruteado al proyecto destino (type=change/migration) | 1. confirm existing Epic in destino + 2. Feature WIs + 3. Feature spec folders | tag SDD-Intakes: `intake-routed` |
| intake.md approved | `update_work_item` Epic/Feature | State → Active, Comment: "Intake aprobado por [Business] + [Analyst]" |
| intake ruteado al proyecto destino | `update_work_item` Epic in SDD-Intakes | Tags: intake-routed, Comment: "Ruteado a {project} — Epic AB#{id_destino}" |
| requirements.md created | `update_work_item` work_wi | Acceptance Criteria (fallback: Description) ← REQs, Priority, State → Active |
| requirements.md approved | `update_work_item` work_wi | State → Ready for Design, Tag: `reqs-approved` |
| design.md created | **No ADO update** — draft only. Wait for approval. | — |
| design.md approved | `update_work_item` work_wi | Description += architecture, Tags: `[stack]`, `design-approved`, Repo link, State → In Progress |
| tasks.md committed | `create_work_item` → **Task** × N | Title, Description + Repo link, Remaining Work, then `wit_work_items_link` to work_wi |
| design.md approved | `create_work_item` → **Modelo de Datos** × N | 1 per DB table §3.2. Title: `[producto] [módulo] MD: {table}`. Skip if frontend-only |
| design.md approved | `create_work_item` → **Servicio** × N | 1 per endpoint §3.3. Title: `[producto] [módulo] SVC: {METHOD} {route}`. Skip if frontend-only |
| design.md approved | `create_work_item` → **Estructuras de Datos** × N | 1 per schema §3.1. Title: `[producto] [módulo] ED: {schema}`. Skip if none |
| test-plan.md committed | Create **Test Plan** + **Test Case** × N | Plan name, Cases, Area Path, State → Ready for Testing |
| test-cases.md committed | Update **Test Case** × N | Steps, Expected, link to Test Plan |
| Task N completed | `update_work_item` child Task | State → Closed, Comment |
| All tasks done | `update_work_item` work_wi | State → Ready for QA, Story Points, Tag: `implementation-complete` |
| All tasks done | `update_work_item` MD/SVC/ED children | State → Resolved (if they exist) |
| Tests pass | `update_work_item` work_wi | State → Resolved, Comment: results summary |
| Tests fail + approved | `create_work_item` → **Bug** | Title, Repro Steps, Severity, Related link to work_wi |
| Code review | `create_pull_request` | Source → target, Reviewers, WI link |
| Backlog re-prioritized | `update_work_item` × N | Priority + StackRank per WI |
| Migration/DB/Pipeline/Deploy/Release | Comment or update | See `azure-devops-workflow.md` |

**ADO content signature:** Every ADO text field MUST end with: `— 📋 SDD · [power-name] · [YYYY-MM-DD]`

**DUAL UPDATE rule:** Every event requires BOTH: (1) Field update (Description, AC, State, Tags) + (2) Audit comment (what, artifact, branch). One without the other is incomplete.

**MD→HTML:** Description and Acceptance Criteria fields = HTML. Comments = markdown. See azure-devops-workflow.md for field fallback.

**Rollback:** Tests fail / CR rejected / Deploy fails → `update_work_item` parent → In Progress, assign `developer_email`. Reqs rejected → Proposed.

**Assignment:** Default = creator. Reqs approved → ask `developer_email` (design/tasks/bugs/PR inherit). All tasks done → ask `qa_email` (Test Plan/Cases inherit). `role: all` → skip asks. Save emails to server-memory per WI.
**Assignment timing by branch type:**

| Branch | Ask dev | Ask QA | Notes |
|---|---|---|---|
| feature/, fix/ | Reqs approved | All tasks done | Full lifecycle |
| hotfix/ | WI creation | After fix | Fast-track, skip reqs wait |
| release/ | Never | Never | Creator = owner |

> Full ADO workflow details (CMMI states, WI types, field reference) → see `azure-devops-workflow.md`
