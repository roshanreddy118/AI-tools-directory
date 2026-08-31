"use client";

import Link from "next/link";
import { ArrowUpRight, Globe } from "lucide-react";

interface ToolCardProps {
  tool: {
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
  };
}

const pricingBadge: Record<string, string> = {
  free: "badge-green",
  freemium: "badge-blue",
  "open-source": "badge-purple",
  paid: "badge-amber",
  enterprise: "badge-pink",
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={`/tool/${tool.slug}`}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-gray-50/50 transition-all"
    >
      {/* Logo */}
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gray-100 border border-gray-200/60 flex items-center justify-center overflow-hidden">
        {tool.logoUrl ? (
          <img
            src={tool.logoUrl}
            alt=""
            className="w-7 h-7 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Globe className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
            {tool.name}
          </h3>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {tool.shortDescription && (
          <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
            {tool.shortDescription}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        {tool.category && (
          <span className="badge-gray">{tool.category}</span>
        )}
        {tool.pricingType && (
          <span className={pricingBadge[tool.pricingType] || "badge-gray"}>
            {tool.pricingType}
          </span>
        )}
      </div>

      {/* Score */}
      {tool.score !== undefined && tool.score > 0 && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
          <span className="text-[10px] font-bold text-indigo-600">
            {Math.round(tool.score * 100)}
          </span>
        </div>
      )}
    </Link>
  );
}
