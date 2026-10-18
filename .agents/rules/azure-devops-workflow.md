# Azure DevOps Workflow

⚠️ **PROJECT ISOLATION**: ALL ADO operations (queries, WI creation, updates) MUST be scoped to `AZURE_DEVOPS_PROJECT` from `.sdd-config.json` env. Read it once at startup. NEVER query across projects. If using `wit_query_by_wiql`, always include `[System.TeamProject] = '{project}'`. If `wit_my_work_items` returns items from other projects, **discard them**. Listing items from outside the configured project is a HARD VIOLATION.

## Process: CMMI

## Work Item Hierarchy

```
Epic
└── Feature
    └── Requirement
        ├── Task
        ├── QA Task
        ├── Bug
        ├── Modelo de Datos
        ├── Servicio
        └── Estructuras de Datos
```

Epic: solo analyst. Feature: analyst o developer. Requirement: analyst. Bug: developer o qa.

## States (CMMI)

Proposed → Active → Resolved → Closed

> Event-driven ADO transitions (state changes, element creation) → see §6 in workflow-router.md

### States per WI Type

| WI Type | State Flow | Trigger |
|---|---|---|
| Epic | Proposed → Active → Resolved → Closed | Roll-up of Features |
| Feature | Proposed → Active → Resolved → Closed | Roll-up of Requirements |
| Requirement | Proposed → Active → Ready for Design → In Progress → Ready for QA → Resolved → Closed | SDD lifecycle events |
| Task | Proposed → Active → In Progress → Closed | Implementer selects → codes → completes |
| Modelo de Datos | Proposed → Active → Resolved | Design approved → impl starts → all tasks done |
| Servicio | Proposed → Active → Resolved | Design approved → impl starts → all tasks done |
| Estructuras de Datos | Proposed → Active → Resolved | Design approved → impl starts → all tasks done |
| Test Plan | Proposed → Active → Resolved → Closed | Created → execution → all run → sign-off |
| Test Case | Design → Ready → Passed/Failed/Blocked | Azure Test Plans states |
| Bug | Proposed → Active → Resolved → Closed | Created → dev takes → fixed → QA verifies |

## Universal WI Creation Rule (applies to ALL powers)

⚠️ **BEFORE** any `wit_create_work_item` or `wit_update_work_item` call:

1. **Field discovery (§2b)** → Discover required fields + picklist values for the target WI type
2. **State discovery (§2b.4)** → Discover valid states. Do NOT hardcode "Proposed", "Active", etc.
3. **Propose values proactively** → Present compact confirmation block with values inferred from context
4. **ONLY AFTER confirmation** → Execute the create/update call
5. **Parent link** → AFTER creating the WI, link it to its parent:
   ```
   wit_work_items_link(
     source_work_item_id: {new_wi_id},
     target_work_item_id: {parent_id},
     link_type: "System.LinkTypes.Hierarchy-Reverse"
   )
   ```
   ⚠️ `System.Parent` field in `wit_create_work_item` does **NOT** create the hierarchy link. It is IGNORED by ADO.
   You MUST call `wit_work_items_link` separately after creation. Without this, the WI appears orphaned.

❌ **PROHIBITED**: The "create → fail → ask user" pattern.
❌ **PROHIBITED**: Asking user "what fields are required?" or "(ej. Alta, Media, Baja)".
❌ **PROHIBITED**: Hardcoding states without discovery. Use §2b.4 to get real state names.
❌ **PROHIBITED**: Assuming `System.Parent` in create fields creates a link. It does NOT.

This rule applies to: work-item-setup, requirements-analyst, solution-designer, implementer, qa-engineer, sprint-planner, backlog-manager — any power that touches ADO WIs.

## Naming Convention

Pattern: `[producto] [módulo] [sub-área?] - Descripción`

Separator is ` - ` (space, dash, space). ⚠️ NEVER use `/`, `:`, or other separators between Módulo and Descripción.

Source: `[producto]` = product name from `product.md` (lowercase). `[módulo]` = feature name or spec folder (lowercase).

⚠️ **All text inside brackets `[]` MUST be lowercase**. Examples: `[task-api]`, `[core]`, `[auth]`. NEVER `[Task-API]`, `[Core]`, `[Auth]`.

⚠️ **Duplicate check**: Before creating any WI, query ADO with WIQL using `CONTAINS` (case-insensitive). If a WI with the same type and similar title already exists under the same parent → do NOT create. Inform user of the existing WI.

| WI Type | Format | Example |
|---|---|---|
| Epic | `[producto] - {iniciativa}` | `[my-product] - Plataforma de Validaciones TSS` |
| Feature | `[producto] [módulo] - {desc}` | `[koneksi] [tasks] - API de gestión de tareas` |
| Requirement | `[producto] [módulo] [área] - {desc}` | `[koneksi] [tasks] [due-dates] - Validación de fechas` |
| Task | `[producto] [módulo] TASK-{N}: {acción}` | `[koneksi] [tasks] TASK-001: Crear endpoint POST /tasks` |
| QA Task | `[producto] [módulo] TASK-QA-{N}: Ejecutar {type name} ({N} TCs)` | `[koneksi] [tasks] TASK-QA-001: Ejecutar Functional E2E (5 TCs)` |
| Bug | `[producto] [módulo] BUG: {desc}` | `[koneksi] [tasks] BUG: Fecha pasada no retorna 400` |
| Modelo de Datos | `[producto] [módulo] MD: {table}` | `[koneksi] [tasks] MD: tasks` |
| Servicio | `[producto] [módulo] SVC: {METHOD} {route}` | `[koneksi] [tasks] SVC: POST /api/v1/tasks` |
| Estructuras de Datos | `[producto] [módulo] ED: {schema}` | `[koneksi] [tasks] ED: TaskDueDateSchema` |
| Test Plan | `[producto] [módulo] TP: {scope}` | `[koneksi] [tasks] TP: Sprint 1` |
| Test Case | `[producto] [módulo] TC-{NNN}: {scenario}` | `[koneksi] [tasks] TC-001: Crear tarea con fecha válida` |
| Test Case Classification | Set via field discovery | Positive / Negative / Boundary / Edge Case (see qa-engineer/references/templates.md §Classification) |

