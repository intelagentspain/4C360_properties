import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool as PgPool } from "pg";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function missingDatabaseError(): Error {
  return new Error(
    "DATABASE_URL must be set before using database-backed API routes.",
  );
}

function createMissingDatabaseProxy<T extends object>(): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      throw missingDatabaseError();
    },
  });
}

export const hasDatabaseConnection = Boolean(process.env.DATABASE_URL);

const livePool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : undefined;
const liveDb = livePool ? drizzle<typeof schema>(livePool, { schema }) : undefined;

export const pool = (livePool ?? createMissingDatabaseProxy()) as PgPool;
export const db = (liveDb ?? createMissingDatabaseProxy()) as NodePgDatabase<typeof schema>;

export * from "./schema";

export { eq, desc, asc, and, or, sql } from "drizzle-orm";
