"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { CommunityCard, type CommunityCardData } from "./CommunityCard";

function CommunitySkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 animate-pulse">
      <div className="aspect-[16/9] bg-white/10" />
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="h-3 bg-white/10 rounded w-24" />
        </div>
        <div className="h-5 bg-white/10 rounded w-3/4" />
        <div className="h-3.5 bg-white/10 rounded w-full" />
        <div className="h-3.5 bg-white/10 rounded w-2/3" />
        <div className="h-9 bg-white/10 rounded-xl" />
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

  const displayed = communities.slice(0, 6);
  const hasMore = communities.length > 6;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-[#EEE6E4] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#009CD9]" /> Comunidades
        </h2>
        {hasMore && !loading && (
          <Link
            href="/dashboard/communities"
            className="text-sm text-[#009CD9] font-medium hover:underline"
          >
            Ver todas →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[1, 2, 3].map((i) => <CommunitySkeleton key={i} />)}
        </div>
      ) : communities.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma comunidade disponível ainda.</p>
          <Link href="/dashboard/communities" className="text-sm text-[#009CD9] hover:underline mt-2 inline-block">
            Explorar comunidades →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {displayed.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                hasPlatform={hasPlatform}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4 text-right">
            Ordem personalizada · novas comunidades mudam de posição diariamente
          </p>
        </>
      )}
    </div>
  );
}
