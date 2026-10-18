---
name: Environment Strategy
description: dev/cert/prod promotion rules and environment config
---

# Environment Strategy

For testing types and classification by environment, see `qa-strategy.md`.

## Environments

| Environment | Purpose | Deploy | Approval Gate |
|-------------|---------|--------|---------------|
| **DEV/QA** | Development + full testing | Auto (push to branch) | — |
| **CERT** | Pre-production, final validation | Manual trigger | Dev + QA |
| **PROD** | Production | Manual trigger | Dev + QA + BA |

## Promotion Pipeline

El flujo depende de `host` + `deployment.pattern` en `.sdd-config.json`. Ver `deployment-patterns.md` para flujos detallados.

| host + pattern | CI | CD Frontend | CD Backend/Infra |
|---|---|---|---|
| ADO + cualquiera | Azure Pipelines | Pipeline stages | Pipeline stages |
| GitHub + fullstack-vercel | GH Actions | **Vercel Git integration** (auto) | GH Actions → AWS CDK |
| GitHub + monorepo-split | GH Actions | **Vercel Git integration** (root: frontend/) | GH Actions → AWS CDK |
| GitHub + backend-only | GH Actions | N/A | GH Actions → AWS CDK |

> Vercel deploy es automático por Git — NO pasa por GH Actions.

## Rules
- For QA classification and promotion rules, see qa-strategy.md.

## Infrastructure as Code (CDK) Deployment

### Branch → Environment → AWS Account mapping
| Branch | Environment | Deploy | CDK Command |
|--------|-------------|--------|-------------|
| `dev`/`develop` | DEV | Automatic | `cdk deploy --profile dev --all` |
| `release/*` | CERT | Manual + approval | `cdk deploy --profile cert --all` |
| `main` | PROD | Manual + approval | `cdk deploy --profile prod --all` |

### DB Migrations in deployment
Migrations run BEFORE infrastructure deploy:
1. Pipeline detects migration tool (Prisma, TypeORM, Knex, Django, Alembic, SQL scripts)
2. Runs migration against target environment DB
3. On failure → blocks deploy, alerts team
4. On success → proceeds to CDK deploy

### Frontend deployment
- **Vercel (preferred)**: Git integration directa. Preview per PR, staging en `dev`, production en `main`. Zero config.
- **S3 + CloudFront**: Solo cuando el proyecto NO usa Vercel (legacy o requisito específico).
- **Static assets**: Invalidate CloudFront cache after deploy (si aplica).

### Rollback strategy
1. **CDK**: `cdk deploy` with previous template version (CloudFormation rollback)
2. **DB**: Migration rollback only if migration tool supports it (Prisma: `migrate reset` — ONLY in DEV)
3. **Frontend**: Redeploy previous S3 artifact + CloudFront invalidation
4. **PROD rollback**: ALWAYS requires manual approval, NEVER automatic

## Staging for QA

> **Amplify and Vercel provide PR previews built-in** — staging is redundant for those platforms. Staging is only needed for **CDK-only projects** (no Amplify/Vercel) that lack built-in preview deployments.

### Platform comparison

| Platform | QA before merge | Staging needed? |
|----------|-----------------|-----------------|
| **Amplify** | PR previews automáticos (`pr-N.app.amplifyapp.com`), auto-cleanup on PR close | **No** |
| **Vercel** | PR previews automáticos (`pr-123.project.vercel.app`), auto-cleanup on PR close | **No** |
| **CDK-only** | No built-in previews | **Sí** — staging stack in DEV account |

### Flow — Amplify / Vercel (previews)

```
PR opened → preview deployed automatically (unique URL per PR)
         → QA tests on preview URL
         → QA approves PR
         → merge to dev → auto-deploy DEV
         → PR closed → preview deleted automatically
```

- Each PR gets its own URL — no conflicts between PRs
- Preview = full deploy (SSR, API routes, middleware, static assets)
- Auto-cleanup: preview and resources deleted when PR closes
- Cost: Amplify ~$0.50/mes, Vercel free

### Flow — CDK-only (staging)

