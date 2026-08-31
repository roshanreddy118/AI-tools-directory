export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { notFound } from "next/navigation";
import { db, tools, toolSources, sources } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  ExternalLink,
  Globe,
  Github,
  Twitter,
  Check,
  X,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

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
    <main className="min-h-screen bg-gray-50/50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <BackButton />
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">AI Tools</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200/60 flex items-center justify-center overflow-hidden">
              {tool.logoUrl ? (
                <img
                  src={tool.logoUrl}
                  alt=""
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Globe className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {tool.name}
                </h1>
                {tool.category && (
                  <span className="badge-blue">{tool.category}</span>
                )}
                {tool.pricingType && (
                  <span className="badge-green capitalize">{tool.pricingType}</span>
                )}
              </div>

              {tool.description && (
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {tool.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {tool.website && (
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit website
                  </a>
                )}
                {tool.githubUrl && (
                  <a
                    href={tool.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <Github className="w-3.5 h-3.5" />
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
                    <Twitter className="w-3.5 h-3.5" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features */}
            {tool.features && (tool.features as string[]).length > 0 && (
              <Section title="Features">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(tool.features as string[]).map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Pros & Cons */}
            {((tool.pros as string[])?.length > 0 ||
              (tool.cons as string[])?.length > 0) && (
              <Section title="Pros & Cons">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(tool.pros as string[])?.length > 0 && (
                    <div className="space-y-2">
                      {(tool.pros as string[]).map((pro, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(tool.cons as string[])?.length > 0 && (
                    <div className="space-y-2">
                      {(tool.cons as string[]).map((con, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{con}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Use Cases */}
            {tool.useCases && (tool.useCases as string[]).length > 0 && (
              <Section title="Use Cases">
                <div className="flex flex-wrap gap-2">
                  {(tool.useCases as string[]).map((useCase, i) => (
                    <span key={i} className="badge-gray text-sm py-1.5 px-3">
                      {useCase}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Sources */}
            {provenance.length > 0 && (
              <Section title="Sources">
                <div className="space-y-2">
                  {provenance.map((source: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gray-50"
                    >
                      <span className="text-gray-700">{source.sourceName}</span>
                      <span className="text-gray-400 text-xs">
                        {source.scrapedAt
                          ? new Date(source.scrapedAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info */}
            <Section title="Details">
              <dl className="space-y-3 text-sm">
                {tool.company && (
                  <InfoRow label="Company" value={tool.company} />
                )}
                {tool.pricingDetails && (
                  <InfoRow label="Pricing" value={tool.pricingDetails} />
                )}
                {tool.startingPrice && (
                  <InfoRow label="Starting at" value={tool.startingPrice} />
                )}
                {tool.platforms && (tool.platforms as string[]).length > 0 && (
                  <InfoRow
                    label="Platforms"
                    value={(tool.platforms as string[]).join(", ")}
                  />
                )}
              </dl>
            </Section>

            {/* Best For */}
            {tool.bestFor && (
              <Section title="Best for">
                <p className="text-sm text-gray-600">{tool.bestFor}</p>
              </Section>
            )}

            {/* Alternatives */}
            {tool.alternatives && (tool.alternatives as string[]).length > 0 && (
              <Section title="Alternatives">
                <div className="flex flex-wrap gap-1.5">
                  {(tool.alternatives as string[]).map((alt, i) => (
                    <span key={i} className="badge-purple py-1 px-2.5">
                      {alt}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Tags */}
            {tool.tags && (tool.tags as string[]).length > 0 && (
              <Section title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {(tool.tags as string[]).map((tag, i) => (
                    <span key={i} className="badge-gray py-1 px-2.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="section-title mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-400 flex-shrink-0">{label}</dt>
      <dd className="text-gray-700 text-right">{value}</dd>
    </div>
  );
}
