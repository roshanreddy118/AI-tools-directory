"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { Layers, Search } from "lucide-react";

interface ToolResult {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  shortDescription?: string | null;
  category?: string | null;
  pricingType?: string | null;
  hasFreeTier?: boolean | null;
  platforms?: string[] | null;
  tags?: string[] | null;
  logoUrl?: string | null;
  popularity?: number | null;
  score?: number;
}

interface Stats {
  totalTools: number;
  totalSources: number;
  categories: { category: string; count: number }[];
}

export default function HomePage() {
  const [tools, setTools] = useState<ToolResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const fetchTools = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedPricing) params.set("pricing", selectedPricing);
      params.set("limit", "30");

      const response = await fetch(`/api/tools?${params}`, { cache: "no-store" });
      const data = await response.json();
      setTools(data.tools || []);
      setHasSearched(true);
    } catch (error) {
      console.error("Failed to fetch tools:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedPricing]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleSearch = async (query: string, isAI: boolean) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      if (isAI) {
        const response = await fetch("/api/tools/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            filters: { category: selectedCategory, pricing: selectedPricing },
          }),
        });
        const data = await response.json();
        setTools(data.tools || []);
      } else {
        const params = new URLSearchParams({ q: query, limit: "30" });
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedPricing) params.set("pricing", selectedPricing);

        const response = await fetch(`/api/tools?${params}`, { cache: "no-store" });
        const data = await response.json();
        setTools(data.tools || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories =
    stats?.categories?.map((c) => c.category).filter(Boolean) || [];

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">AI Tools</span>
          </div>
          {stats && stats.totalTools > 0 && (
            <span className="text-xs text-gray-400">
              {stats.totalTools} tools indexed
            </span>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">
            Discover AI tools
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Search across {stats?.totalTools || "hundreds of"} tools. Use AI search to describe what you need in plain language.
          </p>

          <div className="mt-8">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {[
              "AI coding assistant",
              "image generator",
              "video tools",
              "writing help",
              "open source",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion, true)}
                className="text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex gap-10">
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedPricing={selectedPricing}
            onCategoryChange={setSelectedCategory}
            onPricingChange={setSelectedPricing}
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="h-3 w-64 bg-gray-50 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-gray-50 rounded" />
                  </div>
                ))}
              </div>
            ) : tools.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2 px-4">
                  <p className="text-xs text-gray-400">
                    {tools.length} result{tools.length !== 1 ? "s" : ""}
                  </p>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ) : hasSearched ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No tools found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try a different search term
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