## Description Format Convention

**Format rules:**
- `wit_create_work_item` → set `format: "Markdown"` for text-only descriptions. Set `format: "HTML"` when description contains tables (MD, SVC, ED types).
- `wit_update_work_item` → JSON Patch has NO format flag — write in HTML (`<h2>`, `<b>`, `<ul>`, `<li>`, `<p>`, `<a>`, `<table>`)
- ⚠️ NEVER send raw Markdown to `wit_update_work_item` — it renders as plain text with literal asterisks

**Standard Description structure by WI type:**

### Epic
```markdown
## Objetivo
{Objetivo de negocio — 1-2 líneas}

## Alcance
- {Módulo o área 1}
- {Módulo o área 2}

## KPIs
- {Métrica medible 1}
- {Métrica medible 2}

## Requerimientos de Negocio
- BR-{TYPE}-001: {resumen de la regla}
- BR-{TYPE}-002: {resumen de la regla}

## NFRs
- Performance: {métrica}
- Security: {métrica}
- Availability: {métrica}

## Constraints
- {constraint de negocio o regulatorio}

## Fuentes
- {fuente 1} ({fecha})
- {fuente 2} ({fecha})

## Repo
[Ver intake.md]({repo_url}/blob/dev/specs/{prefix}{ID}-{name}/intake.md)

— 📋 SDD · [project-initializer | project-scanner] · {YYYY-MM-DD}
```
Format: `"Markdown"`. Example title: `[koneksi] - Gestión de tareas colaborativas`

### Feature
```markdown
## Resumen
{Qué capability agrega — 1-2 líneas}

## Requerimientos vinculados
- REQ-001: {título corto}
- REQ-002: {título corto}

## Stack
{stack si aplica: node, angular, flutter, etc.}

## Repo
[Ver specs]({repo_url}/tree/dev/specs/{prefix}{ID}-{name}/)

— 📋 SDD · requirements-analyst · {YYYY-MM-DD}
```
Format: `"Markdown"`. Updated at two stages: after reqs approved (adds REQs list), after design approved (adds stack tag). If Feature has intake.md, Description also includes § Contexto del Módulo + § Constraints heredados + [Ver intake.md]({repo_url}/blob/dev/specs/{epic_prefix}{epic_ID}-{epic_name}/{prefix}{ID}-{name}/intake.md).

### Requirement
```markdown
## Requerimientos ({módulo})

- **REQ-001:** WHERE {contexto}, WHEN {trigger}, THE {sistema} SHALL {acción}
- **REQ-002:** WHILE {estado}, THE {sistema} SHALL {acción}

---

## Criterios de aceptación
- [ ] {criterio 1}
- [ ] {criterio 2}

## Repo
[Ver requirements.md]({repo_url}/blob/dev/specs/{prefix}{ID}-{name}/requirements.md)

— 📋 SDD · requirements-analyst · {YYYY-MM-DD}
```
Format: `"Markdown"` for create, HTML for update. Note: CMMI has no Acceptance Criteria field — all goes in Description.

### Task
```markdown
## Descripción
{Qué implementar — instrucciones concretas}

## REQ vinculado
REQ-{NNN}: {título}

## Estimación
{N} horas

## Repo
[Ver tasks.md]({repo_url}/blob/dev/specs/{prefix}{ID}-{name}/tasks.md#task-{N})

— 📋 SDD · solution-designer · {YYYY-MM-DD}
```
Format: `"Markdown"`.

### Bug
```markdown
## Pasos para reproducir
1. {Paso 1}
2. {Paso 2}
3. {Paso 3}

## Resultado esperado
{Qué debería pasar}

## Resultado actual
{Qué pasa en realidad}

## Evidencia
- Test Case: TC-{NNN}
- Branch: {branch}
- Error: `{mensaje si aplica}`

## Repo
[Ver test-cases.md]({repo_url}/blob/dev/specs/{prefix}{ID}-{name}/test-cases.md#TC-{NNN})

— 📋 SDD · qa-engineer · {YYYY-MM-DD}
```
Format: `"Markdown"`. Also populate Repro Steps field if available.

### Modelo de Datos
Format: `"HTML"` — table with inline styles on every `<td>`/`<th>` (see §Tables in descriptions below).
Sections: Columns table (name, type, nullable, default, constraints, description) + Indexes table + Repo link.
```html
<h2>Columnas</h2>
<table>
<tr>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Columna</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Tipo</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Nullable</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Default</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Constraints</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Descripción</th>
</tr>
<tr>
<td style="border:1px solid #ddd;padding:6px;">id</td>
<td style="border:1px solid #ddd;padding:6px;">uuid</td>
<td style="border:1px solid #ddd;padding:6px;">NO</td>
<td style="border:1px solid #ddd;padding:6px;">gen_random_uuid()</td>
<td style="border:1px solid #ddd;padding:6px;">PK</td>
<td style="border:1px solid #ddd;padding:6px;">Identificador único</td>
</tr>
</table>
<h2>Índices</h2>
<table>
<tr>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Nombre</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Columnas</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Tipo</th>
</tr>
<tr>
<td style="border:1px solid #ddd;padding:6px;">idx_{name}</td>
<td style="border:1px solid #ddd;padding:6px;">{cols}</td>
<td style="border:1px solid #ddd;padding:6px;">BTREE</td>
</tr>
</table>
<p>Repo: {repo_url}/blob/dev/specs/{prefix}{ID}-{name}/design.md#table-{name}</p>
<p>— 📋 SDD · solution-designer · {YYYY-MM-DD}</p>
```

