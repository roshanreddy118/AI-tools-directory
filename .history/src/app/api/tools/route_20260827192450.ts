import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq, ilike, and, sql, desc, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const category = searchParams.get("category");
  const pricing = searchParams.get("pricing");
  const search = searchParams.get("q");
  const sort = searchParams.get("sort") || "popularity";
  const offset = (page - 1) * limit;

  try {
    // Build conditions
    const conditions = [eq(tools.isActive, true)];

    if (category) {
      conditions.push(eq(tools.category, category));
    }

    if (pricing) {
      conditions.push(eq(tools.pricingType, pricing));
    }

    if (search) {
      conditions.push(
        sql`(${tools.name} ILIKE ${`%${search}%`} OR ${tools.description} ILIKE ${`%${search}%`})`
      );
    }

    // Sort
    const orderBy =
      sort === "name"
        ? asc(tools.name)
        : sort === "newest"
          ? desc(tools.createdAt)
          : desc(tools.popularity);

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [results, countResult] = await Promise.all([
      db
        .select({
          id: tools.id,
          name: tools.name,
          slug: tools.slug,
          website: tools.website,
          shortDescription: tools.shortDescription,
          category: tools.category,
          pricingType: tools.pricingType,
          hasFreeTier: tools.hasFreeeTier,
          platforms: tools.platforms,
          tags: tools.tags,
          logoUrl: tools.logoUrl,
          popularity: tools.popularity,
          rating: tools.rating,
        })
        .from(tools)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tools)
        .where(where),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      tools: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { error: "Failed to fetch tools" },
      { status: 500 }
    );
  }
}
