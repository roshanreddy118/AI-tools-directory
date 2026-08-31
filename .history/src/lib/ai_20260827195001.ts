const AI_URL = process.env.AI_BASE_URL || "https://ai-server-lime.vercel.app/api/chat";
const AI_KEY = process.env.AI_API_KEY || "my-super-secret-key-change-me";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: { message: { content: string } }[];
}

/**
 * Call the custom AI endpoint directly
 */
async function chatCompletion(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string | null> {
  const { maxTokens = 800, temperature = 0.3 } = options;

  try {
    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      console.error(`AI endpoint returned ${response.status}`);
      return null;
    }

    const data: ChatResponse = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("AI request failed:", error);
    return null;
  }
}

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
  const content = await chatCompletion(
    [
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
    { maxTokens: 1000, temperature: 0.3 }
  );

  if (!content) return null;

  try {
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr) as EnrichedToolData;
  } catch (error) {
    console.error(`Failed to parse enrichment JSON for "${name}":`, error);
    return null;
  }
}

/**
 * Generate a simple embedding using the AI endpoint
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const content = await chatCompletion(
    [
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
    { maxTokens: 600, temperature: 0 }
  );

  if (!content) return null;

  const numbers = content
    .split(",")
    .map((n) => parseFloat(n.trim()))
    .filter((n) => !isNaN(n));

  if (numbers.length >= 60) {
    return numbers.slice(0, 64);
  }

  return null;
}

// Export for use in search route
export const ai = { chatCompletion };
