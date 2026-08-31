"use client";

import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";

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

const pricingColors: Record<string, string> = {
  free: "badge-green",
  freemium: "badge-blue",
  "open-source": "badge-purple",
  paid: "badge-gray",
  enterprise: "badge-gray",
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link href={`/tool/${tool.slug}`} className="card block group">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {tool.logoUrl ? (
            <img
              src={tool.logoUrl}
              alt={`${tool.name} logo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Globe className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
              {tool.name}
            </h3>
            {tool.website && (
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
          </div>

          {tool.shortDescription && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {tool.shortDescription}
            </p>
          )}

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {tool.category && (
              <span className="badge-blue">{tool.category}</span>
            )}
            {tool.pricingType && (
              <span className={pricingColors[tool.pricingType] || "badge-gray"}>
                {tool.pricingType}
              </span>
            )}
            {tool.platforms?.slice(0, 3).map((platform) => (
              <span key={platform} className="badge-gray">
                {platform}
              </span>
            ))}
          </div>
        </div>

        {/* Score indicator (for AI search results) */}
        {tool.score !== undefined && (
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-gray-500">relevance</div>
            <div className="text-sm font-medium text-primary-600">
              {Math.round(tool.score * 100)}%
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
