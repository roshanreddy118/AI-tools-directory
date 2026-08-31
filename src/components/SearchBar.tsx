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
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="relative flex items-center border border-gray-300 rounded-2xl bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
        <div className="pl-4">
          {isAIMode ? (
            <Sparkles className="h-[18px] w-[18px] text-indigo-500" />
          ) : (
            <Search className="h-[18px] w-[18px] text-gray-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isAIMode
              ? "Describe what you need..."
              : "Search AI tools..."
          }
          className="flex-1 px-3 py-3.5 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
          disabled={isLoading}
        />

        <div className="flex items-center gap-1.5 pr-2">
          <button
            type="button"
            onClick={() => setIsAIMode(!isAIMode)}
            className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center gap-1.5 ${
              isAIMode
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
            title={isAIMode ? "AI Search active" : "Enable AI search"}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAIMode ? "AI" : "AI"}</span>
          </button>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn-primary"
          >
            {isLoading ? "..." : "Search"}
          </button>
        </div>
      </div>
    </form>
  );
}
