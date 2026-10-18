# Precheck

Run steps 1→5 **in strict order** at conversation start. Do NOT skip ahead.

## ⛔ HARD RULES

1. **NEVER show tool output.** No JSON, no raw entities, no MCP responses.
2. **NEVER expose internal state.** Examples of violations:
   - ❌ "project_type está vacío" / "product.md sin completar" / ".sdd-config.json dice..."
   - ✅ "Proyecto sin configurar. ¿De qué trata?"
3. **Steps IN ORDER.** Complete step 3 before step 4.
4. **Respect `verbosity`** from `.sdd-config.json`:
   - `detailed` → show step results, ask before health check
   - `brief` → run ALL silently, auto-run health check, NO health check report. First visible output = question from step 4/5 or router. MAX 2 lines.
5. **Windows PowerShell:** Use `;` not `&&`.
6. **NEVER call `list_commands` or `list_tools` on any MCP.** Returns thousands of tokens. Use `list_servers` or one cheap operation per server.
7. **NEVER assume MCP availability from tool listings.** You MUST execute an actual call (e.g., `core_list_projects`) to verify. Reading tool names ≠ testing connectivity.

---

## Step 1 — Memory (silent)

If `server-memory` available: `read_graph` → internal only. Filter by `project:` matching current project. No match → proceed.

→ Store loaded entities in session context. Powers MUST check these entities BEFORE re-reading files for:
   - **Decisions** → skip re-reading architecture docs if decision already cached
   - **Conventions** → skip re-reading coding-standards.md if conventions already cached
   - **Corrections** → apply prior corrections without re-reading the source

### ⛔ Memory is the source of truth for PROJECT STATE

Memory is NOT just a token-saving cache. Among the loaded entities, identify **state entities** — those describing what has been done, the current phase, and what remains. Recognize them by name or content:
   - Names matching `*-status`, `*-progress`, `*-pending-work`, `*plan*`, `completion-tracking`, `*-lifecycle`, `*-next-steps`
   - Observations containing `phase:`, `next:`, `next-step`, `pending`, `completed`, `próximos pasos`

These state entities are the **primary truth** for:
   - **What was already done** — completed tasks, merged PRs, deployed infra, ported services
   - **Current phase** — where the project actually is in the lifecycle
   - **Next steps** — derive the 📍 and proposed next actions FROM these entities, not by inferring from git/filesystem

⛔ **NEVER propose as a "next step" or "pending" anything that a state entity marks as completed.** Git/FS describes what physically exists in the tree right NOW; memory describes what was done and what comes next. When you have not read memory yet, do NOT infer project phase or next steps from branch names, commit history, or file scans alone.

### Memory health — suggest cleanup when the graph is bloated (once per session)

While the graph is loaded, assess its health for the current project. If it looks bloated with **ephemeral execution history that already lives in git** — as a soft guide, roughly 40+ project entities AND a noticeable share of `task_completion` / `task` / `lifecycle_position` / `checkpoint` / `progress` / `milestone` for already-merged work — surface a ONE-LINE, non-blocking suggestion in the opening message (respect `verbosity`; skip entirely in `brief` unless clearly extreme):

> 💡 La memoria del proyecto acumuló bastante historial que ya vive en git. Puedo hacer una limpieza segura cuando quieras — decime "limpia la memoria".

Rules: suggest at most ONCE per session. NEVER auto-delete — this is only an offer. If the user accepts, follow the `### Memory Cleanup` flow in `tool-protocol.md` (classify → show → approve → delete). A healthy graph → say nothing.

### Step 1c — Reconcile memory ↔ git/FS (silent)

Git/FS is the source of truth for **what physically exists in the tree now** (files, commits, branches). Memory is the source of truth for **what was done / phase / next steps**. They complement each other — they are not rivals.

If git/FS appears to CONTRADICT a state entity (e.g., memory says "BackendStack done" but you are about to re-propose it):
   1. Do NOT silently trust git over memory, and do NOT re-propose the item as pending.
   2. **Reconcile explicitly** to the user in one line, respecting `verbosity` and the HARD RULES (never dump raw entities): e.g. "Memoria registra X como hecho; git lo confirma (commit Y)." or, if genuinely divergent, "Memoria dice X hecho pero no lo veo en el árbol — ¿lo revirtieron?".
   3. Only after reconciling may you treat the item as pending — and only with a stated reason.

