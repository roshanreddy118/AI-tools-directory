import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";
import { generateEmbedding } from "@/lib/ai";
import { cosineSimilarity } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * AI-powered semantic search endpoint
 * POST /api/tools/search
 * Body: { query: string, limit?: number, filters?: { category?, pricing? } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 20, filters = {} } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Step 1: Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Get tools with embeddings
    const conditions = [eq(tools.isActive, true)];
    if (filters.category) conditions.push(eq(tools.category, filters.category));
    if (filters.pricing) conditions.push(eq(tools.pricingType, filters.pricing));

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const allTools = await db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        website: tools.website,
        shortDescription: tools.shortDescription,
        description: tools.description,
        category: tools.category,
        pricingType: tools.pricingType,
        hasFreeTier: tools.hasFreeeTier,
        platforms: tools.platforms,
        tags: tools.tags,
        features: tools.features,
        logoUrl: tools.logoUrl,
        popularity: tools.popularity,
        embedding: tools.embedding,
      })
      .from(tools)
      .where(where);

    // Step 3: If we have embeddings, use cosine similarity
    let results;
    if (queryEmbedding && allTools.some((t: any) => t.embedding)) {
      results = allTools
        .filter((t: any) => t.embedding)
        .map((t: any) => ({
          ...t,
          score: cosineSimilarity(queryEmbedding, t.embedding!),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } else {
      // Fallback: keyword-based scoring
      const queryWords = query.toLowerCase().split(/\s+/);
      results = allTools
        .map((t: any) => {
          const text = `${t.name} ${t.description || ""} ${t.category || ""} ${(t.tags as string[] || []).join(" ")} ${(t.features as string[] || []).join(" ")}`.toLowerCase();
          const score = queryWords.reduce(
            (acc, word) => acc + (text.includes(word) ? 1 : 0),
            0
          ) / queryWords.length;
          return { ...t, score };
        })
        .filter((t) => t.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    // Remove embedding from response
    const cleaned = results.map(({ embedding, ...rest }) => rest);

    return NextResponse.json({
      tools: cleaned,
      query,
      total: cleaned.length,
    });
  } catch (error) {
    console.error("Error in semantic search:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
