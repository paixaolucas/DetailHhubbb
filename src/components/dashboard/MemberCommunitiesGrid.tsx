"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { CommunityCardData } from "./CommunityCard";

interface GridCommunity extends CommunityCardData {
  newContentCount?: number;
  hasLiveToday?: boolean;
}

function CommunityGridCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#0D0D0D] border border-white/10 animate-pulse overflow-hidden">
      <div className="h-36 bg-white/10" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-7 bg-white/10 rounded-xl mt-3" />
      </div>
    </div>
  );
}

function CommunityGridCard({
  community,
  hasPlatform,
}: {
  community: GridCommunity;
  hasPlatform: boolean | null;
}) {
  const href =
    hasPlatform === true
      ? `/community/${community.slug}/feed`
      : hasPlatform === false
        ? "/dashboard/assinar"
        : null;

  const isLoading = hasPlatform === null;

  const influencerName = community.influencer
    ? community.influencer.displayName ||
      `${community.influencer.user?.firstName ?? ""} ${community.influencer.user?.lastName ?? ""}`.trim()
    : null;

  const inner = (
    <>
      {/* Banner */}
      <div className="relative h-36 overflow-hidden">
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

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Activity badges — top left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {community.hasLiveToday ? (
            <span className="bg-red-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Ao vivo hoje
            </span>
          ) : community.isMember ? (
            <span className="bg-[#009CD9]/80 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Participando
            </span>
          ) : community.isNew ? (
            <span className="bg-emerald-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Nova
            </span>
          ) : null}
        </div>

        {/* New content badge — top right */}
        {community.newContentCount != null && community.newContentCount > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-amber-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              {community.newContentCount} nova{community.newContentCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Logo overlapping banner */}
        <div className="absolute -bottom-5 left-4 z-10">
          {community.logoUrl ? (
            <Image
              src={community.logoUrl}
              alt={community.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-[3px] border-[#0D0D0D]"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-[3px] border-[#0D0D0D] flex-shrink-0"
              style={{ backgroundColor: community.primaryColor }}
            >
              {community.name[0]}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-7">
        <p className="font-bold text-[#EEE6E4] text-sm leading-tight truncate">
          {community.name}
        </p>
        {influencerName && (
          <p className="text-[10px] text-gray-500 mt-0.5">
            by {influencerName}
          </p>
        )}
        <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-1">
          <Users className="w-3 h-3" />
          {community.memberCount.toLocaleString("pt-BR")} membros
        </p>

        {/* CTA */}
        <div
          className={`text-center text-xs font-semibold py-1.5 rounded-xl mt-3 transition-colors ${
            community.isMember
              ? "bg-[#006079]/20 text-[#009CD9]"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          {community.isMember ? "Acessar →" : "Ver comunidade"}
        </div>
      </div>
    </>
  );

  const cardClass =
    "rounded-2xl overflow-hidden bg-[#0D0D0D] border border-white/10 hover:border-[#009CD9]/40 hover:shadow-lg transition-all block" +
    (isLoading ? " cursor-wait pointer-events-none" : "");

  if (!href) {
    return <div className={cardClass}>{inner}</div>;
  }

  return (
    <Link href={href} className={cardClass}>
      {inner}
    </Link>
  );
}

export function MemberCommunitiesGrid({ hasPlatform }: { hasPlatform: boolean | null }) {
  const [communities, setCommunities] = useState<GridCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<unknown>("/api/communities?view=dashboard")
      .then((d) => {
        if (d.success) {
          const raw = d as unknown as { communities?: GridCommunity[] };
          const list = raw.communities ?? [];
          // Put isMember communities first
          list.sort((a, b) => (b.isMember ? 1 : 0) - (a.isMember ? 1 : 0));
          setCommunities(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = communities.slice(0, 6);

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#EEE6E4] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#009CD9]" /> Comunidades
        </h2>
        {!loading && communities.length > 0 && (
          <Link
            href="/dashboard/communities"
            className="text-sm text-[#009CD9] font-medium hover:underline"
          >
            Ver todas →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CommunityGridCardSkeleton key={i} />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma comunidade disponível ainda.</p>
          <Link
            href="/dashboard/communities"
            className="text-sm text-[#009CD9] hover:underline mt-2 inline-block"
          >
            Explorar comunidades →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayed.map((community) => (
              <CommunityGridCard
                key={community.id}
                community={community}
                hasPlatform={hasPlatform}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3 text-right">
            Ordem personalizada · novas comunidades mudam de posição diariamente
          </p>
        </>
      )}
    </div>
  );
}