This reconciliation is silent in `brief` mode unless a real divergence is found (then surface it in ≤2 lines).

If `codebase-memory` available and indexed: note `codebase_indexed: true` in session context. Powers SHOULD use `search_code`/`search_graph`/`get_architecture` instead of reading source files directly.

### Step 1b — codebase-memory availability (silent, global)

codebase-memory is configured by `codebase-memory-mcp install` in the **global** IDE config (not project-level). SDD sync does NOT include it in the project MCP.

⚠️ **NEVER use glob to detect `.codebase-memory/`** — the directory may be gitignored, causing false negatives. Always use the API (`list_projects`) as the primary check.

| Step | Method | Condition | Action |
|---|---|---|---|
| 1 | Call `list_projects` (API) | Fails or tool not available | ⚠️ Show: "💡 codebase-memory no instalado. Knowledge graph + impact analysis deshabilitados. Instalar: `npm i -g codebase-memory-mcp && codebase-memory-mcp install && codebase-memory-mcp config set auto_index true`" — proceed without it |
| 2 | `list_projects` response | Project IS listed | ✅ `codebase_indexed: true`. Check step 3 for artifact. |
| 3 | `Test-Path .codebase-memory/graph.db.zst` (NOT glob) | Artifact exists | ✅ Bootstrap from artifact (fast, no re-index). Proceed. |
| 3 | Same check | Artifact missing | Index in cache but not persisted. Run `index_repository` with `persistence: true` to persist artifact. Proceed. |
| 4 | `list_projects` response | Project NOT listed | First time — run `index_repository` with `persistence: true` to index + persist. Note `codebase_indexed: true`. |

## Step 2 — Git identity (ALWAYS ask if empty, ignore verbosity)

Check `git config user.email`:

| Result | Action |
|---|---|
| Email is set | Skip silently. Do nothing. |
| Email is empty | 1. Ask user for name + email 2. `git config user.name "Name"` 3. `git config user.email "email"` 4. Run `sdd-sync.sh --refresh` (regenerates MCP config with new identity). Do NOT test ADO here — Step 3 handles it after MCP reloads. |

## Step 3 — MCP health check

Search memory for `mcp_healthcheck_last` with `project:` match.

| Condition | Action |
|---|---|
| No entity / no project match | ASK (detailed) or auto-run (brief) |
| Entity < 24h | Skip silently |
| Entity > 24h | ASK (detailed) or auto-run (brief) |

**How to test (choose ONE path):**

**Path A — lazy-mcp proxy detected:**
1. Call `lazy-mcp` → `list_servers`. This returns all available servers.
2. **Smoke-test critical servers** (via `invoke_command` through lazy-mcp):
   - `server-memory` → `read_graph` (already done in step 1)
   - `azure-devops` → `core_list_projects` — if fails, mark `ado_available: false`
   - If `ado_available: true` → check `.sdd-config.json` `AZURE_DEVOPS_PROJECT`. If empty → ASK user.
3. Mark remaining servers as OK (they only need proxy listing).
4. **Do NOT call `list_commands` or `list_tools`.**

**Path B — no proxy (direct MCP connections):**
1. `server-memory` → `read_graph` (already done in step 1)
2. `azure-devops` → `core_list_projects` (exact command name) — if fails, mark `ado_available: false`
3. If `ado_available: true` → read `.sdd-config.json` field `AZURE_DEVOPS_PROJECT`. If empty → ASK: "¿En qué proyecto de ADO trabajamos?" Save response to config.
4. `sequential-thinking` → `sequentialthinking` with thought:"test"
4. Others: one cheap call each. Retry once on failure.