### Servicio
Format: `"HTML"` (always — SVC descriptions carry request/response schema tables).
Sections: `## Endpoint` (method + route + auth) + request/response schemas (HTML tables) + errors + curl example + Repo link.
```html
<h2>Endpoint</h2>
<p><b>{METHOD}</b> <code>{route}</code> — Auth: {auth}</p>
<h2>Request</h2>
<table>
<tr>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Campo</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Tipo</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Requerido</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Descripción</th>
</tr>
<tr>
<td style="border:1px solid #ddd;padding:6px;">{field}</td>
<td style="border:1px solid #ddd;padding:6px;">{type}</td>
<td style="border:1px solid #ddd;padding:6px;">SÍ</td>
<td style="border:1px solid #ddd;padding:6px;">{desc}</td>
</tr>
</table>
<h2>Response (200)</h2>
<table>
<tr>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Campo</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Tipo</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Descripción</th>
</tr>
<tr>
<td style="border:1px solid #ddd;padding:6px;">{field}</td>
<td style="border:1px solid #ddd;padding:6px;">{type}</td>
<td style="border:1px solid #ddd;padding:6px;">{desc}</td>
</tr>
</table>
<h2>Errores</h2>
<table>
<tr>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Código</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Significado</th>
</tr>
<tr>
<td style="border:1px solid #ddd;padding:6px;">400</td>
<td style="border:1px solid #ddd;padding:6px;">{motivo}</td>
</tr>
</table>
<h2>Ejemplo</h2>
<pre>curl -X {METHOD} {base_url}{route} -H "Authorization: Bearer {token}"</pre>
<p>Repo: {repo_url}/blob/dev/specs/{prefix}{ID}-{name}/design.md#endpoint-{method}-{route}</p>
<p>— 📋 SDD · solution-designer · {YYYY-MM-DD}</p>
```

### Estructuras de Datos
Format: `"HTML"` — table with inline styles.
Sections: Schema table (campo, tipo, requerido, validación, descripción) + Relationships + Repo link.
```html
<h2>Schema</h2>
<table>
<tr>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Campo</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Tipo</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Requerido</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Validación</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Descripción</th>
</tr>
<tr>
<td style="border:1px solid #ddd;padding:6px;">{field}</td>
<td style="border:1px solid #ddd;padding:6px;">{type}</td>
<td style="border:1px solid #ddd;padding:6px;">SÍ</td>
<td style="border:1px solid #ddd;padding:6px;">{regla}</td>
<td style="border:1px solid #ddd;padding:6px;">{desc}</td>
</tr>
</table>
<h2>Relaciones</h2>
<table>
<tr>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Entidad</th>
<th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Cardinalidad</th>
</tr>
<tr>
<td style="border:1px solid #ddd;padding:6px;">{entidad}</td>
<td style="border:1px solid #ddd;padding:6px;">1:N</td>
</tr>
</table>
<p>Repo: {repo_url}/blob/dev/specs/{prefix}{ID}-{name}/design.md#schema-{name}</p>
<p>— 📋 SDD · solution-designer · {YYYY-MM-DD}</p>
```

### Test Plan
```markdown
## Alcance
{Qué se prueba — feature/sprint}

## Tipos de testing
- 🔴 {tipo blocking}
- 🟡 {tipo importante}
- 🟢 {tipo opcional}

## Cobertura
- {N} test cases
- {N} requerimientos cubiertos

## Repo
[Ver test-plan.md]({repo_url}/blob/dev/specs/{prefix}{ID}-{name}/test-plan.md) + [test-cases.md]({repo_url}/blob/dev/specs/{prefix}{ID}-{name}/test-cases.md)

— 📋 SDD · qa-engineer · {YYYY-MM-DD}
```
Format: `"Markdown"`.

### Test Case
```markdown
## Pasos
1. {Precondición}
2. {Acción}
3. {Verificación}

## Resultado esperado
{Qué debe pasar exactamente}

## REQ vinculado
REQ-{NNN}: {título}

## Repo
[Ver test-cases.md]({repo_url}/blob/dev/specs/{prefix}{ID}-{name}/test-cases.md#TC-{NNN})

— 📋 SDD · qa-engineer · {YYYY-MM-DD}
```
Format: `"Markdown"`.

**Tables in descriptions** — ADO strips `border` attributes from `<table>`. The ONLY way to get visible borders is **inline `style` on every `<th>` and `<td>`**:
```html
<table>
  <tr>
    <th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Column</th>
    <th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Type</th>
    <th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Nullable</th>
    <th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Default</th>
    <th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Constraints</th>
    <th style="border:1px solid #ddd;padding:6px;background:#344563;color:white;">Description</th>
  </tr>
  <tr>
    <td style="border:1px solid #ddd;padding:6px;">id</td>
    <td style="border:1px solid #ddd;padding:6px;">uuid</td>
    <td style="border:1px solid #ddd;padding:6px;">NO</td>
    <td style="border:1px solid #ddd;padding:6px;">gen_random_uuid()</td>
    <td style="border:1px solid #ddd;padding:6px;">PK</td>
    <td style="border:1px solid #ddd;padding:6px;">Identificador único</td>
  </tr>
</table>
```
⚠️ `border="1"` on `<table>` does NOT work in ADO — it gets stripped. You MUST put `style="border:1px solid #ddd;padding:6px;"` on EVERY `<td>` and `<th>`.
⚠️ This applies to BOTH `wit_create_work_item` (set `format: "HTML"`) and `wit_update_work_item`.

**Repo link format (ALWAYS include):**
- GitHub: `https://github.com/{org}/{repo}/blob/dev/{path}`
- Azure: `https://dev.azure.com/{org}/{project}/_git/{repo}?path=/{file}&version=GB{branch}`

