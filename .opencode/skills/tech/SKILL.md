---
name: "Technology Stack — SDD"
description: "approved tech stack, versions, and selection criteria"
---

# Technology Stack — SDD

The stack is defined in `.sdd-config.json` field `stacks[]`.

## Detection

- **project-scanner**: automatically detects stacks from existing code
- **solution-designer**: selects stacks for new projects based on requirements

## Available stacks

`typescript` · `python` · `react` · `angular` · `vue` · `aws` · `node` · `java` · `dotnet` · `go` · `capacitor` · `flutter` · `dart`

## Deployment platforms

`vercel` · `github-actions` · `azure-pipelines` · `aws-cdk`

Each platform activates deployment-specific steering. Platform is defined in `.sdd-config.json` field `deployment.host`.

Each stack activates specific steering from `.sdd-cache/stacks/`.

## Rules

- NEVER assume a stack without checking `.sdd-config.json`
- If `stacks[]` is empty in a new project → solution-designer defines it after requirements
- If `stacks[]` is empty in an existing project → project-scanner detects it
- Stack steering is activated from local cache, does not require re-sync
- The Developer can manually add stacks to `.sdd-config.json`

## Load the stack steering before writing (REQUIRE)

The stack steering is NOT loaded by itself: it comes as on-demand skills (Claude, opencode, Antigravity) or by file pattern (Kiro). Before writing or changing any of the following, invoke the skill (Claude) or read the steering file (Kiro) listed, and say which ones you loaded in the task plan:

| You touch or create | Load |
|---|---|
| `infra/**`, `cdk/**`, `cdk.json`, any CDK stack | `cdk` + `deployment-patterns` |
| `amplify.yml`, an Amplify app, branch or its roles | `amplify` + `cdk` |
| `.github/workflows/**`, `azure-pipelines.yml`, `vercel.json` | `deployment-patterns` (and the `pipeline-builder` power) |
| DynamoDB / Lambda / Cognito / S3 / SQS-SNS / EventBridge / Step Functions / SES / Secrets Manager / VPC resources | the skill with that service name |
| Secrets, env vars or credentials of a deployed app | `secrets-manager` + `security` |

If a skill is not available in the IDE, say so in the plan; do not continue from memory.
