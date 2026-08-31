"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { Database, Sparkles, Globe, Layers, ArrowRight } from "lucide-react";

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
    fetch("/api/stats")
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

      const response = await fetch(`/api/tools?${params}`);
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
            filters: {
              category: selectedCategory,
              pricing: selectedPricing,
            },
          }),
        });
        const data = await response.json();
        setTools(data.tools || []);
      } else {
        const params = new URLSearchParams({ q: query, limit: "30" });
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedPricing) params.set("pricing", selectedPricing);

        const response = await fetch(`/api/tools?${params}`);
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
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-14 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Discovery
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              <span className="text-white">Find the perfect</span>
              <br />
              <span className="gradient-text">AI tool</span>
              <span className="text-white"> for anything</span>
            </h1>

            <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
              Discover, compare, and choose from the best AI tools.
              Powered by semantic search so you can find exactly what you need.
            </p>

            {/* Stats */}
            {stats && stats.totalTools > 0 && (
              <div className="mt-8 flex justify-center gap-6 sm:gap-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">
                      {stats.totalTools}
                    </div>
                    <div className="text-xs text-gray-500">Tools</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Layers className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">
                      {categories.length}
                    </div>
                    <div className="text-xs text-gray-500">Categories</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Globe className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">
                      {stats.totalSources}
                    </div>
                    <div className="text-xs text-gray-500">Sources</div>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="mt-10">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-600">Try:</span>
              {[
                "free AI coding assistant",
                "image generator",
                "video editing AI",
                "AI for writing",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion, true)}
                  className="text-xs text-gray-500 hover:text-blue-400 border border-gray-800 hover:border-blue-500/30 px-3 py-1 rounded-full transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar */}
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
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-800" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 w-40 bg-gray-800 rounded" />
                        <div className="h-4 w-full bg-gray-800/50 rounded" />
                        <div className="flex gap-2">
                          <div className="h-5 w-16 bg-gray-800 rounded-full" />
                          <div className="h-5 w-20 bg-gray-800 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tools.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    {tools.length} tools found
                  </p>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 text-lg">No tools found</p>
                <p className="text-gray-600 text-sm mt-2">
                  Try a different search or adjust your filters
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
              <span className="font-semibold text-gray-300">AI Tools Directory</span>
            </div>
            <p className="text-sm text-gray-600">
              Built with Next.js, AI enrichment, and semantic search
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Search({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
