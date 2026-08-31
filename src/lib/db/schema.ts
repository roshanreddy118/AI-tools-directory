import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Main tools table
export const tools = pgTable(
  "tools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Core identity
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    domain: varchar("domain", { length: 255 }), // canonical domain for dedup
    website: text("website"),
    description: text("description"),
    shortDescription: varchar("short_description", { length: 500 }),

    // Classification
    category: varchar("category", { length: 100 }),
    subcategory: varchar("subcategory", { length: 100 }),
    tags: jsonb("tags").$type<string[]>().default([]),

    // Pricing
    pricingType: varchar("pricing_type", { length: 50 }), // free, freemium, paid, open-source
    pricingDetails: text("pricing_details"),
    hasFreeeTier: boolean("has_free_tier").default(false),
    startingPrice: varchar("starting_price", { length: 100 }),

    // Technical
    platforms: jsonb("platforms").$type<string[]>().default([]),
    features: jsonb("features").$type<string[]>().default([]),
    useCases: jsonb("use_cases").$type<string[]>().default([]),
    integrations: jsonb("integrations").$type<string[]>().default([]),

    // Company info
    company: varchar("company", { length: 255 }),
    foundedYear: integer("founded_year"),
    headquarters: varchar("headquarters", { length: 255 }),

    // Social / Links
    githubUrl: text("github_url"),
    twitterUrl: text("twitter_url"),
    linkedinUrl: text("linkedin_url"),
    discordUrl: text("discord_url"),

    // Metrics
    popularity: integer("popularity").default(0), // derived score
    rating: real("rating"),
    reviewCount: integer("review_count").default(0),

    // Media
    logoUrl: text("logo_url"),
    screenshotUrls: jsonb("screenshot_urls").$type<string[]>().default([]),

    // AI-generated
    alternatives: jsonb("alternatives").$type<string[]>().default([]),
    pros: jsonb("pros").$type<string[]>().default([]),
    cons: jsonb("cons").$type<string[]>().default([]),
    bestFor: text("best_for"),

    // Embedding for semantic search (1536 dimensions for ada-002, or 384 for small models)
    // We'll store as jsonb and use pgvector extension separately
    embedding: jsonb("embedding").$type<number[]>(),

    // Metadata
    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),
    lastEnrichedAt: timestamp("last_enriched_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("tools_slug_idx").on(table.slug),
    domainIdx: index("tools_domain_idx").on(table.domain),
    categoryIdx: index("tools_category_idx").on(table.category),
    pricingIdx: index("tools_pricing_type_idx").on(table.pricingType),
    nameIdx: index("tools_name_idx").on(table.name),
  })
);

// Sources - directories we scrape from
export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  url: text("url").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  lastScrapedAt: timestamp("last_scraped_at"),
  scrapeFrequency: varchar("scrape_frequency", { length: 50 }).default("daily"),
  toolCount: integer("tool_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Provenance - tracks where each tool's data came from
export const toolSources = pgTable(
  "tool_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    sourceUrl: text("source_url"), // specific page URL
    rawData: jsonb("raw_data"), // original scraped data
    scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
    confidence: real("confidence").default(1.0), // how confident are we in this data
  },
  (table) => ({
    toolSourceIdx: index("tool_sources_tool_idx").on(table.toolId),
    sourceIdx: index("tool_sources_source_idx").on(table.sourceId),
  })
);

// Scrape runs - log of each scraping session
export const scrapeRuns = pgTable("scrape_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id),
  status: varchar("status", { length: 50 }).notNull().default("running"), // running, completed, failed
  toolsFound: integer("tools_found").default(0),
  toolsNew: integer("tools_new").default(0),
  toolsUpdated: integer("tools_updated").default(0),
  errors: jsonb("errors").$type<string[]>().default([]),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Types
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type ToolSource = typeof toolSources.$inferSelect;
export type ScrapeRun = typeof scrapeRuns.$inferSelect;