**Footer (ALWAYS append):**
```
— 📋 SDD · [power-name] · [YYYY-MM-DD]
```

⚠️ ALL powers MUST follow this convention. Do NOT improvise Description format per power.

## Linking

- Each commit/PR linked to work item: `AB#123`
- Each test case linked to requirement
- Each bug linked to the test case that found it

## Test Plans

- Create Test Plan per sprint/feature
- Test Cases linked to Requirements
- Results recorded in Azure DevOps

For Definition of Done, see `qa-strategy.md`.

## Element mapping reference

| SDD Artifact | ADO Element | Hierarchy | MCP Tool |
|---|---|---|---|
| Intake from intake.md (Epic-level) | Epic | — | `update_work_item` (Description + Tags) |
| Intake from intake.md (Feature-level) | Feature | Child of Epic | `update_work_item` (Description + Tags) |
| Feature (top-level capability) | Feature | Child of Epic | `create_work_item` (type: Feature) |
| Requirement from requirements.md | Requirement | Child of Feature | `create_work_item` (type: Requirement) |
| Task from tasks.md | Task | Child of Requirement | `create_work_item` (type: Task) |
| QA Task from test execution | Task | Child of Requirement | `create_work_item` (type: Task) |
| DB Table from design.md §3.2 | Modelo de Datos | Child of Requirement | `create_work_item` (type: Modelo de Datos) |
| API Endpoint from design.md §3.3 | Servicio | Child of Requirement | `create_work_item` (type: Servicio) |
| Data Schema from design.md §3.1 | Estructuras de Datos | Child of Requirement | `create_work_item` (type: Estructuras de Datos) |
| Test plan | Test Plan | Linked to Requirement | `create_test_plan` |
| Test case | Test Case | Child of Test Plan | `create_test_case` |
| Test case steps | Test Case | — | `testplan_test_case_write` → `update_steps` |
| Test run | Test Run | Linked to Test Plan | ADO REST API: `POST _apis/test/Runs` |
| Test result | Test Result | Child of Test Run | ADO REST API: `PATCH _apis/test/Runs/{id}/Results` |
| Test attachment | Attachment | Linked to Test Result | ADO REST API: `POST _apis/test/Runs/{id}/Results/{rid}/attachments` |
| Bug | Bug | Related link to parent | `create_work_item` (type: Bug) |
| Code review | Pull Request | Branch-based | `create_pull_request` |

**Field format:**
- Description: plain text or HTML, max 32KB
- Repro Steps (Bug): numbered steps

## Field fallback (CMMI)

`Acceptance Criteria` is NOT native to CMMI process. Before writing:
1. Try `Acceptance Criteria` field
2. If field not found → write in `Description` (append with `<hr>` separator)
3. Log: "⚠️ Acceptance Criteria no disponible, usando Description"

Safe fields (always exist): Title, Description, Priority, Tags, State, Stack Rank

## Campos por tipo de WI (CMMI nativo)

| WI Type | Description | Impact Assessment | Business Value | Tags |
|---------|-------------|-------------------|----------------|------|
| Epic | Objetivo negocio + alcance + KPIs | ❌ | Numérico (1-100) | — |
| Feature | Contexto + links a specs en Git | ❌ | Numérico (1-100) | stack |
| Requirement | EARS format + spec link | ✅ | ❌ | — |
| Task | Instrucciones implementación | ❌ | ❌ | — |
| QA Task | Tipo test + resultados + link report | ❌ | ❌ | — |
| Bug | Repro steps + expected vs actual | ❌ | ❌ | severity |
| Modelo de Datos | HTML table: columnas, tipos, FKs | ❌ | ❌ | — |
| Servicio | Endpoint: method, route, schemas | ❌ | ❌ | — |
| Estructuras de Datos | Fields, types, validation rules | ❌ | ❌ | — |
| Test Plan | Alcance + tipos + cobertura | ❌ | ❌ | — |
| Test Case | Pasos + esperado + REQ vinculado | ❌ | ❌ | — |

> Git (specs/) = fuente de verdad. ADO = espejo de gestión con link al .md.

## Comment format

All ADO comments follow this structure:

```
[POWER_NAME] — [ACTION]
---
[Details 1-3 lines]
Artifact: [filename]
Branch: [branch]
```

## Iteration Path format

`{project}\Sprint {N}` — set via `System.IterationPath` field.
Sprint number from sprint-planner or ADO board.

## Pull Request fields

| Field | Value |
|---|---|
| Source branch | feature/{prefix}ID-name or fix/{prefix}ID-name |
| Target branch | dev (default) or cert (hotfix) |
| Reviewers | From .sdd-config.json `team` or ask user |
| Work Item link | AB#{ID} from current spec |
| Merge policy | Squash merge, auto-delete branch |

## Repo links in WIs

Every WI created by SDD MUST include a link to its source file in the repo.

| WI Type | Link to | Field |
|---------|---------|-------|
| Epic | intake.md | Description |
| Feature | intake.md | Description |
| Requirement | requirements.md | Description or Comment |
| Task (child) | tasks.md#task-N | Description |
| QA Task | test-plan.md (per type) | Description |
| Modelo de Datos | design.md#table-{name} | Description |
| Servicio | design.md#endpoint-{method}-{route} | Description |
| Estructuras de Datos | design.md#schema-{name} | Description |
| Test Plan | test-plan.md | Description |
| Test Case | test-cases.md#TC-NNN | Description |
| Bug | test-cases.md (failed TC) | Repro Steps |

Format: `{repo_url}/blob/dev/specs/{prefix}{ID}-{name}/{file}`
Where `repo_url` = from `.sdd-config.json` host field or git remote.

### Post-merge actions

After feature branch is merged to `dev` and deleted:

