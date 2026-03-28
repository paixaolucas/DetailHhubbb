"use client";

// =============================================================================
// CommunityHeader — full-width hero section with banner, logo, influencer info,
// member count and opt-in button. Used across community pages.
// =============================================================================

import Image from "next/image";
import { Users, UserPlus, UserCheck, Loader2 } from "lucide-react";

interface CommunityHeaderProps {
  community: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    primaryColor: string;
    memberCount?: number;
    shortDescription?: string | null;
  };
  influencer?: {
    displayName?: string | null;
    user?: { firstName: string; lastName: string; avatarUrl?: string | null } | null;
  } | null;
  optedIn: boolean | null;
  onOptIn: () => void;
  optInLoading?: boolean;
}

function resolveInfluencerName(
  influencer: CommunityHeaderProps["influencer"]
): string | null {
  if (!influencer) return null;
  if (influencer.displayName) return influencer.displayName;
  if (influencer.user) {
    return `${influencer.user.firstName} ${influencer.user.lastName}`.trim();
  }
  return null;
}

export function CommunityHeader({
  community,
  influencer,
  optedIn,
  onOptIn,
  optInLoading = false,
}: CommunityHeaderProps) {
  const influencerName = resolveInfluencerName(influencer);
  const primaryColor = community.primaryColor || "#006079";

  return (
    <div className="flex-shrink-0">
      {/* Banner */}
      <div className="h-28 md:h-40 relative overflow-hidden bg-[#111]">
        {community.bannerUrl ? (
          <>
            <Image
              src={community.bannerUrl}
              alt={community.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}30 0%, ${primaryColor}10 50%, #111 100%)`,
            }}
          />
        )}
      </div>

      {/* Info bar */}
      <div className="bg-[#151515] border-b border-white/8 px-4 md:px-6 py-3">
        <div className="flex items-end gap-4">
          {/* Logo — pulls up to overlap banner */}
          <div className="-mt-10 flex-shrink-0">
            {community.logoUrl ? (
              <Image
                src={community.logoUrl}
                alt={community.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-2xl object-cover border-4 border-[#151515] shadow-xl"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-[#EEE6E4] border-4 border-[#151515] shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {community.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name + influencer + member count */}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-xl font-bold text-[#EEE6E4] truncate leading-tight">
              {community.name}
            </h1>
            {influencerName && (
              <p className="text-xs text-gray-400 mt-0.5">
                por{" "}
                <span style={{ color: primaryColor }} className="font-medium">
                  {influencerName}
                </span>
              </p>
            )}
            {community.memberCount != null && (
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Users className="w-3 h-3" />
                {community.memberCount.toLocaleString("pt-BR")} membros
              </p>
            )}
          </div>

          {/* Opt-in button */}
          {optedIn !== null && (
            <div className="flex-shrink-0 pb-1">
              <button
                onClick={onOptIn}
                disabled={optInLoading}
                className={[
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  optedIn
                    ? "bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/30"
                    : "text-white border border-transparent hover:opacity-90",
                ].join(" ")}
                style={!optedIn ? { backgroundColor: primaryColor } : {}}
                aria-label={optedIn ? "Deixar de seguir comunidade" : "Seguir comunidade"}
              >
                {optInLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : optedIn ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Seguindo</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Seguir</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommunityHeader;
