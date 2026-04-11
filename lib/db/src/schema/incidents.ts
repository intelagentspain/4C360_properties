import { pgTable, text, integer, decimal, jsonb, timestamp } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

export const incidentsTable = pgTable("incidents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location"),
  severity: text("severity").default("low"),
  slaMinutes: integer("sla_minutes"),
  elapsed: integer("elapsed").default(0),
  source: text("source").default("Manual"),
  status: text("status").default("open"),
  assignedTech: text("assigned_tech"),
  techId: text("tech_id"),
  description: text("description"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  imageUrl: text("image_url"),
  siteId: text("site_id"),
  clientId: text("client_id").references(() => clientsTable.id, { onDelete: "set null" }),
  aiMetadata: jsonb("ai_metadata"),
  activityLog: jsonb("activity_log").default([]),
  closureNotes: text("closure_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolutionNotes: text("resolution_notes"),
  beforePhotoUrl: text("before_photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: text("confirmed_by"),
  reportedAt: timestamp("reported_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Incident = typeof incidentsTable.$inferSelect;
export type InsertIncident = typeof incidentsTable.$inferInsert;
