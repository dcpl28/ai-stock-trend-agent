import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("[DB] DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 10,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("[DB] Database connection successful");
    return true;
  } catch (err: any) {
    console.error("[DB] Database connection failed:", err.message);
    return false;
  }
}

export const db = drizzle(pool, { schema });
