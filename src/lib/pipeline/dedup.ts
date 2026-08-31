import { stringSimilarity } from "@/lib/utils";
import { NewTool } from "@/lib/db/schema";

type PartialTool = Partial<NewTool> & { name: string };

/**
 * Deduplicate tools based on:
 * 1. Exact domain match
 * 2. Name similarity (>0.8 Jaccard on words)
 * 3. Slug match
 */
export function deduplicateTools(tools: PartialTool[]): PartialTool[] {
  const seen = new Map<string, PartialTool>(); // key -> merged tool
  const domainMap = new Map<string, string>(); // domain -> key
  const slugMap = new Map<string, string>(); // slug -> key

  for (const tool of tools) {
    const key = findDuplicate(tool, seen, domainMap, slugMap);

    if (key) {
      // Merge with existing
      const existing = seen.get(key)!;
      seen.set(key, mergeTool(existing, tool));
    } else {
      // New tool
      const newKey = tool.slug || tool.name.toLowerCase();
      seen.set(newKey, tool);

      if (tool.domain) {
        domainMap.set(tool.domain, newKey);
      }
      if (tool.slug) {
        slugMap.set(tool.slug, newKey);
      }
    }
  }

  return Array.from(seen.values());
}

function findDuplicate(
  tool: PartialTool,
  seen: Map<string, PartialTool>,
  domainMap: Map<string, string>,
  slugMap: Map<string, string>
): string | null {
  // 1. Exact domain match
  if (tool.domain && domainMap.has(tool.domain)) {
    return domainMap.get(tool.domain)!;
  }

  // 2. Slug match
  if (tool.slug && slugMap.has(tool.slug)) {
    return slugMap.get(tool.slug)!;
  }

  // 3. Name similarity
  for (const [key, existing] of seen) {
    if (stringSimilarity(tool.name, existing.name) > 0.85) {
      return key;
    }
  }

  return null;
}

/**
 * Merge two tool entries, preferring non-null values from newer data
 */
function mergeTool(existing: PartialTool, incoming: PartialTool): PartialTool {
  const merged = { ...existing };

  // For each field, prefer non-null/non-empty incoming value
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;

    const existingValue = (existing as Record<string, unknown>)[key];

    // If existing is empty, take incoming
    if (existingValue === null || existingValue === undefined) {
      (merged as Record<string, unknown>)[key] = value;
      continue;
    }

    // For description, prefer longer one
    if (key === "description" && typeof value === "string" && typeof existingValue === "string") {
      if (value.length > existingValue.length) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }

    // For arrays, merge unique values
    if (Array.isArray(value) && Array.isArray(existingValue)) {
      (merged as Record<string, unknown>)[key] = [
        ...new Set([...existingValue, ...value]),
      ];
    }
  }

  return merged;
}
