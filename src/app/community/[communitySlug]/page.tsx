// =============================================================================
// COMMUNITY PUBLIC PAGE — Premium landing page redesign
// =============================================================================

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import {
  Users, BookOpen, Video, ArrowRight, Star, ChevronDown,
  CheckCircle, Zap, Trophy, MessageCircle, Lock, BadgeCheck,
} from "lucide-react";
import { MembershipSection } from "@/components/community/membership-section";
import { LogoType } from "@/components/ui/logo";
import { Metadata } from "next";
import { getInfluencerHealth, getInfluencerHealthEmoji } from "@/lib/points";

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { communitySlug: string };
}): Promise<Metadata> {
  const community = await db.community.findUnique({
    where: { slug: params.communitySlug, isPublished: true },
    select: { name: true, metaTitle: true, metaDescription: true, shortDescription: true, bannerUrl: true },
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
// Data
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
        select: { id: true, title: true, description: true, _count: { select: { lessons: true } } },
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

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function CommunityPage({ params }: { params: { communitySlug: string } }) {
  const community = await getCommunity(params.communitySlug);
  if (!community) notFound();

  const influencer = community.influencer;
  const hostName = `${influencer.user.firstName} ${influencer.user.lastName}`;

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

  const healthColors = {
    Saudável: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "rgb(134,239,172)" },
    Atenção:  { bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)",  text: "rgb(253,224,71)" },
    Crítico:  { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  text: "rgb(252,165,165)" },
  }[influencerHealth];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#EEE6E4]">

      {/* ── Sticky Navbar ── */}
      <header className="border-b border-white/8 bg-[#0D0D0D]/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><LogoType height={22} variant="light" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-[#006079] to-[#007A99] hover:from-[#007A99] hover:to-[#009CD9] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-[#007A99]/25"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Full-width banner + overlapping logo + stats
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">

        {/* Banner */}
        <div className="relative w-full h-64 md:h-96 overflow-hidden">
          {community.bannerUrl ? (
            <>
              <Image
                src={community.bannerUrl}
                alt={`${community.name} banner`}
                fill
                className="object-cover"
                priority
              />
              {/* Multi-layer gradient for dramatic effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/50 to-transparent" />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, ${community.primaryColor}30 0%, transparent 60%)` }}
              />
            </>
          ) : (
            /* No banner → gradient fill using primary color */
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${community.primaryColor}60 0%, ${community.primaryColor}20 50%, #0D0D0D 100%)`,
              }}
            >
              <div className="absolute inset-0 grid-pattern opacity-15" />
            </div>
          )}
        </div>

        {/* ── Floating hero card — overlaps banner bottom ── */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-20 md:-mt-28 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">

              {/* Logo — sits over the banner overlap */}
              <div className="relative flex-shrink-0">
                {community.logoUrl ? (
                  <Image
                    src={community.logoUrl}
                    alt={community.name}
                    width={112}
                    height={112}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-[#0D0D0D] shadow-2xl"
                  />
                ) : (
                  <div
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-4xl font-bold text-white border-4 border-[#0D0D0D] shadow-2xl"
                    style={{ backgroundColor: community.primaryColor }}
                  >
                    {community.name.charAt(0)}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#0D0D0D] shadow" />
              </div>

              {/* Name + meta */}
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl md:text-4xl font-bold text-[#EEE6E4] leading-tight truncate">
                    {community.name}
                  </h1>
                  {influencer.isVerified && (
                    <BadgeCheck className="w-6 h-6 text-[#009CD9] flex-shrink-0" />
                  )}
                </div>
                {community.shortDescription && (
                  <p className="text-gray-400 text-sm md:text-base leading-snug max-w-xl">
                    {community.shortDescription}
                  </p>
                )}
              </div>
            </div>

            {/* ── Stats strip ── */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-gray-300">
                <Users className="w-4 h-4 text-[#009CD9]" />
                <span className="font-semibold text-[#EEE6E4]">{community.memberCount.toLocaleString("pt-BR")}</span>
                <span className="text-gray-500">membros</span>
              </div>
              <div className="w-px h-4 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-gray-300">
                <BookOpen className="w-4 h-4 text-[#009CD9]" />
                <span className="font-semibold text-[#EEE6E4]">{community._count.contentModules}</span>
                <span className="text-gray-500">módulos</span>
              </div>
              <div className="w-px h-4 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-gray-300">
                <Video className="w-4 h-4 text-red-400" />
                <span className="font-semibold text-[#EEE6E4]">{community._count.liveSessions}</span>
                <span className="text-gray-500">lives</span>
              </div>
              <div className="w-px h-4 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium"
                  style={{ backgroundColor: healthColors.bg, borderColor: healthColors.border, color: healthColors.text }}
                >
                  {influencerHealthEmoji} Comunidade {influencerHealth}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BODY — 2-column layout
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="container mx-auto px-4 pt-10 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── LEFT: Main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            {community.description && (
              <section className="bg-white/[0.03] border border-white/8 rounded-2xl p-7">
                <h2 className="text-lg font-bold text-[#EEE6E4] mb-3">Sobre a comunidade</h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">
                  {community.description}
                </p>
              </section>
            )}

            {/* Tags */}
            {(community.tags as string[]).length > 0 && (
              <section className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Tópicos</h2>
                <div className="flex flex-wrap gap-2">
                  {(community.tags as string[]).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                      style={{ backgroundColor: `${community.primaryColor}18`, color: community.primaryColor }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Modules */}
            {hasModules && (
              <section className="bg-white/[0.03] border border-white/8 rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${community.primaryColor}20` }}>
                    <BookOpen className="w-4 h-4" style={{ color: community.primaryColor }} />
                  </div>
                  <h2 className="text-lg font-bold text-[#EEE6E4]">O que você vai aprender</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {community.contentModules.map((module, idx) => (
                    <div
                      key={module.id}
                      className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/8 rounded-xl hover:border-white/15 transition-all group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${community.primaryColor}25`, color: community.primaryColor }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#EEE6E4] leading-snug group-hover:text-white transition-colors">
                          {module.title}
                        </p>
                        {module.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{module.description}</p>
                        )}
                        <p className="text-[11px] text-gray-600 mt-1.5 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {module._count.lessons} {module._count.lessons === 1 ? "aula" : "aulas"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Influencer — Mentor card */}
            <section className="relative bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
              {/* Background glow */}
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: community.primaryColor }}
              />
              <div className="relative p-7">
                <h2 className="text-lg font-bold text-[#EEE6E4] mb-5">Seu mentor</h2>
                <div className="flex items-start gap-5">
                  {influencer.user.avatarUrl ? (
                    <div className="relative flex-shrink-0">
                      <Image
                        src={influencer.user.avatarUrl}
                        alt={hostName}
                        width={72}
                        height={72}
                        className="w-[72px] h-[72px] rounded-2xl object-cover border border-white/10 shadow-xl"
                      />
                      {influencer.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#009CD9] rounded-full flex items-center justify-center border-2 border-[#0D0D0D]">
                          <BadgeCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[#EEE6E4] text-2xl font-bold flex-shrink-0 border border-white/10 shadow-xl"
                      style={{ backgroundColor: community.primaryColor }}
                    >
                      {hostName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-bold text-[#EEE6E4] text-base">{hostName}</p>
                      <span
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium"
                        style={{ backgroundColor: healthColors.bg, borderColor: healthColors.border, color: healthColors.text }}
                      >
                        {influencerHealthEmoji} {influencerHealth}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{influencer.displayName}</p>
                    {influencer.bio && (
                      <p className="text-sm text-gray-400 leading-relaxed">{influencer.bio}</p>
                    )}
                  </div>
                </div>

                {/* Influencer stats */}
                <div className="mt-5 pt-5 border-t border-white/8 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-[#EEE6E4]">
                      {community.memberCount.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Membros</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#EEE6E4]">{community._count.contentModules}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Módulos</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#EEE6E4]">{community._count.liveSessions}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Lives</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Rules */}
            {community.rules && (
              <section className="bg-white/[0.03] border border-white/8 rounded-2xl p-7">
                <h2 className="text-lg font-bold text-[#EEE6E4] mb-4">Regras da comunidade</h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">{community.rules}</p>
              </section>
            )}

            {/* Testimonials */}
            {hasTestimonials && (
              <section>
                <h2 className="text-lg font-bold text-[#EEE6E4] mb-4 px-1">Depoimentos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {community.testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex flex-col gap-3 hover:border-white/15 transition-all"
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
              <section className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-7 pt-7 pb-4">
                  <h2 className="text-lg font-bold text-[#EEE6E4]">Perguntas frequentes</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {community.faqs.map((faq) => (
                    <details key={faq.id} className="group px-7 py-0">
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

          {/* ── RIGHT: Sticky sidebar ── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Join CTA card */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10">
                {/* Banner inside card */}
                {community.bannerUrl ? (
                  <div className="relative h-28 overflow-hidden">
                    <Image src={community.bannerUrl} alt="" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#161616]" />
                    {/* Logo overlay */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                      {community.logoUrl ? (
                        <Image
                          src={community.logoUrl}
                          alt={community.name}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-xl object-cover border-2 border-[#161616] shadow-lg"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white border-2 border-[#161616]"
                          style={{ backgroundColor: community.primaryColor }}
                        >
                          {community.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-bold text-[#EEE6E4] drop-shadow">{community.name}</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="h-20 flex items-center px-5"
                    style={{ background: `linear-gradient(135deg, ${community.primaryColor}50, ${community.primaryColor}20)` }}
                  >
                    <span className="text-base font-bold text-[#EEE6E4]">{community.name}</span>
                  </div>
                )}

                {/* Card content */}
                <div className="bg-[#161616] p-5">
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
                </div>
              </div>

              {/* What's included */}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Incluso na assinatura
                </p>
                <ul className="space-y-2.5">
                  {[
                    { icon: Users,         text: "Acesso a todas as comunidades" },
                    { icon: BookOpen,      text: "Cursos e módulos completos" },
                    { icon: Video,         text: "Lives e streaming ao vivo" },
                    { icon: MessageCircle, text: "Chat e fórum da comunidade" },
                    { icon: Trophy,        text: "Leaderboard e certificados" },
                    { icon: Zap,           text: "IA Mecânica inclusa" },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social proof pill */}
              {community.memberCount > 0 && (
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-[#0D0D0D] flex items-center justify-center text-[10px] font-bold text-[#EEE6E4]"
                        style={{ backgroundColor: `${community.primaryColor}${60 + i * 10}` }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-[#EEE6E4]">
                      {community.memberCount.toLocaleString("pt-BR")}
                    </span>{" "}
                    membros já fazem parte
                  </p>
                </div>
              )}

              {/* Lock notice */}
              <div className="flex items-start gap-2.5 px-1">
                <Lock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Uma assinatura Detailer&apos;HUB dá acesso a esta e a todas as outras comunidades da plataforma.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className="border-t border-white/8 py-8 bg-[#0D0D0D]">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <LogoType height={18} variant="light" />
          </Link>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Detailer&apos;HUB — O maior ecossistema de estética automotiva do Brasil
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
            <Link href="/contato" className="hover:text-gray-400 transition-colors">Contato</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
