import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify, extractDomain } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY || "admin123";
  return authHeader === `Bearer ${adminKey}`;
}

/**
 * POST /api/admin/tools
 * Add a new tool — searches the web first, then AI generates profile from real data
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

    // Step 1: Search the web for real information about this tool
    const webContext = await searchForTool(name, website || null);

    // Step 2: AI generates profile using real web data as context
    const aiData = await generateToolProfile(name, website || null, webContext);

    if (!aiData) {
      return NextResponse.json(
        { error: "AI enrichment failed. Try again." },
        { status: 500 }
      );
    }

    // Insert into database
    const domain = website
      ? extractDomain(website)
      : aiData.website
        ? extractDomain(aiData.website)
        : null;

    // Auto-fetch logo from the domain
    const logoUrl = domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      : null;

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
        logoUrl,
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
 * Step 1: Search the web to get real information about the tool
 */
async function searchForTool(name: string, website: string | null): Promise<string> {
  try {
    // Try to fetch the tool's website if provided
    let websiteContent = "";
    if (website) {
      try {
        const res = await fetch(website, {
          headers: { "User-Agent": "AIToolsDirectory/1.0" },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const html = await res.text();
          // Extract text content (strip HTML tags), limit to 2000 chars
          websiteContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 2000);
        }
      } catch {
        // Website fetch failed, continue without it
      }
    }

    // Also do a simple search by fetching from DuckDuckGo lite (no API key needed)
    let searchContent = "";
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(name + " AI tool")}`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "AIToolsDirectory/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const html = await res.text();
        // Extract search result snippets
        const snippets = html
          .match(/class="result__snippet"[^>]*>(.*?)<\/a>/gi)
          ?.map((s) => s.replace(/<[^>]+>/g, "").trim())
          ?.slice(0, 5)
          ?.join("\n");
        searchContent = snippets || "";
      }
    } catch {
      // Search failed, continue without it
    }

    const context = [
      websiteContent ? `WEBSITE CONTENT:\n${websiteContent}` : "",
      searchContent ? `SEARCH RESULTS:\n${searchContent}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return context || "No web data found. Use your knowledge but be conservative — if unsure, say null.";
  } catch {
    return "No web data found. Use your knowledge but be conservative — if unsure, say null.";
  }
}

/**
 * Step 2: AI generates profile using real web context
 */
async function generateToolProfile(
  name: string,
  website: string | null,
  webContext: string
) {
  const AI_URL = process.env.AI_BASE_URL || "https://ai-server-lime.vercel.app/api/chat";
  const AI_KEY = process.env.AI_API_KEY || "my-super-secret-key-change-me";

  const prompt = `Generate a JSON profile for the AI tool "${name}"${website ? ` (${website})` : ""}.

IMPORTANT: Use ONLY the following real web data to create the profile. Do NOT make up information. If something isn't clear from the data, use null.

${webContext.slice(0, 1500)}

---

Return a JSON object with these fields (use null if unknown):
- website (string or null)
- description (2-3 sentences based on real data)
- shortDescription (under 100 chars)
- category (one of: Coding, Writing, Image Generation, Video, Audio, Productivity, Marketing, Design, Data, Chatbot, Research, Education, Business, Other)
- subcategory (string)
- tags (5-8 strings)
- pricingType (free/freemium/paid/open-source/enterprise)
- pricingDetails (string or null)
- hasFreeTier (boolean)
- startingPrice (string or null)
- platforms (array from: Web, Mac, Windows, Linux, iOS, Android, API, Chrome Extension, VS Code, CLI)
- features (5-8 key features)
- useCases (3-5 use cases)
- integrations (array or [])
- company (string or null)
- alternatives (3-5 competitors)
- pros (3-5 advantages)
- cons (2-4 disadvantages)
- bestFor (one sentence)
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
        max_tokens: 3000,
        temperature: 0.2,
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