A shared staging environment in the **same account as DEV**, auto-deployed on PR open/update with manual override by QA.

### Concept (CDK-only)

- **Staging is a deploy target, NOT a git branch** — it lives inside the DEV account alongside the permanent DEV stack
- **Auto-deploy**: when a PR is opened or updated, staging is automatically deployed with that branch (latest PR wins)
- **Manual override**: QA can deploy a specific branch via `/deploy branch-name` comment or `workflow_dispatch`
- Only 1 branch at a time on staging (sequential testing)
- Staging shares DEV account resources (Secrets Manager, VPC) but has its own stack (Lambda/CloudFront/S3 or equivalent)

### Flow diagram (CDK-only)

```
feature branch → PR opened
                  ↓
            CI: quality gates + auto-deploy staging ← AUTOMATIC
            CI: comment on PR with staging URL
                  ↓
            QA tests on staging URL
            (or QA: /deploy other-branch → override) ← MANUAL
                  ↓
            QA approves → merge to dev → auto-deploy DEV (permanent stack)
                  ↓
            release → CERT (approval gate)
                  ↓
            promote → PROD (approval gate)
```

### Staging triggers (CDK-only)

| Trigger | What it does |
|---------|-------------|
| PR opened/updated | Auto-deploy staging with PR branch |
| Comment `/deploy branch-name` | Override: deploy specific branch |
| `workflow_dispatch` | Override: deploy selected branch from Actions tab |
| PR closed/merged | Find next open PR → deploy that, or leave staging with last deploy |

### Why staging for CDK-only (not previews per branch)

| Factor | Staging (shared) | Previews (per branch) |
|--------|-------------------|-----------------------|
| Cost | Fixed (~1 extra stack) | Variable (~1 stack × open PRs) |
| Complexity | Simple (1 env, auto + manual override) | Complex (create/destroy per PR, cleanup logic) |
| Parallelism | Sequential (1 branch at a time) | Parallel (each PR has its own URL) |
| Best for | Small teams, few PRs | Large teams, many concurrent PRs |

### Platform-specific details

| Platform | QA implementation | Notes |
|----------|------------------|-------|
| **Amplify** | PR previews (built-in, automatic) | Enable in Console → App settings → Previews. ~$0.50/mes. |
| **Vercel** | PR previews (built-in, automatic, free) | Zero config. Free. |
| **AWS CDK** | Staging stack in DEV account | See `stacks/aws/cdk.md` — "Staging for QA" |
| **Azure** | Staging resource group in DEV subscription | Same pattern as AWS CDK |

## Self-Bootstrapping Setup

> One-time infrastructure setup: temporary credentials → 1 pipeline run → all infra + app configured → cleanup → permanent federated identity only.

### Concept

Instead of manually creating IAM roles, OIDC providers, app hosting, environment variables, and secrets one by one, a **setup pipeline** does everything automatically. You provide temporary credentials once, the pipeline creates all infrastructure and migrates itself to federated identity, then deletes the temporary credentials.

**Pattern**: N temporary secrets → 1 pipeline run → M permanent secrets → temporary deleted

### What the setup pipeline creates (generic)

1. **Infra bootstrap** — CDK bootstrap / Terraform init / Bicep build
2. **Infra deploy** — secrets store, WAF, monitoring, federated identity provider + role
3. **App hosting setup** — Amplify / Static Web Apps / Vercel / App Platform (connected to repo, env vars, previews enabled)
4. **Environment variables** — SESSION_SECRET (generated random), NEXT_PUBLIC_AMBIENTE, etc.
5. **Federated identity credentials** — set as permanent pipeline secrets (OIDC role ARN / federated credential ARN)
6. **Pipeline migration** — update pipeline YAML to use federated identity instead of static creds (commit + push)
7. **Temporary secrets deleted** — via pipeline API (GitHub or ADO)
8. **Temporary service principal / IAM user deleted** — via cloud API

### Manual steps (generic, ONE TIME, ~5 min)

