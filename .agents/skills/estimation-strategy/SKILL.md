---
name: "Estimation Strategy"
description: "Centralized estimation rules for all SDD powers. Calibrated with real data."
---

# Estimation Strategy

> Single source of truth for estimation rules. All powers that estimate effort MUST reference this file.
> 
> Updated: Sep 2026. Calibrated with real data: 8 features, 64 tasks, 173.5h estimated → 20.3h real (ratio 0.12x).

## Base Rules

- Maximum **4 hours** per task (break larger into subtasks)
- Estimates include: implementation + unit tests + code review + **verification** (reviewing AI output)
- If a task exceeds 4h during implementation → split immediately
- Add **20% buffer** to total estimate for unknowns
- Track actual vs estimated for future velocity calibration
- Story points map to hours: 1 pt ≈ 2-4h depending on team calibration

## Estimation Table

Calibrated with real data from Unipago (Sep 2026): 8 features, 64 tasks implemented with SDD + Claude Code. Ratio promedio: **0.12x** (range 0.05x-0.20x).

| Task Type | AI Multiplier | Effective Time | Notes |
|---|---|---|---|
| Requirements + design | 0.15x | ~0.5-1h | Agent fills templates, proposes REQs from scan |
| Simple CRUD screen | 0.12x | ~0.5-1h | Agent generates full component + API |
| Medium screen | 0.12x | ~1-2h | Agent scaffolds, human adjusts business logic |
| Complex screen | 0.15x | ~2-4h | Agent helps structure, human owns logic |
| API endpoint (REST) | 0.10x | ~0.2-0.5h | Agent generates route + controller + types |
| API endpoint (SOAP/BFF) | 0.10x | ~0.3-0.5h | Adapter boilerplate, mapping needs review |
| DB schema + migration | 0.10x | ~0.2-0.3h | Agent generates from design.md entities |
| Tests | 0.10x | ~10% of impl | Agent generates test scaffolding + fixtures |
| CI/CD pipeline | 0.12x | ~0.5-1h | Agent generates from deployment pattern |
| Code review | 0.15x | ~10% of impl | Agent pre-reviews, human validates |

> **First feature**: use 0.15x (setup overhead, no reuse). **Subsequent features**: use 0.10x (reuse of patterns, mocks, components).

> ⚠️ What AI does NOT accelerate (keep at 1.0x):
> - Business logic analysis and extraction from legacy code
> - Stakeholder validation and UAT
> - Integration testing against legacy/external systems
> - Cutover planning and execution
> - Security audits and compliance review
> - Performance tuning under production load
> - Debugging production-only issues (environment-specific, data-dependent)
> - Third-party API integration troubleshooting

**Team composition**: Full-stack per feature. One dev generates component + endpoint in the same session. Use fewer, more senior full-stack devs.

## Architecture Variant Impact

Architecture choices directly affect effort. Estimate MUST account for which variant is chosen.

### Frontend + BFF (Backend-for-Frontend)

Two separate codebases — React/Angular frontend + Node/Express BFF that wraps legacy APIs.

| Impact | Multiplier | Why |
|---|---|---|
| API layer effort | 1.5x | Every endpoint needs BFF mapping + frontend call |
| Infrastructure | 1.3x | Two deployments, two pipelines, two monitoring |
| Testing | 1.4x | Integration tests for frontend↔BFF + BFF↔legacy |
| Coordination | 1.2x | API contract management between layers |

**When to use**: Legacy APIs are SOAP/XML, need transformation, auth gateway, or API aggregation.

### Frontend-Only with API Proxy

Single codebase — framework handles API proxying to legacy services.

| Impact | Multiplier | Why |
|---|---|---|
| API layer effort | 0.7x | No separate BFF — proxy config only |
| Infrastructure | 0.8x | Single deployment |
| Testing | 0.8x | Only frontend↔legacy integration |
| Coordination | 0.9x | No API contract management |

**When to use**: Legacy APIs are already REST/JSON, minimal transformation needed.

### Full-Stack Framework (Next.js/Nuxt SSR)