1. Parent WI: state → Resolved, comment: `Merged to dev via PR#{N}`
2. Spec file footers: update branch reference to `dev`

⚠️ Repo links in ADO WI Descriptions already point to `blob/dev/...` (set at creation time) — no link update needed.

Files in `specs/` survive the merge — links remain valid.

## Environment Promotion (dev → cert → prod)

> Para flujos GitHub + Vercel, ver `deployment-patterns.md`. Esta sección aplica cuando `host: azure-devops`.

Pipeline-driven with approval gates. No extra branches — environments are stages, not branches.

```
feature/* ──PR──→ dev ──gate──→ cert ──gate──→ prod
                   │              │              │
                Auto-deploy    QA valida     Release tag
                (CI/CD)       Smoke tests    vX.Y.Z
                              Approval gate  Approval gate

hotfix/*  ──PR──→ cert ──gate──→ prod ──→ cherry-pick back to dev
```

### Promotion Gates

| Promotion | Approver | Verifies | ADO State |
|---|---|---|---|
| dev → cert | Tech Lead / Developer | Tests pass, PR reviews done, no open WIs for sprint | WIs remain Resolved |
| cert → prod | Product Owner + QA | Smoke tests OK, regression OK, sign-off | WIs → Closed |
| hotfix cert → prod | Tech Lead (fast-track) | Fix verified, no side effects | Bug → Closed |

### Post-Promotion Actions

| Event | Action |
|---|---|
| Deployed to cert | Run smoke tests + regression suite. Tag: `cert-{date}` |
| Deployed to prod | Create release tag `vX.Y.Z`. WIs → Closed. Release notes generated (release-notes-writer) |
| Hotfix to prod | Cherry-pick commit back to `dev` to keep branches in sync |

### Rules

- ⚠️ NEVER deploy to prod without passing cert first (no dev → prod shortcuts)
- ⚠️ Hotfix skips dev but MUST be cherry-picked back after prod deploy
- ⚠️ Each gate requires EXPLICIT approval — auto-promotion is prohibited for cert → prod

## Custom Fields (CMMI)

Some CMMI processes have mandatory custom fields that vary by organization.

**Limitation**: ADO MCP (`get_work_item_type_fields`) returns `allowedValues: []` empty for custom picklists.

**Solution** (verified): 2 curl.exe calls per custom field:
1. `GET _apis/wit/fields/{fieldReferenceName}` → get `picklistId`
2. `GET _apis/work/processes/lists/{picklistId}` → get `items[]` = dropdown allowed values

**Auth**: `-u ":$PAT"` (raw PAT, curl handles base64 encoding)

⚠️ **Windows**: Always use `curl.exe` (not `curl`). PowerShell aliases `curl` to `Invoke-WebRequest` which breaks `-u` flag.

**Safe fields (always exist)**: Title, Description, Priority, Tags, State, Stack Rank, Area Path, Iteration Path
**Fields requiring discovery**: Acceptance Criteria, Impact Assessment, Custom.*

### ADO REST API — Investigation Endpoints

When field discovery finds `readOnly`, `SetByRule`, or unknown required fields, use these endpoints to investigate:

| Purpose | Endpoint | What it returns |
|---------|----------|-----------------|
| **List processes** | `GET _apis/work/processes?api-version=7.1` | All processes → get `processId` for your project |
| **List WI types in process** | `GET _apis/work/processes/{processId}/workitemtypes?api-version=7.1` | All WI types → get `witRefName` |
| **Get WI type fields** | `GET _apis/work/processes/{processId}/workItemTypes/{witRefName}/fields?api-version=7.1` | All fields with `readOnly`, `required`, `defaultValue` |
| **Get WI type rules** | `GET _apis/work/processes/{processId}/workItemTypes/{witRefName}/rules?api-version=7.1` | Rules: `SetByRule`, `MakeReadOnly`, `CopyValue`, conditions → reveals which fields feed computed fields like Title |
| **Get form layout** | `GET _apis/work/processes/{processId}/workItemTypes/{witRefName}/layout?api-version=7.1` | Pages, sections, groups, controls → reveals which custom fields are on the form and their order |
| **Get field metadata** | `GET _apis/wit/fields/{fieldReferenceName}?api-version=7.1` | Field type, `picklistId`, `isIdentity`, `readOnly` |
| **Get picklist values** | `GET _apis/work/processes/lists/{picklistId}?api-version=7.1` | `items[]` = allowed dropdown values |
| **Get WI type states** | `GET _apis/work/processes/{processId}/workItemTypes/{witRefName}/states?api-version=7.1` | Valid states with `stateCategory` (Proposed, InProgress, Completed, Removed) |
| **GUID to descriptor** | `GET https://vssps.dev.azure.com/{org}/_apis/graph/descriptors/{storageKey}?api-version=7.1-preview.1` | Converts group GUID (from rule condition) to descriptor string |
| **List group members** | `GET https://vssps.dev.azure.com/{org}/_apis/graph/Memberships/{descriptor}?direction=down&api-version=7.1-preview.1` | Array of `memberDescriptor` values |
| **Resolve member** | `GET https://vssps.dev.azure.com/{org}/_apis/graph/users/{memberDescriptor}?api-version=7.1-preview.1` | `displayName`, `mailAddress` |
| **Project team members** | `GET https://dev.azure.com/{org}/_apis/projects/{project}/teams/{project}%20Team/members?api-version=7.1` | Members of the project’s default team |

### Investigation flow for ReadOnly fields

When a WI creation fails with `ReadOnly, SetByRule, InvalidEmpty`:

```
1. Get processId     → GET _apis/work/processes
2. Get rules         → GET _apis/work/processes/{processId}/workItemTypes/{witRefName}/rules
3. Classify the rule → inspect actions[] and conditions[]:
```

