import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { getAllScrapers } from "../src/scrapers";
import { normalizeTool } from "../src/lib/pipeline/normalize";
import { deduplicateTools } from "../src/lib/pipeline/dedup";
import { slugify, extractDomain } from "../src/lib/utils";

async function main() {
  console.log("Starting scraping pipeline...\n");

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const scrapers = getAllScrapers();
  const allScrapedTools: schema.NewTool[] = [];

  for (const scraper of scrapers) {
    console.log(`\n--- Running scraper ---`);

    // Create scrape run record
    const source = await db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.slug, "futurepedia"))
      .limit(1);

    let sourceId = source[0]?.id;

    if (!sourceId) {
      // Create source if it doesn't exist
      const [newSource] = await db
        .insert(schema.sources)
        .values({
          name: "Futurepedia",
          slug: "futurepedia",
          url: "https://www.futurepedia.io",
          description: "AI tools directory",
        })
        .returning();
      sourceId = newSource.id;
    }

    const [scrapeRun] = await db
      .insert(schema.scrapeRuns)
      .values({
        sourceId,
        status: "running",
      })
      .returning();

    let toolsFound = 0;
    let toolsNew = 0;
    const errors: string[] = [];

    try {
      for await (const scrapedTool of scraper.scrape()) {
        toolsFound++;
        const normalized = normalizeTool(scrapedTool);

        allScrapedTools.push({
          name: normalized.name,
          slug: normalized.slug || slugify(normalized.name),
          domain: normalized.domain || null,
          website: normalized.website || null,
          description: normalized.description || null,
          shortDescription: normalized.shortDescription || null,
          category: normalized.category || null,
          pricingType: normalized.pricingType || null,
          logoUrl: normalized.logoUrl || null,
        });

        // Rate limit output
        if (toolsFound % 50 === 0) {
          console.log(`  Found ${toolsFound} tools so far...`);
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push(errMsg);
      console.error(`Scraper error: ${errMsg}`);
    }

    console.log(`  Total found: ${toolsFound}`);

    // Deduplicate
    console.log("\nDeduplicating...");
    const deduped = deduplicateTools(allScrapedTools as any);
    console.log(`  Before: ${allScrapedTools.length}, After: ${deduped.length}`);

    // Upsert into database
    console.log("\nUpserting to database...");
    for (const tool of deduped) {
      try {
        const existing = await db
          .select({ id: schema.tools.id })
          .from(schema.tools)
          .where(eq(schema.tools.slug, tool.slug!))
          .limit(1);

        if (existing.length === 0) {
          // Insert new tool
          const [inserted] = await db
            .insert(schema.tools)
            .values(tool as schema.NewTool)
            .returning({ id: schema.tools.id });

          // Record provenance
          await db.insert(schema.toolSources).values({
            toolId: inserted.id,
            sourceId,
            sourceUrl: null,
            rawData: tool as any,
          });

          toolsNew++;
        } else {
          // Update existing tool with new data
          await db
            .update(schema.tools)
            .set({
              ...tool,
              updatedAt: new Date(),
            })
            .where(eq(schema.tools.slug, tool.slug!));
        }
      } catch (error) {
        // Skip duplicates / constraint violations
        const errMsg = error instanceof Error ? error.message : String(error);
        if (!errMsg.includes("duplicate") && !errMsg.includes("unique")) {
          errors.push(`Insert error for ${tool.name}: ${errMsg}`);
        }
      }
    }

    // Update scrape run
    await db
      .update(schema.scrapeRuns)
      .set({
        status: errors.length > 0 ? "completed" : "completed",
        toolsFound,
        toolsNew,
        errors,
        completedAt: new Date(),
      })
      .where(eq(schema.scrapeRuns.id, scrapeRun.id));

    // Update source
    await db
      .update(schema.sources)
      .set({
        lastScrapedAt: new Date(),
        toolCount: toolsFound,
      })
      .where(eq(schema.sources.id, sourceId));

    console.log(`\nScrape complete: ${toolsFound} found, ${toolsNew} new`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
      errors.forEach((e) => console.log(`  - ${e}`));
    }
  }

  console.log("\n✓ Pipeline complete!");
}

main().catch((error) => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
