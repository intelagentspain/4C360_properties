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
  - **Personalized dashboard per team member**: Deep-link routing via `?member=<id>` URL param; each member gets a pre-loaded dashboard matching their perspective, zones, and assigned clients
  - **Welcome email integration**: API generates unique dashboard links per team member; email includes "Go to My Dashboard" CTA button with zones/skills/perspective metadata
  - **Extended member profile schema**: TeamMember now includes `perspective` (Strategic/Operational/Client), `assignedClients`, `zones`, `skills`, `responsibilities`; form updated with multi-select UI for these fields

### API Server (`artifacts/api-server`)
- **Type**: api
- **Stack**: Express 5, TypeScript
- **Purpose**: Shared backend — handles team member welcome emails and incident/work-order notification emails
- **Email**: Uses Resend (via Replit connector `ccfg_resend_01K69QKYK789WN202XSE3QS17V`) for real email delivery. Credentials are fetched at runtime from the connector API. Falls back to `RESEND_API_KEY` env var if connector unavailable.
- **Email helper**: `artifacts/api-server/src/lib/mailer.ts` — shared `sendEmail()` utility used by both `clients.ts` (welcome emails) and `incidents.ts` (incident + work order notification emails)

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