**Case A — Computed field** (actions contain `setValueToField`):
```
4a. Extract sources → conditions show which Custom.* fields feed the title
5a. Get those fields → verify they exist in the WI type fields list
6a. Set source fields → pass them in wit_create_work_item, skip Title
7a. If sources missing → broken template. Inform user.
```

**Case B — Group permission** (actions contain `makeReadOnly` with group condition):
⚠️ PAT-level block — ADO checks PAT owner, NOT AssignedTo. API call is rejected regardless of assignee.
```
4b. Extract group    → conditions give group GUID (e.g. 031175ca-3691-...)
5b. GUID → descriptor → GET vssps.dev.azure.com/{org}/_apis/graph/descriptors/{GUID}
6b. List members     → GET graph/Memberships/{descriptor}?direction=down → resolve each
7b. Project members  → GET dev.azure.com/{org}/_apis/projects/{project}/teams/{project}%20Team/members
8b. Intersect        → show only users in BOTH group AND project
9b. If intersection empty → show ALL org-wide group members
10b. Present WI details → give user the Type, Parent, Title, Description
     so someone with access can create it manually in ADO
11b. Skip blocked WI → continue creating other WIs that CAN be created
12b. If query fails (PAT lacks vso.graph scope) → ask user who can create it
```

See work-item-setup §2b for the full field discovery checklist.

## SDD-Intakes (Inbox Project)

SDD-Intakes is a dedicated ADO project that serves as the inbox for all intakes created by the Copilot Agent. It is NOT the project where development happens — it is a staging area.

### Intake Lifecycle in SDD-Intakes

| Event | Action | Who |
|---|---|---|
| Stakeholder creates intake via Copilot | Create Epic in SDD-Intakes (Description in HTML), comment intake.md, tags: intake-pending | Copilot Agent |
| Intake confirmed | Update tags: intake-created (via Other Fields key-value) | Copilot Agent |
| Intake subsecuente (Epic exists) | Reuse Epic, comment intake.md (same name — versioning by branch: intake/{slug}-v{n}), comment "Intake subsecuente" | Copilot Agent |
| Analyst reviews intake | Read attachment, evaluate completeness | Analyst (IDE) |
| Analyst approves intake | Tag: intake-approved | Analyst |
| Analyst rutea to project destino | Create/link Epic in project destino, tag SDD-Intakes Epic: intake-routed | Analyst |
| Analyst rejects intake | Tag: intake-rejected, Comment: reason | Analyst |

### Ruteo Flow (Analyst)

When Analyst rutea an intake from SDD-Intakes to the project destino:

1. **Read** intake.md from comment on Epic in SDD-Intakes
2. **Determine** project destino based on area/project
3. **Create Epic** in project destino (or use existing if type=change/migration)
4. **Link** Epics: Epic destino ← relates to → Epic SDD-Intakes
5. **Create branch** in repo destino: `intake/{slug}` (new) or `intake/{slug}-v{n}` (subsecuente)
6. **Commit** `specs/{slug}/intake.md` to branch (filename ALWAYS intake.md — versioning is by branch, not filename)
7. **Tag** SDD-Intakes Epic: `intake-routed`
8. **Continue** SDD flow in project destino: reqs (EARS) → design → tasks → impl → test → PR

### Intake Type Behavior

| Type | Epic in project destino | Repo | Branch | SDD flow |
|---|---|---|---|---|
| new | Create new | Create new | intake/{slug} | Full lifecycle |
| change | Use existing | Use existing | intake/{slug}-v{n} | Incremental |
| migration | Use existing | Use existing | intake/{slug}-v{n} | Migration plan + rollback |

### Tags Reference

| Tag | Meaning | Set by | Cleared by |
|---|---|---|---|
| intake-pending | Epic created, pending confirmation | Copilot Agent | Copilot Agent (→ intake-created) |
| intake-created | Intake confirmed and attached | Copilot Agent | Analyst (→ intake-approved) |
| intake-approved | Analyst approved the intake | Analyst | Analyst (→ intake-routed) |
| intake-routed | Ruteado to project destino | Analyst | — (permanent) |
| intake-rejected | Analyst rejected the intake | Analyst | — (permanent) |
| new | Proyecto nuevo | Copilot Agent | — |
| change | Cambio a existente | Copilot Agent | — |
| migration | Migración | Copilot Agent | — |

## Test Execution in ADO (REST API)

The ADO MCP (`*testplan*` tools) can create Test Plans, Test Suites, and Test Cases with steps. But it **cannot** create Test Runs, update Test Results, or upload attachments. These require the ADO REST API via `curl.exe`.

### MCP Test Plans Tools

| Tool | Action | Purpose |
|------|--------|---------|
| `testplan_test_plan_write` | `create` | Create Test Plan |
| `testplan_test_suite_write` | `create` | Create Test Suite |
| `testplan_test_suite_write` | `add_test_cases` | Add TCs to Suite |
| `testplan_test_case_write` | `create` | Create TC with `steps` param (Markdown) |
| `testplan_test_case_write` | `update_steps` | Update TC steps with results ✅/❌ |

### REST API Endpoints (no MCP equivalent)

```bash
AUTH="-u :$AZURE_DEVOPS_PAT"
BASE="https://dev.azure.com/{org}/{project}/_apis"

# Create Test Run
curl.exe $AUTH -X POST "$BASE/test/Runs?api-version=7.1" \
  -H "Content-Type: application/json" \
  -d '{"name":"{prefix}{ID} - {type}","plan":{"id":{planId}},"automated":false,"state":"InProgress"}'

# Update Test Run Results
curl.exe $AUTH -X PATCH "$BASE/test/Runs/{runId}/Results?api-version=7.1" \
  -H "Content-Type: application/json" \
  -d '[{"testCase":{"id":{tcId}},"outcome":"Passed","state":"Completed"}]'

# Upload attachment to Test Result
curl.exe $AUTH -X POST "$BASE/test/Runs/{runId}/Results/{resultId}/attachments?api-version=7.1" \
  -H "Content-Type: application/json" \
  -d '{"attachmentType":"GeneralAttachment","fileName":"TC-001-step-1.png","stream":"{base64}"}'
```

