import * as schema from "./schema";

let _db: any = null;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }

  // Use Neon serverless for production (Vercel), standard postgres for local
  if (url.includes("neon.tech") || url.includes("neon.") || process.env.USE_NEON === "true") {
    // Neon serverless driver (for Vercel/production)
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    const sql = neon(url);
    return drizzle(sql, { schema });
  } else {
    // Standard postgres driver (for local development)
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    const sql = postgres(url);
    return drizzle(sql, { schema });
  }
}

// Lazy initialization
export const db = new Proxy({} as any, {
  get(_, prop) {
    if (!_db) {
      _db = createDb();
    }
    return _db[prop];
  },
});

export * from "./schema";
