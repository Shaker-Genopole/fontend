# Web Interface for Microservice Healthcare Edge-Cloud AIoT Deployment Applications.

## Overview

Healthcare IoT services rely on SLAs that guarantee QoS properties such as latency and availability. These SLAs are usually enforced by centralised providers, which offers little transparency. The arrangement also exposes sensitive deployment data, such as device identifiers, patient links and sensor locations. The project proposes an alternative in which providers prove SLA compliance with **zk-SNARKs (Groth16)**. The proofs are verified natively on the **Sui** blockchain, and smart contracts apply penalties or incentives automatically. Throughout the process, the underlying data stays private.

The project is carried out by Huyen-Trang Le and Huu-Hung Vuong under the supervision of Dr. Adnan Imeri and Prof. Nazim Agoulmine (COSMO Team, ISIBC Laboratory).

## Modules

| Route                         | Module                                           |
| ----------------------------- | ------------------------------------------------ |
| `/`                           | SLA overview and evaluation KPIs                 |
| `/sla-contracts`              | SLA contracts (Sui objects, escrow, penalties)   |
| `/zk-proofs`                  | Groth16 proof ledger                             |
| `/proof-lab`                  | Interactive proof pipeline (Scenario 1)          |
| `/negotiation`                | Constraint-based provider selection (Scenario 2) |
| `/devices`, `/infrastructure` | IoT devices and edge–cloud resources             |
| `/research`                   | Research context                                 |

The template's original modules (tasks, users, apps, chats, Clerk authentication and settings) are retained.

## Limitations

This is a front-end prototype. All data is **synthetic** and generated from a fixed seed in [src/data/dataset.ts](src/data/dataset.ts). The proof pipeline in [src/lib/zk/simulator.ts](src/lib/zk/simulator.ts) is a **simulation**: commitments are real SHA-256 digests, but the proofs, timings and transactions are illustrative. The displayed values are not experimental results.

## Getting started

Requirements: Node.js ≥ 22 and pnpm 11.

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # production bundle in dist/
pnpm test     # Vitest (browser mode)
```

`VITE_CLERK_PUBLISHABLE_KEY` is optional and only enables the `/clerk/*` pages.

## CI/CD

The GitHub Actions workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) lints, tests and builds the project on every push and pull request to `main`. It then deploys to **Vercel**: a production deployment for `main` and a preview deployment for pull requests. To enable deployment, add the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.

## Stack

React 19, TypeScript, Vite, TanStack Router/Query/Table, shadcn/ui, Tailwind CSS 4, Recharts.

## Acknowledgements

The UI is built on [shadcn-admin](https://github.com/satnaing/shadcn-admin) by Sat Naing (MIT licence).
