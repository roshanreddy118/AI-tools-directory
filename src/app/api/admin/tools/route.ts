import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify, extractDomain } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow up to 60s (Vercel Pro); Hobby plan caps at 10s

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

    const asArray = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

    const [inserted] = await db
      .insert(tools)
      .values({
        name: name.trim(),
        slug,
        domain,
        website: website || aiData.website || null,
        description: aiData.description || `${name.trim()} is an AI tool.`,
        shortDescription:
          aiData.shortDescription ||
          (aiData.description ? String(aiData.description).slice(0, 100) : name.trim()),
        category: aiData.category || "Other",
        subcategory: aiData.subcategory || null,
        tags: asArray(aiData.tags),
        pricingType: aiData.pricingType || null,
        pricingDetails: aiData.pricingDetails || null,
        hasFreeeTier: Boolean(aiData.hasFreeTier),
        startingPrice: aiData.startingPrice || null,
        platforms: asArray(aiData.platforms),
        features: asArray(aiData.features),
        useCases: asArray(aiData.useCases),
        integrations: asArray(aiData.integrations),
        company: aiData.company || null,
        alternatives: asArray(aiData.alternatives),
        pros: asArray(aiData.pros),
        cons: asArray(aiData.cons),
        bestFor: aiData.bestFor || null,
        githubUrl: aiData.githubUrl || null,
        twitterUrl: aiData.twitterUrl || null,
        logoUrl,
        popularity: 50, // default so new tools appear mid-list, not buried at 0
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
  // Run website fetch and search in PARALLEL with short timeouts so we
  // never blow past the serverless function limit.
  const fetchWebsite = async (): Promise<string> => {
    if (!website) return "";
    try {
      const res = await fetch(website, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AIToolsDirectory/1.0)" },
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) return "";
      const html = await res.text();
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1500);
    } catch {
      return "";
    }
  };

  const fetchSearch = async (): Promise<string> => {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(name + " AI tool")}`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AIToolsDirectory/1.0)" },
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) return "";
      const html = await res.text();
      const snippets = html
        .match(/class="result__snippet"[^>]*>(.*?)<\/a>/gi)
        ?.map((s) => s.replace(/<[^>]+>/g, "").trim())
        ?.slice(0, 5)
        ?.join("\n");
      return snippets || "";
    } catch {
      return "";
    }
  };

  const [websiteContent, searchContent] = await Promise.all([
    fetchWebsite(),
    fetchSearch(),
  ]);

  const context = [
    websiteContent ? `WEBSITE CONTENT:\n${websiteContent}` : "",
    searchContent ? `SEARCH RESULTS:\n${searchContent}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    context ||
    "No web data was retrieved. Use your own knowledge of this tool to fill in the profile as accurately as you can; use null only for fields you truly cannot determine."
  );
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

    return parseProfileJson(content);
  } catch (error) {
    console.error("AI profile generation failed:", error);
    return null;
  }
}

/**
 * Robustly extract a JSON object from the model output. The model sometimes
 * adds markdown fences or extra prose, so we grab the first {...} block.
 */
function parseProfileJson(content: string): any | null {
  // 1. Strip markdown fences
  const cleaned = content.replace(/```json?/gi, "").replace(/```/g, "").trim();

  // 2. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // continue
  }

  // 3. Extract the outermost {...} block
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = cleaned.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  console.error("Could not parse AI JSON. Raw content:", content.slice(0, 300));
  return null;
}
