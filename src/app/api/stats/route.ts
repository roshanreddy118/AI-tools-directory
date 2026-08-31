import { NextResponse } from "next/server";
import { db, tools, sources, scrapeRuns } from "@/lib/db";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [toolCount, sourceCount, categoryStats, pricingStats] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(tools).where(eq(tools.isActive, true)),
        db.select({ count: sql<number>`count(*)` }).from(sources).where(eq(sources.isActive, true)),
        db
          .select({
            category: tools.category,
            count: sql<number>`count(*)`,
          })
          .from(tools)
          .where(eq(tools.isActive, true))
          .groupBy(tools.category)
          .orderBy(sql`count(*) DESC`),
        db
          .select({
            pricingType: tools.pricingType,
            count: sql<number>`count(*)`,
          })
          .from(tools)
          .where(eq(tools.isActive, true))
          .groupBy(tools.pricingType),
      ]);

    return NextResponse.json({
      totalTools: Number(toolCount[0]?.count || 0),
      totalSources: Number(sourceCount[0]?.count || 0),
      categories: categoryStats,
      pricing: pricingStats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