Server components call legacy APIs directly — no separate API layer.

| Impact | Multiplier | Why |
|---|---|---|
| API layer effort | 0.5x | Server components ARE the API layer |
| Infrastructure | 0.7x | Single deployment, SSR handles everything |
| Testing | 0.9x | Server component testing adds complexity |
| Coordination | 0.7x | Monolithic — no cross-service coordination |

**When to use**: Greenfield or migration where you control the full stack.

## Migration-Specific Estimation

For `project_type = "migration"`, additional factors apply.

### Complexity Classification

| Complexity | Criteria | Effort |
|---|---|---|
| 🟢 Simple | < 100 lines, no business logic | 0.15 days |
| 🟡 Medium | 100–300 lines, some logic | 0.5-1 days |
| 🔴 Complex | 300+ lines, embedded business logic | 2-3.5 days |

### Migration Estimation Formula

```
Total effort = Σ (items × complexity_effort × architecture_multiplier × ai_multiplier) + fixed_overhead

Where:
  fixed_overhead = infrastructure setup + CI/CD + cutover + UAT + verification
  architecture_multiplier = from §Architecture Variant Impact
  ai_multiplier = from §Estimation Table
  verification = 15-25% of AI-generated implementation time
```

### Migration Factor

> In a migration, analysis is NOT discovery — it's documentation of what already exists.

**Available reference sources** (check which apply):
- Source code (XHTML, JSP, forms, managed beans, controllers)
- Existing requirements/specs (ADO work items, Jira, wiki)
- Existing test cases (manual or automated)
- WSDL/API contracts (for integration mapping)
- User documentation, FAQs, training materials

#### Migration Factor by Role and Complexity

| Role | Task | Factor | Justification |
|---|---|---|---|
| **Analyst** | Requirements (screens) | ×0.2 | AI generates specs from source code + existing reqs |
| **Analyst** | Overhead (UAT, docs) | ×0.7 | UAT faster with existing acceptance criteria |
| **Developer** | 🟢 Simple screens | ×0.4 | AI auto-generates from source, dev verifies |
| **Developer** | 🟡 Medium screens | ×0.55 | AI generates structure + logic, dev adjusts |
| **Developer** | 🔴 Complex screens | ×0.75 | Complex logic, but source documents behavior |
| **Developer** | Overhead (setup, BFF, CI/CD) | ×0.85 | Scaffolded from existing contracts + docs |
| **QA** | Test cases (screens) | ×0.3 | Migrate existing test cases, adapt format + verify parity |
| **QA** | Overhead (regression, UAT) | ×0.65 | Baseline data + existing test plans available |

**Expected total reduction**: ×0.5 – ×0.6 (40-50% less effort than greenfield equivalent)

> ⚠️ The Migration Factor stacks WITH AI multipliers. Formula:
> `Effective = Base × Migration_Factor × AI_Multiplier × Architecture_Multiplier`

## Sprint Capacity

```
Sprint Capacity = Team Size × Sprint Days × Availability% × Velocity Factor

Where:
  Team Size       = Number of team members
  Sprint Days     = Working days in sprint (typically 10)
  Availability%   = Account for PTO, holidays, meetings (typically 80%)
  Velocity Factor = Average story points per person-day (from historical data)
```

**Agentic tooling adjustment**: apply **1.5x–1.8x** multiplier on Velocity Factor. Does NOT apply to sprints focused on business analysis, UAT, or manual testing.

## Calibration

After each sprint, track:

| Metric | Formula | Target | Action if off-target |
|---|---|---|---|
| Estimation accuracy | actual_hours / estimated_hours | 0.8–1.2 | Recalibrate multipliers |
| Velocity trend | story_points_completed per sprint | Stable ± 15% | Check team changes or scope creep |
| AI effectiveness | manual_estimate / actual_with_AI | > 1.7x | Verify AI tool adoption |
| Verification ratio | verification_hours / total_hours | 15-25% | If > 30%, AI quality issues; if < 10%, insufficient review |

Store in `server-memory` as `estimation_calibration_{sprint}` for trend analysis.