**After health check (ALWAYS, both modes):**
1. Save to memory via `lazy-mcp` → `invoke_command`:
   ```json
   { "server": "server-memory", "command_name": "create_entities",
     "parameters": {
       "entities": [{ "name": "mcp_healthcheck_last", "entityType": "health_check",
         "observations": ["project:PROJECT_NAME", "date:ISO8601", "result:X OK, Y error", "errors:list"] }]
     }
   }
   ```
   ⚠️ With lazy-mcp: all tool inputs go inside `parameters`, NOT `arguments`.
2. Report to user (detailed only): "Health check: X OK, Y error". Brief = no report.

Then step 4. Do NOT query ADO items here.

## Step 4 — Project type (silent if set)

If `project_type` set AND `product.md` exists AND is NOT a placeholder → skip.
A product.md is a **placeholder** if it contains "⚠️ This is a placeholder" OR has < 50 lines. Treat placeholders as missing → trigger scanner.

⚠️ **Product initialization gate** — if `product.md` is placeholder:

| Condition | Action |
|-----------|--------|
| `intake.md` exists AND approved (`- [x]`) | **Auto-poblar** product.md desde intake (nombre, propósito, audiencia, alcance, tech stack) + actualizar `.sdd-config.json` (project_type, project_name, stacks) → continuar |
| `intake.md` exists AND not approved (`- [ ]`) | 🚫 BLOCK: "Aprobá intake.md primero → luego product.md se configura automáticamente" |
| No `intake.md` + code exists (`src/`, `package.json`, etc.) | 🚫 BLOCK: "Ejecutá project-scanner — detectó código existente" |
| No `intake.md` + no code | 🚫 BLOCK: "Ejecutá project-initializer (nuevo) o traé el intake de SDD-Intakes" |

This is a HARD BLOCK — even if the user gives a direct instruction (e.g., "busca el intake", "crea requirements"), do NOT proceed with other powers until product.md is configured. After initialization completes → re-run this step → then proceed.

**Intake type → project_type mapping (MANDATORY when auto-poblando from intake):**

| Intake Type field | → project_type | → product.md Type |
|---|---|---|
| new project | `new` | new |
| change to existing | `existing` | existing |
| migration | `migration` | migration |
| new module | `existing` | existing |
| regulatory | `existing` | existing |

⚠️ `project_type` solo acepta: `"new"` | `"existing"` | `"migration"`. NUNCA uses el intake type literal (e.g., "change", "regulatory") como `project_type`. El intake type "change to existing" → `project_type: "existing"` con requirements incrementales.

If `project_type` empty, **auto-detect** (do NOT ask):

| Detection | Delegate to |
|-----------|------------|
| No code (no package.json, pom.xml, src/, etc.) | `project-initializer` → project_type=new |
| Code exists | `project-scanner` → project_type=existing. Scanner may SUGGEST migration if EOL detected (user decides). |

Scanner handles version comparison + EOL check. If 🔀 detected → scanner asks user "migration, upgrade, or keep?". NEVER auto-assigns migration.

## Step 5 — Readiness

| project_type | Check | If missing |
|---|---|---|
| new | product.md (+ stacks for dev) | → project-initializer |
| existing | stacks populated | → project-scanner |
| migration | stacks + migration.from/to | → project-scanner |

### Stack file sync check

After verifying `.sdd-config.json` has `stacks[]`, verify the **SDD skills** were synced to the IDE folder:

| IDE | Check for |
|---|---|
| Kiro | `.agents/skills/` contains skills (any `.md` beyond defaults) |
| Antigravity | `.agents/skills/` contains skill directories (e.g., `tech/SKILL.md`) |

The `sdd-sync.sh` script generates individual skill directories (e.g., `tech/`, `testing-jest/`, `structure/`), NOT monolithic `stack-{name}.md` files.

If `.sdd-config.json` has stacks but no skill directories exist → **BLOCK**:
```
⚠️ Skills de stacks no encontrados. Corre: bash sdd-sync.sh --ide [tu-ide] para sincronizar.
```
Do NOT proceed to router until skill files are present. This prevents working without stack context after cloning or switching IDEs.

## After all steps → Router

Hand off to `workflow-router.md` silently. No summary, no "all checks passed". If user says "precheck" → force re-run.
