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

  // Get sources
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
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {tool.logoUrl ? (
                <img
                  src={tool.logoUrl}
                  alt={`${tool.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Globe className="w-10 h-10 text-gray-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {tool.name}
                </h1>
                {tool.isVerified && (
                  <span className="badge-green">Verified</span>
                )}
              </div>

              {tool.description && (
                <p className="mt-3 text-gray-600 text-lg">{tool.description}</p>
              )}

              {/* Quick links */}
              <div className="mt-4 flex flex-wrap gap-3">
                {tool.website && (
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features */}
            {tool.features && (tool.features as string[]).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Features
                </h2>
                <ul className="space-y-2">
                  {(tool.features as string[]).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pros & Cons */}
            {((tool.pros as string[])?.length > 0 || (tool.cons as string[])?.length > 0) && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pros & Cons
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(tool.pros as string[])?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-green-700 mb-2">
                        Pros
                      </h3>
                      <ul className="space-y-2">
                        {(tool.pros as string[]).map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ThumbsUp className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(tool.cons as string[])?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-700 mb-2">
                        Cons
                      </h3>
                      <ul className="space-y-2">
                        {(tool.cons as string[]).map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ThumbsDown className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                            <span>{con}</span>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Use Cases
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(tool.useCases as string[]).map((useCase, i) => (
                    <span key={i} className="badge-blue">
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Sources */}
            {provenance.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Data Sources
                </h2>
                <div className="space-y-3">
                  {provenance.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{source.sourceName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>
                          {source.scrapedAt
                            ? new Date(source.scrapedAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                        {source.confidence && (
                          <span className="badge-gray">
                            {Math.round(source.confidence * 100)}% confidence
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Info
              </h2>
              <dl className="space-y-4">
                {tool.category && (
                  <div className="flex items-center gap-3">
                    <dt>
                      <Tag className="w-4 h-4 text-gray-400" />
                    </dt>
                    <dd className="text-sm">{tool.category}</dd>
                  </div>
                )}
                {tool.pricingType && (
                  <div className="flex items-center gap-3">
                    <dt>
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </dt>
                    <dd className="text-sm capitalize">{tool.pricingType}</dd>
                  </div>
                )}
                {tool.platforms && (tool.platforms as string[]).length > 0 && (
                  <div className="flex items-center gap-3">
                    <dt>
                      <Monitor className="w-4 h-4 text-gray-400" />
                    </dt>
                    <dd className="text-sm">
                      {(tool.platforms as string[]).join(", ")}
                    </dd>
                  </div>
                )}
                {tool.company && (
                  <div className="flex items-center gap-3">
                    <dt>
                      <Globe className="w-4 h-4 text-gray-400" />
                    </dt>
                    <dd className="text-sm">{tool.company}</dd>
                  </div>
                )}
                {tool.foundedYear && (
                  <div className="flex items-center gap-3">
                    <dt>
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </dt>
                    <dd className="text-sm">Founded {tool.foundedYear}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Best For */}
            {tool.bestFor && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Best For
                </h2>
                <p className="text-sm text-gray-600">{tool.bestFor}</p>
              </div>
            )}

            {/* Alternatives */}
            {tool.alternatives && (tool.alternatives as string[]).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Alternatives
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(tool.alternatives as string[]).map((alt, i) => (
                    <span key={i} className="badge-purple">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tool.tags && (tool.tags as string[]).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(tool.tags as string[]).map((tag, i) => (
                    <span key={i} className="badge-gray">
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
