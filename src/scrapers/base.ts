import { delay } from "@/lib/utils";

export interface ScrapedTool {
  name: string;
  website?: string;
  description?: string;
  category?: string;
  pricing?: string;
  imageUrl?: string;
  sourceUrl: string; // the page we scraped this from
  rawData: Record<string, unknown>; // everything we captured
}

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  rateLimit: number; // ms between requests
  maxPages: number; // max pages to scrape per run
  respectRobotsTxt: boolean;
}

export abstract class BaseScraper {
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  abstract scrape(): AsyncGenerator<ScrapedTool>;

  protected async fetchPage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "AIToolsDirectory/1.0 (research project; respects robots.txt)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.status}`);
        return null;
      }

      await delay(this.config.rateLimit);
      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  }

  protected log(message: string) {
    console.log(`[${this.config.name}] ${message}`);
  }
}
