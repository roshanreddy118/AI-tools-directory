import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull, and, sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { enrichTool, generateEmbedding } from "../src/lib/ai";

const BATCH_SIZE = 10;
const DELAY_BETWEEN_CALLS = 1000; // 1s between AI calls

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting AI enrichment pipeline...\n");

  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient, { schema });

  // Find tools that haven't been enriched yet
  const unenriched = await db
    .select({
      id: schema.tools.id,
      name: schema.tools.name,
      description: schema.tools.description,
      category: schema.tools.category,
    })
    .from(schema.tools)
    .where(
      and(eq(schema.tools.isActive, true), isNull(schema.tools.lastEnrichedAt))
    )
    .limit(BATCH_SIZE);

  console.log(`Found ${unenriched.length} tools to enrich\n`);

  let enriched = 0;
  let failed = 0;

  for (const tool of unenriched) {
    console.log(`Enriching: ${tool.name}...`);

    try {
      // Get enrichment data from AI
      const data = await enrichTool(tool.name, tool.description || "", {
        category: tool.category,
      });

      if (data) {
        // Update tool with enriched data
        await db
          .update(schema.tools)
          .set({
            category: data.category || tool.category,
            subcategory: data.subcategory,
            tags: data.tags,
            pricingType: data.pricingType || undefined,
            pricingDetails: data.pricingDetails,
            hasFreeeTier: data.hasFreeTier,
            startingPrice: data.startingPrice,
            platforms: data.platforms,
            features: data.features,
            useCases: data.useCases,
            alternatives: data.alternatives,
            pros: data.pros,
            cons: data.cons,
            bestFor: data.bestFor,
            lastEnrichedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.tools.id, tool.id));

        enriched++;
        console.log(`  ✓ Enriched with ${data.features.length} features, ${data.alternatives.length} alternatives`);
      } else {
        failed++;
        console.log(`  ✗ No data returned`);
      }

      // Generate embedding
      const embeddingText = `${tool.name} ${tool.description || ""} ${data?.features?.join(" ") || ""} ${data?.useCases?.join(" ") || ""}`;
      const embedding = await generateEmbedding(embeddingText);

      if (embedding) {
        await db
          .update(schema.tools)
          .set({ embedding })
          .where(eq(schema.tools.id, tool.id));
        console.log(`  ✓ Embedding generated (${embedding.length} dims)`);
      }

      await delay(DELAY_BETWEEN_CALLS);
    } catch (error) {
      failed++;
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\n✓ Enrichment complete: ${enriched} enriched, ${failed} failed`);
}

main().catch((error) => {
  console.error("Enrichment pipeline failed:", error);
  process.exit(1);
});
