import { Router } from "express";
import {
  asc,
  db,
  eq,
  hasDatabaseConnection,
  projectControlEventsTable,
  projectsTable,
} from "../lib/db";
import { logger } from "../lib/logger";

const router = Router();

type ProjectEventSeverity = "low" | "medium" | "high" | "critical" | "positive";

interface ProjectControlEventImpact {
  healthDelta: number;
  cpiDelta: number;
  spiDelta: number;
  floatDelta: number;
  eacDelta: number;
  riskDelta: number;
  gateStatusChange?: string;
  evidenceChange: number;
  vendorScoreDelta?: number;
  delayDays?: number;
  completionDelta?: number;
  pendingVariationDelta?: number;
}

interface ProjectControlEventDto {
  id: string;
  projectId: string;
  type: string;
  title: string;
  description: string;
  affectedAreas: string[];
  affectedModule: string;
  impactLabel: string;
  severity: ProjectEventSeverity;
  impacts: ProjectControlEventImpact;
  sourceModule: string;
  sourceObjectId?: string | null;
  cta: string;
  timestamp: string;
  createdAt?: string;
}

const fallbackEventsByProjectId = new Map<string, ProjectControlEventDto[]>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function normalizeSeverity(value: unknown): ProjectEventSeverity {
  if (value === "low" || value === "medium" || value === "high" || value === "critical" || value === "positive") {
    return value;
  }
  return "medium";
}

