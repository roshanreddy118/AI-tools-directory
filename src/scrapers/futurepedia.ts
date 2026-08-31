import * as cheerio from "cheerio";
import { BaseScraper, ScrapedTool, ScraperConfig } from "./base";

const config: ScraperConfig = {
  name: "Futurepedia",
  baseUrl: "https://www.futurepedia.io",
  rateLimit: 2000, // 2 seconds between requests
  maxPages: 50,
  respectRobotsTxt: true,
};

export class FuturepediaScraper extends BaseScraper {
  constructor() {
    super(config);
  }

  async *scrape(): AsyncGenerator<ScrapedTool> {
    this.log("Starting scrape...");

    // Futurepedia has category pages and a main tools listing
    const categories = [
      "ai-coding-tools",
      "ai-writing-tools",
      "ai-image-generators",
      "ai-video-generators",
      "ai-chatbots",
      "ai-productivity-tools",
      "ai-marketing-tools",
      "ai-design-tools",
      "ai-music-generators",
      "ai-research-tools",
    ];

    for (const category of categories) {
      this.log(`Scraping category: ${category}`);
      let page = 1;

      while (page <= this.config.maxPages) {
        const url = `${this.config.baseUrl}/ai-tools/${category}?page=${page}`;
        const html = await this.fetchPage(url);

        if (!html) break;

        const tools = this.parseListingPage(html, category);
        if (tools.length === 0) break;

        for (const tool of tools) {
          yield tool;
        }

        this.log(`  Page ${page}: found ${tools.length} tools`);
        page++;
      }
    }

    this.log("Scrape complete.");
  }

  private parseListingPage(html: string, category: string): ScrapedTool[] {
    const $ = cheerio.load(html);
    const tools: ScrapedTool[] = [];

    // Futurepedia typically lists tools in card-like elements
    // This selector may need adjustment based on current site structure
    $('[data-testid="tool-card"], .tool-card, article, [class*="ToolCard"]').each(
      (_, element) => {
        const $el = $(element);

        const name =
          $el.find("h2, h3, [class*='title'], [class*='name']").first().text().trim() ||
          $el.find("a").first().text().trim();

        if (!name) return;

        const description =
          $el.find("p, [class*='description'], [class*='desc']").first().text().trim();

        const link = $el.find("a").first().attr("href") || "";
        const sourceUrl = link.startsWith("http")
          ? link
          : `${this.config.baseUrl}${link}`;

        const website = $el.find('a[href*="http"]').not('[href*="futurepedia"]').first().attr("href");

        const imageUrl =
          $el.find("img").first().attr("src") ||
          $el.find("img").first().attr("data-src");

        const pricing =
          $el.find('[class*="pricing"], [class*="price"], .badge').first().text().trim();

        tools.push({
          name,
          website,
          description,
          category: category.replace(/-/g, " ").replace("ai ", ""),
          pricing: pricing || undefined,
          imageUrl: imageUrl || undefined,
          sourceUrl,
          rawData: {
            name,
            description,
            website,
            category,
            pricing,
            imageUrl,
            sourceUrl,
            scrapedFrom: "futurepedia",
          },
        });
      }
    );

    // Fallback: try generic link-based extraction if no cards found
    if (tools.length === 0) {
      $("a[href*='/tool/']").each((_, element) => {
        const $el = $(element);
        const name = $el.text().trim();
        const href = $el.attr("href") || "";

        if (name && name.length > 2 && name.length < 100) {
          const sourceUrl = href.startsWith("http")
            ? href
            : `${this.config.baseUrl}${href}`;

          tools.push({
            name,
            sourceUrl,
            category: category.replace(/-/g, " ").replace("ai ", ""),
            rawData: {
              name,
              category,
              sourceUrl,
              scrapedFrom: "futurepedia",
            },
          });
        }
      });
    }

    return tools;
  }
}
