"use client";

import Link from "next/link";
import { ExternalLink, Globe, Star } from "lucide-react";

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
  paid: "badge-amber",
  enterprise: "badge-pink",
};

const categoryColors: Record<string, string> = {
  Coding: "from-blue-500 to-cyan-500",
  Writing: "from-emerald-500 to-teal-500",
  "Image Generation": "from-pink-500 to-rose-500",
  Video: "from-purple-500 to-violet-500",
  Audio: "from-amber-500 to-orange-500",
  Productivity: "from-green-500 to-emerald-500",
  Marketing: "from-red-500 to-pink-500",
  Design: "from-fuchsia-500 to-purple-500",
  Chatbot: "from-indigo-500 to-blue-500",
  Research: "from-cyan-500 to-sky-500",
  Data: "from-teal-500 to-green-500",
  Education: "from-yellow-500 to-amber-500",
  Business: "from-slate-500 to-gray-500",
};

export function ToolCard({ tool }: ToolCardProps) {
  const gradient = categoryColors[tool.category || ""] || "from-gray-500 to-gray-600";

  return (
    <Link href={`/tool/${tool.slug}`} className="card-hover block group">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
          {tool.logoUrl ? (
            <img
              src={tool.logoUrl}
              alt={`${tool.name} logo`}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  '<div class="w-6 h-6 rounded bg-gradient-to-br ' + gradient + ' opacity-60"></div>';
              }}
            />
          ) : (
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} opacity-60`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
              {tool.name}
            </h3>
            {tool.website && (
              <ExternalLink className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            )}
            {tool.popularity && tool.popularity > 90 && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>

          {tool.shortDescription && (
            <p className="mt-1.5 text-sm text-gray-400 line-clamp-2">
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
            {tool.platforms?.slice(0, 2).map((platform) => (
              <span key={platform} className="badge-gray">
                {platform}
              </span>
            ))}
          </div>
        </div>

        {/* Score indicator (for AI search results) */}
        {tool.score !== undefined && tool.score > 0 && (
          <div className="flex-shrink-0 text-right">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">
                {Math.round(tool.score * 100)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
