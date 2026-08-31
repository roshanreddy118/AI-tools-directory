"use client";

import {
  Code,
  Pen,
  Image,
  Video,
  Music,
  Zap,
  Megaphone,
  Palette,
  MessageCircle,
  Search,
  Database,
  GraduationCap,
  Briefcase,
} from "lucide-react";

interface FilterSidebarProps {
  categories: string[];
  selectedCategory: string | null;
  selectedPricing: string | null;
  onCategoryChange: (category: string | null) => void;
  onPricingChange: (pricing: string | null) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Coding: <Code className="w-4 h-4" />,
  Writing: <Pen className="w-4 h-4" />,
  "Image Generation": <Image className="w-4 h-4" />,
  Video: <Video className="w-4 h-4" />,
  Audio: <Music className="w-4 h-4" />,
  Productivity: <Zap className="w-4 h-4" />,
  Marketing: <Megaphone className="w-4 h-4" />,
  Design: <Palette className="w-4 h-4" />,
  Chatbot: <MessageCircle className="w-4 h-4" />,
  Research: <Search className="w-4 h-4" />,
  Data: <Database className="w-4 h-4" />,
  Education: <GraduationCap className="w-4 h-4" />,
  Business: <Briefcase className="w-4 h-4" />,
};

const pricingOptions = [
  { value: "free", label: "Free", color: "text-emerald-400" },
  { value: "freemium", label: "Freemium", color: "text-blue-400" },
  { value: "paid", label: "Paid", color: "text-amber-400" },
  { value: "open-source", label: "Open Source", color: "text-purple-400" },
  { value: "enterprise", label: "Enterprise", color: "text-pink-400" },
];

export function FilterSidebar({
  categories,
  selectedCategory,
  selectedPricing,
  onCategoryChange,
  onPricingChange,
}: FilterSidebarProps) {
  return (
    <aside className="w-60 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4 space-y-8">
        {/* Categories */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Categories
          </h3>
          <div className="space-y-0.5">
            <button
              onClick={() => onCategoryChange(null)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                !selectedCategory
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Zap className="w-4 h-4" />
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  selectedCategory === category
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                {categoryIcons[category] || <Zap className="w-4 h-4" />}
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Pricing
          </h3>
          <div className="space-y-0.5">
            <button
              onClick={() => onPricingChange(null)}
              className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                !selectedPricing
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              All Pricing
            </button>
            {pricingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPricingChange(option.value)}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  selectedPricing === option.value
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
