import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, isNull } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import "dotenv/config";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const toolsWithoutLogos = await db
    .select({ id: schema.tools.id, name: schema.tools.name, domain: schema.tools.domain })
    .from(schema.tools)
    .where(isNull(schema.tools.logoUrl));

  console.log(`Found ${toolsWithoutLogos.length} tools without logos`);

  for (const tool of toolsWithoutLogos) {
    if (tool.domain) {
      const logoUrl = `https://www.google.com/s2/favicons?domain=${tool.domain}&sz=128`;
      await db.update(schema.tools).set({ logoUrl }).where(eq(schema.tools.id, tool.id));
      console.log(`  ✓ ${tool.name} -> ${tool.domain}`);
    } else {
      console.log(`  ✗ ${tool.name} — no domain`);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

main();
