"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, CheckCircle } from "lucide-react";

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
  const href = hasPlatform ? `/community/${community.slug}/feed` : "/dashboard/assinar";
  const locked = !hasPlatform;

  return (
    <Link
      href={href}
      className={`rounded-xl overflow-hidden border border-white/10 bg-[#0D0D0D] transition-all hover:border-[#009CD9]/30 hover:shadow-lg hover:shadow-[#009CD9]/5 block ${locked ? "opacity-60" : ""}`}
    >
      {/* Banner — 56px mobile / 140px desktop */}
      <div className="relative h-[56px] sm:h-[140px] overflow-hidden">
        {community.bannerUrl ? (
          <Image
            src={community.bannerUrl}
            alt={community.name}
            fill
            className="object-cover object-center"
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${community.primaryColor} 0%, ${community.primaryColor}66 100%)`,
              }}
            />
          </>
        )}

        {/* Member badge — hidden on mobile (56px too small) */}
        {community.isMember && (
          <div className="hidden sm:flex absolute top-2 left-2 items-center gap-1 bg-[#009CD9]/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Participando
          </div>
        )}

        {/* Member count badge — desktop only */}
        <div className="hidden sm:flex absolute top-2 right-2 items-center gap-1 bg-black/50 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full">
          <Users className="w-3 h-3" />
          <span>{community.memberCount.toLocaleString("pt-BR")}</span>
        </div>

        {/* Brand color gradient at bottom — desktop only */}
        <div
          className="hidden sm:block absolute bottom-0 left-0 right-0 h-12"
          style={{
            background: `linear-gradient(to top, ${community.primaryColor}CC, transparent)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Influencer info */}
        {community.influencer && (
          <div className="flex items-center gap-1.5">
            {community.influencer.user?.avatarUrl ? (
              <Image
                src={community.influencer.user.avatarUrl}
                alt={community.influencer.displayName}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ backgroundColor: community.primaryColor }}
              >
                {community.influencer.displayName[0]}
              </div>
            )}
            <span className="text-[10px] text-gray-500 truncate">
              {community.influencer.displayName}
            </span>
            {/* Mobile: member badge inline */}
            {community.isMember && (
              <span className="sm:hidden ml-auto text-[9px] font-semibold text-[#009CD9] flex-shrink-0">
                Participando
              </span>
            )}
          </div>
        )}

        {/* Community name */}
        <h3 className="font-semibold text-[#EEE6E4] text-xs leading-tight truncate">
          {community.name}
        </h3>

        {/* Short description — desktop only */}
        {community.shortDescription && (
          <p className="hidden sm:block text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
            {community.shortDescription}
          </p>
        )}

        {/* CTA */}
        <div
          className={`text-center text-xs font-semibold py-1.5 rounded-lg ${
            community.isMember
              ? "bg-[#006079]/20 text-[#009CD9]"
              : "bg-white/5 text-gray-400"
          }`}
        >
          {community.isMember ? "Acessar →" : "Participar →"}
        </div>
      </div>
    </Link>
  );
}
