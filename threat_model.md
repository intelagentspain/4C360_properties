# Threat Model

## Project Overview

This project is a pnpm monorepo with a React/Vite frontend (`artifacts/imdaad-ai-os`) and an Express 5 + PostgreSQL backend (`artifacts/api-server`). In production, the API serves operational data for clients, team members, incidents, work orders, push subscriptions, incident evidence, outbound email/WhatsApp notifications, and AI-assisted incident tooling. The frontend includes public deep-link flows for incident reporting, field operations capture, and member-specific dashboards.

Production assumptions for future scans:
- `NODE_ENV` is `production` in deployed environments.
- Replit provides TLS for deployed traffic.
- `artifacts/mockup-sandbox` is dev-only and should be ignored unless production reachability is demonstrated.

## Assets

- **Operational incident and work-order data** — incident descriptions, locations, timestamps, activity logs, work-order state, and resolution details. Unauthorized access leaks client operational details; unauthorized changes can disrupt facility operations.
- **Team member data** — names, emails, roles, site assignments, phone/mobile/WhatsApp fields, zones, availability, and privileges. This is internal staff data and can be used for phishing, impersonation, or targeted abuse.
- **Client portfolio data** — client names, contract metadata, SLA/compliance metrics, risk levels, and related operational context. Exposure harms confidentiality and business trust.
- **Uploaded evidence and media** — incident photos, work-order evidence images, and voice uploads. These can contain sensitive facility visuals, resident information, or location details.
- **Outbound messaging capability** — Resend, Twilio WhatsApp, and Web Push are server-held capabilities that can send messages or notifications on behalf of the business. Abuse can create spam, cost, and reputational damage.
- **Application secrets and connectors** — database credentials, OpenAI keys, Twilio keys, Resend connector access, token-signing secrets, and VAPID keys. Leakage or misuse can compromise multiple downstream systems.

## Trust Boundaries

- **Browser / API boundary** — all client requests into `/api` cross from an untrusted browser into trusted server logic. The server must authenticate and authorize sensitive reads and writes; the frontend cannot be trusted.
- **Public deep-link / privileged workflow boundary** — routes such as `?member=...`, `/field/...`, ticket approval/rejection links, and resolution-confirmation links move users from public URLs into privileged operational workflows. These links must be non-guessable, validated server-side, and never have unauthenticated bypass routes.
- **API / database boundary** — the API has broad direct access to PostgreSQL. Missing authz or input validation at the route layer exposes the full operational datastore.
- **API / file storage boundary** — incident and work-order uploads are written to disk and then served back via static URLs. The application must ensure only intended users can upload, enumerate, or fetch sensitive media.
- **API / external service boundary** — the server can send email, WhatsApp, push notifications, and OpenAI requests. Only authorized users and server-side workflows should be able to spend those capabilities.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/imdaad-ai-os/src/main.tsx`
- **Highest-risk server areas:** `artifacts/api-server/src/routes/incidents.ts`, `clients.ts`, `push.ts`, `fieldops.ts`, `whatsapp.ts`, `copilotChat.ts`, `analyzeIssue.ts`, `transcribeVoice.ts`
- **Public/authenticated/admin surfaces:** public scan/report/field routes exist in `artifacts/imdaad-ai-os/src/main.tsx`; the current backend route layer shows no centralized auth middleware in `app.ts` or `routes/index.ts`
- **Usually dev-only:** `artifacts/mockup-sandbox`, `artifacts/api-server/src/routes/dev.ts` unless explicitly enabled in production

## Threat Categories

### Spoofing

This application currently relies heavily on URL context, member IDs, email-link tokens, and frontend state instead of a clear server-enforced authentication layer. The system must ensure that every non-public API endpoint requires authenticated identity, that deep links are non-guessable and validated server-side, and that privileged email-token workflows do not have unauthenticated alternate paths.

### Tampering

Incidents, work orders, approvals, rejections, resolution confirmations, push subscriptions, and outbound notification workflows are all high-impact state transitions. The system must ensure only authorized actors can create, modify, approve, reject, resolve, or close operational records, and that client-supplied fields cannot arbitrarily rewrite business state.

### Information Disclosure

The backend stores staff PII, client portfolio details, incident logs, uploaded evidence, and work-order history. The system must ensure sensitive data is returned only to authorized users, uploaded evidence is not broadly enumerable or public by default, and chat/copilot/database-backed assistant features do not expose internal records to unauthenticated users.

### Denial of Service

Public AI, upload, messaging, and incident-reporting endpoints can trigger disk writes, database writes, model calls, and third-party API calls. The system must rate-limit or otherwise bound public and expensive operations, cap upload size and frequency, and avoid unauthenticated access to spend-heavy integrations.

### Elevation of Privilege

The largest risk in this project is broken function-level authorization: public callers appear able to reach data-management and approval endpoints that should be restricted to staff or specific approvers. The system must enforce role-appropriate authorization on all operational endpoints, prevent IDOR on record identifiers and deep-link parameters, and ensure that uploaded evidence, work-order actions, and notification actions cannot be triggered by arbitrary internet users.
