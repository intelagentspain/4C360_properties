import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export interface ProjectControlEventImpact {
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

export const projectControlEventsTable = pgTable("project_control_events", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedAreas: text("affected_areas").array().notNull().default([]),
  affectedModule: text("affected_module").notNull(),
  impactLabel: text("impact_label").notNull(),
  severity: text("severity").notNull(),
  impacts: jsonb("impacts").$type<ProjectControlEventImpact>().notNull(),
  sourceModule: text("source_module").notNull().default("ProjectCommand"),
  sourceObjectId: text("source_object_id"),
  cta: text("cta").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectControlEventRow = typeof projectControlEventsTable.$inferSelect;
export type InsertProjectControlEvent = typeof projectControlEventsTable.$inferInsert;
