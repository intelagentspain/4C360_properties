# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Imdaad AI-OS (`artifacts/imdaad-ai-os`)
- **Type**: react-vite
- **Preview Path**: `/` (root)
- **Stack**: React 18, TypeScript, Tailwind CSS, react-leaflet, Framer Motion, Lucide React
- **Description**: High-fidelity SaaS demo for Imdaad facility management platform powered by 4C360
- **Features**:
  - 3 perspectives: Strategic (GIS map, KPIs, PPM, AI dispatch), Operational (mobile technician view with PIN login), Client (request portal with live tracking)
  - Interactive CartoDB Dark Matter map centered on Silicon Oasis, Dubai
  - Real-time SLA countdown timers
  - PPM risk panel with predictive AI badge
  - AI dispatch queue with one-click assignment
  - Mobile phone-frame view for operational technician
  - Client service timeline with animated tech marker
  - Toast notification system
  - All data is mock/hardcoded client-side — no backend needed

### API Server (`artifacts/api-server`)
- **Type**: api
- **Stack**: Express 5, TypeScript
- **Purpose**: Shared backend (not used by Imdaad AI-OS demo)

## Design System (Imdaad AI-OS)
- Primary Navy: #0A1628
- Surface Navy: #112040
- Accent Blue: #2E7FFF
- Electric Cyan: #00C6FF
- Emerald Green: #38D98A
- Amber Warning: #FF9B38
- Alert Red: #FF4B4B
- Font Headings: Space Grotesk
- Font Body: DM Sans
- Dark mode only
