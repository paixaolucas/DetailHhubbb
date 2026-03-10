// =============================================================================
// COMMUNITY PUBLIC PAGE — DetailHub Dark Theme
// =============================================================================

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Users, BookOpen, Video, ArrowRight, Star, ChevronDown } from "lucide-react";
import { MembershipSection } from "@/components/community/membership-section";
import { Metadata } from "next";

// ---------------------------------------------------------------------------
// SEO — generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { communitySlug: string };
}): Promise<Metadata> {
  const community = await db.community.findUnique({
    where: { slug: params.communitySlug, isPublished: true },
    select: {
      name: true,
      metaTitle: true,
      metaDescription: true,
      shortDescription: true,
      bannerUrl: true,
      logoUrl: true,
    },
  });
  if (!community) return { title: "Comunidade não encontrada" };
  return {
    title: community.metaTitle || community.name,
    description: community.metaDescription || community.shortDescription || undefined,
    openGraph: {
      title: community.metaTitle || community.name,
      description: community.metaDescription || community.shortDescription || undefined,
      images: community.bannerUrl ? [{ url: community.bannerUrl }] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getCommunity(slug: string) {
  return db.community.findUnique({
    where: { slug, isPublished: true },
    include: {
      influencer: {
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      subscriptionPlans: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      faqs: {
        orderBy: { sortOrder: "asc" },
      },
      testimonials: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      contentModules: {
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          _count: { select: { lessons: true } },
        },
        take: 6,
      },
      _count: {
        select: {
          memberships: { where: { status: "ACTIVE" } },
          contentModules: { where: { isPublished: true } },
          liveSessions: true,
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Star rating helper
// ---------------------------------------------------------------------------
function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function CommunityPage({
  params,
}: {
  params: { communitySlug: string };
}) {
  const community = await getCommunity(params.communitySlug);
  if (!community) notFound();

  const influencer = community.influencer;
  const hostName = `${influencer.user.firstName} ${influencer.user.lastName}`;
  const hasModules = community.contentModules.length > 0;
  const hasTestimonials = community.testimonials.length > 0;
  const hasFaqs = community.faqs.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Navbar */}
      <header className="border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-blue-400">←</span> DetailHub
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Full-width Banner */}
      {community.bannerUrl && (
        <div className="relative w-full h-56 md:h-72 overflow-hidden">
          <img
            src={community.bannerUrl}
            alt={`${community.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1a]/40 to-[#0a0f1a]" />
        </div>
      )}

      {/* Hero */}
      <section className={`relative py-24 overflow-hidden ${community.bannerUrl ? "-mt-16" : ""}`}>
        {/* Background effects */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${community.primaryColor}20 0%, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 grid-pattern opacity-10" />

        <div className="container mx-auto px-4 text-center relative">
          {/* Logo */}
          {community.logoUrl ? (
            <img
              src={community.logoUrl}
              alt={community.name}
              className="w-24 h-24 rounded-2xl mx-auto mb-6 object-cover border-2 border-white/20 shadow-2xl"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-white shadow-2xl"
              style={{ backgroundColor: community.primaryColor }}
            >
              {community.name.charAt(0)}
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {community.name}
          </h1>
          {community.shortDescription && (
            <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {community.shortDescription}
            </p>
          )}

          {/* Stats bar */}
          <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white">
                {community.memberCount.toLocaleString("pt-BR")}
              </span>
              <span className="text-gray-500">membros</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-gray-300">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white">{community._count.contentModules}</span>
              <span className="text-gray-500">módulos</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-gray-300">
              <Video className="w-4 h-4 text-red-400" />
              <span className="font-semibold text-white">{community._count.liveSessions}</span>
              <span className="text-gray-500">lives</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* About */}
          {community.description && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-4">Sobre a comunidade</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                {community.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {(community.tags as string[]).length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Tópicos
              </h2>
              <div className="flex flex-wrap gap-2">
                {(community.tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-sm capitalize"
                    style={{
                      backgroundColor: `${community.primaryColor}20`,
                      color: community.primaryColor,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Host */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-5">Seu mentor</h2>
            <div className="flex items-start gap-5">
              {influencer.user.avatarUrl ? (
                <img
                  src={influencer.user.avatarUrl}
                  alt={hostName}
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 shadow-lg border border-white/10"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: community.primaryColor }}
                >
                  {hostName.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-white text-lg">{hostName}</p>
                <p className="text-sm text-gray-400 mb-3">{influencer.displayName}</p>
                {influencer.bio && (
                  <p className="text-sm text-gray-400 leading-relaxed">{influencer.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Rules */}
          {community.rules && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-4">Regras da comunidade</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">
                {community.rules}
              </p>
            </div>
          )}

          {/* O que você vai aprender — Content Modules */}
          {hasModules && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">O que você vai aprender</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {community.contentModules.map((module, idx) => (
                  <div
                    key={module.id}
                    className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: `${community.primaryColor}30`, color: community.primaryColor }}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{module.title}</p>
                      {module.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {module.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {module._count.lessons} {module._count.lessons === 1 ? "aula" : "aulas"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Depoimentos — Testimonials */}
          {hasTestimonials && (
            <div>
              <h2 className="text-xl font-bold text-white mb-5 px-1">Depoimentos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {community.testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-3"
                  >
                    <StarRating rating={t.rating} />
                    <p className="text-gray-300 text-sm leading-relaxed flex-1">
                      &ldquo;{t.body}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {t.avatarUrl ? (
                        <img
                          src={t.avatarUrl}
                          alt={t.authorName}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: `${community.primaryColor}40` }}
                        >
                          {t.authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{t.authorName}</p>
                        {t.authorTitle && (
                          <p className="text-xs text-gray-500">{t.authorTitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {hasFaqs && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-8 pt-8 pb-4">
                <h2 className="text-xl font-bold text-white">Perguntas frequentes</h2>
              </div>
              <div className="divide-y divide-white/5">
                {community.faqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="group px-8 py-0"
                  >
                    <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none select-none">
                      <span className="text-sm font-semibold text-white group-open:text-blue-400 transition-colors">
                        {faq.question}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pb-5">
                      <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Plans / Membership */}
          <MembershipSection
            communityId={community.id}
            communitySlug={community.slug}
            primaryColor={community.primaryColor}
            plans={community.subscriptionPlans.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: Number(p.price),
              interval: p.interval,
              trialDays: p.trialDays,
              features: (p.features as string[]) ?? [],
              isDefault: p.isDefault,
            }))}
          />

          {/* CTA */}
          <div
            className="rounded-2xl p-10 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${community.primaryColor}20 0%, transparent 100%)`,
            }}
          >
            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: community.primaryColor }}
            >
              {community.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Quer fazer parte?</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Crie sua conta gratuitamente e solicite acesso à comunidade{" "}
              <strong className="text-white">{community.name}</strong>.
            </p>
            <Link
              href={`/register?community=${community.slug}`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
            >
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
