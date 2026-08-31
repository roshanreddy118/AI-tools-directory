import { ScrapedTool } from "@/scrapers/base";
import { extractDomain, slugify, normalizeUrl } from "@/lib/utils";
import { NewTool } from "@/lib/db/schema";

/**
 * Normalize a scraped tool into our standard schema format
 */
export function normalizeTool(scraped: ScrapedTool): Partial<NewTool> & { name: string } {
  const name = scraped.name.trim();
  const slug = slugify(name);
  const domain = scraped.website ? extractDomain(scraped.website) : null;
  const website = scraped.website ? normalizeUrl(scraped.website) : null;

  // Normalize pricing
  const pricingType = normalizePricing(scraped.pricing);

  // Normalize category
  const category = normalizeCategory(scraped.category);

  return {
    name,
    slug,
    domain,
    website,
    description: scraped.description || null,
    shortDescription: scraped.description?.slice(0, 500) || null,
    category,
    pricingType,
    logoUrl: scraped.imageUrl || null,
  };
}

function normalizePricing(pricing?: string): string | null {
  if (!pricing) return null;

  const lower = pricing.toLowerCase();

  if (lower.includes("free") && (lower.includes("paid") || lower.includes("pro"))) {
    return "freemium";
  }
  if (lower.includes("open") || lower.includes("oss")) {
    return "open-source";
  }
  if (lower.includes("free")) {
    return "free";
  }
  if (lower.includes("enterprise")) {
    return "enterprise";
  }
  if (lower.includes("paid") || lower.includes("$") || lower.includes("subscription")) {
    return "paid";
  }

  return null;
}

function normalizeCategory(category?: string): string | null {
  if (!category) return null;

  const lower = category.toLowerCase().trim();

  const categoryMap: Record<string, string> = {
    "coding tools": "Coding",
    "coding": "Coding",
    "code": "Coding",
    "writing tools": "Writing",
    "writing": "Writing",
    "content": "Writing",
    "image generators": "Image Generation",
    "image generation": "Image Generation",
    "image": "Image Generation",
    "video generators": "Video",
    "video generation": "Video",
    "video": "Video",
    "chatbots": "Chatbot",
    "chatbot": "Chatbot",
    "chat": "Chatbot",
    "productivity tools": "Productivity",
    "productivity": "Productivity",
    "marketing tools": "Marketing",
    "marketing": "Marketing",
    "design tools": "Design",
    "design": "Design",
    "music generators": "Audio",
    "music": "Audio",
    "audio": "Audio",
    "research tools": "Research",
    "research": "Research",
    "data": "Data",
    "analytics": "Data",
    "education": "Education",
    "business": "Business",
  };

  return categoryMap[lower] || category.charAt(0).toUpperCase() + category.slice(1);
}
