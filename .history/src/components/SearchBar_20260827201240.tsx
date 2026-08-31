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
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />

        <div className="relative flex items-center bg-gray-800/80 border border-gray-700 rounded-2xl backdrop-blur-sm focus-within:border-blue-500/50 transition-colors">
          <div className="pl-5">
            {isAIMode ? (
              <Sparkles className="h-5 w-5 text-purple-400" />
            ) : (
              <Search className="h-5 w-5 text-gray-500" />
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
            className="flex-1 px-4 py-4 bg-transparent text-gray-100 placeholder-gray-500 outline-none text-lg"
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 pr-3">
            <button
              type="button"
              onClick={() => setIsAIMode(!isAIMode)}
              className={`p-2.5 rounded-xl transition-all ${
                isAIMode
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-700/50"
              }`}
              title={isAIMode ? "AI Search active" : "Switch to AI search"}
            >
              <Sparkles className="h-4 w-4" />
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
      </div>
    </form>
  );
}
