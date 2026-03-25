// =============================================================================
// COMMUNITY PAGE — Redesign completo
// Hero do influencer → Feed preview → Trilhas → Sidebar de ação
// Serve membros (experiência) e visitantes (conversão)
// =============================================================================

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import {
  Users, BookOpen, Video, ArrowRight, Star, ChevronDown,
  CheckCircle, Trophy, MessageCircle, Lock, BadgeCheck,
  Heart, Play, Flame, ArrowLeft,
} from "lucide-react";
import { MembershipSection } from "@/components/community/membership-section";
import { CommunityNavCTA } from "@/components/community/CommunityNavCTA";
import { LogoType } from "@/components/ui/logo";
import { Metadata } from "next";

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { communitySlug: string };
}): Promise<Metadata> {
  const c = await db.community.findUnique({
    where: { slug: params.communitySlug, isPublished: true },
    select: { name: true, metaTitle: true, metaDescription: true, shortDescription: true, bannerUrl: true },
  });
  if (!c) return { title: "Comunidade não encontrada" };
  return {
    title: c.metaTitle || c.name,
    description: c.metaDescription || c.shortDescription || undefined,
    openGraph: {
      title: c.metaTitle || c.name,
      description: c.metaDescription || c.shortDescription || undefined,
      images: c.bannerUrl ? [{ url: c.bannerUrl }] : [],
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
      subscriptionPlans: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      testimonials: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      contentModules: {
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          isPremium: true,
          _count: { select: { lessons: true } },
        },
        orderBy: { sortOrder: "asc" },
        take: 12,
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

async function getRecentPosts(communityId: string) {
  return db.post.findMany({
    where: { communityId, isHidden: false, isLocked: false },
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      likeCount: true,
      commentCount: true,
      createdAt: true,
      author: { select: { firstName: true, lastName: true, avatarUrl: true } },
      space: { select: { slug: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 4,
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

function PostPreviewCard({
  post,
  communitySlug,
  primaryColor,
}: {
  post: Awaited<ReturnType<typeof getRecentPosts>>[0];
  communitySlug: string;
  primaryColor: string;
}) {
  const href = post.space?.slug
    ? `/community/${communitySlug}/feed/${post.space.slug}`
    : `/community/${communitySlug}/feed`;
  const displayText = post.title ?? post.body.slice(0, 120);
  const isVideo = post.type === "VIDEO";

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/15 hover:bg-white/[0.05] transition-all"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {post.author.avatarUrl ? (
          <Image
            src={post.author.avatarUrl}
            alt={post.author.firstName}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: `${primaryColor}80` }}
          >
            {post.author.firstName[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Author name */}
        <p className="text-xs text-gray-500 mb-1">
          {post.author.firstName} {post.author.lastName}
        </p>

        {/* Content */}
        <p className="text-sm text-[#EEE6E4] leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {isVideo && <Play className="w-3 h-3 inline mr-1 text-[#009CD9]" />}
          {displayText}
        </p>

        {/* Engagement */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> {post.commentCount}
          </span>
          <span className="ml-auto text-gray-700 group-hover:text-[#009CD9] transition-colors">
            Ver →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function CommunityPage({
  params,
}: {
  params: { communitySlug: string };
}) {
  const community = await getCommunity(params.communitySlug);
  if (!community) notFound();

  const recentPosts = await getRecentPosts(community.id);

  const influencer = community.influencer;
  const hostName = `${influencer.user.firstName} ${influencer.user.lastName}`;
  const primary = community.primaryColor;

  const hasModules = community.contentModules.length > 0;
  const hasTestimonials = community.testimonials.length > 0;
  const hasFaqs = community.faqs.length > 0;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#EEE6E4]">

      {/* ── Sticky Navbar ── */}
      <header className="border-b border-white/[0.08] bg-[#0D0D0D]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/inicio"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-[#EEE6E4]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link href="/inicio">
              <LogoType height={20} variant="light" />
            </Link>
          </div>
          {/* Quick nav — visible on md+ */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Feed", href: `/community/${params.communitySlug}/feed` },
              { label: "Trilhas", href: `/community/${params.communitySlug}/trilhas` },
              { label: "Lives", href: `/community/${params.communitySlug}/feed` },
              { label: "Membros", href: `/community/${params.communitySlug}/members` },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-gray-400 hover:text-[#EEE6E4] px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0">
            <CommunityNavCTA communitySlug={params.communitySlug} primaryColor={primary} />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Influencer como protagonista
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[70vh] md:min-h-[80vh] flex flex-col justify-end overflow-hidden">

        {/* Background: banner da comunidade */}
        {community.bannerUrl ? (
          <Image
            src={community.bannerUrl}
            alt={community.name}
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primary}80 0%, ${primary}30 50%, #0D0D0D 100%)`,
            }}
          />
        )}

        {/* Gradientes de sobreposição */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/70 to-[#0D0D0D]/20" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${primary}40 0%, transparent 60%)`,
          }}
        />

        {/* Conteúdo do hero */}
        <div className="relative container mx-auto px-4 pb-12 pt-20">
          <div className="max-w-3xl">

            {/* Avatar do influencer — destaque */}
            <div className="flex items-end gap-5 mb-6">
              <div className="relative flex-shrink-0">
                {influencer.user.avatarUrl ? (
                  <Image
                    src={influencer.user.avatarUrl}
                    alt={hostName}
                    width={100}
                    height={100}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
                  />
                ) : (
                  <div
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-2 border-white/20 shadow-2xl"
                    style={{ backgroundColor: primary }}
                  >
                    {hostName[0]}
                  </div>
                )}
                {influencer.isVerified && (
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#0D0D0D] shadow-lg"
                    style={{ backgroundColor: primary }}
                  >
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Logo da comunidade */}
              {community.logoUrl && (
                <div className="relative flex-shrink-0">
                  <Image
                    src={community.logoUrl}
                    alt={community.name}
                    width={56}
                    height={56}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border-2 border-white/10 shadow-xl"
                  />
                </div>
              )}
            </div>

            {/* Nome do influencer */}
            <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: primary }}>
              {influencer.displayName || hostName}
            </p>

            {/* Nome da comunidade */}
            <h1 className="text-3xl md:text-5xl font-black text-[#EEE6E4] leading-tight mb-3">
              {community.name}
            </h1>

            {/* Descrição */}
            {community.shortDescription && (
              <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-xl mb-6">
                {community.shortDescription}
              </p>
            )}

            {/* Stats + CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" style={{ color: primary }} />
                  <span className="font-bold text-[#EEE6E4]">
                    {community.memberCount.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-gray-400">membros</span>
                </div>
                {community._count.contentModules > 0 && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" style={{ color: primary }} />
                    <span className="font-bold text-[#EEE6E4]">{community._count.contentModules}</span>
                    <span className="text-gray-400">módulos</span>
                  </div>
                )}
                {community._count.liveSessions > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-red-400" />
                    <span className="font-bold text-[#EEE6E4]">{community._count.liveSessions}</span>
                    <span className="text-gray-400">lives</span>
                  </div>
                )}
              </div>

              {/* CTA principal */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/community/${params.communitySlug}/feed`}
                  className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                    boxShadow: `0 4px 20px ${primary}50`,
                  }}
                >
                  <Flame className="w-4 h-4" />
                  Entrar na comunidade
                </Link>
                {hasModules && (
                  <Link
                    href={`/community/${params.communitySlug}/trilhas`}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-[#EEE6E4] bg-white/10 border border-white/15 hover:bg-white/15 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    Ver trilhas
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TRILHAS — Carrossel Netflix full-width
      ═══════════════════════════════════════════════════════════════════ */}
      {hasModules && (
        <section className="py-8 bg-[#0D0D0D]">
          <div className="container mx-auto px-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: primary }} />
              <h2 className="text-lg font-bold text-[#EEE6E4]">Trilhas de conteúdo</h2>
            </div>
            <Link
              href={`/community/${params.communitySlug}/trilhas`}
              className="text-sm font-medium hover:underline transition-colors flex items-center gap-1"
              style={{ color: primary }}
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Scroll horizontal sem scrollbar visível */}
          <div className="flex gap-4 overflow-x-auto pb-2 px-4 md:px-[max(1rem,calc((100vw-1280px)/2+1rem))] scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {community.contentModules.map((module, idx) => (
              <Link
                key={module.id}
                href={`/community/${params.communitySlug}/trilhas`}
                className="group flex-shrink-0 w-52 sm:w-60 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#161616] hover:border-white/20 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  {module.coverImageUrl ? (
                    <Image
                      src={module.coverImageUrl}
                      alt={module.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${primary}50 0%, ${primary}20 100%)` }}
                    >
                      <span
                        className="text-4xl font-black opacity-60 select-none"
                        style={{ color: primary }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                  {/* Overlay gradient bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent opacity-80" />
                  {/* Lock badge */}
                  {module.isPremium && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Premium
                    </div>
                  )}
                  {/* Lesson count */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Play className="w-2.5 h-2.5" />
                    {module._count.lessons} {module._count.lessons === 1 ? "aula" : "aulas"}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-[#EEE6E4] leading-snug line-clamp-2 group-hover:text-white transition-colors">
                    {module.title}
                  </p>
                  {module.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {module.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}

            {/* "Ver todas" card */}
            <Link
              href={`/community/${params.communitySlug}/trilhas`}
              className="flex-shrink-0 w-32 sm:w-36 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all flex flex-col items-center justify-center gap-2 aspect-video self-start"
              style={{ minHeight: "7rem" }}
            >
              <ArrowRight className="w-5 h-5 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium text-center px-2">Ver todas as trilhas</span>
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BODY — Feed preview + Sidebar
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="container mx-auto px-4 py-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── ESQUERDA: Feed ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Feed preview */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" style={{ color: primary }} />
                  <h2 className="text-lg font-bold text-[#EEE6E4]">Feed da comunidade</h2>
                </div>
                <Link
                  href={`/community/${params.communitySlug}/feed`}
                  className="text-sm font-medium hover:underline transition-colors"
                  style={{ color: primary }}
                >
                  Ver tudo →
                </Link>
              </div>

              {recentPosts.length > 0 ? (
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <PostPreviewCard
                      key={post.id}
                      post={post}
                      communitySlug={params.communitySlug}
                      primaryColor={primary}
                    />
                  ))}
                  <Link
                    href={`/community/${params.communitySlug}/feed`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold border border-white/10 text-gray-400 hover:text-[#EEE6E4] hover:border-white/20 hover:bg-white/[0.03] transition-all mt-2"
                  >
                    Ver feed completo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-8 text-center">
                  <MessageCircle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">O feed está aguardando os primeiros posts.</p>
                  <Link
                    href={`/community/${params.communitySlug}/feed`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold mt-4 hover:underline"
                    style={{ color: primary }}
                  >
                    Seja o primeiro a postar →
                  </Link>
                </div>
              )}
            </section>

            {/* Sobre */}
            {community.description && (
              <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <h2 className="text-base font-bold text-[#EEE6E4] mb-3">Sobre a comunidade</h2>
                <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-wrap">
                  {community.description}
                </p>
              </section>
            )}

            {/* Tags */}
            {(community.tags as string[]).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(community.tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                    style={{ backgroundColor: `${primary}18`, color: primary }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Depoimentos */}
            {hasTestimonials && (
              <section>
                <h2 className="text-lg font-bold text-[#EEE6E4] mb-4">O que dizem os membros</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {community.testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3"
                    >
                      <StarRating rating={t.rating} />
                      <p className="text-gray-400 text-sm leading-relaxed flex-1">
                        &ldquo;{t.body}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                        {t.avatarUrl ? (
                          <Image
                            src={t.avatarUrl}
                            alt={t.authorName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: `${primary}50` }}
                          >
                            {t.authorName[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#EEE6E4]">{t.authorName}</p>
                          {t.authorTitle && <p className="text-xs text-gray-500">{t.authorTitle}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {hasFaqs && (
              <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="px-6 pt-6 pb-3">
                  <h2 className="text-base font-bold text-[#EEE6E4]">Perguntas frequentes</h2>
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {community.faqs.map((faq) => (
                    <details key={faq.id} className="group px-6">
                      <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none select-none">
                        <span className="text-sm font-medium text-[#EEE6E4] group-open:text-[#009CD9] transition-colors">
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
              </section>
            )}
          </div>

          {/* ── DIREITA: Sidebar sticky ── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-4">

              {/* Card de ação principal (membership) */}
              <div className="rounded-2xl overflow-hidden border border-white/10">
                {/* Mini-banner no topo do card */}
                {community.bannerUrl ? (
                  <div className="relative h-24 overflow-hidden">
                    <Image src={community.bannerUrl} alt="" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#161616]" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      {community.logoUrl ? (
                        <Image
                          src={community.logoUrl}
                          alt={community.name}
                          width={28}
                          height={28}
                          className="w-7 h-7 rounded-lg object-cover border-2 border-[#161616]"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white border-2 border-[#161616]"
                          style={{ backgroundColor: primary }}
                        >
                          {community.name[0]}
                        </div>
                      )}
                      <span className="text-xs font-bold text-[#EEE6E4] drop-shadow">{community.name}</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="h-16 flex items-center px-4"
                    style={{ background: `linear-gradient(135deg, ${primary}60, ${primary}25)` }}
                  >
                    <span className="text-sm font-bold text-[#EEE6E4]">{community.name}</span>
                  </div>
                )}
                <div className="bg-[#161616] p-4">
                  <MembershipSection
                    communityId={community.id}
                    communitySlug={community.slug}
                    primaryColor={primary}
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
                </div>
              </div>

              {/* Card do mentor/influencer */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Seu mentor
                </p>
                <div className="flex items-start gap-3">
                  {influencer.user.avatarUrl ? (
                    <Image
                      src={influencer.user.avatarUrl}
                      alt={hostName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white border border-white/10 flex-shrink-0"
                      style={{ backgroundColor: primary }}
                    >
                      {hostName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-[#EEE6E4] text-sm">{hostName}</p>
                      {influencer.isVerified && (
                        <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: primary }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{influencer.displayName}</p>
                    {influencer.bio && (
                      <p className="text-xs text-gray-400 leading-relaxed mt-2 line-clamp-3">{influencer.bio}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Incluso na assinatura */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Incluso na assinatura
                </p>
                <ul className="space-y-2">
                  {[
                    { icon: Users,         text: "Todas as comunidades" },
                    { icon: BookOpen,      text: "Cursos e módulos" },
                    { icon: Video,         text: "Lives ao vivo" },
                    { icon: MessageCircle, text: "Feed e discussões" },
                    { icon: Trophy,        text: "Leaderboard e certificados" },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: primary }} />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social proof */}
              {community.memberCount > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-[#0D0D0D] flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: `${primary}${70 + i * 10}` }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-[#EEE6E4]">
                      {community.memberCount.toLocaleString("pt-BR")}
                    </span>{" "}
                    membros ativos
                  </p>
                </div>
              )}

              {/* Aviso de acesso único */}
              <div className="flex items-start gap-2 px-1">
                <Lock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Uma assinatura Detailer&apos;HUB dá acesso a esta e todas as outras comunidades da plataforma.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] py-8 bg-[#0D0D0D]">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <LogoType height={16} variant="light" />
          </Link>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Detailer&apos;HUB — O maior ecossistema de estética automotiva do Brasil
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
            <Link href="/contato" className="hover:text-gray-400 transition-colors">Contato</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
