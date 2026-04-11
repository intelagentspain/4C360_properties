import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { incidentsTable } from "./incidents";
import { clientsTable } from "./clients";

export const ticketsTable = pgTable("tickets", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidentsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  asset: text("asset"),
  location: text("location"),
  skill: text("skill"),
  priority: text("priority").default("medium"),
  status: text("status").default("new"),
  tech: text("tech"),
  techId: text("tech_id"),
  slaMinutes: integer("sla_minutes"),
  elapsed: integer("elapsed").default(0),
  reportedBy: text("reported_by"),
  evidence: text("evidence").array().default([]),
  siteId: text("site_id"),
  clientId: text("client_id").references(() => clientsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Ticket = typeof ticketsTable.$inferSelect;
export type InsertTicket = typeof ticketsTable.$inferInsert;

export const workOrdersTable = pgTable("work_orders", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidentsTable.id, { onDelete: "set null" }),
  ticketId: text("ticket_id").references(() => ticketsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  location: text("location"),
  priority: text("priority").default("medium"),
  asset: text("asset"),
  skill: text("skill"),
  siteId: text("site_id"),
  description: text("description"),
  status: text("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type WorkOrder = typeof workOrdersTable.$inferSelect;
export type InsertWorkOrder = typeof workOrdersTable.$inferInsert;

export const photoEvidenceTable = pgTable("photo_evidence", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidentsTable.id, { onDelete: "cascade" }),
  ticketId: text("ticket_id").references(() => ticketsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: text("filename"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PhotoEvidence = typeof photoEvidenceTable.$inferSelect;
export type InsertPhotoEvidence = typeof photoEvidenceTable.$inferInsert;
