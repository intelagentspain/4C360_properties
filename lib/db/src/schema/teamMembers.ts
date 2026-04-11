import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const teamMembersTable = pgTable("team_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  perspective: text("perspective").default("Operational"),
  assignedClients: text("assigned_clients").array().default([]),
  zones: text("zones").array().default([]),
  skills: text("skills"),
  responsibilities: text("responsibilities"),
  privileges: text("privileges").array().default([]),
  mobile: text("mobile"),
  whatsapp: text("whatsapp"),
  location: text("location"),
  availability: text("availability"),
  shift: text("shift"),
  commChannels: text("comm_channels").array().default([]),
  siteIds: text("site_ids").array().default([]),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type TeamMember = typeof teamMembersTable.$inferSelect;
export type InsertTeamMember = typeof teamMembersTable.$inferInsert;
