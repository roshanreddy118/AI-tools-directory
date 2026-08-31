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

  const prompt = `You are an AI tools expert. Given just the name of an AI tool${website ? " and its website" : ""}, generate a comprehensive profile.

Tool Name: ${name}${website ? `\nWebsite: ${website}` : ""}

Generate a complete JSON profile with ALL of these fields. Use your knowledge to fill in accurate information. If you're unsure about something, make your best educated guess based on what you know about the AI tools landscape.

Required JSON fields:
{
  "website": "string (official URL if you know it, null if not)",
  "description": "string (2-3 sentences describing what the tool does)",
  "shortDescription": "string (one sentence, under 100 chars)",
  "category": "string (one of: Coding, Writing, Image Generation, Video, Audio, Productivity, Marketing, Design, Data, Chatbot, Research, Education, Business, DevOps, Security, Translation, Healthcare, Legal, Finance, Other)",
  "subcategory": "string (more specific category)",
  "tags": ["string array, 5-8 relevant tags"],
  "pricingType": "string (one of: free, freemium, paid, open-source, enterprise)",
  "pricingDetails": "string (describe the pricing tiers briefly)",
  "hasFreeTier": boolean,
  "startingPrice": "string (e.g. '$20/month' or 'Free')",
  "platforms": ["string array from: Web, Mac, Windows, Linux, iOS, Android, API, Chrome Extension, VS Code, CLI, Slack, Discord"],
  "features": ["string array, 5-8 key features"],
  "useCases": ["string array, 3-5 use cases"],
  "integrations": ["string array, tools/platforms it integrates with"],
  "company": "string (company name)",
  "alternatives": ["string array, 3-5 competitor tools"],
  "pros": ["string array, 3-5 advantages"],
  "cons": ["string array, 2-4 disadvantages"],
  "bestFor": "string (one sentence: who should use this)",
  "githubUrl": "string or null",
  "twitterUrl": "string or null"
}

Return ONLY valid JSON. No markdown fences, no explanation.`;

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
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(`AI endpoint returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI profile generation failed:", error);
    return null;
  }
}
