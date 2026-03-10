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
  DISCUSSION:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ANNOUNCEMENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  QA:           "bg-purple-500/10 text-purple-400 border-purple-500/20",
  SHOWCASE:     "bg-green-500/10 text-green-400 border-green-500/20",
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SpaceCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-50 rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-50 rounded w-28" />
          <div className="h-3 bg-gray-50 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-gray-50 rounded w-full" />
      <div className="h-3 bg-gray-50 rounded w-4/5 mt-1" />
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
        const token = localStorage.getItem("detailhub_access_token");

        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/feed`);
          return;
        }

        // 1. Fetch user's owned communities (influencer) and find by slug
        const mineRes = await fetch("/api/communities/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mineJson = await mineRes.json();

        let found: Community | null = null;

        if (mineJson.success && Array.isArray(mineJson.data)) {
          found = mineJson.data.find(
            (c: Community) => c.slug === communitySlug
          ) ?? null;
        }

        // 2. Fallback: check active member memberships
        if (!found) {
          const [memberRes, pubRes] = await Promise.all([
            fetch("/api/memberships/me", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/communities", { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const memberJson = await memberRes.json();
          const pubJson = await pubRes.json();

          if (memberJson.success && pubJson.success) {
            const memberIds: string[] = memberJson.data ?? [];
            const allCommunities: Community[] = pubJson.data ?? [];
            const candidate = allCommunities.find((c: Community) => c.slug === communitySlug);
            if (candidate && memberIds.includes(candidate.id)) {
              found = candidate;
            }
          }
        }

        if (!found) {
          setError("Comunidade não encontrada ou você não tem acesso.");
          setLoading(false);
          return;
        }

        setCommunity(found);

        // 3. Fetch spaces for this community
        const spacesRes = await fetch(
          `/api/communities/${found.id}/spaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const spacesJson = await spacesRes.json();

        if (spacesJson.success) {
          const spaceList: Space[] = spacesJson.data ?? [];
          setSpaces(spaceList);
        }
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
      <div className="max-w-4xl mx-auto px-4 py-10 text-gray-900">
        <div className="h-8 bg-gray-50 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-gray-50 rounded w-64 animate-pulse mb-8" />
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
            className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            ← Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-900">
      {/* Body */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Canais</h2>
          <p className="text-gray-500 text-sm">
            Escolha um canal para ver e participar das discussões.
          </p>
        </div>

        {spaces.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum canal criado ainda.</p>
            <p className="text-gray-700 text-xs mt-1">
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
                ? (SPACE_TYPE_COLORS[space.type] ?? "bg-gray-50 text-gray-400 border-gray-200")
                : null;

              return (
                <Link
                  key={space.id}
                  href={`/community/${communitySlug}/feed/${space.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:bg-gray-100 hover:border-violet-200 transition-all group block"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-xl">
                      {space.icon ?? <Hash className="w-5 h-5 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                          {space.name}
                        </span>
                        {space.isDefault && (
                          <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded px-1.5 py-0.5">
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
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-0.5" />
                  </div>

                  {space.description && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
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
