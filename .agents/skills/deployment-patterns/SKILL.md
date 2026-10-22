---
name: "Deployment Patterns"
description: "Multi-platform deployment patterns, stack→deployment mapping, and promotion flows"
---

# Deployment Patterns

## Reglas universales de promoción

Aplican SIEMPRE, independientemente de la plataforma:

- ⚠️ NUNCA deploy directo dev → prod (DEBE pasar por cert/staging)
- ⚠️ Gates explícitos — cada promoción requiere aprobación manual
- ⚠️ Hotfix → cherry-pick back to dev después de prod
- ⚠️ Release tag `vX.Y.Z` en cada deploy a producción
- ⚠️ `deployment` en `.sdd-config.json` NUNCA se auto-popula sin confirmación del usuario

## Stack → Deployment recomendado

| Stack detectado | Deployment recomendado | Razón |
|---|---|---|
| Next.js (fullstack) | `fullstack-vercel` | Nativo de Vercel, SSR/ISR optimizado |
| Next.js (fullstack) + custom infra | `fullstack-amplify-cdk` | Amplify para la app (SSR, previews), CDK para la infra (secretos, WAF, OIDC, app de Amplify y sus dos roles). Ver «Patrón de referencia: fullstack-amplify-cdk» abajo. |
| React + Node/Express (junto) | `fullstack-vercel` | Vercel maneja ambos como serverless functions |
| React/Angular + Python/Django/FastAPI | `monorepo-split` | Python no corre en Vercel → backend a AWS |
| React/Angular + Java/Spring | `multi-repo` | Backend pesado → AWS ECS, ciclos de release diferentes |
| Node/Express API solo | `backend-only` | AWS Lambda + API Gateway |
| React/Angular SPA solo | `frontend-only` | Vercel estático |
| Angular 17+ (fullstack) | `fullstack-vercel` / `monorepo-split` | Same patterns as React (SSR via Angular Universal on Vercel or split backend to AWS) |
| Capacitor (Ionic/Angular/React) | `mobile-capacitor` / `hybrid` | Web wrapper for app stores, or hybrid web + mobile from same codebase |
| Flutter (Dart) | `mobile-flutter` | Native cross-platform (iOS/Android), backend stays on AWS |

## Flujo de promoción por plataforma

### GitHub + Vercel (fullstack-vercel / monorepo-split / frontend-only)

Vercel usa **Git integration directa** (one-time setup), NO se deploya a través de GH Actions.

```
feature/* ──PR──→ dev ──PR──→ main
                  │            │
           Vercel Preview  Vercel Production
           (auto per PR)   (auto on merge)
           + GH Actions    Release tag vX.Y.Z
           (tests, lint)
```

| Evento Git | Vercel (frontend) | GH Actions |
|---|---|---|
| PR abierto a `dev` | Auto preview deploy (URL única) | CI: tests, lint, build |
| Merge a `dev` | Deploy staging (`dev-project.vercel.app`) | CI + backend staging deploy (si monorepo-split) |
| PR de `dev` a `main` | — | CI: tests finales |
| Merge a `main` | **Production deploy** | Backend production deploy (si monorepo-split) + release tag |

> **Amplify and Vercel** provide PR previews built-in (automatic, per-PR URL, auto-cleanup on PR close). For those platforms, use previews — no shared staging needed. For AWS CDK-only or Azure projects without previews, use shared staging (see `environment-strategy.md` — "Staging for QA").
>
> For `fullstack-amplify-cdk`, ver el patrón de referencia abajo. CDK bootstrap: `--toolkit-stack-name CDKToolkit-{project}` salvo en cuentas de plataforma que ya lo traen (ver «CDK Bootstrap por deployment pattern»).

### GitHub + AWS (backend-only)

```
feature/* ──PR──→ dev ──gate──→ cert ──gate──→ prod
                  │              │              │
              GH Actions     GH Actions     GH Actions
              auto-deploy    approval gate  approval gate
              AWS CDK dev    AWS CDK cert   AWS CDK prod
```

| Promotion | Approver | Verifies |
|---|---|---|
| dev → cert | Tech Lead | Tests pass, PR reviews done |
| cert → prod | PO + QA | Smoke tests OK, sign-off |

**Staging for QA**: Shared staging stack in DEV account. QA deploys a feature branch to staging for testing before merge. See `environment-strategy.md` — "Staging for QA".

### ADO + Azure Pipelines

```
feature/* ──PR──→ dev ──gate──→ cert ──gate──→ prod
                  │              │              │
             Pipeline        Pipeline       Pipeline
             auto-deploy    approval gate  approval gate
```

| Promotion | Approver | Verifies |
|---|---|---|
| dev → cert | Tech Lead / Developer | Tests pass, PR reviews done |
| cert → prod | PO + QA | Smoke tests OK, regression OK, sign-off |
| hotfix cert → prod | Tech Lead (fast-track) | Fix verified, no side effects |

**Staging for QA**: Shared staging resource group in DEV subscription. Same pattern as AWS.

## Patrón de referencia: fullstack-amplify-cdk

Tomado de `unisigma_portal` (funcionando en dev). Pipelines listos: `pipeline-builder/references/github-actions-amplify-cdk.yaml` (CI/CD) y `github-actions-amplify-cdk-setup.yaml` (setup de un ambiente).

