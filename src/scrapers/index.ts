import { FuturepediaScraper } from "./futurepedia";
import { BaseScraper } from "./base";

export { BaseScraper, FuturepediaScraper };
export type { ScrapedTool, ScraperConfig } from "./base";

/**
 * Get all active scrapers
 */
export function getAllScrapers(): BaseScraper[] {
  return [new FuturepediaScraper()];
}
