"use client";

// =============================================================================
// Community Feed Overview — lists all spaces as cards for a community
// Fetches community by matching slug from /api/communities/mine (auth user)
// Then fetches spaces for that community
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Hash, ArrowRight, Layers, AlertCircle } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

interface Space {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  type?: string | null;
  description?: string | null;
  isDefault: boolean;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor: string;
}

const SPACE_TYPE_LABELS: Record<string, string> = {
  DISCUSSION:   "Discussão",
  ANNOUNCEMENT: "Avisos",
  QA:           "Perguntas",
  SHOWCASE:     "Showcase",
};

const SPACE_TYPE_COLORS: Record<string, string> = {
  DISCUSSION:   "bg-[#006079]/10 text-[#009CD9] border-[#006079]/20",
  ANNOUNCEMENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  QA:           "bg-[#009CD9]/10 text-[#009CD9] border-[#009CD9]/20",
  SHOWCASE:     "bg-green-500/10 text-green-400 border-green-500/20",
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SpaceCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/10 rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-4 bg-white/10 rounded w-28" />
          <div className="h-3 bg-white/10 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-white/10 rounded w-full" />
      <div className="h-3 bg-white/10 rounded w-4/5 mt-1" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunityFeedPage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/feed`);
          return;
        }

        // Single round-trip: community + spaces resolved server-side by slug
        const res = await fetch(`/api/communities/${communitySlug}/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = res.ok ? await res.json() : { success: false };

        if (!json.success) {
          setError("Comunidade não encontrada ou você não tem acesso.");
          setLoading(false);
          return;
        }

        setCommunity(json.data.community);
        setSpaces(json.data.spaces ?? []);
      } catch {
        setError("Erro de conexão. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [communitySlug, router]);

  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-[#EEE6E4]">
        <div className="h-8 bg-white/10 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-white/10 rounded w-64 animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 py-20">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="text-xs text-gray-400 hover:text-[#EEE6E4] transition-colors"
          >
            &larr; Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[#EEE6E4]">
      {/* Body */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#EEE6E4] mb-1">Canais</h2>
          <p className="text-gray-400 text-sm">
            Escolha um canal para ver e participar das discussões.
          </p>
        </div>

        {spaces.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <Layers className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum canal criado ainda.</p>
            <p className="text-gray-300 text-xs mt-1">
              O administrador da comunidade ainda não criou canais.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spaces.map((space) => {
              const typeLabel = space.type
                ? (SPACE_TYPE_LABELS[space.type] ?? space.type)
                : null;
              const typeColor = space.type
                ? (SPACE_TYPE_COLORS[space.type] ?? "bg-white/5 text-gray-400 border-white/10")
                : null;

              return (
                <Link
                  key={space.id}
                  href={`/community/${communitySlug}/feed/${space.slug}`}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-[#006079]/40 transition-all group block"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                      {space.icon ?? <Hash className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-300 group-hover:text-[#EEE6E4] transition-colors truncate">
                          {space.name}
                        </span>
                        {space.isDefault && (
                          <span className="text-[10px] bg-[#006079]/15 text-[#009CD9] border border-[#006079]/20 rounded px-1.5 py-0.5">
                            Padrão
                          </span>
                        )}
                      </div>
                      {typeLabel && typeColor && (
                        <span
                          className={`inline-block text-[10px] border rounded px-1.5 py-0.5 mt-1 ${typeColor}`}
                        >
                          {typeLabel}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#009CD9] transition-colors flex-shrink-0 mt-0.5" />
                  </div>

                  {space.description && (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                      {space.description}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
