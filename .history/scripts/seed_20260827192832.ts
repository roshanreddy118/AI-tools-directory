import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

/**
 * Seed the database with sample data for development/demo purposes
 */
async function main() {
  console.log("Seeding database...\n");

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // Create sources
  const [futurepedia] = await db
    .insert(schema.sources)
    .values([
      {
        name: "Futurepedia",
        slug: "futurepedia",
        url: "https://www.futurepedia.io",
        description: "AI tools directory with thousands of tools",
      },
      {
        name: "AI Valley",
        slug: "ai-valley",
        url: "https://aivalley.ai",
        description: "Curated AI tools marketplace",
      },
      {
        name: "AI Tool Hunt",
        slug: "ai-tool-hunt",
        url: "https://www.aitoolhunt.com",
        description: "AI tool discovery platform",
      },
    ])
    .returning();

  console.log("✓ Sources created");

  // Insert sample tools
  const sampleTools: schema.NewTool[] = [
    {
      name: "Cursor",
      slug: "cursor",
      domain: "cursor.com",
      website: "https://cursor.com",
      description:
        "AI-powered code editor built on VS Code. Features AI autocomplete, chat, and intelligent code generation to help developers write code faster.",
      shortDescription: "AI-powered code editor with autocomplete and chat",
      category: "Coding",
      subcategory: "IDE",
      tags: ["coding", "ai-editor", "autocomplete", "vscode"],
      pricingType: "freemium",
      pricingDetails: "Free tier available. Pro at $20/month, Business at $40/month.",
      hasFreeeTier: true,
      startingPrice: "$20/month",
      platforms: ["Windows", "Mac", "Linux"],
      features: [
        "AI autocomplete",
        "Chat with codebase",
        "Multi-file editing",
        "Code generation",
        "Bug detection",
      ],
      useCases: ["Software development", "Code review", "Refactoring", "Learning to code"],
      alternatives: ["GitHub Copilot", "Windsurf", "Claude Code", "Kiro"],
      pros: ["Fast AI completions", "Great VS Code base", "Multi-file context"],
      cons: ["Subscription required for full features", "Can be resource-intensive"],
      bestFor: "Professional developers who want AI assistance integrated into their editor workflow",
      company: "Anysphere",
      popularity: 95,
      isVerified: true,
    },
    {
      name: "Midjourney",
      slug: "midjourney",
      domain: "midjourney.com",
      website: "https://midjourney.com",
      description:
        "AI image generation tool that creates stunning artwork from text prompts. Known for high-quality, artistic outputs.",
      shortDescription: "AI art generator creating stunning images from text prompts",
      category: "Image Generation",
      subcategory: "Art Generation",
      tags: ["image-generation", "art", "creative", "design"],
      pricingType: "paid",
      pricingDetails: "Plans from $10/month to $120/month.",
      hasFreeeTier: false,
      startingPrice: "$10/month",
      platforms: ["Web", "Discord"],
      features: [
        "Text-to-image generation",
        "Image upscaling",
        "Style variations",
        "Aspect ratio control",
        "Image blending",
      ],
      useCases: ["Digital art", "Marketing visuals", "Concept art", "Social media content"],
      alternatives: ["DALL-E 3", "Stable Diffusion", "Leonardo AI", "Firefly"],
      pros: ["Exceptional image quality", "Active community", "Consistent style"],
      cons: ["No free tier", "Discord-based interface", "Less control than SD"],
      bestFor: "Artists, designers, and marketers who need high-quality AI-generated visuals",
      company: "Midjourney Inc",
      popularity: 92,
      isVerified: true,
    },
    {
      name: "ChatGPT",
      slug: "chatgpt",
      domain: "openai.com",
      website: "https://chat.openai.com",
      description:
        "Conversational AI assistant by OpenAI. Can help with writing, analysis, coding, math, and creative tasks through natural language interaction.",
      shortDescription: "OpenAI's conversational AI assistant for writing, coding, and analysis",
      category: "Chatbot",
      subcategory: "General Assistant",
      tags: ["chatbot", "writing", "coding", "analysis", "general-purpose"],
      pricingType: "freemium",
      pricingDetails: "Free tier with GPT-3.5. Plus at $20/month with GPT-4.",
      hasFreeeTier: true,
      startingPrice: "$20/month",
      platforms: ["Web", "iOS", "Android", "Mac", "API"],
      features: [
        "Natural language conversation",
        "Code generation",
        "Document analysis",
        "Image generation (DALL-E)",
        "Web browsing",
        "Plugin ecosystem",
      ],
      useCases: ["Writing assistance", "Code help", "Research", "Learning", "Creative projects"],
      alternatives: ["Claude", "Gemini", "Perplexity", "Copilot"],
      pros: ["Versatile", "Large context window", "Plugin ecosystem", "Multimodal"],
      cons: ["Can hallucinate", "Knowledge cutoff", "Rate limits on free tier"],
      bestFor: "Anyone who needs a versatile AI assistant for everyday tasks",
      company: "OpenAI",
      popularity: 99,
      isVerified: true,
    },
    {
      name: "Runway",
      slug: "runway",
      domain: "runway.com",
      website: "https://runwayml.com",
      description:
        "AI video generation and editing platform. Create and edit videos with AI tools including Gen-2 text-to-video, inpainting, and motion tracking.",
      shortDescription: "AI video generation and editing platform",
      category: "Video",
      subcategory: "Video Generation",
      tags: ["video", "generation", "editing", "creative"],
      pricingType: "freemium",
      pricingDetails: "Free tier with limited credits. Standard at $12/month.",
      hasFreeeTier: true,
      startingPrice: "$12/month",
      platforms: ["Web", "iOS"],
      features: [
        "Text-to-video (Gen-2)",
        "Image-to-video",
        "Video inpainting",
        "Motion tracking",
        "Background removal",
      ],
      useCases: ["Video production", "Content creation", "Film/TV", "Marketing"],
      alternatives: ["Pika", "Kling", "Sora", "HeyGen"],
      pros: ["High quality output", "Multiple AI tools", "Fast generation"],
      cons: ["Limited free credits", "Watermark on free tier", "Short clip duration"],
      bestFor: "Video creators and filmmakers who want to augment their workflow with AI",
      company: "Runway AI",
      popularity: 85,
      isVerified: true,
    },
    {
      name: "Notion AI",
      slug: "notion-ai",
      domain: "notion.so",
      website: "https://notion.so",
      description:
        "AI writing and productivity assistant integrated into Notion workspace. Helps with writing, summarizing, brainstorming, and organizing information.",
      shortDescription: "AI assistant integrated into Notion for writing and productivity",
      category: "Productivity",
      subcategory: "Writing Assistant",
      tags: ["productivity", "writing", "notes", "workspace"],
      pricingType: "paid",
      pricingDetails: "$10/month add-on to any Notion plan.",
      hasFreeeTier: false,
      startingPrice: "$10/month",
      platforms: ["Web", "Mac", "Windows", "iOS", "Android"],
      features: [
        "AI writing assistant",
        "Summarization",
        "Translation",
        "Brainstorming",
        "Action item extraction",
      ],
      useCases: ["Note-taking", "Project management", "Knowledge base", "Team collaboration"],
      alternatives: ["Coda AI", "Craft", "Obsidian + AI plugins", "Mem"],
      pros: ["Deep Notion integration", "Easy to use", "Context-aware"],
      cons: ["Requires Notion subscription", "Add-on cost", "Limited outside Notion"],
      bestFor: "Notion users who want AI assistance within their existing workspace",
      company: "Notion Labs",
      popularity: 78,
      isVerified: true,
    },
  ];

  for (const tool of sampleTools) {
    const [inserted] = await db
      .insert(schema.tools)
      .values(tool)
      .returning({ id: schema.tools.id });

    // Record provenance
    await db.insert(schema.toolSources).values({
      toolId: inserted.id,
      sourceId: futurepedia.id,
      sourceUrl: `https://www.futurepedia.io/tool/${tool.slug}`,
      rawData: { seeded: true },
      confidence: 0.95,
    });
  }

  console.log(`✓ ${sampleTools.length} sample tools created`);
  console.log("\n✓ Seed complete!");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
