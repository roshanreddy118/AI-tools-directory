export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db, tools, toolSources, sources } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  ExternalLink,
  Globe,
  Github,
  Twitter,
  Calendar,
  Tag,
  DollarSign,
  Monitor,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Check,
  Star,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { slug: string };
}

export default async function ToolPage({ params }: PageProps) {
  const result = await db
    .select()
    .from(tools)
    .where(eq(tools.slug, params.slug))
    .limit(1);

  if (result.length === 0) {
    notFound();
  }

  const tool = result[0];

  const provenance = await db
    .select({
      sourceUrl: toolSources.sourceUrl,
      scrapedAt: toolSources.scrapedAt,
      confidence: toolSources.confidence,
      sourceName: sources.name,
    })
    .from(toolSources)
    .innerJoin(sources, eq(toolSources.sourceId, sources.id))
    .where(eq(toolSources.toolId, tool.id));

  return (
    <main className="min-h-screen">
      {/* Top nav */}
      <div className="border-b border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Header Card */}
        <div className="card glow">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
              {tool.logoUrl ? (
                <img
                  src={tool.logoUrl}
                  alt={`${tool.name} logo`}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <Globe className="w-10 h-10 text-gray-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-white">{tool.name}</h1>
                {tool.isVerified && (
                  <span className="badge-green">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                )}
                {tool.popularity && tool.popularity > 90 && (
                  <span className="badge-amber">
                    <Star className="w-3 h-3 mr-1 fill-amber-400" />
                    Popular
                  </span>
                )}
              </div>

              {tool.description && (
                <p className="mt-3 text-gray-400 text-lg leading-relaxed">
                  {tool.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                {tool.website && (
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
                {tool.githubUrl && (
                  <a
                    href={tool.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}
                {tool.twitterUrl && (
                  <a
                    href={tool.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features */}
            {tool.features && (tool.features as string[]).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Features
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(tool.features as string[]).map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-800"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pros & Cons */}
            {((tool.pros as string[])?.length > 0 ||
              (tool.cons as string[])?.length > 0) && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Pros & Cons
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(tool.pros as string[])?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4" />
                        Advantages
                      </h3>
                      <ul className="space-y-2">
                        {(tool.pros as string[]).map((pro, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(tool.cons as string[])?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4" />
                        Disadvantages
                      </h3>
                      <ul className="space-y-2">
                        {(tool.cons as string[]).map((con, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <span className="w-4 h-4 flex items-center justify-center text-red-500 flex-shrink-0">
                              &times;
                            </span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Use Cases */}
            {tool.useCases && (tool.useCases as string[]).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Use Cases
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(tool.useCases as string[]).map((useCase, i) => (
                    <span key={i} className="badge-blue text-sm py-1.5 px-3">
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Sources */}
            {provenance.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Data Sources
                </h2>
                <div className="space-y-3">
                  {provenance.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm p-3 rounded-xl bg-gray-800/50 border border-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">
                          {source.sourceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>
                          {source.scrapedAt
                            ? new Date(source.scrapedAt).toLocaleDateString()
                            : "—"}
                        </span>
                        {source.confidence && (
                          <span className="badge-gray">
                            {Math.round(source.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">
                Quick Info
              </h2>
              <dl className="space-y-4">
                {tool.category && (
                  <div className="flex items-center gap-3">
                    <dt className="p-2 rounded-lg bg-gray-800">
                      <Tag className="w-4 h-4 text-blue-400" />
                    </dt>
                    <dd className="text-sm text-gray-300">{tool.category}</dd>
                  </div>
                )}
                {tool.pricingType && (
                  <div className="flex items-center gap-3">
                    <dt className="p-2 rounded-lg bg-gray-800">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </dt>
                    <dd className="text-sm text-gray-300">
                      <span className="capitalize">{tool.pricingType}</span>
                      {tool.startingPrice && (
                        <span className="text-gray-500 ml-1">
                          &middot; {tool.startingPrice}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {tool.platforms && (tool.platforms as string[]).length > 0 && (
                  <div className="flex items-center gap-3">
                    <dt className="p-2 rounded-lg bg-gray-800">
                      <Monitor className="w-4 h-4 text-purple-400" />
                    </dt>
                    <dd className="text-sm text-gray-300">
                      {(tool.platforms as string[]).join(", ")}
                    </dd>
                  </div>
                )}
                {tool.company && (
                  <div className="flex items-center gap-3">
                    <dt className="p-2 rounded-lg bg-gray-800">
                      <Globe className="w-4 h-4 text-gray-400" />
                    </dt>
                    <dd className="text-sm text-gray-300">{tool.company}</dd>
                  </div>
                )}
                {tool.foundedYear && (
                  <div className="flex items-center gap-3">
                    <dt className="p-2 rounded-lg bg-gray-800">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </dt>
                    <dd className="text-sm text-gray-300">
                      Founded {tool.foundedYear}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Pricing Details */}
            {tool.pricingDetails && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Pricing
                </h2>
                <p className="text-sm text-gray-400">{tool.pricingDetails}</p>
              </div>
            )}

            {/* Best For */}
            {tool.bestFor && (
              <div className="card bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
                <h2 className="text-sm font-semibold text-blue-400 mb-2">
                  Best For
                </h2>
                <p className="text-sm text-gray-300">{tool.bestFor}</p>
              </div>
            )}

            {/* Alternatives */}
            {tool.alternatives &&
              (tool.alternatives as string[]).length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Alternatives
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {(tool.alternatives as string[]).map((alt, i) => (
                      <span key={i} className="badge-purple text-sm py-1.5 px-3">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Tags */}
            {tool.tags && (tool.tags as string[]).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {(tool.tags as string[]).map((tag, i) => (
                    <span key={i} className="badge-gray text-sm py-1.5 px-3">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