function normalizeTimestamp(value: unknown): Date {
  if (typeof value === "string" || value instanceof Date) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function normalizeImpact(value: unknown): ProjectControlEventImpact {
  const impact = isRecord(value) ? value : {};
  const gateStatusChange = asString(impact.gateStatusChange);
  return {
    healthDelta: asNumber(impact.healthDelta),
    cpiDelta: asNumber(impact.cpiDelta),
    spiDelta: asNumber(impact.spiDelta),
    floatDelta: asNumber(impact.floatDelta),
    eacDelta: asNumber(impact.eacDelta),
    riskDelta: asNumber(impact.riskDelta),
    ...(gateStatusChange ? { gateStatusChange } : {}),
    evidenceChange: asNumber(impact.evidenceChange),
    vendorScoreDelta: asNumber(impact.vendorScoreDelta),
    delayDays: asNumber(impact.delayDays),
    completionDelta: asNumber(impact.completionDelta),
    pendingVariationDelta: asNumber(impact.pendingVariationDelta),
  };
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function rowToDto(row: typeof projectControlEventsTable.$inferSelect): ProjectControlEventDto {
  return {
    id: row.id,
    projectId: row.projectId,
    type: row.type,
    title: row.title,
    description: row.description,
    affectedAreas: row.affectedAreas ?? [],
    affectedModule: row.affectedModule,
    impactLabel: row.impactLabel,
    severity: normalizeSeverity(row.severity),
    impacts: normalizeImpact(row.impacts),
    sourceModule: row.sourceModule,
    sourceObjectId: row.sourceObjectId,
    cta: row.cta,
    timestamp: toIso(row.timestamp) ?? new Date().toISOString(),
    createdAt: toIso(row.createdAt),
  };
}

function normalizeEventBody(projectId: string, value: unknown): ProjectControlEventDto {
  if (!isRecord(value)) {
    throw new Error("Event body must be an object.");
  }

  const type = asString(value.type);
  const title = asString(value.title);
  const description = asString(value.description);
  const affectedModule = asString(value.affectedModule);
  const cta = asString(value.cta);

  if (!type || !title || !description || !affectedModule || !cta) {
    throw new Error("Event type, title, description, affected module, and CTA are required.");
  }

  const timestamp = normalizeTimestamp(value.timestamp);

  return {
    id: asString(value.id, `${projectId}-${type}-${Date.now().toString(36)}`),
    projectId,
    type,
    title,
    description,
    affectedAreas: asStringArray(value.affectedAreas),
    affectedModule,
    impactLabel: asString(value.impactLabel, description),
    severity: normalizeSeverity(value.severity),
    impacts: normalizeImpact(value.impacts),
    sourceModule: asString(value.sourceModule, "ProjectCommand"),
    sourceObjectId: asString(value.sourceObjectId) || null,
    cta,
    timestamp: timestamp.toISOString(),
  };
}

async function ensureProject(projectId: string) {
  await db
    .insert(projectsTable)
    .values({
      id: projectId,
      name: projectId,
      status: "active",
      description: "ProjectCommand control twin project",
    })
    .onConflictDoNothing();
}

router.get("/projectcommand/projects/:projectId/events", async (req, res) => {
  const { projectId } = req.params;

  try {
    if (!hasDatabaseConnection) {
      res.json({ events: fallbackEventsByProjectId.get(projectId) ?? [], source: "memory" });
      return;
    }

    const rows = await db
      .select()
      .from(projectControlEventsTable)
      .where(eq(projectControlEventsTable.projectId, projectId))
      .orderBy(asc(projectControlEventsTable.timestamp), asc(projectControlEventsTable.createdAt));

    res.json({ events: rows.map(rowToDto), source: "database" });
  } catch (error) {
    logger.error({ err: error, projectId }, "ProjectCommand events fetch failed");
    res.status(500).json({ ok: false, error: "Failed to load ProjectCommand events." });
  }
});

router.post("/projectcommand/projects/:projectId/events", async (req, res) => {
  const { projectId } = req.params;

  try {
    const event = normalizeEventBody(projectId, req.body);

    if (!hasDatabaseConnection) {
      const current = fallbackEventsByProjectId.get(projectId) ?? [];
      fallbackEventsByProjectId.set(projectId, [...current.filter(item => item.id !== event.id), event]);
      res.status(201).json({ event, source: "memory" });
      return;
    }

    await ensureProject(projectId);
    const [row] = await db
      .insert(projectControlEventsTable)
      .values({
        id: event.id,
        projectId,
        type: event.type,
        title: event.title,
        description: event.description,
        affectedAreas: event.affectedAreas,
        affectedModule: event.affectedModule,
        impactLabel: event.impactLabel,
        severity: event.severity,
        impacts: event.impacts,
        sourceModule: event.sourceModule,
        sourceObjectId: event.sourceObjectId,
        cta: event.cta,
        timestamp: new Date(event.timestamp),
      })
      .onConflictDoUpdate({
        target: projectControlEventsTable.id,
        set: {
          title: event.title,
          description: event.description,
          affectedAreas: event.affectedAreas,
          affectedModule: event.affectedModule,
          impactLabel: event.impactLabel,
          severity: event.severity,
          impacts: event.impacts,
          sourceModule: event.sourceModule,
          sourceObjectId: event.sourceObjectId,
          cta: event.cta,
          timestamp: new Date(event.timestamp),
        },
      })
      .returning();

    res.status(201).json({ event: rowToDto(row), source: "database" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create ProjectCommand event.";
    const status = message.includes("required") || message.includes("object") ? 400 : 500;
    if (status >= 500) logger.error({ err: error, projectId }, "ProjectCommand event create failed");
    res.status(status).json({ ok: false, error: message });
  }
});

router.delete("/projectcommand/projects/:projectId/events", async (req, res) => {
  const { projectId } = req.params;

  try {
    if (!hasDatabaseConnection) {
      fallbackEventsByProjectId.set(projectId, []);
      res.json({ ok: true, source: "memory" });
      return;
    }

    await db.delete(projectControlEventsTable).where(eq(projectControlEventsTable.projectId, projectId));
    res.json({ ok: true, source: "database" });
  } catch (error) {
    logger.error({ err: error, projectId }, "ProjectCommand events clear failed");
    res.status(500).json({ ok: false, error: "Failed to clear ProjectCommand events." });
  }
});

export default router;
