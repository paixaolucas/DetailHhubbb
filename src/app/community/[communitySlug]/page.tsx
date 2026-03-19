// =============================================================================
// COMMUNITY PUBLIC PAGE — Detailer'HUB Dark Theme
// =============================================================================

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { Users, BookOpen, Video, ArrowRight, Star, ChevronDown } from "lucide-react";
import { MembershipSection } from "@/components/community/membership-section";
import { LogoType } from "@/components/ui/logo";
import { Metadata } from "next";
import { getInfluencerHealth, getInfluencerHealthEmoji } from "@/lib/points";

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
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
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

  // Influencer health: based on their points in this community
  const influencerPointsRecord = await db.userPoints.findUnique({
    where: { userId_communityId: { userId: influencer.user.id, communityId: community.id } },
    select: { points: true },
  });
  const influencerPts = influencerPointsRecord?.points ?? 0;
  const influencerHealth = getInfluencerHealth(influencerPts);
  const influencerHealthEmoji = getInfluencerHealthEmoji(influencerHealth);
  const hasModules = community.contentModules.length > 0;
  const hasTestimonials = community.testimonials.length > 0;
  const hasFaqs = community.faqs.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Navbar */}
      <header className="border-b border-white/10 bg-[#1A1A1A]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <LogoType height={22} variant="light" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-[#006079] hover:bg-[#007A99] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-[#007A99]/25"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Full-width Banner */}
      {community.bannerUrl && (
        <div className="relative w-full h-56 md:h-72 overflow-hidden">
          <Image
            src={community.bannerUrl}
            alt={`${community.name} banner`}
            fill
            className="object-cover"
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
            <Image
              src={community.logoUrl}
              alt={community.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-2xl mx-auto mb-6 object-cover border-2 border-white/10 shadow-2xl"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-white shadow-2xl"
              style={{ backgroundColor: community.primaryColor }}
            >
              {community.name.charAt(0)}
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-bold text-[#EEE6E4] mb-4 leading-tight">
            {community.name}
          </h1>
          {community.shortDescription && (
            <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {community.shortDescription}
            </p>
          )}

          {/* Stats bar */}
          <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-4 h-4 text-[#009CD9]" />
              <span className="font-semibold text-[#EEE6E4]">
                {community.memberCount.toLocaleString("pt-BR")}
              </span>
              <span className="text-gray-400">membros</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-gray-400">
              <BookOpen className="w-4 h-4 text-[#009CD9]" />
              <span className="font-semibold text-[#EEE6E4]">{community._count.contentModules}</span>
              <span className="text-gray-400">m&oacute;dulos</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-gray-400">
              <Video className="w-4 h-4 text-red-400" />
              <span className="font-semibold text-[#EEE6E4]">{community._count.liveSessions}</span>
              <span className="text-gray-400">lives</span>
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
              <h2 className="text-xl font-bold text-[#EEE6E4] mb-4">Sobre a comunidade</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                {community.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {(community.tags as string[]).length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                T&oacute;picos
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
            <h2 className="text-xl font-bold text-[#EEE6E4] mb-5">Seu mentor</h2>
            <div className="flex items-start gap-5">
              {influencer.user.avatarUrl ? (
                <Image
                  src={influencer.user.avatarUrl}
                  alt={hostName}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 shadow-lg border border-white/10"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#EEE6E4] text-xl font-bold flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: community.primaryColor }}
                >
                  {hostName.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[#EEE6E4] text-lg">{hostName}</p>
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                    title={`Saúde da comunidade: ${influencerHealth}`}
                    style={{
                      backgroundColor: influencerHealth === "Saudável" ? "rgba(34,197,94,0.1)" : influencerHealth === "Atenção" ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)",
                      borderColor: influencerHealth === "Saudável" ? "rgba(34,197,94,0.3)" : influencerHealth === "Atenção" ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)",
                      color: influencerHealth === "Saudável" ? "rgb(134,239,172)" : influencerHealth === "Atenção" ? "rgb(253,224,71)" : "rgb(252,165,165)",
                    }}
                  >
                    {influencerHealthEmoji} {influencerHealth}
                  </span>
                </div>
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
              <h2 className="text-xl font-bold text-[#EEE6E4] mb-4">Regras da comunidade</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">
                {community.rules}
              </p>
            </div>
          )}

          {/* O que voc&ecirc; vai aprender — Content Modules */}
          {hasModules && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-[#EEE6E4] mb-6">O que voc&ecirc; vai aprender</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {community.contentModules.map((module, idx) => (
                  <div
                    key={module.id}
                    className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#006079]/40 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: `${community.primaryColor}30`, color: community.primaryColor }}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#EEE6E4] leading-tight">{module.title}</p>
                      {module.description && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
                          {module.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
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
              <h2 className="text-xl font-bold text-[#EEE6E4] mb-5 px-1">Depoimentos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {community.testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-3"
                  >
                    <StarRating rating={t.rating} />
                    <p className="text-gray-400 text-sm leading-relaxed flex-1">
                      &ldquo;{t.body}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {t.avatarUrl ? (
                        <Image
                          src={t.avatarUrl}
                          alt={t.authorName}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#EEE6E4] flex-shrink-0"
                          style={{ backgroundColor: `${community.primaryColor}40` }}
                        >
                          {t.authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[#EEE6E4]">{t.authorName}</p>
                        {t.authorTitle && (
                          <p className="text-xs text-gray-400">{t.authorTitle}</p>
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
                <h2 className="text-xl font-bold text-[#EEE6E4]">Perguntas frequentes</h2>
              </div>
              <div className="divide-y divide-white/5">
                {community.faqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="group px-8 py-0"
                  >
                    <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none select-none">
                      <span className="text-sm font-semibold text-[#EEE6E4] group-open:text-[#009CD9] transition-colors">
                        {faq.question}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
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
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[#EEE6E4] text-2xl font-bold"
              style={{ backgroundColor: community.primaryColor }}
            >
              {community.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold text-[#EEE6E4] mb-2">
              {community.name} é a sua casa.
            </h3>
            <p className="text-gray-400 mb-2 max-w-md mx-auto">
              Uma assinatura Detailer&apos;HUB dá acesso a esta e a todas as outras comunidades da plataforma.
            </p>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              O YouTube é sua vitrine. O Detailer&apos;HUB é a sua casa.
            </p>
            <Link
              href={`/register?community=${community.slug}`}
              className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30"
            >
              Entrar na comunidade <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
