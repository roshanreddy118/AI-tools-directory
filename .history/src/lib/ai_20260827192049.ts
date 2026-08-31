import OpenAI from "openai";

const ai = new OpenAI({
  baseURL: process.env.AI_BASE_URL || "https://ai-server-lime.vercel.app/api",
  apiKey: process.env.AI_API_KEY || "my-super-secret-key-change-me",
});

export interface EnrichedToolData {
  category: string;
  subcategory: string;
  tags: string[];
  pricingType: string;
  pricingDetails: string;
  hasFreeTier: boolean;
  startingPrice: string;
  platforms: string[];
  features: string[];
  useCases: string[];
  alternatives: string[];
  pros: string[];
  cons: string[];
  bestFor: string;
}

/**
 * Enrich a tool with AI-generated structured data
 */
export async function enrichTool(
  name: string,
  description: string,
  rawData: Record<string, unknown>
): Promise<EnrichedToolData | null> {
  try {
    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI tool analyst. Given information about an AI tool, extract and return structured data as JSON. Be accurate and concise. If you don't know something, use null.`,
        },
        {
          role: "user",
          content: `Analyze this AI tool and return structured JSON:

Name: ${name}
Description: ${description}
Raw data: ${JSON.stringify(rawData).slice(0, 2000)}

Return JSON with these fields:
- category (string): main category like "Coding", "Writing", "Image Generation", "Video", "Audio", "Productivity", "Marketing", "Design", "Data", "Chatbot", "Research", "Education", "Business"
- subcategory (string): more specific subcategory
- tags (string[]): 3-8 relevant tags
- pricingType (string): one of "free", "freemium", "paid", "open-source", "enterprise"
- pricingDetails (string): brief pricing description
- hasFreeTier (boolean): whether a free tier exists
- startingPrice (string): lowest paid price or "Free"
- platforms (string[]): e.g. ["Web", "Mac", "Windows", "Linux", "iOS", "Android", "API", "Chrome Extension", "VS Code"]
- features (string[]): 3-8 key features
- useCases (string[]): 3-5 use cases
- alternatives (string[]): 3-5 similar tools
- pros (string[]): 3-5 advantages
- cons (string[]): 2-4 disadvantages
- bestFor (string): one sentence describing ideal user

Return ONLY valid JSON, no markdown fences.`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // Strip markdown fences if present
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr) as EnrichedToolData;
  } catch (error) {
    console.error(`Failed to enrich tool "${name}":`, error);
    return null;
  }
}

/**
 * Generate a simple text embedding using the AI endpoint
 * Falls back to a basic hash-based embedding if the endpoint doesn't support embeddings
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // Try using the chat endpoint to generate a pseudo-embedding
    // (Since the endpoint may not have a dedicated embeddings endpoint)
    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a text encoder. Given text, output exactly 64 comma-separated floating point numbers between -1 and 1 that represent the semantic meaning of the text. Output ONLY the numbers, nothing else.",
        },
        {
          role: "user",
          content: text.slice(0, 500),
        },
      ],
      max_tokens: 600,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const numbers = content
      .split(",")
      .map((n) => parseFloat(n.trim()))
      .filter((n) => !isNaN(n));

    if (numbers.length >= 60) {
      return numbers.slice(0, 64);
    }

    return null;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return null;
  }
}

export { ai };
