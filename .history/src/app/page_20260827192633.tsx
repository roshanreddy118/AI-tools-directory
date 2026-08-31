"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { Database, Sparkles, Globe, Zap } from "lucide-react";

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

  // Fetch stats on mount
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  // Fetch tools when filters change
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
        // Semantic search
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
        // Keyword search
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

  const categories = stats?.categories?.map((c) => c.category).filter(Boolean) || [];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              AI Tools Directory
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Discover, compare, and find the perfect AI tool for your needs.
              Search across thousands of tools with AI-powered recommendations.
            </p>

            {/* Stats */}
            {stats && (
              <div className="mt-8 flex justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>{stats.totalTools.toLocaleString()} tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{stats.totalSources} sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>{categories.length} categories</span>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="mt-8">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            <p className="mt-3 text-sm text-gray-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Try AI search: &quot;free AI tool for removing backgrounds from photos&quot;
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : tools.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {tools.length} tools found
                </p>
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No tools found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
