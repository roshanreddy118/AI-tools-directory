import { neon } from "@neondatabase/serverless";
import "dotenv/config";

/**
 * Create all tables directly on Neon using the serverless driver.
 * Idempotent — uses IF NOT EXISTS everywhere.
 */
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log("Creating tables on Neon...\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "tools" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(255) NOT NULL,
      "slug" varchar(255) NOT NULL UNIQUE,
      "domain" varchar(255),
      "website" text,
      "description" text,
      "short_description" varchar(500),
      "category" varchar(100),
      "subcategory" varchar(100),
      "tags" jsonb DEFAULT '[]'::jsonb,
      "pricing_type" varchar(50),
      "pricing_details" text,
      "has_free_tier" boolean DEFAULT false,
      "starting_price" varchar(100),
      "platforms" jsonb DEFAULT '[]'::jsonb,
      "features" jsonb DEFAULT '[]'::jsonb,
      "use_cases" jsonb DEFAULT '[]'::jsonb,
      "integrations" jsonb DEFAULT '[]'::jsonb,
      "company" varchar(255),
      "founded_year" integer,
      "headquarters" varchar(255),
      "github_url" text,
      "twitter_url" text,
      "linkedin_url" text,
      "discord_url" text,
      "popularity" integer DEFAULT 0,
      "rating" real,
      "review_count" integer DEFAULT 0,
      "logo_url" text,
      "screenshot_urls" jsonb DEFAULT '[]'::jsonb,
      "alternatives" jsonb DEFAULT '[]'::jsonb,
      "pros" jsonb DEFAULT '[]'::jsonb,
      "cons" jsonb DEFAULT '[]'::jsonb,
      "best_for" text,
      "embedding" jsonb,
      "is_verified" boolean DEFAULT false,
      "is_active" boolean DEFAULT true,
      "last_enriched_at" timestamp,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✓ tools");

  await sql`
    CREATE TABLE IF NOT EXISTS "sources" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(255) NOT NULL,
      "slug" varchar(100) NOT NULL UNIQUE,
      "url" text NOT NULL,
      "description" text,
      "is_active" boolean DEFAULT true,
      "last_scraped_at" timestamp,
      "scrape_frequency" varchar(50) DEFAULT 'daily',
      "tool_count" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✓ sources");

  await sql`
    CREATE TABLE IF NOT EXISTS "tool_sources" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tool_id" uuid NOT NULL REFERENCES "tools"("id") ON DELETE CASCADE,
      "source_id" uuid NOT NULL REFERENCES "sources"("id") ON DELETE CASCADE,
      "source_url" text,
      "raw_data" jsonb,
      "scraped_at" timestamp DEFAULT now() NOT NULL,
      "confidence" real DEFAULT 1.0
    )
  `;
  console.log("✓ tool_sources");

  await sql`
    CREATE TABLE IF NOT EXISTS "scrape_runs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "source_id" uuid NOT NULL REFERENCES "sources"("id"),
      "status" varchar(50) DEFAULT 'running' NOT NULL,
      "tools_found" integer DEFAULT 0,
      "tools_new" integer DEFAULT 0,
      "tools_updated" integer DEFAULT 0,
      "errors" jsonb DEFAULT '[]'::jsonb,
      "started_at" timestamp DEFAULT now() NOT NULL,
      "completed_at" timestamp
    )
  `;
  console.log("✓ scrape_runs");

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS "tools_domain_idx" ON "tools" ("domain")`;
  await sql`CREATE INDEX IF NOT EXISTS "tools_category_idx" ON "tools" ("category")`;
  await sql`CREATE INDEX IF NOT EXISTS "tools_pricing_type_idx" ON "tools" ("pricing_type")`;
  await sql`CREATE INDEX IF NOT EXISTS "tools_name_idx" ON "tools" ("name")`;
  await sql`CREATE INDEX IF NOT EXISTS "tool_sources_tool_idx" ON "tool_sources" ("tool_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "tool_sources_source_idx" ON "tool_sources" ("source_id")`;
  console.log("✓ indexes");

  console.log("\n✓ All tables created on Neon!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