⚠️ **Windows**: ALWAYS `curl.exe`, NEVER `curl` (PowerShell aliases to `Invoke-WebRequest`).
⚠️ **Auth**: `-u ":$PAT"` — raw PAT, curl handles base64 encoding.

### Correct Test Execution Flow (NOT just wit_update_work_item)

❌ **WRONG** (what agents typically do):
- `wit_update_work_item` → add result to Description → add comment → done

✅ **CORRECT** (full execution):
1. `testplan_test_case_write` → `create` with `steps` (each step + expected result)
2. `testplan_test_case_write` → `update_steps` with step results ✅/❌ per step
3. `POST _apis/test/Runs` → create Test Run
4. `PATCH _apis/test/Runs/{id}/Results` → update outcome per TC
5. `POST _apis/test/Runs/{id}/Results/{rid}/attachments` → upload screenshots per step
6. `wit_update_work_item` → state = Passed|Failed|Blocked (change the STATE, not just Description)

---

## Bug Fix Protocol (developer receives bug)

> A bug is NOT fixed until there is evidence that (1) the root cause is fixed, (2) nothing else broke, (3) the fix is visible in the target environment. The agent NEVER declares "fixed" from reasoning alone. Evidence goes in `bugfix.md` and is copied to the PR body.

When a Bug WI is assigned (via `Responsables.Desarrollo`), follow these phases in order. `design.md` and `tasks.md` are NOT generated (a bug is a direct fix).

### Phase 1 — Investigate (before touching code)

1. **Read the Bug WI** via azure-devops MCP (verify `System.WorkItemType = 'Bug'`): title, description, repro steps, expected vs actual, severity, attachments, and ALL linked child WIs (Modelo de Datos, Servicio, Estructuras de Datos, parent HU).
2. **Memory** (server-memory): `Correction` and `Decision`/`Convention` entities for the module.
3. **Code** (codebase-memory): `search_code` / `search_graph` for the failing behavior → `get_code_snippet`. Not grep, not whole files. `sequential-thinking` if the bug spans services.
4. **Git history** of the affected files: `git log --oneline -15 -- <file>`, `git log --all --oneline --grep="<keyword>"`, `git blame -L <start>,<end> <file>`. Did a recent commit introduce it? If yes, link the original WI.
5. **Similar resolved bugs** (azure-devops): same module, state done → read how they were fixed.

If the root cause is NOT clear → STOP. Ask for logs, screenshots or data, or propose a diagnostic step. Never guess.

### Phase 2 — Reproduce first

- Write a **failing test** that reproduces the bug BEFORE the fix (logic/backend: unit or integration; UI: Playwright if E2E infra exists). Run it and confirm it fails for the right reason.
- Cannot reproduce → STOP and ask. NEVER fix blind.
- No test infrastructure → document the manual repro steps executed and flag "no automated test infra" as a risk.

### Phase 3 — Impact and approval gate

1. `trace_path(function_name=<fn to change>, direction="inbound")` → every caller. Outbound too if return types, side effects or shared state change.
2. List shared code (utils, hooks, services, queries, stored procedures, shared components) and the affected screens.
3. Risk level:
   - **BAJO**: local change, 0–2 callers, no shared state.
   - **MEDIO**: 3+ callers, shared utility, or DB query change.
   - **ALTO**: shared core logic, auth, calculations, money, data migration, or 10+ callers → needs explicit human acknowledgment.
4. **PROPOSE once, wait for approval**, with: branch `fix/AB#id-description-kebab-case`, root cause (`file:line`), origin (commit/PR or "pre-existing"), related bugs, applicable memory, callers and risk, regression plan, and the diff.

```
🔍 Análisis — AB#XXXX
Síntoma: ...   Causa raíz: file:line, logic   Origen: commit/PR o "pre-existing"
Bugs relacionados: AB#YYYY   Memoria aplicable: ...
⚠️ Impacto: función a cambiar, callers [N] → módulos/pantallas, riesgo BAJO/MEDIO/ALTO, plan de regresión
```

**Fast path:** risk BAJO with severity Minor skips the inbound trace report, the local smoke test and Phase 7; the repro test, the module's suite and the acceptance criteria still apply.

### Phase 4 — Fix (minimal and scoped)

1. Create the branch and move the WI to `En construcción` (agent-allowed).
2. Generate `bugfix.md` from `specs/_templates/bugfix-template.md`.
3. Fix the ROOT CAUSE, not the symptom. Minimal diff: no refactoring of unrelated code, no behavior change in callers that are not part of the bug. If the correct fix changes functional behavior → STOP and ask the human (functional change, not a bug fix).
4. Implement with approval per file.

### Phase 5 — Verify (proportional to risk)

| Check | When required |
|-------|---------------|
| Phase 2 test now PASSES | ALWAYS |
| Existing suite of the affected module passes; lint and type-check pass | ALWAYS |
| Acceptance criteria of the WI / parent HU validated ("no error" is NOT "correct") | ALWAYS |
| Tests covering each caller from Phase 3 (new ones if a caller has none) | MEDIO or ALTO |
| **Local smoke test** with Playwright (below) | UI bug, or UI impact with MEDIO/ALTO |
| Playwright E2E following the repro steps | UI bug, or ALTO with UI impact (if E2E infra exists) |
| Full test suite | ALTO |

Any failed check → back to Phase 4. NEVER propose the PR with failing checks.

