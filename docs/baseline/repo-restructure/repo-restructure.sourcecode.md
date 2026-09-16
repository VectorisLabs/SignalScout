---
baseline_schema: "2.0"
pack: "repo-restructure"
document: "sourcecode"
status: "complete"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Repository Restructure - Code Topology

## Directory Topology: Target State

```text
SignalScout/
├── .github/                                  # CI/CD workflows
├── docs/                                     # Single source of truth for documentation
│   ├── business/                             # Requirements & invariants (version-independent)
│   ├── poc/                                  # POC architecture and research notes
│   ├── production/                           # Target multi-agent production architecture & decision ledger
│   ├── baseline/                             # Adaptive baseline documentation packs
│   │   ├── terraform-prod.*                  # IaC baseline pack
│   │   └── repo-restructure.*                # Repository reorganization baseline pack
│   ├── collector-routing-rules.md            # Shared evidence collector routing policy
│   └── README.md                             # Documentation index and layer guide
├── signalscout-poc/                          # Hackathon POC environment (running demo)
│   ├── backend/                              # Express / Node.js API, case builder, bundle validator
│   │   ├── src/                              # OpenAI Responses API integration, routers, engine
│   │   ├── package.json                      # @corpwatch/backend
│   │   ├── tsconfig.json
│   │   └── vercel.json                       # Backend-specific Vercel function timeout config
│   └── frontend/                             # React + Vite dashboard
│       ├── src/                              # Dashboard UI, timeline, pattern radar, chat
│       ├── package.json                      # @corpwatch/frontend
│       ├── vite.config.ts
│       └── tsconfig.json
├── signalscout-prod/                         # Target enterprise production environment
│   ├── agents/                               # Python Bedrock Strands Agents (supervisor-worker)
│   │   ├── management/                       # Supervisor agent orchestrating workflow
│   │   ├── crawler/                          # Web scraping and plain code sanitization agent
│   │   ├── analysis/                         # Theme and risk reasoning agent
│   │   └── pyproject.toml                    # Managed via uv / uvx
│   ├── lambdas/                              # Serverless event handlers
│   │   ├── webhook-handler/                  # Langfuse webhook handler (atomic retry & critique)
│   │   └── appsync-resolvers/                # GraphQL query resolvers
│   └── terraform/                            # Production AWS Infrastructure as Code
│       ├── modules/                          # Reusable modules: storage, database, security_iam, etc.
│       └── environments/                     # Environment orchestration: prod (AWS & Floci dual-mode)
├── package.json                              # Root npm workspaces: ["signalscout-poc/backend", "signalscout-poc/frontend"]
├── vercel.json                               # Root Vercel multi-service routing
└── README.md                                 # Project overview and navigation
```

## Workspace and Service Mapping Contract

| Component | Target path | Package identifier | Managed by | Root npm workspace | Vercel service root |
|---|---|---|---|---|---|
| POC Backend | `signalscout-poc/backend` | `@corpwatch/backend` | npm workspaces | `signalscout-poc/backend` | `signalscout-poc/backend` |
| POC Frontend | `signalscout-poc/frontend` | `@corpwatch/frontend` | npm workspaces | `signalscout-poc/frontend` | `signalscout-poc/frontend` |
| Prod Agents | `signalscout-prod/agents` | `signalscout-agents` | Python `uv` | N/A | N/A (AWS Bedrock AgentCore) |
| Prod Lambdas | `signalscout-prod/lambdas` | `@signalscout/lambdas` | npm / pnpm | Optional future workspace | N/A (AWS Lambda) |
| Prod Infra | `signalscout-prod/terraform` | N/A | Terraform >= 1.15.8 | N/A | N/A (AWS / Floci) |

## Vercel Routing Configuration (`vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "frontend": {
      "root": "signalscout-poc/frontend",
      "framework": "vite",
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "rewrites": [
        {
          "source": "/(.*)",
          "destination": "/index.html"
        }
      ]
    },
    "backend": {
      "root": "signalscout-poc/backend",
      "entrypoint": "src/server.ts"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": {
        "service": "backend"
      }
    },
    {
      "source": "/(.*)",
      "destination": {
        "service": "frontend"
      }
    }
  ]
}
```

