"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string, isAI: boolean) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isAIMode, setIsAIMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), isAIMode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isAIMode ? (
            <Sparkles className="h-5 w-5 text-purple-500" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isAIMode
              ? "Ask anything... e.g. 'free AI tool for removing backgrounds'"
              : "Search AI tools..."
          }
          className="block w-full pl-12 pr-32 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
          disabled={isLoading}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-2">
          <button
            type="button"
            onClick={() => setIsAIMode(!isAIMode)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isAIMode
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={isAIMode ? "AI Search (semantic)" : "Switch to AI search"}
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "..." : "Search"}
          </button>
        </div>
      </div>
    </form>
  );
}
