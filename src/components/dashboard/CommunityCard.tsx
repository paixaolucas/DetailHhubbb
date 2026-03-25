"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, CheckCircle, Sparkles, Flame } from "lucide-react";

export interface CommunityCardData {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  memberCount: number;
  isMember: boolean;
  isNew?: boolean;
  engagementCount?: number;
  influencer: {
    displayName: string;
    user: { firstName: string; lastName: string | null; avatarUrl: string | null } | null;
  } | null;
}

interface Props {
  community: CommunityCardData;
  hasPlatform: boolean | null;
}

export function CommunityCard({ community, hasPlatform }: Props) {
  // null = membership ainda carregando — não navegar para evitar redirect falso para pagamento
  const href =
    hasPlatform === true
      ? `/community/${community.slug}`
      : hasPlatform === false
        ? "/dashboard/assinar"
        : null;

  const locked = hasPlatform !== true;
  const isLoading = hasPlatform === null;

  const cardClass = [
    "rounded-2xl overflow-hidden border border-white/10 bg-[#0D0D0D]",
    "transition-all hover:border-[#009CD9]/40 hover:shadow-xl hover:shadow-[#009CD9]/5 hover:-translate-y-0.5 block",
    locked ? "opacity-60" : "",
    isLoading ? "cursor-wait pointer-events-none" : "",
  ].join(" ");

  const inner = (
    <>
      {/* Banner */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {community.bannerUrl ? (
          <Image
            src={community.bannerUrl}
            alt={community.name}
            fill
            className="object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${community.primaryColor} 0%, ${community.primaryColor}55 100%)`,
            }}
          />
        )}

        {/* Badges — topo esquerdo */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {community.isMember && (
            <div className="flex items-center gap-1 bg-[#009CD9]/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Participando
            </div>
          )}
          {community.isNew && !community.isMember && (
            <div className="flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              Nova
            </div>
          )}
          {!community.isNew && !community.isMember && (community.engagementCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <Flame className="w-3 h-3" />
              Ativa pra você
            </div>
          )}
        </div>

        {/* Member count */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white/90 text-xs px-2.5 py-1 rounded-full">
          <Users className="w-3.5 h-3.5" />
          <span>{community.memberCount.toLocaleString("pt-BR")}</span>
        </div>

        {/* Bottom gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: `linear-gradient(to top, ${community.primaryColor}DD, transparent)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Influencer info */}
        {community.influencer && (
          <div className="flex items-center gap-2">
            {community.influencer.user?.avatarUrl ? (
              <Image
                src={community.influencer.user.avatarUrl}
                alt={community.influencer.displayName}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: community.primaryColor }}
              >
                {community.influencer.displayName[0]}
              </div>
            )}
            <span className="text-xs text-gray-400 truncate">
              {community.influencer.displayName}
            </span>
          </div>
        )}

        {/* Community name */}
        <h3 className="font-bold text-[#EEE6E4] text-base leading-tight line-clamp-2">
          {community.name}
        </h3>

        {/* Short description */}
        {community.shortDescription && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {community.shortDescription}
          </p>
        )}

        {/* CTA */}
        <div
          className={`text-center text-sm font-semibold py-2 rounded-xl mt-1 ${
            community.isMember
              ? "bg-[#006079]/20 text-[#009CD9]"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          {community.isMember ? "Acessar comunidade →" : "Participar →"}
        </div>
      </div>
    </>
  );

  if (!href) {
    return <div className={cardClass}>{inner}</div>;
  }

  return (
    <Link href={href} className={cardClass}>
      {inner}
    </Link>
  );
}
