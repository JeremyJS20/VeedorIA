---
name: "QA Strategy"
description: "quality gates, acceptance criteria, test coverage targets"
---

# QA Strategy

## Philosophy
| Principle | Detail |
|-----------|--------|
| Shift-left | Test plan BEFORE code; QA part of SDD cycle |
| EARS coverage | Each EARS requirement → ≥1 test case |
| Human leads | Agent NEVER marks "QA passed" without human approval |
| Human-only | Severity, prioritization, sign-off EXCLUSIVELY human |

## Testing Pyramid
1. **Unit** (70%) — alongside code
2. **Integration/API** (20%) — contracts, endpoints, flows
3. **E2E** (10%) — critical flows via Playwright

## EARS → Test Strategy
| Pattern | Strategy |
|---|---|
| Ubiquitous ("shall") | Functional test |
| Event-Driven ("when…shall") | Integration — simulate event |
| State-Driven ("while…shall") | State — verify per state |
| Unwanted ("if…then shall") | Negative/edge case |
| Optional ("where…shall") | Config — on/off |

## Test Types & Gates
| Type | Gate | DEV/QA | CERT | PROD | Tools |
|------|------|:------:|:----:|:----:|-------|
| Func E2E | 🔴 | 🔴 | 🔴 | — | |
| Visual Reg | 🟡 | 🟡 | 🟡 | — | |
| A11y | 🟡 | 🟡 | 🟡 | — | |
| API Test | 🔴 | 🔴 | 🔴 | — | |
| Perf Web | 🟢 | 🟢 | 🟡 | — | Lighthouse CI |
| Perf API | 🟢 | 🟢 | 🟡 | — | k6 (Grafana) · Alt: clinic.js (Node profiling), Scalene (Python profiling) |
| SAST | 🔴 | 🔴 | 🔴 | — | |
| Smoke | 🔴 | 🔴 | 🔴 | 🔴 | |
| Cross-browser | 🟢 | 🟢 | 🟢 | — | |
| Contract | 🟡 | 🟡 | 🟡 | — | |
| SEO | 🟢 | 🟢 | 🟢 | — | |
| Dep Audit | 🔴 | 🔴 | 🔴 | — | |
| API Sec | 🟡 | 🟡 | 🟡 | — | |
| Device Testing | 🟢 | 🟡 | — | — | Physical device + emulator testing for mobile apps |
| Mobile Perf | 🟢 | 🟡 | — | — | Startup time, memory, battery, FPS |
| Offline Mode | 🟢 | 🟡 | — | — | Connectivity loss, data sync, queue retry |
| Deep Links | 🟢 | 🟡 | — | — | Universal Links (iOS) + App Links (Android) |
| Push Notif | 🟢 | 🟡 | — | — | FCM delivery, foreground/background handling |

🔴 Blocking | 🟡 Justify | 🟢 QA decides · Tools → `references/qa-test-suite.md`

## Selection
1. Step 3 (Test Plan): determine types → QA approves · Step 5: execute (can expand)
2. All results require human QA approval

## Definition of Done

### QA
- [ ] Acceptance criteria have linked test cases
- [ ] Unit tests with coverage ≥ 80%
- [ ] E2E tests for critical flows pass
- [ ] A11y scan with no critical/serious violations
- [ ] API tests pass (if applicable)
- [ ] Test results in Azure DevOps Test Plans
- [ ] No open blocker/critical bugs

### Requirement
- [ ] Acceptance criteria defined (EARS)
- [ ] Estimated in story points
- [ ] Assigned to sprint

### Task
- [ ] Code implemented and reviewed
- [ ] Unit tests with coverage ≥ 80%
- [ ] PR approved and merged

### Bug
- [ ] Root cause identified
- [ ] Fix implemented with regression test
- [ ] Verified by QA

## Traceability
Each test → EARS ID (REQ-XXX) + tracker ID ({prefix}ID) + type.

## Rules
- QA defines final classification per feature
- Can promote optional to mandatory
- Can justify exclusion of recommended
- Tests in PROD: ONLY smoke post-deploy
- NEVER run destructive tests in PROD

## References
- Test implementation → `testing-strategy.md`
- Environments → `environment-strategy.md`
- Azure DevOps → `azure-devops-workflow.md`