| Qué | Quién lo despliega | Cuándo |
|---|---|---|
| Código de la app | **Amplify**, por webhook a la rama conectada (build según `amplify.yml`), con un preview por PR | Cada push; no es GitHub Actions |
| Infra (secretos, roles, app y rama de Amplify, alarmas) | **GitHub Actions + CDK**, con el rol OIDC de plataforma | Push a `dev` que toque `infra/` (filtro de rutas), o manual con `diff` (solo muestra) o `deploy` |
| Backend (si existe) | Workflow aparte | Siempre después de build y tests |
| Quality gates (tsc, eslint, vitest, `npm audit`, build) | GitHub Actions, un solo job | Check obligatorio del PR |

Reglas del patrón:
- **La app de Amplify, su rama, sus roles y sus variables se definen en CDK** (`CfnApp` + `CfnBranch`). No se editan por consola ni CLI: el siguiente `cdk deploy` los pisa. Un cambio de variable es un cambio en el stack.
- **Credenciales por OIDC**, sin access keys: un rol por cuenta (`AWS_ROLE_ARN_<ENV>` en GitHub) y un GitHub Environment por ambiente, porque el rol exige `sub = environment:<env>`.
- El PAT de GitHub con el que Amplify conecta el repo entra como parámetro CloudFormation `NoEcho` (`GitHubAccessToken`, secreto `SETUP_GITHUB_PAT`); los deploys siguientes reutilizan el valor anterior.
- El setup de un ambiente se corre **una vez** (workflow manual): hace el `cdk deploy` del stack y guarda `AMPLIFY_APP_ID_<ENV>` como variable de GitHub.
- Un cambio de variables de Amplify por CloudFormation **no dispara un build** y Next.js las lee al compilar: tras el `cdk deploy`, lanzar `aws amplify start-job --job-type RELEASE`.
- Un push que no toca la app ni la infra no lanza nada (filtro `paths`); en PR, un push nuevo cancela la corrida anterior, en push a `dev` nunca (podría cortar un deploy).
- Ambientes: DEV y CERT comparten cuenta (stack `<Infra>-Dev` y `-Cert`, ramas `dev` y `cert` de Amplify); PROD tiene cuenta y rol propios. Promoción: DEV automático, CERT con Tech Lead + QA, PROD con Dev + QA + BA. Rollback: DEV revertir el commit; CERT/PROD redesplegar la versión anterior desde Amplify.
- Secretos: del runtime en Secrets Manager (`<prefijo>/<proyecto>/<env>/…`); de CI en GitHub (`AWS_ROLE_ARN_<ENV>`, `SETUP_GITHUB_PAT`). Nunca valores en el repo ni en la plantilla del stack.

Roles de Amplify (servicio y cómputo): los dos con confianza solo en `amplify.amazonaws.com`. Definidos en CDK, el `CfnApp` recibe ambos a la vez (así funciona en unisigma). Con la CLI `create-app` el rol de cómputo se asigna en un paso aparte. Si el build falla con `Unable to assume specified IAM Role` con los roles bien, ver `stacks/aws/amplify.md`.

## Servicios AWS por tipo de app

| Tipo | Servicios típicos |
|---|---|
| API REST | Lambda, API Gateway, RDS, S3, Cognito |
| Full-stack | RDS, S3, SES, EventBridge (app en Vercel) |
| Microservices | Lambda/ECS, API Gateway, SQS/SNS, DynamoDB |
| Background jobs | EventBridge, Lambda, SQS, CloudWatch |
| Mobile backend | SNS (push notifications), Amplify (mobile backend), Pinpoint (analytics/targeting) |

## Template de propuesta justificada

Cuando el agente propone deployment, DEBE seguir este formato:

```
📦 Stack:
- **[Tech]** _(justificación por qué esta y no otra)_

🚀 Deployment: **[pattern]**
_(razón principal por qué este patrón)_

☁️ Infra AWS:
- **[servicio]** → [propósito] _(justificación de por qué este servicio)_

❌ Descartados:
- [alternativa] → [razón de descarte]

¿OK o ajustamos?
```

⚠️ NUNCA proponer sin justificación. Cada línea tiene el **qué** + el **por qué**.

## CDK Bootstrap por deployment pattern

Todo proyecto que usa CDK necesita `cdk bootstrap` antes del primer deploy. Ver `stacks/aws/cdk.md` → "Bootstrap" para detalles completos.

| Deployment pattern | `--toolkit-stack-name` | Razón |
|--------------------|----------------------|-------|
| `fullstack-amplify-cdk` | `CDKToolkit-{project}` | Amplify + CDK, evitar conflicto con otros proyectos en la cuenta |
| `backend-only` (Lambda) | `CDKToolkit-{project}` | Lambda, evitar conflicto |
| `backend-only` (ECS/Fargate) | `CDKToolkit-{project}` | Containers con ECR, evitar conflicto |
| `monorepo-split` | `CDKToolkit-{project}` | Backend en AWS, frontend en Vercel |
| `multi-repo` | `CDKToolkit-{project}` | Cada repo su propio toolkit stack |

> **Regla**: usar `--toolkit-stack-name CDKToolkit-{project}` cuando el proyecto hace su propio bootstrap; previene conflictos si la cuenta se comparte.
>
> **Excepción — cuentas de plataforma**: si la cuenta ya trae el bootstrap (qualifier y permissions boundary configurados en `infra/cdk.json`, como `fas`), NO correr `cdk bootstrap` ni crear otro toolkit. Los pipelines solo hacen `cdk deploy`.
