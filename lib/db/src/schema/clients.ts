import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const clientsTable = pgTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("live"),
  region: text("region"),
  sector: text("sector"),
  sites: integer("sites").default(0),
  workOrders: integer("work_orders").default(0),
  incidentsCount: integer("incidents_count").default(0),
  sla: integer("sla").default(100),
  compliance: integer("compliance").default(100),
  riskLevel: text("risk_level").default("low"),
  overdueTasks: integer("overdue_tasks").default(0),
  aiInsight: text("ai_insight"),
  lastUpdated: text("last_updated"),
  contract: jsonb("contract"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Client = typeof clientsTable.$inferSelect;
export type InsertClient = typeof clientsTable.$inferInsert;

export const sitesTable = pgTable("sites", {
  id: text("id").primaryKey(),
  clientId: text("client_id").references(() => clientsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default("ok"),
  incidentsCount: integer("incidents_count").default(0),
  lat: text("lat"),
  lng: text("lng"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Site = typeof sitesTable.$inferSelect;
export type InsertSite = typeof sitesTable.$inferInsert;
