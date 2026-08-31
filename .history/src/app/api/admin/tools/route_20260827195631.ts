import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify, extractDomain } from "@/lib/utils";
import { ai } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Simple auth check (use env variable for admin password)
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY || "admin123";
  return authHeader === `Bearer ${adminKey}`;
}

/**
 * POST /api/admin/tools
 * Add a new tool — AI auto-generates all fields from just name + optional URL
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, website } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Tool name is required" },
        { status: 400 }
      );
    }

    // Check if tool already exists
    const slug = slugify(name);
    const existing = await db
      .select({ id: tools.id })
      .from(tools)
      .where(eq(tools.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Tool already exists", slug },
        { status: 409 }
      );
    }

    // AI generates all fields from just the name and website
    const aiData = await generateToolProfile(name, website || null);

    if (!aiData) {
      return NextResponse.json(
        { error: "AI enrichment failed. Try again." },
        { status: 500 }
      );
    }

    // Insert into database
    const domain = website ? extractDomain(website) : aiData.website ? extractDomain(aiData.website) : null;

    const [inserted] = await db
      .insert(tools)
      .values({
        name: name.trim(),
        slug,
        domain,
        website: website || aiData.website || null,
        description: aiData.description,
        shortDescription: aiData.shortDescription,
        category: aiData.category,
        subcategory: aiData.subcategory,
        tags: aiData.tags,
        pricingType: aiData.pricingType,
        pricingDetails: aiData.pricingDetails,
        hasFreeeTier: aiData.hasFreeTier,
        startingPrice: aiData.startingPrice,
        platforms: aiData.platforms,
        features: aiData.features,
        useCases: aiData.useCases,
        integrations: aiData.integrations || [],
        company: aiData.company,
        alternatives: aiData.alternatives,
        pros: aiData.pros,
        cons: aiData.cons,
        bestFor: aiData.bestFor,
        githubUrl: aiData.githubUrl || null,
        twitterUrl: aiData.twitterUrl || null,
        isVerified: false,
        isActive: true,
        lastEnrichedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      tool: inserted,
      message: `"${name}" added successfully with AI-generated profile.`,
    });
  } catch (error) {
    console.error("Error adding tool:", error);
    return NextResponse.json(
      { error: "Failed to add tool" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/tools - List all tools for admin management
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allTools = await db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        category: tools.category,
        pricingType: tools.pricingType,
        isActive: tools.isActive,
        isVerified: tools.isVerified,
        lastEnrichedAt: tools.lastEnrichedAt,
        createdAt: tools.createdAt,
      })
      .from(tools)
      .orderBy(tools.createdAt);

    return NextResponse.json({ tools: allTools });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tools" },
      { status: 500 }
    );
  }
}

/**
 * Use AI to generate a complete tool profile from just a name and optional URL
 */
async function generateToolProfile(name: string, website: string | null) {
  const AI_URL = process.env.AI_BASE_URL || "https://ai-server-lime.vercel.app/api/chat";
  const AI_KEY = process.env.AI_API_KEY || "my-super-secret-key-change-me";

  const prompt = `Generate a complete JSON profile for the AI tool "${name}"${website ? ` (${website})` : ""}. Include ALL these fields:
- website (string, official URL or null)
- description (2-3 sentences)
- shortDescription (under 100 chars)
- category (one of: Coding, Writing, Image Generation, Video, Audio, Productivity, Marketing, Design, Data, Chatbot, Research, Education, Business, Other)
- subcategory (string)
- tags (5-8 strings)
- pricingType (free/freemium/paid/open-source/enterprise)
- pricingDetails (brief pricing tiers)
- hasFreeTier (boolean)
- startingPrice (e.g. "$20/month" or "Free")
- platforms (from: Web, Mac, Windows, Linux, iOS, Android, API, Chrome Extension, VS Code, CLI)
- features (5-8 key features)
- useCases (3-5 use cases)
- integrations (tools it integrates with)
- company (company name)
- alternatives (3-5 competitors)
- pros (3-5 advantages)
- cons (2-4 disadvantages)
- bestFor (one sentence: ideal user)
- githubUrl (string or null)
- twitterUrl (string or null)

Return ONLY valid JSON. No markdown fences.`;

  try {
    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(`AI endpoint returned ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("AI returned empty content");
      return null;
    }

    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI profile generation failed:", error);
    return null;
  }
}
