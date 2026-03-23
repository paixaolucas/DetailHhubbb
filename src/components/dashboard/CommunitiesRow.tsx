"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { CommunityCard, type CommunityCardData } from "./CommunityCard";

function CommunitySkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 animate-pulse">
      <div className="h-[56px] sm:h-[140px] bg-white/10" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10" />
          <div className="h-2.5 bg-white/10 rounded w-24" />
        </div>
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-7 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

export function CommunitiesRow({ hasPlatform }: { hasPlatform: boolean | null }) {
  const [communities, setCommunities] = useState<CommunityCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<unknown>("/api/communities?view=dashboard")
      .then((d) => {
        if (d.success) {
          const raw = d as unknown as { communities?: CommunityCardData[] };
          setCommunities(raw.communities ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && communities.length === 0) return null;

  const displayed = communities.slice(0, 6);
  const hasMore = communities.length > 6;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#EEE6E4] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#009CD9]" /> Comunidades
        </h2>
        {hasMore && !loading && (
          <Link
            href="/dashboard/communities"
            className="text-xs text-[#009CD9] font-medium hover:underline"
          >
            Ver todas →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {loading
          ? [1, 2, 3].map((i) => <CommunitySkeleton key={i} />)
          : displayed.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                hasPlatform={hasPlatform}
              />
            ))}
      </div>
    </div>
  );
}
