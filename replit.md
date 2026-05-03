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
- **Description**: High-fidelity SaaS demo for OSH Authority (Occupational Safety & Health) platform powered by 4C360
- **Domain rebrand notes**:
  - Top bar reads "OSH Authority" (was "Imdaad")
  - Domain term: Client owns Sites; each Site has many Assets (was "Property")
  - Seed/mock data is OSH-themed: scaffold defects, fall protection, confined-space alerts, chemical spills, hot work permits, LOTO breaches, PPE cabinet audits, gas detection, eyewash stations, emergency lighting, etc. (replaces FM concepts like AC failure, lift fault, water leak, HVAC, chiller, AHU, irrigation, Power BI, generator, CCTV, parking barrier)
  - Some KB article body text retains generic FM language; titles/categories are OSH-aligned
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
- **Stack**: Express 5, TypeScript, Drizzle ORM + PostgreSQL
- **Purpose**: Shared backend — handles team member welcome emails, incident/work-order notification emails, and all data persistence via PostgreSQL
- **Database**: Replit-managed PostgreSQL. Schema defined in `lib/db/src/schema/`. Tables: `clients`, `sites`, `team_members`, `incidents`, `tickets`, `work_orders`, `photo_evidence`
- **DB Package**: `lib/db` — exports `db` (Drizzle client), all table definitions, and Drizzle query helpers (`eq`, `desc`, `asc`)
- **DB helper in api-server**: `artifacts/api-server/src/lib/db.ts` — re-exports everything from `@workspace/db`
- **Persistent REST endpoints**:
  - `GET/POST /api/incidents`, `GET/PATCH /api/incidents/:id`
  - `GET /api/workorders`, `POST /api/workorders`
  - `GET /api/clients`, `POST /api/clients`, `GET/PATCH /api/clients/:id`
  - `GET /api/team-members`, `POST /api/team-members`, `GET /api/team-members/:id`
- **Seed data**: 5 clients, 5 sites, 10 team members, 7 incidents, 12 tickets pre-loaded on first DB setup
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