**Local smoke test** (does not replace DEV/CERT verification: local cannot see missing migrations, env vars or flags):
1. Config from `.sdd-config.json` → `environments.local` (`url`, `start_command`). If absent, detect from the stack (`package.json` scripts, framework default ports, `docker-compose.yml`), PROPOSE the values and wait for confirmation.
2. If the URL already responds, reuse it; never start a second instance. Otherwise start the app in the background and wait until it responds (~120 s). If it does not start, report the error and stop.
3. Playwright against the local URL: the repro steps no longer fail, the expected behavior is correct, each affected screen from Phase 3 still works. Capture a screenshot.
4. Stop the app only if the agent started it. Use seed/test data; NEVER point the local app to CERT or PROD databases.
5. If it cannot run locally (missing secrets, external dependencies), flag "local smoke test not possible: [reason]" in the evidence.

### Phase 6 — Evidence and PR

Fill the evidence in `bugfix.md` (Root Cause, Regression Risk, Tests Added, Verification, Deployment). Copy this summary to the PR body:

```
## 🐛 Bug Fix Evidence — AB#XXXX
**Causa raíz:** ...  **Origen:** commit/PR o "pre-existing"
**Reproducción:** ✅ [test] — failed before, passes after
**Impacto revisado:** [N callers] — [modules] · Riesgo: BAJO/MEDIO/ALTO
**Tests:** unit/integración [N/N] · regresión (callers) [N] o n/a · E2E [scenario] o n/a o sin infra (riesgo) · smoke local ✅ [url, screens] o n/a o no posible: [reason]
**Criterios de aceptación validados:** [list]
**Requisitos de despliegue:** migrations / env vars / feature flags / cache / none
**Riesgos conocidos:** [list o "ninguno"]
```

Any ⚠️ or "sin infra" item must be acknowledged by the human. Then **PROPOSE** creating the PR and moving the WI → wait for approval → create the PR (azure-devops MCP, linked to the Bug WI) → move the WI to `Pendiente de Pruebas SQA` (agent-allowed, only after the PR exists).

### Phase 7 — Deployment verification ("fixed but I don't see it")

Correct code is not enough: verify in EACH environment the fix reaches. Branches and URLs come from `.sdd-config.json` → `environments` (`local`, `dev`, `cert`, `prod`, each with `branch` and `url`); promotion rules are in `environment-strategy.md`. If a URL is empty, skip the smoke test and flag "no environment URL configured".

For DEV (after the PR merges to `develop`) and for CERT (after the release merges):
1. PR merged, not just created. `git branch -r --contains <fix-commit>` includes the environment's branch.
2. The pipeline for that environment ran and succeeded after the merge.
3. Deploy requirements from Phase 6 applied in THAT environment (migrations, env vars/secrets, feature flags, reference data, cache/CDN). Environment parity is the most common cause of "works in DEV, not in CERT".
4. UI bug with a known URL → Playwright check of the fixed scenario there.
5. Report "AB#XXXX verified in DEV" / "verified in CERT — ready for QA validation".

If any step fails, report exactly which step and environment. NEVER say "it should be there". PROD follows its own flow; the agent never closes the WI.

### Phase 8 — Learn

Write to server-memory only a `Correction` when the bug was a regression (link the original change and why it broke) or when QA reopens it. Resolved point fixes are NOT stored: the commit/PR is the record (see `tool-protocol.md`).

When QA **reopens** a bug (`Pendiente de Pruebas SQA → En construcción`): read the QA comment, write the `Correction` (what the previous fix missed), restart from Phase 1 — do NOT patch on top of the previous fix without re-analysis — and re-read related `Correction` entities first.

### The agent NEVER

- declares "fixed" without the Phase 6 evidence;
- fixes without reproducing (or without flagging that it could not);
- skips impact analysis because "the change is small" (BAJO/Minor has the fast path above);
- uses grep to find callers when codebase-memory is available;
- says "ready for QA" without Phase 7 verification;
- patches a reopened bug without restarting from Phase 1;
- mixes refactoring with a bug fix.

---

## Agent-Allowed Transitions (CMMI Custom - Unipago)

The agent (developer) can ONLY perform these state transitions:

| From | To | When |
|------|----|------|
| `Pendiente de realizar la solución` | `En construcción` | Starting work (creating branch) |
| `En construcción` | `Pendiente de Pruebas SQA` | PR created, fix ready for QA |
| `Pendiente de Pruebas SQA` | `En construcción` | QA rejects (back to dev for fixes) |

The agent NEVER performs these transitions:

| To | Who | Reason |
|----|------|--------|
| `Cerrado` | QA/Lead only | PR approved and merged |
| `En pruebas` | QA only | QA picks up the PR |
| `Detenido` | Human only | Work paused (any state) |
| `Cancelado` | Human only | Work cancelled |

⚠️ The agent NEVER moves a WI to `Pendiente de Pruebas SQA` without the PR being created first.

---

## Linked WIs Context

When investigating a Bug or implementing a Feature, the agent MUST read ALL linked child WIs for full business context:

| WI Type | What it provides | Example |
|---------|-----------------|---------|
| **Modelo de Datos** | Data model: campos, tipos, relaciones, constraints | `MD: USUARIO` — campos: codigo, nombre, estado, fechaCreacion |
| **Servicio** | Backend service contracts: SOAP operations, WSDL endpoints | `Servicio: GestionUsuarioTS` — operación 285: COMPLETAR ALTA DE USUARIO |
| **Estructuras de Datos** | Data structures: DTOs, request/response schemas | `ED: SolicitudCreacionUsuario` — campos: contactoId, tipoUsuario, gruposRol[] |

This context complements codebase-memory:
- **codebase-memory** → code structure (functions, classes, call graph)
- **Linked WIs** → business structure (data models, service contracts, business rules)

⚠️ If a Bug/Feature has no linked child WIs, proceed with codebase-memory only. Do NOT block.
