import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey(),
  clientId: text("client_id").references(() => clientsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default("active"),
  siteCount: integer("site_count").default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projectsTable.$inferSelect;
export type InsertProject = typeof projectsTable.$inferInsert;