1. Create temporary credential in cloud console (IAM user / service principal with broad permissions)
2. Create PAT/token for app hosting API (Amplify / Static Web Apps)
3. Add N temporary secrets in repo (GitHub Secrets or ADO Variable Groups)
4. Run setup pipeline (workflow_dispatch or manual queue)
5. Delete PAT/token

After step 5: **zero manual setup remains.** All future deploys use federated identity.

### Day-to-day (zero deploy clicks)

| I want to... | I do... |
|-------------|---------|
| New feature | Branch → PR → preview → QA approves → merge → auto-deploy |
| Change infra | Modify IaC → PR → merge → pipeline trigger |
| Deploy to CERT | Manual trigger + approval gate |
| Deploy to PROD | Manual trigger + approval gate |

### Platform matrix

| CI/CD | Cloud | IaC | App Hosting | Federated Identity | Previews | See |
|-------|-------|-----|-------------|--------------------|----------|-----|
| GitHub Actions | AWS | CDK | Amplify | GitHub OIDC provider + IAM role | Amplify PR previews | `stacks/aws/cdk.md` |
| GitHub Actions | Azure | Bicep/Terraform | Static Web Apps | Azure AD federated credentials | SWA PR previews | `stacks/azure/` (future) |
| ADO Pipelines | AWS | CDK | Amplify | IAM assume role (service connection) | Amplify PR previews | `stacks/aws/cdk.md` |
| ADO Pipelines | Azure | Bicep | Static Web Apps | Azure AD service connection | SWA PR previews | `stacks/azure/` (future) |
| GitHub Actions | Any | Terraform | Vercel | Vercel token (no OIDC needed) | Vercel PR previews (free) | `deployment-patterns.md` |

## Multi-Account Strategy

### Topology matrix (cloud-agnostic)

| Topology | Non-prod | Prod | Use case |
|----------|----------|------|----------|
| **1 account** | DEV + CERT + PROD (same account, separate stacks) | — | Sandbox, personal, PoC |
| **2 accounts** | DEV + CERT | PROD | Small team, cost-conscious |
| **3 accounts** | DEV, CERT | PROD | Enterprise, compliance, blast-radius isolation |

> Setup runs **once per account**, not per environment. Within an account, Amplify/Vercel handles multiple envs via branches. OIDC stack named by account (`GitHubOidc-{account}`), idempotent for shared accounts.

### Platform mapping (agnostic)

| Concept | AWS | Azure | GCP |
|---------|-----|-------|-----|
| Account unit | AWS Account | Subscription | GCP Project |
| Federated identity | GitHub OIDC provider + IAM role | Azure AD federated credential | Workload Identity Federation |
| IaC | CDK / Terraform | Bicep / Terraform | Terraform / Pulumi |
| Setup secrets per env | `SETUP_AWS_ACCESS_KEY_ID_{ENV}` | `AZURE_SERVICE_PRINCIPAL_{ENV}` | `GCP_SERVICE_ACCOUNT_{ENV}` |
| Permanent secrets per env | `AWS_ROLE_ARN_{ENV}` | `AZURE_FEDERATED_CRED_{ENV}` | `GCP_WORKLOAD_ID_{ENV}` |
| Setup scope | Per AWS account | Per subscription | Per project |

### CI/CD branch → account → role mapping (generic)

| Branch | Environment | Account | Federated Role |
|--------|-------------|---------|----------------|
| `dev` | DEV | nonprod | `{provider}-deploy-dev` |
| `cert` | CERT | nonprod (2-acct) or cert (3-acct) | `{provider}-deploy-cert` |
| `main` | PROD | prod | `{provider}-deploy-prod` |

### Environment-centric approach

Workflow input = **environment** (dev/cert/prod), NOT account. The workflow resolves the account from config:

```
Input: environment=dev  → config.account=nonprod → deploy to nonprod account
Input: environment=cert → config.account=nonprod → deploy to nonprod account (same account in 2-acct topology)
Input: environment=prod → config.account=prod    → deploy to prod account
```

This keeps workflows simple and topology-agnostic. Changing from 2-account to 3-account only requires updating `environments.ts`, not the workflow YAML.
