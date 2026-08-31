import { NextRequest, NextResponse } from "next/server";
import { db, tools, toolSources, sources } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const tool = await db
      .select()
      .from(tools)
      .where(eq(tools.slug, params.slug))
      .limit(1);

    if (tool.length === 0) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    // Get provenance data
    const provenance = await db
      .select({
        sourceUrl: toolSources.sourceUrl,
        scrapedAt: toolSources.scrapedAt,
        confidence: toolSources.confidence,
        sourceName: sources.name,
        sourceSlug: sources.slug,
      })
      .from(toolSources)
      .innerJoin(sources, eq(toolSources.sourceId, sources.id))
      .where(eq(toolSources.toolId, tool[0].id));

    return NextResponse.json({
      tool: tool[0],
      sources: provenance,
    });
  } catch (error) {
    console.error("Error fetching tool:", error);
    return NextResponse.json(
      { error: "Failed to fetch tool" },
      { status: 500 }
    );
  }
}
